// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import {
  getJointDefinition,
  PIN_TOLERANCE_METERS,
} from "./kinematics";
import {
  JOINT_NAMES,
  isJointName,
  type JointAngles,
  type MotionCommand,
  type MotionFailureReason,
  type MotionSource,
  type Vector3Value,
} from "./types";

export const WORKSPACE_BOUNDS = {
  x: { min: -0.75, max: 0.75 },
  y: { min: -0.75, max: 0.75 },
  z: { min: 0, max: 1.5 },
} as const;

export type ValidationFailure = {
  reason: MotionFailureReason;
  message: string;
};

const MOTION_SOURCES: readonly MotionSource[] = [
  "dashboard",
  "joystick",
  "keyboard",
  "voice",
  "autonomous",
];

export function validateMotionCommand(command: MotionCommand): ValidationFailure | null {
  if (!MOTION_SOURCES.includes(command.source)) {
    return invalidCommand("Motion source is not recognized.");
  }

  if (command.type === "STOP" || command.type === "HOME") {
    return command.type === "HOME" ? validateSpeed(command.speed) : null;
  }

  const speedFailure = validateSpeed(command.speed);
  if (speedFailure) {
    return speedFailure;
  }

  if (command.type === "MOVE_RELATIVE") {
    return validateVector(command.delta, "Movement delta");
  }

  if (command.type === "MOVE_TO") {
    return validateVector(command.target, "Target position");
  }

  if (!isJointName(command.jointName)) {
    return invalidCommand(`Unknown joint: ${command.jointName}.`);
  }

  if (!Number.isFinite(command.angle)) {
    return invalidCommand("Joint angle must be a finite number.");
  }

  return null;
}

export function validateWorkspace(target: Vector3Value): ValidationFailure | null {
  const numericFailure = validateVector(target, "Target position");
  if (numericFailure) {
    return numericFailure;
  }

  const isInside =
    target.x >= WORKSPACE_BOUNDS.x.min &&
    target.x <= WORKSPACE_BOUNDS.x.max &&
    target.y >= WORKSPACE_BOUNDS.y.min &&
    target.y <= WORKSPACE_BOUNDS.y.max &&
    target.z >= WORKSPACE_BOUNDS.z.min &&
    target.z <= WORKSPACE_BOUNDS.z.max;

  return isInside
    ? null
    : {
        reason: "OUTSIDE_WORKSPACE",
        message: "Target is outside the configured workspace bounds.",
      };
}

export function isWithinWorkspace(position: Vector3Value): boolean {
  return validateWorkspace(position) === null;
}

export function validateJointAngles(jointAngles: JointAngles): ValidationFailure | null {
  for (const jointName of JOINT_NAMES) {
    const angle = jointAngles[jointName];
    if (!Number.isFinite(angle)) {
      return invalidCommand("Joint solution contains an invalid angle.");
    }

    const definition = getJointDefinition(jointName);
    if (angle < definition.lower || angle > definition.upper) {
      return {
        reason: "JOINT_LIMIT",
        message: `${jointName} is outside its URDF joint limit.`,
      };
    }
  }

  return null;
}

export function isWithinTolerance(
  actual: Vector3Value,
  target: Vector3Value,
  tolerance = PIN_TOLERANCE_METERS,
): boolean {
  return Math.sqrt(
    (actual.x - target.x) ** 2 +
      (actual.y - target.y) ** 2 +
      (actual.z - target.z) ** 2,
  ) <= tolerance;
}

function validateVector(vector: Vector3Value, label: string): ValidationFailure | null {
  return Number.isFinite(vector.x) && Number.isFinite(vector.y) && Number.isFinite(vector.z)
    ? null
    : invalidCommand(`${label} must contain only finite x, y, and z values.`);
}

function invalidCommand(message: string): ValidationFailure {
  return { reason: "INVALID_COMMAND", message };
}

function validateSpeed(speed: number | undefined): ValidationFailure | null {
  if (speed === undefined) {
    return null;
  }

  return Number.isFinite(speed) && speed > 0
    ? null
    : invalidCommand("Motion speed must be a positive finite number.");
}
