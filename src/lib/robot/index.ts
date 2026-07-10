// OWNER: Member 2 - Motion Engine, IK, Safety, Shared Store
// Do not edit without coordinating with the owner.

export { ROBOT_CONFIG } from "./config";
export { describeMotionCommand } from "./commands";
export {
  cancelMotion,
  executeMotionCommand,
  resetCancellation,
  resetMotionCancellation,
} from "./controller";
export { cloneVector } from "./coordinates";
export { estimateEndEffectorPosition } from "./forward-kinematics";
export {
  computeForwardKinematics,
  INITIAL_JOINT_ANGLES,
  isKinematicsReady,
  solveInverseKinematics,
} from "./kinematics";
export {
  isWithinTolerance,
  isWithinWorkspace,
  validateJointAngles,
  validateMotionCommand,
  validateWorkspace,
} from "./safety";
export {
  createJointTrajectory,
  getTrajectoryStepDuration,
  interpolateValue,
  lerp,
} from "./trajectory";
export type {
  JointAngles,
  JointName,
  JointState,
  MotionCommand,
  MotionFailureReason,
  MotionResult,
  MotionSource,
  MotionStatus,
  RobotMotionStatus,
  Vector3Value,
} from "./types";
