// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import type { Vector3Value } from "@/lib/robot";

export const VOICE_COMMAND_WORDS = [
  "move up",
  "move down",
  "move left",
  "move right",
  "move forward",
  "move backward",
  "stop",
  "home",
] as const;

export const VOICE_DIRECTION_VECTORS = {
  up: { x: 0, y: 0, z: 1 },
  down: { x: 0, y: 0, z: -1 },
  left: { x: -1, y: 0, z: 0 },
  right: { x: 1, y: 0, z: 0 },
  forward: { x: 0, y: 1, z: 0 },
  backward: { x: 0, y: -1, z: 0 },
} as const satisfies Record<string, Vector3Value>;

export type VoiceDirection = keyof typeof VOICE_DIRECTION_VECTORS;

export const VOICE_UNIT_TO_METERS = {
  centimeter: 0.01,
  centimeters: 0.01,
  centimetre: 0.01,
  centimetres: 0.01,
  cm: 0.01,
  meter: 1,
  meters: 1,
  metre: 1,
  metres: 1,
  m: 1,
} as const;

export type VoiceDistanceUnit = keyof typeof VOICE_UNIT_TO_METERS;

export function isVoiceDirection(value: string): value is VoiceDirection {
  return Object.hasOwn(VOICE_DIRECTION_VECTORS, value);
}

export function isVoiceDistanceUnit(value: string): value is VoiceDistanceUnit {
  return Object.hasOwn(VOICE_UNIT_TO_METERS, value);
}
