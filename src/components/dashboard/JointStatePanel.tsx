// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useMemo } from "react";

import { useRobotStore } from "@/store/robot-store";

import { DashboardLayout } from "./DashboardLayout";
import { formatRadians, sortJointNames } from "./formatters";

export function JointStatePanel() {
  const jointAngles = useRobotStore((state) => state.jointAngles);
  const jointNames = useMemo(
    () => sortJointNames(Object.keys(jointAngles)),
    [jointAngles],
  );

  return (
    <DashboardLayout title="Joint State">
      {jointNames.length > 0 ? (
        <dl className="grid gap-1">
          {jointNames.map((jointName) => (
            <div
              className="flex items-center justify-between gap-2 rounded bg-slate-950 px-2 py-1.5"
              key={jointName}
            >
              <dt className="truncate text-[11px] text-slate-400">{jointName}</dt>
              <dd className="whitespace-nowrap font-mono text-[11px] text-slate-100">
                {formatRadians(jointAngles[jointName])}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-slate-400">
          Waiting for motion engine joint telemetry.
        </p>
      )}
    </DashboardLayout>
  );
}
