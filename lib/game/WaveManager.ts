import { CAMPAIGN_WAVES } from "../../constants/waves";
import { SpawnEvent } from "../../lib/types/game";
import { FlockState } from "../simulation/WorkletFlock";
import { getSpawnPosition, spawnEnemySwarm } from "./EnemyManager";

export interface WaveState {
    currentWaveIndex: number; // 0-based index for CAMPAIGN_WAVES
    waveNumber: number; // Display number
    waveStartTime: number; // Time when wave started
    nextSpawnIndex: number; // Index in spawns array
    isWaveActive: boolean;
    isWaveComplete: boolean;
    announcement: string | null;
    announcementTime: number;
}

export function createWaveState(): WaveState {
    'worklet';
    return {
        currentWaveIndex: 0,
        waveNumber: 1,
        waveStartTime: 0,
        nextSpawnIndex: 0,
        isWaveActive: false, // Wait for start
        isWaveComplete: false,
        announcement: "PREPARE YOURSELF",
        announcementTime: 0,
    };
}

export function updateWaveLogic(
    waveState: WaveState,
    enemyState: FlockState,
    currentTime: number,
    screenWidth: number,
    screenHeight: number
) {
    'worklet';

    // Start Wave 1 immediately if not active
    if (!waveState.isWaveActive && waveState.currentWaveIndex === 0 && waveState.waveStartTime === 0) {
        startWave(waveState, 0, currentTime);
    }

    if (!waveState.isWaveActive) return;

    const waveConfig = CAMPAIGN_WAVES[waveState.currentWaveIndex];
    if (!waveConfig) return; // Should not happen if index valid

    const waveTime = currentTime - waveState.waveStartTime;

    // 1. Process Spawns
    while (waveState.nextSpawnIndex < waveConfig.spawns.length) {
        const spawn = waveConfig.spawns[waveState.nextSpawnIndex];
        if (waveTime >= spawn.delay) {
            // Trigger Spawn
            executeSpawn(spawn, enemyState, screenWidth, screenHeight);
            waveState.nextSpawnIndex++;
        } else {
            break; // Next spawn is in future
        }
    }

    // 2. Check Completion
    // Wave is complete IF:
    // - All spawns are done
    // - Enemy count is 0 (or low threshold?)
    // - Min wave duration passed?

    // For now: Just clear enemies after all spawns
    const allSpawnsDone = waveState.nextSpawnIndex >= waveConfig.spawns.length;

    if (allSpawnsDone && enemyState.count === 0) {
        // Wave Complete!
        completeWave(waveState, currentTime);
    }
}

function startWave(waveState: WaveState, index: number, currentTime: number) {
    'worklet';
    const config = CAMPAIGN_WAVES[index];
    if (!config) {
        // End of Campaign?
        waveState.announcement = "VICTORY!";
        waveState.announcementTime = currentTime;
        return;
    }

    waveState.currentWaveIndex = index;
    waveState.waveNumber = config.waveNumber;
    waveState.waveStartTime = currentTime;
    waveState.nextSpawnIndex = 0;
    waveState.isWaveActive = true;
    waveState.isWaveComplete = false;

    if (config.announcement) {
        waveState.announcement = config.announcement;
        waveState.announcementTime = currentTime;
    }
}

function completeWave(waveState: WaveState, currentTime: number) {
    'worklet';
    waveState.isWaveComplete = true;
    waveState.isWaveActive = false;

    // Auto-advance after delay? 
    // Or waits for bonus time?
    // Let's simplified: 3s delay then next
    // But we need a state for "between waves".

    // Hack: Just restart next wave directly for flow now, usually we'd have a 'wave_end' phase.
    // Let's use negative startTime or separate phase tracker in future.
    // For now, immediately start next wave for continuous action.

    startWave(waveState, waveState.currentWaveIndex + 1, currentTime + 3.0);
    waveState.waveStartTime = currentTime + 3.0; // Delay start
}

function executeSpawn(
    spawn: SpawnEvent,
    enemyState: FlockState,
    screenWidth: number,
    screenHeight: number
) {
    'worklet';
    // Distribute count across edge?
    // getSpawnPosition logic needs to handle 'total' for distribution

    // If 'all' edges, split count
    // Use simple loop calling EnemyManager

    for (let i = 0; i < spawn.count; i++) {
        const pos = getSpawnPosition(spawn.spawnEdge, i, spawn.count, screenWidth, screenHeight);

        // Use EnemyManager's spawn (single) or modify spawnEnemySwarm to take x/y
        // spawnEnemySwarm takes a center x/y and radius.
        // We want precise placement for formations?
        // Let's just use spawnEnemySwarm with radius 5 at pos

        spawnEnemySwarm(
            enemyState,
            spawn.enemyType,
            1, // Spawn 1 at a time to use getSpawnPosition distribution
            pos.x,
            pos.y,
            5
        );
    }
}
