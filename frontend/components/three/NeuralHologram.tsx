'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Torus, Sphere, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function HologramMesh() {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef   = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const coreRef      = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x += delta * 0.4;
      outerRingRef.current.rotation.y += delta * 0.6;
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.y += delta * 0.7;
      midRingRef.current.rotation.z += delta * 0.5;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.x -= delta * 0.5;
      innerRingRef.current.rotation.z += delta * 0.8;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.3;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Torus Ring */}
      <Torus ref={outerRingRef} args={[2.2, 0.03, 16, 64]}>
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.65} wireframe />
      </Torus>

      {/* Middle Gyro Ring */}
      <Torus ref={midRingRef} args={[1.6, 0.03, 16, 64]}>
        <meshBasicMaterial color="#ec4899" transparent opacity={0.7} wireframe />
      </Torus>

      {/* Inner Violet Ring */}
      <Torus ref={innerRingRef} args={[1.1, 0.03, 16, 64]}>
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.75} wireframe />
      </Torus>

      {/* Central Core Pulsing Sphere */}
      <Sphere ref={coreRef} args={[0.45, 16, 16]}>
        <meshBasicMaterial color="#00E6B0" transparent opacity={0.8} wireframe />
      </Sphere>
    </group>
  );
}

export function NeuralHologram() {
  return (
    <div className="w-48 h-48 sm:w-60 sm:h-60 mx-auto relative pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
        <HologramMesh />
      </Canvas>
    </div>
  );
}
