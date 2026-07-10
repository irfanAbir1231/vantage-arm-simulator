// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { cancelMotion } from "@/lib/robot";

export function EmergencyStopButton() {
  const [requested, setRequested] = useState(false);

  function stopMotion(): void {
    cancelMotion();
    window.dispatchEvent(new Event("vantage:emergency-stop"));
    setRequested(true);
  }

  return (
    <div>
      <button
        className="w-full rounded-lg border-2 border-red-700 bg-red-950 px-3 py-2.5 text-sm font-bold uppercase tracking-widest text-red-100 transition hover:bg-red-900 active:bg-red-800"
        aria-pressed={requested}
        onClick={stopMotion}
        title="Cancel all motion immediately"
        type="button"
      >
        {requested ? "■ Stop Requested" : "■ Emergency Stop"}
      </button>
      {requested ? (
        <p
          aria-live="assertive"
          className="mt-1 truncate text-center text-[11px] text-red-300"
          title="Cancellation requested through the shared motion controller."
        >
          Cancellation requested through the shared motion controller.
        </p>
      ) : null}
    </div>
  );
}
