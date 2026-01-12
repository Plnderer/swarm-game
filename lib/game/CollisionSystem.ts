import { GAME_CONFIG } from '../../constants/gameConfig';
import { FlockState } from '../simulation/WorkletFlock';
import { PlayerState } from '../types/game';

export interface CollisionResult {
    hit: boolean;
    enemyIndex: number;
}

export function checkPlayerEnemyCollisions(
    player: PlayerState,
    enemyState: FlockState,
    currentTime: number
): CollisionResult[] {
    'worklet';
    const results: CollisionResult[] = [];

    if (player.isInvincible) return results;

    const px = player.x;
    const py = player.y;
    const pr = player.radius;
    const enemyRadius = GAME_CONFIG.ENEMY_BOID_RADIUS;
    const collisionDist = pr + enemyRadius;
    const collisionDistSq = collisionDist * collisionDist;

    for (let i = 0; i < enemyState.count; i++) {
        const dx = enemyState.x[i] - px;
        const dy = enemyState.y[i] - py;
        const distSq = dx * dx + dy * dy;

        if (distSq < collisionDistSq) {
            results.push({ hit: true, enemyIndex: i });
            // Only count one hit per frame for fairness
            break;
        }
    }

    return results;
}

// For enemy-vs-enemy (friendly fire from abilities)
export function checkEnemyExplosionDamage(
    centerX: number,
    centerY: number,
    radius: number,
    enemyState: FlockState
): number[] {
    'worklet';
    const affected: number[] = [];
    const radiusSq = radius * radius;

    for (let i = 0; i < enemyState.count; i++) {
        const dx = enemyState.x[i] - centerX;
        const dy = enemyState.y[i] - centerY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radiusSq) {
            affected.push(i);
        }
    }

    return affected;
}
