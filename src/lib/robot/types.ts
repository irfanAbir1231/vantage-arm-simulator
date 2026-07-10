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

export type MotionCommand =
  | {
      id: string;
      type: "MOVE_RELATIVE";
      source: MotionSource;
      delta: Vector3Value;
      speed?: number;
    }
  | {
      id: string;
      type: "MOVE_TO";
      source: MotionSource;
      target: Vector3Value;
      speed?: number;
    }
  | {
      id: string;
      type: "MOVE_JOINT";
      source: MotionSource;
      jointName: string;
      angle: number;
      speed?: number;
    }
  | {
      id: string;
      type: "STOP";
      source: MotionSource;
    }
  | {
      id: string;
      type: "HOME";
      source: MotionSource;
    };

export type MotionFailureReason =
  | "INVALID_COMMAND"
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

export type JointState = Record<string, number>;
