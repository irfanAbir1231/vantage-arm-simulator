import type { MotionResult } from "@/lib/robot";

import type {
  AgentPlanExecutionResult,
  AgentPlanProgress,
  CompiledAgentStep,
} from "./types";

export type AgentPlanExecutionOptions = {
  executeMotion: (command: CompiledAgentStep["command"]) => Promise<MotionResult>;
  resetCancellation: () => void;
  isCancellationRequested: () => boolean;
  onProgress?: (progress: AgentPlanProgress) => void;
};

function cancelledResult(completedSteps: number, totalSteps: number): AgentPlanExecutionResult {
  return {
    success: false,
    cancelled: true,
    completedSteps,
    totalSteps,
    message: `Execution was cancelled after ${completedSteps} of ${totalSteps} planned steps.`,
  };
}

export async function executeAgentPlan(
  steps: readonly CompiledAgentStep[],
  options: AgentPlanExecutionOptions,
): Promise<AgentPlanExecutionResult> {
  const totalSteps = steps.length;
  let completedSteps = 0;

  try {
    options.resetCancellation();
  } catch {
    return {
      success: false,
      cancelled: false,
      completedSteps,
      totalSteps,
      message: "Could not clear a previous cancellation before executing the plan.",
    };
  }

  for (const [index, step] of steps.entries()) {
    if (options.isCancellationRequested()) {
      return cancelledResult(completedSteps, totalSteps);
    }

    options.onProgress?.({ currentStep: index + 1, totalSteps, step });

    let result: MotionResult;
    try {
      result = await options.executeMotion(step.command);
    } catch {
      return {
        success: false,
        cancelled: false,
        completedSteps,
        totalSteps,
        message: `Execution stopped at step ${index + 1} of ${totalSteps} because the controller failed unexpectedly.`,
      };
    }

    if (options.isCancellationRequested() || (!result.success && result.reason === "CANCELLED")) {
      return cancelledResult(completedSteps, totalSteps);
    }

    if (!result.success) {
      return {
        success: false,
        cancelled: false,
        completedSteps,
        totalSteps,
        message: `Completed ${completedSteps} of ${totalSteps} planned steps. Step ${index + 1} failed: ${result.message}`,
      };
    }

    completedSteps += 1;
  }

  return {
    success: true,
    completedSteps,
    totalSteps,
    message: `Completed all ${totalSteps} planned steps successfully.`,
  };
}
