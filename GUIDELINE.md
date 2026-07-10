# GUIDELINE.md

## 6-Hour Parallel Execution Guide

This guide assigns exact steps to all four members so the team can work simultaneously with minimal file collisions.

---

# 0. Shared Setup — First 15 Minutes

One person acts as temporary repository lead.

## Repository lead

Run:

```bash
npx create-next-app@latest vantage-arm-simulator \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd vantage-arm-simulator
npm install three @react-three/fiber @react-three/drei urdf-loader zustand
npm install -D @types/three

git init
git add .
git commit -m "chore: initialize project"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main

git checkout -b develop
git push -u origin develop
```

Copy organizer assets into:

```text
public/robot/arm.urdf
public/robot/key.config.json
public/robot/meshes/**
```

Create the four feature branches:

```bash
git checkout develop
git checkout -b feature/visualization
git push -u origin feature/visualization

git checkout develop
git checkout -b feature/motion-engine
git push -u origin feature/motion-engine

git checkout develop
git checkout -b feature/controls
git push -u origin feature/controls

git checkout develop
git checkout -b feature/hardware-docs
git push -u origin feature/hardware-docs
```

Each member then checks out only their branch.

---

# 1. Member 1 — 3D Visualization and Dashboard

## Goal

Produce a working 3D scene that displays the URDF robot, the six-key panel, and live robot telemetry.

## Files owned

```text
src/components/robot/**
src/components/dashboard/**
src/app/page.tsx
src/app/globals.css
public/robot/**
```

## 0:15–0:35 — Inspect assets

1. Open `public/robot/arm.urdf`.
2. Write down:
   - all joint names
   - all link names
   - end-effector/stylus link name
   - mesh filenames
   - joint axes
   - joint limits
3. Confirm whether mesh paths are relative.
4. Open `key.config.json` and identify its exact structure.
5. Tell Member 2 and Member 3:
   - units
   - end-effector link name
   - panel-normal axis
   - available key labels

## 0:35–1:15 — Build the 3D scene

Create:

```text
src/components/robot/RobotScene.tsx
src/components/robot/URDFRobot.tsx
src/components/robot/TestPanel.tsx
```

`RobotScene.tsx` should contain:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { URDFRobot } from "./URDFRobot";
import { TestPanel } from "./TestPanel";

