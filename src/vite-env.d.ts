/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STELLAR_NETWORK?: string;
  readonly VITE_HORIZON_URL?: string;
  readonly VITE_SOROBAN_RPC_URL?: string;
  readonly VITE_GIFT_CONTRACT?: string;
  readonly VITE_XLM_CONTRACT?: string;
  readonly VITE_USDC_CONTRACT?: string;
  readonly VITE_EURC_CONTRACT?: string;
  readonly VITE_USDC_ISSUER?: string;
  readonly VITE_EURC_ISSUER?: string;
  readonly VITE_FEE_ADDRESS?: string;
  readonly VITE_DEPOSIT_FACTORY?: string;
  readonly VITE_DEPOSIT_CHAIN?: string;
  readonly VITE_DEPOSIT_RPC_URL?: string;
  readonly VITE_DEPOSIT_RELAYER_URL?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
