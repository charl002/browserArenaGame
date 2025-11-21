import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Classes } from './classes';

export function Ally({ position, id, characterClass }: { position: [number, number, number], id: string, characterClass: string }) {
    const body = useRef<RapierRigidBody>(null);
    const { registerAlly, allies, enemies, damageEnemy, addProjectile } = useGameStore();
    const [flash, setFlash] = useState(false);
    const lastAttackTime = useRef(0);
    const lastHealth = useRef(100);

    const allyState = allies[id];
    const classDef = Classes[characterClass as keyof typeof Classes];

    useEffect(() => {
        if (classDef) {
            registerAlly(id, classDef.stats.maxHealth, characterClass);
        }
    }, [id, registerAlly, characterClass, classDef]);

    useEffect(() => {
        if (allyState) {
            if (allyState.health < lastHealth.current) {
                setFlash(true);
                setTimeout(() => setFlash(false), 100);
            }
            lastHealth.current = allyState.health;
        }
    }, [allyState]);

    useFrame((state) => {
        if (!body.current || !allyState || allyState.health <= 0) return;

        // Find closest enemy
        let closestEnemyId: string | null = null;
        let minDistance = Infinity;
        const myPos = body.current.translation();
        const myPosVec = new THREE.Vector3(myPos.x, myPos.y, myPos.z);

        Object.keys(enemies).forEach(enemyId => {
            const enemyObj = state.scene.getObjectByName(`Enemy-${enemyId}`);
            if (enemyObj) {
                const dist = myPosVec.distanceTo(enemyObj.position);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestEnemyId = enemyId;
                }
            }
        });

        if (closestEnemyId) {
            const enemyObj = state.scene.getObjectByName(`Enemy-${closestEnemyId}`);
            if (enemyObj) {
                const enemyPos = enemyObj.position;
                const direction = new THREE.Vector3()
                    .subVectors(enemyPos, myPosVec)
                    .normalize();

                const range = characterClass === 'Warrior' || characterClass === 'Paladin' ? 2 : 10;

                if (minDistance > range) {
                    // Chase
                    const speed = 3;
                    const linvel = body.current.linvel();
                    body.current.setLinvel({ x: direction.x * speed, y: linvel.y, z: direction.z * speed }, true);
                } else {
                    // Attack
                    const now = Date.now();
                    if (now - lastAttackTime.current > 2000) {
                        console.log(`Ally ${id} (${characterClass}) attacks Enemy ${closestEnemyId}!`);

                        if (characterClass === 'Mage' || characterClass === 'Warlock') {
                            // Ranged Attack (Projectile)
                            addProjectile({
                                id: `proj-ally-${id}-${now}`,
                                startPos: myPosVec,
                                targetPos: enemyPos,
                                targetId: closestEnemyId,
                                damage: 15,
                                speed: 10
                            });
                        } else {
                            // Melee Attack
                            damageEnemy(closestEnemyId, 10);
                        }

                        lastAttackTime.current = now;
                    }
                    // Stop moving
                    const linvel = body.current.linvel();
                    body.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
                }
            }
        } else {
            // Idle
            const linvel = body.current.linvel();
            body.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
        }
    });

    if (!allyState || allyState.health <= 0) return null;

    const getColor = () => {
        if (flash) return "white";
        switch (characterClass) {
            case 'Warrior': return '#8B4513'; // Brown
            case 'Mage': return '#4169E1'; // Royal Blue
            case 'Warlock': return '#9370DB'; // Medium Purple
            case 'Paladin': return '#FFD700'; // Gold
            default: return 'green';
        }
    };

    return (
        <RigidBody ref={body} name={`Ally-${id}`} position={position} colliders="cuboid" lockRotations>
            <mesh castShadow>
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
