// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useEffect, useRef, useState } from "react";

import {
  cancelMotion,
  executeMotionCommand,
  ROBOT_CONFIG,
  type MotionCommand,
  type Vector3Value,
} from "@/lib/robot";

type KeyboardFeedback = {
  message: string;
  isError: boolean;
};

const STEP = ROBOT_CONFIG.movementStep;

const KEY_DELTAS: Record<string, Vector3Value> = {
  w: { x: 0, y: STEP, z: 0 },
  s: { x: 0, y: -STEP, z: 0 },
  a: { x: -STEP, y: 0, z: 0 },
  d: { x: STEP, y: 0, z: 0 },
  r: { x: 0, y: 0, z: STEP },
  f: { x: 0, y: 0, z: -STEP },
};

let keyboardCommandSequence = 0;

function createKeyboardCommandId(): string {
  keyboardCommandSequence += 1;
  return `keyboard-${Date.now()}-${keyboardCommandSequence}`;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export function useKeyboardControl() {
  const isExecutingRef = useRef(false);
  const [isMoving, setIsMoving] = useState(false);
  const [feedback, setFeedback] = useState<KeyboardFeedback>({
    message: "Keyboard control ready.",
    isError: false,
  });

  useEffect(() => {
    async function executeDelta(delta: Vector3Value): Promise<void> {
      if (isExecutingRef.current) {
        return;
      }

      const command: MotionCommand = {
        id: createKeyboardCommandId(),
        type: "MOVE_RELATIVE",
        source: "keyboard",
        delta: { ...delta },
      };

      isExecutingRef.current = true;
      setIsMoving(true);
      setFeedback({ message: "Sending keyboard movement...", isError: false });

      try {
        const result = await executeMotionCommand(command);
        setFeedback({ message: result.message, isError: !result.success });
      } catch (error) {
        setFeedback({
          message:
            error instanceof Error
              ? error.message
              : "Keyboard movement failed unexpectedly.",
          isError: true,
        });
      } finally {
        isExecutingRef.current = false;
        setIsMoving(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelMotion();
        setFeedback({ message: "Motion cancellation requested.", isError: false });
        return;
      }

      const delta = KEY_DELTAS[event.key.toLowerCase()];

      if (!delta) {
        return;
      }

      event.preventDefault();
      void executeDelta(delta);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    enabled: true,
    isMoving,
    message: feedback.message,
    isError: feedback.isError,
  };
}
