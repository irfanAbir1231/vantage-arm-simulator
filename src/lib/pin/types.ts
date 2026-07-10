// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import type { Vector3Value } from "@/lib/robot";

export type PinKeyTarget = {
  label: string;
  position: Vector3Value;
};

export type PinConfig = {
  keys: PinKeyTarget[];
};
