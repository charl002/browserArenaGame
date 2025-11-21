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

        // Check CC
        const { statusEffects } = useGameStore.getState();
        const myEffects = statusEffects.enemies[id] || [];
        const isCCd = myEffects.some(e => e.type === 'stun' || e.type === 'root');

        if (isCCd) {
            body.current.setLinvel({ x: 0, y: body.current.linvel().y, z: 0 }, true);
            return;
        }

        // Find closest target (Player or Ally)
        let closestTarget: { type: 'player' | 'ally', id: string, pos: THREE.Vector3, dist: number } | null = null;
        let minDistance = Infinity;
        const myPos = body.current.translation();
        const myPosVec = new THREE.Vector3(myPos.x, myPos.y, myPos.z);

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
                const speed = 3;
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
                            targetId: closestTarget.id === 'player' ? 'player' : closestTarget.id, // Fix target ID for player
                            damage: 15,
                            speed: 10
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
            >
                <boxGeometry args={[1, 2, 1]} />
                <meshStandardMaterial color={getColor()} />
                <Html position={[0, 2.5, 0]} center>
                    <div style={{
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none'
                    }}>
                        {characterClass}
                    </div>
                </Html>
            </mesh>
        </RigidBody>
    );
}
