import { useCallback } from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { NETWORK } from "../config/network";
import { useAuth } from "../auth/AuthProvider";
import type { SignTx } from "./gift";

/**
 * Signs transactions in the user's connected wallet. The wallet shows the transaction and the
 * person approves it there; nothing is signed without that. Returns null until a wallet is connected.
 */
export function useWalletSigner(): SignTx | null {
  const { stellarAddress } = useAuth();
  const sign = useCallback<SignTx>(
    async (txXdr) => {
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: NETWORK.passphrase,
        address: stellarAddress,
      });
      return signedTxXdr;
    },
    [stellarAddress],
  );
  return stellarAddress ? sign : null;
}
