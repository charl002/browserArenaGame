import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

export function Enemy({ position, id }: { position: [number, number, number], id: string }) {
    const body = useRef<RapierRigidBody>(null);
    const { setTarget, targetId, registerEnemy, enemies } = useGameStore();
    const [hovered, setHover] = useState(false);
    const [flash, setFlash] = useState(false);
    const lastAttackTime = useRef(0);
    const lastHealth = useRef(100);

    const isTarget = targetId === id;
    const enemyState = enemies[id];

    useEffect(() => {
        registerEnemy(id, 100);
    }, [id, registerEnemy]);

    useEffect(() => {
        if (enemyState) {
            if (enemyState.health < lastHealth.current) {
                setFlash(true);
                setTimeout(() => setFlash(false), 100);
            }
            lastHealth.current = enemyState.health;
        }
    }, [enemyState]);

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

        const player = state.scene.getObjectByName("Player");
        if (player) {
            const playerPos = player.position;
            const enemyPos = body.current.translation();

            const direction = new THREE.Vector3()
                .subVectors(playerPos, new THREE.Vector3(enemyPos.x, enemyPos.y, enemyPos.z))
                .normalize();

            const distance = new THREE.Vector3(enemyPos.x, enemyPos.y, enemyPos.z).distanceTo(playerPos);

            if (distance > 2) {
                // Chase
                const speed = 3;
                const linvel = body.current.linvel();
                body.current.setLinvel({ x: direction.x * speed, y: linvel.y, z: direction.z * speed }, true);
            } else {
                // Attack
                const now = Date.now();
                if (now - lastAttackTime.current > 2000) {
                    console.log("Enemy attacks Player!");
                    lastAttackTime.current = now;
                    // TODO: Damage player
                }
                // Stop moving
                const linvel = body.current.linvel();
                body.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
            }
        }
    });

    if (!enemyState || enemyState.health <= 0) return null;

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
                <meshStandardMaterial color={flash ? "white" : isTarget ? "red" : hovered ? "orange" : "yellow"} />
            </mesh>
        </RigidBody>
    );
}
