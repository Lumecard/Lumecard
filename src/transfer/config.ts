import { CONFIG_ERRORS, IS_TESTNET } from "../config/network";

/**
 * Settings for bringing USDC in from another chain (see src/transfer/README.md).
 *
 * Only Base is supported today. Each chain is one row in CHAINS, so adding another later means adding a row
 * here (and in the deposit contract), not new code. The feature is optional: with no VITE_DEPOSIT_FACTORY it
 * is hidden and nothing else changes.
 */

const env = import.meta.env as Record<string, string | undefined>;

export type DepositChainId = "base" | "base-sepolia";

interface DepositChain {
  /** Full name, for example in warnings. */
  label: string;
  /** Short name, for buttons and titles. */
  name: string;
  chainId: number;
  rpc: string;
  /** Circle's USDC on that chain. */
  usdc: string;
  /** Which Stellar network this chain pairs with. A test chain is never paired with the live Stellar network. */
  testnet: boolean;
}

const CHAINS: Record<DepositChainId, DepositChain> = {
  "base-sepolia": {
    label: "Base Sepolia (test network)",
    name: "Base",
    chainId: 84532,
    rpc: "https://sepolia.base.org",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    testnet: true,
  },
  base: {
    label: "Base",
    name: "Base",
    chainId: 8453,
    rpc: "https://mainnet.base.org",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    testnet: false,
  },
};

const isAddress = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s);

const factory = (env.VITE_DEPOSIT_FACTORY ?? "").trim();
const enabled = factory !== "";

// The default chain follows the Stellar network.
const chainKey = ((env.VITE_DEPOSIT_CHAIN ?? "").trim() || (IS_TESTNET ? "base-sepolia" : "base")) as DepositChainId;

if (enabled) {
  if (!isAddress(factory)) CONFIG_ERRORS.push("VITE_DEPOSIT_FACTORY is not a valid address (0x followed by 40 characters)");
  if (!CHAINS[chainKey]) {
    CONFIG_ERRORS.push(`VITE_DEPOSIT_CHAIN must be one of: ${Object.keys(CHAINS).join(", ")} (it is "${chainKey}")`);
  } else if (CHAINS[chainKey].testnet !== IS_TESTNET) {
    CONFIG_ERRORS.push(
      IS_TESTNET
        ? "VITE_DEPOSIT_CHAIN must be a test chain while VITE_STELLAR_NETWORK is testnet"
        : "VITE_DEPOSIT_CHAIN must be a live chain while VITE_STELLAR_NETWORK is mainnet",
    );
  }
}

const chain = CHAINS[chainKey] ?? CHAINS["base-sepolia"];
const rpcOverride = (env.VITE_DEPOSIT_RPC_URL ?? "").trim();
// The relayer's server. The page asks it for the deposit address, which also tells it to watch that wallet.
// Without it the page still shows the address (worked out from the chain), but nothing sweeps it automatically.
const relayerUrl = (env.VITE_DEPOSIT_RELAYER_URL ?? "").trim().replace(/\/+$/, "");
if (enabled && rpcOverride && !/^https:\/\/\S+$/.test(rpcOverride)) CONFIG_ERRORS.push("VITE_DEPOSIT_RPC_URL must be an https address");
// http is allowed only for a relayer running on your own computer.
if (enabled && relayerUrl && !/^(https:\/\/\S+|http:\/\/localhost(:\d+)?)$/.test(relayerUrl)) {
  CONFIG_ERRORS.push("VITE_DEPOSIT_RELAYER_URL must be an https address (http://localhost is allowed for testing)");
}

export const CHAIN_DEPOSIT = {
  /** False when no factory is configured: the Deposit window then does not offer this option. */
  enabled,
  factory,
  chainKey,
  /** "Base" */
  name: chain.name,
  /** "Base Sepolia (test network)" */
  label: chain.label,
  chainId: chain.chainId,
  rpcUrl: rpcOverride || chain.rpc,
  /** Empty when no relayer server is set. */
  relayerUrl,
  usdc: chain.usdc,
  /** The contract ignores anything smaller, so the screen says so. Matches the contract (3 USDC). */
  minUsdc: 3,
  /** Typical wait for Circle to approve a standard transfer, shown to the person depositing. */
  waitMinutes: "20 to 25",
};
