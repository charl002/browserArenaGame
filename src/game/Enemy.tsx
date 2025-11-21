import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Classes } from './classes';

export function Enemy({ position, id, characterClass }: { position: [number, number, number], id: string, characterClass: string }) {
    const body = useRef<RapierRigidBody>(null);
    const { setTarget, targetId, registerEnemy, enemies, damagePlayer, damageAlly, allies, addProjectile, removeEnemy } = useGameStore();
    const [hovered, setHover] = useState(false);
    const [flash, setFlash] = useState(false);
    const lastAttackTime = useRef(0);
    const lastHealth = useRef(100);

    const isTarget = targetId === id;
    const enemyState = enemies[id];
    const classDef = Classes[characterClass as keyof typeof Classes];

    // Subscribe to status effects for this enemy to ensure re-renders
    const statusEffects = useGameStore(state => state.statusEffects);
    const myEffects = statusEffects.enemies[id] || [];
    const isPolymorphed = myEffects.some(e => e.type === 'polymorph');
    const isStunned = myEffects.some(e => e.type === 'stun');
    const isFeared = myEffects.some(e => e.type === 'fear');
    const isRooted = myEffects.some(e => e.type === 'root');
    const isSlowed = myEffects.some(e => e.type === 'slow');
    const isCorrupted = myEffects.some(e => e.type === 'corruption');

    useEffect(() => {
        if (classDef) {
            registerEnemy(id, classDef.stats.maxHealth, characterClass);
        }
    }, [id, registerEnemy, characterClass, classDef]);

    useEffect(() => {
        if (enemyState) {
            if (enemyState.health <= 0) {
                removeEnemy(id);
            } else if (enemyState.health < lastHealth.current) {
                setFlash(true);
                setTimeout(() => setFlash(false), 100);
            }
            lastHealth.current = enemyState.health;
        }
    }, [enemyState, removeEnemy, id]);

    useFrame((state) => {
        if (!body.current || !enemyState || enemyState.health <= 0) return;

        // Check CC (Get fresh state for physics logic)
        const currentEffects = useGameStore.getState().statusEffects.enemies[id] || [];
        const _isPolymorphed = currentEffects.some(e => e.type === 'polymorph');
        const _isStunned = currentEffects.some(e => e.type === 'stun');
        const _isFeared = currentEffects.some(e => e.type === 'fear');
        const _isRooted = currentEffects.some(e => e.type === 'root');
        const _isSlowed = currentEffects.some(e => e.type === 'slow');

        if (_isStunned || _isPolymorphed || _isRooted) {
            body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            body.current.wakeUp(); // Ensure physics engine updates immediately
            return;
        }

        const myPos = body.current.translation();
        const myPosVec = new THREE.Vector3(myPos.x, myPos.y, myPos.z);

        // Fear Logic
        if (_isFeared) {
            const player = state.scene.getObjectByName("Player");
            if (player) {
                const direction = new THREE.Vector3()
                    .subVectors(myPosVec, player.position) // Away from player
                    .normalize();

                let speed = 6; // Run fast!
                if (_isSlowed) speed *= 0.5;
                body.current.setLinvel({ x: direction.x * speed, y: body.current.linvel().y, z: direction.z * speed }, true);
            }
            return; // Skip normal AI
        }

        // Find closest target (Player or Ally)
        let closestTarget: { type: 'player' | 'ally', id: string, pos: THREE.Vector3, dist: number } | null = null;
        let minDistance = Infinity;

        // Check Player
        const player = state.scene.getObjectByName("Player");
        if (player) {
            const dist = myPosVec.distanceTo(player.position);
            if (dist < minDistance) {
                minDistance = dist;
                closestTarget = { type: 'player', id: 'player', pos: player.position, dist };
            }
        }

        // Check Allies
        Object.keys(allies).forEach(allyId => {
            const allyObj = state.scene.getObjectByName(`Ally-${allyId}`);
            if (allyObj) {
                const dist = myPosVec.distanceTo(allyObj.position);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestTarget = { type: 'ally', id: allyId, pos: allyObj.position, dist };
                }
            }
        });

        if (closestTarget) {
            const direction = new THREE.Vector3()
                .subVectors(closestTarget.pos, myPosVec)
                .normalize();

            const range = characterClass === 'Warrior' || characterClass === 'Paladin' ? 2 : 10;

            if (closestTarget.dist > range) {
                // Chase
                let speed = 3;
                if (_isSlowed) speed *= 0.5;
                const linvel = body.current.linvel();
                body.current.setLinvel({ x: direction.x * speed, y: linvel.y, z: direction.z * speed }, true);
            } else {
                // Attack
                const now = Date.now();
                if (now - lastAttackTime.current > 2000) {
                    console.log(`Enemy ${id} (${characterClass}) attacks ${closestTarget.type}!`);

                    if (characterClass === 'Mage' || characterClass === 'Warlock') {
                        // Ranged Attack (Projectile)
                        addProjectile({
                            id: `proj-enemy-${id}-${now}`,
                            startPos: myPosVec,
                            targetPos: closestTarget.pos,
                            targetId: closestTarget.id === 'player' ? 'player' : closestTarget.id,
                            damage: 15,
                            speed: 10,
                            type: 'fireball'
                        });
                    } else {
                        // Melee Attack
                        if (closestTarget.type === 'player') {
                            damagePlayer(10);
                        } else {
                            damageAlly(closestTarget.id, 10);
                        }
                    }

                    lastAttackTime.current = now;
                }
                // Stop moving
                const linvel = body.current.linvel();
                body.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
            }
        }
    });

    if (!enemyState || enemyState.health <= 0) return null;

    const getColor = () => {
        if (flash) return "white";
        if (isTarget) return "red";
        if (hovered) return "orange";
        if (isSlowed) return "cyan"; // Visual for slow
        switch (characterClass) {
            case 'Warrior': return '#8B4513'; // Brown
            case 'Mage': return '#4169E1'; // Royal Blue
            case 'Warlock': return '#9370DB'; // Medium Purple
            case 'Paladin': return '#FFD700'; // Gold
            default: return 'yellow';
        }
    };

    return (
        <RigidBody ref={body} name={`Enemy-${id}`} position={position} colliders="cuboid" lockRotations>
            <mesh
                castShadow
                onClick={(e) => {
                    e.stopPropagation();
                    setTarget(id);
                }}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                visible={!isPolymorphed} // Hide normal model if polymorphed
            >
                <boxGeometry args={[1, 2, 1]} />
                <meshStandardMaterial color={getColor()} />
                {/* Corruption Visual */}
                {isCorrupted && (
                    <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.8, 1.2, 32]} />
                        <meshBasicMaterial color="purple" transparent opacity={0.7} side={THREE.DoubleSide} />
                    </mesh>
                )}
                <Html position={[0, 2.5, 0]} center>
                    <div style={{
                        background: 'rgba(0,0,0,0.5)',
                        color: '#ff4444', // Red nameplate for enemies
                        padding: '2px 5px',
                        borderRadius: '3px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div>{characterClass}</div>
                        {isStunned && <div style={{ color: 'yellow', fontWeight: 'bold' }}>STUNNED</div>}
                        {isFeared && <div style={{ color: 'purple', fontWeight: 'bold' }}>FEARED</div>}
                    </div>
                </Html>
            </mesh>

            {/* Polymorph Sheep Model */}
            {isPolymorphed && (
                <group>
                    <mesh position={[0, 0.5, 0]}>
                        <sphereGeometry args={[0.5]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                    <mesh position={[0.4, 0.8, 0.3]}>
                        <sphereGeometry args={[0.2]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                    <Html position={[0, 1.5, 0]} center>
                        <div style={{ color: 'white', background: 'rgba(0,0,0,0.5)', padding: '2px' }}>Sheep</div>
                    </Html>
                </group>
            )}
        </RigidBody>
    );
}
