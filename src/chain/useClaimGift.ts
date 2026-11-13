import { useCallback, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useBalances } from "./Balances";
import { claimGiftOnChain, friendlyError } from "./gift";
import { useWalletSigner } from "./walletSigner";

/** Claims a gift into the connected wallet, signed in that wallet. */
export function useClaimGift() {
  const { stellarAddress } = useAuth();
  const { refresh } = useBalances();
  const sign = useWalletSigner();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const claim = useCallback(
    async (secret: string): Promise<string | null> => {
      if (!stellarAddress || !sign) {
        setError("Connect your wallet first");
        return null;
      }
      setBusy(true);
      setError(undefined);
      try {
        const { txHash } = await claimGiftOnChain({ recipient: stellarAddress, secret, sign });
        refresh(); // the gift is now in the wallet
        return txHash;
      } catch (e) {
        console.error("Claim failed", e);
        setError(friendlyError(e));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [stellarAddress, sign, refresh],
  );

  return { claim, busy, error };
}
