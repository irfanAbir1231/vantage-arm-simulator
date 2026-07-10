import type { PinApproachAxis } from "@/lib/pin";
import type { JointName, Vector3Value } from "@/lib/robot";

export type AgentAction =
  | {
      type: "MOVE_RELATIVE";
      axis: "x" | "y" | "z";
      distanceMeters: number;
    }
  | {
      type: "MOVE_TO";
      target: Vector3Value;
    }
  | {
      type: "MOVE_JOINT";
      jointName: JointName;
      angleRadians: number;
    }
  | {
      type: "PRESS_KEY";
      key: string;
      repeat: number;
    }
  | {
      type: "HOME";
    }
  | {
      type: "STOP";
    };

export type AgentPlanDecision = {
  kind: "plan";
  understood: string;
  confirmation: string;
  actions: AgentAction[];
  spokenResponse: string;
};

export type AgentClarificationDecision = {
  kind: "clarification";
  understood: string | null;
  question: string;
  actions: [];
  spokenResponse: string;
};

export type AgentRejectionDecision = {
  kind: "rejection";
  reason: string;
  actions: [];
  spokenResponse: string;
};

export type AgentPanelContext = {
  frame: string;
  units: "meters";
  approachAxis: PinApproachAxis;
};

export type AgentRobotContext = {
  baseJointName: JointName;
  jointAngleUnits: "radians";
};

export type AgentDecision =
  | AgentPlanDecision
  | AgentClarificationDecision
  | AgentRejectionDecision;

export type AgentValidationContext = {
  availableKeys: readonly string[];
  allowedJointNames: readonly JointName[];
  panel: AgentPanelContext;
  robot: AgentRobotContext;
};

export type AgentInterpretationContext = {
  currentPosition: Vector3Value;
  pendingClarification?: {
    originalInstruction: string;
    question: string;
  };
};

export type AgentInterpretationInput = {
  instruction: string;
  context: AgentInterpretationContext;
};

export type AgentProviderErrorCode =
  | "AGENT_NOT_CONFIGURED"
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "INVALID_MODEL_OUTPUT"
  | "INTERNAL_ERROR";

export class AgentProviderError extends Error {
  constructor(
    readonly code: AgentProviderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AgentProviderError";
  }
}

export type CompiledAgentStep = {
  command: import("@/lib/robot").MotionCommand;
  description: string;
  keyLabel?: string;
};

export type AgentPlanProgress = {
  currentStep: number;
  totalSteps: number;
  step: CompiledAgentStep | null;
};

export type AgentPlanExecutionResult =
  | {
      success: true;
      completedSteps: number;
      totalSteps: number;
      message: string;
    }
  | {
      success: false;
      cancelled: boolean;
      completedSteps: number;
      totalSteps: number;
      message: string;
    };
