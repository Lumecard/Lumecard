import { StrKey } from "@stellar/stellar-sdk";
import { CHAIN_DEPOSIT } from "./config";

/**
 * Reads from the deposit factory on the chosen chain with plain JSON-RPC calls (no extra library).
 *
 *  - receiverFor(bytes)  the address (on the other chain) that belongs to one Stellar wallet. Works before anything
 *                        has been deployed there: the address is worked out, not looked up.
 *  - balanceOf(address)  USDC sitting at that address, waiting to be swept.
 */

const SELECTOR_RECEIVER_FOR = "0x6feada49"; // receiverFor(bytes)
const SELECTOR_BALANCE_OF = "0x70a08231"; // balanceOf(address)

async function ethCall(to: string, data: string): Promise<string> {
  const res = await fetch(CHAIN_DEPOSIT.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
  });
  if (!res.ok) throw new Error("Couldn't reach the chain. Try again.");
  const j = (await res.json()) as { result?: string; error?: { message?: string } };
  if (j.error || !j.result) throw new Error(j.error?.message ?? "The chain returned nothing.");
  return j.result;
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const pad32 = (h: string) => h.padEnd(Math.ceil(h.length / 64) * 64, "0");

/** ABI-encodes one dynamic `bytes` argument. */
function encodeBytesArg(value: Uint8Array): string {
  const offset = (32).toString(16).padStart(64, "0");
  const length = value.length.toString(16).padStart(64, "0");
  return offset + length + pad32(hex(value));
}

/** The deposit address (on the other chain) for a Stellar wallet (G...). Returned as lowercase hex. */
export async function getDepositAddress(stellarAddress: string): Promise<string> {
  if (!StrKey.isValidEd25519PublicKey(stellarAddress)) throw new Error("That is not a valid Stellar address.");
  const data = SELECTOR_RECEIVER_FOR + encodeBytesArg(new TextEncoder().encode(stellarAddress));
  const out = await ethCall(CHAIN_DEPOSIT.factory, data);
  if (!/^0x[0-9a-fA-F]{64}$/.test(out)) throw new Error("The factory gave an unexpected answer.");
  const addr = "0x" + out.slice(26);
  if (/^0x0{40}$/.test(addr)) throw new Error("The factory returned an empty address.");
  return addr;
}

/** USDC (6 decimals) held at an address on the other chain, as a number. */
export async function getUsdcAtAddress(address: string): Promise<number> {
  const data = SELECTOR_BALANCE_OF + address.replace(/^0x/, "").toLowerCase().padStart(64, "0");
  const out = await ethCall(CHAIN_DEPOSIT.usdc, data);
  return Number(BigInt(out)) / 1e6;
}

/**
 * Tells the relayer to watch this wallet, the way Jupiter's deposit page asks its service for an address.
 * The user sees nothing and signs nothing. Returns true when the relayer answered with the same address we
 * worked out ourselves, so a wrong or tampered answer is never trusted.
 */
export async function registerWithRelayer(stellarAddress: string, expectedAddress: string): Promise<boolean> {
  if (!CHAIN_DEPOSIT.relayerUrl) return false;
  try {
    const res = await fetch(`${CHAIN_DEPOSIT.relayerUrl}/deposit-address?stellar=${encodeURIComponent(stellarAddress)}`);
    if (!res.ok) return false;
    const j = (await res.json()) as { address?: string; registered?: boolean };
    return j.registered === true && typeof j.address === "string" && j.address.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}
