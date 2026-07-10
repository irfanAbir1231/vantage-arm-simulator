// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import type { Vector3Value } from "@/lib/robot";
import { useRobotStore } from "@/store/robot-store";

import { DashboardLayout } from "./DashboardLayout";
import { formatMeters } from "./formatters";

function AxisReadout({ label, vector }: { label: string; vector: Vector3Value }) {
  return (
    <div className="rounded bg-slate-950 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[11px] text-slate-100">
        <span title={`X ${formatMeters(vector.x)}`}>
          <span className="text-slate-500">X </span>
          {vector.x.toFixed(3)}
        </span>
        <span title={`Y ${formatMeters(vector.y)}`}>
          <span className="text-slate-500">Y </span>
          {vector.y.toFixed(3)}
        </span>
        <span title={`Z ${formatMeters(vector.z)}`}>
          <span className="text-slate-500">Z </span>
          {vector.z.toFixed(3)}
        </span>
      </div>
    </div>
  );
}

export function EndEffectorPanel() {
  const endEffectorPosition = useRobotStore((state) => state.endEffectorPosition);
  const targetPosition = useRobotStore((state) => state.targetPosition);

  return (
    <DashboardLayout title="End Effector (m)">
      <div className="grid gap-1">
        <AxisReadout label="Current" vector={endEffectorPosition} />
        <AxisReadout label="Target" vector={targetPosition} />
      </div>
    </DashboardLayout>
  );
}
