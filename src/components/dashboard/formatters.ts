// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import type { Vector3Value } from "@/lib/robot";

export const KNOWN_JOINT_ORDER = [
  "joint_1",
  "joint_2",
  "joint_3",
  "joint_4",
  "joint_5",
  "joint_6",
  "stylus_pitch",
] as const;

export function formatMeters(value: number): string {
  return `${value.toFixed(3)} m`;
}

export function formatRadians(value: number): string {
  return `${value.toFixed(3)} rad`;
}

export function formatDegrees(value: number): string {
  return `${(value * (180 / Math.PI)).toFixed(1)}°`;
}

export function formatVector(vector: Vector3Value): string {
  return `X ${formatMeters(vector.x)} | Y ${formatMeters(vector.y)} | Z ${formatMeters(vector.z)}`;
}

export function sortJointNames(names: string[]): string[] {
  const knownOrder = new Map<string, number>(
    KNOWN_JOINT_ORDER.map((name, index) => [name, index]),
  );

  return [...names].sort((a, b) => {
    const aIndex = knownOrder.get(a);
    const bIndex = knownOrder.get(b);

    if (aIndex !== undefined && bIndex !== undefined) {
      return aIndex - bIndex;
    }

    if (aIndex !== undefined) {
      return -1;
    }

    if (bIndex !== undefined) {
      return 1;
    }

    return a.localeCompare(b, undefined, { numeric: true });
  });
}
