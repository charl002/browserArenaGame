import { useGameStore } from '../store/gameStore';
import { Projectile } from './Projectile';

export function ProjectileSystem() {
    const { projectiles, removeProjectile } = useGameStore();

    return (
        <>
            {projectiles.map((p) => (
                <Projectile
                    key={p.id}
                    startPos={p.startPos}
                    targetPos={p.targetPos}
                    targetId={p.targetId}
                    damage={p.damage}
                    speed={p.speed}
                    onHit={() => removeProjectile(p.id)}
                />
            ))}
        </>
    );
}
