import { Canvas, Fill } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS, useFrameCallback, useSharedValue } from "react-native-reanimated";
import { GAME_CONFIG } from "../../constants/gameConfig";
import { createAbilityState, triggerBomb, triggerDash, triggerPulse, updateAbilityCooldowns } from "../../lib/game/AbilitySystem";
import { checkPlayerEnemyCollisions } from "../../lib/game/CollisionSystem";
import { addCombo, createComboState, updateCombo } from "../../lib/game/ComboSystem";
import { createEffectState } from "../../lib/game/EffectSystem";
import { updateEnemyAI } from "../../lib/game/EnemyManager";
import { createPlayerState, damagePlayer, updatePlayer } from "../../lib/game/PlayerController";
import { createWaveState, updateWaveLogic } from "../../lib/game/WaveManager";
import { FlockState, initUIFlock, resetUIFlock, updateFlock } from "../../lib/simulation/WorkletFlock";
import { EnemySwarm } from "./EnemySwarm";
import { HUD } from "./HUD";
import { Player } from "./Player";
import { VisualEffects } from "./VisualEffects";

import { useRouter } from "expo-router";
import { useGameStore } from "../../lib/store/gameStore";

export default function GameCanvas() {
    const { width, height } = useWindowDimensions();
    const router = useRouter();

    // Game State
    const [score, setScore] = useState(0);
    const [health, setHealth] = useState(GAME_CONFIG.PLAYER_MAX_HEALTH);
    const [wave, setWave] = useState(1);
    const [isGameOver, setIsGameOver] = useState(false);
    const [pulseCooldown, setPulseCooldown] = useState(0);
    const [combo, setCombo] = useState(0);
    const [multiplier, setMultiplier] = useState(1);
    const [announcement, setAnnouncement] = useState<string | null>(null);

    // High Score Check
    useEffect(() => {
        if (isGameOver) {
            useGameStore.getState().checkHighScore(score);
        }
    }, [isGameOver, score]);

    // Shared Values for Worklet
    const playerState = useSharedValue(createPlayerState(width, height));
    const enemyState = useSharedValue<FlockState | null>(null);
    const abilityState = useSharedValue(createAbilityState());
    const effectState = useSharedValue(createEffectState());
    const comboState = useSharedValue(createComboState());
    const waveState = useSharedValue(createWaveState());
    const gameTime = useSharedValue(0);

    // Helper to init flock safely
    useEffect(() => {
        // 500 max enemies
        initUIFlock(enemyState, GAME_CONFIG.MAX_ENEMIES, width, height, 0);
        return () => {
            resetUIFlock(enemyState);
        };
    }, [width, height]);

    // Touch Handling - Pan for Movement
    const touchPos = useSharedValue({ x: width / 2, y: height / 2, active: false });

    const panGesture = Gesture.Pan()
        .onStart((e) => {
            touchPos.value = { x: e.x, y: e.y, active: true };
        })
        .onUpdate((e) => {
            touchPos.value = { x: e.x, y: e.y, active: true };
        })
        .onEnd(() => {
            touchPos.value = { ...touchPos.value, active: false };
        });

    // Game Loop
    useFrameCallback((frameInfo) => {
        if (!enemyState.value || isGameOver) return;

        const dt = (frameInfo.timeSincePreviousFrame || 16) / 1000;
        const currentTime = frameInfo.timeSinceFirstFrame / 1000;
        gameTime.value = currentTime;

        // 1. Update Player
        updatePlayer(
            playerState.value,
            touchPos.value.x,
            touchPos.value.y,
            touchPos.value.active,
            dt,
            currentTime,
            width,
            height
        );

        // 2. Update Abilities & Combo
        updateAbilityCooldowns(abilityState.value, dt);
        updateCombo(comboState.value, dt);

        // Sync UI (throttled)
        if (frameInfo.timeSinceFirstFrame % 10 < dt) {
            runOnJS(setPulseCooldown)(abilityState.value.pulse.cooldown);
            runOnJS(setCombo)(comboState.value.count);
            runOnJS(setMultiplier)(comboState.value.multiplier);
            runOnJS(setScore)(comboState.value.score); // Sync Score
            runOnJS(setWave)(waveState.value.waveNumber);

            // Sync Announcement
            if (waveState.value.announcement) {
                runOnJS(setAnnouncement)(waveState.value.announcement);
                // Clear it in worklet so we don't spam? 
                // Or handle transient state. Pushing logic to JS for simplicity now.
                // Ideally we track 'lastAnnouncementTime' or similar.
                // Actually, let's just pass it and let HUD handle unique-ness or fading?
                // The WaveManager sets it once on start.
                // We need to clear it after some time.
                // Better approach: WaveManager tracks time.
                // If (currentTime - announcementTime < 3) show it.
                // So pass announcement string only if active.
            } else {
                runOnJS(setAnnouncement)(null);
            }
        }

        // 3. Spawning & Waves
        updateWaveLogic(waveState.value, enemyState.value, currentTime, width, height);

        /* Removed Test Spawning
        if (enemyState.value.count < 10) {
            spawnEnemySwarm(enemyState.value, 'swarm', 5, -50, Math.random() * height);
        }
        */

        // 4. Update Enemies (Flocking + Chasing)
        // First, standard flocking
        updateFlock(enemyState.value, dt, {
            perception: 40,
            maxSpeed: 3,
            maxForce: 0.05,
            sepMult: 1.0,
            aliMult: 0.5,
            cohMult: 0.5,
            drag: 0.01,
            noise: 0.1,
            alignBias: 0,
            bounce: false
        });

        // Then AI override
        updateEnemyAI(
            enemyState.value,
            playerState.value.x,
            playerState.value.y,
            dt,
            width,
            height
        );

        // 5. Collisions
        const collisions = checkPlayerEnemyCollisions(playerState.value, enemyState.value, currentTime);
        if (collisions.length > 0) {
            const dead = damagePlayer(playerState.value, 1, currentTime);
            if (dead) {
                // Game Over
                runOnJS(setIsGameOver)(true);

                // Track High Score - pass the JS 'combo' or create a new 'score' shared value?
                // Actually 'score' is in JS state (useState).
                // But we are in a worklet callback!! We cannot read JS state 'score' directly.
                // We SHOULD use 'comboState.value.count' if that was the score, but score is cumulative.
                // We need to pass the score back via runOnJS.
                // Let's create a helper that receives the FINAL score.

                // Wait, 'damagePlayer' doesn't return score.
                // Where is score tracked? It's updated via runOnJS(setScore) in other places?
                // Ah, we haven't implemented score updating from enemy kills yet!
                // Let's assume for now we just use the combo count as a proxy or 
                // fix the fact we aren't tracking score in worklet.

                // For this jam, let's add 'score' to PlayerState or similar.
                // But to fix the lint quickly and correctly:
                // We will pass the `comboState.value.count` (as a placeholder) 
                // OR better, we triggering `setIsGameOver(true)`.
                // We can do the high score check inside a useEffect in the component when isGameOver becomes true.

                // Changing strategy: Don't check high score here. Just trigger game over.
            } else {
                runOnJS(setHealth)(playerState.value.health);
            }
        }
    });

    // Actions
    const handlePulse = () => {
        'worklet';
        if (!enemyState.value) return;
        triggerPulse(playerState.value, abilityState.value, enemyState.value, effectState.value, gameTime.value);
    };

    const handleDash = () => {
        'worklet';
        triggerDash(playerState.value, abilityState.value, effectState.value, gameTime.value);
    };

    const handleBomb = () => {
        'worklet';
        if (!enemyState.value) return;
        const killed = triggerBomb(
            playerState.value,
            abilityState.value,
            enemyState.value,
            effectState.value,
            gameTime.value
        );

        if (killed > 0) {
            addCombo(comboState.value, killed);
        }
    };

    // Tick for rendering updates
    const tick = useSharedValue(0);

    useFrameCallback((frameInfo) => {
        // Increment Tick for rendering
        tick.value += 1;
    });

    return (
        <GestureHandlerRootView style={styles.container}>
            <GestureDetector gesture={panGesture}>
                <Canvas style={styles.canvas}>
                    <Fill color="#1a0a2e" />

                    {/* Render Enemies */}
                    <EnemySwarm flock={enemyState} tick={tick} />

                    {/* Render Player */}
                    <Player playerState={playerState} gameTime={gameTime} />

                    {/* Ability Effects */}
                    <VisualEffects effects={effectState} tick={tick} gameTime={gameTime} />
                </Canvas>
            </GestureDetector>

            <HUD
                score={score}
                health={health}
                maxHealth={GAME_CONFIG.PLAYER_MAX_HEALTH}
                wave={wave}
                pulseCooldown={pulseCooldown}
                combo={combo}
                comboMultiplier={multiplier}
                announcement={announcement}
            />

            {/* Controls Overlay */}
            <View style={styles.controlsLeft}>
                <TouchableOpacity
                    style={styles.abilityBtn}
                    onPress={() => runOnJS(handleDash)()}
                >
                    <Text style={styles.btnText}>DASH</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.controlsRight}>
                <TouchableOpacity
                    style={[styles.abilityBtn, styles.pulseBtn]}
                    onPress={() => runOnJS(handlePulse)()}
                >
                    <Text style={styles.btnText}>PULSE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.abilityBtn, styles.bombBtn]}
                    onPress={() => runOnJS(handleBomb)()}
                >
                    <Text style={styles.btnText}>BOMB</Text>
                </TouchableOpacity>
            </View>

            {isGameOver && (
                <View style={styles.gameOver}>
                    <Text style={styles.gameOverText}>GAME OVER</Text>
                    <Text style={styles.scoreText}>WAVE {wave} - SCORE {score}</Text>

                    {score >= useGameStore.getState().highScore && score > 0 && (
                        <Text style={styles.newRecordText}>NEW RECORD!</Text>
                    )}

                    <View style={styles.gameOverButtons}>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => router.replace('/')}
                        >
                            <Text style={styles.menuButtonText}>MENU</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                // Simple reload for now, or reset all state
                                // Since state is complex (worklets), reload is safest for jam
                                router.replace('/game/endless');
                            }}
                        >
                            <Text style={styles.retryButtonText}>RETRY</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a0a2e',
    },
    canvas: {
        flex: 1,
    },
    controlsLeft: {
        position: 'absolute',
        bottom: 40,
        left: 40,
    },
    controlsRight: {
        position: 'absolute',
        bottom: 40,
        right: 40,
        gap: 20,
        alignItems: 'flex-end',
    },
    abilityBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    pulseBtn: {
        borderColor: '#00FFFF',
        backgroundColor: 'rgba(0, 255, 255, 0.2)',
    },
    bombBtn: {
        borderColor: '#FF4444',
        backgroundColor: 'rgba(255, 68, 68, 0.2)',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    gameOver: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gameOverText: {
        color: '#FF4444',
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 10,
    },
    scoreText: {
        color: '#fff',
        fontSize: 24,
        marginBottom: 40,
        opacity: 0.8,
    },
    newRecordText: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textShadowColor: 'rgba(255, 215, 0, 0.5)',
        textShadowRadius: 10,
    },
    gameOverButtons: {
        flexDirection: 'row',
        gap: 20,
    },
    menuButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    menuButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        backgroundColor: '#00FFFF',
    },
    retryButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
