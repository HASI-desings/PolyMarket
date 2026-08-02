"use client";

import Link from "next/link";

export default function TraderRow({ trader, checked, onToggle }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-base-800 last:border-b-0">
      <button
        onClick={() => onToggle(trader.address)}
        className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
          checked
            ? "bg-mint-500 border-mint-500 text-base-950"
            : "border-base-600 text-transparent"
        }`}
        aria-label={checked ? "Deselect trader" : "Select trader"}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="w-7 h-7 rounded-full bg-base-800 border border-base-700 flex items-center justify-center text-[10px] font-mono text-base-400 shrink-0">
        {trader.rank}
      </div>

      <Link
        href={`/traders/${trader.address}`}
        className="min-w-0 flex-1"
      >
        <p className="text-sm font-medium truncate">
          {trader.username ? `@${trader.username}` : `${trader.address.slice(0, 6)}…${trader.address.slice(-4)}`}
        </p>
        <p className="text-[11px] text-base-500 font-mono truncate">
          {trader.address.slice(0, 10)}…{trader.address.slice(-6)}
        </p>
      </Link>

      <div className="text-right shrink-0">
        <p className="text-xs font-mono text-mint-400">
          {trader.pnl != null ? `$${Number(trader.pnl).toLocaleString()}` : ""}
        </p>
        <Link href={`/traders/${trader.address}`} className="text-[11px] text-base-500 underline">
          profile
        </Link>
      </div>
    </div>
  );
}
