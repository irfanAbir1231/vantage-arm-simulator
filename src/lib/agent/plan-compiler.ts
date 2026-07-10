import {
  createKeyPressPlan,
  describeKeyPress,
  type NormalizedPinConfig,
} from "@/lib/pin";
import type { MotionCommand } from "@/lib/robot";
import { isJointName } from "@/lib/robot/types";

import type {
  AgentAction,
  AgentPlanDecision,
  CompiledAgentStep,
} from "./types";

let agentCommandSequence = 0;

function createCommandId(actionIndex: number, stepIndex = 0): string {
  agentCommandSequence += 1;
  return `agent-${Date.now()}-${agentCommandSequence}-${actionIndex}-${stepIndex}`;
}

function createRelativeDelta(axis: "x" | "y" | "z", distanceMeters: number) {
  return {
    x: axis === "x" ? distanceMeters : 0,
    y: axis === "y" ? distanceMeters : 0,
    z: axis === "z" ? distanceMeters : 0,
  };
}

export function describeAgentAction(action: AgentAction): string {
  if (action.type === "MOVE_RELATIVE") {
    return `Move ${action.axis.toUpperCase()} by ${action.distanceMeters.toFixed(3)} m`;
  }

  if (action.type === "MOVE_TO") {
    const { x, y, z } = action.target;
    return `Move to X ${x.toFixed(3)}, Y ${y.toFixed(3)}, Z ${z.toFixed(3)} m`;
  }

  if (action.type === "MOVE_JOINT") {
    return `Move ${action.jointName} to ${action.angleRadians.toFixed(3)} rad`;
  }

  if (action.type === "PRESS_KEY") {
    return `${describeKeyPress(action.key)}${action.repeat > 1 ? ` x${action.repeat}` : ""}`;
  }

  return action.type === "HOME" ? "Return to home" : "Stop motion";
}

function compileMotionAction(action: Exclude<AgentAction, { type: "PRESS_KEY" }>, actionIndex: number): CompiledAgentStep | string {
  let command: MotionCommand;

  if (action.type === "MOVE_RELATIVE") {
    command = {
      id: createCommandId(actionIndex),
      type: "MOVE_RELATIVE",
      source: "voice",
      delta: createRelativeDelta(action.axis, action.distanceMeters),
    };
  } else if (action.type === "MOVE_TO") {
    command = {
      id: createCommandId(actionIndex),
      type: "MOVE_TO",
      source: "voice",
      target: { ...action.target },
    };
  } else if (action.type === "MOVE_JOINT") {
    if (!isJointName(action.jointName) || !Number.isFinite(action.angleRadians)) {
      return "The plan contains an invalid joint action.";
    }

    command = {
      id: createCommandId(actionIndex),
      type: "MOVE_JOINT",
      source: "voice",
      jointName: action.jointName,
      angle: action.angleRadians,
    };
  } else if (action.type === "HOME") {
    command = { id: createCommandId(actionIndex), type: "HOME", source: "voice" };
  } else {
    command = { id: createCommandId(actionIndex), type: "STOP", source: "voice" };
  }

  return { command, description: describeAgentAction(action) };
}

export type AgentPlanCompileResult =
  | { success: true; steps: CompiledAgentStep[] }
  | { success: false; error: string };

export function compileAgentPlan(
  decision: AgentPlanDecision,
  panelConfig: NormalizedPinConfig,
): AgentPlanCompileResult {
  const steps: CompiledAgentStep[] = [];

  for (const [actionIndex, action] of decision.actions.entries()) {
    if (action.type !== "PRESS_KEY") {
      const compiledAction = compileMotionAction(action, actionIndex);
      if (typeof compiledAction === "string") {
        return { success: false, error: compiledAction };
      }
      steps.push(compiledAction);
      continue;
    }

    const key = panelConfig.keys[action.key];
    if (!key) {
      return { success: false, error: `Panel key "${action.key}" is unavailable.` };
    }

    for (let pressIndex = 0; pressIndex < action.repeat; pressIndex += 1) {
      const keyPlan = createKeyPressPlan(key, panelConfig.approachAxis, pressIndex);
      if (!keyPlan.success) {
        return { success: false, error: keyPlan.error };
      }

      for (const [stepIndex, step] of keyPlan.steps.entries()) {
        steps.push({
          command: {
            id: createCommandId(actionIndex, pressIndex * keyPlan.steps.length + stepIndex),
            type: "MOVE_TO",
            source: "voice",
            target: { ...step.target },
          },
          description: `${step.phase} ${describeKeyPress(action.key)}`,
          keyLabel: action.key,
        });
      }
    }
  }

  return steps.length > 0
    ? { success: true, steps }
    : { success: false, error: "The agent plan has no executable steps." };
}
