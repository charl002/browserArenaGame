import { useKeyboardControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, RapierRigidBody, useRapier } from '@react-three/rapier';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Classes } from './classes';
import { SoundManager } from './SoundManager';

const SPEED = 5;
const JUMP_FORCE = 0.5;

export function Player() {
    const body = useRef<RapierRigidBody>(null);
    const [subscribeKeys, getKeys] = useKeyboardControls();
    const { world, rapier } = useRapier();
    const { useAbility, currentClass, addProjectile } = useGameStore();
    const abilities = Classes[currentClass as keyof typeof Classes].abilities;
    const [flash, setFlash] = useState(false);
    const { scene } = useThree();

    // Warrior Animation State
    const [isSwinging, setIsSwinging] = useState(false);
    const swordRef = useRef<THREE.Mesh>(null);

    useEffect(() => {
        if (flash) {
            const timer = setTimeout(() => setFlash(false), 200);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    useEffect(() => {
        if (isSwinging) {
            const timer = setTimeout(() => setIsSwinging(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isSwinging]);

    // Animate sword
    useFrame(() => {
        if (swordRef.current) {
            if (isSwinging) {
                swordRef.current.rotation.x = THREE.MathUtils.lerp(swordRef.current.rotation.x, -Math.PI / 2, 0.2);
            } else {
                swordRef.current.rotation.x = THREE.MathUtils.lerp(swordRef.current.rotation.x, 0, 0.2);
            }
        }
    });

    useEffect(() => {
        const handleAbility = (abilityKey: keyof typeof abilities) => {
            const ability = abilities[abilityKey];
            const { startCast, useAbility: triggerAbility } = useGameStore.getState();

            // Check if ability is ready (cooldown)
            if (triggerAbility(ability.id, ability.cooldown)) {

                const executeAbility = () => {
                    console.log(`Cast ${ability.name}!`);
                    setFlash(true);

                    if (currentClass === 'Warrior' && (ability.id === 'strike' || ability.id === 'whirlwind' || ability.id === 'execute')) {
                        setIsSwinging(true);
                    }

                    const targetId = useGameStore.getState().targetId;

                    // Movement Abilities
                    if (ability.id === 'charge' && body.current) {
                        const playerPos = body.current.translation();
                        let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(body.current.rotation());

                        if (targetId) {
                            const targetObj = scene.getObjectByName(`Enemy-${targetId}`);
                            if (targetObj) {
                                const targetPos = targetObj.position;
                                dir = new THREE.Vector3().subVectors(targetPos, new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z)).normalize();
                            }
                        }
                        body.current.applyImpulse({ x: dir.x * 50, y: 0, z: dir.z * 50 }, true);
                        return;
                    }

                    if (ability.id === 'blink' && body.current) {
                        const playerPos = body.current.translation();
                        const linvel = body.current.linvel();
                        let dir = new THREE.Vector3(linvel.x, 0, linvel.z).normalize();
                        if (dir.length() === 0) dir = new THREE.Vector3(0, 0, -1); // Default

                        const newPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z).add(dir.multiplyScalar(10));
                        body.current.setTranslation({ x: newPos.x, y: newPos.y + 1, z: newPos.z }, true);
                        return;
                    }

                    // Mage, Warlock Projectile Logic
                    if ((currentClass === 'Mage' || currentClass === 'Warlock') && (ability.range && ability.range > 5) && body.current) {
                        const playerPos = body.current.translation();
                        const startPos = new THREE.Vector3(playerPos.x, playerPos.y + 1, playerPos.z);

                        let targetPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z + 10); // Default forward

                        if (targetId) {
                            const targetObj = scene.getObjectByName(`Enemy-${targetId}`);
                            if (targetObj) {
                                targetPos = targetObj.position.clone();
                            }
                        }

                        addProjectile({
                            id: Math.random().toString(),
                            startPos: startPos,
                            targetPos: targetPos,
                            targetId: targetId || undefined,
                            damage: ability.damage || 0,
                            speed: 10
                        });
                        return;
                    }

                    // Paladin Melee & Spells
                    if (currentClass === 'Paladin') {
                        if (ability.id === 'holy_light') {
                            // Heal self logic
                            useGameStore.setState(state => ({
                                player: { ...state.player, health: Math.min(state.player.maxHealth, state.player.health + 30) }
                            }));
                            return;
                        }
                    }

                    if (targetId && ability.damage && body.current) {
                        const playerPos = body.current.translation();
                        let targetPos = new THREE.Vector3(5, 1, 5); // Fallback

                        const targetObj = scene.getObjectByName(`Enemy-${targetId}`);
                        if (targetObj) {
                            targetPos = targetObj.position;
                        }

                        const dist = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z).distanceTo(targetPos);

                        if (dist <= (ability.range || 5)) {
                            console.log("Hit target!");
                            useGameStore.getState().damageTarget(ability.damage || 0);
                        } else {
                            console.log("Out of range!", dist, ability.range);
                        }
                    }
                };

                if (ability.castTime && ability.castTime > 0) {
                    startCast(ability.name, ability.castTime, executeAbility);
                } else {
                    executeAbility();
                }
            }
        }

        const unsub1 = subscribeKeys((state) => state.action1, (p) => p && handleAbility('action1'));
        const unsub2 = subscribeKeys((state) => state.action2, (p) => p && handleAbility('action2'));
        const unsub3 = subscribeKeys((state) => state.action3, (p) => p && handleAbility('action3'));
        const unsub4 = subscribeKeys((state) => state.action4, (p) => p && handleAbility('action4'));
        const unsub5 = subscribeKeys((state) => state.action5, (p) => p && handleAbility('action5'));

        return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
    }, [subscribeKeys, useAbility, currentClass, abilities, addProjectile, scene]);

    useFrame((state) => {
        if (!body.current) return;

        const { casting, statusEffects } = useGameStore.getState();
        const isCCd = statusEffects.player.some(e => e.type === 'stun' || e.type === 'root');
        const isCasting = !!casting;

        if (isCCd || isCasting) {
            body.current.setLinvel({ x: 0, y: body.current.linvel().y, z: 0 }, true);
            return;
        }

        const { forward, backward, left, right, jump } = getKeys();

        const linvel = body.current.linvel();

        // Camera direction
        const camera = state.camera;
        const front = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        front.y = 0;
        front.normalize();

        const side = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        side.y = 0;
        side.normalize();

        const direction = new THREE.Vector3();

        if (forward) direction.add(front);
        if (backward) direction.sub(front);
        if (left) direction.sub(side);
        if (right) direction.add(side);

        if (direction.length() > 0) {
            direction.normalize().multiplyScalar(SPEED);
            body.current.setLinvel({ x: direction.x, y: linvel.y, z: direction.z }, true);
        } else {
            body.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
        }

        // Jump with Ground Check
        if (jump) {
            const rayOrigin = body.current.translation();
            const rayDir = { x: 0, y: -1, z: 0 };

            if (rapier) {
                const ray = new rapier.Ray(rayOrigin, rayDir);
                const hit = world.castRay(ray, 1.1, true);

                if (hit && hit.timeOfImpact < 1.1) {
                    body.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
                    SoundManager.getInstance().playJump();
                }
            }
        }
    });

    return (
        <RigidBody
            ref={body}
            name="Player"
            colliders={false}
            enabledRotations={[false, false, false]}
            position={[0, 5, 0]}
        >
            <CapsuleCollider args={[0.5, 0.5]} />
            <mesh castShadow>
                <capsuleGeometry args={[0.5, 1, 4, 8]} />
                <meshStandardMaterial color={flash ? "white" : currentClass === 'Warrior' ? "brown" : currentClass === 'Paladin' ? "gold" : currentClass === 'Warlock' ? "purple" : "blue"} />
            </mesh>
            {currentClass === 'Warrior' && (
                <group position={[0.6, 0, 0.3]}>
                    {/* Sword Handle */}
                    <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                        <meshStandardMaterial color="black" />
                    </mesh>
                    {/* Sword Blade */}
                    <mesh ref={swordRef} position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[0.1, 1, 0.1]} />
                        <meshStandardMaterial color="silver" />
                    </mesh>
                    {/* Shield */}
                    <mesh position={[-1.2, 0, 0]} rotation={[0, 1.5, 0]}>
                        <boxGeometry args={[0.2, 0.8, 0.8]} />
                        <meshStandardMaterial color="brown" />
                    </mesh>
                </group>
            )}
            {currentClass === 'Paladin' && (
                <group position={[0.6, 0, 0.3]}>
                    <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[0.2, 1.2, 0.2]} />
                        <meshStandardMaterial color="gold" emissive="yellow" emissiveIntensity={0.5} />
                    </mesh>
                </group>
            )}
            {(currentClass === 'Mage' || currentClass === 'Warlock') && (
                <mesh position={[0.6, 0.5, 0.3]}>
                    <sphereGeometry args={[0.15]} />
                    <meshStandardMaterial color={currentClass === 'Warlock' ? "purple" : "cyan"} emissive={currentClass === 'Warlock' ? "indigo" : "blue"} emissiveIntensity={2} />
                </mesh>
            )}
        </RigidBody>
    );
}
