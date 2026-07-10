// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import type {
  NormalizedPinConfig,
  PinApproachAxis,
  PinConfig,
  PinConfigParseResult,
  PinKeyTarget,
} from "./types";

const PIN_APPROACH_AXES = ["+x", "-x", "+y", "-y", "+z", "-z"] as const;

export const DEFAULT_PIN_CONFIG_URL = "/robot/key.config.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPinApproachAxis(value: unknown): value is PinApproachAxis {
  return (
    typeof value === "string" &&
    PIN_APPROACH_AXES.some((approachAxis) => approachAxis === value)
  );
}

function parseKeyTarget(label: string, raw: unknown): PinKeyTarget | string {
  if (!isRecord(raw)) {
    return `Panel key "${label}" must be an object.`;
  }

  const { x, y, z } = raw;

  if (typeof x !== "number" || !Number.isFinite(x)) {
    return `Panel key "${label}" coordinate "x" must be a finite number.`;
  }

  if (typeof y !== "number" || !Number.isFinite(y)) {
    return `Panel key "${label}" coordinate "y" must be a finite number.`;
  }

  if (typeof z !== "number" || !Number.isFinite(z)) {
    return `Panel key "${label}" coordinate "z" must be a finite number.`;
  }

  return {
    label,
    position: { x, y, z },
  };
}

export function createEmptyPinConfig(): PinConfig {
  return { keys: [] };
}

export function normalizePinConfig(raw: unknown): PinConfigParseResult {
  if (!isRecord(raw)) {
    return { success: false, error: "Panel configuration must be an object." };
  }

  if (typeof raw.frame !== "string" || raw.frame.trim().length === 0) {
    return {
      success: false,
      error: "Panel configuration frame must be a non-empty string.",
    };
  }

  if (raw.units !== "meters") {
    return {
      success: false,
      error: 'Panel configuration units must be "meters".',
    };
  }

  if (!isPinApproachAxis(raw.approach_axis)) {
    return {
      success: false,
      error: `Panel configuration approach_axis must be one of: ${PIN_APPROACH_AXES.join(", ")}.`,
    };
  }

  if (!isRecord(raw.keys) || Object.keys(raw.keys).length === 0) {
    return {
      success: false,
      error: "Panel configuration keys must be a non-empty object.",
    };
  }

  const keyEntries: Array<[string, PinKeyTarget]> = [];

  for (const [label, rawTarget] of Object.entries(raw.keys)) {
    if (label.trim().length === 0) {
      return { success: false, error: "Panel key labels must be non-empty." };
    }

    const target = parseKeyTarget(label, rawTarget);

    if (typeof target === "string") {
      return { success: false, error: target };
    }

    keyEntries.push([label, target]);
  }

  const config: NormalizedPinConfig = {
    frame: raw.frame.trim(),
    units: "meters",
    approachAxis: raw.approach_axis,
    keys: Object.fromEntries(keyEntries),
  };

  return { success: true, config };
}

export async function loadPinConfig(
  url = DEFAULT_PIN_CONFIG_URL,
): Promise<PinConfigParseResult> {
  try {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to load panel configuration from "${url}" (${response.status}).`,
      };
    }

    let raw: unknown;

    try {
      raw = await response.json();
    } catch {
      return {
        success: false,
        error: `Panel configuration at "${url}" is not valid JSON.`,
      };
    }

    return normalizePinConfig(raw);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to load panel configuration from "${url}": ${error.message}`
          : `Failed to load panel configuration from "${url}".`,
    };
  }
}
