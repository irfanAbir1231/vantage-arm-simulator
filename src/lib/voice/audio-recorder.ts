// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

export type AudioRecordingSession = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export function isAudioRecordingAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export async function startAudioRecording(): Promise<AudioRecordingSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };
  recorder.start();

  function releaseMicrophone(): void {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  return {
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          releaseMicrophone();
          resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
        };
        recorder.onerror = () => {
          releaseMicrophone();
          reject(new Error("Audio recording failed."));
        };

        try {
          recorder.stop();
        } catch (error) {
          releaseMicrophone();
          reject(error instanceof Error ? error : new Error("Audio recording failed."));
        }
      }),
    cancel: () => {
      recorder.onstop = null;
      recorder.onerror = null;

      try {
        recorder.stop();
      } catch {
        // The recorder may already be inactive; releasing the mic is what matters.
      }

      releaseMicrophone();
    },
  };
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audio, "command.webm");

  const response = await fetch("/api/voice/transcribe", {
    method: "POST",
    body: formData,
  });

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error("Transcription service returned an unreadable response.");
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Transcription failed.";
    throw new Error(message);
  }

  return payload && typeof payload === "object" && "transcript" in payload &&
    typeof payload.transcript === "string"
    ? payload.transcript.trim()
    : "";
}
