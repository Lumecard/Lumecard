import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowLeft, Check, ChevronDown, Copy, Eye, EyeOff, LogOut, Send, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useDeposit } from "./DepositModal";
import { SentGifts } from "./SentGifts";
import { useWithdraw } from "./WithdrawModal";
import { useConnectWallet } from "./ConnectWallet";
import { useAuth } from "../auth/AuthProvider";
import { fmtAmount, fmtUsd, useBalances, useHideBalance } from "../chain/Balances";

const shortAddr = (a?: string) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "No wallet");
const TOKENS = [
  { id: "xlm", label: "XLM" },
  { id: "usdc", label: "USDC" },
  { id: "eurc", label: "EURC" },
];

/** Wallet panel that slides in from the right edge. */
function WalletPanel({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"wallet" | "activity">("wallet");
  const [hidden, toggleHide] = useHideBalance();
  const navigate = useNavigate();
  const { openDeposit } = useDeposit();
  const { openWithdraw } = useWithdraw();
  const { stellarAddress, logout } = useAuth();
  const { totalUsd, amounts } = useBalances();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const held = TOKENS.filter((t) => (amounts[t.id] ?? 0) > 0);

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="animate-slide-in absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-white/[0.06] bg-[#0e0d12] text-white">
        <div className="flex items-center justify-between px-5 pt-4">
          <button
            disabled={!stellarAddress}
            onClick={() => {
              if (!stellarAddress) return;
              navigator.clipboard?.writeText(stellarAddress).catch(() => {});
              setCopied(true);
            }}
            className="flex items-center gap-1.5 font-mono text-sm text-white"
            title="Copy wallet address"
          >
            {shortAddr(stellarAddress)}
            {copied ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleHide()}
              aria-label={hidden ? "Show balance" : "Hide balance"}
              className="grid h-8 w-8 place-items-center rounded-full text-white"
            >
              {hidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
            <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-3">
          <div className="min-w-0 truncate text-3xl font-semibold">{hidden ? "****" : fmtUsd(totalUsd)}</div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                onClose();
                openDeposit();
              }}
              className="flex h-9 items-center gap-1.5 rounded-full border border-white/[0.08] px-3.5 text-sm text-white"
            >
              <ArrowDownToLine className="h-4 w-4" /> Deposit
            </button>
            <button
              onClick={() => {
                onClose();
                openWithdraw();
              }}
              className="flex h-9 items-center gap-1.5 rounded-full border border-white/[0.08] px-3.5 text-sm text-white"
            >
              <Send className="h-4 w-4" /> Send
            </button>
            <button
              onClick={async () => {
                onClose();
                await logout();
                navigate("/");
              }}
              aria-label="Disconnect"
              title="Disconnect"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-white/[0.06] text-center text-sm">
          {(["wallet", "activity"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2.5 capitalize ${tab === t ? "border-b border-white font-medium text-white" : "text-white/70"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "wallet" ? (
          <>
            <div className="px-5 pt-4 text-sm font-semibold">Holdings ({held.length})</div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {held.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-white">No holdings</div>
              ) : (
                held.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-white/[0.06] py-3 text-sm">
                    <span className="font-medium">{t.label}</span>
                    <span className="text-white">{hidden ? "****" : fmtAmount(amounts[t.id] ?? 0)}</span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="px-5 pt-4 text-sm font-semibold">Sent gifts</div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <SentGifts empty={<div className="grid h-40 place-items-center text-sm text-white">No gifts sent yet</div>} />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/** `signedIn` is ignored: the header follows the connected wallet. */
export function Header({ landing }: { signedIn?: boolean; landing?: boolean }) {
  const { openConnect } = useConnectWallet();
  const { authenticated, stellarAddress } = useAuth();
  const [panel, setPanel] = useState(false);
  const signedIn = authenticated;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showBack = signedIn && pathname.startsWith("/app/token");
  return (
    <>
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-[#0e0d12]/80 backdrop-blur-md">
      <div className="flex h-12 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Logo />
          </Link>
          {showBack && (
            <button onClick={() => navigate("/")} aria-label="Back" className="grid h-8 w-8 place-items-center rounded-full text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
        </div>
        {!landing && !signedIn && (
          <Link to="/welcome" className="ml-auto mr-4 hidden text-sm text-neutral-600 sm:inline">
            About
          </Link>
        )}
        {landing && !signedIn && (
          <nav className="hidden items-center gap-7 text-sm text-neutral-600 md:flex">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
            <Link to="/guide">Guide</Link>
          </nav>
        )}
        {signedIn ? (
          <button
            onClick={() => setPanel(true)}
            className="flex h-8 items-center gap-2 rounded-full border border-neutral-200 bg-card pl-1 pr-3 text-sm text-white"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs font-semibold text-white">L</span>
            <span className="hidden max-w-[200px] truncate sm:inline">{shortAddr(stellarAddress)}</span>
            <ChevronDown className="h-4 w-4 text-white" />
          </button>
        ) : (
          <button
            onClick={() => openConnect()}
            className="whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-2px_0_rgba(0,0,0,0.4)] sm:px-4"
          >
            Connect wallet
          </button>
        )}
      </div>
    </header>
    {/* Outside the header: its backdrop blur would otherwise trap a fixed panel. */}
    {panel && signedIn && <WalletPanel onClose={() => setPanel(false)} />}
    </>
  );
}
