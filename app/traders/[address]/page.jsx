"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "../../../components/Spinner";

const API_KEY_STORAGE = "pm_whale_tracker_api_key";

const CATEGORY_COLORS = {
  Politics: "#f0475a",
  Crypto: "#f5b942",
  Sports: "#3ee6a8",
  AI: "#7c8cff",
  Finance: "#42c8f5",
  Other: "#6b7280",
};

function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function TraderProfilePage({ params }) {
  const { address } = params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const apiKey = localStorage.getItem(API_KEY_STORAGE) || "";
        const res = await fetch(`/api/trader/${address}`, {
          headers: apiKey ? { "x-api-key": apiKey } : {},
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load this trader.");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  const maxCount = data?.categoryBreakdown?.length
    ? Math.max(...data.categoryBreakdown.map((c) => c.count))
    : 1;

  return (
    <main className="min-h-screen min-h-dvh safe-top safe-bottom pb-10">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-base-950/80 border-b border-base-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/traders" className="w-9 h-9 rounded-full bg-base-800 border border-base-700 flex items-center justify-center text-base-300" aria-label="Back">
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight leading-none truncate">
              Trader Profile
            </h1>
            <p className="text-[11px] text-base-500 font-mono mt-1 truncate">{address}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-base-400">
            <Spinner size={16} /> Pulling live account data…
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-400">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {!data.dataAvailable && (
              <div className="mt-5 rounded-xl border border-base-700 bg-base-850/50 p-3 text-xs text-base-400">
                Polymarket returned no public position/activity data for this
                wallet right now — figures below may be incomplete.
              </div>
            )}

            {/* Stat grid — real numbers from the API */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <StatCard
                label="30-Day Profit"
                value={money(data.stats.profit30d)}
                positive={data.stats.profit30d >= 0}
              />
              <StatCard label="Trades (30d)" value={data.stats.trades30d} />
              <StatCard label="Open Positions" value={data.stats.openPositions} />
              <StatCard label="Current Exposure" value={money(data.stats.totalCurrentValue)} />
            </div>

            {/* Category breakdown chart */}
            <div className="mt-5 rounded-2xl border border-base-700 bg-base-850/60 p-4">
              <p className="text-xs uppercase tracking-wider text-base-500 mb-3">
                Open positions by category
              </p>
              {data.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-base-500">No open positions to chart.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.categoryBreakdown.map((c) => (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className="text-xs w-16 shrink-0 text-base-400">{c.category}</span>
                      <div className="flex-1 h-3 bg-base-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(c.count / maxCount) * 100}%`,
                            background: CATEGORY_COLORS[c.category] || "#6b7280",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-base-300 w-6 text-right shrink-0">
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current open positions list */}
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wider text-base-500 mb-2 px-1">
                Current open positions
              </p>
              <div className="rounded-2xl border border-base-700 bg-base-850/40 divide-y divide-base-800">
                {data.positions.length === 0 && (
                  <p className="text-sm text-base-500 p-4">No open positions found.</p>
                )}
                {data.positions.map((p, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{p.title}</p>
                      <p className="text-[11px] text-base-500 mt-0.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                          style={{ background: CATEGORY_COLORS[p.category] }}
                        />
                        {p.category} · {p.outcome} · {(p.price * 100).toFixed(1)}¢
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-mono">{money(p.currentValue)}</p>
                      <p className={`text-[11px] font-mono ${p.pnl >= 0 ? "text-mint-400" : "text-coral-500"}`}>
                        {p.pnl >= 0 ? "+" : ""}{money(p.pnl)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, positive }) {
  return (
    <div className="rounded-2xl border border-base-700 bg-base-850/60 p-4">
      <p className="text-[11px] uppercase tracking-wider text-base-500">{label}</p>
      <p
        className={`text-lg font-semibold font-mono mt-1 ${
          positive === undefined ? "text-white" : positive ? "text-mint-400" : "text-coral-500"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
