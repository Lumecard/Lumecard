import { useEffect, useState } from "react";
import { ArrowDownLeft, ExternalLink, Gift, TrendingUp } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { fmtAmount, fmtUsd, useBalances } from "../chain/Balances";
import { AssetIcon } from "../components/AssetIcon";
import { useDeposit } from "../components/DepositModal";
import { DESCRIPTIONS, fmtPrice, getAsset } from "../data/assets";

const RANGES = ["1D", "1W", "1M", "1Y", "All"] as const;

const GECKO_ID: Record<string, string> = { xlm: "stellar", usdc: "usd-coin", eurc: "euro-coin" };
const DAYS: Record<(typeof RANGES)[number], string> = { "1D": "1", "1W": "7", "1M": "30", "1Y": "365", All: "max" };

type Point = [number, number]; // [time ms, USD price]
const cache = new Map<string, Point[]>();

/** Real prices from CoinGecko's public API, called straight from the browser. */
function usePrices(assetId: string, range: (typeof RANGES)[number]) {
  const key = `${assetId}:${range}`;
  const [state, setState] = useState<{ key: string; data?: Point[]; failed?: boolean }>({ key });
  useEffect(() => {
    const hit = cache.get(key);
    if (hit) return setState({ key, data: hit });
    let live = true;
    setState({ key });
    fetch(`https://api.coingecko.com/api/v3/coins/${GECKO_ID[assetId]}/market_chart?vs_currency=usd&days=${DAYS[range]}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { prices: Point[] }) => {
        cache.set(key, j.prices);
        if (live) setState({ key, data: j.prices });
      })
      .catch(() => live && setState({ key, failed: true }));
    return () => {
      live = false;
    };
  }, [key, assetId, range]);
  return state.key === key ? state : { key };
}

const fmtDate = (t: number, range: (typeof RANGES)[number]) =>
  new Date(t).toLocaleString(undefined, range === "1D" || range === "1W" ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" });

function Chart({ data, range }: { data: Point[]; range: (typeof RANGES)[number] }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 600;
  const h = 200;
  const vals = data.map((p) => p[1]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - ((v - min) / (max - min || 1)) * (h - 16) - 8]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const at = hover === null ? data.length - 1 : hover;
  return (
    <div>
      <p className="mb-2 text-sm text-neutral-500">
        <span className="font-semibold text-fg">{fmtPrice(data[at][1])}</span> · {fmtDate(data[at][0], range)}
      </p>
      <div
        className="relative"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(((e.clientX - r.left) / r.width) * (data.length - 1)))));
        }}
      >
        <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#fill)" />
          <path d={line} fill="none" stroke="var(--color-brand-600)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        {hover !== null && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-px bg-white/20" style={{ left: `${(hover / (data.length - 1)) * 100}%` }} />
            <div
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500"
              style={{ left: `${(hover / (data.length - 1)) * 100}%`, top: `${(pts[hover][1] / h) * 100}%` }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function TokenPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { openDeposit } = useDeposit();
  const [range, setRange] = useState<(typeof RANGES)[number]>("1M");
  const balances = useBalances();
  const asset = getAsset(id);
  const prices = usePrices(asset?.id ?? "", range);
  if (!asset) return <Navigate to="/app" replace />;

  const held = balances.amounts[asset.id] ?? 0;

  return (
    <div className="min-h-screen bg-[#0e0d12]">
      <Header signedIn />
      <main className="mx-auto max-w-[1080px] px-4 pb-16 pt-6 sm:px-6">

        <section className="rounded-3xl bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-5">
              <AssetIcon asset={asset} size="lg" className="!rounded-full" />
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {asset.name} <span className="text-lg font-normal text-neutral-400">{asset.symbol}</span>
                </h1>
                <p className="mt-1 flex items-center gap-2 text-neutral-600">
                  {fmtPrice(asset.price)}
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-neutral-600">
                    <TrendingUp className="h-3 w-3" /> 24h
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={openDeposit}
                className="flex h-14 w-28 flex-col items-center justify-center gap-1 rounded-2xl border border-neutral-200 text-xs font-medium hover:bg-neutral-50"
              >
                <ArrowDownLeft className="h-4 w-4" /> Buy
              </button>
              <button
                onClick={() => navigate(`/app/gifts/create?asset=${asset.id}`)}
                className="flex h-14 w-28 flex-col items-center justify-center gap-1 rounded-2xl bg-brand-600 text-xs font-medium text-white hover:bg-brand-700"
              >
                <Gift className="h-4 w-4" /> Gift
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface p-4">
              <p className="text-sm text-neutral-500">Your balance</p>
              <p className="mt-1 text-2xl font-semibold">
                {fmtUsd(held * asset.price)}{" "}
                <span className="text-base font-normal text-neutral-400">
                  ({fmtAmount(held)} {asset.symbol})
                </span>
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-4">
              <p className="text-sm text-neutral-500">About</p>
              <p className="mt-1 text-sm text-neutral-700">{DESCRIPTIONS[asset.id]}</p>
              <a href="#" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
                View project <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Price</h2>
            <div className="flex gap-1 rounded-full bg-surface p-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${range === r ? "bg-card text-fg ring-1 ring-neutral-200" : "text-neutral-500"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            {prices.data ? (
              <Chart data={prices.data} range={range} />
            ) : (
              <div className="grid h-52 place-items-center text-sm text-neutral-500">
                {prices.failed ? "Couldn't load prices. Try again in a moment." : "Loading prices…"}
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-neutral-400">Prices from CoinGecko.</p>
        </section>
      </main>
    </div>
  );
}
