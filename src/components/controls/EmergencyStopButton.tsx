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
    <div className="border-t border-slate-800 pt-3">
      <button
        className="w-full border border-red-700 bg-red-950 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-900"
        onClick={() => void stopMotion()}
        type="button"
      >
        Emergency Stop
      </button>
      {message ? <p className="mt-2 text-xs text-red-200">{message}</p> : null}
    </div>
  );
}
