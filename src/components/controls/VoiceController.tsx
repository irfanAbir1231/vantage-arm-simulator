// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { useVoiceControl } from "@/hooks/useVoiceControl";

export function VoiceController() {
  const [command, setCommand] = useState("");
  const {
    listening,
    message,
    speechAvailable,
    startListening,
    submitCommand,
    transcript,
  } = useVoiceControl();

  const submitTypedCommand = () => {
    if (!command.trim()) {
      return;
    }

    void submitCommand(command);
  };

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
          disabled={!speechAvailable || listening}
          onClick={startListening}
          title="Listen for a voice command"
          type="button"
        >
          {listening ? "● Listening" : "🎙 Listen"}
        </button>
      </div>
      <div className="flex gap-1.5">
        <input
          className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500"
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitTypedCommand();
            }
          }}
          placeholder="move up 2 cm"
          value={command}
        />
        <button
          className="rounded border border-slate-700 bg-slate-800 px-2.5 text-[11px] font-semibold text-slate-100 transition hover:border-cyan-500"
          onClick={submitTypedCommand}
          type="button"
        >
          Send
        </button>
      </div>
      <p
        className="mt-2 truncate text-[11px] text-slate-400"
        title={transcript ? `Heard: ${transcript}` : message}
      >
        {transcript ? `Heard: ${transcript}` : message}
      </p>
    </div>
  );
}
