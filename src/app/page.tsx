// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import { ControlWorkspace } from "@/components/controls";
import { RobotDashboard } from "@/components/dashboard";
import { RobotScene } from "@/components/robot";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-h-[520px]">
          <RobotScene />
        </section>
        <aside className="flex flex-col gap-4">
          <RobotDashboard />
          <ControlWorkspace />
        </aside>
      </main>
    </div>
  );
}
