// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import type { MotionCommand } from "./types";

export function describeMotionCommand(command: MotionCommand): string {
  return `${command.source}:${command.type}`;
}
