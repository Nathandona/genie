"use client"

import { useRef, useMemo, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"

// Floating geometric shapes representing websites/components being transformed
function FloatingShapes() {
  const shapes = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!shapes.current) return
    
    const time = state.clock.getElapsedTime()
    
    shapes.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      // Floating animation with different speeds for each shape
      mesh.position.y = Math.sin(time * 0.5 + i * 0.5) * 0.3
      mesh.position.x += Math.sin(time * 0.3 + i) * 0.001
      mesh.rotation.x += 0.01
      mesh.rotation.y += 0.01
      mesh.rotation.z += 0.005
    })
  })

  return (
    <group ref={shapes}>
      {/* Cube - representing a website */}
      <mesh position={[-2, 0, -2]} scale={0.5}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Sphere - representing transformation */}
      <mesh position={[2, 0, -1]} scale={0.4}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Torus - representing code structure */}
      <mesh position={[0, 0, -3]} scale={0.3} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[1, 0.3, 16, 100]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.2}
          transparent
          opacity={0.6}
          wireframe
        />
      </mesh>
      
      {/* Octahedron - representing AI/transformation */}
      <mesh position={[-1.5, 1, -1.5]} scale={0.35}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  )
}

// Particle system representing sparkles/AI magic
function Sparkles() {
  const particles = useRef<THREE.Points>(null)
  
  const particleCount = 200
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return positions
  }, [])

  useFrame((state) => {
    if (!particles.current) return
    
    const time = state.clock.getElapsedTime()
    particles.current.rotation.y = time * 0.1
    particles.current.rotation.x = time * 0.05
  })

  return (
    <Points ref={particles} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#3b82f6"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  )
}

// Wireframe grid representing code/web structure
function CodeGrid() {
  const gridRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!gridRef.current) return
    const time = state.clock.getElapsedTime()
    gridRef.current.rotation.y = time * 0.05
  })

  return (
    <group ref={gridRef}>
      <mesh position={[0, -2, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8, 20, 20]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.1}
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>
    </group>
  )
}

// Loading fallback
function SceneFallback() {
  return null
}

// Main scene component
export function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={<SceneFallback />}>
          {/* Ambient light for overall illumination */}
          <ambientLight intensity={0.5} />
          
          {/* Point lights for depth */}
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#3b82f6" />
          <pointLight position={[-5, -5, 5]} intensity={0.3} color="#8b5cf6" />
          
          {/* Scene elements */}
          <FloatingShapes />
          <Sparkles />
          <CodeGrid />
        </Suspense>
      </Canvas>
    </div>
  )
}