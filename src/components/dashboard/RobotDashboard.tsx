// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import { EndEffectorPanel } from "./EndEffectorPanel";
import { JointStatePanel } from "./JointStatePanel";
import { SystemStatus } from "./SystemStatus";

export function RobotDashboard() {
  return (
    <div className="grid gap-4">
      <SystemStatus />
      <JointStatePanel />
      <EndEffectorPanel />
    </div>
  );
}
