import { RigidBody } from '@react-three/rapier';

export function Arena() {
    return (
        <group>
            {/* Floor */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </RigidBody>

            {/* Walls */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, 2.5, -25]} receiveShadow>
                    <boxGeometry args={[50, 5, 1]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[0, 2.5, 25]} receiveShadow>
                    <boxGeometry args={[50, 5, 1]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[-25, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                    <boxGeometry args={[50, 5, 1]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[25, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                    <boxGeometry args={[50, 5, 1]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
            </RigidBody>

            {/* Pillars */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[-10, 2.5, -10]} castShadow receiveShadow>
                    <cylinderGeometry args={[1, 1, 5, 16]} />
                    <meshStandardMaterial color="#777" />
                </mesh>
                <mesh position={[10, 2.5, -10]} castShadow receiveShadow>
                    <cylinderGeometry args={[1, 1, 5, 16]} />
                    <meshStandardMaterial color="#777" />
                </mesh>
                <mesh position={[-10, 2.5, 10]} castShadow receiveShadow>
                    <cylinderGeometry args={[1, 1, 5, 16]} />
                    <meshStandardMaterial color="#777" />
                </mesh>
                <mesh position={[10, 2.5, 10]} castShadow receiveShadow>
                    <cylinderGeometry args={[1, 1, 5, 16]} />
                    <meshStandardMaterial color="#777" />
                </mesh>
            </RigidBody>
        </group>
    );
}
