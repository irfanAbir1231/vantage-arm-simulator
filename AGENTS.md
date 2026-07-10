# AGENTS.md

## Project

**Vantage Arm Simulator** — a browser-based simulation and control suite for a 6-DOF industrial robotic arm with a fixed stylus end-effector and a 6-key test panel.

The project must demonstrate:

- URDF-based 3D visualization
- Live joint-angle and end-effector telemetry
- Manual control through dashboard, GUI joystick, and keyboard
- Deterministic voice control
- Autonomous 6-digit PIN entry
- Safety validation before motion
- A proof-of-concept electrical schematic for a Wi-Fi-controlled 6-servo arm

The core architectural rule is that every control method must use the same shared motion pipeline.

---

## 1. Hackathon Constraints

- Total implementation time: **6 hours**
- Prioritize a stable end-to-end demo over perfect engineering completeness
- Do not implement full physics or realistic collision simulation
- Do not add unnecessary infrastructure
- Do not introduce a backend unless it is required for a specific feature
- Do not attempt the optional agentic bonus until all required features work
- Freeze major feature development during the final 30 minutes

Priority order:

1. Autonomous PIN entry
2. URDF visualization and test-panel rendering
3. Shared motion pipeline and safety checks
4. Joystick and keyboard control
5. Deterministic voice control
6. Electrical schematic
7. UI polish and presentation
8. Optional agentic voice control

---

## 2. Team Roles and Ownership

### Member 1 — 3D Visualization and Dashboard

Owns:

```text
src/components/robot/**
src/components/dashboard/**
src/app/page.tsx
src/app/globals.css
public/robot/**
```

Responsible for:

- URDF loading
- Mesh-path fixes
- 3D scene, lighting, camera, grid, and orbit controls
- Test-panel rendering
- Joint-angle display
- End-effector position display
- Active-key highlighting
- Visual polish

Must not implement:

- IK
- Safety logic
- Voice parser
- PIN sequencing
- Electrical schematic

---

### Member 2 — Motion Engine, IK, State, and Safety

Owns:

```text
src/lib/robot/**
src/store/robot-store.ts
```

Responsible for:

- Shared TypeScript contracts
- Zustand robot state
- Motion command execution
- Inverse kinematics
- Joint-limit validation
- Workspace validation
- Reachability checks
- Trajectory interpolation
- Motion cancellation
- Tolerance checking

Must not implement:

- 3D UI
- Joystick UI
- Keyboard bindings
- Voice UI
- PIN UI
- Hardware schematic

---

### Member 3 — Controls, Voice, and Autonomous PIN Entry

Owns:

```text
src/components/controls/**
src/hooks/**
src/lib/voice/**
src/lib/pin/**
```

Responsible for:

- Joystick control
- Keyboard control
- Voice recognition
- Deterministic voice-command parsing
- Typed-command fallback
- PIN validation
- PIN sequence generation
- Progress display
- Start, stop, and reset controls

Must not implement:

- IK equations
- Robot-state internals
- Direct joint writes
- URDF rendering
- Electrical schematic

---

### Member 4 — Hardware, Documentation, and Presentation

Owns:

```text
docs/**
hardware/**
presentation/**
README.md
```

Responsible for:

- Electrical block diagram
- PoC circuit schematic
- Wokwi recreation
- Pin-mapping table
- Power-delivery explanation
- Bill of materials
- System architecture diagram
- README
- Demo script
- Submission checklist
- Backup demo video coordination

Must not modify software-owned files unless coordinated with the relevant owner.

---

## 3. Protected Files

The following files are high-conflict files:

```text
package.json
package-lock.json
tsconfig.json
src/lib/robot/types.ts
src/store/robot-store.ts
src/app/page.tsx
README.md
```

Rules:

- Only the assigned owner may edit a protected file
- Dependency changes must be coordinated first
- Do not reformat unrelated files
- Do not rename folders after Hour 1
- Do not change shared contracts without informing all software members

