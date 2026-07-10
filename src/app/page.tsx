// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import { ControlWorkspace } from "@/components/controls";
import { MessageBar, RobotDashboard, SystemStatus } from "@/components/dashboard";
import { RobotScene } from "@/components/robot";

export default function Home() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="flex h-11 shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-900/80 px-4">
        <h1 className="whitespace-nowrap text-sm font-bold tracking-[0.2em] text-slate-100">
          VANTAGE<span className="text-cyan-400">ARM</span>
        </h1>
        <SystemStatus />
      </header>
      <main className="grid min-h-0 flex-1 grid-cols-[226px_minmax(0,1fr)_290px] gap-2 p-2">
        <aside className="min-h-0 overflow-x-hidden overflow-y-auto">
          <RobotDashboard />
        </aside>
        <section className="min-h-0">
          <RobotScene />
        </section>
        <aside className="min-h-0 overflow-x-hidden overflow-y-auto">
          <ControlWorkspace />
        </aside>
      </main>
      <MessageBar />
    </div>
  );
}
