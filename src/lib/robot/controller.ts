// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import {
  cloneJointAngles,
  computeForwardKinematics,
  INITIAL_JOINT_ANGLES,
  solveInverseKinematics,
} from "./kinematics";
import {
  isWithinTolerance,
  type ValidationFailure,
  validateJointAngles,
  validateMotionCommand,
  validateWorkspace,
} from "./safety";
import { createJointTrajectory, getTrajectoryStepDuration, waitForTrajectoryStep } from "./trajectory";
import {
  isJointName,
  type JointAngles,
  type MotionCommand,
  type MotionFailureReason,
  type MotionResult,
  type Vector3Value,
} from "./types";
import { useRobotStore } from "@/store/robot-store";

let motionRunId = 0;
let generatedCommandCount = 0;

export async function executeMotionCommand(command: MotionCommand): Promise<MotionResult> {
  const commandId = getCommandId(command);
  const validationFailure = validateMotionCommand(command);
  if (validationFailure) {
    return failCommand(command.source, commandId, validationFailure);
  }

  if (command.type === "STOP") {
    cancelMotion();
    const position = useRobotStore.getState().endEffectorPosition;
    return {
      success: true,
      commandId,
      finalPosition: position,
      target: position,
      jointAngles: useRobotStore.getState().jointAngles,
      message: "Stop command processed.",
    };
  }

  const currentState = useRobotStore.getState();
  if (currentState.status === "moving") {
    return failCommand(command.source, commandId, {
      reason: "BUSY",
      message: "A motion is already in progress. Cancel it before starting another command.",
    });
  }

  const resolved = resolveCommand(command, currentState.jointAngles, currentState.endEffectorPosition);
  if (!resolved.ok) {
    return failCommand(command.source, commandId, resolved.failure);
  }

  const workspaceFailure = validateWorkspace(resolved.target);
  if (workspaceFailure) {
    return failCommand(command.source, commandId, workspaceFailure);
  }

  const jointFailure = validateJointAngles(resolved.jointAngles);
  if (jointFailure) {
    return failCommand(command.source, commandId, jointFailure);
  }

  const finalPosition = computeForwardKinematics(resolved.jointAngles);
  if (!isWithinTolerance(finalPosition, resolved.target)) {
    return failCommand(command.source, commandId, {
      reason: "IK_FAILED",
      message: "The IK solution did not reach the requested target within tolerance.",
    });
  }

  const runId = ++motionRunId;
  const store = useRobotStore.getState();
  store.beginMotion(command.source, resolved.target);

  const trajectory = createJointTrajectory(store.jointAngles, resolved.jointAngles);
  const stepDuration = getTrajectoryStepDuration(command.speed);
  for (const frame of trajectory) {
    if (runId !== motionRunId || useRobotStore.getState().isCancelled) {
      return cancelledResult(commandId);
    }

    useRobotStore.getState().updateTrajectory(frame, computeForwardKinematics(frame));
    await waitForTrajectoryStep(stepDuration);
  }

  if (runId !== motionRunId || useRobotStore.getState().isCancelled) {
    return cancelledResult(commandId);
  }

  const result: Extract<MotionResult, { success: true }> = {
    success: true,
    commandId,
    finalPosition,
    target: resolved.target,
    jointAngles: resolved.jointAngles,
    message: "Motion completed successfully.",
  };
  useRobotStore.getState().completeMotion(result);
  return result;
}

export function cancelMotion(): void {
  motionRunId += 1;
  const state = useRobotStore.getState();
  if (state.status === "moving") {
    state.markCancelled({
      success: false,
      commandId: "cancelled-motion",
      reason: "CANCELLED",
      message: "Motion cancelled by the operator.",
    });
  }
}

export function resetMotionCancellation(): void {
  const state = useRobotStore.getState();
  if (state.status === "cancelled") {
    state.resetCancellation();
  }
}

export const resetCancellation = resetMotionCancellation;

type ResolvedCommand =
  | { ok: true; target: Vector3Value; jointAngles: JointAngles }
  | { ok: false; failure: ValidationFailure };

function resolveCommand(
  command: Exclude<MotionCommand, { type: "STOP" }>,
  currentJointAngles: JointAngles,
  currentPosition: Vector3Value,
): ResolvedCommand {
  if (command.type === "HOME") {
    return {
      ok: true,
      target: computeForwardKinematics(INITIAL_JOINT_ANGLES),
      jointAngles: { ...INITIAL_JOINT_ANGLES },
    };
  }

  if (command.type === "MOVE_JOINT") {
    if (!isJointName(command.jointName)) {
      return {
        ok: false,
        failure: { reason: "INVALID_COMMAND", message: `Unknown joint: ${command.jointName}.` },
      };
    }

    const jointAngles = cloneJointAngles(currentJointAngles);
    jointAngles[command.jointName] = command.angle;
    return { ok: true, target: computeForwardKinematics(jointAngles), jointAngles };
  }

  const target =
    command.type === "MOVE_TO"
      ? command.target
      : {
          x: currentPosition.x + command.delta.x,
          y: currentPosition.y + command.delta.y,
          z: currentPosition.z + command.delta.z,
        };
  const solution = solveInverseKinematics(target, currentJointAngles);

  return solution
    ? { ok: true, target, jointAngles: solution.jointAngles }
    : {
        ok: false,
        failure: {
          reason: "IK_FAILED",
          message: "No valid inverse-kinematics solution exists for this target.",
        },
      };
}

function failCommand(
  source: MotionCommand["source"],
  commandId: string,
  failure: { reason: MotionFailureReason; message: string },
): MotionResult {
  const result: Extract<MotionResult, { success: false }> = {
    success: false,
    commandId,
    reason: failure.reason,
    message: failure.message,
  };
  useRobotStore.getState().failMotion(source, result);
  return result;
}

function cancelledResult(commandId: string): MotionResult {
  const state = useRobotStore.getState();
  const result: Extract<MotionResult, { success: false }> = {
    success: false,
    commandId,
    reason: "CANCELLED",
    message: "Motion cancelled by the operator.",
  };

  if (state.status !== "cancelled") {
    state.markCancelled(result);
  }

  return result;
}

function getCommandId(command: MotionCommand): string {
  if (command.id) {
    return command.id;
  }

  generatedCommandCount += 1;
  return `motion-${generatedCommandCount}`;
}
