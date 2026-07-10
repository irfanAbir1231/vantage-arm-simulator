// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useKeyboardControl } from "@/hooks/useKeyboardControl";

const KEY_BINDINGS = [
  ["W", "Forward"],
  ["S", "Backward"],
  ["A", "Left"],
  ["D", "Right"],
  ["R", "Up"],
  ["F", "Down"],
  ["Esc", "Stop"],
] as const;

export function KeyboardController() {
  const { enabled, isMoving, message, isError } = useKeyboardControl();

  return (
    <div className="rounded-md border border-slate-800 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">Keyboard</h3>
        <span className="text-xs text-slate-500">
          {isMoving ? "Moving" : enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {KEY_BINDINGS.map(([key, action]) => (
          <div
            className="rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-400"
            key={key}
          >
            <kbd className="font-mono font-semibold text-slate-200">{key}</kbd>
            <span className="ml-2">{action}</span>
          </div>
        ))}
      </div>

      <p
        aria-live="polite"
        className={`mt-3 text-xs ${isError ? "text-red-300" : "text-slate-400"}`}
      >
        {message}
      </p>
    </div>
  );
}
