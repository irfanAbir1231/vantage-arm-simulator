// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import { ROBOT_CONFIG } from "./config";
import type { Vector3Value } from "./types";

export function isWithinWorkspace(position: Vector3Value): boolean {
  const { workspace } = ROBOT_CONFIG;

  return (
    position.x >= workspace.x[0] &&
    position.x <= workspace.x[1] &&
    position.y >= workspace.y[0] &&
    position.y <= workspace.y[1] &&
    position.z >= workspace.z[0] &&
    position.z <= workspace.z[1]
  );
}
