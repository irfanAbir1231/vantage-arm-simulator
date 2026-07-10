// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useRobotStore } from "@/store/robot-store";

import { DashboardLayout } from "./DashboardLayout";
import { formatVector } from "./formatters";

export function EndEffectorPanel() {
  const endEffectorPosition = useRobotStore((state) => state.endEffectorPosition);
  const targetPosition = useRobotStore((state) => state.targetPosition);

  return (
    <DashboardLayout title="End Effector">
      <div className="grid gap-3 text-sm">
        <div className="rounded bg-slate-950 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Current
          </p>
          <p className="mt-1 font-mono text-slate-100">
            {formatVector(endEffectorPosition)}
          </p>
        </div>
        <div className="rounded bg-slate-950 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Target
          </p>
          <p className="mt-1 font-mono text-slate-100">
            {formatVector(targetPosition)}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
