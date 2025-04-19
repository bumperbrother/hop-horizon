import * as THREE from 'three';

export class AudioManager {
  constructor(game) {
    this.game = game;
    this.assetManager = game.assetManager;
    
    // Audio context initialization flag
    this.initialized = false;
    
    // Create audio listener (required for 3D audio)
    this.listener = new THREE.AudioListener();
    this.game.camera.add(this.listener);
    
    // Sound collections
    this.sounds = {
      music: {},
      sfx: {},
      ui: {}
    };
    
    // Currently playing sounds
    this.currentSounds = [];
    
    // Volume settings
    this.volume = {
      master: 1.0,
      music: 0.7,
      sfx: 1.0,
      ui: 1.0
    };
    
    // Mute state
    this.muted = false;
    
    // Add initialization on user interaction
    this.setupUserInteractionInit();
  }
  
  // Set up initialization on user interaction
  setupUserInteractionInit() {
    const initAudio = () => {
      if (!this.initialized) {
        console.log("Initializing audio after user interaction");
        this.init();
        this.initialized = true;
      }
      
      // Remove event listeners once initialized
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    document.addEventListener('touchstart', initAudio);
    
    // Also initialize on game start (which should happen after user interaction)
    document.getElementById('play-button')?.addEventListener('click', initAudio);
  }
  
  init() {
    // Create sounds from loaded audio assets
    this.createSounds();
    
    // Set up event listeners for window focus/blur
    window.addEventListener('blur', () => {
      if (this.game.isRunning) {
        this.lowerVolume();
      }
    });
    
    window.addEventListener('focus', () => {
      if (this.game.isRunning && !this.muted) {
        this.restoreVolume();
      }
    });
  }
  
  createSounds() {
    console.log("Creating sounds from loaded audio assets");
    
    // Get all loaded audio from asset manager
    const audioAssets = this.assetManager.audio;
    
    // Create an audio context if not already created by the listener
    if (!this.listener.context) {
      console.warn("Audio listener context not found, audio may not work properly");
      return;
    }
    
    // Process each audio asset
    for (const [name, audioElement] of Object.entries(audioAssets)) {
      try {
        // Determine category based on name
        let category = 'sfx';
        
        if (name.includes('music') || name.includes('background')) {
          category = 'music';
        } else if (name.includes('ui') || name.includes('button') || name.includes('menu')) {
          category = 'ui';
        }
        
        console.log(`Creating sound: ${name} in category ${category}`);
        
        // Store the audio element directly instead of using Three.js Audio
        // This is a workaround for the "no playback control" issue
        if (!this.sounds[category]) {
          this.sounds[category] = {};
        }
        
        // Clone the audio element to avoid sharing issues
        if (audioElement && audioElement.src) {
          const clonedAudio = audioElement.cloneNode(true);
          
          // Set initial volume
          clonedAudio.volume = this.volume.master * this.volume[category];
          
          // Store the audio element
          this.sounds[category][name] = {
            audio: clonedAudio,
            isPlaying: false,
            volume: this.volume.master * this.volume[category],
            getVolume: function() { return this.volume; },
            setVolume: function(vol) { 
              this.volume = vol; 
              this.audio.volume = vol;
            },
            play: function() {
              // Reset the audio to the beginning if it's already playing
              if (this.isPlaying) {
                this.audio.currentTime = 0;
              } else {
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                  playPromise.catch(error => {
                    console.warn(`Error playing sound: ${error.message}`);
                  });
                }
                this.isPlaying = true;
              }
            },
            pause: function() {
              this.audio.pause();
              this.isPlaying = false;
            },
            stop: function() {
              this.audio.pause();
              this.audio.currentTime = 0;
              this.isPlaying = false;
            },
            setLoop: function(loop) {
              this.audio.loop = loop;
            }
          };
          
          // Add event listener to update isPlaying state
          this.sounds[category][name].audio.addEventListener('ended', () => {
            this.sounds[category][name].isPlaying = false;
          });
          
          console.log(`Created ${category} sound: ${name}`);
        } else {
          console.warn(`Audio element for ${name} is not properly loaded`);
        }
      } catch (error) {
        console.error(`Error creating sound for ${name}:`, error);
      }
    }
  }
  
