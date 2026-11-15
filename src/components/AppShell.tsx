import type { ReactNode } from "react";
import { ArrowDownToLine, ArrowLeftRight, BookOpen, Gift, Home, Info, Layers, Send, type LucideIcon } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { useDeposit } from "./DepositModal";
import { useWithdraw } from "./WithdrawModal";
import { useConnectWallet } from "./ConnectWallet";
import { useAuth } from "../auth/AuthProvider";
import { CHAIN_DEPOSIT } from "../transfer";

interface Item {
  label: string;
  icon: LucideIcon;
  /** A page, or an action that opens a window. */
  to?: string;
  action?: "deposit" | "withdraw";
  end?: boolean;
}

const MAIN: Item[] = [
  { label: "Home", icon: Home, to: "/", end: true },
  { label: "Mix", icon: Layers, to: "/mix" },
  { label: "Send gift", icon: Gift, to: "/app/gifts/create" },
  // Bring USDC in from another chain. Only shown when it is set up.
  ...(CHAIN_DEPOSIT.enabled ? [{ label: "Transfer", icon: ArrowLeftRight, to: "/transfer" }] : []),
];
const WALLET: Item[] = [
  { label: "Deposit", icon: ArrowDownToLine, action: "deposit" },
  { label: "Withdraw", icon: Send, action: "withdraw" },
];
const MORE: Item[] = [
  { label: "Guide", icon: BookOpen, to: "/guide" },
  { label: "About", icon: Info, to: "/welcome" },
];

function useItemAction() {
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const { openConnect } = useConnectWallet();
  const { openDeposit } = useDeposit();
  const { openWithdraw } = useWithdraw();
  // Anything that needs a wallet asks to connect first, then carries on.
  const gate = (fn: () => void) => (authenticated ? fn() : openConnect(fn));
  return (item: Item) => {
    if (item.action === "deposit") gate(openDeposit);
    else if (item.action === "withdraw") gate(openWithdraw);
    else if (item.to === "/app/gifts/create") gate(() => navigate(item.to!));
    else if (item.to) navigate(item.to);
  };
}

const base = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

function SideItem({ item, run }: { item: Item; run: (i: Item) => void }) {
  const Icon = item.icon;
  const label = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="hidden xl:inline">{item.label}</span>
    </>
  );
  if (item.to && !item.action && item.to !== "/app/gifts/create") {
    return (
      <NavLink
        to={item.to}
        end={item.end}
        title={item.label}
        className={({ isActive }) => `${base} ${isActive ? "bg-white/[0.07] text-white" : "text-neutral-600"}`}
      >
        {label}
      </NavLink>
    );
  }
  return (
    <button onClick={() => run(item)} title={item.label} className={`${base} w-full text-left text-neutral-600`}>
      {label}
    </button>
  );
}

function Group({ items, run }: { items: Item[]; run: (i: Item) => void }) {
  return (
    <div className="space-y-1">
      {items.map((i) => (
        <SideItem key={i.label} item={i} run={run} />
      ))}
    </div>
  );
}

/** Left navigation. Icons only on medium screens, with labels on wide ones. Hidden on phones. */
function Sidebar() {
  const run = useItemAction();
  return (
    <aside className="sticky top-12 hidden h-[calc(100vh-48px)] w-[60px] shrink-0 flex-col justify-between border-r border-white/[0.06] p-2 md:flex xl:w-[220px] xl:p-3">
      <div className="space-y-5">
        <Group items={MAIN} run={run} />
        <div className="h-px bg-white/[0.06]" />
        <Group items={WALLET} run={run} />
      </div>
      <Group items={MORE} run={run} />
    </aside>
  );
}

/** Phone navigation along the bottom edge. */
function BottomNav() {
  const run = useItemAction();
  const items = [...MAIN, MORE[0]];
  return (
    <nav className={`fixed inset-x-0 bottom-0 z-30 grid ${items.length > 4 ? "grid-cols-5" : "grid-cols-4"} border-t border-white/[0.06] bg-[#0e0d12]/95 backdrop-blur-md md:hidden`}>
      {items.map((i) => {
        const Icon = i.icon;
        const inner = (
          <>
            <Icon className="h-5 w-5" />
            <span className="text-[10px]">{i.label}</span>
          </>
        );
        return i.to && i.to !== "/app/gifts/create" ? (
          <NavLink
            key={i.label}
            to={i.to}
            end={i.end}
            className={({ isActive }) => `flex h-14 flex-col items-center justify-center gap-1 ${isActive ? "text-white" : "text-neutral-500"}`}
          >
            {inner}
          </NavLink>
        ) : (
          <button key={i.label} onClick={() => run(i)} className="flex h-14 flex-col items-center justify-center gap-1 text-neutral-500">
            {inner}
          </button>
        );
      })}
    </nav>
  );
}

/** Header across the top, navigation down the left, the page in the middle. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0e0d12]">
      <Header />
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1 pb-16 md:pb-0">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
