// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { usePinAutomation } from "@/hooks/usePinAutomation";

export function PinEntryController() {
  const [pin, setPin] = useState("123456");
  const { cancel, configReady, currentIndex, message, reset, running, start } = usePinAutomation();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Autonomous PIN
        </span>
        <div className="flex gap-1" title={`Progress: ${currentIndex} of 6 digits`}>
          {Array.from({ length: 6 }, (_, index) => (
            <span
              className={`h-1.5 w-3 rounded-full transition ${
                index < currentIndex ? "bg-emerald-400" : "bg-slate-700"
              }`}
              key={index}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-1.5">
        <input
          className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-center font-mono text-sm tracking-[0.4em] text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500 disabled:opacity-50"
          disabled={running}
          inputMode="numeric"
          maxLength={6}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="······"
          value={pin}
        />
        <button
          className="rounded border border-emerald-700 bg-emerald-950 px-3 text-[11px] font-bold uppercase text-emerald-100 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!configReady || running}
          onClick={() => void start(pin)}
          type="button"
        >
          Run
        </button>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <button
          className="rounded border border-amber-800 bg-amber-950 py-1 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!running}
          onClick={cancel}
          type="button"
        >
          Stop PIN
        </button>
        <button
          className="rounded border border-slate-700 bg-slate-800 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-slate-500"
          onClick={reset}
          type="button"
        >
          Reset
        </button>
      </div>
      <p className="mt-2 truncate text-[11px] text-slate-400" title={message}>
        {message}
      </p>
    </div>
  );
}
