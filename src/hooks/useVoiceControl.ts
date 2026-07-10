// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { parseVoiceCommand } from "@/lib/voice";
import {
  isAudioRecordingAvailable,
  startAudioRecording,
  transcribeAudio,
  type AudioRecordingSession,
} from "@/lib/voice/audio-recorder";
import {
  createSpeechRecognitionSession,
  isSpeechRecognitionAvailable,
  type SpeechRecognitionSession,
} from "@/lib/voice/speech-recognition";
import { cancelMotion, executeMotionCommand } from "@/lib/robot";

type VoiceCommandFeedback = {
  understood: string;
  result: string;
  isError: boolean;
};

type SpeechFeedback = {
  message: string;
  isError: boolean;
};

let voiceCommandSequence = 0;

function createVoiceCommandId(): string {
  voiceCommandSequence += 1;
  return `voice-${Date.now()}-${voiceCommandSequence}`;
}

function subscribeToSpeechRecognitionAvailability(): () => void {
  return () => undefined;
}

function getServerSpeechRecognitionAvailability(): boolean {
  return false;
}

function isVoiceCaptureAvailable(): boolean {
  return isSpeechRecognitionAvailable() || isAudioRecordingAvailable();
}

// Records for at most this long before auto-transcribing, so a forgotten
// Stop click cannot leave the microphone open indefinitely.
const FALLBACK_MAX_RECORDING_MS = 6000;

