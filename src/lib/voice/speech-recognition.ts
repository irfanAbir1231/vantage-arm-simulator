// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

export type SpeechRecognitionHandlers = {
  onTranscript: (transcript: string) => void;
  onTranscriptError: (message: string) => void;
};

export type SpeechRecognitionSession = {
  start: () => void;
  stop: () => void;
  dispose: () => void;
};

type SpeechRecognitionConstructor = NonNullable<Window["SpeechRecognition"]>;
type SpeechRecognitionInstance = InstanceType<SpeechRecognitionConstructor>;
type RecognitionResultEvent = Parameters<
  NonNullable<SpeechRecognitionInstance["onresult"]>
>[0];

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null;
}

function getFirstAlternative(result: unknown): unknown {
  if (!isRecord(result)) {
    return undefined;
  }

  if (0 in result) {
    return result[0];
  }

  if (typeof result.item === "function") {
    try {
      return Reflect.apply(result.item, result, [0]);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function extractTranscript(event: RecognitionResultEvent): string {
  const transcriptParts: string[] = [];

  for (let index = 0; index < event.results.length; index += 1) {
    const result: unknown = event.results.item(index);

    if (isRecord(result) && result.isFinal === false) {
      continue;
    }

    const alternative = getFirstAlternative(result);

    if (isRecord(alternative) && typeof alternative.transcript === "string") {
      const transcript = alternative.transcript.trim();

      if (transcript.length > 0) {
        transcriptParts.push(transcript);
      }
    }
  }

  return transcriptParts.join(" ").trim();
}

export function isSpeechRecognitionAvailable(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

function describeRecognitionError(errorCode: string): string {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. Allow the microphone permission for this site and try again.";
    case "no-speech":
      return "No speech was detected. Try again and speak clearly after pressing Listen.";
    case "audio-capture":
      return "No microphone was found. Connect a microphone and try again.";
    case "network":
      return "Speech recognition needs an internet connection (the browser sends audio to its speech service). Check connectivity and try again.";
    case "aborted":
      return "Listening was stopped before a command was captured.";
    default:
      return `Speech recognition error: ${errorCode}. Try again or type a command.`;
  }
}

export function createSpeechRecognitionSession(
  handlers: SpeechRecognitionHandlers,
): SpeechRecognitionSession | null {
  const Recognition = getSpeechRecognitionConstructor();

  if (!Recognition) {
    return null;
  }

  const recognition = new Recognition();
  let active = false;
  let acceptResults = false;

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const shouldHandleResult = acceptResults;
    acceptResults = false;
    const transcript = extractTranscript(event);

    if (!shouldHandleResult) {
      return;
    }

    if (transcript.length === 0) {
      handlers.onTranscriptError(
        "Speech recognition returned no usable transcript. Try again or type a command.",
      );
      return;
    }

    handlers.onTranscript(transcript);
  };
  recognition.onerror = (event) => {
    const shouldReport = acceptResults;
    acceptResults = false;
    active = false;

    if (shouldReport) {
      handlers.onTranscriptError(describeRecognitionError(event.error));
    }
  };
  // onend fires after every session, whatever the outcome (result, error,
  // silence timeout). It is the only reliable place to mark the recognizer
  // reusable; without it, one silent/failed attempt left `active` stuck true
  // and every later start() became a no-op while the UI claimed to listen.
  recognition.onend = () => {
    active = false;

    if (acceptResults) {
      acceptResults = false;
      handlers.onTranscriptError(
        "Listening ended without capturing any speech. Try again and speak right after pressing Listen.",
      );
    }
  };

  return {
    start() {
      if (active) {
        return;
      }

      acceptResults = true;

      try {
        recognition.start();
        active = true;
      } catch (error) {
        acceptResults = false;
        throw error;
      }
    },
    stop() {
      if (!active) {
        return;
      }

      acceptResults = false;

      try {
        recognition.abort();
      } finally {
        active = false;
      }
    },
    dispose() {
      acceptResults = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      if (active) {
        try {
          recognition.abort();
        } catch {
          // Cleanup must remain safe when the browser has already ended the session.
        }
      }

      active = false;
    },
  };
}
