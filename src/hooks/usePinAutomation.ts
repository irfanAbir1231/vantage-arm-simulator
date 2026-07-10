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
import { useRobotStore } from "@/store/robot-store";

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
    let storeProgressStarted = false;

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

      const robotStore = useRobotStore.getState();

      await executePinSequence(pin, configResult.config, {
        executeMotion: executeMotionCommand,
        resetCancellation,
        isCancellationRequested: () => cancellationRequestedRef.current,
        onProgress: (nextProgress) => {
          setProgress(nextProgress);

          if (
            nextProgress.phase === "hover" ||
            nextProgress.phase === "touch" ||
            nextProgress.phase === "retract"
          ) {
            if (!storeProgressStarted) {
              robotStore.resetPinProgress();
              storeProgressStarted = true;
            }

            robotStore.setPinProgress(
              nextProgress.currentDigit,
              nextProgress.completedCount,
            );
            return;
          }

          if (nextProgress.phase === "completed") {
            robotStore.setPinProgress(null, nextProgress.completedCount);
            return;
          }

          if (
            storeProgressStarted &&
            (nextProgress.phase === "failed" || nextProgress.phase === "cancelled")
          ) {
            robotStore.setActiveKey(null);
          }
        },
      });
    } catch (error) {
      if (storeProgressStarted) {
        useRobotStore.getState().setActiveKey(null);
      }

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
    useRobotStore.getState().setActiveKey(null);
    setProgress((current) => ({
      ...current,
      phase: "cancelled",
      message: "Cancellation requested. Waiting for the current motion to stop.",
    }));
  }

  async function goHome(): Promise<void> {
    if (runningRef.current) {
      return;
    }

    cancellationRequestedRef.current = false;
    setPin("");
    useRobotStore.getState().resetPinProgress();
    setProgress({
      ...createInitialProgress(),
      message: "Returning to the default vertical pose...",
    });

    const result = await executeMotionCommand({ type: "HOME", source: "dashboard" });

    setProgress((current) => ({ ...current, message: result.message }));
  }

  return {
    pin,
    setPin,
    start,
    stop,
    goHome,
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
