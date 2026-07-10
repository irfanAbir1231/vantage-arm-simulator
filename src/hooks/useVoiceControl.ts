// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { executeMotionCommand } from "@/lib/robot";
import { isSpeechRecognitionAvailable, parseVoiceCommand } from "@/lib/voice";

function subscribeToNothing() {
  return () => {};
}

type SpeechRecognitionResult = {
  0?: { transcript: string };
};

type SpeechRecognitionEvent = {
  results: { length: number; [index: number]: SpeechRecognitionResult };
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  abort: () => void;
  start: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
}

export function useVoiceControl() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("Voice control is ready for typed commands.");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechAvailable = useSyncExternalStore(
    subscribeToNothing,
    isSpeechRecognitionAvailable,
    () => false,
  );

  const submitCommand = useCallback(async (input: string) => {
    const parsed = parseVoiceCommand(input, `voice-${Date.now()}`);
    setTranscript(parsed.normalizedInput);

    if (!parsed.success) {
      setMessage(parsed.error);
      return;
    }

    setMessage(parsed.description);
    const result = await executeMotionCommand(parsed.command);
    setMessage(result.message);
  }, []);

  const startListening = useCallback(() => {
    if (!isSpeechRecognitionAvailable()) {
      setMessage("Speech recognition is unavailable. Use the typed command field.");
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setMessage("Speech recognition is unavailable. Use the typed command field.");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setListening(false);
      setMessage(`Speech recognition error: ${event.error}.`);
    };
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const heard = result?.[0]?.transcript.trim() ?? "";
      if (heard) {
        void submitCommand(heard);
      }
    };
    recognitionRef.current = recognition;
    setListening(true);
    setMessage("Listening...");
    recognition.start();
  }, [submitCommand]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return {
    listening,
    message,
    speechAvailable,
    startListening,
    submitCommand,
    transcript,
  };
}
