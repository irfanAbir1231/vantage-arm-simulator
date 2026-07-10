// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import { CartesianJoystick } from "./CartesianJoystick";
import { EmergencyStopButton } from "./EmergencyStopButton";
import { KeyboardController } from "./KeyboardController";
import { PinEntryController } from "./PinEntryController";
import { VoiceController } from "./VoiceController";

export function ControlWorkspace() {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
        Controls
      </h2>
      <div className="mt-3 grid gap-3">
        <CartesianJoystick />
        <KeyboardController />
        <VoiceController />
        <PinEntryController />
        <EmergencyStopButton />
      </div>
    </section>
  );
}
