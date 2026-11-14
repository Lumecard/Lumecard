import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { AssetIcon } from "../components/AssetIcon";
import { getAsset } from "../data/assets";
import { MIX_FEE_BPS, MIX_PRESETS, type MixLeg } from "../chain/mix";
import { IS_TESTNET } from "../config/network";

export function IconStack({ legs }: { legs: MixLeg[] }) {
  return (
    <div className="flex -space-x-2">
      {legs.map((l) => (
        <AssetIcon key={l.token} asset={getAsset(l.token)!} size="sm" className="ring-2 ring-card" />
      ))}
    </div>
  );
}

export function Weights({ legs }: { legs: MixLeg[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-surface px-3 py-2.5 text-xs">
      {legs.map((l) => (
        <span key={l.token} className="text-neutral-600">
          <span className="font-semibold text-fg">{l.token.toUpperCase()}</span> {l.percent}%
        </span>
      ))}
    </div>
  );
}

export default function Mixes() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <main className="mx-auto max-w-[1080px] px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Mixes</h1>
        <p className="mt-2 max-w-xl text-neutral-600">
          Spend USDC and receive a blend of tokens in one go. One approval, and either every part happens or none does. You can also send a Mix to
          someone else's wallet.
        </p>
        <p className="mt-2 text-xs text-neutral-500">Mix fee: {(MIX_FEE_BPS / 100).toFixed(2)}% of the USDC you spend.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MIX_PRESETS.map((p) => (
            <div key={p.id} className="flex flex-col rounded-3xl bg-card p-5">
              <div className="flex items-center justify-between">
                <IconStack legs={p.legs} />
                <button
                  onClick={() => navigate(`/mix/${p.id}`)}
                  className="flex items-center gap-1 rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.25)]"
                >
                  Buy <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <h2 className="mt-5 text-xl font-semibold">{p.name}</h2>
              <p className="mt-1 text-sm text-neutral-600">
                {p.legs.length} tokens · {p.note}
              </p>
              <div className="mt-5">
                <Weights legs={p.legs} />
              </div>
            </div>
          ))}

          <button onClick={() => navigate("/mix/custom")} className="flex flex-col items-start rounded-3xl bg-card p-5 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-500">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl font-semibold">Build your own</h2>
            <p className="mt-1 text-sm text-neutral-600">Choose the share of each token yourself.</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-500">
              Start <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>

        {IS_TESTNET && (
          <p className="mt-8 text-xs text-neutral-500">
            This runs on the Stellar test network. Test EURC has almost no trading, so Mixes that include EURC may show no price there.
          </p>
        )}
      </main>
    </AppShell>
  );
}
