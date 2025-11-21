export type Ability = {
    id: string;
    name: string;
    cooldown: number;
    damage?: number;
    range?: number;
    cost?: number;
    castTime?: number;
    channelTime?: number; // Added channelTime
    dot?: boolean; // Added dot
    icon?: string;
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
        action1: { id: 'frostbolt', name: 'Frostbolt', cooldown: 2, damage: 20, range: 30, castTime: 1.5 },
        action2: { id: 'frost_nova', name: 'Frost Nova', cooldown: 15, damage: 5, range: 8 },
        action3: { id: 'blink', name: 'Blink', cooldown: 10, range: 20 },
        action4: { id: 'polymorph', name: 'Polymorph', cooldown: 20, range: 20, castTime: 1.5 },
        action5: { id: 'glacial_spike', name: 'Glacial Spike', cooldown: 6, damage: 60, range: 30, castTime: 3.0 },
    },
};

export const Warlock: CharacterClass = {
    name: 'Warlock',
    stats: {
        maxHealth: 100,
        maxResource: 100,
        resourceName: 'Mana',
    },
    abilities: {
        action1: { id: 'shadow_bolt', name: 'Shadow Bolt', cooldown: 2.5, damage: 20, range: 30, castTime: 1.5 },
        action2: { id: 'corruption', name: 'Corruption', cooldown: 0, damage: 5, range: 30, dot: true },
        action3: { id: 'fear', name: 'Fear', cooldown: 15, range: 20, castTime: 1.5 },
        action4: { id: 'life_drain', name: 'Life Drain', cooldown: 10, damage: 10, range: 20, channelTime: 4 },
        action5: { id: 'chaos_bolt', name: 'Chaos Bolt', cooldown: 12, damage: 45, range: 30, castTime: 2.5 },
    },
};

export const Paladin: CharacterClass = {
    name: 'Paladin',
    stats: {
        maxHealth: 140,
        maxResource: 100,
        resourceName: 'Mana',
    },
    abilities: {
        action1: { id: 'crusader_strike', name: 'Crusader Strike', cooldown: 4, damage: 20, range: 3 },
        action2: { id: 'judgment', name: 'Judgment', cooldown: 8, damage: 15, range: 20 },
        action3: { id: 'holy_light', name: 'Holy Light', cooldown: 2.5, damage: -30, range: 30, castTime: 2.0 },
        action4: { id: 'hammer_of_justice', name: 'Hammer of Justice', cooldown: 30, damage: 5, range: 10 },
        action5: { id: 'divine_storm', name: 'Divine Storm', cooldown: 10, damage: 25, range: 8 },
    },
};

export const Classes = {
    Warrior,
    Mage,
    Warlock,
    Paladin,
};
