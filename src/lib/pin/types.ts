// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import type { Vector3Value } from "@/lib/robot";

export type PinApproachAxis = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

export type PinKeyTarget = {
  label: string;
  position: Vector3Value;
};

export type NormalizedPinConfig = {
  frame: string;
  units: "meters";
  approachAxis: PinApproachAxis;
  keys: Record<string, PinKeyTarget>;
};

export type PinConfigParseResult =
  | {
      success: true;
      config: NormalizedPinConfig;
    }
  | {
      success: false;
      error: string;
    };

export type PinValidationResult =
  | {
      success: true;
      pin: string;
    }
  | {
      success: false;
      error: string;
    };

export type PinPlanPhase = "hover" | "touch" | "retract";

export type PinPlanStep = {
  pinIndex: number;
  keyLabel: string;
  phase: PinPlanPhase;
  target: Vector3Value;
};

export type KeyPressPlanResult =
  | {
      success: true;
      steps: PinPlanStep[];
    }
  | {
      success: false;
      error: string;
    };

export type PinPlanResult =
  | {
      success: true;
      pin: string;
      steps: PinPlanStep[];
    }
  | {
      success: false;
      error: string;
    };

// Retained for the existing createEmptyPinConfig compatibility export.
export type PinConfig = {
  keys: PinKeyTarget[];
};
