// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import type { NormalizedPinConfig, PinValidationResult } from "./types";

export function validatePinDetailed(
  pin: string,
  config: NormalizedPinConfig,
): PinValidationResult {
  if (pin.length !== 6) {
    return {
      success: false,
      error: "PIN must contain exactly 6 digits.",
    };
  }

  if (!/^\d{6}$/.test(pin)) {
    return {
      success: false,
      error: "PIN must contain only digits.",
    };
  }

  if (Object.keys(config.keys).length === 0) {
    return {
      success: false,
      error: "Panel configuration does not contain any keys.",
    };
  }

  for (const [index, digit] of [...pin].entries()) {
    if (!Object.hasOwn(config.keys, digit)) {
      return {
        success: false,
        error: `PIN digit "${digit}" at position ${index + 1} is not available on the panel.`,
      };
    }
  }

  return { success: true, pin };
}

export function validatePin(pin: string, config: NormalizedPinConfig): boolean {
  return validatePinDetailed(pin, config).success;
}
