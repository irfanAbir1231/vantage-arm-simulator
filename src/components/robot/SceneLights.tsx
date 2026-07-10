// OWNER: Member 1 - Visualization and Dashboard
// Do not edit without coordinating with the owner.

export function SceneLights() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight castShadow intensity={2} position={[3, 5, 2]} />
      <pointLight intensity={0.7} position={[-2, 2, -1]} />
    </>
  );
}
