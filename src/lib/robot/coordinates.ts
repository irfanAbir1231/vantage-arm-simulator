// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import type { Vector3Value } from "./types";

export function cloneVector(value: Vector3Value): Vector3Value {
  return { x: value.x, y: value.y, z: value.z };
}
