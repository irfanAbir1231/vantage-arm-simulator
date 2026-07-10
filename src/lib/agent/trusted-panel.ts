import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { normalizePinConfig, type NormalizedPinConfig } from "@/lib/pin";

export async function loadTrustedPanelConfig(): Promise<NormalizedPinConfig> {
  let rawFile: string;

  try {
    rawFile = await readFile(
      path.join(process.cwd(), "public", "robot", "key.config.json"),
      "utf8",
    );
  } catch {
    throw new Error("Trusted panel configuration is unavailable.");
  }

  let rawConfig: unknown;
  try {
    rawConfig = JSON.parse(rawFile);
  } catch {
    throw new Error("Trusted panel configuration is invalid.");
  }

  const configResult = normalizePinConfig(rawConfig);
  if (!configResult.success) {
    throw new Error("Trusted panel configuration is invalid.");
  }

  return configResult.config;
}
