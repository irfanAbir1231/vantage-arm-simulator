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
    <div className="border-t border-slate-800 pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-200">Voice command</span>
        <button
          className="border border-cyan-800 bg-cyan-950 px-2 py-1 text-xs font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!speechAvailable || listening}
          onClick={startListening}
          title="Listen for a voice command"
          type="button"
        >
          {listening ? "Listening" : "Listen"}
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="min-w-0 flex-1 border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-500"
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
          className="border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-cyan-500"
          onClick={submitTypedCommand}
          type="button"
        >
          Send
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">{transcript ? `Heard: ${transcript}` : message}</p>
    </div>
  );
}
