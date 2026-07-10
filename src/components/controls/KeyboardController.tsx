// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { useKeyboardControl } from "@/hooks/useKeyboardControl";

const KEY_HINTS: Array<{ keyLabel: string; action: string }> = [
  { keyLabel: "W", action: "Y+" },
  { keyLabel: "S", action: "Y-" },
  { keyLabel: "A", action: "X-" },
  { keyLabel: "D", action: "X+" },
  { keyLabel: "R", action: "Z+" },
  { keyLabel: "F", action: "Z-" },
];

export function KeyboardController() {
  const [enabled, setEnabled] = useState(false);
  const { message } = useKeyboardControl(enabled);

  return (
    <div className="mt-3 border-t border-slate-800 pt-3">
      <label className="flex cursor-pointer items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        <span>Keyboard Jog</span>
        <span className="flex items-center gap-1.5 normal-case tracking-normal">
          <span className={`text-[11px] font-medium ${enabled ? "text-cyan-300" : "text-slate-500"}`}>
            {enabled ? "on" : "off"}
          </span>
          <input
            checked={enabled}
            className="h-3.5 w-3.5 accent-cyan-400"
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
        </span>
      </label>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {KEY_HINTS.map(({ keyLabel, action }) => (
          <span
            className="flex items-center justify-center gap-1 rounded bg-slate-950 py-1 text-[11px]"
            key={keyLabel}
          >
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1 font-mono text-[10px] text-slate-200">
              {keyLabel}
            </kbd>
            <span className="text-slate-400">{action}</span>
          </span>
        ))}
      </div>
      <p className="mt-2 truncate text-[11px] text-slate-400" title={message}>
        {message}
      </p>
    </div>
  );
}
