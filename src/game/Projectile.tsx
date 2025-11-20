import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

interface ProjectileProps {
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    targetId?: string;
    damage: number;
    speed: number;
    onHit: () => void;
}

export function Projectile({ startPos, targetPos, targetId, damage, speed, onHit }: ProjectileProps) {
    const body = useRef<RapierRigidBody>(null);
    const { damageEnemy } = useGameStore();
    const startTime = useRef(Date.now());

    useFrame((state) => {
        if (!body.current) return;

        if (Date.now() - startTime.current > 5000) { // Increased lifetime for homing
            onHit();
            return;
        }

        let currentTargetPos = targetPos;

        if (targetId) {
            const targetObj = state.scene.getObjectByName(`Enemy-${targetId}`);
            if (targetObj) {
                currentTargetPos = targetObj.position;
            }
        }

        const currentPos = body.current.translation();
        const direction = new THREE.Vector3()
            .subVectors(currentTargetPos, new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z))
            .normalize();

        body.current.setLinvel({ x: direction.x * speed, y: direction.y * speed, z: direction.z * speed }, true);
    });

    return (
        <RigidBody
            ref={body}
            position={[startPos.x, startPos.y, startPos.z]}
            sensor
            gravityScale={0}
            onIntersectionEnter={({ other }) => {
                const name = other.rigidBodyObject?.name;
                if (name && name.startsWith("Enemy-")) {
                    const enemyId = name.replace("Enemy-", "");
                    damageEnemy(enemyId, damage);
                    onHit();
                }
            }}
        >
            <mesh>
                <sphereGeometry args={[0.2]} />
                <meshStandardMaterial color="orange" emissive="red" emissiveIntensity={2} />
            </mesh>
        </RigidBody>
    );
}
