import { Canvas } from '@react-three/fiber'
import { Sky, KeyboardControls, OrbitControls, Environment } from '@react-three/drei'
import type { KeyboardControlsEntry } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Player } from './game/Player'
import { Enemy } from './game/Enemy'
import { HUD } from './components/HUD'
import { useMemo, Suspense } from 'react'
import { ProjectileSystem } from './game/ProjectileSystem'
import { Arena } from './game/Arena'

const Controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  jump: 'jump',
  action1: 'action1',
  action2: 'action2',
  action3: 'action3',
  action4: 'action4',
  action5: 'action5',
} as const;

function App() {
  const map = useMemo<KeyboardControlsEntry<keyof typeof Controls>[]>(() => [
    { name: Controls.forward, keys: ['ArrowUp', 'w', 'W'] },
    { name: Controls.backward, keys: ['ArrowDown', 's', 'S'] },
    { name: Controls.left, keys: ['ArrowLeft', 'a', 'A'] },
    { name: Controls.right, keys: ['ArrowRight', 'd', 'D'] },
    { name: Controls.jump, keys: ['Space'] },
    { name: Controls.action1, keys: ['1'] },
    { name: Controls.action2, keys: ['2'] },
    { name: Controls.action3, keys: ['3'] },
    { name: Controls.action4, keys: ['4'] },
    { name: Controls.action5, keys: ['5'] },
  ], [])

  return (
    <KeyboardControls map={map}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <HUD />
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
          <Suspense fallback={null}>
            <Environment preset="sunset" />
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} castShadow />

            <Physics gravity={[0, -9.81, 0]}>
              <Arena />

              {/* Player */}
              <Player />

              {/* Enemy */}
              <Enemy position={[5, 1, 5]} id="enemy1" />

              {/* Projectiles */}
              <ProjectileSystem />
            </Physics>

            <OrbitControls makeDefault />
          </Suspense>
        </Canvas>
      </div>
    </KeyboardControls>
  )
}

export default App
