// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

import {
  JOINT_NAMES,
  type JointAngles,
  type JointName,
  type Vector3Value,
} from "./types";

type JointDefinition = {
  name: JointName;
  origin: Vector3Value;
  axis: Vector3Value;
  lower: number;
  upper: number;
};

type Matrix3 = [[number, number, number], [number, number, number], [number, number, number]];

export const JOINT_DEFINITIONS: readonly JointDefinition[] = [
  {
    name: "joint_1",
    origin: { x: 0, y: 0, z: 0.06 },
    axis: { x: 0, y: 0, z: 1 },
    lower: -3.1416,
    upper: 3.1416,
  },
  {
    name: "joint_2",
    origin: { x: 0, y: 0, z: 0.25 },
    axis: { x: 0, y: 1, z: 0 },
    lower: -2.0944,
    upper: 2.0944,
  },
  {
    name: "joint_3",
    origin: { x: 0, y: 0, z: 0.25 },
    axis: { x: 0, y: 1, z: 0 },
    lower: -2.618,
    upper: 2.618,
  },
  {
    name: "joint_4",
    origin: { x: 0, y: 0, z: 0.25 },
    axis: { x: 0, y: 0, z: 1 },
    lower: -3.1416,
    upper: 3.1416,
  },
  {
    name: "joint_5",
    origin: { x: 0, y: 0, z: 0.15 },
    axis: { x: 0, y: 1, z: 0 },
    lower: -2.0944,
    upper: 2.0944,
  },
  {
    name: "joint_6",
    origin: { x: 0, y: 0, z: 0.25 },
    axis: { x: 0, y: 0, z: 1 },
    lower: -3.1416,
    upper: 3.1416,
  },
  {
    name: "stylus_pitch",
    origin: { x: 0, y: 0, z: 0.15 },
    axis: { x: 0, y: 1, z: 0 },
    lower: -2.0944,
    upper: 2.0944,
  },
] as const;

export const STYLUS_TIP_OFFSET: Vector3Value = { x: 0, y: 0, z: 0.137 };
export const IK_TOLERANCE_METERS = 0.001;
export const PIN_TOLERANCE_METERS = 0.005;

const IK_ACTIVE_JOINTS: readonly JointName[] = [
  "joint_1",
  "joint_2",
  "joint_3",
  "joint_5",
  "stylus_pitch",
];

const IDENTITY_MATRIX: Matrix3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

export const INITIAL_JOINT_ANGLES: JointAngles = {
  joint_1: 0,
  joint_2: 0,
  joint_3: 0,
  joint_4: 0,
  joint_5: 0,
  joint_6: 0,
  stylus_pitch: 0,
};

export type IkSolution = {
  jointAngles: JointAngles;
  position: Vector3Value;
  error: number;
};

export function computeForwardKinematics(jointAngles: JointAngles): Vector3Value {
  let position: Vector3Value = { x: 0, y: 0, z: 0 };
  let rotation: Matrix3 = IDENTITY_MATRIX;

  for (const joint of JOINT_DEFINITIONS) {
    position = addVectors(position, multiplyMatrixVector(rotation, joint.origin));
    rotation = multiplyMatrices(rotation, rotationAroundAxis(joint.axis, jointAngles[joint.name]));
  }

  return addVectors(position, multiplyMatrixVector(rotation, STYLUS_TIP_OFFSET));
}

export function solveInverseKinematics(
  target: Vector3Value,
  currentJointAngles: JointAngles,
): IkSolution | null {
  const seeds = [cloneJointAngles(currentJointAngles), createDescentSeed(target)];
  let closestSolution: IkSolution | null = null;

  for (const seed of seeds) {
    const solution = runDampedLeastSquares(target, seed);
    if (solution && (!closestSolution || solution.error < closestSolution.error)) {
      closestSolution = solution;
    }
  }

  return closestSolution && closestSolution.error <= IK_TOLERANCE_METERS
    ? closestSolution
    : null;
}

export function getJointDefinition(jointName: JointName): JointDefinition {
  const joint = JOINT_DEFINITIONS.find((definition) => definition.name === jointName);
  if (!joint) {
    throw new Error(`Missing joint definition for ${jointName}`);
  }

  return joint;
}

export function cloneJointAngles(jointAngles: JointAngles): JointAngles {
  return { ...jointAngles };
}

