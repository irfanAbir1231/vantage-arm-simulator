// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useRef, useState } from "react";

import { parseVoiceCommand } from "@/lib/voice";
import { cancelMotion, executeMotionCommand } from "@/lib/robot";

type VoiceCommandFeedback = {
  understood: string;
  result: string;
  isError: boolean;
};

let typedCommandSequence = 0;

function createTypedCommandId(): string {
  typedCommandSequence += 1;
  return `typed-voice-${Date.now()}-${typedCommandSequence}`;
}

export function useVoiceControl() {
  const isExecutingRef = useRef(false);
  const executionVersionRef = useRef(0);
  const [input, setInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [feedback, setFeedback] = useState<VoiceCommandFeedback>({
    understood: "No command parsed yet.",
    result: "No command executed yet.",
    isError: false,
  });

  async function executeTypedCommand(): Promise<void> {
    const parseResult = parseVoiceCommand(input, createTypedCommandId());

    if (!parseResult.success) {
      setFeedback({
        understood: parseResult.error,
        result: "Command was not executed.",
        isError: true,
      });
      return;
    }

    if (parseResult.command.type === "STOP") {
      executionVersionRef.current += 1;
      cancelMotion();
      setFeedback({
        understood: parseResult.description,
        result: "Motion cancellation requested.",
        isError: false,
      });
      return;
    }

    if (isExecutingRef.current) {
      setFeedback({
        understood: parseResult.description,
        result: "Another command is already executing.",
        isError: true,
      });
      return;
    }

    const executionVersion = executionVersionRef.current + 1;
    executionVersionRef.current = executionVersion;
    isExecutingRef.current = true;
    setIsExecuting(true);
    setFeedback({
      understood: parseResult.description,
      result: "Executing command...",
      isError: false,
    });

    try {
      const result = await executeMotionCommand(parseResult.command);

      if (executionVersionRef.current === executionVersion) {
        setFeedback({
          understood: parseResult.description,
          result: result.message,
          isError: !result.success,
        });
      }
    } catch (error) {
      if (executionVersionRef.current === executionVersion) {
        setFeedback({
          understood: parseResult.description,
          result:
            error instanceof Error
              ? error.message
              : "Command execution failed unexpectedly.",
          isError: true,
        });
      }
    } finally {
      isExecutingRef.current = false;
      setIsExecuting(false);
    }
  }

  return {
    input,
    setInput,
    executeTypedCommand,
    isExecuting,
    understood: feedback.understood,
    result: feedback.result,
    isError: feedback.isError,
    listening: false,
    transcript: "",
  };
}
