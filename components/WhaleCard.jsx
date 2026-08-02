"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORY_COLORS = {
  Politics: "#f0475a",
  Crypto: "#f5b942",
  Sports: "#3ee6a8",
  AI: "#7c8cff",
  Finance: "#42c8f5",
  Other: "#6b7280",
};

function money(n) {
  if (!isFinite(n)) return "$0.00";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function WhaleCard({ trade, rank }) {
  const [amount, setAmount] = useState(100);
  const price = trade.currentPrice > 0 ? trade.currentPrice : 0.5;
  const payout = amount / price;
  const profit = payout - amount;

  return (
    <div className="fade-up rounded-2xl border border-base-700 bg-base-850/60 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-full bg-mint-500/10 border border-mint-500/30 flex items-center justify-center text-mint-400 font-mono text-sm font-semibold">
              {rank}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug truncate">
                {trade.marketTitle}
              </p>
              <p className="text-xs text-base-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>
                  Outcome: <span className="text-mint-400 font-medium">{trade.outcome}</span>
                </span>
                {trade.category && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                    style={{
                      color: CATEGORY_COLORS[trade.category] || "#9ca3af",
                      borderColor: `${CATEGORY_COLORS[trade.category] || "#9ca3af"}40`,
                    }}
                  >
                    {trade.category}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end">
            <span className="flex items-center gap-1 text-xs font-semibold bg-mint-500/10 text-mint-400 px-2.5 py-1 rounded-full border border-mint-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-mint-400 pulse-ring" />
              {trade.whaleCount} whales
            </span>
            <span className="text-xs text-base-500 mt-1 font-mono">
              {(price * 100).toFixed(1)}¢
            </span>
          </div>
        </div>

        {/* Whale avatars strip */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {trade.whales.slice(0, 8).map((w) => (
            <Link
              key={w.address}
              href={`/traders/${w.address}`}
              title={w.username || w.address}
              className="text-[10px] font-mono bg-base-800 border border-base-700 text-base-400 px-2 py-0.5 rounded-full hover:border-mint-500/50 hover:text-mint-400 transition-colors"
            >
              {w.username ? `@${w.username}` : `${w.address.slice(0, 5)}…`}
            </Link>
          ))}
          {trade.whales.length > 8 && (
            <span className="text-[10px] text-base-500">
              +{trade.whales.length - 8} more
            </span>
          )}
        </div>
      </div>

      {/* Return calculator */}
      <div className="border-t border-base-700 bg-base-900/60 p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-base-400 shrink-0">Bet</span>
          <div className="flex items-center bg-base-800 border border-base-600 rounded-lg px-3 py-2 flex-1">
            <span className="text-mint-400 text-sm mr-1">$</span>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="bg-transparent outline-none text-sm font-mono w-full"
            />
          </div>
        </div>

        <p className="text-xs text-base-400 mt-3 leading-relaxed">
          If you bet <span className="text-white font-medium">{money(amount)}</span> at{" "}
          <span className="text-white font-medium">{(price * 100).toFixed(1)}¢</span> odds,
          you'd receive a{" "}
          <span className="text-mint-400 font-semibold">{money(payout)}</span> payout
          (<span className={profit >= 0 ? "text-mint-400" : "text-coral-500"}>
            {profit >= 0 ? "+" : ""}
            {money(profit)} profit
          </span>) if it resolves YES.
        </p>
      </div>
    </div>
  );
}
