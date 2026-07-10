// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useRobotStore } from "@/store/robot-store";

const STATUS_CLASS_NAME = {
  idle: "bg-slate-800 text-slate-200",
  validating: "bg-cyan-950 text-cyan-200",
  moving: "bg-amber-950 text-amber-200",
  success: "bg-emerald-950 text-emerald-200",
  error: "bg-red-950 text-red-200",
  cancelled: "bg-zinc-800 text-zinc-200",
} as const;

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="hidden items-baseline gap-1.5 whitespace-nowrap md:inline-flex">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-xs text-slate-200">{value}</span>
    </span>
  );
}

export function SystemStatus() {
  const robotLoaded = useRobotStore((state) => state.robotLoaded);
  const status = useRobotStore((state) => state.status);
  const activeSource = useRobotStore((state) => state.activeSource);
  const activeKey = useRobotStore((state) => state.activeKey);
  const currentPinIndex = useRobotStore((state) => state.currentPinIndex);
  const lastResult = useRobotStore((state) => state.lastResult);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
      <span
        className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_CLASS_NAME[status]}`}
      >
        {status}
      </span>
      <span
        className={`whitespace-nowrap text-[11px] font-medium ${
          robotLoaded ? "text-emerald-400" : "text-amber-400"
        }`}
      >
        {robotLoaded ? "● URDF loaded" : "○ URDF loading"}
      </span>
      <StatusChip label="Source" value={activeSource ?? "none"} />
      <StatusChip label="Key" value={activeKey ?? "–"} />
      <StatusChip label="PIN" value={`${currentPinIndex}/6`} />
      <StatusChip
        label="Result"
        value={lastResult ? (lastResult.success ? "success" : lastResult.reason) : "–"}
      />
    </div>
  );
}
