// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import { computeForwardKinematics } from "./kinematics";
import type { JointState, Vector3Value } from "./types";

export function estimateEndEffectorPosition(jointState: JointState): Vector3Value {
  return computeForwardKinematics(jointState);
}
