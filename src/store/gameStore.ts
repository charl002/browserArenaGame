import { create } from 'zustand';
import { Classes } from '../game/classes';
import * as THREE from 'three';

interface GameState {
    player: {
        health: number;
        maxHealth: number;
        resource: number;
        maxResource: number;
    };
    currentClass: string;
    targetId: string | null;
    cooldowns: Record<string, number>;
    enemies: Record<string, { health: number; maxHealth: number }>;
    projectiles: Array<{
        id: string;
        startPos: THREE.Vector3;
        targetPos: THREE.Vector3;
        targetId?: string;
        damage: number;
        speed: number;
    }>;

    casting: { abilityName: string; startTime: number; duration: number; onComplete: () => void } | null;
    statusEffects: {
        player: Array<{ id: string; type: 'stun' | 'root' | 'slow'; duration: number; startTime: number }>;
        enemies: Record<string, Array<{ id: string; type: 'stun' | 'root' | 'slow'; duration: number; startTime: number }>>;
    };

    setTarget: (id: string | null) => void;
    registerEnemy: (id: string, maxHealth: number) => void;
    damageEnemy: (id: string, amount: number) => void;
    removeEnemy: (id: string) => void;
    damageTarget: (amount: number) => void;
    useAbility: (abilityName: string, cooldown: number) => boolean;
    setClass: (className: string) => void;
    addProjectile: (p: { id: string; startPos: THREE.Vector3; targetPos: THREE.Vector3; targetId?: string; damage: number; speed: number }) => void;
    removeProjectile: (id: string) => void;

    startCast: (abilityName: string, duration: number, onComplete: () => void) => void;
    cancelCast: () => void;
    applyStatusEffect: (targetId: string, effect: { id: string; type: 'stun' | 'root' | 'slow'; duration: number; startTime: number }) => void;
    removeStatusEffect: (targetId: string, effectId: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    player: {
        health: 150,
        maxHealth: 150,
        resource: 100,
        maxResource: 100,
    },
    currentClass: 'Warrior',
    targetId: null,
    cooldowns: {},
    enemies: {},

    setTarget: (id) => set({ targetId: id }),

    registerEnemy: (id, maxHealth) => set((state) => ({
        enemies: { ...state.enemies, [id]: { health: maxHealth, maxHealth } }
    })),

    removeEnemy: (id) => set((state) => {
        const { [id]: _, ...rest } = state.enemies;
        return {
            enemies: rest,
            targetId: state.targetId === id ? null : state.targetId
        };
    }),

    damageEnemy: (id, amount) => set((state) => {
        const enemy = state.enemies[id];
        if (!enemy) return {};

        const newHealth = Math.max(0, enemy.health - amount);
        console.log(`Enemy ${id} took ${amount} damage. Health: ${newHealth}/${enemy.maxHealth}`);

        return {
            enemies: {
                ...state.enemies,
                [id]: { ...enemy, health: newHealth }
            }
        };
    }),

    damageTarget: (amount) => {
        const targetId = get().targetId;
        if (targetId) {
            get().damageEnemy(targetId, amount);
        }
    },

    useAbility: (abilityName, cooldown) => {
        const now = Date.now();
        const readyAt = get().cooldowns[abilityName] || 0;

        if (now >= readyAt) {
            set((state) => ({
                cooldowns: {
                    ...state.cooldowns,
                    [abilityName]: now + cooldown * 1000,
                },
            }));
            return true;
        }
        return false;
    },

    setClass: (className) => {
        const cls = Classes[className as keyof typeof Classes];
        if (cls) {
            set({
                currentClass: className,
                player: {
                    health: cls.stats.maxHealth,
                    maxHealth: cls.stats.maxHealth,
                    resource: cls.stats.maxResource,
                    maxResource: cls.stats.maxResource,
                }
            });
        }
    },

    projectiles: [],
    addProjectile: (projectile) => set((state) => ({ projectiles: [...state.projectiles, projectile] })),
    removeProjectile: (id) => set((state) => ({ projectiles: state.projectiles.filter(p => p.id !== id) })),

    // Status Effects & Casting
    casting: null,
    statusEffects: { player: [], enemies: {} },

    startCast: (abilityName, duration, onComplete) => {
        set({ casting: { abilityName, startTime: Date.now(), duration, onComplete } });
        setTimeout(() => {
            const state = get();
            if (state.casting && state.casting.abilityName === abilityName) {
                state.casting.onComplete();
                set({ casting: null });
            }
        }, duration * 1000);
    },

    cancelCast: () => set({ casting: null }),

    applyStatusEffect: (targetId, effect) => set((state) => {
        if (targetId === 'player') {
            return { statusEffects: { ...state.statusEffects, player: [...state.statusEffects.player, effect] } };
        }
        const enemyEffects = state.statusEffects.enemies[targetId] || [];
        return {
            statusEffects: {
                ...state.statusEffects,
                enemies: { ...state.statusEffects.enemies, [targetId]: [...enemyEffects, effect] }
            }
        };
    }),

    removeStatusEffect: (targetId, effectId) => set((state) => {
        if (targetId === 'player') {
            return { statusEffects: { ...state.statusEffects, player: state.statusEffects.player.filter(e => e.id !== effectId) } };
        }
        const enemyEffects = state.statusEffects.enemies[targetId] || [];
        return {
            statusEffects: {
                ...state.statusEffects,
                enemies: { ...state.statusEffects.enemies, [targetId]: enemyEffects.filter(e => e.id !== effectId) }
            }
        };
    }),
}));
