// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useRobotStore } from "@/store/robot-store";

import { DashboardLayout } from "./DashboardLayout";

const STATUS_CLASS_NAME = {
  idle: "bg-slate-800 text-slate-200",
  validating: "bg-cyan-950 text-cyan-100",
  moving: "bg-amber-950 text-amber-100",
  success: "bg-emerald-950 text-emerald-100",
  error: "bg-red-950 text-red-100",
  cancelled: "bg-zinc-800 text-zinc-100",
} as const;

export function SystemStatus() {
  const robotLoaded = useRobotStore((state) => state.robotLoaded);
  const status = useRobotStore((state) => state.status);
  const activeSource = useRobotStore((state) => state.activeSource);
  const activeKey = useRobotStore((state) => state.activeKey);
  const currentPinIndex = useRobotStore((state) => state.currentPinIndex);
  const lastMessage = useRobotStore((state) => state.lastMessage);
  const lastResult = useRobotStore((state) => state.lastResult);

  return (
    <DashboardLayout title="System Status">
      <div className="grid gap-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded px-2 py-1 text-xs font-semibold uppercase ${STATUS_CLASS_NAME[status]}`}
          >
            {status}
          </span>
          <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
            {robotLoaded ? "URDF loaded" : "URDF loading"}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-slate-300">
          <dt className="text-slate-500">Source</dt>
          <dd>{activeSource ?? "none"}</dd>
          <dt className="text-slate-500">Active key</dt>
          <dd>{activeKey ?? "none"}</dd>
          <dt className="text-slate-500">PIN index</dt>
          <dd>{currentPinIndex}</dd>
          <dt className="text-slate-500">Last result</dt>
          <dd>{lastResult ? (lastResult.success ? "success" : lastResult.reason) : "none"}</dd>
        </dl>
        <p className="rounded bg-slate-950 p-2 text-slate-300">{lastMessage}</p>
      </div>
    </DashboardLayout>
  );
}
