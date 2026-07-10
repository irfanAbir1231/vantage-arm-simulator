// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import type { Vector3Value } from "@/lib/robot";

export function baseFrameToScenePosition(value: Vector3Value): [number, number, number] {
  return [value.x, value.z, -value.y];
}
