// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

"use client";

import { RoundedBox, Text } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";

import { ROBOT_CONFIG } from "@/lib/robot";
import { useRobotStore } from "@/store/robot-store";

import { fetchKeyConfig, type NormalizedKeyConfig } from "./key-config";
import { baseFrameToScenePosition } from "./scene-coordinates";

const KEY_FOOTPRINT = 0.034;
const KEY_IDLE_HEIGHT = 0.022;
const KEY_PRESSED_HEIGHT = 0.009;
// Visually forgiving compared to the strict PIN tolerance so the pressed
// look reads clearly the moment the stylus tip settles onto the key.
const TOUCH_RADIUS_METERS = ROBOT_CONFIG.keyPressTolerance * 2;

export function TestPanel() {
  const activeKey = useRobotStore((state) => state.activeKey);
  const endEffectorPosition = useRobotStore((state) => state.endEffectorPosition);
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
        const isTargeted = activeKey === key.label;
        const distance = Math.hypot(
          endEffectorPosition.x - key.position.x,
          endEffectorPosition.y - key.position.y,
          endEffectorPosition.z - key.position.z,
        );
        // The keycap only sinks/highlights once the stylus tip has actually
        // arrived, not the instant the PIN sequence starts targeting it.
        const isTouching = distance <= TOUCH_RADIUS_METERS;
        const height = isTouching ? KEY_PRESSED_HEIGHT : KEY_IDLE_HEIGHT;
        const capColor = isTouching ? "#fbbf24" : "#eef2f8";
        const capEmissive = isTouching ? "#7c2d12" : "#1e293b";
        const collarColor = isTouching ? "#78350f" : isTargeted ? "#2d4d70" : "#16324f";
        const textColor = isTouching ? "#1c1207" : "#0f172a";

        return (
          <group
            key={key.label}
            position={baseFrameToScenePosition(key.position)}
          >
            {/* recessed collar the keycap sinks into when pressed */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0015, 0]}>
              <ringGeometry args={[0.023, 0.031, 32]} />
              <meshBasicMaterial color={collarColor} />
            </mesh>
            <RoundedBox
              args={[KEY_FOOTPRINT, height, KEY_FOOTPRINT]}
              castShadow
              position={[0, height / 2, 0]}
              radius={0.004}
              receiveShadow
              smoothness={4}
            >
              <meshStandardMaterial
                color={capColor}
                emissive={capEmissive}
                emissiveIntensity={isTouching ? 0.6 : 0.15}
                metalness={0.1}
                roughness={isTouching ? 0.35 : 0.5}
              />
            </RoundedBox>
            <Text
              color={textColor}
              fontSize={0.021}
              fontWeight={700}
              position={[0, height + 0.0015, 0]}
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
