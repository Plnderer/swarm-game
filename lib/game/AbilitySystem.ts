import { GAME_CONFIG } from '../../constants/gameConfig';
import { FlockState } from '../simulation/WorkletFlock';
import { AbilityState, GameEffect, PlayerState } from '../types/game';
import { spawnEffect } from './EffectSystem';

export function createAbilityState(): AbilityState {
    'worklet';
    return {
        pulse: {
            cooldown: 0,
            maxCooldown: GAME_CONFIG.PULSE_COOLDOWN,
            isActive: false,
            activeUntil: 0,
        },
        dash: {
            cooldown: 0,
            maxCooldown: GAME_CONFIG.DASH_COOLDOWN,
            charges: GAME_CONFIG.DASH_MAX_CHARGES,
            maxCharges: GAME_CONFIG.DASH_MAX_CHARGES,
        },
        bomb: {
            cooldown: 0,
            maxCooldown: GAME_CONFIG.BOMB_COOLDOWN,
            charges: GAME_CONFIG.BOMB_STARTING_CHARGES,
            maxCharges: GAME_CONFIG.BOMB_MAX_CHARGES,
        },
    };
}

export function updateAbilityCooldowns(abilities: AbilityState, dt: number) {
    'worklet';
    // Pulse
    if (abilities.pulse.cooldown > 0) {
        abilities.pulse.cooldown = Math.max(0, abilities.pulse.cooldown - dt);
    }

    // Dash charges
    if (abilities.dash.charges < abilities.dash.maxCharges) {
        abilities.dash.cooldown -= dt;
        if (abilities.dash.cooldown <= 0) {
            abilities.dash.charges++;
            abilities.dash.cooldown = abilities.dash.maxCooldown;
        }
    }

    // Bomb charges
    if (abilities.bomb.charges < abilities.bomb.maxCharges) {
        abilities.bomb.cooldown -= dt;
        if (abilities.bomb.cooldown <= 0) {
            abilities.bomb.charges++;
            abilities.bomb.cooldown = abilities.bomb.maxCooldown;
        }
    }
}

export function triggerPulse(
    player: PlayerState,
    abilities: AbilityState,
    enemyState: FlockState,
    effects: GameEffect[],
    currentTime: number
): number {
    'worklet';
    if (abilities.pulse.cooldown > 0) return 0;

    abilities.pulse.cooldown = abilities.pulse.maxCooldown;
    abilities.pulse.isActive = true;
    abilities.pulse.activeUntil = currentTime + GAME_CONFIG.PULSE_DURATION;

    const px = player.x;
    const py = player.y;
    const radius = GAME_CONFIG.PULSE_RADIUS;
    const radiusSq = radius * radius;
    const strength = GAME_CONFIG.PULSE_STRENGTH;

    // Spawn Visual Effect
    spawnEffect(effects, 'pulse', px, py, 0.5, currentTime, radius);

    let affected = 0;

    for (let i = 0; i < enemyState.count; i++) {
        const dx = enemyState.x[i] - px;
        const dy = enemyState.y[i] - py;
        const distSq = dx * dx + dy * dy;

        if (distSq < radiusSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / radius) * strength;
            const nx = dx / dist;
            const ny = dy / dist;

            // Apply immediate impulse
            enemyState.vx[i] += nx * force * 5; // Scale up for impact
            enemyState.vy[i] += ny * force * 5;
            affected++;
        }
    }

    return affected;
}

export function triggerBomb(
    player: PlayerState,
    abilities: AbilityState,
    enemyState: FlockState,
    effects: GameEffect[],
    currentTime: number
): number {
    'worklet';
    if (abilities.bomb.charges <= 0) return 0;

    abilities.bomb.charges--;
    if (abilities.bomb.charges < abilities.bomb.maxCharges) {
        abilities.bomb.cooldown = abilities.bomb.maxCooldown;
    }

    const px = player.x;
    const py = player.y;
    const radius = GAME_CONFIG.BOMB_RADIUS;
    const radiusSq = radius * radius;
    const strength = GAME_CONFIG.BOMB_STRENGTH;
    const killRadius = GAME_CONFIG.BOMB_KILL_RADIUS;
    const killRadiusSq = killRadius * killRadius;

    // Spawn Visual Effect
    spawnEffect(effects, 'explosion', px, py, 0.4, currentTime, radius);

    let killed = 0;

    // Simple iteration for now - spatial grid optimization later if needed for this
    // (Attack is centered on player so we could optimize, but full sweep is safe for <500)
    for (let i = 0; i < enemyState.count; i++) {
        const dx = enemyState.x[i] - px;
        const dy = enemyState.y[i] - py;
        const distSq = dx * dx + dy * dy;

        if (distSq < killRadiusSq) {
            // Kill enemy - move off screen (will be cleaned up)
            enemyState.x[i] = -9999;
            enemyState.y[i] = -9999;
            enemyState.vx[i] = 0;
            enemyState.vy[i] = 0;
            killed++;
        } else if (distSq < radiusSq && distSq > 0.01) {
            // Knockback
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / radius) * strength;
            const nx = dx / dist;
            const ny = dy / dist;

            enemyState.vx[i] += nx * force * 10;
            enemyState.vy[i] += ny * force * 10;
        }
    }

    return killed;
}

export function triggerDash(
    player: PlayerState,
    abilities: AbilityState,
    effects: GameEffect[],
    currentTime: number
) {
    'worklet';
    if (abilities.dash.charges <= 0) return;

    // Use charge
    abilities.dash.charges--;
    if (abilities.dash.charges < abilities.dash.maxCharges) {
        // If we were full, start cooldown
        if (abilities.dash.charges === abilities.dash.maxCharges - 1) {
            abilities.dash.cooldown = abilities.dash.maxCooldown;
        }
    }

    // Apply Dash Effect to Player
    // Dash in movement direction or facing direction
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    const dashSpeed = GAME_CONFIG.DASH_SPEED || 1000; // Define in config if missing

    // If stationary, dash right? Or touch direction?
    // We don't have touch pos here easily unless passed.
    // Let's assume player.vx/vy is current movement. 
    // If 0, maybe no dash? Or dash forward (if we had facing).
    // For now, only dash if moving or have slight velocity.

    if (speed > 1) {
        const nx = player.vx / speed;
        const ny = player.vy / speed;
        player.vx = nx * dashSpeed;
        player.vy = ny * dashSpeed;
    } else {
        // Dash right default?
        player.vx = dashSpeed;
    }

    player.isDashing = true;
    player.dashEndTime = currentTime + GAME_CONFIG.DASH_DURATION;
    player.isInvincible = true;
    player.invincibleUntil = currentTime + GAME_CONFIG.DASH_DURATION + 0.2; // Extra iframe
}
