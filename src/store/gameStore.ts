import { create } from 'zustand';
import { Classes } from '../game/classes';
import * as THREE from 'three';
import { SoundManager } from '../game/SoundManager';

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
    enemies: Record<string, { health: number; maxHealth: number; class: string }>;
    allies: Record<string, { health: number; maxHealth: number; class: string }>;
    matchState: 'active' | 'victory' | 'defeat';
    gameState: 'menu' | 'playing';

    setTarget: (id: string | null) => void;
    registerEnemy: (id: string, maxHealth: number, className: string) => void;
    damageEnemy: (id: string, amount: number) => void;
    removeEnemy: (id: string) => void;

    registerAlly: (id: string, maxHealth: number, className: string) => void;
    damageAlly: (id: string, amount: number) => void;
    removeAlly: (id: string) => void;


    statusEffects: {
        player: { id: string; type: 'stun' | 'root' | 'slow' | 'polymorph' | 'fear' | 'corruption'; duration: number; startTime: number }[];
        enemies: Record<string, { id: string; type: 'stun' | 'root' | 'slow' | 'polymorph' | 'fear' | 'corruption'; duration: number; startTime: number }[]>;
    };
    applyStatusEffect: (targetId: string, effect: { id: string; type: 'stun' | 'root' | 'slow' | 'polymorph' | 'fear' | 'corruption'; duration: number; startTime: number }) => void;
    removeStatusEffect: (targetId: string, effectId: string) => void;

    resetMatch: () => void;

    // Missing properties
    useAbility: (abilityName: string, cooldown: number) => boolean;
    addProjectile: (projectile: any) => void; // Using any to avoid circular dependency or complex type for now, or better: import Projectile type
    removeProjectile: (id: string) => void;
    projectiles: any[];

    startCast: (abilityName: string, duration: number, onComplete: () => void) => void;
    cancelCast: () => void;
    casting: { abilityName: string; startTime: number; duration: number; onComplete: () => void } | null;

    damagePlayer: (amount: number) => void;
    damageTarget: (amount: number) => void;

    applyDot: (targetId: string, dot: { id: string, damage: number, duration: number, type?: string }) => void;
    startChannel: (abilityName: string, duration: number, onTick: () => void, onComplete: () => void) => void;
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
    allies: {},
    matchState: 'active',
    gameState: 'menu',

    setTarget: (id) => set({ targetId: id }),

    registerEnemy: (id, maxHealth, className) => set((state) => ({
        enemies: { ...state.enemies, [id]: { health: maxHealth, maxHealth, class: className } }
    })),

    removeEnemy: (id) => set((state) => {
        const { [id]: _, ...rest } = state.enemies;
        const newState = {
            enemies: rest,
            targetId: state.targetId === id ? null : state.targetId
        };

        if (Object.keys(rest).length === 0) {
            // SoundManager.getInstance().stopMusic(); // Keep music playing
            return { ...newState, matchState: 'victory' };
        }
        return newState;
    }),

    damageEnemy: (id, amount) => set((state) => {
        const enemy = state.enemies[id];
        if (!enemy) return {};

        const newHealth = Math.max(0, enemy.health - amount);
        console.log(`Enemy ${id} took ${amount} damage. Health: ${newHealth}/${enemy.maxHealth}`);
        SoundManager.getInstance().playHit();

        return {
            enemies: {
                ...state.enemies,
                [id]: { ...enemy, health: newHealth }
            }
        };
    }),

    registerAlly: (id, maxHealth, className) => set((state) => ({
        allies: { ...state.allies, [id]: { health: maxHealth, maxHealth, class: className } }
    })),

    damageAlly: (id, amount) => set((state) => {
        const ally = state.allies[id];
        if (!ally) return {};
        const newHealth = Math.max(0, ally.health - amount);
        SoundManager.getInstance().playHit();
        return {
            allies: { ...state.allies, [id]: { ...ally, health: newHealth } }
        };
    }),

    removeAlly: (id) => set((state) => {
        const { [id]: _, ...rest } = state.allies;
        return { allies: rest };
    }),

    damagePlayer: (amount) => set((state) => {
        const newHealth = Math.max(0, state.player.health - amount);
        SoundManager.getInstance().playHit();
        if (newHealth === 0) {
            // SoundManager.getInstance().stopMusic(); // Keep music playing
            return {
                player: { ...state.player, health: 0 },
                matchState: 'defeat'
            };
        }
        return { player: { ...state.player, health: newHealth } };
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

            // Simple audio mapping
            const cls = get().currentClass;
            if (cls === 'Warrior' || cls === 'Paladin') {
                SoundManager.getInstance().playAttack('melee');
            } else {
                SoundManager.getInstance().playAttack('ranged');
            }

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

    setGameState: (gameState) => {
        if (gameState === 'playing') {
            SoundManager.getInstance().startMusic();
        }
        // else {
        //    SoundManager.getInstance().stopMusic(); // Keep music playing
        // }
        set({ gameState });
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

    applyStatusEffect: (targetId, effect) => {
        set((state) => {
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
        });

        // Auto-remove effect after duration
        setTimeout(() => {
            get().removeStatusEffect(targetId, effect.id);
        }, effect.duration * 1000);
    },

    applyDot: (targetId, dot) => {
        // Simple interval based DOT
        let ticks = 0;
        const interval = setInterval(() => {
            ticks++;
            if (targetId === 'player') {
                get().damagePlayer(dot.damage);
            } else {
                get().damageEnemy(targetId, dot.damage);
            }

            if (ticks >= dot.duration) {
                clearInterval(interval);
            }
        }, 1000);

        // Add visual status effect if type is provided
        if (dot.type) {
            get().applyStatusEffect(targetId, {
                id: dot.id,
                type: dot.type as any,
                duration: dot.duration,
                startTime: Date.now()
            });
        }
    },

    startChannel: (abilityName, duration, onTick, onComplete) => {
        set({ casting: { abilityName, startTime: Date.now(), duration, onComplete } });

        let ticks = 0;
        const interval = setInterval(() => {
            ticks++;
            if (onTick) onTick();
            if (ticks >= duration) {
                clearInterval(interval);
            }
        }, 1000);

        setTimeout(() => {
            const state = get();
            if (state.casting && state.casting.abilityName === abilityName) {
                if (state.casting.onComplete) state.casting.onComplete();
                set({ casting: null });
                clearInterval(interval); // Ensure interval stops if cast finishes naturally
            }
        }, duration * 1000);
    },

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

    resetMatch: () => set((state) => {
        // Reset player health based on class
        const cls = Classes[state.currentClass as keyof typeof Classes];
        SoundManager.getInstance().startMusic();
        return {
            player: {
                health: cls.stats.maxHealth,
                maxHealth: cls.stats.maxHealth,
                resource: cls.stats.maxResource,
                maxResource: cls.stats.maxResource,
            },
            matchState: 'active',
            enemies: {}, // Will be re-registered by components
            allies: {}, // Will be re-registered by components
            projectiles: [],
            statusEffects: { player: [], enemies: {} },
            casting: null,
            targetId: null
        };
    }),
}));
