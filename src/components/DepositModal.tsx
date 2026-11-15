import { createContext, useContext, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Building2, Check, Copy, Wallet, X } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { QrCode } from "../transfer";

const short = (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-4)}`;

type View = "choose" | "wallet" | "bank";

const DepositContext = createContext<{ openDeposit: () => void }>({ openDeposit: () => {} });
export const useDeposit = () => useContext(DepositContext);

export function DepositProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DepositContext.Provider value={{ openDeposit: () => setOpen(true) }}>
      {children}
      {open && <DepositModal onClose={() => setOpen(false)} />}
    </DepositContext.Provider>
  );
}

function DepositModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>("choose");
  const [copied, setCopied] = useState(false);
  const address = useAuth().stellarAddress ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-pop relative w-full max-w-md rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100">
          <X className="h-5 w-5" />
        </button>

        {view === "choose" && (
          <>
            <h2 className="pr-8 text-lg font-semibold">How would you like to deposit?</h2>
            <p className="mt-1 text-sm text-neutral-500">Add funds to your wallet.</p>
            <div className="mt-5 space-y-2.5">
              {[
                { id: "bank" as const, icon: Building2, title: "Bank transfer", sub: "Deposit from your bank account" },
                { id: "wallet" as const, icon: Wallet, title: "External wallet", sub: "Send Stellar assets from any wallet" },
              ].map(({ id, icon: Icon, title, sub }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface text-neutral-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="block text-xs text-neutral-500">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {view === "wallet" && (
          <div className="text-center">
            <h2 className="px-8 text-lg font-semibold">Deposit to your wallet</h2>
            <p className="mt-1 text-sm text-neutral-500">Send XLM, USDC or EURC on the Stellar network to your wallet address.</p>

            <div className="mx-auto mt-5 w-fit rounded-2xl border border-neutral-200 p-3">
              <QrCode value={address} />
            </div>

            <p className="mt-4 text-sm text-neutral-500">Your wallet address</p>
            <p className="mt-0.5 font-mono text-sm font-semibold">{short(address)}</p>
            <p className="mx-auto mt-1 max-w-[300px] break-all font-mono text-[11px] text-neutral-400">{address}</p>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-left text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Only send assets on the Stellar network. Assets sent from other networks may be lost.
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(address).catch(() => {});
                  setCopied(true);
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Address copied" : "Copy address"}
              </button>
              <button
                onClick={() => setView("choose")}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 text-sm font-semibold hover:bg-neutral-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </div>
          </div>
        )}

        {view === "bank" && (
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface">
              <Building2 className="h-6 w-6 text-neutral-700" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Bank transfer</h2>
            <p className="mt-1 text-sm text-neutral-500">Bank deposits are coming soon.</p>
            <button
              onClick={() => setView("choose")}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 text-sm font-semibold hover:bg-neutral-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
