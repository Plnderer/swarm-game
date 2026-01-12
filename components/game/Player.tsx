import { Circle, Group, Skia } from "@shopify/react-native-skia";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { GAME_CONFIG } from "../../constants/gameConfig";
import { PlayerState } from "../../lib/types/game";

interface PlayerProps {
    playerState: SharedValue<PlayerState>;
    gameTime: SharedValue<number>;
}

export const Player = ({ playerState, gameTime }: PlayerProps) => {

    // Derived transformations
    const transform = useDerivedValue(() => {
        const { x, y } = playerState.value;
        return [{ translateX: x }, { translateY: y }];
    });

    // Visual State
    const paint = useDerivedValue(() => {
        const p = Skia.Paint();
        p.setColor(Skia.Color("#FFFFFF"));

        const { isInvincible, isDashing } = playerState.value;

        if (isDashing) {
            p.setColor(Skia.Color("#00FFFF")); // Cyan dash
        }

        if (isInvincible) {
            // Blink effect: 10Hz
            // sin(time * speed) > 0 ? 1 : 0.5
            const blink = Math.sin(gameTime.value * 30) > 0;
            p.setAlphaf(blink ? 0.5 : 1.0);
        }

        return p;
    });

    return (
        <Group transform={transform}>
            {/* Main Body */}
            <Circle cx={0} cy={0} r={GAME_CONFIG.PLAYER_RADIUS} paint={paint} />

            {/* Direction indicator? */}
        </Group>
    );
};
