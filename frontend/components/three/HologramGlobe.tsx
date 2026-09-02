'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Torus, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function GlobeMesh() {
  const globeRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);

  const nodePositions = useMemo(() => {
    const count = 40;
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      coords[i * 3] = 1.8 * Math.cos(theta) * Math.sin(phi);
      coords[i * 3 + 1] = 1.8 * Math.sin(theta) * Math.sin(phi);
      coords[i * 3 + 2] = 1.8 * Math.cos(phi);
    }
    return coords;
  }, []);

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.25;
      globeRef.current.rotation.x += delta * 0.08;
    }
    if (orbitRef.current) {
      orbitRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <group ref={globeRef}>
        {/* Wireframe Holographic Globe */}
        <Sphere args={[1.8, 24, 24]}>
          <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.25} />
        </Sphere>

        {/* Optical Sensor Beacons on Globe */}
        <Points positions={nodePositions} stride={3}>
          <PointMaterial color="#d55b38" size={0.12} sizeAttenuation transparent opacity={0.9} />
        </Points>
      </group>

      {/* Orbiting Satellite Ring */}
      <group ref={orbitRef} rotation={[Math.PI / 4, 0, 0]}>
        <Torus args={[2.5, 0.02, 16, 64]}>
          <meshBasicMaterial color="#00E6B0" transparent opacity={0.5} wireframe />
        </Torus>
      </group>
    </group>
  );
}

export function HologramGlobe() {
  return (
    <div className="w-52 h-52 sm:w-64 sm:h-64 mx-auto relative pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <GlobeMesh />
      </Canvas>
    </div>
  );
}
