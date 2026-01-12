
export interface ComboState {
    count: number;
    timer: number;
    multiplier: number;
    score: number; // Add total score here
}

export const COMBO_TIMEOUT = 2.5; // Seconds to keep combo alive

export function createComboState(): ComboState {
    'worklet';
    return {
        count: 0,
        timer: 0,
        multiplier: 1,
        score: 0,
    };
}

export function updateCombo(combo: ComboState, dt: number) {
    'worklet';
    if (combo.timer > 0) {
        combo.timer -= dt;
        if (combo.timer <= 0) {
            // Combo Expired
            combo.count = 0;
            combo.multiplier = 1;
        }
    }
}

export function addCombo(combo: ComboState, amount: number = 1) {
    'worklet';
    combo.count += amount;
    combo.timer = COMBO_TIMEOUT; // Reset timer

    // Calculate Multiplier
    if (combo.count > 50) combo.multiplier = 5;
    else if (combo.count > 25) combo.multiplier = 3;
    else if (combo.count > 10) combo.multiplier = 2;
    else combo.multiplier = 1;

    // Add Score (10 points per kill * multiplier)
    // Assuming amount is kills.
    combo.score += amount * 10 * combo.multiplier;
}
