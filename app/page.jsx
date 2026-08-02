"use client";

import { useEffect, useState, useCallback } from "react";
import SettingsModal from "../components/SettingsModal";
import WhaleCard from "../components/WhaleCard";
import Spinner from "../components/Spinner";

const STORAGE_KEY = "pm_whale_tracker_api_key";

export default function Home() {
  const [apiKey, setApiKey] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | leaderboard | positions | done | error
  const [progress, setProgress] = useState(0);
  const [menu, setMenu] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    setApiKey(stored || "");
    if (!stored) setSettingsOpen(true);
  }, []);

  function saveApiKey(key) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  }

  const runScan = useCallback(async () => {
    setError(null);
    setMenu([]);
    setProgress(0);
    setPhase("leaderboard");

    try {
      const lbRes = await fetch(`/api/leaderboard?limit=50&orderBy=PROFIT`, {
        headers: apiKey ? { "x-api-key": apiKey } : {},
      });
      const lbData = await lbRes.json();
      if (!lbRes.ok) throw new Error(lbData.error || "Leaderboard fetch failed.");

      const traders = (lbData.traders || []).map((t, i) => ({
        address: t.proxyWallet || t.wallet || t.address,
        username: t.userName || t.username,
        rank: t.rank || i + 1,
      })).filter((t) => t.address);

      if (traders.length === 0) throw new Error("No traders returned by leaderboard.");

      setPhase("positions");
      setProgress({ done: 0, total: traders.length });

      // Fire the aggregation request; server throttles internally to dodge 429s.
      // We simulate incremental progress client-side for UX feedback.
      let cancelled = false;
      const ticker = setInterval(() => {
        setProgress((p) => {
          if (!p || p.done >= p.total - 1) return p;
          return { ...p, done: p.done + 1 };
        });
      }, 190);

      const posRes = await fetch("/api/positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-api-key": apiKey } : {}),
        },
        body: JSON.stringify({ wallets: traders }),
      });
      clearInterval(ticker);
      if (cancelled) return;

      const posData = await posRes.json();
      if (!posRes.ok) throw new Error(posData.error || "Position fetch failed.");

      setMenu(posData.menu || []);
      setMeta({ scanned: posData.scanned, failed: posData.failed, total: traders.length });
      setProgress({ done: traders.length, total: traders.length });
      setPhase("done");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setPhase("error");
    }
  }, [apiKey]);

  return (
    <main className="min-h-screen min-h-dvh safe-top safe-bottom pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-base-950/80 border-b border-base-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight leading-none">
              Whale Convergence
            </h1>
            <p className="text-[11px] text-base-500 mt-1">Top 50 Polymarket traders</p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-9 h-9 rounded-full bg-base-800 border border-base-700 flex items-center justify-center text-base-300 active:scale-95 transition-transform"
            aria-label="Settings"
          >
            ⚙︎
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* Scan control */}
        <div className="mt-5 mb-5 rounded-2xl border border-base-700 bg-gradient-to-br from-base-850 to-base-900 p-5 shadow-glow">
          <p className="text-sm text-base-300 leading-relaxed mb-4">
            Pulls the top 50 traders by all-time profit, scans every open
            position they currently hold, and ranks the trades where the most
            whales overlap.
          </p>
          <button
            onClick={runScan}
            disabled={phase === "leaderboard" || phase === "positions"}
            className="w-full py-3.5 rounded-xl bg-mint-500 disabled:bg-base-700 disabled:text-base-400 text-base-950 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {phase === "leaderboard" && (
              <>
                <Spinner size={16} /> Fetching leaderboard…
              </>
            )}
            {phase === "positions" && (
              <>
                <Spinner size={16} />
                Scanning whales {progress?.done ?? 0}/{progress?.total ?? 50}…
              </>
            )}
            {(phase === "idle" || phase === "done" || phase === "error") &&
              (phase === "done" ? "Rescan" : "Run Convergence Scan")}
          </button>

          {phase === "positions" && progress && (
            <div className="mt-3 h-1.5 w-full bg-base-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-mint-500 transition-all duration-200"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          )}

          {meta && phase === "done" && (
            <p className="text-xs text-base-500 mt-3">
              Scanned {meta.scanned} wallets · {meta.failed > 0 ? `${meta.failed} failed (rate limited or empty)` : "all succeeded"}
            </p>
          )}
        </div>

        {/* Error state */}
        {phase === "error" && (
          <div className="rounded-2xl border border-coral-500/30 bg-coral-500/5 p-4 text-sm text-coral-400 mb-5">
            {error}
            {!apiKey && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="block mt-2 text-xs underline text-coral-400"
              >
                Add an API key in Settings
              </button>
            )}
          </div>
        )}

        {/* Empty done state */}
        {phase === "done" && menu.length === 0 && (
          <div className="rounded-2xl border border-base-700 p-6 text-center text-sm text-base-400">
            No overlapping positions found among the top 50 right now — the
            whales are scattered. Try rescanning later.
          </div>
        )}

        {/* Results */}
        {menu.length > 0 && (
          <div className="space-y-3 pb-4">
            <h2 className="text-xs uppercase tracking-wider text-base-500 px-1">
              The Menu — ranked by whale convergence
            </h2>
            {menu.map((trade, i) => (
              <WhaleCard key={trade.key} trade={trade} rank={i + 1} />
            ))}
          </div>
        )}
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onSave={saveApiKey}
      />
    </main>
  );
}
