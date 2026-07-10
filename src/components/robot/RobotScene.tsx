// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import { SceneGrid } from "./SceneGrid";
import { SceneLights } from "./SceneLights";
import { StylusMarker } from "./StylusMarker";
import { TestPanel } from "./TestPanel";
import { URDFRobot } from "./URDFRobot";

export function RobotScene() {
  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex-1 rounded-md border border-dashed border-slate-700 bg-slate-950 p-4">
        <p className="text-sm font-medium text-slate-300">
          React Three Fiber robot scene placeholder.
        </p>
        <div className="mt-4 grid gap-3 text-sm text-slate-400">
          <SceneLights />
          <SceneGrid />
          <URDFRobot />
          <TestPanel />
          <StylusMarker />
        </div>
      </div>
    </div>
  );
}
