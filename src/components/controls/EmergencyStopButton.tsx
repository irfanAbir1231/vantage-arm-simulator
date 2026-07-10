// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { executeMotionCommand } from "@/lib/robot";

export function EmergencyStopButton() {
  const [message, setMessage] = useState("");

  const stopMotion = async () => {
    const result = await executeMotionCommand({ type: "STOP", source: "dashboard" });
    setMessage(result.message);
  };

  return (
    <div>
      <button
        className="w-full rounded-lg border-2 border-red-700 bg-red-950 px-3 py-2.5 text-sm font-bold uppercase tracking-widest text-red-100 transition hover:bg-red-900 active:bg-red-800"
        onClick={() => void stopMotion()}
        title="Cancel all motion immediately"
        type="button"
      >
        ■ Emergency Stop
      </button>
      {message ? (
        <p className="mt-1 truncate text-center text-[11px] text-red-300" title={message}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
