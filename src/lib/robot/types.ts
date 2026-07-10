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

export type MotionCommand =
  | {
      type: "MOVE_RELATIVE";
      source: MotionSource;
      delta: Vector3Value;
    }
  | {
      type: "MOVE_TO";
      source: MotionSource;
      target: Vector3Value;
    }
  | {
      type: "MOVE_JOINT";
      source: MotionSource;
      jointName: string;
      angle: number;
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

export type JointAngles = Record<JointName, number>;

export type MotionFailureReason =
  | "invalid-command"
  | "busy"
  | "workspace"
  | "unreachable"
  | "joint-limit"
  | "cancelled";

export type MotionResult =
  | {
      ok: true;
      message: string;
      target: Vector3Value;
      jointAngles: JointAngles;
    }
  | {
      ok: false;
      message: string;
      reason: MotionFailureReason;
    };

export type RobotMotionStatus =
  | "idle"
  | "moving"
  | "success"
  | "error"
  | "cancelled";

export function isJointName(value: string): value is JointName {
  return JOINT_NAMES.some((jointName) => jointName === value);
}
