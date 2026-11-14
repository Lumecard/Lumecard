import { ArrowDownLeft, ArrowUpRight, ChevronRight, Eye, EyeOff, Gift, Inbox, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { AssetIcon } from "../components/AssetIcon";
import { useDeposit } from "../components/DepositModal";
import { useConnectWallet } from "../components/ConnectWallet";
import { useAuth } from "../auth/AuthProvider";
import { TestnetFunding } from "../components/TestnetFunding";
import { IS_TESTNET } from "../config/network";
import { useWithdraw } from "../components/WithdrawModal";
import { ASSETS, fmtPrice } from "../data/assets";
import { fmtAmount, fmtUsd, useBalances, useHideBalance } from "../chain/Balances";

const ACTIONS = [
  { id: "gift", label: "Send gift", icon: Gift, to: "/app/gifts/create" },
  { id: "mix", label: "Mix", icon: Layers, to: "/mix" },
  { id: "deposit", label: "Deposit", icon: ArrowDownLeft },
  { id: "withdraw", label: "Withdraw", icon: ArrowUpRight },
];

function EmptyState({ icon: Icon, title, body, action }: { icon: typeof Inbox; title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-card px-6 py-10 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-neutral-500">{body}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { openDeposit } = useDeposit();
  const { openWithdraw } = useWithdraw();
  const { amounts, totalUsd, tokenCount, loading, funded, error } = useBalances();
  const [hidden, toggleHide] = useHideBalance();
  const { ready, authenticated } = useAuth();
  const { openConnect } = useConnectWallet();
  // Anyone can look around. Actions that need a wallet ask to connect first, then carry on.
  const gate = (fn: () => void) => (authenticated ? fn() : openConnect(fn));
  const holdings = ASSETS.filter((a) => (amounts[a.id] ?? 0) > 0);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0e0d12]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <AppShell>
      <main className="flex flex-col md:min-h-[calc(100vh-48px)] md:flex-row">
        {/* Right side: balance card, separated from the main side by a line */}
        <aside className="hidden p-4 md:order-2 xl:p-6 md:block md:w-[290px] md:shrink-0 lg:w-[330px] xl:w-[392px] md:border-l md:border-white/[0.06]">
          <div className="md:sticky md:top-[72px]">
          <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-[#2a1a12] to-brand-700 p-4 text-white md:aspect-[5/4] xl:p-5 xl:aspect-[4/3]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div>
                <button onClick={toggleHide} className="flex items-center gap-1.5 text-sm text-white/60" aria-label={hidden ? "Show balance" : "Hide balance"}>
                  Total balance {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <p className="mt-1 text-3xl font-semibold tracking-tight xl:text-4xl">
                  {loading ? <span className="inline-block h-10 w-40 animate-pulse rounded-lg bg-white/15 align-middle" /> : hidden ? "****" : authenticated ? fmtUsd(totalUsd) : "$0.00"}
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {!authenticated
                    ? "Connect a wallet to see your balance"
                    : error
                    ? "Couldn't reach the network. Retrying…"
                    : !funded
                      ? "Wallet not active yet. Deposit XLM to activate it."
                      : `Across ${tokenCount} ${tokenCount === 1 ? "token" : "tokens"}`}
                </p>
              </div>
              <div className="flex justify-end gap-3 xl:gap-4">
                {ACTIONS.map(({ id, label, icon: Icon, to }) => {
                  const primary = id === "gift";
                  return (
                    <button
                      key={id}
                      onClick={() => (id === "mix" && to ? navigate(to) : gate(() => (to ? navigate(to) : id === "deposit" ? openDeposit() : openWithdraw())))}
                      className="flex flex-col items-center gap-2"
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-xl xl:h-10 xl:w-10 ${primary ? "bg-card text-brand-700" : "bg-white/10 text-white ring-1 ring-white/15"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs text-white/80">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
          {authenticated && IS_TESTNET && (
            <div className="mt-4 [&>*]:mt-0">
              <TestnetFunding />
            </div>
          )}
          </div>
        </aside>
        {/* Main side */}
        <div className="relative order-2 min-w-0 flex-1 px-4 pb-16 pt-8 sm:px-6 md:order-1">
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[420px]" /><div className="relative mx-auto w-full max-w-[760px]">
          <div className="mb-6 grid grid-cols-2 gap-3 md:hidden">
            <button onClick={() => gate(() => navigate("/app/gifts/create"))} className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand-600 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.25)]">
              <Gift className="h-4 w-4" /> Send a gift
            </button>
            <button onClick={() => navigate("/mix")} className="flex h-11 items-center justify-center gap-2 rounded-full bg-white/[0.06] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-2px_0_rgba(0,0,0,0.35)]">
              <Layers className="h-4 w-4" /> Mix
            </button>
          </div>

        {/* Tokens */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Popular tokens</h2>
            <button className="flex items-center gap-0.5 text-sm font-medium text-neutral-500 hover:text-brand-600">
              See all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {ASSETS.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/app/token/${a.id}`)}
                className="flex w-[120px] shrink-0 flex-col items-start rounded-2xl bg-card p-3.5 text-left"
              >
                <AssetIcon asset={a} size="md" />
                <span className="mt-3 text-sm font-semibold">{a.symbol}</span>
                <span className="text-xs text-neutral-500">{fmtPrice(a.price)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Portfolio + gifts */}
        <div className="mt-10">
          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight">My portfolio</h2>
            {!authenticated ? (
              <EmptyState
                icon={Inbox}
                title="Connect your wallet"
                body="Connect a Stellar wallet to see what you hold."
                action={
                  <button onClick={() => openConnect()} className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
                    Connect wallet
                  </button>
                }
              />
            ) : holdings.length > 0 ? (
              <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl bg-card">
                {holdings.map((a) => {
                  const amt = amounts[a.id];
                  return (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/app/token/${a.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <AssetIcon asset={a} />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold">{a.name}</span>
                        <span className="block text-xs text-neutral-500">
                          {fmtAmount(amt)} {a.symbol}
                        </span>
                      </span>
                      <span className="text-sm font-semibold">{fmtUsd(amt * a.price)}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title="Nothing here yet"
                body="Grow your portfolio by receiving gifts or depositing tokens."
                action={
                  <button onClick={() => gate(openDeposit)} className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50">
                    Deposit tokens
                  </button>
                }
              />
            )}
          </section>
        </div>
        </div>
        </div>
      </main>
    </AppShell>
  );
}
