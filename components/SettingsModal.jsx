"use client";

import { useState } from "react";

export default function SettingsModal({ open, onClose, apiKey, onSave }) {
  const [value, setValue] = useState(apiKey || "");
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  function handleSave() {
    onSave(value.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-base-850 border border-base-700 rounded-t-3xl sm:rounded-3xl p-6 pb-8 safe-bottom fade-up">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-base-800 text-base-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-base-400 mb-5">
          Paste your Polymarket / Parse API key. It's stored only in this browser's
          local storage and sent with every request as a Bearer token — never shared
          anywhere else.
        </p>

        <label className="block text-xs uppercase tracking-wider text-base-400 mb-2">
          API Key
        </label>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="pm_live_••••••••••••••••"
          className="w-full bg-base-900 border border-base-600 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-mint-500 transition-colors"
        />

        <p className="text-xs text-base-500 mt-3 leading-relaxed">
          Leaderboard rankings are public and work without a key. Some
          per-wallet position endpoints (and higher rate limits) may require
          one, depending on your provider tier.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-base-600 text-sm font-medium text-base-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-mint-500 text-base-950 text-sm font-semibold hover:bg-mint-400 transition-colors"
          >
            {saved ? "Saved ✓" : "Save Key"}
          </button>
        </div>
      </div>
    </div>
  );
}