---

## 4. Shared Technical Contracts

All controls must create a structured motion command and send it through the same controller.

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

The public motion API must remain simple:

```ts
executeMotionCommand(command: MotionCommand): Promise<MotionResult>
cancelMotion(): void
```

UI code must never directly set robot joints.

---

## 5. Coordinate and Unit Rules

Use these defaults unless the supplied files prove otherwise:

```text
Distance: meters
Angles: radians internally
Panel coordinates: robot base frame
Position shape: { x, y, z }
Manual jog step: 0.01 m
PIN hover offset: 0.03 m
PIN tolerance: 0.005 m
PIN length: exactly 6 digits
```

Before integration, confirm:

- URDF unit scale
- Key-config unit scale
- End-effector link name
- Panel-normal axis
- Joint names
- Joint limits

Do not hard-code unexplained coordinate transforms in UI components. Put transforms in one shared helper.

---

## 6. Safety Rules

Every command must pass deterministic validation before execution.

Required checks:

- All numeric values are finite
- Target is inside workspace bounds
- IK solution exists
- Joint limits are respected
- No `NaN` or `Infinity` joint values
- Autonomous motion can be cancelled
- Malformed voice output is rejected

Never execute unvalidated LLM or agent output.

---

## 7. Git Workflow

Branches:

```text
main
develop
feature/visualization
feature/motion-engine
feature/controls
feature/hardware-docs
```

Rules:

- No direct commits to `main`
- Merge into `develop` in controlled order
- Keep commits small and descriptive
- Pull `develop` before integration
- Resolve only conflicts in files you own
- Do not merge all feature branches at once

Recommended merge order:

1. Shared types and store contract
2. Motion engine
3. Visualization
4. Controls and PIN automation
5. Hardware and documentation
6. Final tested `develop` to `main`

Commit style:

```text
feat: add URDF robot loader
feat: implement motion safety checks
feat: add autonomous PIN sequence
fix: correct panel coordinate transform
docs: add hardware pin mapping
```

---

## 8. Pull Request Checklist

Each pull request must state:

- What changed
- Which files changed
- How it was tested
- Known limitations
- Whether any shared contract changed
- Whether integration is required immediately

Before merge:

```bash
npm run lint
npm run build
```

---

## 9. Coding Rules

- Use TypeScript
- Prefer small focused components
- Avoid `any`
- Keep robot logic outside React UI components
- Keep hardware docs outside application code
- Use clear names instead of abbreviations
- Add comments only where logic is non-obvious
- Handle loading and error states
- Never silently ignore failed motion commands
- Do not introduce large dependencies without agreement

---

## 10. Demo Rules

The final demo should show, in this order:

1. Robot and panel visible in the browser
2. Joint angles and end-effector position
3. Joystick movement
4. Keyboard movement
5. Voice movement
6. Autonomous PIN entry
7. Safety rejection or cancellation
8. Electrical architecture
9. High-level system architecture

Keep one backup screen recording in case deployment or microphone access fails.

---

## 11. Emergency Fallbacks

### URDF loading fails

- Fix mesh paths first
- Check relative URLs and filename case
- Use simplified geometry only as a last-resort visual fallback

### General IK fails

- Use approximate three-joint IK for base, shoulder, and elbow
- Keep wrist joints fixed
- If necessary, use calibrated key-specific poses for PIN entry

### Voice recognition fails

- Provide typed commands through the same parser
- Continue showing structured-command generation

### Deployment fails

- Run locally
- Use a backup demo video
- Keep the architecture and hardware presentation ready

---

## 12. Definition of Done

The project is demo-ready when:

- The application builds
- The robot loads
- The panel is visible
- Manual controls generate motion
- Voice produces at least basic deterministic commands
- A valid PIN runs through six key touches
- Invalid motion is rejected
- Stop/cancel works
- Hardware schematic is complete
- Architecture diagram is complete
- README contains setup instructions
- A backup demo recording exists
