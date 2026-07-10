// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useCallback, useEffect, useState } from "react";

import {
  cancelMotion,
  executeMotionCommand,
  resetMotionCancellation,
  ROBOT_CONFIG,
  type Vector3Value,
} from "@/lib/robot";
import {
  createPinSequence,
  normalizePinConfig,
  validatePinDetailed,
  type NormalizedPinConfig,
  type PinApproachAxis,
} from "@/lib/pin";
import { useRobotStore } from "@/store/robot-store";

function createHoverTarget(
  target: Vector3Value,
  approachAxis: PinApproachAxis,
): Vector3Value {
  const offset = ROBOT_CONFIG.hoverOffset;

  switch (approachAxis) {
    case "+x":
      return { ...target, x: target.x - offset };
    case "-x":
      return { ...target, x: target.x + offset };
    case "+y":
      return { ...target, y: target.y - offset };
    case "-y":
      return { ...target, y: target.y + offset };
    case "+z":
      return { ...target, z: target.z - offset };
    case "-z":
      return { ...target, z: target.z + offset };
  }
}

export function usePinAutomation() {
  const [config, setConfig] = useState<NormalizedPinConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState("Loading panel configuration...");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/robot/key.config.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Panel configuration failed to load: ${response.status}.`);
        }

        return response.json();
      })
      .then((rawConfig: unknown) => {
        const parsed = normalizePinConfig(rawConfig);
        if (cancelled) {
          return;
        }

        if (!parsed.success) {
          setMessage(parsed.error);
          return;
        }

        setConfig(parsed.config);
        setMessage("Panel configuration is ready.");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Panel configuration failed to load.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const start = useCallback(async (pin: string) => {
    if (!config || running) {
      return;
    }

    const validation = validatePinDetailed(pin, config);
    if (!validation.success) {
      setMessage(validation.error);
      return;
    }

    const store = useRobotStore.getState();
    resetMotionCancellation();
    store.resetPinProgress();
    setCurrentIndex(0);
    setRunning(true);

    try {
      const digits = createPinSequence(validation.pin);

      for (const [pinIndex, keyLabel] of digits.entries()) {
        const key = config.keys[keyLabel];
        const hoverTarget = createHoverTarget(key.position, config.approachAxis);
        const targets = [hoverTarget, key.position, hoverTarget];

        store.setPinProgress(keyLabel, pinIndex);
        setCurrentIndex(pinIndex);
        setMessage(`Pressing key ${keyLabel} (${pinIndex + 1} of ${digits.length}).`);

        for (const target of targets) {
          const result = await executeMotionCommand({
            type: "MOVE_TO",
            source: "autonomous",
            target,
            speed: 0.9,
          });

          if (!result.success) {
            setMessage(result.message);
            return;
          }
        }

        store.setPinProgress(keyLabel, pinIndex + 1);
        setCurrentIndex(pinIndex + 1);
      }

      store.setActiveKey(null);
      setMessage("PIN entry completed successfully.");
    } finally {
      setRunning(false);
    }
  }, [config, running]);

  const cancel = useCallback(() => {
    cancelMotion();
    setMessage("PIN entry cancellation requested.");
  }, []);

  const reset = useCallback(() => {
    if (running) {
      cancelMotion();
    }

    resetMotionCancellation();
    useRobotStore.getState().resetPinProgress();
    setCurrentIndex(0);
    setMessage("PIN progress reset.");
  }, [running]);

  return {
    cancel,
    configReady: config !== null,
    currentIndex,
    message,
    reset,
    running,
    start,
  };
}
