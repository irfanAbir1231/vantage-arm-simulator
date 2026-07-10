// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useRef, useState } from "react";

import {
  executePinSequence,
  loadPinConfig,
  type PinExecutionProgress,
} from "@/lib/pin";
import {
  cancelMotion,
  executeMotionCommand,
  resetCancellation,
} from "@/lib/robot";

function createInitialProgress(pin = ""): PinExecutionProgress {
  return {
    pin,
    phase: "idle",
    currentDigit: null,
    currentIndex: null,
    completedCount: 0,
    completedSteps: 0,
    totalSteps: 18,
    message: "PIN automation ready.",
  };
}

export function usePinAutomation() {
  const runningRef = useRef(false);
  const cancellationRequestedRef = useRef(false);
  const [pin, setPin] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<PinExecutionProgress>(() =>
    createInitialProgress(),
  );

  async function start(): Promise<void> {
    if (runningRef.current) {
      return;
    }

    runningRef.current = true;
    cancellationRequestedRef.current = false;
    setRunning(true);
    setProgress({
      ...createInitialProgress(pin),
      phase: "validating",
      message: "Loading panel configuration...",
    });

    try {
      const configResult = await loadPinConfig();

      if (cancellationRequestedRef.current) {
        setProgress({
          ...createInitialProgress(pin),
          phase: "cancelled",
          message: "PIN entry was cancelled before motion started.",
        });
        return;
      }

      if (!configResult.success) {
        setProgress({
          ...createInitialProgress(pin),
          phase: "failed",
          message: configResult.error,
        });
        return;
      }

      await executePinSequence(pin, configResult.config, {
        executeMotion: executeMotionCommand,
        resetCancellation,
        isCancellationRequested: () => cancellationRequestedRef.current,
        onProgress: setProgress,
      });
    } catch (error) {
      setProgress({
        ...createInitialProgress(pin),
        phase: cancellationRequestedRef.current ? "cancelled" : "failed",
        message:
          error instanceof Error
            ? `PIN automation failed unexpectedly: ${error.message}`
            : "PIN automation failed unexpectedly.",
      });
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }

  function stop(): void {
    if (!runningRef.current) {
      return;
    }

    cancellationRequestedRef.current = true;
    cancelMotion();
    setProgress((current) => ({
      ...current,
      phase: "cancelled",
      message: "Cancellation requested. Waiting for the current motion to stop.",
    }));
  }

  return {
    pin,
    setPin,
    start,
    stop,
    running,
    currentDigit: progress.currentDigit,
    currentIndex: progress.currentIndex,
    currentPhase: progress.phase,
    completedCount: progress.completedCount,
    completedSteps: progress.completedSteps,
    totalSteps: progress.totalSteps,
    message: progress.message,
  };
}