  // Play a non-positional sound (UI sounds, music, etc.)
  play(name, options = {}) {
    // If audio is not initialized yet, initialize it now
    if (!this.initialized) {
      console.log("Audio not initialized yet, initializing now");
      this.init();
      this.initialized = true;
    }
    
    // Default options
    const defaultOptions = {
      volume: 1.0,
      loop: false,
      category: 'sfx',
      fadeIn: 0,
      delay: 0,
      pitch: 1.0
    };
    
    // Merge options
    const finalOptions = { ...defaultOptions, ...options };
    
    // Find the sound
    const sound = this.sounds[finalOptions.category]?.[name];
    
    if (!sound) {
      console.warn(`Sound "${name}" not found in category "${finalOptions.category}"`);
      
      // If the sound doesn't exist but we have the audio element, create it now
      const audioElement = this.assetManager.audio[name];
      if (audioElement) {
        console.log(`Creating sound "${name}" on demand`);
        
        try {
          // Clone the audio element to avoid sharing issues
          const clonedAudio = audioElement.cloneNode(true);
          
          // Set initial volume
          clonedAudio.volume = this.volume.master * this.volume[finalOptions.category] * finalOptions.volume;
          
          // Create a new sound object
          const newSound = {
            audio: clonedAudio,
            isPlaying: false,
            volume: this.volume.master * this.volume[finalOptions.category] * finalOptions.volume,
            getVolume: function() { return this.volume; },
            setVolume: function(vol) { 
              this.volume = vol; 
              this.audio.volume = vol;
            },
            play: function() {
              // Reset the audio to the beginning if it's already playing
              if (this.isPlaying) {
                this.audio.currentTime = 0;
              } else {
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                  playPromise.catch(error => {
                    console.warn(`Error playing sound: ${error.message}`);
                  });
                }
                this.isPlaying = true;
              }
            },
            pause: function() {
              this.audio.pause();
              this.isPlaying = false;
            },
            stop: function() {
              this.audio.pause();
              this.audio.currentTime = 0;
              this.isPlaying = false;
            },
            setLoop: function(loop) {
              this.audio.loop = loop;
            }
          };
          
          // Add event listener to update isPlaying state
          newSound.audio.addEventListener('ended', () => {
            newSound.isPlaying = false;
          });
          
          // Store the sound
          this.sounds[finalOptions.category][name] = newSound;
          
          // Set options
          newSound.setLoop(finalOptions.loop);
          
          // Handle delay
          if (finalOptions.delay > 0) {
            setTimeout(() => {
              this.startSound(newSound, finalOptions);
            }, finalOptions.delay * 1000);
          } else {
            this.startSound(newSound, finalOptions);
          }
          
          return newSound;
        } catch (error) {
          console.error(`Error creating sound "${name}" on demand:`, error);
          return null;
        }
      }
      
      return null;
    }
    
    // Set options
    sound.setVolume(this.volume.master * this.volume[finalOptions.category] * finalOptions.volume);
    sound.setLoop(finalOptions.loop);
    
    // Set pitch if supported (not supported in our custom sound objects)
    if (finalOptions.pitch !== 1.0 && sound.audio && 'playbackRate' in sound.audio) {
      sound.audio.playbackRate = finalOptions.pitch;
    }
    
    // Handle delay
    if (finalOptions.delay > 0) {
      setTimeout(() => {
        this.startSound(sound, finalOptions);
      }, finalOptions.delay * 1000);
    } else {
      this.startSound(sound, finalOptions);
    }
    
