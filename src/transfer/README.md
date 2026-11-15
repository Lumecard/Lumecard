# transfer: bring USDC in from another chain

Everything about depositing USDC from another chain into a Lumecard (Stellar) wallet lives in this folder.
Base is the only chain today. Other chains are added as rows, not as new code.

## How it works

1. Every Stellar wallet has its own deposit address on the other chain. It belongs to the **deposit
   factory** contract (`base-deposit/contracts/StellarDeposit.sol`). The address is worked out from the
   Stellar address, so it exists before anything is deployed there.
2. Someone sends USDC to that address on the other chain.
3. The **relayer** (`base-deposit/relayer`) notices, tells the contract to sweep it through Circle's CCTP
   bridge, waits for Circle, and finishes the delivery on Stellar.

This folder is only the website side: it shows the address and a QR code, and watches for the USDC to
arrive. It never holds keys and never sends anything.

## Files

| File | What it does |
|---|---|
| `config.ts` | Settings, and the table of supported chains. The feature is hidden unless `VITE_DEPOSIT_FACTORY` is set. |
| `depositAddress.ts` | Reads the deposit address and the waiting USDC from the chain (plain JSON-RPC, no library). |
| `useChainDeposit.ts` | React hook: gets the address, then re-checks the waiting USDC every 15 seconds. |
| `QrCode.tsx` | A real, scannable QR code. Also used for the plain Stellar deposit. |
| `ChainDeposit.tsx` | The "USDC from ..." screen shown in the Deposit window. |
| `index.ts` | What other parts of the app import. |

## Settings (client/.env, see .env.example)

- `VITE_DEPOSIT_FACTORY` the factory contract. Leave empty to hide the feature.
- `VITE_DEPOSIT_CHAIN` `base-sepolia` (default on testnet) or `base` (default on mainnet).
- `VITE_DEPOSIT_RPC_URL` optional, an https address for a node. The public ones are rate limited.

A test chain can't be paired with the live Stellar network (or the other way round): the app refuses to
start and says so.

## Adding another chain later

1. Add its row to `CHAINS` in `config.ts` (name, chain id, RPC address, Circle's USDC address).
2. Add it to the factory contract's chain list, deploy, and run a relayer for it.
3. Add a chain picker to `ChainDeposit.tsx`.
