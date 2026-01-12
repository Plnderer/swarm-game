import { FlockState } from '../simulation/WorkletFlock';
import { EnemyType, SpawnEvent, SwarmBehavior } from '../types/game';

const ENEMY_BEHAVIORS: Record<EnemyType, SwarmBehavior> = {
    swarm: {
        chasePlayer: true,
        chaseStrength: 1.5,
        flockStrength: 1.0,
        speed: 3,
        perception: 40,
    },
    hunter: {
        chasePlayer: true,
        chaseStrength: 3.0,
        flockStrength: 0.3,
        speed: 5,
        perception: 30,
    },
    tank: {
        chasePlayer: true,
        chaseStrength: 1.0,
        flockStrength: 2.0,
        speed: 1.5,
        perception: 60,
    },
    splitter: {
        chasePlayer: true,
        chaseStrength: 2.0,
        flockStrength: 0.5,
        speed: 4,
        perception: 35,
    },
    boss: {
        chasePlayer: true,
        chaseStrength: 0.8,
        flockStrength: 3.0,
        speed: 2,
        perception: 100,
    },
};

export function getSpawnPosition(
    edge: SpawnEvent['spawnEdge'],
    index: number,
    total: number,
    screenWidth: number,
    screenHeight: number
): { x: number, y: number } {
    'worklet';
    const margin = 50;

    let actualEdge = edge;
    if (edge === 'random') {
        const edges: SpawnEvent['spawnEdge'][] = ['top', 'bottom', 'left', 'right'];
        actualEdge = edges[Math.floor(Math.random() * 4)];
    } else if (edge === 'all') {
        const edges: SpawnEvent['spawnEdge'][] = ['top', 'bottom', 'left', 'right'];
        actualEdge = edges[index % 4];
    }

    const spread = 0.8; // Use 80% of edge length
    const offset = (index / Math.max(1, total - 1) - 0.5) * spread;

    switch (actualEdge) {
        case 'top':
            return { x: screenWidth / 2 + offset * screenWidth, y: -margin };
        case 'bottom':
            return { x: screenWidth / 2 + offset * screenWidth, y: screenHeight + margin };
        case 'left':
            return { x: -margin, y: screenHeight / 2 + offset * screenHeight };
        case 'right':
            return { x: screenWidth + margin, y: screenHeight / 2 + offset * screenHeight };
        default:
            return { x: -margin, y: screenHeight / 2 };
    }
}

export function spawnEnemySwarm(
    state: FlockState,
    enemyType: EnemyType,
    count: number,
    spawnX: number,
    spawnY: number,
    spawnRadius: number = 30
): { startIndex: number, count: number } {
    'worklet';
    const startIndex = state.count;
    const behavior = ENEMY_BEHAVIORS[enemyType];
    const maxIdx = state.x.length;

    // Find continuous block of free slots (simple append for now)
    // In a real pool we'd scan for -1 or dead flags

    for (let i = 0; i < count && state.count < maxIdx; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spawnRadius;

        const idx = state.count;
        state.x[idx] = spawnX + Math.cos(angle) * dist;
        state.y[idx] = spawnY + Math.sin(angle) * dist;
        state.vx[idx] = (Math.random() - 0.5) * behavior.speed;
        state.vy[idx] = (Math.random() - 0.5) * behavior.speed;
        state.count++;
    }

    return { startIndex, count: state.count - startIndex };
}

export function updateEnemyAI(
    state: FlockState,
    playerX: number,
    playerY: number,
    dt: number,
    screenWidth: number,
    screenHeight: number
) {
    'worklet';
    // This modifies the standard flock update to chase player
    // Call AFTER standard flocking physics

    const chaseStrength = 0.2; // Base chase factor

    for (let i = 0; i < state.count; i++) {
        const px = state.x[i];
        const py = state.y[i];

        // Skip dead/offscreen enemies
        if (px < -100 || px > screenWidth + 100 || py < -100 || py > screenHeight + 100) continue;

        // Add force toward player
        const dx = playerX - px;
        const dy = playerY - py;
        const distSq = dx * dx + dy * dy;

        if (distSq > 100) {
            const dist = Math.sqrt(distSq);
            // Normalize and add force
            state.vx[i] += (dx / dist) * chaseStrength;
            state.vy[i] += (dy / dist) * chaseStrength;
        }
    }
}
