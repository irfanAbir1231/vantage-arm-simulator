import type { Vector3Value } from "@/lib/robot";
import { isJointName } from "@/lib/robot/types";

import type {
  AgentAction,
  AgentDecision,
  AgentInterpretationContext,
  AgentValidationContext,
} from "./types";

const MAX_ACTIONS = 10;
const MAX_REPEAT = 3;
const MAX_TEXT_LENGTH = 500;
const MAX_RELATIVE_DISTANCE_METERS = 0.25;
const MAX_ABSOLUTE_JOINT_ANGLE = Math.PI * 2;

type RecordValue = Record<string, unknown>;

export type AgentDecisionParseResult =
  | { success: true; decision: AgentDecision }
  | { success: false; error: string };

export type AgentContextParseResult =
  | { success: true; context: AgentInterpretationContext }
  | { success: false; error: string };

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(record: RecordValue, keys: readonly string[]): boolean {
  return Object.keys(record).every((key) => keys.includes(key));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

type TextParseResult =
  | { success: true; value: string | null }
  | { success: false; error: string };

function getTextError(...results: TextParseResult[]): string {
  for (const result of results) {
    if (!result.success) {
      return result.error;
    }
  }

  return "Text validation failed.";
}

function parseShortText(value: unknown, label: string, nullable = false): TextParseResult {
  if (nullable && value === null) {
    return { success: true, value: null };
  }

  if (typeof value !== "string" || value.trim().length === 0 || value.length > MAX_TEXT_LENGTH) {
    return {
      success: false,
      error: `${label} must be a non-empty string up to ${MAX_TEXT_LENGTH} characters.`,
    };
  }

  return { success: true, value: value.trim() };
}

function parseVector(value: unknown, label: string): Vector3Value | string {
  if (!isRecord(value) || !hasOnlyKeys(value, ["x", "y", "z"])) {
    return `${label} must contain only x, y, and z.`;
  }

  if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y) || !isFiniteNumber(value.z)) {
    return `${label} coordinates must be finite numbers.`;
  }

  return { x: value.x, y: value.y, z: value.z };
}

function parseAction(value: unknown, context: AgentValidationContext): AgentAction | string {
  if (!isRecord(value) || typeof value.type !== "string") {
    return "Each action must be an object with a valid type.";
  }

  if (value.type === "MOVE_RELATIVE") {
    if (!hasOnlyKeys(value, ["type", "axis", "distanceMeters"])) {
      return "MOVE_RELATIVE contains unsupported fields.";
    }

    if (value.axis !== "x" && value.axis !== "y" && value.axis !== "z") {
      return "MOVE_RELATIVE axis must be x, y, or z.";
    }

    if (
      !isFiniteNumber(value.distanceMeters) ||
      value.distanceMeters === 0 ||
      Math.abs(value.distanceMeters) > MAX_RELATIVE_DISTANCE_METERS
    ) {
      return "MOVE_RELATIVE distanceMeters must be a non-zero finite value within the safe planning range.";
    }

    return { type: "MOVE_RELATIVE", axis: value.axis, distanceMeters: value.distanceMeters };
  }

  if (value.type === "MOVE_TO") {
    if (!hasOnlyKeys(value, ["type", "target"])) {
      return "MOVE_TO contains unsupported fields.";
    }

    const target = parseVector(value.target, "MOVE_TO target");
    return typeof target === "string" ? target : { type: "MOVE_TO", target };
  }

  if (value.type === "MOVE_JOINT") {
    if (!hasOnlyKeys(value, ["type", "jointName", "angleRadians"])) {
      return "MOVE_JOINT contains unsupported fields.";
    }

    if (
      typeof value.jointName !== "string" ||
      !isJointName(value.jointName) ||
      !context.allowedJointNames.includes(value.jointName)
    ) {
      return "MOVE_JOINT uses an unavailable joint.";
    }

    if (
      !isFiniteNumber(value.angleRadians) ||
      Math.abs(value.angleRadians) > MAX_ABSOLUTE_JOINT_ANGLE
    ) {
      return "MOVE_JOINT angleRadians must be a finite value within the safe planning range.";
    }

    return {
      type: "MOVE_JOINT",
      jointName: value.jointName,
      angleRadians: value.angleRadians,
    };
  }

  if (value.type === "PRESS_KEY") {
    if (!hasOnlyKeys(value, ["type", "key", "repeat"])) {
      return "PRESS_KEY contains unsupported fields.";
    }

    if (typeof value.key !== "string" || !context.availableKeys.includes(value.key)) {
      return "PRESS_KEY uses an unavailable panel key.";
    }

    if (
      typeof value.repeat !== "number" ||
      !Number.isInteger(value.repeat) ||
      value.repeat < 1 ||
      value.repeat > MAX_REPEAT
    ) {
      return `PRESS_KEY repeat must be an integer from 1 to ${MAX_REPEAT}.`;
    }

    return { type: "PRESS_KEY", key: value.key, repeat: value.repeat };
  }

  if (value.type === "HOME" || value.type === "STOP") {
    return hasOnlyKeys(value, ["type"])
      ? { type: value.type }
      : `${value.type} contains unsupported fields.`;
  }

  return "Action type is not supported.";
}

