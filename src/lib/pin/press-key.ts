// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import { ROBOT_CONFIG, type Vector3Value } from "@/lib/robot";

import type {
  KeyPressPlanResult,
  PinApproachAxis,
  PinKeyTarget,
  PinPlanPhase,
  PinPlanStep,
} from "./types";

const APPROACH_VECTORS: Record<PinApproachAxis, Vector3Value> = {
  "+x": { x: 1, y: 0, z: 0 },
  "-x": { x: -1, y: 0, z: 0 },
  "+y": { x: 0, y: 1, z: 0 },
  "-y": { x: 0, y: -1, z: 0 },
  "+z": { x: 0, y: 0, z: 1 },
  "-z": { x: 0, y: 0, z: -1 },
};

function isFinitePosition(position: Vector3Value): boolean {
  return (
    Number.isFinite(position.x) &&
    Number.isFinite(position.y) &&
    Number.isFinite(position.z)
  );
}

function createStep(
  pinIndex: number,
  keyLabel: string,
  phase: PinPlanPhase,
  target: Vector3Value,
): PinPlanStep {
  return {
    pinIndex,
    keyLabel,
    phase,
    target: { ...target },
  };
}

export function describeKeyPress(label: string): string {
  return `Press key ${label}`;
}

export function createKeyPressPlan(
  key: PinKeyTarget,
  approachAxis: PinApproachAxis,
  pinIndex: number,
  hoverOffset = ROBOT_CONFIG.hoverOffset,
): KeyPressPlanResult {
  if (!Number.isInteger(pinIndex) || pinIndex < 0) {
    return { success: false, error: "PIN index must be a non-negative integer." };
  }

  if (key.label.length === 0) {
    return { success: false, error: "Panel key label must be non-empty." };
  }

  if (!isFinitePosition(key.position)) {
    return {
      success: false,
      error: `Panel key "${key.label}" position must contain finite coordinates.`,
    };
  }

  if (!Number.isFinite(hoverOffset) || hoverOffset <= 0) {
    return { success: false, error: "Hover offset must be a positive finite number." };
  }

  const approach = APPROACH_VECTORS[approachAxis];

  if (!approach) {
    return { success: false, error: `Unsupported approach axis: "${approachAxis}".` };
  }

  // The approach vector points from hover toward touch, so hover is opposite it.
  const hoverTarget: Vector3Value = {
    x: key.position.x - approach.x * hoverOffset,
    y: key.position.y - approach.y * hoverOffset,
    z: key.position.z - approach.z * hoverOffset,
  };

  if (!isFinitePosition(hoverTarget)) {
    return {
      success: false,
      error: `Panel key "${key.label}" hover target must contain finite coordinates.`,
    };
  }

  return {
    success: true,
    steps: [
      createStep(pinIndex, key.label, "hover", hoverTarget),
      createStep(pinIndex, key.label, "touch", key.position),
      createStep(pinIndex, key.label, "retract", hoverTarget),
    ],
  };
}
