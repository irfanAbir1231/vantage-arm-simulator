// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useEffect, useState } from "react";

import { cancelMotion, executeMotionCommand, ROBOT_CONFIG, type Vector3Value } from "@/lib/robot";

const KEY_DELTAS: Record<string, Vector3Value> = {
  w: { x: 0, y: ROBOT_CONFIG.movementStep, z: 0 },
  s: { x: 0, y: -ROBOT_CONFIG.movementStep, z: 0 },
  a: { x: -ROBOT_CONFIG.movementStep, y: 0, z: 0 },
  d: { x: ROBOT_CONFIG.movementStep, y: 0, z: 0 },
  r: { x: 0, y: 0, z: ROBOT_CONFIG.movementStep },
  f: { x: 0, y: 0, z: -ROBOT_CONFIG.movementStep },
};

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable);
}

export function useKeyboardControl(enabled: boolean) {
  const [lastMessage, setLastMessage] = useState("Keyboard control is ready.");

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelMotion();
        setLastMessage("Motion cancelled from keyboard.");
        return;
      }

      const delta = KEY_DELTAS[event.key.toLowerCase()];
      if (!delta) {
        return;
      }

      event.preventDefault();
      void executeMotionCommand({
        type: "MOVE_RELATIVE",
        source: "keyboard",
        delta,
      }).then((result) => setLastMessage(result.message));
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  return {
    enabled,
    message: enabled ? lastMessage : "Keyboard control is off.",
  };
}