export function parseAgentDecision(
  value: unknown,
  context: AgentValidationContext,
): AgentDecisionParseResult {
  if (!isRecord(value) || typeof value.kind !== "string" || !Array.isArray(value.actions)) {
    return { success: false, error: "Agent response has an invalid decision structure." };
  }

  if (value.kind === "plan") {
    if (!hasOnlyKeys(value, ["kind", "understood", "confirmation", "actions", "spokenResponse"])) {
      return { success: false, error: "Plan contains unsupported fields." };
    }

    const understood = parseShortText(value.understood, "Plan understood");
    const confirmation = parseShortText(value.confirmation, "Plan confirmation");
    const spokenResponse = parseShortText(value.spokenResponse, "Plan spokenResponse");

    if (!understood.success || !confirmation.success || !spokenResponse.success) {
      return { success: false, error: getTextError(understood, confirmation, spokenResponse) };
    }

    if (value.actions.length === 0 || value.actions.length > MAX_ACTIONS) {
      return { success: false, error: `Plan must contain between 1 and ${MAX_ACTIONS} actions.` };
    }

    const actions: AgentAction[] = [];
    for (const action of value.actions) {
      const parsedAction = parseAction(action, context);
      if (typeof parsedAction === "string") {
        return { success: false, error: parsedAction };
      }
      actions.push(parsedAction);
    }

    if (actions.some((action) => action.type === "STOP") && actions.length !== 1) {
      return { success: false, error: "STOP must be the only action in an agent plan." };
    }

    return {
      success: true,
      decision: {
        kind: "plan",
        understood: understood.value as string,
        confirmation: confirmation.value as string,
        actions,
        spokenResponse: spokenResponse.value as string,
      },
    };
  }

  if (value.kind === "clarification") {
    if (!hasOnlyKeys(value, ["kind", "understood", "question", "actions", "spokenResponse"])) {
      return { success: false, error: "Clarification contains unsupported fields." };
    }

    const understood = parseShortText(value.understood, "Clarification understood", true);
    const question = parseShortText(value.question, "Clarification question");
    const spokenResponse = parseShortText(value.spokenResponse, "Clarification spokenResponse");

    if (
      !understood.success ||
      !question.success ||
      !spokenResponse.success ||
      value.actions.length !== 0
    ) {
      return { success: false, error: "Clarification must contain text and no actions." };
    }

    return {
      success: true,
      decision: {
        kind: "clarification",
        understood: understood.value,
        question: question.value as string,
        actions: [],
        spokenResponse: spokenResponse.value as string,
      },
    };
  }

  if (value.kind === "rejection") {
    if (!hasOnlyKeys(value, ["kind", "reason", "actions", "spokenResponse"])) {
      return { success: false, error: "Rejection contains unsupported fields." };
    }

    const reason = parseShortText(value.reason, "Rejection reason");
    const spokenResponse = parseShortText(value.spokenResponse, "Rejection spokenResponse");

    if (!reason.success || !spokenResponse.success || value.actions.length !== 0) {
      return {
        success: false,
        error: !reason.success
          ? reason.error
          : !spokenResponse.success
            ? spokenResponse.error
            : "Rejection must contain no actions.",
      };
    }

    return {
      success: true,
      decision: {
        kind: "rejection",
        reason: reason.value as string,
        actions: [],
        spokenResponse: spokenResponse.value as string,
      },
    };
  }

  return { success: false, error: "Agent response used an unsupported decision kind." };
}

export function parseAgentInterpretationContext(value: unknown): AgentContextParseResult {
  if (!isRecord(value) || !hasOnlyKeys(value, ["currentPosition", "pendingClarification"])) {
    return { success: false, error: "Agent context contains unsupported fields." };
  }

  const currentPosition = parseVector(value.currentPosition, "Current position");
  if (typeof currentPosition === "string") {
    return { success: false, error: currentPosition };
  }

  if (value.pendingClarification === undefined) {
    return { success: true, context: { currentPosition } };
  }

  if (!isRecord(value.pendingClarification) || !hasOnlyKeys(value.pendingClarification, ["originalInstruction", "question"])) {
    return { success: false, error: "Pending clarification contains unsupported fields." };
  }

  const originalInstruction = parseShortText(
    value.pendingClarification.originalInstruction,
    "Pending clarification originalInstruction",
  );
  const question = parseShortText(value.pendingClarification.question, "Pending clarification question");

  if (!originalInstruction.success || !question.success) {
    return { success: false, error: getTextError(originalInstruction, question) };
  }

  return {
    success: true,
    context: {
      currentPosition,
      pendingClarification: {
        originalInstruction: originalInstruction.value as string,
        question: question.value as string,
      },
    },
  };
}
