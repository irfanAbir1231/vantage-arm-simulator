import {
  cloneJointAngles,
  computeForwardKinematics,
  solveInverseKinematics,
} from "./kinematics";
import {
  isWithinTolerance,
  type ValidationFailure,
  validateJointAngles,
  validateMotionCommand,
  validateWorkspace,
} from "./safety";
import { createJointTrajectory, waitForTrajectoryStep } from "./trajectory";
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

export async function executeMotionCommand(command: MotionCommand): Promise<MotionResult> {
  const validationFailure = validateMotionCommand(command);
  if (validationFailure) {
    return failCommand(command.source, validationFailure);
  }

  const currentState = useRobotStore.getState();
  if (currentState.status === "moving") {
    return failCommand(command.source, {
      reason: "busy",
      message: "A motion is already in progress. Cancel it before starting another command.",
    });
  }

  const resolved = resolveCommand(command, currentState.jointAngles, currentState.endEffectorPosition);
  if (!resolved.ok) {
    return failCommand(command.source, resolved.failure);
  }

  const workspaceFailure = validateWorkspace(resolved.target);
  if (workspaceFailure) {
    return failCommand(command.source, workspaceFailure);
  }

  const jointFailure = validateJointAngles(resolved.jointAngles);
  if (jointFailure) {
    return failCommand(command.source, jointFailure);
  }

  const finalPosition = computeForwardKinematics(resolved.jointAngles);
  if (!isWithinTolerance(finalPosition, resolved.target)) {
    return failCommand(command.source, {
      reason: "unreachable",
      message: "The IK solution did not reach the requested target within tolerance.",
    });
  }

  const runId = ++motionRunId;
  const store = useRobotStore.getState();
  store.beginMotion(command.source, resolved.target);

  const trajectory = createJointTrajectory(store.jointAngles, resolved.jointAngles);
  for (const frame of trajectory) {
    if (runId !== motionRunId || useRobotStore.getState().isCancelled) {
      return cancelledResult();
    }

    useRobotStore.getState().updateTrajectory(frame, computeForwardKinematics(frame));
    await waitForTrajectoryStep();
  }

  if (runId !== motionRunId || useRobotStore.getState().isCancelled) {
    return cancelledResult();
  }

  useRobotStore.getState().completeMotion("Motion completed successfully.");
  return {
    ok: true,
    message: "Motion completed successfully.",
    target: resolved.target,
    jointAngles: resolved.jointAngles,
  };
}

export function cancelMotion(): void {
  motionRunId += 1;
  const state = useRobotStore.getState();
  if (state.status === "moving") {
    state.markCancelled("Motion cancelled by the operator.");
  }
}

export function resetMotionCancellation(): void {
  const state = useRobotStore.getState();
  if (state.status === "cancelled") {
    state.resetCancellation();
  }
}

type ResolvedCommand =
  | { ok: true; target: Vector3Value; jointAngles: JointAngles }
  | { ok: false; failure: ValidationFailure };

function resolveCommand(
  command: MotionCommand,
  currentJointAngles: JointAngles,
  currentPosition: Vector3Value,
): ResolvedCommand {
  if (command.type === "MOVE_JOINT") {
    if (!isJointName(command.jointName)) {
      return {
        ok: false,
        failure: { reason: "invalid-command", message: `Unknown joint: ${command.jointName}.` },
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
          reason: "unreachable",
          message: "No valid inverse-kinematics solution exists for this target.",
        },
      };
}

function failCommand(
  source: MotionCommand["source"],
  failure: { reason: MotionFailureReason; message: string },
): MotionResult {
  useRobotStore.getState().failMotion(source, failure.message);
  return { ok: false, reason: failure.reason, message: failure.message };
}

function cancelledResult(): MotionResult {
  const state = useRobotStore.getState();
  if (state.status !== "cancelled") {
    state.markCancelled("Motion cancelled by the operator.");
  }

  return {
    ok: false,
    reason: "cancelled",
    message: "Motion cancelled by the operator.",
  };
}
