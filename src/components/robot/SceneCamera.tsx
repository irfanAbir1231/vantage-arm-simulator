// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Vector3 } from "three";

export const CAMERA_TARGET = new Vector3(0.35, 0.55, 0);

export function SceneCamera() {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.lookAt(CAMERA_TARGET);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