function runDampedLeastSquares(target: Vector3Value, seed: JointAngles): IkSolution | null {
  const angles = cloneJointAngles(seed);
  const damping = 0.01;
  const finiteDifference = 0.0001;

  for (let iteration = 0; iteration < 180; iteration += 1) {
    const position = computeForwardKinematics(angles);
    const errorVector = subtractVectors(target, position);
    const error = vectorLength(errorVector);

    if (error <= IK_TOLERANCE_METERS) {
      return { jointAngles: angles, position, error };
    }

    const jacobian = calculatePositionJacobian(angles, position, finiteDifference);
    const delta = calculateDampedLeastSquaresDelta(jacobian, errorVector, damping);
    if (!delta) {
      return null;
    }

    IK_ACTIVE_JOINTS.forEach((jointName, index) => {
      const joint = getJointDefinition(jointName);
      const nextAngle = angles[jointName] + delta[index] * 0.55;
      angles[jointName] = clamp(nextAngle, joint.lower, joint.upper);
    });

    if (!areJointAnglesFinite(angles)) {
      return null;
    }
  }

  const position = computeForwardKinematics(angles);
  return {
    jointAngles: angles,
    position,
    error: distanceBetween(position, target),
  };
}

function calculatePositionJacobian(
  jointAngles: JointAngles,
  position: Vector3Value,
  finiteDifference: number,
): number[][] {
  return [0, 1, 2].map((axisIndex) =>
    IK_ACTIVE_JOINTS.map((jointName) => {
      const perturbed = cloneJointAngles(jointAngles);
      perturbed[jointName] += finiteDifference;
      const perturbedPosition = computeForwardKinematics(perturbed);
      return (getAxisValue(perturbedPosition, axisIndex) - getAxisValue(position, axisIndex)) /
        finiteDifference;
    }),
  );
}

function calculateDampedLeastSquaresDelta(
  jacobian: number[][],
  error: Vector3Value,
  damping: number,
): number[] | null {
  const jjTranspose = multiplyMatrices3By3(jacobian, transpose(jacobian));
  const regularized: number[][] = jjTranspose.map((row, rowIndex) =>
    row.map((value, columnIndex) =>
      rowIndex === columnIndex ? value + damping * damping : value,
    ),
  );
  const solvedError = solveLinearSystem3(regularized, [error.x, error.y, error.z]);
  if (!solvedError) {
    return null;
  }

  return transpose(jacobian).map((row) =>
    row.reduce((sum, value, index) => sum + value * solvedError[index], 0),
  );
}

// Upper-arm / forearm link lengths (joint_2->joint_3, joint_3->joint_5) and the
// rigid wrist-to-tip length (joint_5->stylus_pitch->tip), taken from JOINT_DEFINITIONS
// and STYLUS_TIP_OFFSET. Used to seed the numeric solver with a pose where the
// wrist sits above the target and the tool points straight down, so the solver
// converges on an approach-from-above configuration instead of swinging the
// forearm under the base to reach the same point from below.
const SHOULDER_TO_ELBOW_LENGTH = 0.25;
const ELBOW_TO_WRIST_LENGTH = 0.4;
const WRIST_TO_TIP_LENGTH = 0.4 + STYLUS_TIP_OFFSET.z;
const SHOULDER_PIVOT_HEIGHT = 0.06 + 0.25;

function createDescentSeed(target: Vector3Value): JointAngles {
  const joint1 = Math.atan2(target.y, target.x);
  const reach = Math.sqrt(target.x ** 2 + target.y ** 2);
  const wristHeight = target.z + WRIST_TO_TIP_LENGTH;

  const horizontal = reach;
  const vertical = wristHeight - SHOULDER_PIVOT_HEIGHT;
  const maxReach = SHOULDER_TO_ELBOW_LENGTH + ELBOW_TO_WRIST_LENGTH - 1e-6;
  const minReach = Math.abs(SHOULDER_TO_ELBOW_LENGTH - ELBOW_TO_WRIST_LENGTH) + 1e-6;
  const distance = clamp(Math.sqrt(horizontal ** 2 + vertical ** 2), minReach, maxReach);

  const cosElbow =
    (distance ** 2 - SHOULDER_TO_ELBOW_LENGTH ** 2 - ELBOW_TO_WRIST_LENGTH ** 2) /
    (2 * SHOULDER_TO_ELBOW_LENGTH * ELBOW_TO_WRIST_LENGTH);
  const elbowAngle = Math.acos(clamp(cosElbow, -1, 1));

  const baseAngle = Math.atan2(horizontal, vertical);
  const cosShoulderOffset =
    (SHOULDER_TO_ELBOW_LENGTH ** 2 + distance ** 2 - ELBOW_TO_WRIST_LENGTH ** 2) /
    (2 * SHOULDER_TO_ELBOW_LENGTH * distance);
  const shoulderOffset = Math.acos(clamp(cosShoulderOffset, -1, 1));

  const shoulderAngle = baseAngle - shoulderOffset;
  const cumulativeAngle = shoulderAngle + elbowAngle;
  const wristAngle = Math.PI - cumulativeAngle;

  return {
    ...INITIAL_JOINT_ANGLES,
    joint_1: joint1,
    joint_2: shoulderAngle,
    joint_3: elbowAngle,
    joint_5: wristAngle,
    stylus_pitch: 0,
  };
}

