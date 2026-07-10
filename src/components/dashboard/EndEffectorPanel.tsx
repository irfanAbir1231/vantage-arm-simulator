// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { executeMotionCommand, type Vector3Value } from "@/lib/robot";
import { useRobotStore } from "@/store/robot-store";

import { DashboardLayout } from "./DashboardLayout";
import { EditableAxisValue } from "./EditableAxisValue";
import { formatMeters } from "./formatters";

function CurrentAxisReadout({ vector }: { vector: Vector3Value }) {
  return (
    <div className="rounded bg-slate-950 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">Current</p>
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
  const moving = useRobotStore((state) => state.status === "moving");
  const [message, setMessage] = useState<string | null>(null);

  async function commitAxis(axis: keyof Vector3Value, value: number): Promise<void> {
    const target: Vector3Value = { ...targetPosition, [axis]: value };
    const result = await executeMotionCommand({
      type: "MOVE_TO",
      source: "dashboard",
      target,
    });
    setMessage(result.message);
  }

  return (
    <DashboardLayout title="End Effector (m)">
      <div className="grid gap-1">
        <CurrentAxisReadout vector={endEffectorPosition} />
        <div className="rounded bg-slate-950 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Target (right-click a value to edit)
          </p>
          <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[11px] text-slate-100">
            <span>
              <span className="text-slate-500">X </span>
              <EditableAxisValue
                disabled={moving}
                onCommit={(value) => void commitAxis("x", value)}
                value={targetPosition.x}
              />
            </span>
            <span>
              <span className="text-slate-500">Y </span>
              <EditableAxisValue
                disabled={moving}
                onCommit={(value) => void commitAxis("y", value)}
                value={targetPosition.y}
              />
            </span>
            <span>
              <span className="text-slate-500">Z </span>
              <EditableAxisValue
                disabled={moving}
                onCommit={(value) => void commitAxis("z", value)}
                value={targetPosition.z}
              />
            </span>
          </div>
        </div>
        {message ? (
          <p className="truncate text-[11px] text-slate-400" title={message}>
            {message}
          </p>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
