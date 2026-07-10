"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  compileAgentPlan,
  executeAgentPlan,
  parseAgentDecision,
  type AgentDecision,
} from "@/lib/agent";
import { loadPinConfig, type NormalizedPinConfig } from "@/lib/pin";
import {
  cancelMotion,
  executeMotionCommand,
  type Vector3Value,
} from "@/lib/robot";
import { JOINT_NAMES } from "@/lib/robot/types";
import { parseVoiceCommand } from "@/lib/voice";
import {
  createSpeechRecognitionSession,
  isSpeechRecognitionAvailable,
  type SpeechRecognitionSession,
} from "@/lib/voice/speech-recognition";
import { speakSpeechFeedback } from "@/lib/voice/speech-synthesis";
import { useRobotStore } from "@/store/robot-store";

export type AgentUiStatus =
  | "idle"
  | "listening"
  | "interpreting"
  | "awaiting-clarification"
  | "awaiting-confirmation"
  | "executing"
  | "completed"
  | "failed";

type PendingClarification = {
  originalInstruction: string;
  question: string;
};

type AgentRouteResponse = {
  decision?: unknown;
  error?: {
    message?: unknown;
  };
};

let agentCommandSequence = 0;

function createAgentCommandId(): string {
  agentCommandSequence += 1;
  return `agent-fallback-${Date.now()}-${agentCommandSequence}`;
}

function subscribeToSpeechRecognitionAvailability(): () => void {
  return () => undefined;
}

function getServerSpeechRecognitionAvailability(): boolean {
  return false;
}

function parseRouteResponse(value: unknown): AgentRouteResponse {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AgentRouteResponse)
    : {};
}

function getSafeProviderMessage(response: AgentRouteResponse): string {
  return typeof response.error?.message === "string"
    ? response.error.message
    : "Agentic interpretation is unavailable.";
}

function looksLikeNewInstruction(instruction: string): boolean {
  return /^(move|go|press|tap|home|stop|return|rotate|turn|nudge|raise|lower|lift|drop)\b/i.test(
    instruction.trim(),
  );
}

