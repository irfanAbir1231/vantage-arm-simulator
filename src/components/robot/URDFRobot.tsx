// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { Object3D } from "three";
import URDFLoader from "urdf-loader";

import { useRobotStore } from "@/store/robot-store";

type URDFJoint = Object3D & {
  setJointValue?: (value: number) => void;
};

type LoadedURDFRobot = Object3D & {
  joints?: Record<string, URDFJoint>;
};

type URDFLoaderWithAsync = URDFLoader & {
  loadAsync: (url: string) => Promise<LoadedURDFRobot>;
};

export function URDFRobot() {
  const jointAngles = useRobotStore((state) => state.jointAngles);
  const setRobotLoaded = useRobotStore((state) => state.setRobotLoaded);
  const [robot, setRobot] = useState<LoadedURDFRobot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loggedJointNames = useRef(false);
  const missingJointNames = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    const loader = new URDFLoader() as URDFLoaderWithAsync;

    loader.loadAsync("/robot/arm.urdf")
      .then((loadedRobot) => {
        if (cancelled) {
          return;
        }

        const urdfRobot = loadedRobot as LoadedURDFRobot;
        urdfRobot.rotation.x = -Math.PI / 2;
        urdfRobot.traverse((child) => {
          child.castShadow = true;
          child.receiveShadow = true;
        });

        setRobot(urdfRobot);
        setRobotLoaded(true);
      })
      .catch((loadError: unknown) => {
        if (cancelled) {
          return;
        }

        setRobotLoaded(false);
        setError(loadError instanceof Error ? loadError.message : "URDF load failed.");
      });

    return () => {
      cancelled = true;
      setRobotLoaded(false);
    };
  }, [setRobotLoaded]);

  useEffect(() => {
    if (!robot?.joints) {
      return;
    }

    const joints = robot.joints;

    if (!loggedJointNames.current) {
      loggedJointNames.current = true;
      console.info("Available URDF joints:", Object.keys(joints));
    }

    Object.entries(jointAngles).forEach(([jointName, value]) => {
      const joint = joints[jointName];

      if (!joint) {
        if (!missingJointNames.current.has(jointName)) {
          missingJointNames.current.add(jointName);
          console.warn(`URDF joint not found: ${jointName}`);
        }

        return;
      }

      if (typeof joint.setJointValue === "function") {
        joint.setJointValue(value);
      }
    });
  }, [jointAngles, robot]);

  if (error) {
    return (
      <Html center>
        <div className="rounded-md border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      </Html>
    );
  }

  if (!robot) {
    return (
      <Html center>
        <div className="rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200">
          Loading URDF arm...
        </div>
      </Html>
    );
  }

  return <primitive object={robot} />;
}
