'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Sphere, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useUIStore } from '@/store/uiStore';

// ── 1. Connected Sensor Network Constellation (City Optical Nodes) ──
function SensorConstellation({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useMemo(() => [
    { pos: new THREE.Vector3(-6, 1.5, -4), color: '#00f0ff' },
    { pos: new THREE.Vector3(-2, 3.2, -7), color: '#00E6B0' },
    { pos: new THREE.Vector3(3.5, 2.0, -5), color: '#8b5cf6' },
    { pos: new THREE.Vector3(7, 3.8, -8), color: '#ec4899' },
    { pos: new THREE.Vector3(-4.5, -1.8, -3), color: '#00E6B0' },
    { pos: new THREE.Vector3(1.2, -0.5, -2), color: '#00f0ff' },
    { pos: new THREE.Vector3(5.8, -1.5, -4), color: '#f43f5e' },
    { pos: new THREE.Vector3(-1.0, 0.8, -1), color: '#00f0ff' },
  ], []);

  const connections = useMemo(() => [
    [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [2, 7], [7, 5], [0, 7], [3, 6], [1, 7],
  ], []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(t * 0.08) * 0.1;
      groupRef.current.rotation.x = Math.cos(t * 0.06) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {connections.map(([fromIdx, toIdx], i) => {
        const from = nodes[fromIdx].pos;
        const to = nodes[toIdx].pos;
        return (
          <Line
            key={`conn-${i}`}
            points={[from, to]}
            color={isDark ? '#00f0ff' : '#0284c7'}
            lineWidth={1}
            transparent
            opacity={isDark ? 0.16 : 0.22}
          />
        );
      })}

      {nodes.map((node, i) => (
        <group key={`node-${i}`} position={node.pos}>
          <Sphere args={[0.12, 12, 12]}>
            <meshBasicMaterial color={node.color} transparent opacity={isDark ? 0.7 : 0.8} />
          </Sphere>
          <Sphere args={[0.26, 12, 12]}>
            <meshBasicMaterial color={node.color} transparent opacity={isDark ? 0.12 : 0.18} />
          </Sphere>
        </group>
      ))}
    </group>
  );
}

// ── 2. High-Speed Vehicle Trajectory Stream Ribbons ──
function VehicleTrajectories({ isDark }: { isDark: boolean }) {
  const curves = useMemo(() => {
    const rawPaths = [
      [
        new THREE.Vector3(-12, -2, -6),
        new THREE.Vector3(-6, 1.5, -4),
        new THREE.Vector3(-1.0, 0.8, -1),
        new THREE.Vector3(3.5, 2.0, -5),
        new THREE.Vector3(12, 1, -8),
      ],
      [
        new THREE.Vector3(-10, 4, -8),
        new THREE.Vector3(-2, 3.2, -7),
        new THREE.Vector3(1.2, -0.5, -2),
        new THREE.Vector3(5.8, -1.5, -4),
        new THREE.Vector3(11, -3, -6),
      ],
      [
        new THREE.Vector3(-8, -4, -5),
        new THREE.Vector3(-4.5, -1.8, -3),
        new THREE.Vector3(-1.0, 0.8, -1),
        new THREE.Vector3(7, 3.8, -8),
        new THREE.Vector3(10, 5, -10),
      ],
    ];

    return rawPaths.map((p) => new THREE.CatmullRomCurve3(p, false, 'catmullrom', 0.5));
  }, []);

  const photonCount = 30;
  const photonsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const photonData = useMemo(() => {
    return Array.from({ length: photonCount }, (_, i) => ({
      curveIndex: i % curves.length,
      progress: Math.random(),
      speed: 0.0012 + Math.random() * 0.0016,
      color: i % 3 === 0 ? new THREE.Color('#00f0ff') : i % 3 === 1 ? new THREE.Color('#00E6B0') : new THREE.Color('#8b5cf6'),
    }));
  }, [curves.length]);

  useFrame(() => {
    if (!photonsRef.current) return;
    photonData.forEach((p, i) => {
      p.progress = (p.progress + p.speed) % 1;
      const point = curves[p.curveIndex].getPointAt(p.progress);
      dummy.position.copy(point);
      dummy.scale.set(0.12, 0.12, 0.12);
      dummy.updateMatrix();
      photonsRef.current?.setMatrixAt(i, dummy.matrix);
      photonsRef.current?.setColorAt(i, p.color);
    });
    photonsRef.current.instanceMatrix.needsUpdate = true;
    if (photonsRef.current.instanceColor) photonsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {curves.map((c, i) => {
        const points = c.getPoints(50);
        return (
          <Line
            key={`curve-${i}`}
            points={points}
            color={i === 0 ? '#00f0ff' : i === 1 ? '#8b5cf6' : '#ec4899'}
            lineWidth={1}
            transparent
            opacity={isDark ? 0.2 : 0.28}
          />
        );
      })}

      <instancedMesh ref={photonsRef} args={[undefined, undefined, photonCount]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial transparent opacity={0.7} />
      </instancedMesh>
    </group>
  );
}

// ── 3. Undulating Digital Topography Grid ──
function DigitalCityTopography({ isDark }: { isDark: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const gridSize = 35;
  const count = gridSize * gridSize;

  const [positions, initialY] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initY = new Float32Array(count);
    let index = 0;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i - gridSize / 2) * 1.1;
        const z = (j - gridSize / 2) * 1.1;
        const y = -3.5 + Math.sin(x * 0.25) * Math.cos(z * 0.25) * 0.5;
        pos[index * 3] = x;
        pos[index * 3 + 1] = y;
        pos[index * 3 + 2] = z;
        initY[index] = y;
        index++;
      }
    }
    return [pos, initY];
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime() * 0.8;
    const posAttr = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      posAttr.setY(i, initialY[i] + Math.sin(x * 0.3 + t) * Math.cos(z * 0.3 + t) * 0.25);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <PointMaterial
        color={isDark ? '#00f0ff' : '#0284c7'}
        size={isDark ? 0.045 : 0.055}
        sizeAttenuation
        transparent
        opacity={isDark ? 0.2 : 0.28}
      />
    </points>
  );
}

// ── 4. Interactive Camera Mouse Parallax Controller ──
function CameraParallax() {
  useFrame(({ camera, pointer }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.5, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.2 + pointer.y * 0.8, 0.03);
    camera.lookAt(0, 0, -4);
  });
  return null;
}

export default function HeroScene() {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme !== 'light';

  return (
    <div className="w-full h-full min-h-screen">
      <Canvas
        camera={{ position: [0, 1.2, 8.5], fov: 48 }}
        dpr={[1, 1.25]}
        gl={{ antialias: true, alpha: true }}
      >
        <CameraParallax />
        <SensorConstellation isDark={isDark} />
        <VehicleTrajectories isDark={isDark} />
        <DigitalCityTopography isDark={isDark} />
      </Canvas>
    </div>
  );
}
