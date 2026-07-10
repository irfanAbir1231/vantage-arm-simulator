<!-- OWNER: Member 4 - Hardware, Architecture, Documentation, Presentation -->

# Vantage Arm Simulator

## Problem Summary

Vantage Arm Simulator is a 6-hour hackathon project for demonstrating a browser-based control and simulation suite for a 6-DOF robotic arm that can interact with a fixed 6-key test panel.

## Team Ownership

| Area | Owner | Paths |
| --- | --- | --- |
| Visualization and Dashboard | Member 1 | `src/components/robot/**`, `src/components/dashboard/**`, `src/app/page.tsx`, `src/app/globals.css`, `public/robot/**` |
| Motion Engine, IK, Safety, Shared Store | Member 2 | `src/lib/robot/**`, `src/store/robot-store.ts`, `src/tests/robot/**` |
| Controls, Voice, PIN Automation | Member 3 | `src/components/controls/**`, `src/hooks/**`, `src/lib/voice/**`, `src/lib/pin/**`, `src/tests/controls/**` |
| Hardware, Architecture, Documentation, Presentation | Member 4 | `hardware/**`, `docs/**`, `presentation/**`, `README.md` |
| Team Lead | Team Lead | `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `src/app/layout.tsx`, `src/types/**` |

## Setup Instructions

```bash
npm install
npm run dev
```

## Branch Naming Convention

- `feature/visualization`
- `feature/motion-engine`
- `feature/controls`
- `feature/hardware-docs`

## Rules for Editing Owned Files

- Edit only files in your ownership area unless coordinated with the owner.
- Do not change shared motion contracts without informing all software members.
- Keep placeholders compile-safe until the owner replaces them with implementation.
- Do not overwrite organizer-provided URDF, mesh, coordinate, joint-limit, or key-mapping values.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Agentic Voice Mode

The Voice panel defaults to deterministic mode, which works locally without a network connection or provider configuration. Agentic mode is optional: it can interpret free-form, multi-step instructions, request clarification for ambiguous requests, and displays a plan that must be explicitly confirmed before any movement begins.

Agentic plans can use relative Cartesian movement, absolute Cartesian movement, individual joint movement, trusted panel-key presses, home, and stop. Every compiled step is sent through the same deterministic motion controller, workspace validation, inverse-kinematics, joint-limit, and cancellation pipeline as the other controls. Key presses use only the organizer-provided `public/robot/key.config.json` positions and the existing hover/touch/retract planner.

Configure these server-side variables in your local environment or deployment provider without committing a secret file:

```text
GROQ_API_KEY=<configured in local/deployment environment>
GROQ_MODEL=<a Groq chat model available to the account>
```

Never use `NEXT_PUBLIC_GROQ_API_KEY` or `NEXT_PUBLIC_GROQ_MODEL`. The browser sends only the instruction and non-secret robot context to `/api/agent/interpret`; the Groq request and authorization header exist only on the server. If agentic interpretation is unavailable, the app safely tries the existing deterministic voice parser with the same transcript. Browser speech recognition and speech feedback depend on browser support, while typed commands remain available.

## Six-Hour Priority Order

1. Autonomous PIN entry
2. URDF visualization and test-panel rendering
3. Shared motion pipeline and safety checks
4. Joystick and keyboard control
5. Deterministic voice control
6. Electrical schematic
7. UI polish and presentation
8. Optional agentic voice control

## Source of Truth

- [AGENTS.md](./AGENTS.md)
- [GUIDELINE.md](./GUIDELINE.md)
