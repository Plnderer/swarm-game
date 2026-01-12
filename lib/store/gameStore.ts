import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface GameState {
    highScore: number;
    setHighScore: (score: number) => void;
    checkHighScore: (score: number) => boolean;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            highScore: 0,
            setHighScore: (score: number) => set({ highScore: score }),
            checkHighScore: (score: number) => {
                const current = get().highScore;
                if (score > current) {
                    set({ highScore: score });
                    return true;
                }
                return false;
            },
        }),
        {
            name: 'swarm-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
