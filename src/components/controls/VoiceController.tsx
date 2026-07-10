// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import type { FormEvent } from "react";

import { useVoiceControl } from "@/hooks/useVoiceControl";

export function VoiceController() {
  const {
    input,
    setInput,
    executeTypedCommand,
    isExecuting,
    understood,
    result,
    isError,
    listening,
    transcript,
    speechRecognitionAvailable,
    speechMessage,
    speechError,
    startListening,
    stopListening,
  } = useVoiceControl();
  const isStopCommand = input.trim().toLowerCase() === "stop";

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void executeTypedCommand();
  }

  return (
    <div className="rounded-md border border-slate-800 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200">Voice and Typed Command</h3>
        <span className="text-xs text-slate-500">
          {listening
            ? "Listening"
            : isExecuting
              ? "Executing"
              : speechRecognitionAvailable
                ? "Microphone ready"
                : "Typed only"}
        </span>
      </div>

      <div className="mt-3 rounded border border-slate-800 bg-slate-950 px-3 py-2">
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-emerald-700 bg-emerald-950 px-3 py-2 text-xs font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              speechRecognitionAvailable !== true || listening || isExecuting
            }
            onClick={startListening}
            type="button"
          >
            Start microphone
          </button>
          <button
            className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!listening}
            onClick={stopListening}
            type="button"
          >
            Stop listening
          </button>
        </div>
        <p
          aria-live="polite"
          className={`mt-2 text-xs ${speechError ? "text-red-300" : "text-slate-400"}`}
        >
          {speechMessage}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Transcript: <span className="text-slate-300">{transcript || "None"}</span>
        </p>
      </div>

      <form className="mt-3" onSubmit={handleSubmit}>
        <label className="block text-xs font-medium text-slate-300" htmlFor="typed-command">
          Input
        </label>
        <div className="mt-1 flex gap-2">
          <input
            autoComplete="off"
            className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
            id="typed-command"
            onChange={(event) => setInput(event.target.value)}
            placeholder="move left 2 centimeters"
            spellCheck={false}
            type="text"
            value={input}
          />
          <button
            className="rounded-md border border-sky-700 bg-sky-950 px-3 py-2 text-sm font-semibold text-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isExecuting && !isStopCommand}
            type="submit"
          >
            Execute
          </button>
        </div>
      </form>

      <dl className="mt-3 grid gap-2 text-xs">
        <div className="rounded border border-slate-800 bg-slate-950 px-3 py-2">
          <dt className="font-medium text-slate-500">Understood</dt>
          <dd className="mt-1 text-slate-300">{understood}</dd>
        </div>
        <div className="rounded border border-slate-800 bg-slate-950 px-3 py-2">
          <dt className="font-medium text-slate-500">Result</dt>
          <dd
            aria-live="polite"
            className={`mt-1 ${isError ? "text-red-300" : "text-slate-300"}`}
          >
            {result}
          </dd>
        </div>
      </dl>
    </div>
  );
}
