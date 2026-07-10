// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

export type Vector3Value = {
  x: number;
  y: number;
  z: number;
};

export type MotionSource =
  | "dashboard"
  | "joystick"
  | "keyboard"
  | "voice"
  | "autonomous";

type MotionMetadata = {
  id?: string;
  speed?: number;
};

export type MotionCommand =
  | (MotionMetadata & {
      type: "MOVE_RELATIVE";
      source: MotionSource;
      delta: Vector3Value;
    })
  | (MotionMetadata & {
      type: "MOVE_TO";
      source: MotionSource;
      target: Vector3Value;
    })
  | (MotionMetadata & {
      type: "MOVE_JOINT";
      source: MotionSource;
      jointName: string;
      angle: number;
    })
  | {
      id?: string;
      type: "STOP";
      source: MotionSource;
    }
  | {
      id?: string;
      type: "HOME";
      source: MotionSource;
      speed?: number;
    };

export const JOINT_NAMES = [
  "joint_1",
  "joint_2",
  "joint_3",
  "joint_4",
  "joint_5",
  "joint_6",
  "stylus_pitch",
] as const;

export type JointName = (typeof JOINT_NAMES)[number];
export type JointAngles = Record<JointName, number> & Record<string, number>;
export type JointState = JointAngles;

export type MotionFailureReason =
  | "INVALID_COMMAND"
  | "BUSY"
  | "OUTSIDE_WORKSPACE"
  | "JOINT_LIMIT"
  | "IK_FAILED"
  | "CANCELLED"
  | "ROBOT_NOT_READY";

export type MotionResult =
  | {
      success: true;
      commandId: string;
      finalPosition: Vector3Value;
      target: Vector3Value;
      jointAngles: JointAngles;
      message: string;
    }
  | {
      success: false;
      commandId: string;
      reason: MotionFailureReason;
      message: string;
    };

export type MotionStatus =
  | "idle"
  | "validating"
  | "moving"
  | "success"
  | "error"
  | "cancelled";

export type RobotMotionStatus = MotionStatus;

export function isJointName(value: string): value is JointName {
  return JOINT_NAMES.some((jointName) => jointName === value);
}
