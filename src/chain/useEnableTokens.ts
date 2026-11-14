import { useCallback, useState } from "react";
import { Asset, BASE_FEE, Horizon, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { useAuth } from "../auth/AuthProvider";
import { HORIZON_URL, useBalances } from "./Balances";
import { NETWORK } from "../config/network";
import { friendlyError } from "./gift";
import { useWalletSigner } from "./walletSigner";

/**
 * Lets the user's wallet opt in to USDC and EURC ("trustlines").
 * On Stellar an account can't hold a token until it opts in, and the opt-in
 * has to be signed by the account itself, so the wallet signs it.
 *
 * Issuers come from config/network.ts.
 */
const TRUSTLINE_ASSETS = [new Asset("USDC", NETWORK.tokenIssuers.usdc), new Asset("EURC", NETWORK.tokenIssuers.eurc)];

export function useEnableTokens() {
  const { stellarAddress } = useAuth();
  const { amounts, funded, refresh } = useBalances();
  const sign = useWalletSigner();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  // Which of USDC / EURC the account has not opted in to yet.
  const missing = TRUSTLINE_ASSETS.filter((a) => amounts[a.code.toLowerCase()] === undefined);

  /**
   * Opt in to the missing tokens. Pass `only` (e.g. ["USDC"]) to enable just those: each opt-in locks
   * 0.5 XLM in the wallet, so a new wallet should only enable the one token it needs.
   */
  const enable = useCallback(
    async (only?: string[]) => {
      const targets = only ? missing.filter((a) => only.includes(a.code)) : missing;
      if (!stellarAddress || !sign || targets.length === 0) return;
      setBusy(true);
      setError(undefined);
      try {
        const server = new Horizon.Server(HORIZON_URL);
        const account = await server.loadAccount(stellarAddress);

        const builder = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK.passphrase });
        for (const asset of targets) builder.addOperation(Operation.changeTrust({ asset }));
        const tx = builder.setTimeout(120).build();

        const signed = TransactionBuilder.fromXDR(await sign(tx.toXDR()), NETWORK.passphrase);
        await server.submitTransaction(signed);
        refresh();
      } catch (e) {
        console.error("Enable tokens failed", e);
        setError(friendlyError(e));
      } finally {
        setBusy(false);
      }
    },
    [stellarAddress, sign, missing, refresh],
  );

  return { missing: missing.map((a) => a.code), enable, busy, error, canEnable: funded && !!stellarAddress };
}