function rotationAroundAxis(axis: Vector3Value, angle: number): Matrix3 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const complement = 1 - cosine;
  const { x, y, z } = axis;

  return [
    [cosine + x * x * complement, x * y * complement - z * sine, x * z * complement + y * sine],
    [y * x * complement + z * sine, cosine + y * y * complement, y * z * complement - x * sine],
    [z * x * complement - y * sine, z * y * complement + x * sine, cosine + z * z * complement],
  ];
}

function multiplyMatrices(left: Matrix3, right: Matrix3): Matrix3 {
  return [0, 1, 2].map((row) =>
    [0, 1, 2].map((column) =>
      [0, 1, 2].reduce((sum, index) => sum + left[row][index] * right[index][column], 0),
    ),
  ) as Matrix3;
}

function multiplyMatrixVector(matrix: Matrix3, vector: Vector3Value): Vector3Value {
  return {
    x: matrix[0][0] * vector.x + matrix[0][1] * vector.y + matrix[0][2] * vector.z,
    y: matrix[1][0] * vector.x + matrix[1][1] * vector.y + matrix[1][2] * vector.z,
    z: matrix[2][0] * vector.x + matrix[2][1] * vector.y + matrix[2][2] * vector.z,
  };
}

function multiplyMatrices3By3(left: number[][], right: number[][]): number[][] {
  return [0, 1, 2].map((row) =>
    [0, 1, 2].map((column) =>
      left[row].reduce((sum, value, index) => sum + value * right[index][column], 0),
    ),
  );
}

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, columnIndex) => matrix.map((row) => row[columnIndex]));
}

function solveLinearSystem3(matrix: number[][], values: number[]): number[] | null {
  const augmented = matrix.map((row, index) => [...row, values[index]]);

  for (let pivotColumn = 0; pivotColumn < 3; pivotColumn += 1) {
    let pivotRow = pivotColumn;
    for (let row = pivotColumn + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][pivotColumn]) > Math.abs(augmented[pivotRow][pivotColumn])) {
        pivotRow = row;
      }
    }

    if (Math.abs(augmented[pivotRow][pivotColumn]) < 1e-10) {
      return null;
    }

    [augmented[pivotColumn], augmented[pivotRow]] = [
      augmented[pivotRow],
      augmented[pivotColumn],
    ];

    const pivot = augmented[pivotColumn][pivotColumn];
    for (let column = pivotColumn; column < 4; column += 1) {
      augmented[pivotColumn][column] /= pivot;
    }

    for (let row = 0; row < 3; row += 1) {
      if (row === pivotColumn) {
        continue;
      }

      const factor = augmented[row][pivotColumn];
      for (let column = pivotColumn; column < 4; column += 1) {
        augmented[row][column] -= factor * augmented[pivotColumn][column];
      }
    }
  }

  return augmented.map((row) => row[3]);
}

function addVectors(left: Vector3Value, right: Vector3Value): Vector3Value {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z };
}

function subtractVectors(left: Vector3Value, right: Vector3Value): Vector3Value {
  return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
}

function vectorLength(vector: Vector3Value): number {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
}

function distanceBetween(left: Vector3Value, right: Vector3Value): number {
  return vectorLength(subtractVectors(left, right));
}

function getAxisValue(vector: Vector3Value, axisIndex: number): number {
  return axisIndex === 0 ? vector.x : axisIndex === 1 ? vector.y : vector.z;
}

function clamp(value: number, lower: number, upper: number): number {
  return Math.min(Math.max(value, lower), upper);
}

function areJointAnglesFinite(jointAngles: JointAngles): boolean {
  return JOINT_NAMES.every((jointName) => Number.isFinite(jointAngles[jointName]));
}

export function isKinematicsReady(): boolean {
  return true;
}
