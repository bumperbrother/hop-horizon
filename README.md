# Hop Horizon

A 3D parkour game built with Three.js where players control a rabbit navigating through a futuristic environment with platforms and obstacles.

## Game Overview

Hop Horizon is a single-player 3D parkour game where players race against time, with checkpoints extending the countdown timer. The game features:

- First-person parkour gameplay
- Double-jump mechanics
- Sprint ability
- Checkpoint system that extends your timer
- Moving platforms
- Futuristic visual style with neon lighting
- Immersive sound effects and background music
- Audio settings with volume controls

## Controls

- **WASD**: Movement
- **Mouse**: Look around
- **Space**: Jump (press again while in air for double jump)
- **Shift**: Sprint

## Development

This project is built using:

- Three.js for 3D rendering
- Vite as the build tool
- JavaScript ES modules

### Project Structure

- `src/js/core`: Core game engine components (Game, AssetManager, AudioManager, etc.)
- `src/js/entities`: Game entities like Player, Platform, Checkpoint
- `src/js/levels`: Level definitions
- `src/js/ui`: User interface components (UIManager, AudioSettingsUI)
- `src/styles`: CSS styles
- `public/assets`: Game assets (models, textures, audio)

### Running the Project

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Audio System

Hop Horizon features a comprehensive audio system that enhances the gaming experience:

- **Sound Effects**: Jump, double jump, landing, footsteps, checkpoint activation
- **Background Music**: Ambient music that plays during gameplay
- **Warning Sounds**: Alert when the timer is running low
- **Volume Controls**: Adjust master, music, sound effects, and UI sound volumes
- **Mute Option**: Easily mute all game audio

### Generating Audio Files for Development

For development purposes, you can generate placeholder audio files:

1. Navigate to `/assets/audio/generate.html` in a web browser
2. Click "Generate Audio Files" and download the generated files
3. Place the files in the `/public/assets/audio/` directory
4. Uncomment the audio asset registration in `src/main.js`:
   ```javascript
   // Register audio assets
   assetManager.registerAudio('jump', '/assets/audio/jump.mp3');
   assetManager.registerAudio('double-jump', '/assets/audio/double-jump.mp3');
   assetManager.registerAudio('land', '/assets/audio/land.mp3');
   assetManager.registerAudio('footstep', '/assets/audio/footstep.mp3');
   assetManager.registerAudio('checkpoint', '/assets/audio/checkpoint.mp3');
   assetManager.registerAudio('background', '/assets/audio/background.mp3');
   assetManager.registerAudio('timer-low', '/assets/audio/timer-low.mp3');
   ```

For more details, see the [Audio System README](/public/assets/audio/README.md).

## Deployment

This project is configured for easy deployment to Vercel.

## Credits

Created based on the Game Design Document for Hop Horizon created by bumper_brother.
