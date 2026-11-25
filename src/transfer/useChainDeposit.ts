import { useCallback, useEffect, useState } from "react";
import { getDepositAddress, getUsdcAtAddress, registerWithRelayer, getTransfers, type DepositTransfer } from "./depositAddress";
import { CHAIN_DEPOSIT } from "./config";

/**
 * The deposit address on the other chain for a Stellar wallet, and any USDC that has arrived there and is waiting
 * to be moved to Stellar. Checks again every 15 seconds while the screen is open.
 */
export function useChainDeposit(stellarAddress: string | undefined) {
  const [address, setAddress] = useState<string>();
  const [waiting, setWaiting] = useState(0);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  // undefined: not asked yet or no relayer set. true: the relayer is watching this wallet. false: it did not answer.
  const [watching, setWatching] = useState<boolean>();
  const [transfers, setTransfers] = useState<DepositTransfer[]>([]);

  // Work out the deposit address once.
  useEffect(() => {
    if (!stellarAddress) return;
    let live = true;
    setLoading(true);
    setError(undefined);
    getDepositAddress(stellarAddress)
      .then((a) => live && setAddress(a))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Couldn't get your deposit address."))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [stellarAddress]);

  // Tell the relayer to watch this wallet, and keep telling it every minute while the page is open.
  useEffect(() => {
    if (!address || !stellarAddress || !CHAIN_DEPOSIT.relayerUrl) return;
    let live = true;
    const tell = () => registerWithRelayer(stellarAddress, address).then((ok) => live && setWatching(ok));
    tell();
    const t = setInterval(tell, 60_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [address, stellarAddress]);

  // Where each transfer stands (waiting for Circle, arrived, or stuck), asked every 10 seconds.
  useEffect(() => {
    if (!stellarAddress || !CHAIN_DEPOSIT.relayerUrl) return;
    let live = true;
    const ask = () => getTransfers(stellarAddress).then((t) => live && t && setTransfers(t));
    ask();
    const t = setInterval(ask, 10_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, [stellarAddress]);

  const check = useCallback(async () => {
    if (!address) return;
    try {
      setWaiting(await getUsdcAtAddress(address));
    } catch {
      /* a missed check is fine, the next one will catch up */
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;
    check();
    const t = setInterval(check, 15_000);
    return () => clearInterval(t);
  }, [address, check]);

  return { address, waiting, error, loading, watching, transfers };
}
