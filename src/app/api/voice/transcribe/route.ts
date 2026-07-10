// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import { NextResponse } from "next/server";

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const TRANSCRIPTION_MODEL = "whisper-large-v3-turbo";
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return errorResponse(
      "Server transcription is not configured (GROQ_API_KEY is missing).",
      503,
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Request must be multipart form data with an audio file.", 400);
  }

  const audio = formData.get("audio");

  if (!(audio instanceof Blob) || audio.size === 0) {
    return errorResponse("An 'audio' file field with recorded speech is required.", 400);
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return errorResponse("Audio clip is too large. Keep commands under a few seconds.", 413);
  }

  const upstreamForm = new FormData();
  upstreamForm.append("file", audio, "command.webm");
  upstreamForm.append("model", TRANSCRIPTION_MODEL);
  upstreamForm.append("language", "en");
  upstreamForm.append("response_format", "json");

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstreamForm,
    });
  } catch {
    return errorResponse("Could not reach the transcription service.", 502);
  }

  let payload: unknown;

  try {
    payload = await upstreamResponse.json();
  } catch {
    return errorResponse("Transcription service returned an unreadable response.", 502);
  }

  if (!upstreamResponse.ok) {
    const detail =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `Transcription service responded with status ${upstreamResponse.status}.`;
    return errorResponse(detail, 502);
  }

  const transcript =
    payload && typeof payload === "object" && "text" in payload && typeof payload.text === "string"
      ? payload.text.trim()
      : "";

  return NextResponse.json({ transcript });
}
