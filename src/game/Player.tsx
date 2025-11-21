import { useKeyboardControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, RapierRigidBody, useRapier } from '@react-three/rapier';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { Classes } from './classes';
import { SoundManager } from './SoundManager';

const SPEED = 5;

export function Player() {
    const body = useRef<RapierRigidBody>(null);
    const [subscribeKeys, getKeys] = useKeyboardControls();
    const { world, rapier } = useRapier();
    const { useAbility, currentClass, addProjectile, casting, targetId } = useGameStore();
    const abilities = Classes[currentClass as keyof typeof Classes].abilities;
    const [flash, setFlash] = useState(false);
    const { scene } = useThree();


    // Warrior Animation State
    const [isSwinging, setIsSwinging] = useState(false);
    const swordRef = useRef<THREE.Mesh>(null);
    const [isCharging, setIsCharging] = useState(false);

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

                    if ((currentClass === 'Warrior' && (ability.id === 'strike' || ability.id === 'whirlwind' || ability.id === 'execute')) ||
                        (currentClass === 'Paladin' && ability.id === 'crusader_strike')) {
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

                        setIsCharging(true);
                        // Apply strong impulse towards target
                        body.current.applyImpulse({ x: dir.x * 100, y: 5, z: dir.z * 100 }, true);

                        setTimeout(() => {
                            setIsCharging(false);
                            if (body.current) {
                                // Dampen velocity after charge
                                const vel = body.current.linvel();
                                body.current.setLinvel({ x: vel.x * 0.1, y: vel.y, z: vel.z * 0.1 }, true);
                            }
                        }, 300);
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
                    if ((currentClass === 'Mage' || currentClass === 'Warlock') &&
                        (ability.range && ability.range > 5) &&
                        !['polymorph', 'fear', 'life_drain', 'corruption', 'frost_nova'].includes(ability.id) &&
                        body.current) {
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
                            speed: ability.id === 'glacial_spike' ? 25 : 15,
                            type: ability.id // Pass ability ID for visuals
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

                    // CC Abilities & Special Logic
                    if (ability.id === 'frost_nova' && body.current) {
                        // AOE Root
                        const playerPos = body.current.translation();
                        const enemies = useGameStore.getState().enemies;
                        Object.keys(enemies).forEach(enemyId => {
                            const enemyObj = scene.getObjectByName(`Enemy-${enemyId}`);
                            if (enemyObj) {
                                const dist = enemyObj.position.distanceTo(new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z));
                                if (dist < (ability.range || 8)) {
                                    useGameStore.getState().applyStatusEffect(enemyId, { id: `root-${Date.now()}`, type: 'root', duration: 4, startTime: Date.now() });
                                }
                            }
                        });
                        // Visual: Blue Circle
                        const circle = new THREE.Mesh(new THREE.RingGeometry(0.5, 8, 32), new THREE.MeshBasicMaterial({ color: 'cyan', side: THREE.DoubleSide, transparent: true, opacity: 0.5 }));
                        circle.rotation.x = -Math.PI / 2;
                        circle.position.copy(new THREE.Vector3(playerPos.x, 0.1, playerPos.z));
                        scene.add(circle);
                        setTimeout(() => scene.remove(circle), 500);
                        return;
                    }

                    if (targetId) {
                        if (ability.id === 'polymorph') {
                            useGameStore.getState().applyStatusEffect(targetId, { id: `poly-${Date.now()}`, type: 'polymorph', duration: 5, startTime: Date.now() });
                        } else if (ability.id === 'fear') {
                            useGameStore.getState().applyStatusEffect(targetId, { id: `fear-${Date.now()}`, type: 'fear', duration: 5, startTime: Date.now() });
                        } else if (ability.id === 'hammer_of_justice') {
                            useGameStore.getState().applyStatusEffect(targetId, { id: `stun-${Date.now()}`, type: 'stun', duration: 3, startTime: Date.now() });
                        } else if (ability.id === 'corruption') {
                            useGameStore.getState().applyDot(targetId, {
                                id: `corr-${Date.now()}`,
                                damage: ability.damage || 5,
                                duration: 12,
                                type: 'corruption'
                            });
                        } else if (ability.id === 'life_drain') {
                            useGameStore.getState().startChannel(ability.id, ability.channelTime || 4, () => {
                                // On Tick
                                useGameStore.getState().damageEnemy(targetId, ability.damage || 10);
                                useGameStore.setState(state => ({ player: { ...state.player, health: Math.min(state.player.maxHealth, state.player.health + 10) } }));
                            }, () => {
                                // On Complete
                                console.log("Drain Complete");
                            });
                            return;
                        }
                    }

                    if (targetId && ability.damage && body.current) {
                        // Melee Checks
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

        // Camera Follow Logic
        const playerPos = body.current.translation();
        const cameraOffset = new THREE.Vector3(0, 10, 20); // Zoomed out
        const targetCameraPos = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z).add(cameraOffset);

        // Smoothly interpolate camera position
        state.camera.position.lerp(targetCameraPos, 0.1);
        state.camera.lookAt(playerPos.x, playerPos.y, playerPos.z);

        // Skip movement logic if charging
        if (isCharging) return;

        const { forward, backward, left, right } = getKeys();

        const linvel = body.current.linvel();

        // Camera direction (projected to XZ plane)
        const front = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
        front.y = 0;
        front.normalize();

        const side = new THREE.Vector3(1, 0, 0).applyQuaternion(state.camera.quaternion);
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

            // Rotate player to face movement direction
            const angle = Math.atan2(direction.x, direction.z);
            const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            body.current.setRotation(rotation, true);
        } else {
            body.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
        }
    });

    useEffect(() => {
        const handleJump = () => {
            if (!body.current || !rapier) return;

            const playerPos = body.current.translation();
            // Start ray inside the player capsule (bottom is at y-1, center at y).
            // We start at y - 0.9, which is 0.1 above the bottom of the capsule.
            // This ensures we don't start inside the ground (y-1) but are close enough to check for it.
            const rayOrigin = { x: playerPos.x, y: playerPos.y - 0.9, z: playerPos.z };
            const rayDir = { x: 0, y: -1, z: 0 };
            const ray = new rapier.Ray(rayOrigin, rayDir);

            // Ray length: We expect ground at distance 0.1. Give it a bit of leeway (0.2).
            const hit = world.castRay(ray, 0.2, true);

            // Only jump if close to ground AND vertical velocity is low (not already jumping/falling)
            const linvel = body.current.linvel();
            if (hit && hit.timeOfImpact < 0.2 && Math.abs(linvel.y) < 0.5) {
                // Apply impulse
                body.current.applyImpulse({ x: 0, y: 10, z: 0 }, true);
                SoundManager.getInstance().playJump();
            }
        };

        const unsubJump = subscribeKeys((state) => state.jump, (value) => {
            if (value) handleJump();
        });

        return () => {
            unsubJump();
        };
    }, [subscribeKeys, rapier, world]);

    return (
        <RigidBody
            ref={body}
            name="Player"
            colliders={false}
            enabledRotations={[false, false, false]}
            position={[0, 5, 20]}
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
                    {/* Hammer Handle */}
                    <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.6]} />
                        <meshStandardMaterial color="brown" />
                    </mesh>
                    {/* Hammer Head */}
                    <mesh ref={swordRef} position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
                        <boxGeometry args={[0.3, 0.5, 0.3]} />
                        <meshStandardMaterial color="silver" emissive="gold" emissiveIntensity={0.2} />
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

