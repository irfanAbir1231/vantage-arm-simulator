"use client";

import { AgentPlanPreview } from "./AgentPlanPreview";
import { useAgenticControl } from "@/hooks/useAgenticControl";

export function AgenticVoiceController() {
  const {
    input,
    setInput,
    transcript,
    status,
    message,
    decision,
    currentStep,
    totalSteps,
    spokenFeedback,
    setSpokenFeedback,
    speechRecognitionAvailable,
    robotLoaded,
    motionStatus,
    interpretInstruction,
    executeConfirmedPlan,
    cancel,
    startListening,
    stopListening,
  } = useAgenticControl();

  const isBusy = status === "interpreting" || status === "executing";
  const isListening = status === "listening";
  const isAwaitingConfirmation = decision?.kind === "plan" && status === "awaiting-confirmation";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Agentic Voice
        </span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] text-slate-400">
            <input
              checked={spokenFeedback}
              className="accent-cyan-400"
              onChange={(event) => setSpokenFeedback(event.target.checked)}
              type="checkbox"
            />
            Speak
          </label>
          <button
            className={`rounded border px-2 py-0.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              isListening
                ? "border-cyan-400 bg-cyan-950 text-cyan-200 animate-pulse"
                : "border-cyan-800 bg-cyan-950 text-cyan-100 hover:border-cyan-500"
            }`}
            disabled={!speechRecognitionAvailable || isBusy}
            onClick={isListening ? stopListening : startListening}
            title={isListening ? "Stop listening" : "Listen for an agentic instruction"}
            type="button"
          >
            {isListening ? "Stop" : "Mic Listen"}
          </button>
        </div>
      </div>
      <div className="flex gap-1.5">
        <input
          className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500"
          disabled={isBusy}
          maxLength={500}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void interpretInstruction();
            }
          }}
          placeholder="move left 2 cm, then press key 5"
          value={input}
        />
        <button
          className="rounded border border-slate-700 bg-slate-800 px-2.5 text-[11px] font-semibold text-slate-100 transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isBusy || input.trim().length === 0}
          onClick={() => void interpretInstruction()}
          type="button"
        >
          Interpret
        </button>
      </div>
      <div className="mt-2 grid gap-0.5 text-[11px]">
        <p className="truncate text-slate-500" title={transcript}>
          {transcript ? `Heard: ${transcript}` : "Type an instruction or use the microphone."}
        </p>
        <p
          aria-live="polite"
          className={status === "failed" ? "text-red-300" : "text-slate-300"}
        >
          {status === "interpreting" ? (
            <span className="mr-1 inline-block animate-pulse text-cyan-300" aria-label="Interpreting">
              ●
            </span>
          ) : null}
          {message}
        </p>
      </div>
      {decision?.kind === "clarification" ? (
        <div className="mt-2 border-t border-slate-800 pt-2">
          <p className="text-[11px] text-amber-200">Clarification: {decision.question}</p>
          <button
            className="mt-2 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-slate-500"
            onClick={cancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      ) : null}
      {decision?.kind === "plan" ? (
        <AgentPlanPreview
          currentStep={currentStep}
          decision={decision}
          executeDisabled={
            !isAwaitingConfirmation ||
            !robotLoaded ||
            motionStatus === "moving" ||
            motionStatus === "cancelled"
          }
          executing={status === "executing"}
          onCancel={cancel}
          onExecute={() => void executeConfirmedPlan()}
          totalSteps={totalSteps || decision.actions.length}
        />
      ) : null}
    </div>
  );
}
