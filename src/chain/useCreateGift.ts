import { useCallback, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useBalances } from "./Balances";
import { createGiftWithPurse, friendlyError, type CreatedGift } from "./gift";
import { useWalletSigner } from "./walletSigner";

const DAY_SECONDS = 24 * 60 * 60;

/** Sends a real gift transaction, signed in the user's own wallet. */
export function useCreateGift() {
  const { stellarAddress } = useAuth();
  const { refresh } = useBalances();
  const sign = useWalletSigner();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const create = useCallback(
    async (p: { tokenId: string; amount: number; expiryDays: number; withPurse: boolean }): Promise<CreatedGift | null> => {
      if (!stellarAddress || !sign) {
        setError("Connect your wallet first");
        return null;
      }
      setBusy(true);
      setError(undefined);
      try {
        const gift = await createGiftWithPurse({
          sender: stellarAddress,
          tokenId: p.tokenId,
          amount: p.amount,
          expiresAt: Math.floor(Date.now() / 1000) + p.expiryDays * DAY_SECONDS,
          withPurse: p.withPurse,
          sign,
        });
        refresh(); // balances now reflect the gift and fee
        return gift;
      } catch (e) {
        console.error("Create gift failed", e);
        setError(friendlyError(e));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [stellarAddress, sign, refresh],
  );

  return { create, busy, error };
}
