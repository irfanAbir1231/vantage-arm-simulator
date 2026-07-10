// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

export function SceneGrid() {
  return (
    <group>
      <mesh position={[0.35, -0.03, 0.02]} receiveShadow>
        <boxGeometry args={[0.85, 0.02, 0.55]} />
        <meshStandardMaterial color="#172033" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.09, 0.03]}>
        <boxGeometry args={[0.2, 0.02, 0.06]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
    </group>
  );
}
