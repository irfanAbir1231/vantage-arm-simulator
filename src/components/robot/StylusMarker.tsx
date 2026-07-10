// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useRobotStore } from "@/store/robot-store";

import { baseFrameToScenePosition } from "./scene-coordinates";

export function StylusMarker() {
  const endEffectorPosition = useRobotStore((state) => state.endEffectorPosition);
  const targetPosition = useRobotStore((state) => state.targetPosition);

  return (
    <>
      <mesh
        position={baseFrameToScenePosition(endEffectorPosition)}
      >
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial color="#f97316" emissive="#7c2d12" />
      </mesh>
      <mesh
        position={baseFrameToScenePosition(targetPosition)}
      >
        <sphereGeometry args={[0.014, 16, 16]} />
        <meshStandardMaterial color="#22c55e" emissive="#14532d" wireframe />
      </mesh>
    </>
  );
}
