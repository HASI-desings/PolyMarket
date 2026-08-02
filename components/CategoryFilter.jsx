"use client";

import { CATEGORIES } from "../lib/categorize";

export default function CategoryFilter({ selected, onChange }) {
  const allActive = selected.length === 0;

  function toggle(cat) {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      <button
        onClick={() => onChange([])}
        className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
          allActive
            ? "bg-mint-500 text-base-950 border-mint-500"
            : "bg-base-800 text-base-400 border-base-700"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => {
        const active = selected.includes(cat);
        return (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              active
                ? "bg-mint-500 text-base-950 border-mint-500"
                : "bg-base-800 text-base-400 border-base-700"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
