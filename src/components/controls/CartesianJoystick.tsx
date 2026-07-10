// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { executeMotionCommand, ROBOT_CONFIG, type Vector3Value } from "@/lib/robot";
import { useRobotStore } from "@/store/robot-store";

const STEP = ROBOT_CONFIG.movementStep;

const JOG_BUTTON_CLASS_NAME =
  "flex h-9 items-center justify-center rounded border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200 active:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40";

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

  const jogButton = (label: string, delta: Vector3Value) => (
    <button
      className={JOG_BUTTON_CLASS_NAME}
      disabled={moving}
      onClick={() => void jog(delta)}
      title={`Move ${label} by ${STEP.toFixed(2)} m`}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        <span>Cartesian Jog</span>
        <span>step {STEP.toFixed(2)} m</span>
      </div>
      <div className="flex gap-2">
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          <span />
          {jogButton("Y+", { x: 0, y: STEP, z: 0 })}
          <span />
          {jogButton("X-", { x: -STEP, y: 0, z: 0 })}
          <span className="flex items-center justify-center text-[10px] text-slate-600">XY</span>
          {jogButton("X+", { x: STEP, y: 0, z: 0 })}
          <span />
          {jogButton("Y-", { x: 0, y: -STEP, z: 0 })}
          <span />
        </div>
        <div className="grid w-14 grid-rows-3 gap-1.5">
          {jogButton("Z+", { x: 0, y: 0, z: STEP })}
          <span className="flex items-center justify-center text-[10px] text-slate-600">Z</span>
          {jogButton("Z-", { x: 0, y: 0, z: -STEP })}
        </div>
      </div>
      <p className="mt-2 truncate text-[11px] text-slate-400" title={message}>
        {message}
      </p>
    </div>
  );
}
