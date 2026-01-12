import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HUDProps {
    score: number;
    health: number;
    maxHealth: number;
    wave: number;
    pulseCooldown: number;
    combo: number;
    comboMultiplier: number;
    announcement: string | null;
}

export const HUD = ({ score, health, maxHealth, wave, pulseCooldown, combo, comboMultiplier, announcement }: HUDProps) => {
    const insets = useSafeAreaInsets();

    // Create hearts array
    const hearts = Array.from({ length: maxHealth }, (_, i) => i < health);

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
            {/* Announcement Overlay */}
            {announcement && (
                <View style={styles.announcementContainer}>
                    <Text style={styles.announcementText}>{announcement}</Text>
                </View>
            )}

            {/* Top Bar */}
            <View style={styles.topBar}>
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreLabel}>SCORE</Text>
                    <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
                    {combo > 1 && (
                        <Text style={styles.comboText}>{combo}x COMBO!</Text>
                    )}
                </View>

                <View style={styles.waveContainer}>
                    <Text style={styles.waveLabel}>WAVE {wave}</Text>
                </View>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                {/* Health */}
                <View style={styles.healthContainer}>
                    {hearts.map((filled, i) => (
                        <Ionicons
                            key={i}
                            name={filled ? "heart" : "heart-outline"}
                            size={32}
                            color="#FF4444"
                            style={{ marginRight: 4 }}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        pointerEvents: 'none', // Allow touches to pass through to game canvas
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    scoreContainer: {
        alignItems: 'flex-start',
    },
    scoreLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    scoreValue: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    comboText: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    waveContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
    },
    waveLabel: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    healthContainer: {
        flexDirection: 'row',
    },
    abilityContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    abilityIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 255, 255, 0.2)',
        borderWidth: 2,
        borderColor: '#00FFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    abilityDisabled: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderColor: '#555',
    },
    abilityText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cooldownText: {
        position: 'absolute',
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    announcementContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 10,
    },
    announcementText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
    },
});