export function useAgenticControl() {
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<AgentUiStatus>("idle");
  const [message, setMessage] = useState("Ready for an agentic instruction.");
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [pendingConfig, setPendingConfig] = useState<NormalizedPinConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [spokenFeedback, setSpokenFeedback] = useState(false);
  const recognitionSessionRef = useRef<SpeechRecognitionSession | null>(null);
  const cancellationRequestedRef = useRef(false);
  const requestVersionRef = useRef(0);
  const pendingClarificationRef = useRef<PendingClarification | null>(null);
  const speechRecognitionAvailable = useSyncExternalStore(
    subscribeToSpeechRecognitionAvailability,
    isSpeechRecognitionAvailable,
    getServerSpeechRecognitionAvailability,
  );
  const robotLoaded = useRobotStore((state) => state.robotLoaded);
  const motionStatus = useRobotStore((state) => state.status);

  function isCurrentRequest(version: number): boolean {
    return requestVersionRef.current === version;
  }

  function announce(text: string): void {
    if (spokenFeedback) {
      speakSpeechFeedback(text);
    }
  }

  function resetPendingPlan(): void {
    setDecision(null);
    setPendingConfig(null);
    setCurrentStep(0);
    setTotalSteps(0);
  }

  async function executeDeterministicFallback(
    commandText: string,
    providerMessage: string,
    requestVersion: number,
  ): Promise<void> {
    pendingClarificationRef.current = null;
    const parsed = parseVoiceCommand(commandText, createAgentCommandId());
    if (!parsed.success) {
      if (isCurrentRequest(requestVersion)) {
        setStatus("failed");
        setMessage(`${providerMessage} Local parser could not understand this instruction.`);
      }
      return;
    }

    if (!robotLoaded) {
      if (isCurrentRequest(requestVersion)) {
        setStatus("failed");
        setMessage(`${providerMessage} The robot is not ready to execute a command.`);
      }
      return;
    }

    setStatus("executing");
    setMessage("Agentic interpretation is unavailable. Using the deterministic parser.");
    const result = await executeMotionCommand(parsed.command);
    if (!isCurrentRequest(requestVersion)) {
      return;
    }
    setStatus(result.success ? "completed" : "failed");
    setMessage(
      result.success
        ? `Agentic interpretation is unavailable. Deterministic fallback succeeded: ${result.message}`
        : `Agentic interpretation is unavailable. Deterministic fallback failed: ${result.message}`,
    );
  }

  async function interpretInstruction(commandText = input): Promise<void> {
    const instruction = commandText.trim();
    if (instruction.length === 0) {
      setStatus("failed");
      setMessage("Enter or speak an instruction first.");
      return;
    }

    if (instruction.length > 500) {
      setStatus("failed");
      setMessage("Instructions are limited to 500 characters.");
      return;
    }

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    const pendingClarification = pendingClarificationRef.current;
    const clarificationContext =
      pendingClarification && !looksLikeNewInstruction(instruction)
        ? pendingClarification
        : undefined;

    if (!clarificationContext) {
      pendingClarificationRef.current = null;
    }

    cancellationRequestedRef.current = false;
    resetPendingPlan();
    setTranscript(instruction);
    setStatus("interpreting");
    setMessage("Interpreting instruction...");

    const currentPosition: Vector3Value = useRobotStore.getState().endEffectorPosition;
    const response = await fetch("/api/agent/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instruction,
        context: {
          currentPosition,
          ...(clarificationContext
            ? { pendingClarification: clarificationContext }
            : {}),
        },
      }),
    }).catch(() => null);

    if (!isCurrentRequest(requestVersion)) {
      return;
    }

    if (!response) {
      await executeDeterministicFallback(
        instruction,
        "Agentic interpretation is unavailable.",
        requestVersion,
      );
      return;
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      await executeDeterministicFallback(
        instruction,
        "Agentic interpretation is unavailable.",
        requestVersion,
      );
      return;
    }

    if (!isCurrentRequest(requestVersion)) {
      return;
    }

    const routeResponse = parseRouteResponse(responseBody);
    if (!response.ok) {
      await executeDeterministicFallback(
        instruction,
        getSafeProviderMessage(routeResponse),
        requestVersion,
      );
      return;
    }

    const configResult = await loadPinConfig();
    if (!isCurrentRequest(requestVersion)) {
      return;
    }
    if (!configResult.success) {
      pendingClarificationRef.current = null;
      setStatus("failed");
      setMessage(`Agentic plan could not be validated: ${configResult.error}`);
      return;
    }

    const parsedDecision = parseAgentDecision(routeResponse.decision, {
      availableKeys: Object.keys(configResult.config.keys),
      allowedJointNames: JOINT_NAMES,
    });
    if (!parsedDecision.success) {
      pendingClarificationRef.current = null;
      setStatus("failed");
      setMessage("Agentic interpretation returned an invalid plan.");
      return;
    }

    setDecision(parsedDecision.decision);
    if (parsedDecision.decision.kind === "clarification") {
      pendingClarificationRef.current = { originalInstruction: instruction, question: parsedDecision.decision.question };
      setStatus("awaiting-clarification");
      setMessage(parsedDecision.decision.question);
      announce(parsedDecision.decision.spokenResponse);
      return;
    }

    if (parsedDecision.decision.kind === "rejection") {
      pendingClarificationRef.current = null;
      setStatus("failed");
      setMessage(parsedDecision.decision.reason);
      announce(parsedDecision.decision.spokenResponse);
      return;
    }

    const compileCheck = compileAgentPlan(parsedDecision.decision, configResult.config);
    if (!compileCheck.success) {
      pendingClarificationRef.current = null;
      setStatus("failed");
      setMessage(`Agentic plan could not be validated: ${compileCheck.error}`);
      return;
    }

    pendingClarificationRef.current = null;
    setPendingConfig(configResult.config);
    setStatus("awaiting-confirmation");
    setMessage(parsedDecision.decision.confirmation);
    announce(parsedDecision.decision.spokenResponse);
  }

  async function executeConfirmedPlan(): Promise<void> {
    if (!decision || decision.kind !== "plan" || !pendingConfig) {
      return;
    }

    if (!robotLoaded) {
      setStatus("failed");
      setMessage("Robot visualization is not ready yet. Wait for the URDF to load.");
      return;
    }

    if (motionStatus === "moving") {
      setMessage("Wait for the current motion to finish before executing this plan.");
      return;
    }

    if (motionStatus === "cancelled") {
      setStatus("failed");
      setMessage("Emergency stop is active. Clear the cancelled motion before executing a plan.");
      return;
    }

    const compiledPlan = compileAgentPlan(decision, pendingConfig);
    if (!compiledPlan.success) {
      setStatus("failed");
      setMessage(compiledPlan.error);
      return;
    }

    const executionVersion = requestVersionRef.current + 1;
    requestVersionRef.current = executionVersion;
    cancellationRequestedRef.current = false;
    setStatus("executing");
    setCurrentStep(0);
    setTotalSteps(compiledPlan.steps.length);
    setMessage("Executing confirmed plan...");

    const result = await executeAgentPlan(compiledPlan.steps, {
      executeMotion: executeMotionCommand,
      resetCancellation: () => useRobotStore.getState().resetCancellation(),
      isCancellationRequested: () =>
        cancellationRequestedRef.current || useRobotStore.getState().isCancelled,
      onProgress: ({ currentStep: nextStep, totalSteps: nextTotal, step }) => {
        setCurrentStep(nextStep);
        setTotalSteps(nextTotal);
        useRobotStore.getState().setActiveKey(step?.keyLabel ?? null);
      },
    });

    if (!isCurrentRequest(executionVersion)) {
      return;
    }

    useRobotStore.getState().setActiveKey(null);
    setStatus(result.success ? "completed" : "failed");
    setMessage(result.message);
    announce(result.message);
  }

  function cancel(): void {
    requestVersionRef.current += 1;
    pendingClarificationRef.current = null;
    resetPendingPlan();
    cancellationRequestedRef.current = true;

    if (status === "executing") {
      cancelMotion();
      setMessage("Cancellation requested for the active plan.");
      return;
    }

    setStatus("idle");
    setMessage("Agentic request cancelled.");
    useRobotStore.getState().setActiveKey(null);
    announce("Agentic request cancelled.");
  }

  function startListening(): void {
    if (status === "interpreting" || status === "executing") {
      return;
    }

    let session = recognitionSessionRef.current;
    if (!session) {
      session = createSpeechRecognitionSession({
        onTranscript: (recognizedTranscript) => {
          setInput(recognizedTranscript);
          void interpretInstruction(recognizedTranscript);
        },
        onTranscriptError: (errorMessage) => {
          setStatus("failed");
          setMessage(errorMessage);
        },
      });
      recognitionSessionRef.current = session;
    }

    if (!session) {
      setStatus("failed");
      setMessage("Speech recognition is unavailable. Typed agentic commands remain ready.");
      return;
    }

    try {
      session.start();
      setStatus("listening");
      setMessage("Listening for one agentic instruction...");
    } catch {
      setStatus("failed");
      setMessage("Could not start speech recognition. Use typed input instead.");
    }
  }

  function stopListening(): void {
    recognitionSessionRef.current?.stop();
    if (status === "listening") {
      setStatus("idle");
      setMessage("Listening stopped. No instruction was sent.");
    }
  }

  useEffect(() => {
    return () => {
      requestVersionRef.current += 1;
      recognitionSessionRef.current?.dispose();
      recognitionSessionRef.current = null;
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    input,
    setInput,
    transcript,
    status,
    message,
    decision,
    currentStep,
    totalSteps,
    spokenFeedback,
    setSpokenFeedback,
    speechRecognitionAvailable,
    robotLoaded,
    motionStatus,
    interpretInstruction,
    executeConfirmedPlan,
    cancel,
    startListening,
    stopListening,
  };
}
