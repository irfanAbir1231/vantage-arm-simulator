// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useState } from "react";

import { executeMotionCommand, type Vector3Value } from "@/lib/robot";
import { useRobotStore } from "@/store/robot-store";

import { DashboardLayout } from "./DashboardLayout";
import { EditableAxisValue } from "./EditableAxisValue";
import { formatMeters } from "./formatters";

type Axis = keyof Vector3Value;

type AxisDrafts = Record<Axis, string | null>;

const AXES: readonly Axis[] = ["x", "y", "z"];
const NO_DRAFTS: AxisDrafts = { x: null, y: null, z: null };

function CurrentAxisReadout({ vector }: { vector: Vector3Value }) {
  return (
    <div className="rounded bg-slate-950 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">Current</p>
      <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[11px] text-slate-100">
        {AXES.map((axis) => (
          <span key={axis} title={`${axis.toUpperCase()} ${formatMeters(vector[axis])}`}>
            <span className="text-slate-500">{axis.toUpperCase()} </span>
            {vector[axis].toFixed(3)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EndEffectorPanel() {
  const endEffectorPosition = useRobotStore((state) => state.endEffectorPosition);
  const targetPosition = useRobotStore((state) => state.targetPosition);
  const moving = useRobotStore((state) => state.status === "moving");
  const [drafts, setDrafts] = useState<AxisDrafts>(NO_DRAFTS);
  const [message, setMessage] = useState<string | null>(null);

  const hasEdits = AXES.some((axis) => drafts[axis] !== null);

  function beginEdit(axis: Axis): void {
    setDrafts((current) => ({ ...current, [axis]: targetPosition[axis].toFixed(3) }));
  }

  function updateDraft(axis: Axis, draft: string): void {
    setDrafts((current) => ({ ...current, [axis]: draft }));
  }

  function cancelEdit(axis: Axis): void {
    setDrafts((current) => ({ ...current, [axis]: null }));
  }

  async function saveChanges(): Promise<void> {
    if (!hasEdits || moving) {
      return;
    }

    const target = {} as Vector3Value;

    for (const axis of AXES) {
      const draft = drafts[axis];

      if (draft === null) {
        target[axis] = targetPosition[axis];
        continue;
      }

      const parsed = Number.parseFloat(draft);

      if (!Number.isFinite(parsed)) {
        setMessage(`${axis.toUpperCase()} value "${draft}" is not a valid number.`);
        return;
      }

      target[axis] = parsed;
    }

    setMessage("Moving to the edited target...");
    const result = await executeMotionCommand({
      type: "MOVE_TO",
      source: "dashboard",
      target,
    });
    setMessage(result.message);

    if (result.success) {
      setDrafts(NO_DRAFTS);
    }
  }

  return (
    <DashboardLayout title="End Effector (m)">
      <div className="grid gap-1">
        <CurrentAxisReadout vector={endEffectorPosition} />
        <div className="rounded bg-slate-950 px-2 py-1.5">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Target (click a value to edit)
          </p>
          <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[11px] text-slate-100">
            {AXES.map((axis) => (
              <span key={axis}>
                <span className="text-slate-500">{axis.toUpperCase()} </span>
                <EditableAxisValue
                  disabled={moving}
                  draft={drafts[axis]}
                  onBeginEdit={() => beginEdit(axis)}
                  onCancel={() => cancelEdit(axis)}
                  onDraftChange={(draft) => updateDraft(axis, draft)}
                  onSubmit={() => void saveChanges()}
                  value={targetPosition[axis]}
                />
              </span>
            ))}
          </div>
        </div>
        {hasEdits ? (
          <button
            className="rounded border border-cyan-700 bg-cyan-950 py-1 text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={moving}
            onClick={() => void saveChanges()}
            type="button"
          >
            Save changes
          </button>
        ) : null}
        {message ? (
          <p className="truncate text-[11px] text-slate-400" title={message}>
            {message}
          </p>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
