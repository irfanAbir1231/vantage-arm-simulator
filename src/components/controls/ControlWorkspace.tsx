// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import { CartesianJoystick } from "./CartesianJoystick";
import { EmergencyStopButton } from "./EmergencyStopButton";
import { KeyboardController } from "./KeyboardController";
import { PinEntryController } from "./PinEntryController";
import { VoiceController } from "./VoiceController";

export function ControlWorkspace() {
  return (
    <section
      aria-labelledby="controls-heading"
      className="rounded-lg border border-slate-800 bg-slate-900 p-4"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400">
          Operator Station
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-100" id="controls-heading">
          Controls
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
          Manual, deterministic voice, and autonomous commands all use the shared
          motion and safety pipeline.
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <section
          aria-labelledby="manual-controls-heading"
          className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3
                className="text-sm font-semibold text-slate-200"
                id="manual-controls-heading"
              >
                Manual Cartesian Control
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Jog the end effector in configured meter increments.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 px-2 py-1 text-[0.65rem] font-medium uppercase tracking-wide text-slate-400">
              Shared safety checks
            </span>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <CartesianJoystick />
            <KeyboardController />
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section aria-label="Voice and typed command">
            <VoiceController />
          </section>
          <section aria-label="Autonomous PIN entry">
            <PinEntryController />
          </section>
        </div>

        <aside aria-label="Emergency motion controls">
          <EmergencyStopButton />
        </aside>
      </div>
    </section>
  );
}
