import { Picture, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";
import { FlockState } from "../../lib/simulation/WorkletFlock";

interface EnemySwarmProps {
    flock: SharedValue<FlockState | null>;
    tick: SharedValue<number>;
}

export const EnemySwarm = ({ flock, tick }: EnemySwarmProps) => {
    // Pre-create generic path for Triangle
    const trianglePath = useMemo(() => {
        const p = Skia.Path.Make();
        // Tip at (6, 0), Back at (-4, -3) and (-4, 3)
        p.moveTo(6, 0);
        p.lineTo(-4, 3);
        p.lineTo(-4, -3);
        p.close();
        return p;
    }, []);

    // Picture rendering for high performance
    const picture = useDerivedValue(() => {
        // Subscribe to frame updates
        const _ = tick.value;
        const state = flock.value;

        const recorder = Skia.PictureRecorder();
        // Use an arbitrary large bounds or window bounds?
        const canvas = recorder.beginRecording({ x: 0, y: 0, width: 2000, height: 2000 });

        if (!state || state.count === 0) {
            return recorder.finishRecordingAsPicture();
        }

        const count = state.count;
        const paint = Skia.Paint();
        paint.setAntiAlias(true);
        paint.setColor(Skia.Color(0xFFFF4444)); // Default Red

        for (let i = 0; i < count; i++) {
            const x = state.x[i];
            const y = state.y[i];
            const vx = state.vx[i];
            const vy = state.vy[i];

            canvas.save();
            canvas.translate(x, y);

            const angle = Math.atan2(vy, vx);
            canvas.rotate(angle * (180 / Math.PI), 0, 0);

            canvas.drawPath(trianglePath, paint);
            canvas.restore();
        }

        return recorder.finishRecordingAsPicture();
    });

    return <Picture picture={picture} />;
};
