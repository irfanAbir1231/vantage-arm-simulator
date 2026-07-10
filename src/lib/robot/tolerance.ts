// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import { ROBOT_CONFIG } from "./config";
import type { Vector3Value } from "./types";

export function isWithinTolerance(
  actual: Vector3Value,
  target: Vector3Value,
  tolerance = ROBOT_CONFIG.keyPressTolerance,
): boolean {
  return (
    Math.abs(actual.x - target.x) <= tolerance &&
    Math.abs(actual.y - target.y) <= tolerance &&
    Math.abs(actual.z - target.z) <= tolerance
  );
}
