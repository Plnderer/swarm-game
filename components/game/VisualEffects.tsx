import { PaintStyle, Picture, Skia } from "@shopify/react-native-skia";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { GameEffect } from "../../lib/types/game";

interface VisualEffectsProps {
    effects: SharedValue<GameEffect[]>;
    tick: SharedValue<number>;
    gameTime: SharedValue<number>;
}

export const VisualEffects = ({ effects, tick, gameTime }: VisualEffectsProps) => {

    const picture = useDerivedValue(() => {
        const _ = tick.value; // Dependency
        const recorder = Skia.PictureRecorder();
        // Use large enough bounds or screen bounds passed in? 
        // For now, large bounds to cover typical screen
        const canvas = recorder.beginRecording({ x: 0, y: 0, width: 2000, height: 4000 });

        const currentTime = gameTime.value;
        const activeEffects = effects.value;

        const pulsePaint = Skia.Paint();
        pulsePaint.setStyle(PaintStyle.Stroke);
        pulsePaint.setStrokeWidth(4);
        pulsePaint.setColor(Skia.Color("#00FFFF"));

        const bombPaint = Skia.Paint();
        bombPaint.setStyle(PaintStyle.Fill);
        bombPaint.setColor(Skia.Color("#FF4444"));

        for (let i = 0; i < activeEffects.length; i++) {
            const effect = activeEffects[i];
            if (effect.id !== -1 && currentTime < effect.startTime + effect.duration) {
                const progress = (currentTime - effect.startTime) / effect.duration;

                canvas.save();
                canvas.translate(effect.x, effect.y);

                if (effect.type === 'pulse') {
                    // Growing ring
                    // data is max radius
                    const maxRadius = (effect.data as number) || 200;
                    const r = progress * maxRadius;
                    const opacity = 1.0 - progress;

                    pulsePaint.setAlphaf(opacity);
                    canvas.drawCircle(0, 0, r, pulsePaint);
                } else if (effect.type === 'explosion') {
                    // Flash expanding
                    const maxRadius = (effect.data as number) || 150;
                    // Ease out expo
                    const p = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                    const r = p * maxRadius;
                    const opacity = 1.0 - progress;

                    bombPaint.setAlphaf(opacity);
                    canvas.drawCircle(0, 0, r, bombPaint);
                }

                canvas.restore();
            }
        }

        return recorder.finishRecordingAsPicture();
    });

    return <Picture picture={picture} />;
};
