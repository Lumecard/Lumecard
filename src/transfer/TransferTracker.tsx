import { Check, ExternalLink, Loader2 } from "lucide-react";
import { explorerTx } from "../config/network";
import { CHAIN_DEPOSIT } from "./config";
import type { DepositTransfer } from "./depositAddress";

type StepState = "done" | "active" | "waiting" | "stuck";

function Dot({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600/20 text-brand-500 ring-1 ring-brand-600/40">
        <Check className="h-3 w-3" />
      </span>
    );
  if (state === "active")
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[#0e0d12]">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  if (state === "stuck") return <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">!</span>;
  return <span className="h-5 w-5 shrink-0 rounded-full bg-surface" />;
}

function Line({ state, title, note, link }: { state: StepState; title: string; note?: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <Dot state={state} />
      </div>
      <div className="min-w-0 pb-3">
        <p className={`text-sm font-medium leading-5 ${state === "waiting" ? "text-neutral-500" : ""}`}>{title}</p>
        {note && <p className={`mt-0.5 text-xs ${state === "stuck" ? "text-brand-500" : "text-neutral-500"}`}>{note}</p>}
        {link && (
          <a href={link.href} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-neutral-500 underline">
            {link.label} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

const minutesAgo = (at: number | null) => (at ? Math.max(0, Math.round((Date.now() - at) / 60_000)) : null);

/**
 * One transfer in three steps: received on the other chain, sent across, arrived in the Stellar wallet.
 * `transfer` is null for USDC that has arrived at the deposit address but has not been sent across yet.
 */
export function TransferRow({ transfer, waiting }: { transfer: DepositTransfer | null; waiting?: number }) {
  const amount = transfer ? transfer.amount : (waiting ?? null);
  const delivered = transfer?.stage === "delivered";
  const blocked = transfer?.stage === "blocked";
  const ago = transfer ? minutesAgo(transfer.at) : null;

  return (
    <div className="rounded-2xl bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{amount !== null ? `${amount} USDC from ${CHAIN_DEPOSIT.name}` : `USDC from ${CHAIN_DEPOSIT.name}`}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${delivered ? "bg-brand-600/20 text-brand-500" : blocked ? "bg-brand-600 text-white" : "bg-white/[0.06] text-neutral-600"}`}>
          {delivered ? "Arrived" : blocked ? "Needs action" : "In progress"}
        </span>
      </div>

      <Line
        state="done"
        title={`Received on ${CHAIN_DEPOSIT.name}`}
        link={transfer ? { href: CHAIN_DEPOSIT.explorerTx(transfer.burnTx), label: `View on ${CHAIN_DEPOSIT.name}` } : undefined}
      />
      <Line
        state={delivered ? "done" : transfer ? "active" : "active"}
        title={delivered ? "Sent across" : transfer ? "Sending across" : "Starting to send across"}
        note={
          delivered
            ? undefined
            : transfer
              ? `Circle is approving it. This takes about ${CHAIN_DEPOSIT.waitMinutes} minutes${ago !== null ? ` (started ${ago === 0 ? "just now" : `${ago} min ago`})` : ""}.`
              : "This starts within a minute."
        }
      />
      <Line
        state={delivered ? "done" : blocked ? "stuck" : "waiting"}
        title={delivered ? "Arrived in your Stellar wallet" : "Arrives in your Stellar wallet"}
        note={
          blocked
            ? "Your wallet has not enabled USDC yet, so it can't receive it. Enable USDC on the Home page, and it will be delivered."
            : undefined
        }
        link={delivered && transfer?.stellarTx ? { href: explorerTx(transfer.stellarTx), label: "View on Stellar" } : undefined}
      />
    </div>
  );
}
