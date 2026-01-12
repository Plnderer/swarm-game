import MainMenu from '@/components/menu/MainMenu';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';

export default function HomeScreen() {
    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar style="light" />
            <MainMenu />
        </View>
    );
}
