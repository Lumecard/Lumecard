import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, Check, ChevronDown, Copy, Info } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { AssetIcon } from "../components/AssetIcon";
import { getAsset } from "../data/assets";
import { CHAIN_DEPOSIT } from "./config";
import { QrCode } from "./QrCode";
import { useChainDeposit } from "./useChainDeposit";
import { useBalances } from "../chain/Balances";
import { TransferRow } from "./TransferTracker";

/** One numbered step: a circle on the left joined to the next one by a line. */
function Step({ marker, title, last = false, children }: { marker: ReactNode; title: string; last?: boolean; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        {marker}
        {!last && <div className="mt-1 w-px flex-1 bg-brand-600/40" />}
      </div>
      <div className={`min-w-0 flex-1 ${last ? "" : "pb-8"}`}>
        <h2 className="text-lg font-semibold leading-6">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

const Done = () => (
  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600/20 text-brand-500 ring-1 ring-brand-600/40">
    <Check className="h-3.5 w-3.5" />
  </span>
);

const Active = ({ n }: { n: number }) => (
  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-[#0e0d12]">{n}</span>
);

/** The network picker. Base is the only choice today; more chains will appear in this list. */
function NetworkPicker() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex h-12 w-full items-center gap-3 rounded-xl bg-card px-4 text-left text-sm font-medium">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{CHAIN_DEPOSIT.name[0]}</span>
        <span className="flex-1">{CHAIN_DEPOSIT.label}</span>
        <ChevronDown className={`h-4 w-4 text-neutral-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-10 mt-1.5 w-full rounded-xl bg-surface p-1.5 shadow-xl shadow-black/30">
          <button onClick={() => setOpen(false)} className="flex h-11 w-full items-center gap-3 rounded-lg bg-white/[0.06] px-3 text-left text-sm">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{CHAIN_DEPOSIT.name[0]}</span>
            <span className="flex-1">{CHAIN_DEPOSIT.label}</span>
            <Check className="h-4 w-4 text-brand-500" />
          </button>
        </div>
      )}
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span className="text-neutral-500">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

/** "USDC from another chain": network, token, then the address to send to. Shown on the Transfer page. */
export function ChainDeposit({ onBack }: { onBack?: () => void }) {
  const { stellarAddress } = useAuth();
  const { address, waiting, error, loading, watching, transfers } = useChainDeposit(stellarAddress);
  const { refresh } = useBalances();
  const [arrived, setArrived] = useState<string>();
  const seen = useRef<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const usdc = getAsset("usdc")!;

  // When a transfer we were watching arrives, say so and refresh the balances.
  useEffect(() => {
    for (const t of transfers) {
      if (seen.current[t.burnTx] === "in_progress" && t.stage === "delivered") {
        setArrived(t.amount !== null ? `${t.amount} USDC arrived in your Stellar wallet.` : "Your USDC arrived in your Stellar wallet.");
        refresh();
      }
      seen.current[t.burnTx] = t.stage;
    }
  }, [transfers, refresh]);
  // USDC at the address that has not been sent across yet (the relayer picks it up within a minute).
  const pendingSweep = waiting >= CHAIN_DEPOSIT.minUsdc;

  return (
    <div>
      {arrived && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-brand-600/15 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 font-semibold">
            <Check className="h-4 w-4 text-brand-500" /> {arrived}
          </span>
          <button onClick={() => setArrived(undefined)} className="text-xs text-neutral-500">
            Dismiss
          </button>
        </div>
      )}

      <Step marker={<Done />} title="Select Network">
        <NetworkPicker />
      </Step>

      <Step marker={<Done />} title="Select Token">
        <div className="flex h-12 items-center gap-3 rounded-xl bg-card px-4 text-sm font-medium">
          <AssetIcon asset={usdc} size="sm" />
          <span className="flex-1">USDC</span>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          Only USDC is supported. Minimum {CHAIN_DEPOSIT.minUsdc} USDC. Any other token sent here can't be recovered.
        </p>
      </Step>

      <Step marker={<Active n={3} />} title="Deposit to Address">
        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-start gap-2.5 rounded-lg bg-surface px-3 py-2.5 text-xs text-neutral-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Only send USDC on {CHAIN_DEPOSIT.label}. Tokens sent from other networks may be lost.
            </span>
          </div>

          {loading && <p className="mt-5 text-sm text-neutral-500">Getting your address…</p>}
          {error && <p className="mt-5 text-sm text-brand-500">{error}</p>}

          {address && (
            <>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="w-fit shrink-0 rounded-2xl bg-surface p-3">
                  <QrCode value={address} size={128} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-500">Your {CHAIN_DEPOSIT.name} deposit address</p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold">{address}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(address).catch(() => {});
                      setCopied(true);
                    }}
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.06] px-4 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-2px_0_rgba(0,0,0,0.35)]"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy address"}
                  </button>
                </div>
              </div>

              {watching === true && (
                <p className="mt-3 text-xs text-neutral-500">Automatic delivery is on. Send USDC to this address and it will be moved to your Stellar wallet.</p>
              )}
              {watching === false && (
                <p className="mt-3 text-xs text-brand-500">Automatic delivery is not responding right now. Your USDC stays safe at this address and is delivered once it is back.</p>
              )}

            </>
          )}
        </div>
      </Step>

      <Step
        last
        marker={
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-neutral-500">
            <ArrowDown className="h-3.5 w-3.5" />
          </span>
        }
        title="You receive USDC on Stellar"
      >
        <div className="divide-y divide-white/5">
          <Row label="Fee" value="About 0.5% of the amount" />
          <Row label="Minimum deposit" value={`${CHAIN_DEPOSIT.minUsdc} USDC`} />
          <Row label="Est. processing time" value={`${CHAIN_DEPOSIT.waitMinutes} min`} />
        </div>
      </Step>

      {(pendingSweep || transfers.length > 0 || (waiting > 0 && !pendingSweep)) && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Your transfers</h2>
          <div className="space-y-3">
            {waiting > 0 && !pendingSweep && (
              <p className="rounded-2xl bg-card p-4 text-sm text-neutral-500">
                <span className="font-semibold text-fg">{waiting} USDC is waiting at your address.</span> It is below the {CHAIN_DEPOSIT.minUsdc} USDC minimum, so send more to move it.
              </p>
            )}
            {pendingSweep && <TransferRow transfer={null} waiting={waiting} />}
            {transfers.map((t) => (
              <TransferRow key={t.burnTx} transfer={t} />
            ))}
          </div>
        </div>
      )}

      {onBack && (
        <button onClick={onBack} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}
    </div>
  );
}
