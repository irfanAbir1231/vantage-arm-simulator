// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

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

  function submitTypedCommand(): void {
    void executeTypedCommand();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Voice Command
        </span>
        <button
          className={`rounded border px-2 py-0.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            listening
              ? "border-cyan-400 bg-cyan-950 text-cyan-200 animate-pulse"
              : "border-cyan-800 bg-cyan-950 text-cyan-100 hover:border-cyan-500"
          }`}
          disabled={speechRecognitionAvailable !== true || isExecuting}
          onClick={listening ? stopListening : startListening}
          title={listening ? "Stop listening" : "Listen for a voice command"}
          type="button"
        >
          {listening ? "■ Stop" : "Mic Listen"}
        </button>
      </div>
      <div className="flex gap-1.5">
        <input
          className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitTypedCommand();
            }
          }}
          placeholder="move up 2 cm"
          value={input}
        />
        <button
          className="rounded border border-slate-700 bg-slate-800 px-2.5 text-[11px] font-semibold text-slate-100 transition hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isExecuting && !isStopCommand}
          onClick={submitTypedCommand}
          type="button"
        >
          Send
        </button>
      </div>
      <div className="mt-2 grid gap-0.5 text-[11px]">
        <p
          className={speechError ? "truncate text-red-300" : "truncate text-slate-500"}
          title={speechMessage}
        >
          {transcript ? `Heard: ${transcript}` : speechMessage}
        </p>
        <p className="truncate text-slate-400" title={understood}>
          Understood: {understood}
        </p>
        <p
          aria-live="polite"
          className={isError ? "truncate text-red-300" : "truncate text-slate-300"}
          title={result}
        >
          Result: {result}
        </p>
      </div>
    </div>
  );
}
