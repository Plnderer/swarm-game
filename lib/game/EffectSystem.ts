import { EffectType, GameEffect } from "../types/game";

export const MAX_EFFECTS = 20;

export function createEffectState(): GameEffect[] {
    'worklet';
    const effects: GameEffect[] = [];
    for (let i = 0; i < MAX_EFFECTS; i++) {
        effects.push({
            id: -1,
            type: 'pulse',
            x: 0,
            y: 0,
            startTime: 0,
            duration: 0,
            data: 0
        });
    }
    return effects;
}

export function spawnEffect(
    effects: GameEffect[],
    type: EffectType,
    x: number,
    y: number,
    duration: number,
    currentTime: number,
    data: number = 0
) {
    'worklet';
    // Find free slot
    for (let i = 0; i < MAX_EFFECTS; i++) {
        if (effects[i].id === -1 || currentTime > effects[i].startTime + effects[i].duration) {
            effects[i].id = currentTime + Math.random(); // Simple ID
            effects[i].type = type;
            effects[i].x = x;
            effects[i].y = y;
            effects[i].startTime = currentTime;
            effects[i].duration = duration;
            effects[i].data = data;
            return;
        }
    }
}
