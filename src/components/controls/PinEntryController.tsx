// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { usePinAutomation } from "@/hooks/usePinAutomation";

export function PinEntryController() {
  const [pin, setPin] = useState("123456");
  const { cancel, configReady, currentIndex, message, reset, running, start } = usePinAutomation();

  return (
    <div className="border-t border-slate-800 pt-3">
      <div className="flex items-center justify-between text-sm text-slate-200">
        <span>Autonomous PIN</span>
        <span className="font-mono text-xs text-slate-400">{currentIndex}/6</span>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="min-w-0 flex-1 border border-slate-700 bg-slate-950 px-2 py-2 font-mono text-sm tracking-wide text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500"
          disabled={running}
          inputMode="numeric"
          maxLength={6}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
          value={pin}
        />
        <button
          className="border border-emerald-800 bg-emerald-950 px-3 py-2 text-xs font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!configReady || running}
          onClick={() => void start(pin)}
          type="button"
        >
          Run
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          className="border border-amber-800 bg-amber-950 px-2 py-1 text-xs font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!running}
          onClick={cancel}
          type="button"
        >
          Stop PIN
        </button>
        <button
          className="border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200"
          onClick={reset}
          type="button"
        >
          Reset
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">{message}</p>
    </div>
  );
}
