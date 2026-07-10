import { JOINT_NAMES, type JointAngles } from "./types";

export const TRAJECTORY_STEPS = 24;
export const TRAJECTORY_DURATION_MS = 500;

export function createJointTrajectory(
  start: JointAngles,
  end: JointAngles,
  steps = TRAJECTORY_STEPS,
): JointAngles[] {
  return Array.from({ length: steps }, (_, index) => {
    const progress = (index + 1) / steps;
    const frame = {} as JointAngles;

    for (const jointName of JOINT_NAMES) {
      frame[jointName] = lerp(start[jointName], end[jointName], progress);
    }

    return frame;
  });
}

export function waitForTrajectoryStep(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, TRAJECTORY_DURATION_MS / TRAJECTORY_STEPS);
  });
}

export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
