// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { Text } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";

import { useRobotStore } from "@/store/robot-store";

import { fetchKeyConfig, type NormalizedKeyConfig } from "./key-config";
import { baseFrameToScenePosition } from "./scene-coordinates";

export function TestPanel() {
  const activeKey = useRobotStore((state) => state.activeKey);
  const [config, setConfig] = useState<NormalizedKeyConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchKeyConfig()
      .then((loadedConfig) => {
        if (!cancelled) {
          setConfig(loadedConfig);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Key configuration failed to load.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const keys = useMemo(() => config?.keys ?? [], [config]);

  if (error) {
    return (
      <group position={[0.55, 0, 0.05]}>
        <Text color="#fecaca" fontSize={0.025} rotation={[-Math.PI / 2, 0, 0]}>
          {error}
        </Text>
      </group>
    );
  }

  return (
    <group>
      {keys.map((key) => {
        const isActive = activeKey === key.label;
        const color = isActive ? "#facc15" : "#38bdf8";
        const height = isActive ? 0.026 : 0.018;

        return (
          <group
            key={key.label}
            position={baseFrameToScenePosition(key.position)}
          >
            <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
              <boxGeometry args={[0.045, height, 0.045]} />
              <meshStandardMaterial color={color} emissive={isActive ? "#713f12" : "#082f49"} />
            </mesh>
            <Text
              color="#e0f2fe"
              fontSize={0.022}
              position={[0, height + 0.01, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              {key.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