export function useVoiceControl() {
  const isExecutingRef = useRef(false);
  const executionVersionRef = useRef(0);
  const recognitionSessionRef = useRef<SpeechRecognitionSession | null>(null);
  const listeningRef = useRef(false);
  const fallbackModeRef = useRef(false);
  const recorderRef = useRef<AudioRecordingSession | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [listening, setListening] = useState(false);
  const speechRecognitionAvailable = useSyncExternalStore(
    subscribeToSpeechRecognitionAvailability,
    isVoiceCaptureAvailable,
    getServerSpeechRecognitionAvailability,
  );
  const [feedback, setFeedback] = useState<VoiceCommandFeedback>({
    understood: "No command parsed yet.",
    result: "No command executed yet.",
    isError: false,
  });
  const [speechFeedback, setSpeechFeedback] = useState<SpeechFeedback>({
    message: "Microphone not started.",
    isError: false,
  });

  async function executeCommandText(commandText: string): Promise<void> {
    const parseResult = parseVoiceCommand(commandText, createVoiceCommandId());

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

  function handleTranscript(recognizedTranscript: string): void {
    listeningRef.current = false;
    setListening(false);
    setTranscript(recognizedTranscript);
    setInput(recognizedTranscript);
    setSpeechFeedback({
      message: "Transcript captured. Executing deterministic command.",
      isError: false,
    });
    void executeCommandText(recognizedTranscript);
  }

  function handleTranscriptError(message: string): void {
    listeningRef.current = false;
    setListening(false);

    // The browser's built-in recognition streams audio to a vendor speech
    // service; when that service is unreachable (Brave shields, VPN,
    // firewall) it reports "network" even though the site itself is online.
    // Switch to recording locally and transcribing through our own API.
    if (!fallbackModeRef.current && message.includes("internet connection")) {
      if (isAudioRecordingAvailable()) {
        fallbackModeRef.current = true;
        void startFallbackListening(
          "Browser speech service unreachable. Switched to server transcription - recording now, press Stop when done.",
        );
        return;
      }

      setSpeechFeedback({
        message:
          "Browser speech service is unreachable and microphone recording is unsupported here. Use typed commands.",
        isError: true,
      });
      return;
    }

    setSpeechFeedback({ message, isError: true });
  }

  async function startFallbackListening(startMessage?: string): Promise<void> {
    if (listeningRef.current || recorderRef.current) {
      return;
    }

    try {
      const recorder = await startAudioRecording();
      recorderRef.current = recorder;
      listeningRef.current = true;
      setListening(true);
      setSpeechFeedback({
        message:
          startMessage ??
          "Recording (server transcription)... speak your command, then press Stop.",
        isError: false,
      });
      recordingTimeoutRef.current = setTimeout(() => {
        void finishFallbackListening();
      }, FALLBACK_MAX_RECORDING_MS);
    } catch (error) {
      setSpeechFeedback({
        message:
          error instanceof Error && error.name === "NotAllowedError"
            ? "Microphone access is blocked. Allow the microphone permission for this site."
            : "Could not start microphone recording. Use typed commands instead.",
        isError: true,
      });
    }
  }

  async function finishFallbackListening(): Promise<void> {
    const recorder = recorderRef.current;

    if (!recorder) {
      return;
    }

    recorderRef.current = null;

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    listeningRef.current = false;
    setListening(false);
    setSpeechFeedback({ message: "Transcribing your command...", isError: false });

    try {
      const audio = await recorder.stop();
      const recognizedTranscript = await transcribeAudio(audio);

      if (recognizedTranscript.length === 0) {
        setSpeechFeedback({
          message: "No speech was detected in the recording. Try again.",
          isError: true,
        });
        return;
      }

      handleTranscript(recognizedTranscript);
    } catch (error) {
      setSpeechFeedback({
        message:
          error instanceof Error ? error.message : "Transcription failed. Use typed commands.",
        isError: true,
      });
    }
  }

  function executeTypedCommand(): Promise<void> {
    return executeCommandText(input);
  }

  function startListening(): void {
    if (listeningRef.current) {
      return;
    }

    if (isExecutingRef.current) {
      setSpeechFeedback({
        message: "Wait for the current command to finish before listening.",
        isError: true,
      });
      return;
    }

    if (fallbackModeRef.current || !isSpeechRecognitionAvailable()) {
      if (isAudioRecordingAvailable()) {
        void startFallbackListening();
        return;
      }

      setSpeechFeedback({
        message: "Voice capture is unavailable in this browser. Use typed commands.",
        isError: true,
      });
      return;
    }

    let session = recognitionSessionRef.current;

    if (!session) {
      session = createSpeechRecognitionSession({
        onTranscript: handleTranscript,
        onTranscriptError: handleTranscriptError,
      });
      recognitionSessionRef.current = session;
    }

    if (!session) {
      setSpeechFeedback({
        message: "Speech recognition is unavailable. Typed commands remain ready.",
        isError: true,
      });
      return;
    }

    try {
      session.start();
      listeningRef.current = true;
      setListening(true);
      setSpeechFeedback({ message: "Listening for one command...", isError: false });
    } catch (error) {
      listeningRef.current = false;
      setListening(false);
      setSpeechFeedback({
        message:
          error instanceof Error
            ? `Could not start speech recognition: ${error.message}`
            : "Could not start speech recognition. Use typed input instead.",
        isError: true,
      });
    }
  }

  function stopListening(): void {
    if (recorderRef.current) {
      void finishFallbackListening();
      return;
    }

    const session = recognitionSessionRef.current;

    if (!session || !listeningRef.current) {
      return;
    }

    try {
      session.stop();
      setSpeechFeedback({
        message: "Listening stopped. No command was executed.",
        isError: false,
      });
    } catch (error) {
      setSpeechFeedback({
        message:
          error instanceof Error
            ? `Could not stop speech recognition: ${error.message}`
            : "Could not stop speech recognition cleanly.",
        isError: true,
      });
    } finally {
      listeningRef.current = false;
      setListening(false);
    }
  }

  useEffect(() => {
    return () => {
      recognitionSessionRef.current?.dispose();
      recognitionSessionRef.current = null;
      recorderRef.current?.cancel();
      recorderRef.current = null;

      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      listeningRef.current = false;
    };
  }, []);

  return {
    input,
    setInput,
    executeTypedCommand,
    isExecuting,
    understood: feedback.understood,
    result: feedback.result,
    isError: feedback.isError,
    listening,
    transcript,
    speechRecognitionAvailable,
    speechMessage:
      !speechRecognitionAvailable && speechFeedback.message === "Microphone not started."
        ? "Speech recognition is unavailable. Typed commands remain ready."
        : speechFeedback.message,
    speechError: speechFeedback.isError,
    startListening,
    stopListening,
  };
}
