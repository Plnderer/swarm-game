import { GAME_CONFIG } from '../../constants/gameConfig';
import { PlayerState } from '../types/game';

export function createPlayerState(screenWidth: number, screenHeight: number): PlayerState {
    'worklet';
    return {
        x: screenWidth / 2,
        y: screenHeight / 2,
        vx: 0,
        vy: 0,
        radius: GAME_CONFIG.PLAYER_RADIUS,
        health: GAME_CONFIG.PLAYER_MAX_HEALTH,
        maxHealth: GAME_CONFIG.PLAYER_MAX_HEALTH,
        isInvincible: false,
        invincibleUntil: 0,
        isDashing: false,
        dashEndTime: 0,
    };
}

export function updatePlayer(
    player: PlayerState,
    targetX: number,
    targetY: number,
    isMoving: boolean,
    dt: number,
    currentTime: number,
    screenWidth: number,
    screenHeight: number
) {
    'worklet';

    // Update invincibility
    if (player.isInvincible && currentTime > player.invincibleUntil) {
        player.isInvincible = false;
    }

    // Update dash
    if (player.isDashing && currentTime > player.dashEndTime) {
        player.isDashing = false;
    }

    if (!player.isDashing && isMoving) {
        // Move toward target position
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Deadzone and smoother movement
        if (dist > 5) {
            const speed = GAME_CONFIG.PLAYER_SPEED;
            // Simple P-controller like movement
            player.vx = (dx / dist) * speed * 60; // Scale for frame-based velocity
            player.vy = (dy / dist) * speed * 60;
        } else {
            player.vx = 0;
            player.vy = 0;
        }

        // Direct position update for "follow finger" feel (optional, but requested drag behavior)
        // If we want physics-based verify, we use velocity. 
        // "Touch & Drag: Player follows finger position" usually means direct 1:1 or lerp.
        // Let's stick thereto velocity for physics compatibility with flock but make it snappy.
        const lerp = 0.15;
        player.x += (targetX - player.x) * lerp;
        player.y += (targetY - player.y) * lerp;

    } else if (!player.isDashing) {
        // Friction when not moving
        player.vx *= 0.9;
        player.vy *= 0.9;

        player.x += player.vx * dt;
        player.y += player.vy * dt;
    } else {
        // Dashing - strict velocity movement
        player.x += player.vx * dt;
        player.y += player.vy * dt;
    }

    // Clamp to screen
    const r = player.radius;
    player.x = Math.max(r, Math.min(screenWidth - r, player.x));
    player.y = Math.max(r, Math.min(screenHeight - r, player.y));
}

export function triggerDash(
    player: PlayerState,
    dirX: number,
    dirY: number,
    currentTime: number
) {
    'worklet';
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len < 0.1) return false;

    const nx = dirX / len;
    const ny = dirY / len;

    player.isDashing = true;
    player.isInvincible = true;
    player.dashEndTime = currentTime + GAME_CONFIG.DASH_DURATION;
    player.invincibleUntil = currentTime + GAME_CONFIG.DASH_DURATION + 0.1;

    // Dash velocity in pixels per second
    player.vx = nx * GAME_CONFIG.DASH_SPEED * 60; // speed * 60 for frame scale
    player.vy = ny * GAME_CONFIG.DASH_SPEED * 60;

    return true;
}

export function damagePlayer(
    player: PlayerState,
    damage: number,
    currentTime: number
): boolean {
    'worklet';
    if (player.isInvincible) return false;

    player.health -= damage;
    player.isInvincible = true;
    player.invincibleUntil = currentTime + GAME_CONFIG.DAMAGE_INVINCIBILITY;

    return player.health <= 0; // Returns true if dead
}
