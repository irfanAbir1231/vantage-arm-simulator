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
// Hold a key this long before it starts auto-repeating.
const HOLD_REPEAT_DELAY_MS = 500;
// Cadence of the repeated jog once a key has been held past the delay.
const HOLD_REPEAT_INTERVAL_MS = 150;

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

type HeldKeyTimers = {
  repeatDelay: ReturnType<typeof setTimeout>;
  repeatInterval: ReturnType<typeof setInterval> | null;
};

export function useKeyboardControl(enabled = true) {
  const isExecutingRef = useRef(false);
  const heldKeysRef = useRef(new Map<string, HeldKeyTimers>());
  const [isMoving, setIsMoving] = useState(false);
  const [feedback, setFeedback] = useState<KeyboardFeedback>({
    message: "Keyboard control ready.",
    isError: false,
  });

  useEffect(() => {
    function clearHeldKey(key: string): void {
      const timers = heldKeysRef.current.get(key);

      if (!timers) {
        return;
      }

      clearTimeout(timers.repeatDelay);

      if (timers.repeatInterval) {
        clearInterval(timers.repeatInterval);
      }

      heldKeysRef.current.delete(key);
    }

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
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelMotion();
        setFeedback({ message: "Motion cancellation requested.", isError: false });
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      if (!enabled) {
        return;
      }

      const key = event.key.toLowerCase();
      const delta = KEY_DELTAS[key];

      if (!delta) {
        return;
      }

      event.preventDefault();

      // Ignore the OS's own key-repeat events; we drive repetition ourselves
      // below so the cadence is consistent across browsers/platforms.
      if (event.repeat || heldKeysRef.current.has(key)) {
        return;
      }

      void executeDelta(delta);

      const repeatDelay = setTimeout(() => {
        const timers = heldKeysRef.current.get(key);
        if (!timers) {
          return;
        }

        timers.repeatInterval = setInterval(() => {
          void executeDelta(delta);
        }, HOLD_REPEAT_INTERVAL_MS);
      }, HOLD_REPEAT_DELAY_MS);

      heldKeysRef.current.set(key, { repeatDelay, repeatInterval: null });
    }

    function handleKeyUp(event: KeyboardEvent): void {
      clearHeldKey(event.key.toLowerCase());
    }

    function handleBlur(): void {
      for (const key of [...heldKeysRef.current.keys()]) {
        clearHeldKey(key);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      handleBlur();
    };
  }, [enabled]);

  return {
    enabled,
    isMoving,
    message: enabled
      ? feedback.message
      : "Keyboard jog is off. Escape remains active.",
    isError: feedback.isError,
  };
}
