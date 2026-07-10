// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import type { FormEvent } from "react";

import { usePinAutomation } from "@/hooks/usePinAutomation";

export function PinEntryController() {
  const {
    pin,
    setPin,
    start,
    stop,
    running,
    currentDigit,
    currentIndex,
    currentPhase,
    completedCount,
    completedSteps,
    totalSteps,
    message,
  } = usePinAutomation();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void start();
  }

  return (
    <div className="rounded-md border border-slate-800 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">Autonomous PIN Entry</h3>
        <span className="text-xs capitalize text-slate-500">{currentPhase}</span>
      </div>

      <form className="mt-3" onSubmit={handleSubmit}>
        <label className="block text-xs font-medium text-slate-300" htmlFor="pin-value">
          Six-digit PIN
        </label>
        <div className="mt-1 flex gap-2">
          <input
            autoComplete="off"
            className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm tracking-[0.3em] text-slate-100 placeholder:tracking-normal placeholder:text-slate-600"
            disabled={running}
            id="pin-value"
            inputMode="numeric"
            onChange={(event) => setPin(event.target.value)}
            placeholder="123456"
            type="text"
            value={pin}
          />
          <button
            className="rounded-md border border-sky-700 bg-sky-950 px-3 py-2 text-sm font-semibold text-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={running}
            type="submit"
          >
            Start
          </button>
          <button
            className="rounded-md border border-red-700 bg-red-950 px-3 py-2 text-sm font-semibold text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!running}
            onClick={stop}
            type="button"
          >
            Stop
          </button>
        </div>
      </form>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded border border-slate-800 bg-slate-950 px-2 py-1.5">
          <dt className="text-slate-500">Digits</dt>
          <dd className="mt-1 text-slate-200">{completedCount}/6</dd>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950 px-2 py-1.5">
          <dt className="text-slate-500">Steps</dt>
          <dd className="mt-1 text-slate-200">{completedSteps}/{totalSteps}</dd>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950 px-2 py-1.5">
          <dt className="text-slate-500">Current digit</dt>
          <dd className="mt-1 text-slate-200">{currentDigit ?? "-"}</dd>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950 px-2 py-1.5">
          <dt className="text-slate-500">Position</dt>
          <dd className="mt-1 text-slate-200">
            {currentIndex === null ? "-" : `${currentIndex + 1}/6`}
          </dd>
        </div>
      </dl>

      <p
        aria-live="polite"
        className={`mt-3 text-xs ${
          currentPhase === "failed" || currentPhase === "cancelled"
            ? "text-red-300"
            : "text-slate-400"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
