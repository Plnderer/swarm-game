import { useGameStore } from '@/lib/store/gameStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsSheet from '../SettingsSheet';

export default function MainMenu() {
    const router = useRouter();
    const highScore = useGameStore(s => s.highScore);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>SWARM</Text>
                    <Text style={styles.subtitle}>SURVIVAL</Text>
                    <Text style={styles.highScore}>HIGH SCORE: {highScore.toLocaleString()}</Text>
                </View>

                {/* Menu Buttons */}
                <View style={styles.menuButtons}>
                    <TouchableOpacity
                        style={[styles.button, styles.playButton]}
                        onPress={() => router.push('/game/endless')}
                    >
                        <Ionicons name="play" size={24} color="#000" style={{ marginRight: 8 }} />
                        <Text style={styles.playButtonText}>PLAY CAMPAIGN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        disabled={true} // Feature flag: Endless later
                    >
                        <Ionicons name="infinite" size={24} color="rgba(255,255,255,0.3)" style={{ marginRight: 8 }} />
                        <Text style={styles.secondaryButtonText}>ENDLESS (SOON)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={() => setIsSettingsOpen(true)}
                    >
                        <Ionicons name="settings-sharp" size={24} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.secondaryButtonText}>SETTINGS</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>v0.3.0 - Phase 4</Text>
            </View>

            {/* Settings Sheet */}
            {isSettingsOpen && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <SettingsSheet onClose={() => setIsSettingsOpen(false)} />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a12',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    titleContainer: {
        marginBottom: 60,
        alignItems: 'center',
    },
    title: {
        fontSize: 72,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 8,
        textShadowColor: '#00FFFF',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    subtitle: {
        fontSize: 18,
        color: '#00FFFF',
        letterSpacing: 4,
        fontWeight: '600',
        marginTop: 5,
    },
    highScore: {
        marginTop: 20,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    menuButtons: {
        width: '100%',
        maxWidth: 300,
        gap: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
    },
    playButton: {
        backgroundColor: '#00FFFF',
        borderColor: '#00FFFF',
        shadowColor: '#00FFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 5,
    },
    playButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    secondaryButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 1,
    },
    version: {
        position: 'absolute',
        bottom: 40,
        color: 'rgba(255,255,255,0.2)',
        fontSize: 12,
    }
});
