import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";

/**
 * "Connect wallet" for the rest of the app. The wallet chooser itself is Stellar Wallets Kit's own
 * window. Callers can pass `onConnected`, which runs once a wallet is connected (straight away
 * if one already is).
 */
type OnConnected = (address: string) => void;

const ConnectContext = createContext<{ openConnect: (onConnected?: OnConnected) => void }>({
  openConnect: () => {},
});
export const useConnectWallet = () => useContext(ConnectContext);

export function ConnectWalletProvider({ children }: { children: ReactNode }) {
  const { authenticated, stellarAddress, login } = useAuth();
  const pending = useRef<OnConnected | undefined>(undefined);

  // Once a wallet connects, continue what the person was doing.
  useEffect(() => {
    if (authenticated && stellarAddress && pending.current) {
      const cb = pending.current;
      pending.current = undefined;
      cb(stellarAddress);
    }
  }, [authenticated, stellarAddress]);

  const openConnect = (cb?: OnConnected) => {
    if (authenticated && stellarAddress) {
      cb?.(stellarAddress);
      return;
    }
    pending.current = cb;
    void login();
  };

  return <ConnectContext.Provider value={{ openConnect }}>{children}</ConnectContext.Provider>;
}
