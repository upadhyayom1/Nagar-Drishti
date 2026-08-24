'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

const CAMERA_COUNT = 40;
const CONNECTION_DISTANCE = 4.5;

function NetworkNode() {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  // Generate random positions for camera nodes
  const nodes = useMemo(() => {
    const points = [];
    for (let i = 0; i < CAMERA_COUNT; i++) {
      points.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        )
      );
    }
    return points;
  }, []);

  // Generate lines between close nodes
  const lines = useMemo(() => {
    const segments = [];
    for (let i = 0; i < CAMERA_COUNT; i++) {
      for (let j = i + 1; j < CAMERA_COUNT; j++) {
        const distance = nodes[i].distanceTo(nodes[j]);
        if (distance < CONNECTION_DISTANCE) {
          segments.push([nodes[i], nodes[j]]);
        }
      }
    }
    return segments;
  }, [nodes]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Slow continuous rotation
    groupRef.current.rotation.y += 0.001;
    groupRef.current.rotation.x += 0.0005;

    // Mouse parallax (subtle ±5-6 degrees tilt)
    const targetX = (mouse.x * Math.PI) / 30;
    const targetY = (mouse.y * Math.PI) / 30;
    
    groupRef.current.rotation.x += 0.05 * (targetY - groupRef.current.rotation.x);
    groupRef.current.rotation.y += 0.05 * (targetX - groupRef.current.rotation.y);
  });

  return (
    <group ref={groupRef}>
      {/* Render Nodes */}
      {nodes.map((pos, i) => (
        <Sphere key={`node-${i}`} position={pos} args={[0.06, 8, 8]}>
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.8} />
        </Sphere>
      ))}

      {/* Render Connections */}
      {lines.map((line, i) => (
        <Line
          key={`line-${i}`}
          points={line as any}
          color="#0066ff"
          lineWidth={0.5}
          transparent
          opacity={0.15}
        />
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0 bg-[var(--bg-void)]">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <fog attach="fog" args={['#06070a', 8, 20]} />
        <NetworkNode />
      </Canvas>
      {/* Overlay gradient to blend with the page */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-void)]/50 to-[var(--bg-void)] pointer-events-none" />
    </div>
  );
}