export function RobotScene() {
  return (
    <div className="h-[640px] overflow-hidden rounded-xl bg-slate-950">
      <Canvas camera={{ position: [1.5, 1.2, 1.5], fov: 45 }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 2]} intensity={2} />
        <URDFRobot />
        <TestPanel />
        <Grid infiniteGrid />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
```

In `URDFRobot.tsx`:

1. Load `/robot/arm.urdf` with `urdf-loader`.
2. Add the robot object to the scene.
3. Read `jointAngles` from the shared store.
4. Apply each joint value by joint name.
5. Show a visible loading indicator outside the Canvas if necessary.
6. Log missing joint names only once.

Success check:

- Robot renders
- Camera orbits
- No mesh 404 errors
- Console has no repeating errors

## 1:15–2:00 — Render the panel

1. Parse `key.config.json`.
2. Normalize its structure in one local adapter.
3. Render each key as a small box.
4. Position keys exactly from the config.
5. Use a group transform only if the config needs a base-frame conversion.
6. Add labels only after all keys are visible.

Success check:

- Six keys are visible
- Their relative spacing matches the config
- Panel is near the robot

## 2:00–2:40 — Dashboard

Create:

```text
src/components/dashboard/RobotDashboard.tsx
src/components/dashboard/JointStatePanel.tsx
src/components/dashboard/EndEffectorPanel.tsx
src/components/dashboard/SystemStatus.tsx
```

Display:

- Current status
- Last message
- Active source
- Current x, y, z
- Target x, y, z
- Joint names and angles
- Active PIN key

Read store state only. Do not calculate IK or directly write joints.

## 2:40–3:20 — Integrate motion-store updates

After Member 2 merges the store contract:

```bash
git checkout feature/visualization
git fetch origin
git merge origin/develop
```

Connect:

- store joint angles → URDF joints
- store status → dashboard
- active key → panel highlight

## 3:20–4:20 — Visual PIN feedback

1. Highlight the current key.
2. Add a small target marker if time permits.
3. Keep panel visible from the default camera.
4. Add a reset-camera button only if easy.

## 4:20–5:00 — Integration support

- Fix mesh paths
- Fix asset loading on production builds
- Verify case-sensitive filenames
- Confirm the deployed URL loads robot assets

## 5:00–5:30 — Polish

Focus only on:

- readable layout
- clear status colors
- large enough control area
- visible panel and stylus

Do not redesign the whole UI.

## Final output

- Working robot scene
- Visible key panel
- Live dashboard
- Active-key highlighting
- Deployment-safe asset paths

---

# 2. Member 2 — Motion Engine, IK, Safety, and Shared State

## Goal

Provide one stable movement API used by all input methods.

## Files owned

```text
src/lib/robot/**
src/store/robot-store.ts
```

## 0:15–0:35 — Define contracts immediately

Create:

```text
src/lib/robot/types.ts
src/store/robot-store.ts
src/lib/robot/controller.ts
src/lib/robot/safety.ts
src/lib/robot/trajectory.ts
src/lib/robot/kinematics.ts
```

Define:

```ts
export type Vector3Value = {
  x: number;
  y: number;
  z: number;
};

export type MotionSource =
  | "dashboard"
  | "joystick"
  | "keyboard"
  | "voice"
  | "autonomous";

export type MotionCommand =
  | {
      type: "MOVE_RELATIVE";
      source: MotionSource;
      delta: Vector3Value;
    }
  | {
      type: "MOVE_TO";
      source: MotionSource;
      target: Vector3Value;
    }
  | {
      type: "MOVE_JOINT";
      source: MotionSource;
      jointName: string;
      angle: number;
    };
```

Create `MotionResult` with success/failure and readable messages.

Commit this first:

```bash
git add .
git commit -m "feat: define robot motion contracts"
git push origin feature/motion-engine
```

Merge the contract into `develop` immediately so Members 1 and 3 can import it.

## 0:35–1:10 — Zustand store

Store fields:

```ts
{
  jointAngles,
  endEffectorPosition,
  targetPosition,
  status,
  message,
  activeSource,
  activeKey,
  completedDigits,
  isCancelled
}
```

Expose only controlled update functions.

Do not let UI components modify arbitrary store state.

## 1:10–1:50 — Command controller

Implement:

```ts
executeMotionCommand(command: MotionCommand): Promise<MotionResult>
cancelMotion(): void
resetMotionCancellation(): void
```

Flow:

```text
command
→ validate structure
→ resolve target
→ workspace check
→ IK
→ joint-limit check
→ trajectory interpolation
→ update store
→ return result
```

## 1:50–2:40 — IK

Preferred six-hour implementation:

1. Use base rotation from `atan2(y, x)`.
2. Solve shoulder/elbow with planar two-link IK.
3. Keep wrist orientation fixed.
4. Map calculated values to actual URDF joint names.

Inputs required from Member 1:

- joint names
- link lengths or approximate lengths
- zero-pose orientation
- base frame

Reject unreachable points.

If general IK is unstable by Hour 3:

- support rough Cartesian movement for manual controls
- use calibrated key-specific joint poses for PIN entry

A reliable demo is more valuable than a theoretically complete but broken solver.

## 2:40–3:15 — Safety

Implement:

- finite number checks
- workspace checks
- joint-limit checks
- unreachable target rejection
- motion cancellation
- no direct execution after validation failure

Keep workspace values in one config object.

## 3:15–3:45 — Trajectory

Interpolate current joints to target joints over 20–30 steps.

Example helper:

```ts
function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}
```

Use short sleeps or `requestAnimationFrame`-friendly updates.

Avoid overengineering velocity and acceleration profiles.

## 3:45–4:20 — PIN support

Provide:

```ts
isWithinTolerance(actual, target, tolerance)
```

Default tolerance:

```text
0.005 m
```

Support:

- `activeKey`
- `completedDigits`
- cancellation
- result messages

## 4:20–5:00 — Integration and debugging

Test in this order:

1. Direct joint command
2. Relative Cartesian command
3. Absolute Cartesian command
4. Unreachable target
5. Cancellation
6. Six sequential key targets

Fix priorities:

1. `NaN`
2. incorrect joint names
3. broken limits
4. unstable interpolation
5. inaccurate telemetry

## 5:00–5:30 — Freeze motion API

Do not change command types after this point unless absolutely necessary.

## Final output

- Shared state
- One command API
- Basic IK
- Safety validation
- Smooth visible motion
- Cancellation
- PIN tolerance checks

---

# 3. Member 3 — Joystick, Keyboard, Voice, and PIN Automation

## Goal

Build all operator input methods and convert each into shared motion commands.

## Files owned

```text
src/components/controls/**
src/hooks/**
src/lib/voice/**
src/lib/pin/**
```

## 0:15–0:35 — Create UI shells

Create:

```text
src/components/controls/ControlPanel.tsx
src/components/controls/JoystickControl.tsx
src/components/controls/KeyboardControl.tsx
src/components/controls/VoiceControl.tsx
src/components/controls/PinEntry.tsx
src/hooks/useKeyboardControl.ts
src/hooks/useVoiceControl.ts
src/lib/voice/parser.ts
src/lib/pin/pin-sequence.ts
```

Build a simple tabbed or stacked UI with:

- joystick buttons
- keyboard mapping
- microphone button
- transcript
- typed-command fallback
- PIN input
- Start
- Stop
- Reset

## 0:35–1:10 — Joystick

Map controls:

```text
Left: X - 0.01
Right: X + 0.01
Forward: Y + 0.01
Backward: Y - 0.01
Up: Z + 0.01
Down: Z - 0.01
```

Call only:

```ts
executeMotionCommand({
  type: "MOVE_RELATIVE",
  source: "joystick",
  delta: { x, y, z },
});
```

Do not write to store directly.

## 1:10–1:40 — Keyboard

Map:

```text
W → Y+
S → Y-
A → X-
D → X+
R → Z+
F → Z-
Escape → cancel
```

Ignore shortcuts when the user is typing in an input or textarea.

Use `preventDefault()` only for handled keys.

## 1:40–2:30 — Deterministic voice control

Use browser speech recognition where available.

Support these commands first:

```text
move up
move down
move left
move right
move forward
move backward
stop
home
```

Then add optional distances:

```text
move up 2 centimeters
move left 5 centimeters
```

Parser output must be a `MotionCommand` or a clear error.

Show:

```text
Heard: ...
Understood: ...
Result: ...
```

Add typed-command fallback using the same parser.

Do not use an LLM before the core works.

## 2:30–3:30 — Autonomous PIN entry

Read the actual key labels from `key.config.json`.

Validate:

- exactly six characters
- every character exists in the panel config

Sequence for each digit:

```text
1. Move to hover position
2. Move to key coordinate
3. Wait for completion
4. Mark press success
5. Move back to hover position
6. Continue
```

Use the panel-normal axis provided by Member 1.

Default hover offset:

```text
0.03 m
```

Never start the next motion before the previous result succeeds.

On failure:

- stop the sequence
- show the digit that failed
- show the motion error

## 3:30–4:00 — Progress and cancellation

Display:

```text
PIN: 123456
Current digit: 3
Progress: 3/6
State: moving / pressing / complete / failed
```

Stop button must call:

```ts
cancelMotion();
```

## 4:00–4:40 — Integration

Pull the latest motion engine:

```bash
git checkout feature/controls
git fetch origin
git merge origin/develop
```

Connect all controls to the actual controller.

Test:

1. Every joystick button
2. Every keyboard key
3. Voice command
4. Typed fallback
5. Valid PIN
6. Invalid PIN
7. Cancellation

## 4:40–5:20 — Reliability pass

Focus on:

- disabled buttons during active motion
- clear error messages
- microphone permission errors
- browser compatibility message
- no duplicate keyboard listeners
- no sequence continuing after failure

## 5:20–5:30 — Freeze controls

Do not add new command phrases after this point.

## Final output

- Joystick
- Keyboard
- Basic voice
- Typed fallback
- Autonomous PIN entry
- Progress display
- Cancellation

---

# 4. Member 4 — Hardware, Documentation, and Presentation

## Goal

Complete the hardware-related deliverable and prepare the team to explain and present the system clearly.

## Files owned

```text
docs/**
hardware/**
presentation/**
README.md
```

## 0:15–0:45 — Hardware architecture

Use this PoC architecture:

```text
Browser application
       ↓ Wi-Fi
ESP32 microcontroller
       ↓ I²C
PCA9685 PWM driver
       ↓ PWM channels 0–5
Six servo motors

External 5–6 V high-current supply
       ↓
Servo power rail

ESP32 and servo supply share common ground
```

Create:

```text
hardware/block-diagram.md
hardware/pin-mapping.md
hardware/power-notes.md
hardware/bom.md
```

## 0:45–1:30 — Pin mapping

Use:

| From | To | Purpose |
|---|---|---|
| ESP32 3.3V | PCA9685 VCC | Logic supply |
| ESP32 GND | PCA9685 GND | Common logic ground |
| ESP32 GPIO 21 | PCA9685 SDA | I²C data |
| ESP32 GPIO 22 | PCA9685 SCL | I²C clock |
| External 5–6V + | PCA9685 V+ | Servo power |
| External supply GND | PCA9685 GND | Servo return and common ground |
| PCA9685 CH0–CH5 | Servo signal pins | Six PWM control channels |

Explain:

- six servos must not be powered from ESP32 pins
- use an external supply sized for total stall current
- use a bulk capacitor near the servo rail
- share ground between ESP32 and servo power
- Wi-Fi comes from ESP32

## 1:30–2:30 — Wokwi/manual schematic

Build the schematic manually in Wokwi using:

- ESP32
- PCA9685 if available, or a logically equivalent PWM-control representation
- six servo symbols if available
- external supply representation
- labeled common ground

Capture a screenshot.

Do not spend the whole event fighting Wokwi limitations. A clear diagram plus pin map is acceptable evidence.

## 2:30–3:15 — System architecture diagram

Create:

```text
Input layer
├── Dashboard
├── Joystick
├── Keyboard
├── Voice
└── PIN automation
        ↓
Structured motion command
        ↓
Deterministic safety validation
        ↓
Inverse kinematics
        ↓
Trajectory generator
        ↓
Robot state store
        ↓
URDF renderer and dashboard
```

Add one sentence explaining why all controls share one pipeline.

## 3:15–4:00 — README

Include:

- Project purpose
- Features
- Architecture overview
- Tech stack
- Local setup
- Asset placement
- Keyboard controls
- Voice commands
- PIN behavior
- Safety behavior
- Hardware overview
- Known limitations
- Team roles

## 4:00–4:45 — Demo script

Prepare a three-minute script:

### 0:00–0:25

Problem and value proposition.

### 0:25–0:50

Shared architecture.

### 0:50–1:15

URDF and dashboard.

### 1:15–1:40

Joystick and keyboard.

### 1:40–2:00

Voice control.

### 2:00–2:35

Autonomous PIN entry.

### 2:35–2:50

Safety rejection/cancellation.

### 2:50–3:00

Hardware architecture and conclusion.

## 4:45–5:30 — Submission preparation

Prepare:

```text
docs/submission-checklist.md
docs/demo-script.md
docs/architecture.md
hardware/electrical-schematic.png
hardware/wokwi-screenshot.png
```

Verify:

- repository link
- deployed URL
- backup video
- team names
- demo order
- hardware image opens

## Final output

- Electrical schematic
- Wokwi screenshot
- Pin-mapping table
- Power explanation
- Architecture diagram
- README
- Demo script
- Submission checklist

---

# 5. Integration Schedule

## Around Hour 3:30

Merge in this order:

1. Member 2 motion engine
2. Member 1 visualization
3. Member 3 controls
4. Member 4 docs and hardware

Commands:

```bash
git checkout develop
git pull origin develop
git merge --no-ff feature/motion-engine
git push origin develop
```

Repeat for each branch.

After every merge:

```bash
npm run lint
npm run build
```

Do not continue to the next merge if the current build fails.

---

# 6. Final 90-Minute Checklist

## 4:30–5:00 — End-to-end test

Test:

```text
[ ] Page loads
[ ] Robot renders
[ ] Panel renders
[ ] Dashboard updates
[ ] Joystick works
[ ] Keyboard works
[ ] Voice works or typed fallback works
[ ] PIN completes all six presses
[ ] Invalid target is rejected
[ ] Stop cancels motion
```

## 5:00–5:30 — Deployment

```bash
npm run build
npx vercel
```

Verify production asset paths and microphone behavior.

## 5:30–6:00 — Feature freeze

No new features.

During this period:

- Member 1 checks visuals and records backup footage
- Member 2 checks IK, limits, and cancellation
- Member 3 runs repeated PIN and voice tests
- Member 4 runs the presentation and submission checklist

---

# 7. Emergency Fallback Plan

## URDF cannot load

- Fix mesh URL paths and filename case
- Confirm all assets are inside `public/robot`
- Use simplified boxes/cylinders only as a final fallback

## IK cannot reach the panel

- Apply one documented panel transform
- Keep wrist joints fixed
- Use calibrated joint poses for each key if necessary

## Voice fails

- Use typed commands through the same parser
- Clearly explain that the command pipeline is unchanged

## Deployment fails

- Demo locally
- Use a backup video
- Continue with architecture and hardware explanation

## Time is almost finished

Stop optional work and ensure this exact path works:

```text
Load application
→ move manually
→ issue one voice/typed command
→ run one six-digit PIN
→ show safety stop
→ show electrical schematic
```
