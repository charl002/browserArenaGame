import { Canvas } from '@react-three/fiber'
import { Sky, KeyboardControls, OrbitControls, Environment } from '@react-three/drei'
import type { KeyboardControlsEntry } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Player } from './game/Player'
import { Enemy } from './game/Enemy'
import { Ally } from './game/Ally'
import { HUD } from './components/HUD'
import { ClassSelection } from './components/ClassSelection'
import { useMemo, Suspense, useEffect, useState } from 'react'
import { ProjectileSystem } from './game/ProjectileSystem'
import { Arena } from './game/Arena'
import { useGameStore } from './store/gameStore'

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
  const { matchState, resetMatch, gameState, setGameState } = useGameStore();
  const [enemyClasses, setEnemyClasses] = useState<string[]>([]);
  const [allyClasses, setAllyClasses] = useState<string[]>([]);
  const [gameId, setGameId] = useState(0);

  const map = useMemo<KeyboardControlsEntry<string>[]>(() => [
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

  useEffect(() => {
    if (gameState === 'playing' && matchState === 'active') {
      // Randomize classes for enemies and allies when game starts
      const classes = ['Warrior', 'Mage', 'Warlock', 'Paladin'];
      setEnemyClasses([
        classes[Math.floor(Math.random() * classes.length)],
        classes[Math.floor(Math.random() * classes.length)],
        classes[Math.floor(Math.random() * classes.length)]
      ]);
      setAllyClasses([
        classes[Math.floor(Math.random() * classes.length)],
        classes[Math.floor(Math.random() * classes.length)]
      ]);
    }
  }, [gameState, matchState, gameId]);

  const handlePlayAgain = () => {
    resetMatch();
    setGameId(prev => prev + 1);
    setGameState('menu');
  };

  return (
    <KeyboardControls map={map}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

        {gameState === 'menu' && <ClassSelection key={gameId} />}

        {gameState === 'playing' && (
          <>
            <HUD />
            {matchState !== 'active' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
                color: 'white'
              }}>
                <h1>{matchState === 'victory' ? 'VICTORY!' : 'DEFEAT!'}</h1>
                <button
                  onClick={handlePlayAgain}
                  style={{
                    padding: '10px 20px',
                    fontSize: '20px',
                    marginTop: '20px',
                    cursor: 'pointer'
                  }}
                >
                  Play Again
                </button>
              </div>
            )}

            <Canvas key={gameId} shadows camera={{ position: [0, 5, 10], fov: 50 }}>
              <Suspense fallback={null}>
                <Environment preset="sunset" />
                <Sky sunPosition={[100, 20, 100]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} castShadow />

                <Physics gravity={[0, -9.81, 0]}>
                  <Arena />

                  {/* Player */}
                  <Player />

                  {/* Allies */}
                  {allyClasses.length > 0 && (
                    <>
                      <Ally position={[-3, 1, 3]} id="ally1" characterClass={allyClasses[0]} />
                      <Ally position={[3, 1, 3]} id="ally2" characterClass={allyClasses[1]} />
                    </>
                  )}

                  {/* Enemies */}
                  {enemyClasses.length > 0 && (
                    <>
                      <Enemy position={[0, 1, -5]} id="enemy1" characterClass={enemyClasses[0]} />
                      <Enemy position={[-5, 1, -5]} id="enemy2" characterClass={enemyClasses[1]} />
                      <Enemy position={[5, 1, -5]} id="enemy3" characterClass={enemyClasses[2]} />
                    </>
                  )}

                  {/* Projectiles */}
                  <ProjectileSystem />
                </Physics>

                <OrbitControls makeDefault />
              </Suspense>
            </Canvas>
          </>
        )}
      </div>
    </KeyboardControls>
  )
}

export default App
