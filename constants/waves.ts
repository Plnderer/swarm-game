import { WaveConfig } from "../lib/types/game";

export const CAMPAIGN_WAVES: WaveConfig[] = [
    {
        waveNumber: 1,
        bonusTime: 3,
        announcement: "WAVE 1: WARM UP",
        spawns: [
            { delay: 1, enemyType: 'swarm', count: 5, spawnEdge: 'top', formation: 'random' },
            { delay: 5, enemyType: 'swarm', count: 5, spawnEdge: 'random', formation: 'random' },
            { delay: 10, enemyType: 'swarm', count: 8, spawnEdge: 'all', formation: 'circle' }
        ]
    },
    {
        waveNumber: 2,
        bonusTime: 3,
        announcement: "WAVE 2: SWARM INCOMING",
        spawns: [
            { delay: 1, enemyType: 'swarm', count: 10, spawnEdge: 'left', formation: 'line' },
            { delay: 4, enemyType: 'swarm', count: 10, spawnEdge: 'right', formation: 'line' },
            { delay: 8, enemyType: 'hunter', count: 2, spawnEdge: 'top', formation: 'random' } // Intro Hunters
        ]
    },
    {
        waveNumber: 3,
        bonusTime: 5,
        announcement: "WAVE 3: DON'T STOP",
        spawns: [
            { delay: 0, enemyType: 'swarm', count: 15, spawnEdge: 'all', formation: 'circle' },
            { delay: 10, enemyType: 'swarm', count: 15, spawnEdge: 'all', formation: 'circle' }
        ]
    },
    // More waves can be added here
];
