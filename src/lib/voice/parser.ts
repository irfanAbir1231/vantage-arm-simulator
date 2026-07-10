// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import type { MotionCommand } from "@/lib/robot";

export type VoiceParseResult =
  | { success: true; command: MotionCommand }
  | { success: false; message: string };

export function parseVoiceCommand(_transcript: string): VoiceParseResult {
  void _transcript;

  return {
    success: false,
    message: "Voice parser placeholder is not implemented.",
  };
}
