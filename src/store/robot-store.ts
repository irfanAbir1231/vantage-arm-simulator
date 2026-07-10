import { create } from "zustand";

import {
  computeForwardKinematics,
  INITIAL_JOINT_ANGLES,
} from "@/lib/robot/kinematics";
import type {
  JointAngles,
  MotionSource,
  RobotMotionStatus,
  Vector3Value,
} from "@/lib/robot/types";

type RobotStore = {
  jointAngles: JointAngles;
  endEffectorPosition: Vector3Value;
  targetPosition: Vector3Value | null;
  status: RobotMotionStatus;
  message: string;
  activeSource: MotionSource | null;
  activeKey: string | null;
  completedDigits: number;
  isCancelled: boolean;
  beginMotion: (source: MotionSource, target: Vector3Value) => void;
  updateTrajectory: (jointAngles: JointAngles, position: Vector3Value) => void;
  completeMotion: (message: string) => void;
  failMotion: (source: MotionSource, message: string) => void;
  markCancelled: (message: string) => void;
  resetCancellation: () => void;
  setPinProgress: (activeKey: string | null, completedDigits: number) => void;
  resetPinProgress: () => void;
};

const initialPosition = computeForwardKinematics(INITIAL_JOINT_ANGLES);

export const useRobotStore = create<RobotStore>((set) => ({
  jointAngles: { ...INITIAL_JOINT_ANGLES },
  endEffectorPosition: initialPosition,
  targetPosition: null,
  status: "idle",
  message: "Ready for a motion command.",
  activeSource: null,
  activeKey: null,
  completedDigits: 0,
  isCancelled: false,
  beginMotion: (activeSource, targetPosition) =>
    set({
      activeSource,
      targetPosition,
      status: "moving",
      message: "Motion in progress.",
      isCancelled: false,
    }),
  updateTrajectory: (jointAngles, endEffectorPosition) =>
    set({ jointAngles, endEffectorPosition }),
  completeMotion: (message) =>
    set({ status: "success", message, targetPosition: null, isCancelled: false }),
  failMotion: (activeSource, message) =>
    set({
      activeSource,
      status: "error",
      message,
      targetPosition: null,
      isCancelled: false,
    }),
  markCancelled: (message) =>
    set({
      status: "cancelled",
      message,
      targetPosition: null,
      isCancelled: true,
    }),
  resetCancellation: () =>
    set({ status: "idle", message: "Ready for a new motion command.", isCancelled: false }),
  setPinProgress: (activeKey, completedDigits) => set({ activeKey, completedDigits }),
  resetPinProgress: () => set({ activeKey: null, completedDigits: 0 }),
}));
