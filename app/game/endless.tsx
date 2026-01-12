import GameCanvas from '@/components/game/GameCanvas';
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function SwarmGameScreen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
            <GameCanvas />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
});
