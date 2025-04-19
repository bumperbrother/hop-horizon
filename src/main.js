import { Game } from './js/core/Game.js';
import { AssetManager } from './js/core/AssetManager.js';
import { UIManager } from './js/ui/UIManager.js';
import { Level1 } from './js/levels/Level1.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create loading screen elements
  const loadingScreen = document.getElementById('loading-screen');
  const progressBar = document.querySelector('.progress-bar-fill');
  const loadingText = document.querySelector('.loading-text');
  
  // Initialize asset manager
  const assetManager = new AssetManager();
  
  // Register audio assets
  assetManager.registerAudio('jump', '/assets/audio/jump.mp3');
  assetManager.registerAudio('double-jump', '/assets/audio/double-jump.mp3');
  assetManager.registerAudio('land', '/assets/audio/land.mp3');
  assetManager.registerAudio('footstep', '/assets/audio/footstep.mp3');
  assetManager.registerAudio('checkpoint', '/assets/audio/checkpoint.mp3');
  assetManager.registerAudio('background', '/assets/audio/background.mp3');
  assetManager.registerAudio('timer-low', '/assets/audio/timer-low.mp3');
  
  // For development, we'll use placeholder assets for models and textures
  // assetManager.registerModel('rabbit', '/assets/models/rabbit.glb');
  // assetManager.registerTexture('platform', '/assets/textures/platform.jpg');
  // assetManager.registerTexture('checkpoint', '/assets/textures/checkpoint.jpg');
  
  // Update loading progress
  assetManager.onProgress = (progress) => {
    progressBar.style.width = `${progress * 100}%`;
    loadingText.textContent = `Loading... ${Math.floor(progress * 100)}%`;
  };
  
  // Initialize the game when assets are loaded
  assetManager.onComplete = () => {
    // Hide loading screen with a fade out effect
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 1s ease';
    
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      
      // Initialize UI Manager
      const uiManager = new UIManager();
      
      // Initialize the game
      const game = new Game({
        assetManager,
        uiManager
      });
      
      // Initialize audio settings UI
      uiManager.initAudioSettingsUI(game);
      
      // Set up event listeners for the main menu
      const playButton = document.getElementById('play-button');
      const optionsButton = document.getElementById('options-button');
      const creditsButton = document.getElementById('credits-button');
      
      playButton.addEventListener('click', () => {
        // Hide main menu and show tutorial
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('tutorial-screen').classList.remove('hidden');
      });
      
      // Tutorial continue button
      const tutorialContinue = document.getElementById('tutorial-continue');
      tutorialContinue.addEventListener('click', () => {
        // Hide tutorial and start the game
        document.getElementById('tutorial-screen').classList.add('hidden');
        
        // Show game UI
        document.getElementById('game-ui').classList.remove('hidden');
        
        // Start the game with Level 1
        const level = new Level1(game);
        game.startLevel(level);
      });
      
      // End screen buttons
      const retryButton = document.getElementById('retry-button');
      const menuButton = document.getElementById('menu-button');
      
      retryButton.addEventListener('click', () => {
        // Hide end screen
        document.getElementById('end-screen').classList.add('hidden');
        
        // Show game UI
        document.getElementById('game-ui').classList.remove('hidden');
        
        // Restart the current level
        const level = new Level1(game);
        game.startLevel(level);
      });
      
      menuButton.addEventListener('click', () => {
        // Hide end screen and show main menu
        document.getElementById('end-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        
        // Stop the game
        game.stop();
      });
    }, 1000);
  };
  
  // Start loading assets
  assetManager.loadAssets();
});
