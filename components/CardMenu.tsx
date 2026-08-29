"use client";

import { useState } from "react";

export const menuItemCls =
  "block w-full rounded-xl px-3 py-2 text-left font-display text-[13px] font-semibold text-ink transition hover:bg-cream-2";

export default function CardMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ações"
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-full text-lg leading-none text-ink-soft transition hover:bg-cream-2 hover:text-ink"
      >
        ⋯
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-50 mt-1 min-w-[160px] rounded-2xl border border-line bg-cream p-1.5 shadow-[0_16px_40px_-16px_rgba(90,69,81,.55)]"
            onClick={() => setOpen(false)}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}