export function LifeDrainBeam() {
    const meshRef = useRef<THREE.Mesh>(null);
    const debugRef = useRef<THREE.Mesh>(null);
    const { scene } = useThree();
    const { casting, targetId } = useGameStore();

    useFrame((state) => {
        const isCastingLifeDrain = casting && casting.abilityName === 'life_drain';

        // Debug Visual Logic
        if (debugRef.current) {
            debugRef.current.visible = !!isCastingLifeDrain;
            if (isCastingLifeDrain) {
                const player = scene.getObjectByName("Player");
                const target = targetId ? scene.getObjectByName(`Enemy-${targetId}`) : null;

                // Green if valid, Red if missing targets
                (debugRef.current.material as THREE.MeshBasicMaterial).color.set(player && target ? "green" : "red");

                if (player) {
                    debugRef.current.position.copy(player.position).add(new THREE.Vector3(0, 3, 0));
                }
            }
        }

        // Beam Logic
        if (!meshRef.current) return;

        if (!isCastingLifeDrain || !targetId) {
            meshRef.current.visible = false;
            return;
        }

        const player = scene.getObjectByName("Player");
        const target = scene.getObjectByName(`Enemy-${targetId}`);

        if (player && target) {
            meshRef.current.visible = true;
            // Enemy -> Player
            const start = target.position.clone().add(new THREE.Vector3(0, 1, 0));
            const end = player.position.clone().add(new THREE.Vector3(0, 1, 0));

            const distance = start.distanceTo(end);
            const mid = start.clone().add(end).multiplyScalar(0.5);

            meshRef.current.position.copy(mid);
            meshRef.current.lookAt(end);
            meshRef.current.rotateX(Math.PI / 2);
            meshRef.current.scale.set(1, distance, 1);
        } else {
            meshRef.current.visible = false;
        }
    });

    return (
        <group>
            {/* The Beam */}
            <mesh ref={meshRef} visible={false}>
                <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
                <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
            </mesh>

            {/* Conditional Debug Sphere - Only visible when casting */}
            <mesh ref={debugRef} visible={false}>
                <sphereGeometry args={[0.5]} />
                <meshBasicMaterial color="red" />
            </mesh>
        </group>
    );
}
