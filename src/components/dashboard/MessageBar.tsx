// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useRobotStore } from "@/store/robot-store";

const STATUS_DOT_CLASS_NAME = {
  idle: "bg-slate-500",
  validating: "bg-cyan-400",
  moving: "bg-amber-400 animate-pulse",
  success: "bg-emerald-400",
  error: "bg-red-400",
  cancelled: "bg-zinc-400",
} as const;

export function MessageBar() {
  const status = useRobotStore((state) => state.status);
  const lastMessage = useRobotStore((state) => state.lastMessage);
  const activeSource = useRobotStore((state) => state.activeSource);

  return (
    <footer className="flex h-7 shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-900/80 px-4">
      <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_CLASS_NAME[status]}`} />
      <p className="truncate text-xs text-slate-300" title={lastMessage}>
        {lastMessage}
      </p>
      {activeSource ? (
        <span className="ml-auto whitespace-nowrap text-[10px] uppercase tracking-wide text-slate-500">
          via {activeSource}
        </span>
      ) : null}
    </footer>
  );
}
