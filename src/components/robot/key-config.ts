// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import type { Vector3Value } from "@/lib/robot";

export type PanelApproachAxis = "-x" | "x" | "-y" | "y" | "-z" | "z";

export type PanelKey = {
  label: string;
  position: Vector3Value;
};

export type NormalizedKeyConfig = {
  frame: string;
  units: string;
  approachAxis: PanelApproachAxis;
  keys: PanelKey[];
};

type RawVector = Partial<Record<keyof Vector3Value, unknown>>;

type RawKeyConfig = {
  frame?: unknown;
  units?: unknown;
  approach_axis?: unknown;
  keys?: unknown;
};

const DEFAULT_KEY_CONFIG: NormalizedKeyConfig = {
  frame: "base_link",
  units: "meters",
  approachAxis: "-z",
  keys: [],
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeVector(value: RawVector): Vector3Value | null {
  if (
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.z)
  ) {
    return { x: value.x, y: value.y, z: value.z };
  }

  return null;
}

function normalizeApproachAxis(value: unknown): PanelApproachAxis {
  const validAxes = new Set(["-x", "x", "-y", "y", "-z", "z"]);

  if (typeof value === "string" && validAxes.has(value)) {
    return value as PanelApproachAxis;
  }

  return DEFAULT_KEY_CONFIG.approachAxis;
}

export function normalizeKeyConfig(raw: RawKeyConfig): NormalizedKeyConfig {
  const config: NormalizedKeyConfig = {
    frame: typeof raw.frame === "string" ? raw.frame : DEFAULT_KEY_CONFIG.frame,
    units: typeof raw.units === "string" ? raw.units : DEFAULT_KEY_CONFIG.units,
    approachAxis: normalizeApproachAxis(raw.approach_axis),
    keys: [],
  };

  if (Array.isArray(raw.keys)) {
    config.keys = raw.keys
      .map((entry, index): PanelKey | null => {
        if (typeof entry !== "object" || entry === null) {
          return null;
        }

        const candidate = entry as RawVector & { label?: unknown };
        const position = normalizeVector(candidate);

        if (!position) {
          return null;
        }

        return {
          label: typeof candidate.label === "string" ? candidate.label : `${index + 1}`,
          position,
        };
      })
      .filter((key): key is PanelKey => key !== null);

    return config;
  }

  if (typeof raw.keys === "object" && raw.keys !== null) {
    config.keys = Object.entries(raw.keys as Record<string, RawVector>)
      .map(([label, value]): PanelKey | null => {
        const position = normalizeVector(value);

        if (!position) {
          return null;
        }

        return { label, position };
      })
      .filter((key): key is PanelKey => key !== null)
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }

  return config;
}

export async function fetchKeyConfig(): Promise<NormalizedKeyConfig> {
  const response = await fetch("/robot/key.config.json");

  if (!response.ok) {
    throw new Error(`Failed to load key config: ${response.status}`);
  }

  return normalizeKeyConfig((await response.json()) as RawKeyConfig);
}
