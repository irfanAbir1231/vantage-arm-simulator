// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import { create } from "zustand";

import {
  computeForwardKinematics,
  INITIAL_JOINT_ANGLES,
} from "@/lib/robot/kinematics";
import type {
  JointAngles,
  MotionResult,
  MotionSource,
  MotionStatus,
  Vector3Value,
} from "@/lib/robot/types";

type RobotStore = {
  robotLoaded: boolean;
  jointAngles: JointAngles;
  endEffectorPosition: Vector3Value;
  targetPosition: Vector3Value;
  status: MotionStatus;
  activeSource: MotionSource | null;
  activeKey: string | null;
  currentPinIndex: number;
  completedDigits: number;
  lastMessage: string;
  lastResult: MotionResult | null;
  isCancelled: boolean;
  setRobotLoaded: (robotLoaded: boolean) => void;
  beginMotion: (source: MotionSource, target: Vector3Value) => void;
  updateTrajectory: (jointAngles: JointAngles, position: Vector3Value) => void;
  completeMotion: (result: Extract<MotionResult, { success: true }>) => void;
  failMotion: (source: MotionSource, result: Extract<MotionResult, { success: false }>) => void;
  markCancelled: (result: Extract<MotionResult, { success: false }>) => void;
  resetCancellation: () => void;
  setPinProgress: (activeKey: string | null, completedDigits: number) => void;
  setActiveKey: (activeKey: string | null) => void;
  setCurrentPinIndex: (currentPinIndex: number) => void;
  resetPinProgress: () => void;
};

const initialPosition = computeForwardKinematics(INITIAL_JOINT_ANGLES);

export const useRobotStore = create<RobotStore>((set) => ({
  robotLoaded: false,
  jointAngles: { ...INITIAL_JOINT_ANGLES },
  endEffectorPosition: initialPosition,
  targetPosition: initialPosition,
  status: "idle",
  activeSource: null,
  activeKey: null,
  currentPinIndex: 0,
  completedDigits: 0,
  lastMessage: "Ready for a motion command.",
  lastResult: null,
  isCancelled: false,
  setRobotLoaded: (robotLoaded) => set({ robotLoaded }),
  beginMotion: (activeSource, targetPosition) =>
    set({
      activeSource,
      targetPosition,
      status: "moving",
      lastMessage: "Motion in progress.",
      isCancelled: false,
    }),
  updateTrajectory: (jointAngles, endEffectorPosition) =>
    set({ jointAngles, endEffectorPosition }),
  completeMotion: (result) =>
    set({
      status: "success",
      lastMessage: result.message,
      lastResult: result,
      targetPosition: result.target,
      isCancelled: false,
    }),
  failMotion: (activeSource, result) =>
    set({
      activeSource,
      status: "error",
      lastMessage: result.message,
      lastResult: result,
      isCancelled: false,
    }),
  markCancelled: (result) =>
    set({
      status: "cancelled",
      lastMessage: result.message,
      lastResult: result,
      isCancelled: true,
    }),
  resetCancellation: () =>
    set({
      status: "idle",
      lastMessage: "Ready for a new motion command.",
      isCancelled: false,
    }),
  setPinProgress: (activeKey, completedDigits) =>
    set({ activeKey, completedDigits, currentPinIndex: completedDigits }),
  setActiveKey: (activeKey) => set({ activeKey }),
  setCurrentPinIndex: (currentPinIndex) =>
    set({ currentPinIndex, completedDigits: currentPinIndex }),
  resetPinProgress: () => set({ activeKey: null, completedDigits: 0, currentPinIndex: 0 }),
}));
