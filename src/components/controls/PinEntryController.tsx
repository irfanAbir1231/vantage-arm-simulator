// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { usePinAutomation } from "@/hooks/usePinAutomation";

export function PinEntryController() {
  const {
    pin,
    setPin,
    start,
    stop,
    goHome,
    running,
    currentDigit,
    currentPhase,
    completedCount,
    message,
  } = usePinAutomation();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Autonomous PIN
        </span>
        <div className="flex gap-1" title={`Progress: ${completedCount} of 6 digits`}>
          {Array.from({ length: 6 }, (_, index) => (
            <span
              className={`h-1.5 w-3 rounded-full transition ${
                index < completedCount ? "bg-emerald-400" : "bg-slate-700"
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
          disabled={running}
          onClick={() => void start()}
          type="button"
        >
          Run
        </button>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <button
          className="rounded border border-amber-800 bg-amber-950 py-1 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!running}
          onClick={stop}
          type="button"
        >
          Stop PIN
        </button>
        <button
          className="rounded border border-slate-700 bg-slate-800 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={running}
          onClick={() => void goHome()}
          title="Clear PIN progress and return the arm to its default vertical pose"
          type="button"
        >
          Default
        </button>
      </div>
      <p
        aria-live="polite"
        className={`mt-2 truncate text-[11px] ${
          currentPhase === "failed" || currentPhase === "cancelled"
            ? "text-red-300"
            : "text-slate-400"
        }`}
        title={`${currentPhase}${currentDigit ? ` · key ${currentDigit}` : ""}: ${message}`}
      >
        <span className="capitalize">{currentPhase}</span>
        {currentDigit ? ` · key ${currentDigit}` : ""}: {message}
      </p>
    </div>
  );
}
