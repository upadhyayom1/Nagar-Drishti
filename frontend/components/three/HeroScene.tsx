'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

const CAMERA_COUNT = 50;
const CONNECTION_DISTANCE = 5.2;

const COLOR_CYAN   = '#00e5ff';
const COLOR_AZURE  = '#38bdf8';
const COLOR_COBALT = '#6366f1';
const COLOR_VOID   = '#030712';
type LineSegment = [THREE.Vector3, THREE.Vector3];

function deterministicValue(index: number, offset: number): number {
  const value = Math.sin(index * 12.9898 + offset * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function NetworkNode() {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  // Generate 3D coordinates for camera nodes
  const nodes = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < CAMERA_COUNT; i += 1) {
      points.push(
        new THREE.Vector3(
          (deterministicValue(i, 1) - 0.5) * 18,
          (deterministicValue(i, 2) - 0.5) * 18,
          (deterministicValue(i, 3) - 0.5) * 12
        )
      );
    }
    return points;
  }, []);

  // Compute optical neural connection vectors
  const lines = useMemo(() => {
    const segments: LineSegment[] = [];
    for (let i = 0; i < CAMERA_COUNT; i += 1) {
      for (let j = i + 1; j < CAMERA_COUNT; j++) {
        const distance = nodes[i].distanceTo(nodes[j]);
        if (distance < CONNECTION_DISTANCE) {
          segments.push([nodes[i], nodes[j]]);
        }
      }
    }
    return segments;
  }, [nodes]);

  // Active Cyan Laser Pulses
  const [pulses, setPulses] = useState<{ line: LineSegment; progress: number; speed: number; id: number }[]>([]);
  const pulseId = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Smooth continuous orbital drift
    groupRef.current.rotation.y += delta * 0.05;
    groupRef.current.rotation.x += delta * 0.02;

    // Mouse parallax tilt
    const targetX = (mouse.x * Math.PI) / 28;
    const targetY = (mouse.y * Math.PI) / 28;
    
    groupRef.current.rotation.x += 0.04 * (targetY - groupRef.current.rotation.x);
    groupRef.current.rotation.y += 0.04 * (targetX - groupRef.current.rotation.y);

    // Spawn pulses
    if (Math.random() < 0.02 && pulses.length < 6 && lines.length > 0) {
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      setPulses(p => [...p, { line: randomLine, progress: 0, speed: 0.5 + Math.random() * 0.5, id: pulseId.current++ }]);
    }

    // Update pulses
    if (pulses.length > 0) {
      setPulses(p => p.map(pulse => ({ ...pulse, progress: pulse.progress + delta * pulse.speed }))
                     .filter(pulse => pulse.progress < 1));
    }
  });

  return (
    <group ref={groupRef}>
      {/* 3D Neural Nodes in Electric Cyan & Azure */}
      {nodes.map((pos, i) => (
        <Sphere key={`node-${i}`} position={pos} args={[i % 4 === 0 ? 0.06 : 0.04, 8, 8]}>
          <meshBasicMaterial 
            color={i % 3 === 0 ? COLOR_CYAN : i % 2 === 0 ? COLOR_AZURE : COLOR_COBALT} 
            transparent 
            opacity={0.75} 
          />
        </Sphere>
      ))}

      {/* Optical Synapse Connections */}
      {lines.map((line, i) => (
        <Line
          key={`line-${i}`}
          points={line}
          color={COLOR_AZURE}
          lineWidth={0.6}
          transparent
          opacity={0.16}
        />
      ))}

      {/* Traveling Laser Pulses */}
      {pulses.map(pulse => {
        const start = pulse.line[0];
        const end = pulse.line[1];
        const pos = new THREE.Vector3().lerpVectors(start, end, pulse.progress);
        return (
          <Sphere key={`pulse-${pulse.id}`} position={pos} args={[0.08, 8, 8]}>
            <meshBasicMaterial color="#ffffff" transparent opacity={1 - Math.abs(pulse.progress - 0.5) * 2} />
          </Sphere>
        );
      })}
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0 bg-[#030712]">
      <Canvas camera={{ position: [0, 0, 14], fov: 55 }}>
        <fog attach="fog" args={[COLOR_VOID, 10, 24]} />
        <NetworkNode />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030712]/60 to-[#030712] pointer-events-none" />
    </div>
  );
}
