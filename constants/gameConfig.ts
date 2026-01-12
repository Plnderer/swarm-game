export const GAME_CONFIG = {
  // Player
  PLAYER_RADIUS: 20,
  PLAYER_SPEED: 8,
  PLAYER_MAX_HEALTH: 3,
  DAMAGE_INVINCIBILITY: 1.5,   // Seconds of invincibility after hit
  
  // Dash
  DASH_SPEED: 25,
  DASH_DURATION: 0.15,         // Seconds
  DASH_COOLDOWN: 1.0,          // Seconds per charge
  DASH_MAX_CHARGES: 2,
  
  // Pulse
  PULSE_RADIUS: 120,
  PULSE_STRENGTH: 15,
  PULSE_COOLDOWN: 0.8,
  PULSE_DURATION: 0.2,         // Visual effect duration
  
  // Bomb
  BOMB_RADIUS: 200,
  BOMB_KILL_RADIUS: 80,        // Inner radius that kills enemies
  BOMB_STRENGTH: 25,
  BOMB_COOLDOWN: 15,           // Seconds per charge
  BOMB_MAX_CHARGES: 3,
  BOMB_STARTING_CHARGES: 1,
  
  // Enemies
  ENEMY_BOID_RADIUS: 6,
  MAX_ENEMIES: 500,
  
  // Pickups
  ENERGY_ORB_VALUE: 0.5,       // Seconds off bomb cooldown
  HEALTH_PICKUP_HEAL: 1,
  PICKUP_SPAWN_CHANCE: 0.1,    // Per killed enemy
  PICKUP_LIFETIME: 10,         // Seconds
  PICKUP_RADIUS: 15,
  
  // Scoring
  POINTS_PER_KILL: 10,
  COMBO_MULTIPLIER: 0.1,       // Extra multiplier per combo
  COMBO_TIMEOUT: 2.0,          // Seconds to maintain combo
  
  // Waves
  WAVE_CLEAR_BONUS: 500,
  TIME_BETWEEN_WAVES: 3,
  
  // Visual
  PLAYER_COLOR: 0xFF00FFFF,    // Cyan
  PLAYER_INVINCIBLE_ALPHA: 0.5,
  PULSE_RING_COLOR: 0x8800FFFF,
  DASH_TRAIL_COLOR: 0xFF00FFFF,
};
