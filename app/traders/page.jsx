"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TraderRow from "../../components/TraderRow";
import CategoryFilter from "../../components/CategoryFilter";
import Spinner from "../../components/Spinner";
import { encodeTemplate, decodeTemplate } from "../../lib/templateCode";

const SELECTED_KEY = "pm_selected_whales";
const CATEGORY_KEY = "pm_category_filters";
const API_KEY_STORAGE = "pm_whale_tracker_api_key";

export default function TradersPage() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddresses, setSelectedAddresses] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [code, setCode] = useState("");
  const [pasteCode, setPasteCode] = useState("");
  const [status, setStatus] = useState(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = localStorage.getItem(API_KEY_STORAGE) || "";
      const res = await fetch(`/api/leaderboard?limit=50&orderBy=PROFIT`, {
        headers: apiKey ? { "x-api-key": apiKey } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load traders.");
      const list = (data.traders || []).map((t, i) => ({
        address: t.proxyWallet || t.wallet || t.address,
        username: t.userName || t.username,
        rank: t.rank || i + 1,
        pnl: t.pnl,
      })).filter((t) => t.address);
      setTraders(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    const storedSelected = JSON.parse(localStorage.getItem(SELECTED_KEY) || "[]");
    setSelectedAddresses(new Set(storedSelected.map((w) => w.address)));
    const storedCats = JSON.parse(localStorage.getItem(CATEGORY_KEY) || "[]");
    setCategories(storedCats);
  }, [loadLeaderboard]);

  function toggle(address) {
    setSelectedAddresses((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  }

  function selectAll() {
    setSelectedAddresses(new Set(traders.map((t) => t.address)));
  }

  function clearAll() {
    setSelectedAddresses(new Set());
  }

  function saveSettings() {
    // Anything left unchecked is dropped here — selection is fully
    // overwritten with only what's currently checked.
    const chosen = traders.filter((t) => selectedAddresses.has(t.address));
    localStorage.setItem(SELECTED_KEY, JSON.stringify(chosen));
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));

    const generated = encodeTemplate({
      wallets: chosen.map((w) => ({ address: w.address, username: w.username, rank: w.rank })),
      categories,
      v: 1,
    });
    setCode(generated || "");
    setStatus("saved");
    setTimeout(() => setStatus(null), 2000);
  }

  function applyCode() {
    const parsed = decodeTemplate(pasteCode.trim());
    if (!parsed) {
      setStatus("invalid");
      setTimeout(() => setStatus(null), 2000);
      return;
    }
    setSelectedAddresses(new Set(parsed.wallets.map((w) => w.address)));
    setCategories(parsed.categories || []);
    localStorage.setItem(SELECTED_KEY, JSON.stringify(parsed.wallets));
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(parsed.categories || []));
    setCode(pasteCode.trim());
    setStatus("applied");
    setTimeout(() => setStatus(null), 2000);
  }

  function copyCode() {
    if (!code) return;
    navigator.clipboard?.writeText(code).catch(() => {});
    setStatus("copied");
    setTimeout(() => setStatus(null), 1500);
  }

  return (
    <main className="min-h-screen min-h-dvh safe-top safe-bottom pb-10">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-base-950/80 border-b border-base-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="w-9 h-9 rounded-full bg-base-800 border border-base-700 flex items-center justify-center text-base-300" aria-label="Back">
            ←
          </Link>
          <div>
            <h1 className="text-base font-semibold tracking-tight leading-none">Filter Whales</h1>
            <p className="text-[11px] text-base-500 mt-1">
              {selectedAddresses.size > 0
                ? `${selectedAddresses.size} selected — only these will be scanned`
                : "None selected — full top 50 will be scanned"}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4">
        {/* Template code box — sits before the settings, as requested */}
        <div className="mt-5 rounded-2xl border border-base-700 bg-base-850/60 p-4">
          <p className="text-xs uppercase tracking-wider text-base-500 mb-2">Template Code</p>
          <div className="flex gap-2">
            <input
              value={pasteCode}
              onChange={(e) => setPasteCode(e.target.value)}
              placeholder="Paste a WT1- code to load a saved setup"
              className="flex-1 bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-mint-500"
            />
            <button
              onClick={applyCode}
              className="px-4 py-2 rounded-lg bg-base-800 border border-base-600 text-xs font-medium text-base-200 shrink-0"
            >
              Apply
            </button>
          </div>
          {status === "invalid" && (
            <p className="text-xs text-coral-500 mt-2">That code isn't valid.</p>
          )}
          {status === "applied" && (
            <p className="text-xs text-mint-400 mt-2">Template applied ✓</p>
          )}

          {code && (
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono text-base-400 bg-base-900 border border-base-700 rounded-lg px-3 py-2 truncate">
                {code}
              </code>
              <button
                onClick={copyCode}
                className="px-3 py-2 rounded-lg bg-mint-500 text-base-950 text-xs font-semibold shrink-0"
              >
                {status === "copied" ? "Copied ✓" : "Copy"}
              </button>
            </div>
          )}
        </div>

        {/* Category filters */}
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wider text-base-500 mb-2 px-1">
            Category filter (applies to the Trades menu too)
          </p>
          <CategoryFilter selected={categories} onChange={setCategories} />
        </div>

        {/* Trader selection */}
        <div className="mt-5 flex items-center justify-between px-1">
          <p className="text-xs uppercase tracking-wider text-base-500">Top 50 traders</p>
          <div className="flex gap-3">
            <button onClick={selectAll} className="text-xs text-mint-400 underline">Select all</button>
            <button onClick={clearAll} className="text-xs text-base-500 underline">Clear</button>
          </div>
        </div>

        <div className="mt-2 rounded-2xl border border-base-700 bg-base-850/40 px-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-base-400">
              <Spinner size={16} /> Loading traders…
            </div>
          )}
          {error && <p className="text-sm text-coral-400 py-6 text-center">{error}</p>}
          {!loading && !error && traders.map((t) => (
            <TraderRow
              key={t.address}
              trader={t}
              checked={selectedAddresses.has(t.address)}
              onToggle={toggle}
            />
          ))}
        </div>

        <button
          onClick={saveSettings}
          className="w-full mt-5 py-3.5 rounded-xl bg-mint-500 text-base-950 font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          {status === "saved" ? "Saved ✓" : "Save Settings & Generate Code"}
        </button>
        <p className="text-[11px] text-base-500 mt-2 text-center px-4">
          Traders you leave unchecked are dropped from your selection the
          moment you save — next scan only includes who's checked here.
        </p>
      </div>
    </main>
  );
}
