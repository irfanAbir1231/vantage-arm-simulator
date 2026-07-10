// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { cancelMotion } from "@/lib/robot";

export function EmergencyStopButton() {
  const [requested, setRequested] = useState(false);

  function stopMotion(): void {
    cancelMotion();
    setRequested(true);
  }

  return (
    <div className="rounded-lg border border-red-800 bg-red-950/60 p-3 shadow-[inset_0_0_24px_rgba(127,29,29,0.18)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-red-100">
            Emergency Stop
          </h3>
          <p aria-live="assertive" className="mt-1 text-xs leading-5 text-red-200/80">
            {requested
              ? "Cancellation requested through the shared motion controller."
              : "Immediately request cancellation of active robot motion."}
          </p>
        </div>

        <button
          aria-pressed={requested}
          className="min-h-12 shrink-0 rounded-md border-2 border-red-400 bg-red-700 px-6 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-red-950/40 active:bg-red-800"
          onClick={stopMotion}
          type="button"
        >
          {requested ? "Stop Requested" : "Stop Motion"}
        </button>
      </div>
    </div>
  );
}
