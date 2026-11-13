import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Header } from "../components/Header";

/**
 * Helper page: a start-to-finish guide for building your own app on Stellar,
 * all from the command line. Public, no sign-in. Code is written with String.raw
 * so backslashes (line continuations) show exactly as typed.
 */

function Code({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const text = code.replace(/^\n/, "").replace(/\s+$/, "");
  return (
    <div className="my-4 min-w-0 overflow-hidden rounded-2xl bg-ink">
      <div className="flex justify-end px-2 pt-2">
        <button
          onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => {})}
          className="inline-flex h-7 items-center gap-1.5 rounded-full bg-neutral-700 px-3 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-2px_0_rgba(0,0,0,0.35)]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 pb-4 pt-2 text-[13px] leading-relaxed text-neutral-100">
        <code>{text}</code>
      </pre>
    </div>
  );
}

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-neutral-200 py-10">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Step {n}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

const P = ({ children }: { children: ReactNode }) => <p>{children}</p>;

const Mono = ({ children }: { children: ReactNode }) => (
  <code className="rounded-md bg-surface px-1.5 py-0.5 text-[13px] text-ink">{children}</code>
);

function Note({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-neutral-800">{children}</div>;
}

const TOC = [
  ["install", "Install the tools"],
  ["project", "Create the project"],
  ["wallet", "Make a wallet and get test money"],
  ["deploy", "Test, build and deploy the sample"],
  ["contract", "Write your own contract"],
  ["tokens", "Test tokens from the command line"],
  ["upgrade", "Upgrade a contract and keep it alive"],
  ["web", "Add it to a web app"],
  ["online", "Put the web app online"],
  ["example", "The example in this project"],
];

export default function Guide() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Header />
      <main className="mx-auto max-w-[760px] px-4 pb-24 pt-10 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">Guide</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Build your own app on Stellar</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-neutral-700">
          A start-to-finish guide, all from the command line: set up your tools, write a smart contract, get free test money, build, test,
          deploy, and connect it to a web app. Everything runs on the Stellar test network, so nothing here costs real money.
        </p>

        <nav aria-label="On this page" className="mt-6 rounded-2xl bg-surface p-4">
          <p className="text-sm font-semibold">On this page</p>
          <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {TOC.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`} className="text-neutral-700 underline-offset-2 hover:underline">
                  {i + 1}. {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8">
          <Section id="install" n="1" title="Install the tools">
            <P>One time only. You need Rust (contracts are written in it), the Stellar command line tool, and Node.js 20 or newer for the web app.</P>
            <P>
              Get Rust from <Mono>rustup.rs</Mono> and Node.js from <Mono>nodejs.org</Mono>. Then:
            </P>
            <Code
              code={String.raw`
rustup update stable
rustup target add wasm32v1-none
`}
            />
            <P>Install the Stellar command line tool:</P>
            <Code
              code={String.raw`
winget install --id Stellar.StellarCLI          (Windows)
brew install stellar-cli                        (Mac)
cargo install --locked stellar-cli              (any system, slower)
`}
            />
            <P>Check everything is there:</P>
            <Code
              code={String.raw`
rustc --version          must be 1.84 or higher
stellar --version
node --version
`}
            />
          </Section>

          <Section id="project" n="2" title="Create the project">
            <Code
              code={String.raw`
stellar contract init my-app
cd my-app
`}
            />
            <P>
              This makes a ready-to-run project with a sample contract called <Mono>hello-world</Mono>. The contract is in{" "}
              <Mono>contracts/hello-world/src/lib.rs</Mono> and its tests are next to it in <Mono>test.rs</Mono>.
            </P>
          </Section>

          <Section id="wallet" n="3" title="Make a wallet and get free test money">
            <P>The faucet is built into the command line tool. No website is needed.</P>
            <Code
              code={String.raw`
stellar keys generate dev --network testnet --fund
stellar keys address dev
`}
            />
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <Mono>dev</Mono> is just a name. The command creates a wallet and fills it with 10,000 test XLM.
              </li>
              <li>
                The secret key is saved on your computer in <Mono>~/.config/stellar/identity/dev.toml</Mono>. Never share that file.
              </li>
              <li>
                More test XLM later: <Mono>stellar keys fund dev --network testnet</Mono>
              </li>
              <li>
                List your wallets: <Mono>stellar keys ls</Mono>
              </li>
            </ul>
            <P>Check that the network is reachable:</P>
            <Code code={String.raw`stellar network health --network testnet`} />
          </Section>

          <Section id="deploy" n="4" title="Test, build and deploy the sample">
            <Code
              code={String.raw`
cargo test
stellar contract build
`}
            />
            <P>
              The built file is <Mono>target/wasm32v1-none/release/hello_world.wasm</Mono>. Deploy it:
            </P>
            <Code
              code={String.raw`
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source-account dev \
  --network testnet \
  --alias hello
`}
            />
            <P>
              It prints the contract address, which starts with <Mono>C</Mono>. The <Mono>--alias</Mono> lets you use the short name{" "}
              <Mono>hello</Mono> instead. Call it:
            </P>
            <Code code={String.raw`stellar contract invoke --id hello --source-account dev --network testnet -- hello --to world`} />
            <P>You should see the words Hello and world. The whole pipeline works.</P>
          </Section>

          <Section id="contract" n="5" title="Write your own contract">
            <P>Add a second contract to the same project. This one counts:</P>
            <Code code={String.raw`stellar contract init . --name counter`} />
            <P>
              Replace <Mono>contracts/counter/src/lib.rs</Mono> with:
            </P>
            <Code
              code={String.raw`
#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

const COUNT: Symbol = symbol_short!("COUNT");

#[contract]
pub struct CounterContract;

#[contractimpl]
impl CounterContract {
    pub fn increment(env: Env) -> u32 {
        let mut n: u32 = env.storage().instance().get(&COUNT).unwrap_or(0);
        n += 1;
        env.storage().instance().set(&COUNT, &n);
        env.storage().instance().extend_ttl(50, 100);
        n
    }

    pub fn get(env: Env) -> u32 {
        env.storage().instance().get(&COUNT).unwrap_or(0)
    }
}

mod test;
`}
            />
            <P>
              Replace <Mono>contracts/counter/src/test.rs</Mono> with:
            </P>
            <Code
              code={String.raw`
#![cfg(test)]
use crate::{CounterContract, CounterContractClient};
use soroban_sdk::Env;

#[test]
fn counts_up() {
    let env = Env::default();
    let id = env.register(CounterContract, ());
    let client = CounterContractClient::new(&env, &id);
    assert_eq!(client.increment(), 1);
    assert_eq!(client.increment(), 2);
    assert_eq!(client.get(), 2);
}
`}
            />
            <P>Test, build, deploy and call it:</P>
            <Code
              code={String.raw`
cargo test
stellar contract build

stellar contract deploy \
  --wasm target/wasm32v1-none/release/counter.wasm \
  --source-account dev --network testnet --alias counter

stellar contract invoke --id counter --source-account dev --network testnet -- increment
stellar contract invoke --id counter --source-account dev --network testnet -- increment
stellar contract invoke --id counter --source-account dev --network testnet -- get
`}
            />
            <P>You should see 1, then 2, then 2.</P>
            <Note>
              A call that only reads (<Mono>get</Mono>) is free and answers at once. A call that changes something (<Mono>increment</Mono>) is a real
              transaction and costs a tiny fee in test XLM.
            </Note>
          </Section>

          <Section id="tokens" n="6" title="Test tokens from the command line">
            <P>If your contract handles tokens, make your own test token. Everything stays on the command line.</P>
            <Code
              code={String.raw`
stellar keys generate issuer --network testnet --fund

stellar contract asset deploy \
  --asset TESTUSD:$(stellar keys address issuer) \
  --source-account dev --network testnet
`}
            />
            <P>The second command prints the token's contract address. Now give your wallet some:</P>
            <Code
              code={String.raw`
stellar tx new change-trust --source-account dev --line TESTUSD:$(stellar keys address issuer) --network testnet

stellar tx new payment --source-account issuer --destination $(stellar keys address dev) \
  --asset TESTUSD:$(stellar keys address issuer) --amount 1000000000 --network testnet
`}
            />
            <P>
              Amounts are in the smallest unit, with 7 decimals, so <Mono>1000000000</Mono> is 100 tokens.
            </P>
            <Note>
              Real USDC and EURC for testing come from Circle's web faucet at <Mono>faucet.circle.com</Mono>. That is the one step that is not a
              command.
            </Note>
          </Section>

          <Section id="upgrade" n="7" title="Upgrade a contract and keep it alive">
            <P>
              A contract can be changed later without losing its address or its data, as long as you add an upgrade function that only an admin can
              call. The Lumecard contract in this project is an example.
            </P>
            <Code
              code={String.raw`
cargo test
stellar contract build
stellar contract upload --wasm target/wasm32v1-none/release/counter.wasm --source-account dev --network testnet
stellar contract invoke --id counter --source-account dev --network testnet -- upgrade --new_wasm_hash THE_HASH_IT_PRINTED
`}
            />
            <P>Stellar charges rent to keep stored data alive. Extend it before it runs out, for example by 90 days:</P>
            <Code
              code={String.raw`
stellar contract extend --id counter --durability persistent --ledgers-to-extend 1555200 --source-account dev --network testnet
`}
            />
          </Section>

          <Section id="web" n="8" title="Add it to a web app">
            <P>The command line tool writes the web code for you. It generates a ready-made TypeScript package that matches your contract.</P>
            <Code
              code={String.raw`
stellar contract bindings typescript \
  --network testnet \
  --contract-id counter \
  --output-dir ./counter-client \
  --overwrite

cd counter-client
npm install
npm run build
cd ..
`}
            />
            <P>Create the web app and add the package:</P>
            <Code
              code={String.raw`
npm create vite@latest web -- --template react-ts
cd web
npm install
npm install @stellar/stellar-sdk ../counter-client
`}
            />
            <P>
              Use it, for example in <Mono>web/src/App.tsx</Mono>:
            </P>
            <Code
              code={String.raw`
import { useState } from "react";
import { Client } from "counter-client";

const client = new Client({
  contractId: "PASTE_THE_CONTRACT_ADDRESS_HERE",
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
  publicKey: "PASTE_A_WALLET_ADDRESS_HERE",
});

export default function App() {
  const [count, setCount] = useState<number>();

  async function read() {
    const tx = await client.get(); // a read: free, needs no signing
    setCount(tx.result);
  }

  return (
    <div>
      <button onClick={read}>Read the count</button>
      <p>{count}</p>
    </div>
  );
}
`}
            />
            <P>Run it:</P>
            <Code code={String.raw`npm run dev`} />
            <Note>
              Changing data needs a signature. For a call like <Mono>increment</Mono>, the user's wallet must sign the transaction. Pass a{" "}
              <Mono>signTransaction</Mono> function when you create the client, then call <Mono>await tx.signAndSend()</Mono>. For wallets you can use{" "}
              <Mono>@creit.tech/stellar-wallets-kit</Mono> (Freighter, xBull, Lobstr and others) or Privy for email sign-in, which this project uses.
              The generated <Mono>counter-client/README.md</Mono> shows the exact calls for your contract.
            </Note>
            <P>When you deploy a new contract, paste its new address into the client. Keep it in one place, for example a config file.</P>
          </Section>

          <Section id="online" n="9" title="Put the web app online">
            <ol className="list-decimal space-y-1 pl-5">
              <li>Push the project to GitHub.</li>
              <li>Import the repository in Vercel (or Netlify) and point it at the web app folder.</li>
              <li>
                Add any environment variables. In Vite they must start with <Mono>VITE_</Mono>.
              </li>
              <li>Deploy.</li>
              <li>
                If the app has several addresses, add a <Mono>vercel.json</Mono> so direct links do not show a 404:
              </li>
            </ol>
            <Code code={String.raw`{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`} />
          </Section>

          <Section id="example" n="10" title="The example in this project: Lumecard">
            <P>
              Lumecard is a finished app built this way: a sender locks USDC, EURC or XLM in a contract and shares a link, and the person who opens it
              claims the gift into their own wallet.
            </P>
            <Code
              code={String.raw`
Lumecard/
  client/     the web app (React, Vite, Tailwind, Privy sign-in)
  lumecard/   the contract (Rust) and its testnet settings
`}
            />
            <P>Run the web app:</P>
            <Code
              code={String.raw`
git clone https://github.com/NileDex/Lumecard.git
cd Lumecard/client
npm install
copy .env.example .env.local          (Windows)  or  cp .env.example .env.local
npm run dev
`}
            />
            <P>
              Put your Privy IDs in <Mono>.env.local</Mono> first (free at <Mono>dashboard.privy.io</Mono>, and add{" "}
              <Mono>http://localhost:5173</Mono> to the allowed origins):
            </P>
            <Code
              code={String.raw`
VITE_PRIVY_APP_ID=your-privy-app-id
VITE_PRIVY_CLIENT_ID=your-privy-client-id      (optional)
`}
            />
            <P>Test and build the contract:</P>
            <Code
              code={String.raw`
cd ../lumecard
cargo test
stellar contract build
`}
            />
            <P>
              The contract address the web app uses is set in <Mono>client/src/chain/gift.ts</Mono> (<Mono>GIFT_CONTRACT</Mono>), and recorded in{" "}
              <Mono>lumecard/deployments/testnet.json</Mono>.
            </P>
            <Note>
              This is testnet only. Real money needs an outside review of the contract, a protected admin account that needs several keys, the real
              USDC and EURC addresses from Circle, and the network settings changed in the web app.
            </Note>
          </Section>
        </div>
      </main>
    </div>
  );
}
