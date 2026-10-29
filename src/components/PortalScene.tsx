// Interactive 3D map of the portal's layers (React Three Fiber).
// Loaded lazily from the Explore page; the page provides a 2D fallback.
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Line } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { layers } from '../lib/ecosystem'

export interface SceneControls {
  explode: { value: number }
  intro: { value: number }
}

const GAP_ASSEMBLED = 0.34
const GAP_EXPLODED = 1.05

const anchor = new THREE.Vector3()

function Slab({ i, sel, onSelect, controls, dark, accent, label }: { i: number; sel: string | null; onSelect: (id: string) => void; controls: MutableRefObject<SceneControls>; dark: boolean; accent: string; label: MutableRefObject<(HTMLSpanElement | null)[]> }) {
  const L = layers[i]
  const ref = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const [hover, setHover] = useState(false)
  const isSel = sel === L.id
  const dim = sel !== null && !isSel
  const base = useMemo(() => new THREE.Color(dark ? L.dark : L.light), [dark, L])
  const glow = useMemo(() => new THREE.Color(accent), [accent])
  useFrame(({ camera, size }, dt) => {
    if (!ref.current || !mat.current) return
    // Project the label anchor to screen space and move the DOM label (no extra React roots).
    const el = label.current[i]
    if (el) {
      anchor.set(2.35, 0.05, 1.45)
      ref.current.localToWorld(anchor)
      anchor.project(camera)
      el.style.transform = `translate(${((anchor.x + 1) / 2) * size.width}px, ${((1 - anchor.y) / 2) * size.height}px)`
      el.style.opacity = String(controls.current.intro.value > 0.6 ? 1 : 0)
    }
    const e = controls.current.explode.value
    const centre = (layers.length - 1) / 2
    const y = (i - centre) * THREE.MathUtils.lerp(GAP_ASSEMBLED, GAP_EXPLODED, e)
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, y, 8, dt)
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, isSel ? 0.35 : 0, 6, dt)
    mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, dim ? 0.35 : 0.95, 6, dt)
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, isSel ? 0.55 : hover ? 0.22 : 0, 8, dt)
  })
  return (
    <group ref={ref}>
      <RoundedBox
        args={[4.6, 0.24, 3]}
        radius={0.1}
        smoothness={3}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(L.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <meshStandardMaterial ref={mat} color={base} emissive={glow} emissiveIntensity={0} transparent opacity={0.95} roughness={0.55} metalness={0.05} />
      </RoundedBox>
    </group>
  )
}

function Connectors({ controls, color }: { controls: MutableRefObject<SceneControls>; color: string }) {
  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!group.current) return
    const e = controls.current.explode.value
    group.current.scale.y = THREE.MathUtils.lerp(GAP_ASSEMBLED, GAP_EXPLODED, e) / GAP_EXPLODED
    group.current.children.forEach((c) => {
      const m = (c as THREE.Line).material as THREE.LineBasicMaterial
      if (m) m.opacity = Math.max(0, (e - 0.25) / 0.75) * 0.8
    })
  })
  const h = ((layers.length - 1) / 2) * GAP_EXPLODED
  return (
    <group ref={group}>
      {[-1.9, 1.9].map((x) => (
        <Line key={x} points={[[x, -h, -1.2], [x, h, -1.2]]} color={color} lineWidth={1.5} dashed dashSize={0.12} gapSize={0.1} transparent opacity={0} />
      ))}
    </group>
  )
}

/** Camera: push-in from behind the cover panel, then a gradual damped settle; focus moves to the selected layer. */
function Rig({ controls, sel, rotY }: { controls: MutableRefObject<SceneControls>; sel: string | null; rotY: MutableRefObject<number> }) {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3())
  const narrow = size.width < 640
  useFrame((state, dt) => {
    const t = controls.current.intro.value
    const e = controls.current.explode.value
    const i = sel ? layers.findIndex((l) => l.id === sel) : -1
    const centre = (layers.length - 1) / 2
    const focusY = i >= 0 ? (i - centre) * THREE.MathUtils.lerp(GAP_ASSEMBLED, GAP_EXPLODED, e) : 0
    const restZ = (narrow ? 15.5 : 11.5) + e * 2.5 - (i >= 0 ? 2.2 : 0)
    const start = new THREE.Vector3(0, 7, 22)
    const rest = new THREE.Vector3(narrow ? 0 : -1.2, 4.2 + focusY * 0.6, restZ)
    const want = start.lerp(rest, t)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, want.x, 3, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, want.y, 3, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, want.z, 3, dt)
    look.current.y = THREE.MathUtils.damp(look.current.y, focusY * 0.85, 4, dt)
    camera.lookAt(look.current)
    const g = state.scene.getObjectByName('stack')
    if (g) g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.5 + rotY.current, 6, dt)
  })
  return null
}

/** The "foreground object" the opening reveals the map from behind. */
function Cover({ controls, accent }: { controls: MutableRefObject<SceneControls>; accent: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = controls.current.intro.value
    ref.current.position.y = THREE.MathUtils.lerp(1.2, -9, Math.min(1, t * 1.6))
    ;(ref.current.material as THREE.MeshStandardMaterial).opacity = 1 - Math.min(1, t * 1.4)
    ref.current.visible = t < 0.95
  })
  return (
    <mesh ref={ref} position={[0, 1.2, 6]}>
      <planeGeometry args={[14, 9]} />
      <meshStandardMaterial color={accent} transparent />
    </mesh>
  )
}

export default function PortalScene({ sel, onSelect, controls, dark, accent, onFail, active }: { sel: string | null; onSelect: (id: string | null) => void; controls: MutableRefObject<SceneControls>; dark: boolean; accent: string; onFail: () => void; active: boolean }) {
  const rotY = useRef(0)
  const labels = useRef<(HTMLSpanElement | null)[]>([])
  const drag = useRef<{ x: number; base: number } | null>(null)
  useEffect(() => {
    const tw = gsap.to(controls.current.intro, { value: 1, duration: 2.2, ease: 'power3.inOut', delay: 0.15 })
    return () => {
      tw.kill()
    }
  }, [controls])
  return (
    <div
      className="scene-wrap"
      onPointerDown={(e) => (drag.current = { x: e.clientX, base: rotY.current })}
      onPointerMove={(e) => {
        if (!drag.current) return
        rotY.current = THREE.MathUtils.clamp(drag.current.base + (e.clientX - drag.current.x) / 260, -0.9, 0.9)
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
    >
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ position: [0, 7, 22], fov: 32 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (ev) => {
            ev.preventDefault()
            onFail()
          })
        }}
        onPointerMissed={() => onSelect(null)}
      >
        <ambientLight intensity={dark ? 0.55 : 0.9} />
        <directionalLight position={[5, 9, 6]} intensity={dark ? 1.1 : 1.4} />
        <directionalLight position={[-6, 3, -4]} intensity={0.35} />
        <group name="stack" rotation={[0, -0.5, 0]}>
          {layers.map((_, i) => (
            <Slab key={i} i={i} sel={sel} onSelect={onSelect} controls={controls} dark={dark} accent={accent} label={labels} />
          ))}
          <Connectors controls={controls} color={accent} />
        </group>
        <Cover controls={controls} accent={accent} />
        <Rig controls={controls} sel={sel} rotY={rotY} />
      </Canvas>
      <div className="scene-labels" aria-hidden>
        {layers.map((l, i) => (
          <span key={l.id} ref={(el) => void (labels.current[i] = el)} className={`scene-label ${sel === l.id ? 'is-sel' : ''}`}>
            {l.name}
          </span>
        ))}
      </div>
    </div>
  )
}
