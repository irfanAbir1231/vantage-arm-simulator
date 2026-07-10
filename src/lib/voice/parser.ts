// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import { ROBOT_CONFIG, type MotionCommand, type Vector3Value } from "@/lib/robot";

import {
  isVoiceDirection,
  isVoiceDistanceUnit,
  VOICE_DIRECTION_VECTORS,
  VOICE_UNIT_TO_METERS,
  type VoiceDirection,
} from "./command-dictionary";

export type VoiceParseResult =
  | {
      success: true;
      command: MotionCommand;
      description: string;
      normalizedInput: string;
    }
  | {
      success: false;
      error: string;
      normalizedInput: string;
    };

const DECIMAL_NUMBER_PATTERN = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

function normalizeInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function failure(error: string, normalizedInput: string): VoiceParseResult {
  return { success: false, error, normalizedInput };
}

function scaleDirection(direction: VoiceDirection, distance: number): Vector3Value {
  const vector = VOICE_DIRECTION_VECTORS[direction];

  return {
    x: vector.x * distance,
    y: vector.y * distance,
    z: vector.z * distance,
  };
}

function parseDistance(
  amountText: string,
  unitText: string,
  normalizedInput: string,
): number | VoiceParseResult {
  if (!DECIMAL_NUMBER_PATTERN.test(amountText)) {
    return failure("Movement distance must be a positive finite number.", normalizedInput);
  }

  const amount = Number(amountText);

  if (!Number.isFinite(amount) || amount <= 0) {
    return failure("Movement distance must be greater than zero.", normalizedInput);
  }

  if (!isVoiceDistanceUnit(unitText)) {
    return failure(`Unsupported distance unit: "${unitText}".`, normalizedInput);
  }

  const distance = amount * VOICE_UNIT_TO_METERS[unitText];

  if (!Number.isFinite(distance) || distance <= 0) {
    return failure("Movement distance must resolve to positive finite meters.", normalizedInput);
  }

  return distance;
}

function createMoveResult(
  direction: VoiceDirection,
  distance: number,
  commandId: string,
  normalizedInput: string,
): VoiceParseResult {
  return {
    success: true,
    command: {
      id: commandId,
      type: "MOVE_RELATIVE",
      source: "voice",
      delta: scaleDirection(direction, distance),
    },
    description: `Move ${direction} by ${distance} m`,
    normalizedInput,
  };
}

export function parseVoiceCommand(
  input: string,
  commandId: string,
): VoiceParseResult {
  const normalizedInput = normalizeInput(input);

  if (commandId.trim().length === 0) {
    return failure("Command ID is required.", normalizedInput);
  }

  if (normalizedInput.length === 0) {
    return failure("Command is empty.", normalizedInput);
  }

  if (normalizedInput === "stop") {
    return {
      success: true,
      command: { id: commandId, type: "STOP", source: "voice" },
      description: "Stop motion",
      normalizedInput,
    };
  }

  if (normalizedInput === "home") {
    return {
      success: true,
      command: { id: commandId, type: "HOME", source: "voice" },
      description: "Move to home position",
      normalizedInput,
    };
  }

  const parts = normalizedInput.split(" ");

  if (parts[0] !== "move") {
    return failure(`Unsupported command: "${normalizedInput}".`, normalizedInput);
  }

  const direction = parts[1];

  if (!direction || !isVoiceDirection(direction)) {
    return failure(
      direction
        ? `Unsupported movement direction: "${direction}".`
        : "Movement direction is required.",
      normalizedInput,
    );
  }

  if (parts.length === 2) {
    return createMoveResult(
      direction,
      ROBOT_CONFIG.movementStep,
      commandId,
      normalizedInput,
    );
  }

  if (parts.length !== 4) {
    return failure(
      "Use 'move <direction>' or 'move <direction> <amount> <unit>'.",
      normalizedInput,
    );
  }

  const distance = parseDistance(parts[2], parts[3], normalizedInput);

  return typeof distance === "number"
    ? createMoveResult(direction, distance, commandId, normalizedInput)
    : distance;
}
