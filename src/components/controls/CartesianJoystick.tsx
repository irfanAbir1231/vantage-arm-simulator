// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { executeMotionCommand, ROBOT_CONFIG, type Vector3Value } from "@/lib/robot";
import { useRobotStore } from "@/store/robot-store";

const JOGS: Array<{ delta: Vector3Value; label: string }> = [
  { label: "X-", delta: { x: -ROBOT_CONFIG.movementStep, y: 0, z: 0 } },
  { label: "Y+", delta: { x: 0, y: ROBOT_CONFIG.movementStep, z: 0 } },
  { label: "X+", delta: { x: ROBOT_CONFIG.movementStep, y: 0, z: 0 } },
  { label: "Y-", delta: { x: 0, y: -ROBOT_CONFIG.movementStep, z: 0 } },
  { label: "Z+", delta: { x: 0, y: 0, z: ROBOT_CONFIG.movementStep } },
  { label: "Z-", delta: { x: 0, y: 0, z: -ROBOT_CONFIG.movementStep } },
];

export function CartesianJoystick() {
  const [message, setMessage] = useState("Ready to jog.");
  const moving = useRobotStore((state) => state.status === "moving");

  const jog = async (delta: Vector3Value) => {
    const result = await executeMotionCommand({
      type: "MOVE_RELATIVE",
      source: "joystick",
      delta,
    });
    setMessage(result.message);
  };

  return (
    <div className="border-t border-slate-800 pt-3">
      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase text-slate-400">
        <span>Cartesian jog</span>
        <span>{ROBOT_CONFIG.movementStep.toFixed(2)} m</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {JOGS.map((jogControl) => (
          <button
            className="h-9 border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={moving}
            key={jogControl.label}
            onClick={() => void jog(jogControl.delta)}
            title={`Move ${jogControl.label}`}
            type="button"
          >
            {jogControl.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">{message}</p>
    </div>
  );
}
