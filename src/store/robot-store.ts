// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import { create } from "zustand";

import type {
  JointState,
  MotionResult,
  MotionSource,
  MotionStatus,
  Vector3Value,
} from "@/lib/robot";

type RobotStore = {
  robotLoaded: boolean;
  jointAngles: JointState;
  endEffectorPosition: Vector3Value;
  targetPosition: Vector3Value;
  status: MotionStatus;
  activeSource: MotionSource | null;
  activeKey: string | null;
  currentPinIndex: number;
  lastMessage: string;
  lastResult: MotionResult | null;
  setRobotLoaded: (robotLoaded: boolean) => void;
  setJointAngles: (jointAngles: JointState) => void;
  setEndEffectorPosition: (endEffectorPosition: Vector3Value) => void;
  setTargetPosition: (targetPosition: Vector3Value) => void;
  setStatus: (status: MotionStatus) => void;
  setActiveSource: (activeSource: MotionSource | null) => void;
  setActiveKey: (activeKey: string | null) => void;
  setCurrentPinIndex: (currentPinIndex: number) => void;
  setLastMessage: (lastMessage: string) => void;
  setLastResult: (lastResult: MotionResult | null) => void;
};

const ZERO_VECTOR: Vector3Value = { x: 0, y: 0, z: 0 };

export const useRobotStore = create<RobotStore>((set) => ({
  robotLoaded: false,
  jointAngles: {},
  endEffectorPosition: ZERO_VECTOR,
  targetPosition: ZERO_VECTOR,
  status: "idle",
  activeSource: null,
  activeKey: null,
  currentPinIndex: 0,
  lastMessage: "Robot store placeholder is ready.",
  lastResult: null,
  setRobotLoaded: (robotLoaded) => set({ robotLoaded }),
  setJointAngles: (jointAngles) => set({ jointAngles }),
  setEndEffectorPosition: (endEffectorPosition) => set({ endEffectorPosition }),
  setTargetPosition: (targetPosition) => set({ targetPosition }),
  setStatus: (status) => set({ status }),
  setActiveSource: (activeSource) => set({ activeSource }),
  setActiveKey: (activeKey) => set({ activeKey }),
  setCurrentPinIndex: (currentPinIndex) => set({ currentPinIndex }),
  setLastMessage: (lastMessage) => set({ lastMessage }),
  setLastResult: (lastResult) => set({ lastResult }),
}));
