import { Networks, StrKey } from "@stellar/stellar-sdk";

/**
 * Every network-specific value lives here, and comes from environment variables (see .env.example).
 *
 * VITE_STELLAR_NETWORK=testnet (the default) works with no other setting.
 * VITE_STELLAR_NETWORK=mainnet refuses to start until every value below is set, so a missing
 * address can never silently fall back to a test one.
 */

const env = import.meta.env as Record<string, string | undefined>;

export type NetworkName = "testnet" | "mainnet";

/** Problems found in the settings. Anything in here stops the app and is shown on screen. */
export const CONFIG_ERRORS: string[] = [];

const rawName = (env.VITE_STELLAR_NETWORK ?? "testnet").trim().toLowerCase();
if (rawName !== "testnet" && rawName !== "mainnet") {
  CONFIG_ERRORS.push(`VITE_STELLAR_NETWORK must be "testnet" or "mainnet" (it is "${rawName}")`);
}
const name: NetworkName = rawName === "mainnet" ? "mainnet" : "testnet";
const isTestnet = name === "testnet";

/** Test network values. Used only when VITE_STELLAR_NETWORK is testnet and the variable is not set. */
const TESTNET = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  sorobanRpcUrl: "https://soroban-testnet.stellar.org",
  giftContract: "CAWLQGYB74K7RE7ILXR7CODLC57NEH6H3XREPBRFKJBW562ONCE2643T",
  xlmContract: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  usdcContract: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  eurcContract: "CCUUDM434BMZMYWYDITHFXHDMIVTGGD6T2I5UKNX5BSLXLW7HVR4MCGZ",
  usdcIssuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  eurcIssuer: "GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO",
  feeAddress: "GBVATCX6JPNL5CCDUWMDTIW74LAH72WAR25G5W762H2TLRSYXB4BTPV5",
};

/** The one public default for mainnet: the Stellar Development Foundation's Horizon. */
const MAINNET_HORIZON = "https://horizon.stellar.org";

type Check = "url" | "contract" | "account";

function value(key: string, check: Check, testnetValue: string, mainnetValue = ""): string {
  const given = env[key]?.trim();
  const v = given || (isTestnet ? testnetValue : mainnetValue);
  if (!v) {
    CONFIG_ERRORS.push(`${key} is not set`);
    return "";
  }
  const ok =
    check === "url"
      ? /^https:\/\/[^\s]+$/.test(v)
      : check === "contract"
        ? StrKey.isValidContract(v)
        : StrKey.isValidEd25519PublicKey(v);
  if (!ok) {
    CONFIG_ERRORS.push(`${key} is not a valid ${check === "url" ? "https address" : check === "contract" ? "contract id (starts with C)" : "account (starts with G)"}`);
  }
  return v;
}

const feeAddress = value("VITE_FEE_ADDRESS", "account", TESTNET.feeAddress);

export const NETWORK = {
  name,
  isTestnet,
  /** Shown in the interface, e.g. "Stellar test network". */
  label: isTestnet ? "Stellar test network" : "Stellar",
  passphrase: isTestnet ? Networks.TESTNET : Networks.PUBLIC,
  horizonUrl: value("VITE_HORIZON_URL", "url", TESTNET.horizonUrl, MAINNET_HORIZON),
  sorobanRpcUrl: value("VITE_SOROBAN_RPC_URL", "url", TESTNET.sorobanRpcUrl),
  giftContract: value("VITE_GIFT_CONTRACT", "contract", TESTNET.giftContract),
  tokenContracts: {
    xlm: value("VITE_XLM_CONTRACT", "contract", TESTNET.xlmContract),
    usdc: value("VITE_USDC_CONTRACT", "contract", TESTNET.usdcContract),
    eurc: value("VITE_EURC_CONTRACT", "contract", TESTNET.eurcContract),
  } as Record<string, string>,
  tokenIssuers: {
    usdc: value("VITE_USDC_ISSUER", "account", TESTNET.usdcIssuer),
    eurc: value("VITE_EURC_ISSUER", "account", TESTNET.eurcIssuer),
  } as Record<string, string>,
  /** Lumecard's wallet: receives the Mix fee, and is the funded account used for read-only calls. */
  feeAddress,
  /** Free test XLM. Only exists on the test network. */
  friendbotUrl: isTestnet ? "https://friendbot.stellar.org" : null,
  /** Link to a transaction on a public explorer. */
  explorerTx: (hash: string) => `https://stellar.expert/explorer/${isTestnet ? "testnet" : "public"}/tx/${encodeURIComponent(hash)}`,
};

export const IS_TESTNET = NETWORK.isTestnet;
export const explorerTx = NETWORK.explorerTx;
