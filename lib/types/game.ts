export interface PlayerState {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    health: number;
    maxHealth: number;
    isInvincible: boolean;
    invincibleUntil: number;  // Timestamp
    isDashing: boolean;
    dashEndTime: number;
}

export interface AbilityState {
    pulse: {
        cooldown: number;      // Current cooldown remaining (seconds)
        maxCooldown: number;
        isActive: boolean;
        activeUntil: number;
    };
    dash: {
        cooldown: number;
        maxCooldown: number;
        charges: number;       // Can store multiple dash charges
        maxCharges: number;
    };
    bomb: {
        cooldown: number;
        maxCooldown: number;
        charges: number;
        maxCharges: number;
    };
}

export type EnemyType = 'swarm' | 'hunter' | 'tank' | 'splitter' | 'boss';

export interface SwarmBehavior {
    chasePlayer: boolean;
    chaseStrength: number;   // How strongly attracted to player
    flockStrength: number;   // How much they flock with each other
    speed: number;
    perception: number;
}

export interface EnemySwarm {
    id: string;
    type: EnemyType;
    flockIndex: number;      // Index into flocks array
    boidStartIndex: number;  // Start index in shared boid arrays
    boidCount: number;
    color: number;           // ARGB int
    health?: number;         // For boss/tank types
    behavior: SwarmBehavior;
}

export type EffectType = 'pulse' | 'explosion' | 'damage_text';

export interface GameEffect {
    id: number;
    type: EffectType;
    x: number;
    y: number;
    startTime: number;
    duration: number;
    data?: number | string; // radius or damage amount
}

export interface SpawnEvent {
    delay: number;           // Seconds after wave start
    enemyType: EnemyType;
    count: number;
    spawnEdge: 'top' | 'bottom' | 'left' | 'right' | 'random' | 'all';
    formation?: 'cluster' | 'line' | 'circle' | 'random';
}

export interface WaveConfig {
    waveNumber: number;
    spawns: SpawnEvent[];
    bonusTime?: number;      // Extra time before next wave
    announcement?: string;   // "BOSS WAVE!"
}

export type PickupType = 'energy' | 'health' | 'bomb' | 'shield';

export interface Pickup {
    id: string;
    type: PickupType;
    x: number;
    y: number;
    spawnTime: number;
    lifetime: number;        // Seconds until despawn
}

export type GamePhase = 'menu' | 'countdown' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface GameState {
    phase: GamePhase;
    mode: 'endless' | 'waves' | 'zen';
    score: number;
    combo: number;
    comboTimer: number;
    waveNumber: number;
    timeElapsed: number;
    enemiesDefeated: number;
}
