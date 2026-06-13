'use client';

import { useState, type ReactNode } from 'react';

// Collapsible settings section. Visually identical to the existing section cards
// (same border/spacing + h2 type) — it only adds a fold chevron and an optional
// header accessory (e.g. an enable checkbox). Keeps the panel from showing every
// control at once.
export function Collapsible({
  title,
  defaultOpen = false,
  accessory,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  accessory?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pb-5 mb-5 border-b border-[#d0cdc4]">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-[#2a2a2a] cursor-pointer select-none bg-transparent p-0 border-0"
        >
          <span className="text-[10px] text-[#999] w-2.5 inline-block text-center">{open ? '▾' : '▸'}</span>
          {title}
        </button>
        {accessory ? <div className="flex items-center">{accessory}</div> : null}
      </div>
      {open ? <div>{children}</div> : null}
    </div>
  );
}
