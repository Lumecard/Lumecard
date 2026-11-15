import { AppShell } from "../components/AppShell";
import { useAuth } from "../auth/AuthProvider";
import { useConnectWallet } from "../components/ConnectWallet";
import { CHAIN_DEPOSIT, ChainDeposit } from "../transfer";

/** Bring USDC in from another chain. Opened from "Transfer" in the sidebar. */
export default function Transfer() {
  const { ready, authenticated } = useAuth();
  const { openConnect } = useConnectWallet();

  return (
    <AppShell>
      <main className="mx-auto max-w-[720px] px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Receive USDC on Stellar</h1>
        <p className="mt-2 text-neutral-600">
          Deposit USDC from another network. It arrives as <b className="text-fg">USDC</b> in your Lumecard wallet.
        </p>

        <div className="mt-8">
          {!CHAIN_DEPOSIT.enabled ? (
            <p className="rounded-2xl bg-card p-6 text-center text-sm text-neutral-500">Transfers from other chains are not available yet.</p>
          ) : !ready ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : !authenticated ? (
            <div className="rounded-2xl bg-card p-6 text-center">
              <p className="text-sm text-neutral-500">Connect your wallet to get your deposit address.</p>
              <button
                onClick={() => openConnect()}
                className="mt-4 h-11 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.25)]"
              >
                Connect wallet
              </button>
            </div>
          ) : (
            <ChainDeposit />
          )}
        </div>
      </main>
    </AppShell>
  );
}
