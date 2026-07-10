import { NextResponse } from "next/server";

import { loadTrustedPanelConfig } from "@/lib/agent/trusted-panel";
import { interpretAgentInstruction } from "@/lib/agent/groq-client";
import { parseAgentInterpretationContext } from "@/lib/agent/schema";
import { AgentProviderError } from "@/lib/agent/types";
import { JOINT_NAMES } from "@/lib/robot/types";

const MAX_INSTRUCTION_LENGTH = 500;

function errorResponse(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_REQUEST", "Request body must be valid JSON.", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("INVALID_REQUEST", "Request body must be an object.", 400);
  }

  const requestBody = body as { instruction?: unknown; context?: unknown };
  if (typeof requestBody.instruction !== "string") {
    return errorResponse("INVALID_REQUEST", "Instruction must be a string.", 400);
  }

  const instruction = requestBody.instruction.trim();
  if (instruction.length === 0 || instruction.length > MAX_INSTRUCTION_LENGTH) {
    return errorResponse(
      "INVALID_REQUEST",
      `Instruction must contain 1 to ${MAX_INSTRUCTION_LENGTH} characters.`,
      400,
    );
  }

  const parsedContext = parseAgentInterpretationContext(requestBody.context);
  if (!parsedContext.success) {
    return errorResponse("INVALID_REQUEST", parsedContext.error, 400);
  }

  try {
    const panelConfig = await loadTrustedPanelConfig();
    const decision = await interpretAgentInstruction(
      { instruction, context: parsedContext.context },
      {
        availableKeys: Object.keys(panelConfig.keys),
        allowedJointNames: JOINT_NAMES,
        panel: {
          frame: panelConfig.frame,
          units: panelConfig.units,
          approachAxis: panelConfig.approachAxis,
        },
        robot: {
          baseJointName: "joint_1",
          jointAngleUnits: "radians",
        },
      },
    );

    return NextResponse.json({ decision });
  } catch (error) {
    if (error instanceof AgentProviderError) {
      const status = error.code === "AGENT_NOT_CONFIGURED" ? 503 : 502;
      return errorResponse(error.code, error.message, status);
    }

    return errorResponse(
      "INTERNAL_ERROR",
      "Agentic interpretation could not be completed safely.",
      500,
    );
  }
}
