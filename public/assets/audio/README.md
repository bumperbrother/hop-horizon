# Audio System for Hop Horizon

This directory contains the audio files used in the Hop Horizon game. The game uses a comprehensive audio system that supports various sound effects and background music.

## Audio Files

The following audio files are used in the game:

1. `jump.mp3` - Played when the player jumps
2. `double-jump.mp3` - Played when the player performs a double jump
3. `land.mp3` - Played when the player lands on a platform
4. `footstep.mp3` - Played when the player is moving on the ground
5. `checkpoint.mp3` - Played when the player reaches a checkpoint
6. `background.mp3` - Background music played during gameplay
7. `timer-low.mp3` - Warning sound played when the timer is low

## Generating Placeholder Audio Files

For development purposes, you can generate placeholder audio files using the Web Audio API. Follow these steps:

1. Open the `generate.html` file in a web browser
2. Click the "Generate Audio Files" button
3. Download each generated audio file
4. Place the downloaded files in this directory (`/public/assets/audio/`)

## Audio System Architecture

The game uses a dedicated `AudioManager` class to handle all audio-related functionality. This class provides methods for:

- Playing, pausing, and stopping sounds
- Controlling volume levels for different audio categories (master, music, sfx, ui)
- Spatial audio for 3D sound effects
- Fading in/out sounds
- Muting/unmuting all audio

## Audio Settings UI

The game includes a user interface for adjusting audio settings. Players can:

- Adjust the master volume
- Adjust the music volume
- Adjust the sound effects volume
- Adjust the UI sounds volume
- Mute/unmute all audio

## Implementation Details

### Audio Categories

Sounds are organized into three categories:

1. **Music** - Background music and ambient sounds
2. **SFX** - Sound effects related to gameplay (jumps, landings, checkpoints, etc.)
3. **UI** - User interface sounds (button clicks, menu navigation, etc.)

### Volume Control

Each audio category has its own volume control, and there's also a master volume control that affects all sounds. The volume levels are stored in the `AudioManager.volume` object:

```javascript
this.volume = {
  master: 1.0,
  music: 0.7,
  sfx: 1.0,
  ui: 1.0
};
```

### Playing Sounds

To play a sound, use the `AudioManager.play()` method:

```javascript
// Play a sound with default options
audioManager.play('jump');

// Play a sound with custom options
audioManager.play('checkpoint', {
  volume: 0.8,
  loop: false,
  category: 'sfx',
  fadeIn: 0.5,
  pitch: 1.2
});
```

### Spatial Audio

For 3D sound effects, use the `AudioManager.playPositional()` method:

```javascript
// Play a positional sound
audioManager.playPositional('footstep', position, {
  volume: 0.5,
  refDistance: 5,
  maxDistance: 100
});
```

## Production Audio Files

In a production environment, you should replace the placeholder audio files with professionally created audio files. The audio files should be in MP3 format for better compatibility and smaller file size.
