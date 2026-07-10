// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import type { ReactNode } from "react";

type DashboardLayoutProps = {
  title: string;
  children: ReactNode;
};

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
