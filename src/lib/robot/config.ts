// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

export const ROBOT_CONFIG = {
  units: "meters",
  jointAngleUnits: "radians",
  movementStep: 0.01,
  keyPressTolerance: 0.005,
  defaultSpeed: 0.5,
  hoverOffset: 0.03,
  workspace: {
    x: [-1, 1],
    y: [-1, 1],
    z: [0, 1.5],
  },
} as const;
