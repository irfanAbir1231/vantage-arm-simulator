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

import { DragJoystick } from "./DragJoystick";
import { VerticalJogSlider } from "./VerticalJogSlider";

const STEP = ROBOT_CONFIG.movementStep;

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
    message: "Drag to jog.",
    isError: false,
  });
  const robotMoving = useRobotStore((state) => state.status === "moving");
  const disabled = isMoving || robotMoving;

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

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        <span>Cartesian Jog</span>
        <span>step {STEP.toFixed(2)} m</span>
      </div>
      <div className="flex items-center justify-center gap-5">
        <DragJoystick
          disabled={disabled}
          onJog={(delta) => void jog({ x: delta.x, y: delta.y, z: 0 })}
          step={STEP}
        />
        <VerticalJogSlider
          disabled={disabled}
          onJog={(deltaZ) => void jog({ x: 0, y: 0, z: deltaZ })}
          step={STEP}
        />
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
