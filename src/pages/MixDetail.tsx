import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { AssetIcon } from "../components/AssetIcon";
import { IconStack, Weights } from "./Mixes";
import { useAuth } from "../auth/AuthProvider";
import { useConnectWallet } from "../components/ConnectWallet";
import { useWalletSigner } from "../chain/walletSigner";
import { fmtAmount, useBalances } from "../chain/Balances";
import { getAsset } from "../data/assets";
import {
  MIN_MIX_USDC,
  MIX_FEE_BPS,
  MIX_PRESETS,
  buyMixOnChain,
  checkRecipient,
  isMixAddress,
  mixFee,
  quoteMix,
  validateLegs,
  type MixLeg,
  type MixQuote,
} from "../chain/mix";
import { explorerTx } from "../config/network";

const BAR: Record<string, string> = { usdc: "bg-blue-600", xlm: "bg-neutral-300", eurc: "bg-brand-600" };

/** Re-prices the Mix a moment after the amount or shares stop changing. */
function useQuote(total: number, legs: MixLeg[]) {
  const [quote, setQuote] = useState<MixQuote>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify([total, legs]);

  useEffect(() => {
    setQuote(undefined);
    setError(undefined);
    if (!(total > 0)) return;
    const problem = validateLegs(legs);
    if (problem) return setError(problem);
    if (total < MIN_MIX_USDC) return setError(`The smallest Mix is ${MIN_MIX_USDC} USDC.`);
    let live = true;
    setLoading(true);
    const t = setTimeout(() => {
      quoteMix({ totalUsdc: total, legs })
        .then((q) => live && setQuote(q))
        .catch((e) => live && setError(e instanceof Error ? e.message : "Couldn't price this Mix."))
        .finally(() => live && setLoading(false));
    }, 450);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { quote, error, loading };
}

export default function MixDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { authenticated, stellarAddress } = useAuth();
  const { openConnect } = useConnectWallet();
  const sign = useWalletSigner();
  const { amounts, refresh } = useBalances();

  const preset = MIX_PRESETS.find((p) => p.id === id);
  const isCustom = id === "custom";
  const [custom, setCustom] = useState<MixLeg[]>([
    { token: "usdc", percent: 40 },
    { token: "xlm", percent: 40 },
    { token: "eurc", percent: 20 },
  ]);
  const legs = isCustom ? custom : (preset?.legs ?? []);

  const [text, setText] = useState("");
  const total = Number(text) > 0 ? Number(text) : 0;
  const usdc = amounts.usdc ?? 0;

  const [mode, setMode] = useState<"me" | "other">("me");
  const [other, setOther] = useState("");
  const [otherNote, setOtherNote] = useState<string>();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [buyError, setBuyError] = useState<string>();
  const [done, setDone] = useState<{ hash: string; quote: MixQuote; to: string }>();

  const { quote, error, loading } = useQuote(total, legs.filter((l) => l.percent > 0));
  const fee = total > 0 ? mixFee(total) : 0;
  const recipient = mode === "me" ? (stellarAddress ?? "") : other.trim();

  // For someone else: say right away if their wallet can't hold this Mix.
  useEffect(() => {
    setOtherNote(undefined);
    if (mode !== "other" || !other.trim()) return;
    if (!isMixAddress(other)) return setOtherNote("That doesn't look like a Stellar address. It starts with G and is 56 characters long.");
    let live = true;
    checkRecipient(other.trim(), legs.filter((l) => l.percent > 0).map((l) => l.token))
      .then((c) => {
        if (!live) return;
        if (!c.exists) setOtherNote("That wallet isn't active yet, so it can't receive a Mix.");
        else if (c.missing.length) setOtherNote(`That wallet hasn't enabled ${c.missing.map((t) => t.toUpperCase()).join(" and ")} yet.`);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, other, JSON.stringify(legs)]);

  const customSum = useMemo(() => custom.reduce((a, l) => a + l.percent, 0), [custom]);

  if (!preset && !isCustom) return <Navigate to="/mix" replace />;

  const buy = async () => {
    if (!authenticated || !stellarAddress || !sign) return openConnect();
    if (!quote) return;
    setBusy(true);
    setBuyError(undefined);
    try {
      const { txHash } = await buyMixOnChain({ source: stellarAddress, recipient, quote, sign });
      setDone({ hash: txHash, quote, to: recipient });
      setText("");
      refresh();
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : "The Mix failed.");
    } finally {
      setBusy(false);
    }
  };

  const notEnough = total > usdc;
  const canBuy = !!quote && !loading && !notEnough && !busy && (mode === "me" || (isMixAddress(other) && !otherNote));

  return (
    <AppShell>
      <main className="mx-auto grid max-w-[1080px] gap-8 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1fr_380px]">
        {/* Left: what is in it */}
        <section>
          <button onClick={() => navigate("/mix")} className="text-sm text-neutral-500">
            Mixes
          </button>
          <div className="mt-3 flex items-center gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">{isCustom ? "Your own Mix" : preset!.name}</h1>
            <IconStack legs={legs.filter((l) => l.percent > 0)} />
          </div>
          <p className="mt-2 text-neutral-600">{isCustom ? "Choose how your USDC is split." : preset!.note}.</p>

          <div className="mt-8">
            <div className="flex h-3 overflow-hidden rounded-full bg-surface">
              {legs
                .filter((l) => l.percent > 0)
                .map((l) => (
                  <div key={l.token} className={BAR[l.token]} style={{ width: `${l.percent}%` }} />
                ))}
            </div>
            {isCustom ? (
              <div className="mt-5 space-y-3">
                {custom.map((l, i) => (
                  <div key={l.token} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
                    <AssetIcon asset={getAsset(l.token)!} size="sm" />
                    <span className="flex-1 text-sm font-semibold">{getAsset(l.token)!.name}</span>
                    <input
                      inputMode="numeric"
                      value={l.percent}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(100, Math.round(Number(e.target.value.replace(/\D/g, "")) || 0)));
                        setCustom((c) => c.map((x, j) => (j === i ? { ...x, percent: v } : x)));
                      }}
                      className="w-16 rounded-lg bg-surface px-2 py-1.5 text-right text-sm outline-none"
                    />
                    <span className="text-sm text-neutral-500">%</span>
                  </div>
                ))}
                <p className={`text-xs ${customSum === 100 ? "text-neutral-500" : "text-brand-500"}`}>Total: {customSum}% (needs to be 100%)</p>
              </div>
            ) : (
              <div className="mt-5">
                <Weights legs={legs} />
              </div>
            )}
          </div>

          <h2 className="mt-10 text-lg font-semibold">How it works</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Your USDC is traded on Stellar's built-in exchange into each token in one transaction. Either every part goes through, or none does. The
            price you see is checked again when you confirm, and the whole Mix is cancelled if it moves more than 1% against you.
          </p>
        </section>

        {/* Right: the buy panel */}
        <aside className="h-fit rounded-3xl bg-card p-5">
          {done ? (
            <div className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-500">
                <Check className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">Mix complete</h2>
              <p className="mt-1 text-sm text-neutral-600">{done.to === stellarAddress ? "It is in your wallet." : "It was sent to the other wallet."}</p>
              <div className="mt-4 space-y-2 rounded-2xl bg-surface p-4 text-left text-sm">
                {done.quote.legs.map((l) => (
                  <div key={l.token} className="flex justify-between">
                    <span className="text-neutral-600">{l.token.toUpperCase()}</span>
                    <span className="font-semibold">about {fmtAmount(l.receive)}</span>
                  </div>
                ))}
              </div>
              <a
                href={explorerTx(done.hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs text-neutral-500 underline"
              >
                View the transaction
              </a>
              <button
                onClick={() => setDone(undefined)}
                className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.25)]"
              >
                Buy another
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1 text-sm font-semibold">
                {(
                  [
                    ["me", "For me"],
                    ["other", "For someone else"],
                  ] as const
                ).map(([m, label]) => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded-full py-2 ${mode === m ? "bg-card text-fg" : "text-neutral-500"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {mode === "other" && (
                <div className="mt-4">
                  <label className="text-xs text-neutral-500">Their Stellar address</label>
                  <input
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                    placeholder="G..."
                    spellCheck={false}
                    className="mt-1 w-full rounded-xl bg-surface px-3 py-2.5 font-mono text-xs outline-none placeholder:text-neutral-500"
                  />
                  {otherNote && <p className="mt-1.5 text-xs text-brand-500">{otherNote}</p>}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                <span>{authenticated ? `${fmtAmount(usdc)} USDC` : "Connect a wallet to buy"}</span>
                <span className="flex gap-2 font-semibold">
                  <button onClick={() => setText(String(Math.floor(usdc * 1e7) / 1e7))}>MAX</button>
                  <button onClick={() => setText(String(Math.floor(usdc * 0.5 * 1e7) / 1e7))}>50%</button>
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
                <input
                  inputMode="decimal"
                  value={text}
                  onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                  className="min-w-0 flex-1 bg-transparent text-2xl font-medium outline-none placeholder:text-neutral-500"
                />
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <AssetIcon asset={getAsset("usdc")!} size="sm" /> USDC
                </span>
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">Minimum {MIN_MIX_USDC} USDC</p>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">You receive</span>
                  <span className="font-semibold">{loading ? "Pricing…" : quote ? "About " + quote.legs.map((l) => `${fmtAmount(l.receive)} ${l.token.toUpperCase()}`).join(" + ") : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Mix fee ({(MIX_FEE_BPS / 100).toFixed(2)}%)</span>
                  <span className="font-semibold">{fee > 0 ? `${fee.toFixed(4)} USDC` : "-"}</span>
                </div>
                <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-neutral-500">
                  Estimated allocation <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="space-y-1.5 rounded-xl bg-surface p-3 text-xs">
                    {quote ? (
                      quote.legs.map((l) => (
                        <div key={l.token} className="flex justify-between">
                          <span className="text-neutral-600">{l.token.toUpperCase()}</span>
                          <span>
                            {l.spend.toFixed(4)} USDC → {fmtAmount(l.receive)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-neutral-500">Enter an amount to see the split.</span>
                    )}
                  </div>
                )}
              </div>

              {error && <p className="mt-3 text-xs text-brand-500">{error}</p>}
              {notEnough && <p className="mt-3 text-xs text-brand-500">You don't have that much USDC.</p>}
              {buyError && <p className="mt-3 text-xs text-brand-500">{buyError}</p>}

              <button
                onClick={buy}
                disabled={authenticated && !canBuy}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-3px_0_rgba(0,0,0,0.25)] disabled:opacity-50"
              >
                {!authenticated ? "Connect wallet" : busy ? "Confirm in your wallet…" : mode === "other" ? "Send Mix" : "Buy Mix"}
              </button>
            </>
          )}
        </aside>
      </main>
    </AppShell>
  );
}
