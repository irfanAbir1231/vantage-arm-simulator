"use client";

import { describeAgentAction, type AgentPlanDecision } from "@/lib/agent";

type AgentPlanPreviewProps = {
  decision: AgentPlanDecision;
  currentStep: number;
  totalSteps: number;
  executing: boolean;
  onCancel: () => void;
  onExecute: () => void;
  executeDisabled: boolean;
};

export function AgentPlanPreview({
  decision,
  currentStep,
  totalSteps,
  executing,
  onCancel,
  onExecute,
  executeDisabled,
}: AgentPlanPreviewProps) {
  return (
    <div className="mt-2 border-t border-slate-800 pt-2">
      <p className="text-[11px] text-slate-300">Understood: {decision.understood}</p>
      <ol className="mt-1 grid gap-1 text-[11px] text-slate-400">
        {decision.actions.map((action, index) => (
          <li className="flex gap-1" key={`${action.type}-${index}`}>
            <span className="font-mono text-cyan-300">{index + 1}.</span>
            <span>{describeAgentAction(action)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-amber-200">{decision.confirmation}</p>
      {executing ? (
        <p className="mt-1 text-[11px] text-cyan-200">
          Executing step {currentStep} of {totalSteps}.
        </p>
      ) : null}
      <div className="mt-2 flex gap-1.5">
        <button
          className="rounded border border-emerald-700 bg-emerald-950 px-2.5 py-1 text-[11px] font-semibold text-emerald-100 transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={executeDisabled}
          onClick={onExecute}
          type="button"
        >
          Execute Plan
        </button>
        <button
          className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-slate-500"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
