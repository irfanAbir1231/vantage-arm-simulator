// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import {
  INITIAL_JOINT_ANGLES,
  solveInverseKinematics as solveKinematics,
} from "./kinematics";
import type { JointState, Vector3Value } from "./types";

export function solveInverseKinematics(target: Vector3Value): JointState | null {
  return solveKinematics(target, INITIAL_JOINT_ANGLES)?.jointAngles ?? null;
}
