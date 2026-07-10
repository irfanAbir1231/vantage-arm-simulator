// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import type { MotionCommand, MotionResult } from "@/lib/robot";

import { createPinPlan } from "./pin-sequence";
import type {
  NormalizedPinConfig,
  PinExecutionOptions,
  PinExecutionProgress,
  PinExecutionResult,
  PinPlanStep,
} from "./types";

const PIN_DIGIT_COUNT = 6;
const STEPS_PER_DIGIT = 3;

let pinCommandSequence = 0;

function createDefaultCommandId(step: PinPlanStep): string {
  pinCommandSequence += 1;
  return `pin-${Date.now()}-${pinCommandSequence}-${step.pinIndex}-${step.phase}`;
}

function emitProgress(
  options: PinExecutionOptions,
  progress: PinExecutionProgress,
): void {
  options.onProgress?.(progress);
}

function createCancelledResult(
  pin: string,
  completedCount: number,
  completedSteps: number,
  step?: PinPlanStep,
  motionResult?: Extract<MotionResult, { success: false }>,
): Extract<PinExecutionResult, { success: false }> {
  return {
    success: false,
    pin,
    reason: "CANCELLED",
    error: motionResult?.message ?? "PIN entry was cancelled.",
    completedCount,
    completedSteps,
    failedStep: step,
    motionResult,
  };
}

export async function executePinSequence(
  pin: string,
  config: NormalizedPinConfig,
  options: PinExecutionOptions,
): Promise<PinExecutionResult> {
  const totalSteps = PIN_DIGIT_COUNT * STEPS_PER_DIGIT;
  let completedCount = 0;
  let completedSteps = 0;

  emitProgress(options, {
    pin,
    phase: "validating",
    currentDigit: null,
    currentIndex: null,
    completedCount,
    completedSteps,
    totalSteps,
    message: "Validating PIN and motion plan...",
  });

  const plan = createPinPlan(pin, config);

  if (!plan.success) {
    emitProgress(options, {
      pin,
      phase: "failed",
      currentDigit: null,
      currentIndex: null,
      completedCount,
      completedSteps,
      totalSteps,
      message: plan.error,
    });

    return {
      success: false,
      pin,
      reason: "VALIDATION_FAILED",
      error: plan.error,
      completedCount,
      completedSteps,
    };
  }

  try {
    options.resetCancellation();
  } catch (error) {
    const message =
      error instanceof Error
        ? `Could not reset stale cancellation: ${error.message}`
        : "Could not reset stale cancellation.";

    emitProgress(options, {
      pin: plan.pin,
      phase: "failed",
      currentDigit: null,
      currentIndex: null,
      completedCount,
      completedSteps,
      totalSteps,
      message,
    });

    return {
      success: false,
      pin: plan.pin,
      reason: "RESET_FAILED",
      error: message,
      completedCount,
      completedSteps,
    };
  }

  for (const [stepIndex, step] of plan.steps.entries()) {
    const currentDigit = plan.pin[step.pinIndex] ?? step.keyLabel;

    if (options.isCancellationRequested?.()) {
      const result = createCancelledResult(
        plan.pin,
        completedCount,
        completedSteps,
        step,
      );

      emitProgress(options, {
        pin: plan.pin,
        phase: "cancelled",
        currentDigit,
        currentIndex: step.pinIndex,
        completedCount,
        completedSteps,
        totalSteps,
        message: result.error,
      });

      return result;
    }

    emitProgress(options, {
      pin: plan.pin,
      phase: step.phase,
      currentDigit,
      currentIndex: step.pinIndex,
      completedCount,
      completedSteps,
      totalSteps,
      message: `${step.phase} for digit ${step.pinIndex + 1} (${currentDigit})...`,
    });

    const command: MotionCommand = {
      id: options.createCommandId?.(step, stepIndex) ?? createDefaultCommandId(step),
      type: "MOVE_TO",
      source: "autonomous",
      target: { ...step.target },
    };

    let motionResult: MotionResult;

    try {
      motionResult = await options.executeMotion(command);
    } catch (error) {
      const message =
        error instanceof Error
          ? `Motion execution failed: ${error.message}`
          : "Motion execution failed unexpectedly.";

      emitProgress(options, {
        pin: plan.pin,
        phase: "failed",
        currentDigit,
        currentIndex: step.pinIndex,
        completedCount,
        completedSteps,
        totalSteps,
        message,
      });

      return {
        success: false,
        pin: plan.pin,
        reason: "MOTION_FAILED",
        error: message,
        completedCount,
        completedSteps,
        failedStep: step,
      };
    }

    if (
      options.isCancellationRequested?.() ||
      (!motionResult.success && motionResult.reason === "CANCELLED")
    ) {
      const cancelledMotionResult = motionResult.success ? undefined : motionResult;
      const result = createCancelledResult(
        plan.pin,
        completedCount,
        completedSteps,
        step,
        cancelledMotionResult,
      );

      emitProgress(options, {
        pin: plan.pin,
        phase: "cancelled",
        currentDigit,
        currentIndex: step.pinIndex,
        completedCount,
        completedSteps,
        totalSteps,
        message: result.error,
      });

      return result;
    }

    if (!motionResult.success) {
      const message = `${motionResult.reason}: ${motionResult.message}`;

      emitProgress(options, {
        pin: plan.pin,
        phase: "failed",
        currentDigit,
        currentIndex: step.pinIndex,
        completedCount,
        completedSteps,
        totalSteps,
        message,
      });

      return {
        success: false,
        pin: plan.pin,
        reason: "MOTION_FAILED",
        error: message,
        completedCount,
        completedSteps,
        failedStep: step,
        motionResult,
      };
    }

    completedSteps += 1;

    if (step.phase === "retract") {
      completedCount += 1;
    }
  }

  const message = `PIN entry completed: ${completedCount}/${PIN_DIGIT_COUNT} digits.`;

  emitProgress(options, {
    pin: plan.pin,
    phase: "completed",
    currentDigit: null,
    currentIndex: null,
    completedCount,
    completedSteps,
    totalSteps,
    message,
  });

  return {
    success: true,
    pin: plan.pin,
    completedCount,
    completedSteps,
    message,
  };
}
