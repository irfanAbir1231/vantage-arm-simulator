// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import { ROBOT_CONFIG } from "@/lib/robot";

import { createKeyPressPlan } from "./press-key";
import type { NormalizedPinConfig, PinPlanResult, PinPlanStep } from "./types";
import { validatePinDetailed } from "./pin-validator";

export function createPinSequence(pin: string): string[] {
  return [...pin];
}

export function createPinPlan(
  pin: string,
  config: NormalizedPinConfig,
  hoverOffset = ROBOT_CONFIG.hoverOffset,
): PinPlanResult {
  const validation = validatePinDetailed(pin, config);

  if (!validation.success) {
    return validation;
  }

  const steps: PinPlanStep[] = [];

  for (const [pinIndex, keyLabel] of [...validation.pin].entries()) {
    const key = config.keys[keyLabel];

    if (!key) {
      return {
        success: false,
        error: `Panel key "${keyLabel}" is missing from the normalized configuration.`,
      };
    }

    const keyPlan = createKeyPressPlan(
      key,
      config.approachAxis,
      pinIndex,
      hoverOffset,
    );

    if (!keyPlan.success) {
      return keyPlan;
    }

    steps.push(...keyPlan.steps);
  }

  return { success: true, pin: validation.pin, steps };
}
