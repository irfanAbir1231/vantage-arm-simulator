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
        <dl className="grid gap-2 text-sm">
          {jointNames.map((jointName) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded bg-slate-950 px-3 py-2"
              key={jointName}
            >
              <dt className="truncate text-slate-300">{jointName}</dt>
              <dd className="font-mono text-slate-100">
                {formatRadians(jointAngles[jointName])}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-slate-400">
          Waiting for motion engine joint telemetry.
        </p>
      )}
    </DashboardLayout>
  );
}
