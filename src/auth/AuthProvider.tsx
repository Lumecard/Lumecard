import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { errorText } from "../chain/gift";
import { KitEventType, Networks } from "@creit.tech/stellar-wallets-kit/types";

/**
 * "Signing in" is connecting the user's own Stellar wallet (Freighter, xBull, Lobstr and others)
 * through Stellar Wallets Kit. There is no account and no server: the wallet holds the keys, and the
 * kit remembers the connection in the browser between visits.
 */
interface AuthState {
  /** The kit has finished checking for a remembered connection */
  ready: boolean;
  authenticated: boolean;
  /** Wallets have no email; kept so screens can show it when there is one */
  email?: string;
  /** The connected wallet's Stellar address (G...) */
  stellarAddress?: string;
  /** Always false: wallets are not created for the user any more */
  creatingWallet: boolean;
  configured: boolean;
  /** Opens the wallet chooser. Resolves with the address, or nothing if the person closed it. */
  login: () => Promise<string | undefined>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  ready: true,
  authenticated: false,
  creatingWallet: false,
  configured: true,
  login: async () => undefined,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/** Free project id from cloud.reown.com. Lets mobile wallets (Varial, Freighter mobile, Lobstr) connect. */
const WALLETCONNECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

let kitStarted: Promise<void> | undefined;
function startKit(): Promise<void> {
  kitStarted ??= (async () => {
    const modules = defaultModules();
    if (WALLETCONNECT_ID) {
      // Loaded only when configured, because it is a large download.
      const { WalletConnectModule, WalletConnectTargetChain } = await import("@creit.tech/stellar-wallets-kit/modules/wallet-connect");
      modules.push(
        new WalletConnectModule({
          projectId: WALLETCONNECT_ID,
          allowedChains: [WalletConnectTargetChain.TESTNET],
          metadata: {
            name: "Lumecard",
            description: "Send crypto as a gift card",
            url: window.location.origin,
            icons: [`${window.location.origin}/logo.png`],
          },
        }),
      );
    }
    StellarWalletsKit.init({ modules, network: Networks.TESTNET });
  })();
  return kitStarted;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [address, setAddress] = useState<string>();
  const [authError, setAuthError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let offState = () => {};
    let offDisconnect = () => {};

    startKit()
      .then(async () => {
        if (cancelled) return;
        offState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (e) => setAddress(e.payload.address || undefined));
        offDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => setAddress(undefined));
        // Pick up a wallet connected on a previous visit.
        try {
          const { address } = await StellarWalletsKit.getAddress();
          if (!cancelled) setAddress(address || undefined);
        } catch {
          /* nothing remembered */
        }
      })
      .catch((e) => console.error("Wallet kit failed to start:", e))
      .finally(() => !cancelled && setReady(true));

    return () => {
      cancelled = true;
      offState();
      offDisconnect();
    };
  }, []);

  const login = useCallback(async () => {
    try {
      await startKit();
      const { address } = await StellarWalletsKit.authModal();
      setAddress(address || undefined);
      setAuthError(undefined);
      return address || undefined;
    } catch (e) {
      const msg = errorText(e);
      console.error("Wallet connect failed:", e);
      // Closing the window without choosing is not a problem.
      if (!/clos|cancel|dismiss|exit|abort/i.test(msg)) setAuthError(msg || "Could not connect to your wallet");
      return undefined;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } catch (e) {
      console.error("Wallet disconnect failed:", e);
    }
    setAddress(undefined);
  }, []);

  return (
    <AuthContext.Provider
      value={{ ready, authenticated: !!address, stellarAddress: address, creatingWallet: false, configured: true, login, logout }}
    >
      {children}
      {authError && (
        <div role="alert" className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-ink p-4 text-sm text-white">
          <p className="flex-1 break-words">
            <span className="block font-semibold">Wallet problem</span>
            <span className="mt-0.5 block text-white/80">{authError}</span>
          </p>
          <button onClick={() => setAuthError(undefined)} className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold">
            Close
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
}
