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

type JoystickDirection = {
  label: string;
  delta: Vector3Value;
};

type ControlFeedback = {
  message: string;
  isError: boolean;
};

const STEP = ROBOT_CONFIG.movementStep;

const DIRECTIONS: JoystickDirection[] = [
  { label: "Left", delta: { x: -STEP, y: 0, z: 0 } },
  { label: "Right", delta: { x: STEP, y: 0, z: 0 } },
  { label: "Forward", delta: { x: 0, y: STEP, z: 0 } },
  { label: "Backward", delta: { x: 0, y: -STEP, z: 0 } },
  { label: "Up", delta: { x: 0, y: 0, z: STEP } },
  { label: "Down", delta: { x: 0, y: 0, z: -STEP } },
];

let joystickCommandSequence = 0;

function createJoystickCommandId(): string {
  joystickCommandSequence += 1;
  return `joystick-${Date.now()}-${joystickCommandSequence}`;
}

export function CartesianJoystick() {
  const isExecutingRef = useRef(false);
  const [isMoving, setIsMoving] = useState(false);
  const [feedback, setFeedback] = useState<ControlFeedback>({
    message: `Jog step: ${STEP} m`,
    isError: false,
  });

  async function move(delta: Vector3Value): Promise<void> {
    if (isExecutingRef.current) {
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

  return (
    <div className="rounded-md border border-slate-800 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">Cartesian Joystick</h3>
        <span className="text-xs text-slate-500">{STEP} m / jog</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DIRECTIONS.map(({ label, delta }) => (
          <button
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isMoving}
            key={label}
            onClick={() => void move(delta)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <p
        aria-live="polite"
        className={`mt-3 text-xs ${feedback.isError ? "text-red-300" : "text-slate-400"}`}
      >
        {feedback.message}
      </p>
    </div>
  );
}
