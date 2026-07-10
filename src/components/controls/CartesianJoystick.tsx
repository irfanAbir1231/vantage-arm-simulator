// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useRef, useState } from "react";

import {
  executeMotionCommand,
  ROBOT_CONFIG,
  type MotionCommand,
  type Vector3Value,
} from "@/lib/robot";
import { useRobotStore } from "@/store/robot-store";

const STEP = ROBOT_CONFIG.movementStep;

const JOG_BUTTON_CLASS_NAME =
  "flex h-9 items-center justify-center rounded border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-100 transition hover:border-cyan-500 hover:text-cyan-200 active:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40";

type ControlFeedback = {
  message: string;
  isError: boolean;
};

let joystickCommandSequence = 0;

function createJoystickCommandId(): string {
  joystickCommandSequence += 1;
  return `joystick-${Date.now()}-${joystickCommandSequence}`;
}

export function CartesianJoystick() {
  const isExecutingRef = useRef(false);
  const [isMoving, setIsMoving] = useState(false);
  const [feedback, setFeedback] = useState<ControlFeedback>({
    message: "Ready to jog.",
    isError: false,
  });
  const robotMoving = useRobotStore((state) => state.status === "moving");

  async function jog(delta: Vector3Value): Promise<void> {
    if (isExecutingRef.current || robotMoving) {
      return;
    }

    const command: MotionCommand = {
      id: createJoystickCommandId(),
      type: "MOVE_RELATIVE",
      source: "joystick",
      delta: { ...delta },
    };

    isExecutingRef.current = true;
    setIsMoving(true);
    setFeedback({ message: "Sending joystick movement...", isError: false });

    try {
      const result = await executeMotionCommand(command);
      setFeedback({ message: result.message, isError: !result.success });
    } catch (error) {
      setFeedback({
        message:
          error instanceof Error ? error.message : "Joystick movement failed unexpectedly.",
        isError: true,
      });
    } finally {
      isExecutingRef.current = false;
      setIsMoving(false);
    }
  }

  const jogButton = (label: string, delta: Vector3Value) => (
    <button
      className={JOG_BUTTON_CLASS_NAME}
      disabled={isMoving || robotMoving}
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
      <p
        aria-live="polite"
        className={`mt-2 truncate text-[11px] ${
          feedback.isError ? "text-red-300" : "text-slate-400"
        }`}
        title={feedback.message}
      >
        {feedback.message}
      </p>
    </div>
  );
}
