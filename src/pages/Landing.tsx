import { ArrowDownToLine, ArrowRight, Check, ChevronDown, Clock, Gift, KeyRound, Link2, Send, ShieldCheck, Wallet, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { useAuth } from "../auth/AuthProvider";
import { useConnectWallet } from "../components/ConnectWallet";
import { AssetIcon } from "../components/AssetIcon";
import { LogoMark } from "../components/Logo";
import { NETWORK } from "../config/network";
import { getAsset, type Asset } from "../data/assets";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-3px_0_rgba(0,0,0,0.18)]";
const SECONDARY_BTN =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-2px_0_rgba(0,0,0,0.35)]";

function Eyebrow({ children }: { children: string }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">{children}</p>;
}

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-balance text-3xl font-medium tracking-tight sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-neutral-600">{body}</p>}
    </div>
  );
}

/** A small, static picture of the real dashboard. Sample numbers, for show. */
function DashboardPreview() {
  const rows = [
    { id: "usdc", amount: "420.00", usd: "$420.00" },
    { id: "xlm", amount: "5,120.50", usd: "$862.30" },
    { id: "eurc", amount: "150.00", usd: "$165.00" },
  ];
  return (
    <div className="w-full rounded-[28px] bg-card p-4 text-left shadow-[0_40px_120px_-30px_rgba(228,86,12,0.35)] sm:p-5">
      <div className="rounded-2xl bg-gradient-to-br from-ink via-[#2a1a12] to-brand-700 p-5 text-white">
        <p className="text-xs text-white/60">Total balance</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">$1,447.30</p>
        <div className="mt-5 flex gap-2">
          {[
            { icon: Gift, label: "Gift" },
            { icon: ArrowDownToLine, label: "Deposit" },
            { icon: Send, label: "Send" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
              <Icon className="h-3.5 w-3.5" /> {label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 divide-y divide-white/5 rounded-2xl bg-surface">
        {rows.map((r) => {
          const a = getAsset(r.id)!;
          return (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <AssetIcon asset={a} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{a.name}</p>
                <p className="text-xs text-neutral-500">
                  {r.amount} {a.symbol}
                </p>
              </div>
              <p className="text-sm font-semibold">{r.usd}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniGiftCard({ asset, label, className }: { asset: Asset; label: string; className: string }) {
  return (
    <div className={`absolute hidden aspect-[1.6/1] sm:block w-[150px] rounded-xl bg-gradient-to-br p-3 text-white shadow-2xl sm:w-[190px] sm:p-4 ${asset.gradient} ${className}`}>
      <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-widest opacity-80 sm:text-[10px]">
        <span>Gift card</span>
        <span className="flex items-center gap-1 normal-case tracking-normal">
          <LogoMark className="h-3 w-3" /> Lumecard
        </span>
      </div>
      {asset.icon && <img src={asset.icon} alt="" draggable={false} className={`mt-2 h-9 w-9 rounded-full bg-[#0e0d12]/90 p-0.5 sm:mt-3 sm:h-11 sm:w-11`} />}
      <div className="absolute bottom-2.5 right-3 text-xs font-bold uppercase tracking-widest sm:bottom-3 sm:text-sm">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Wallet,
    title: "One balance, in plain view",
    body: "Connect your own Stellar wallet and see everything you hold in one place. XLM, USDC and EURC, priced in dollars.",
    points: ["Live balances from the network", "No account to create", "Your keys never leave your wallet"],
  },
  {
    icon: Gift,
    title: "Gift crypto with a link",
    body: "Lock an amount, add a message, and share a link. The recipient opens it on Lumecard and claims it into their own wallet.",
    points: ["Works for people with no wallet yet", "Unclaimed gifts expire and come back", "Track every gift you send"],
  },
  {
    icon: Send,
    title: "Send and receive, simply",
    body: "Deposit with your address, send to any Stellar wallet, and let Lumecard check the address and trustline before anything moves.",
    points: ["Clear errors, not raw codes", "Fees shown before you confirm", "Fast, low-cost Stellar payments"],
  },
];

const STEPS = [
  { n: "01", title: "Connect a wallet", body: "Use Freighter, xBull, Lobstr, Albedo and more. Nothing to sign up for." },
  { n: "02", title: "Choose what to do", body: "Deposit, send, or create a gift. Pick the token and the amount." },
  { n: "03", title: "Confirm in your wallet", body: "You approve each action yourself. Lumecard never holds your funds." },
];

const COMPARE: { other: string; ours: string }[] = [
  { other: "Gifts need the other person to share an address first", ours: "Share a link. They claim it, even with an empty wallet" },
  { other: "Funds sent to a wrong address are gone", ours: "Gifts sit in a smart contract and return to you if unclaimed" },
  { other: "Hidden fees you find out about later", ours: "One clear fee, 1.5% on gifts, shown before you confirm" },
  { other: "A new account and password for every app", ours: "Your wallet is your sign-in. No Lumecard account" },
];

const STATS = [
  { value: "1.5%", label: "Flat fee on gifts" },
  { value: "3", label: "Stellar tokens: XLM, USDC, EURC" },
  { value: "0", label: "Accounts or passwords to manage" },
];

const FAQ = [
  {
    q: "What is Lumecard?",
    a: "Lumecard is a front desk for crypto on the Stellar network. You can hold, deposit, send and gift XLM, USDC and EURC from one clean dashboard, using your own wallet.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. You connect a Stellar wallet such as Freighter or xBull. Lumecard does not store passwords and cannot move your funds.",
  },
  {
    q: "What happens if a gift is never claimed?",
    a: "Each gift has an expiry that you choose. After it passes, you can take the amount back from the Activity tab in your wallet panel.",
  },
  {
    q: "What does it cost?",
    a: "Gifts carry a 1.5% fee, paid by the sender and shown before you confirm. Normal Stellar network fees apply to every transaction and are very small.",
  },
  {
    q: "Is this live with real money?",
    a: NETWORK.isTestnet
      ? "Not yet. Lumecard currently runs on the Stellar test network, so the tokens have no real value. Use it to try everything safely."
      : "Yes. This runs on the live Stellar network, so the tokens have real value. Start with a small amount.",
  },
  {
    q: "Which wallets work?",
    a: "Browser wallets such as Freighter, xBull, Albedo, Hana and Rabet work today. Mobile wallets are being added.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const { openConnect } = useConnectWallet();

  const start = () => (authenticated ? navigate("/") : openConnect(() => navigate("/")));

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header landing />

      {/* Hero */}
      <section className="relative">
        <div aria-hidden className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[560px]" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="relative mx-auto max-w-[1140px] px-4 pb-8 pt-16 text-center sm:px-6 md:pt-24">
          <a href="#features" className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-neutral-700">
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">New</span>
            Live on the {NETWORK.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight sm:text-7xl">
            Web3 <span className="text-brand-500">FrontDesk</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-600">
            One front desk for your crypto. Hold, deposit, send and gift on Stellar, without the jargon.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={start} className={`${PRIMARY_BTN} w-full sm:w-auto`}>
              Open the app
            </button>
            <a href="#features" className={`${SECONDARY_BTN} w-full sm:w-auto`}>
              See what it does
            </a>
          </div>

          <div className="relative mx-auto mt-14 max-w-[560px] pb-10 md:max-w-[640px]">
            <DashboardPreview />
            <MiniGiftCard asset={getAsset("usdc")!} label="USDC" className="-left-2 -top-10 -rotate-[10deg] lg:-left-40 lg:top-6" />
            <MiniGiftCard asset={getAsset("xlm")!} label="Stellar" className="-bottom-2 -right-2 rotate-[8deg] lg:-right-40 lg:bottom-16" />
          </div>
        </div>
      </section>

      {/* Built on */}
      <section className="mx-auto max-w-[1140px] px-4 py-12 text-center sm:px-6">
        <p className="text-sm text-neutral-500">Built on the Stellar network</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {["xlm", "usdc", "eurc"].map((id) => {
            const a = getAsset(id)!;
            return (
              <div key={id} className="flex items-center gap-2.5 text-neutral-700">
                <AssetIcon asset={a} size="sm" />
                <span className="text-sm font-semibold">{a.symbol}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2.5 text-neutral-700">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold">Soroban smart contracts</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1140px] scroll-mt-16 px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="What it does" title="Everything at the front desk" body="The everyday things you do with crypto, in one calm place." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, points }) => (
            <div key={title} className="rounded-3xl bg-card p-6 sm:p-7">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-500">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</p>
              <ul className="mt-5 space-y-2.5">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 bg-surface/50">
        <div className="mx-auto max-w-[1140px] px-4 py-20 sm:px-6">
          <SectionTitle eyebrow="How it works" title="Three steps, no setup" />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl bg-card p-6 sm:p-7">
                <p className="font-mono text-sm text-brand-500">{s.n}</p>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Lumecard */}
      <section className="mx-auto max-w-[1140px] px-4 py-20 sm:px-6">
        <SectionTitle eyebrow="Why Lumecard" title="Crypto, without the sharp edges" />
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-card p-6 sm:p-7">
            <p className="text-sm font-semibold text-neutral-500">The usual way</p>
            <ul className="mt-5 space-y-4">
              {COMPARE.map((c) => (
                <li key={c.other} className="flex items-start gap-3 text-sm text-neutral-600">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" /> {c.other}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-ink via-[#2a1a12] to-brand-700 p-6 sm:p-7">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <LogoMark className="h-4 w-4" /> With Lumecard
            </p>
            <ul className="mt-5 space-y-4">
              {COMPARE.map((c) => (
                <li key={c.ours} className="flex items-start gap-3 text-sm text-white">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" /> {c.ours}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="mx-auto max-w-[1140px] px-4 pb-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-3xl bg-card p-6 text-center sm:p-8">
              <p className="text-5xl font-medium tracking-tight">{s.value}</p>
              <p className="mt-2 text-sm text-neutral-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built to be safe */}
      <section className="mx-auto max-w-[1140px] px-4 pb-20 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: KeyRound, title: "You hold the keys", body: "Every action is approved in your own wallet. Lumecard has no way to move your money." },
            { icon: Clock, title: "Gifts can come back", body: "Set an expiry. If nobody claims a gift in time, you take it back." },
            { icon: Link2, title: "No server in the middle", body: "Links, claims and refunds run on a smart contract, not on a company database." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-3xl bg-card p-6">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-16 px-4 pb-20 sm:px-6">
        <SectionTitle eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-card px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing call */}
      <section className="mx-auto max-w-[1140px] px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-ink via-[#2a1a12] to-brand-700 px-6 py-14 text-center sm:py-20">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-balance text-3xl font-medium tracking-tight sm:text-5xl">Your crypto, with a front desk.</h2>
            <p className="mx-auto mt-4 max-w-md text-white/70">Connect a wallet and try it {NETWORK.isTestnet ? "on the test network " : ""}in a minute.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={start} className={`${PRIMARY_BTN} w-full sm:w-auto`}>
                Open the app
              </button>
              <Link to="/guide" className={`${SECONDARY_BTN} w-full sm:w-auto`}>
                Read the guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1140px] flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Lumecard. Web3 FrontDesk.</span>
          <div className="flex gap-6">
            <a href="#features">Features</a>
            <a href="#faq">FAQ</a>
            <Link to="/guide" className="font-medium text-neutral-700">
              Guide
            </Link>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
