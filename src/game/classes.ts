export type Ability = {
    id: string;
    name: string;
    cooldown: number;
    damage?: number;
    range?: number;
    cost?: number;
    icon?: string; // Placeholder for now
};

export type CharacterClass = {
    name: string;
    abilities: {
        action1: Ability;
        action2: Ability;
        action3: Ability;
        action4: Ability;
        action5: Ability;
    };
    stats: {
        maxHealth: number;
        maxResource: number;
        resourceName: string;
    };
};

export const Warrior: CharacterClass = {
    name: 'Warrior',
    stats: {
        maxHealth: 150,
        maxResource: 100,
        resourceName: 'Rage',
    },
    abilities: {
        action1: { id: 'strike', name: 'Strike', cooldown: 1.5, damage: 15, range: 3 },
        action2: { id: 'charge', name: 'Charge', cooldown: 12, damage: 5, range: 20 },
        action3: { id: 'whirlwind', name: 'Whirlwind', cooldown: 8, damage: 10, range: 5 },
        action4: { id: 'shield_bash', name: 'Shield Bash', cooldown: 10, damage: 5, range: 3 },
        action5: { id: 'execute', name: 'Execute', cooldown: 20, damage: 50, range: 3 },
    },
};

export const Mage: CharacterClass = {
    name: 'Mage',
    stats: {
        maxHealth: 80,
        maxResource: 200,
        resourceName: 'Mana',
    },
    abilities: {
        action1: { id: 'fireball', name: 'Fireball', cooldown: 2, damage: 25, range: 30 },
        action2: { id: 'frost_nova', name: 'Frost Nova', cooldown: 15, damage: 5, range: 8 },
        action3: { id: 'blink', name: 'Blink', cooldown: 10, range: 20 },
        action4: { id: 'polymorph', name: 'Polymorph', cooldown: 20, range: 20 },
        action5: { id: 'pyroblast', name: 'Pyroblast', cooldown: 6, damage: 40, range: 30 },
    },
};

export const Classes = {
    Warrior,
    Mage,
};
