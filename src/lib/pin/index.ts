// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

export { createEmptyPinConfig, normalizePinConfig } from "./config-loader";
export { createPinPlan, createPinSequence } from "./pin-sequence";
export { validatePin, validatePinDetailed } from "./pin-validator";
export { createKeyPressPlan, describeKeyPress } from "./press-key";
export type {
  KeyPressPlanResult,
  NormalizedPinConfig,
  PinApproachAxis,
  PinConfig,
  PinConfigParseResult,
  PinKeyTarget,
  PinPlanResult,
  PinPlanPhase,
  PinPlanStep,
  PinValidationResult,
} from "./types";
