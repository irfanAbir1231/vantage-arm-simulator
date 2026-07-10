// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

import type { ReactNode } from "react";

type DashboardLayoutProps = {
  title: string;
  children: ReactNode;
};

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
