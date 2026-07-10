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
  const panel = useMemo(() => {
    const positions = keys.map((key) => baseFrameToScenePosition(key.position));

    if (positions.length === 0) {
      return null;
    }

    const xValues = positions.map(([x]) => x);
    const yValues = positions.map(([, y]) => y);
    const zValues = positions.map(([, , z]) => z);
    const centerX = (Math.min(...xValues) + Math.max(...xValues)) / 2;
    const centerZ = (Math.min(...zValues) + Math.max(...zValues)) / 2;

    return {
      depth: Math.max(...zValues) - Math.min(...zValues) + 0.075,
      position: [centerX, Math.min(...yValues) - 0.006, centerZ] as [number, number, number],
      width: Math.max(...xValues) - Math.min(...xValues) + 0.075,
    };
  }, [keys]);

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
      {panel ? (
        <mesh castShadow receiveShadow position={panel.position}>
          <boxGeometry args={[panel.width, 0.012, panel.depth]} />
          <meshStandardMaterial color="#0f2942" metalness={0.2} roughness={0.65} />
        </mesh>
      ) : null}
      {keys.map((key) => {
        const isActive = activeKey === key.label;
        const color = isActive ? "#facc15" : "#38bdf8";
        const height = isActive ? 0.03 : 0.02;

        return (
          <group
            key={key.label}
            position={baseFrameToScenePosition(key.position)}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
              <ringGeometry args={[0.024, 0.03, 24]} />
              <meshBasicMaterial color={isActive ? "#fde68a" : "#1e3a5f"} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
              <boxGeometry args={[0.036, height, 0.036]} />
              <meshStandardMaterial
                color={color}
                emissive={isActive ? "#713f12" : "#082f49"}
                roughness={0.45}
              />
            </mesh>
            <Text
              color="#e0f2fe"
              fontSize={0.024}
              position={[0, height + 0.014, 0]}
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
