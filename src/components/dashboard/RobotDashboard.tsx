// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import { EndEffectorPanel } from "./EndEffectorPanel";
import { JointStatePanel } from "./JointStatePanel";

export function RobotDashboard() {
  return (
    <div className="grid gap-2">
      <EndEffectorPanel />
      <JointStatePanel />
    </div>
  );
}
