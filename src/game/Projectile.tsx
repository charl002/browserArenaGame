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
    type?: string;
    onHit: () => void;
}

export function Projectile({ startPos, targetPos, targetId, damage, speed, type, onHit }: ProjectileProps) {
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

        // Face direction
        const dummy = new THREE.Object3D();
        dummy.position.set(currentPos.x, currentPos.y, currentPos.z);
        dummy.lookAt(currentTargetPos);
        body.current.setRotation(dummy.quaternion, true);
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

                    if (type === 'frostbolt') {
                        useGameStore.getState().applyStatusEffect(enemyId, { id: `slow-${Date.now()}`, type: 'slow', duration: 4, startTime: Date.now() });
                    }

                    onHit();
                }
            }}
        >
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                {/* Rotate mesh so cone points forward if needed, but lookAt handles body rotation. 
                    Cone geometry points up (Y). If we lookAt, Z is forward. 
                    We need to rotate geometry so it points along Z. 
                    Rotate X by -PI/2? 
                */}
                {type === 'shadow_bolt' ? (
                    <sphereGeometry args={[0.3]} />
                ) : type === 'chaos_bolt' ? (
                    <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
                ) : type === 'frostbolt' ? (
                    <sphereGeometry args={[0.25]} />
                ) : type === 'glacial_spike' ? (
                    <coneGeometry args={[0.3, 1.5, 8]} />
                ) : type === 'judgment' ? (
                    <boxGeometry args={[0.4, 0.4, 0.8]} />
                ) : (
                    <sphereGeometry args={[0.2]} />
                )}
                <meshStandardMaterial
                    color={
                        type === 'shadow_bolt' ? "purple" :
                            type === 'chaos_bolt' ? "lime" :
                                type === 'frostbolt' ? "cyan" :
                                    type === 'glacial_spike' ? "blue" :
                                        type === 'judgment' ? "gold" :
                                            "orange"
                    }
                    emissive={
                        type === 'shadow_bolt' ? "indigo" :
                            type === 'chaos_bolt' ? "green" :
                                type === 'frostbolt' ? "blue" :
                                    type === 'glacial_spike' ? "cyan" :
                                        type === 'judgment' ? "yellow" :
                                            "red"
                    }
                    emissiveIntensity={type === 'chaos_bolt' || type === 'glacial_spike' || type === 'judgment' ? 3 : 2}
                />
            </mesh>
        </RigidBody>
    );
}
