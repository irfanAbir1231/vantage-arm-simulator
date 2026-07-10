// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

import { useRobotStore } from "@/store/robot-store";

import { baseFrameToScenePosition } from "./scene-coordinates";

export function StylusMarker() {
  const endEffectorPosition = useRobotStore((state) => state.endEffectorPosition);
  const targetPosition = useRobotStore((state) => state.targetPosition);
  const status = useRobotStore((state) => state.status);
  const currentPosition = baseFrameToScenePosition(endEffectorPosition);
  const targetScenePosition = baseFrameToScenePosition(targetPosition);
  const targetColor = {
    idle: "#38bdf8",
    validating: "#22d3ee",
    moving: "#facc15",
    success: "#22c55e",
    error: "#f87171",
    cancelled: "#94a3b8",
  }[status];
  const hasDistinctTarget = useMemo(
    () => currentPosition.some((value, index) => Math.abs(value - targetScenePosition[index]) > 0.001),
    [currentPosition, targetScenePosition],
  );

  return (
    <>
      <mesh
        position={currentPosition}
      >
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshStandardMaterial color="#f97316" emissive="#7c2d12" />
      </mesh>
      {hasDistinctTarget ? (
        <Line
          color={targetColor}
          lineWidth={1.5}
          points={[currentPosition, targetScenePosition]}
        />
      ) : null}
      <mesh
        position={targetScenePosition}
      >
        <sphereGeometry args={[0.014, 16, 16]} />
        <meshStandardMaterial color={targetColor} emissive={targetColor} wireframe />
      </mesh>
    </>
  );
}
