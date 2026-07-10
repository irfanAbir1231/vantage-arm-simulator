import "server-only";

import { createAgentSystemPrompt, createAgentUserPrompt } from "./prompt";
import { parseAgentDecision } from "./schema";
import type {
  AgentDecision,
  AgentInterpretationInput,
  AgentProviderErrorCode,
  AgentValidationContext,
} from "./types";
import { AgentProviderError } from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const PROVIDER_TIMEOUT_MS = 12_000;

type GroqMessage = {
  content?: unknown;
};

type GroqResponse = {
  choices?: Array<{
    message?: GroqMessage;
  }>;
};

function safeProviderError(code: AgentProviderErrorCode): AgentProviderError {
  const messages: Record<AgentProviderErrorCode, string> = {
    AGENT_NOT_CONFIGURED: "Agentic interpretation is not configured on this server.",
    PROVIDER_UNAVAILABLE: "Agentic interpretation is temporarily unavailable.",
    RATE_LIMITED: "Agentic interpretation is temporarily rate limited.",
    TIMEOUT: "Agentic interpretation timed out. Please try again.",
    INVALID_MODEL_OUTPUT: "Agentic interpretation returned an invalid plan.",
    INTERNAL_ERROR: "Agentic interpretation could not be completed.",
  };

  return new AgentProviderError(code, messages[code]);
}

function getProviderErrorCode(status: number): AgentProviderErrorCode {
  if (status === 429) {
    return "RATE_LIMITED";
  }

  return status >= 500 ? "PROVIDER_UNAVAILABLE" : "INTERNAL_ERROR";
}

function extractMessageContent(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const response = value as GroqResponse;
  const content = response.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : null;
}

export async function interpretAgentInstruction(
  input: AgentInterpretationInput,
  validationContext: AgentValidationContext,
): Promise<AgentDecision> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;

  if (!apiKey || !model) {
    throw safeProviderError("AGENT_NOT_CONFIGURED");
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: createAgentSystemPrompt(validationContext) },
          { role: "user", content: createAgentUserPrompt(input) },
        ],
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw safeProviderError(getProviderErrorCode(response.status));
    }

    let providerResponse: unknown;
    try {
      providerResponse = await response.json();
    } catch {
      throw safeProviderError("INVALID_MODEL_OUTPUT");
    }

    const content = extractMessageContent(providerResponse);
    if (!content) {
      throw safeProviderError("INVALID_MODEL_OUTPUT");
    }

    let rawDecision: unknown;
    try {
      rawDecision = JSON.parse(content);
    } catch {
      throw safeProviderError("INVALID_MODEL_OUTPUT");
    }

    const parsedDecision = parseAgentDecision(rawDecision, validationContext);
    if (!parsedDecision.success) {
      throw safeProviderError("INVALID_MODEL_OUTPUT");
    }

    return parsedDecision.decision;
  } catch (error) {
    if (error instanceof AgentProviderError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw safeProviderError("TIMEOUT");
    }

    throw safeProviderError("PROVIDER_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
}
