import { Asset, BASE_FEE, Horizon, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { HORIZON_URL, TOKEN_ISSUERS, type SignTx } from "./gift";
import { getAsset } from "../data/assets";
import { NETWORK } from "../config/network";

/**
 * Mix: spend USDC and receive a blend of XLM, USDC and EURC, in ONE transaction.
 *
 * Every leg runs on Stellar's built-in exchange (a "path payment"), and the legs are all in one
 * transaction, so either every leg happens or none does. The result can be sent to the buyer's own
 * wallet or to any other Stellar address. No contract and no server is involved.
 */

export type MixToken = "usdc" | "xlm" | "eurc";
export interface MixLeg {
  token: MixToken;
  /** Share of the spend, 0 to 100. */
  percent: number;
}

export const MIX_TOKENS: MixToken[] = ["usdc", "xlm", "eurc"];
/** Lumecard's fee on a Mix, in basis points of the USDC spent (50 = 0.5%). Paid in the same transaction. */
export const MIX_FEE_BPS = 50;
/** Where the fee goes: Lumecard's fee wallet (VITE_FEE_ADDRESS). */
export const MIX_FEE_TO = NETWORK.feeAddress;
export const MIN_MIX_USDC = 1;
export const DEFAULT_SLIPPAGE = 0.01;

export const MIX_PRESETS: { id: string; name: string; note: string; legs: MixLeg[] }[] = [
  { id: "balanced", name: "Balanced", note: "A little of everything", legs: [{ token: "usdc", percent: 50 }, { token: "xlm", percent: 30 }, { token: "eurc", percent: 20 }] },
  { id: "euro", name: "Euro saver", note: "Mostly euros", legs: [{ token: "eurc", percent: 70 }, { token: "usdc", percent: 20 }, { token: "xlm", percent: 10 }] },
  { id: "stellar", name: "Stellar heavy", note: "Mostly XLM", legs: [{ token: "xlm", percent: 70 }, { token: "usdc", percent: 30 }] },
  { id: "dollar", name: "Dollar safe", note: "Stays in dollars", legs: [{ token: "usdc", percent: 90 }, { token: "xlm", percent: 10 }] },
];

const USDC = new Asset("USDC", TOKEN_ISSUERS.usdc);
const assetOf = (t: MixToken): Asset => (t === "xlm" ? Asset.native() : new Asset(t.toUpperCase(), TOKEN_ISSUERS[t]));
const toStroops = (n: number) => Math.round(n * 1e7);
const fmt7 = (stroops: number) => (stroops / 1e7).toFixed(7);

export interface QuoteLeg {
  token: MixToken;
  /** USDC spent on this leg. */
  spend: number;
  /** Expected amount received. */
  receive: number;
  /** The least the transaction will accept. */
  minReceive: number;
  path: Asset[];
}

export interface MixQuote {
  total: number;
  fee: number;
  legs: QuoteLeg[];
}

/** Splits an amount over the legs without losing a stroop to rounding. */
function split(totalNet: number, legs: MixLeg[]): number[] {
  const stroops = toStroops(totalNet);
  const out = legs.map((l) => Math.floor((stroops * l.percent) / 100));
  const rest = stroops - out.reduce((a, b) => a + b, 0);
  if (out.length) out[out.length - 1] += rest; // the last leg takes the leftover
  return out;
}

export function validateLegs(legs: MixLeg[]): string | undefined {
  const active = legs.filter((l) => l.percent > 0);
  if (active.length === 0) return "Pick at least one token.";
  const sum = active.reduce((a, l) => a + l.percent, 0);
  if (Math.abs(sum - 100) > 0.001) return `The shares add up to ${Math.round(sum)}%. They need to add up to 100%.`;
  return undefined;
}

export function mixFee(totalUsdc: number): number {
  return Math.floor((toStroops(totalUsdc) * MIX_FEE_BPS) / 10_000) / 1e7;
}

type PathResult = { destination_amount: string; path: { asset_type: string; asset_code?: string; asset_issuer?: string }[] };

async function bestPath(server: Horizon.Server, sendStroops: number, dest: Asset): Promise<PathResult | undefined> {
  const res = await server.strictSendPaths(USDC, fmt7(sendStroops), [dest]).call();
  let best: PathResult | undefined;
  for (const r of res.records) if (!best || Number(r.destination_amount) > Number(best.destination_amount)) best = r;
  return best && Number(best.destination_amount) > 0 ? best : undefined;
}

/** How far a stable token may stray from its expected price before a Mix is refused. */
const STABLE_BAND = 0.2;

/** The most a trade may fall short of the price for a small trade, before it is refused. */
export const MAX_PRICE_IMPACT = 0.05;

/** Asks the network what each leg would return right now. */
export async function quoteMix(opts: { totalUsdc: number; legs: MixLeg[]; slippage?: number; minUsdc?: number }): Promise<MixQuote> {
  const slippage = opts.slippage ?? DEFAULT_SLIPPAGE;
  const legs = opts.legs.filter((l) => l.percent > 0);
  const problem = validateLegs(legs);
  if (problem) throw new Error(problem);
  const minUsdc = opts.minUsdc ?? MIN_MIX_USDC;
  if (!(opts.totalUsdc >= minUsdc)) throw new Error(`The smallest Mix is ${minUsdc} USDC.`);

  const fee = mixFee(opts.totalUsdc);
  const net = opts.totalUsdc - fee;
  const shares = split(net, legs);
  const server = new Horizon.Server(HORIZON_URL);

  const out: QuoteLeg[] = [];
  for (let i = 0; i < legs.length; i++) {
    const token = legs[i].token;
    const spend = shares[i] / 1e7;
    if (token === "usdc") {
      out.push({ token, spend, receive: spend, minReceive: spend, path: [] });
      continue;
    }
    const dest = assetOf(token);
    let best: PathResult | undefined;
    let small: PathResult | undefined;
    let refStroops = 0;
    try {
      best = await bestPath(server, shares[i], dest);
      // A smaller trade shows the going price. A big trade at a much worse rate means there is too little trading.
      // Only trades of 2 USDC or more are checked, and the comparison trade is a tenth of the size and at least
      // 0.2 USDC: tiny trades can hit stray orders and show a price that means nothing.
      refStroops = Math.max(Math.floor(shares[i] / 10), toStroops(0.2));
      if (best && shares[i] >= toStroops(2) && refStroops < shares[i]) small = await bestPath(server, refStroops, dest);
    } catch {
      throw new Error("Couldn't reach the network. Try again.");
    }
    if (!best) {
      throw new Error(`There is no price for ${token.toUpperCase()} right now, so it can't be part of a Mix.`);
    }
    if (small) {
      const rateBig = Number(best.destination_amount) / (shares[i] / 1e7);
      const rateSmall = Number(small.destination_amount) / (refStroops / 1e7);
      if (rateBig < rateSmall * (1 - MAX_PRICE_IMPACT)) {
        throw new Error(`There isn't enough trading in ${token.toUpperCase()} to buy that much at a fair price. Try a smaller amount or a different Mix.`);
      }
    }
    const receive = Number(best.destination_amount);
    // Euros trade close to a known price, so a result far from it means the market is broken or too thin.
    if (token === "eurc") {
      const fair = spend / getAsset("eurc")!.price;
      if (receive < fair * (1 - STABLE_BAND) || receive > fair * (1 + STABLE_BAND)) {
        throw new Error("EURC isn't trading at a fair price right now, so it can't be part of a Mix. Try again later or leave it out.");
      }
    }
    out.push({
      token,
      spend,
      receive,
      minReceive: Math.floor(receive * (1 - slippage) * 1e7) / 1e7,
      path: best.path.map((p) => (p.asset_type === "native" ? Asset.native() : new Asset(p.asset_code!, p.asset_issuer!))),
    });
  }
  return { total: opts.totalUsdc, fee, legs: out };
}

/** Pulls the useful part out of a Horizon rejection. */
function mixError(e: unknown): string {
  const codes = (e as { response?: { data?: { extras?: { result_codes?: { operations?: string[]; transaction?: string } } } } })?.response?.data
    ?.extras?.result_codes;
  const ops = codes?.operations ?? [];
  const has = (s: string) => ops.some((o) => o.includes(s));
  if (has("under_dest_min") || has("too_few_offers")) return "The price moved or there isn't enough to trade right now. Nothing was spent. Try again.";
  if (has("src_no_trust") || has("src_not_authorized")) return "Your wallet hasn't enabled USDC yet.";
  if (has("no_trust")) return "The receiving wallet hasn't enabled one of these tokens yet.";
  if (has("no_destination")) return "The receiving wallet isn't active yet.";
  if (has("underfunded")) return "Not enough USDC in your wallet.";
  if (has("low_reserve")) return "That would leave your wallet below the minimum XLM it must keep.";
  if (codes?.transaction === "tx_insufficient_balance") return "Not enough XLM left to pay the network fee.";
  if (codes?.transaction === "tx_bad_seq") return "Your wallet was busy. Try again.";
  const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  if (/declin|reject|cancel|denied|user/i.test(msg)) return "You cancelled in your wallet.";
  return msg || "The Mix failed.";
}

const hasLine = (balances: Horizon.HorizonApi.BalanceLine[], a: Asset) =>
  a.isNative() ||
  balances.some((b) => {
    const t = b as { asset_code?: string; asset_issuer?: string };
    return t.asset_code === a.code && t.asset_issuer === a.issuer;
  });

export interface RecipientCheck {
  exists: boolean;
  /** Tokens the recipient cannot receive yet. */
  missing: MixToken[];
}

/** For another address: does it exist, and can it hold every token in the Mix? */
export async function checkRecipient(address: string, tokens: MixToken[]): Promise<RecipientCheck> {
  const server = new Horizon.Server(HORIZON_URL);
  try {
    const acc = await server.loadAccount(address);
    return { exists: true, missing: tokens.filter((t) => !hasLine(acc.balances, assetOf(t))) };
  } catch (e) {
    if ((e as { response?: { status?: number } })?.response?.status === 404) return { exists: false, missing: tokens.filter((t) => t !== "xlm") };
    throw new Error("Couldn't reach the network. Try again.");
  }
}

export const isMixAddress = (s: string) => StrKey.isValidEd25519PublicKey(s.trim());

/** Builds, signs and sends the Mix. `recipient` is the buyer themselves or any other Stellar address. */
export async function buyMixOnChain(opts: { source: string; recipient: string; quote: MixQuote; sign: SignTx }): Promise<{ txHash: string }> {
  const recipient = opts.recipient.trim();
  if (!isMixAddress(recipient)) throw new Error("That doesn't look like a Stellar address. It starts with G and is 56 characters long.");
  const forSelf = recipient === opts.source;
  const tokens = opts.quote.legs.map((l) => l.token);

  const server = new Horizon.Server(HORIZON_URL);
  const source = await server.loadAccount(opts.source);
  if (!hasLine(source.balances, USDC)) throw new Error("Your wallet hasn't enabled USDC yet. Use Enable tokens on the dashboard first.");

  if (!forSelf) {
    const check = await checkRecipient(recipient, tokens);
    if (!check.exists) throw new Error("That wallet isn't active yet, so it can't receive a Mix. It needs some XLM first.");
    if (check.missing.length) {
      throw new Error(`That wallet hasn't enabled ${check.missing.map((t) => t.toUpperCase()).join(" and ")} yet, so it can't receive this Mix.`);
    }
  }

  const builder = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: NETWORK.passphrase });

  // Lumecard's fee, in USDC.
  if (opts.quote.fee > 0 && MIX_FEE_TO !== opts.source) {
    builder.addOperation(Operation.payment({ destination: MIX_FEE_TO, asset: USDC, amount: opts.quote.fee.toFixed(7) }));
  }

  // For yourself, opt in to any token you do not hold yet, in the same transaction.
  if (forSelf) {
    for (const t of new Set(tokens)) {
      const a = assetOf(t);
      if (!a.isNative() && !hasLine(source.balances, a)) builder.addOperation(Operation.changeTrust({ asset: a }));
    }
  }

  for (const leg of opts.quote.legs) {
    const sendAmount = leg.spend.toFixed(7);
    if (leg.token === "usdc") {
      builder.addOperation(Operation.payment({ destination: recipient, asset: USDC, amount: sendAmount }));
    } else {
      builder.addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset: USDC,
          sendAmount,
          destination: recipient,
          destAsset: assetOf(leg.token),
          destMin: leg.minReceive.toFixed(7),
          path: leg.path,
        }),
      );
    }
  }

  const tx = builder.setTimeout(120).build();
  try {
    const signed = TransactionBuilder.fromXDR(await opts.sign(tx.toXDR()), NETWORK.passphrase);
    const res = await server.submitTransaction(signed);
    return { txHash: res.hash };
  } catch (e) {
    throw new Error(mixError(e));
  }
}
