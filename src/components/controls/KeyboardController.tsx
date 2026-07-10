// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { useKeyboardControl } from "@/hooks/useKeyboardControl";

export function KeyboardController() {
  const [enabled, setEnabled] = useState(false);
  const { message } = useKeyboardControl(enabled);

  return (
    <div className="border-t border-slate-800 pt-3">
      <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
        <span>Keyboard jog</span>
        <input
          checked={enabled}
          className="h-4 w-4 accent-cyan-400"
          onChange={(event) => setEnabled(event.target.checked)}
          type="checkbox"
        />
      </label>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center font-mono text-xs text-slate-300">
        <span>W</span><span>R</span><span>D</span>
        <span>A</span><span>F</span><span>S</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">{message}</p>
    </div>
  );
}
