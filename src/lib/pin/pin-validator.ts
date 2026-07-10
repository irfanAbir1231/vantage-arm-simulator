// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import type { PinConfig } from "./types";

export function validatePin(pin: string, config: PinConfig): boolean {
  const labels = new Set(config.keys.map((key) => key.label));

  return pin.length === 6 && [...pin].every((digit) => labels.has(digit));
}
