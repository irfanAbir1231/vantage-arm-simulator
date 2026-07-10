// OWNER: Member 3 - Controls, Voice, PIN Automation
// Do not edit without coordinating with the owner.

import { CartesianJoystick } from "./CartesianJoystick";
import { EmergencyStopButton } from "./EmergencyStopButton";
import { KeyboardController } from "./KeyboardController";
import { PinEntryController } from "./PinEntryController";
import { VoiceController } from "./VoiceController";

export function ControlWorkspace() {
  return (
    <div className="grid gap-2">
      <EmergencyStopButton />
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
        <CartesianJoystick />
        <KeyboardController />
      </section>
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
        <VoiceController />
      </section>
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-3">
        <PinEntryController />
      </section>
    </div>
  );
}
