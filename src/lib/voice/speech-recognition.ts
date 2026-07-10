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
  recognition.onresult = (event) => {
    const shouldHandleResult = acceptResults;
    acceptResults = false;
    const transcript = extractTranscript(event);

    try {
      recognition.stop();
    } catch {
      // A final result can arrive after the browser has already stopped recognition.
    }

    active = false;

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
        recognition.stop();
      } finally {
        active = false;
      }
    },
    dispose() {
      acceptResults = false;
      recognition.onresult = null;

      if (active) {
        try {
          recognition.stop();
        } catch {
          // Cleanup must remain safe when the browser has already ended the session.
        }
      }

      active = false;
    },
  };
}