    return sound;
  }
  
  // Play a positional sound (3D sound effects)
  playPositional(name, position, options = {}) {
    // For simplicity, we'll just use the regular play method
    // In a real game, you'd want to implement proper 3D audio
    // This is a simplified version that ignores the position
    console.log(`Playing positional sound ${name} at position ${position.x}, ${position.y}, ${position.z}`);
    
    // Calculate distance from camera to sound position
    const camera = this.game.camera;
    const distance = camera.position.distanceTo(position);
    
    // Adjust volume based on distance
    const distanceOptions = { ...options };
    
    // Default options
    const defaultOptions = {
      volume: 1.0,
      loop: false,
      category: 'sfx',
      fadeIn: 0,
      delay: 0,
      pitch: 1.0,
      refDistance: 5,
      maxDistance: 100
    };
    
    // Merge options
    const finalOptions = { ...defaultOptions, ...distanceOptions };
    
    // Calculate volume based on distance
    const refDistance = finalOptions.refDistance;
    const maxDistance = finalOptions.maxDistance;
    
    // Linear distance model
    let volumeScale = 1.0;
    if (distance > refDistance) {
      volumeScale = 1.0 - Math.min(1.0, (distance - refDistance) / (maxDistance - refDistance));
    }
    
    // Apply distance-based volume scaling
    distanceOptions.volume = finalOptions.volume * volumeScale;
    
    // Use the regular play method
    return this.play(name, distanceOptions);
  }
  
  startSound(sound, options) {
    try {
      // Start the sound
      if (options.fadeIn > 0) {
        // Start with volume 0 and fade in
        const originalVolume = sound.getVolume();
        sound.setVolume(0);
        
        // Play the sound
        sound.play();
        
        // Create fade-in effect
        const startTime = performance.now();
        const fadeInMs = options.fadeIn * 1000;
        
        const fadeInterval = setInterval(() => {
          const elapsedTime = performance.now() - startTime;
          const progress = Math.min(elapsedTime / fadeInMs, 1);
          
          sound.setVolume(originalVolume * progress);
          
          if (progress >= 1) {
            clearInterval(fadeInterval);
          }
        }, 16); // ~60fps
      } else {
        // Just play normally
        sound.play();
      }
    } catch (error) {
      console.error("Error starting sound:", error);
    }
  }
  
  // Stop a specific sound
  stop(sound, fadeOut = 0) {
    if (!sound) return;
    
    if (fadeOut > 0) {
      // Fade out then stop
      const originalVolume = sound.getVolume();
      const startTime = performance.now();
      const fadeOutMs = fadeOut * 1000;
      
      const fadeInterval = setInterval(() => {
        const elapsedTime = performance.now() - startTime;
        const progress = Math.min(elapsedTime / fadeOutMs, 1);
        
        sound.setVolume(originalVolume * (1 - progress));
        
        if (progress >= 1) {
          sound.stop();
          clearInterval(fadeInterval);
          this.cleanupSound(sound);
        }
      }, 16); // ~60fps
    } else {
      // Stop immediately
      sound.stop();
      this.cleanupSound(sound);
    }
  }
  
  // Stop all sounds in a category
  stopCategory(category, fadeOut = 0) {
    if (!this.sounds[category]) return;
    
    const sounds = this.sounds[category];
    
    for (const sound of Object.values(sounds)) {
      if (sound.isPlaying) {
        if (fadeOut > 0) {
          // Fade out then stop
          const originalVolume = sound.getVolume();
          const startTime = performance.now();
          const fadeOutMs = fadeOut * 1000;
          
          const fadeInterval = setInterval(() => {
            const elapsedTime = performance.now() - startTime;
            const progress = Math.min(elapsedTime / fadeOutMs, 1);
            
            sound.setVolume(originalVolume * (1 - progress));
            
            if (progress >= 1) {
              sound.stop();
              clearInterval(fadeInterval);
            }
          }, 16); // ~60fps
        } else {
          // Stop immediately
          sound.stop();
        }
      }
    }
  }
  
  // Stop all sounds
  stopAll(fadeOut = 0) {
    for (const category of Object.keys(this.sounds)) {
      this.stopCategory(category, fadeOut);
    }
  }
  
  // Pause all sounds
  pauseAll() {
    for (const category of Object.keys(this.sounds)) {
      const sounds = this.sounds[category];
      for (const sound of Object.values(sounds)) {
        if (sound.isPlaying) {
          sound.pause();
        }
      }
    }
  }
  
  // Resume all sounds
  resumeAll() {
    for (const category of Object.keys(this.sounds)) {
      const sounds = this.sounds[category];
      for (const sound of Object.values(sounds)) {
        if (!sound.isPlaying && sound.audio && !sound.audio.ended) {
          sound.play();
        }
      }
    }
  }
  
  // Set volume for a category
  setVolume(category, volume) {
    if (category === 'master') {
      this.volume.master = volume;
      
      // Update all sounds
      for (const cat of Object.keys(this.sounds)) {
        for (const sound of Object.values(this.sounds[cat])) {
          sound.setVolume(this.volume.master * this.volume[cat]);
        }
      }
    } else if (this.volume[category] !== undefined) {
      this.volume[category] = volume;
      
      // Update sounds in this category
      for (const sound of Object.values(this.sounds[category])) {
        sound.setVolume(this.volume.master * this.volume[category]);
      }
    }
  }
  
  // Mute all audio
  mute() {
    this.muted = true;
    this.setVolume('master', 0);
  }
  
  // Unmute all audio
  unmute() {
    this.muted = false;
    this.setVolume('master', 1.0);
  }
  
  // Toggle mute state
  toggleMute() {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.muted;
  }
  
  // Lower volume (for when window loses focus)
  lowerVolume() {
    this.setVolume('master', 0.3);
  }
  
  // Restore volume (for when window gains focus)
  restoreVolume() {
    this.setVolume('master', 1.0);
  }
  
  // Clean up a sound after it stops
  cleanupSound(sound) {
    // With our new implementation, we don't need to do anything here
    // The sound objects are stored in the sounds object and managed there
  }
  
  // Update method (called each frame)
  update(deltaTime) {
    // No need to clean up sounds in the update method
    // The isPlaying flag is updated by the 'ended' event listener
    // and the sounds are stored in the sounds object
  }
}
