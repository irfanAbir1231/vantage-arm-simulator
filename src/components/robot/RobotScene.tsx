// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { CAMERA_TARGET, SceneCamera } from "./SceneCamera";
import { SceneGrid } from "./SceneGrid";
import { SceneLights } from "./SceneLights";
import { StylusMarker } from "./StylusMarker";
import { TestPanel } from "./TestPanel";
import { URDFRobot } from "./URDFRobot";

export function RobotScene() {
  return (
    <div className="h-full min-h-[620px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      <Canvas camera={{ position: [1.65, 1.35, 2.45], fov: 50 }}>
        <color attach="background" args={["#020617"]} />
        <SceneCamera />
        <SceneLights />
        <URDFRobot />
        <TestPanel />
        <StylusMarker />
        <SceneGrid />
        <Grid
          cellColor="#334155"
          cellSize={0.1}
          fadeDistance={3}
          infiniteGrid
          sectionColor="#64748b"
          sectionSize={0.5}
        />
        <OrbitControls
          makeDefault
          target={[CAMERA_TARGET.x, CAMERA_TARGET.y, CAMERA_TARGET.z]}
        />
      </Canvas>
    </div>
  );
}
