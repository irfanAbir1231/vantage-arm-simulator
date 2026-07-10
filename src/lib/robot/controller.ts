// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import type { MotionCommand, MotionResult } from "./types";

let cancelled = false;

export async function executeMotionCommand(
  command: MotionCommand,
): Promise<MotionResult> {
  if (cancelled) {
    return {
      success: false,
      commandId: command.id,
      reason: "CANCELLED",
      message: "Motion execution is cancelled until reset.",
    };
  }

  return {
    success: false,
    commandId: command.id,
    reason: "ROBOT_NOT_READY",
    message: "Motion controller placeholder is not ready.",
  };
}

export function cancelMotion(): void {
  cancelled = true;
}

export function resetCancellation(): void {
  cancelled = false;
}
