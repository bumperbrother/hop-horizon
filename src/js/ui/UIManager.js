import { AudioSettingsUI } from './AudioSettingsUI.js';

export class UIManager {
  constructor() {
    // UI elements
    this.loadingScreen = document.getElementById('loading-screen');
    this.mainMenu = document.getElementById('main-menu');
    this.tutorialScreen = document.getElementById('tutorial-screen');
    this.gameUI = document.getElementById('game-ui');
    this.endScreen = document.getElementById('end-screen');
    
    // Timer elements
    this.timerElement = document.getElementById('timer');
    this.checkpointCountElement = document.getElementById('checkpoint-count');
    this.checkpointTotalElement = document.getElementById('checkpoint-total');
    
    // End screen elements
    this.finalTimeElement = document.getElementById('final-time');
    this.finalCheckpointsElement = document.getElementById('final-checkpoints');
    
    // Loading screen elements
    this.progressBarFill = document.querySelector('.progress-bar-fill');
    this.loadingText = document.querySelector('.loading-text');
    
    // Audio settings UI
    this.audioSettingsUI = null;
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  initAudioSettingsUI(game) {
    this.audioSettingsUI = new AudioSettingsUI(game);
  }
  
  initEventListeners() {
    // Play button
    const playButton = document.getElementById('play-button');
    if (playButton) {
      playButton.addEventListener('click', () => {
        this.hideMainMenu();
        this.showTutorial();
      });
    }
    
    // Options button
    const optionsButton = document.getElementById('options-button');
    if (optionsButton) {
      optionsButton.addEventListener('click', () => {
        if (this.audioSettingsUI) {
          this.audioSettingsUI.show();
        }
      });
    }
    
    // Tutorial continue button
    const tutorialContinue = document.getElementById('tutorial-continue');
    if (tutorialContinue) {
      tutorialContinue.addEventListener('click', () => {
        this.hideTutorial();
        this.showGameUI();
      });
    }
    
    // End screen buttons
    const retryButton = document.getElementById('retry-button');
    const menuButton = document.getElementById('menu-button');
    
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        this.hideEndScreen();
        this.showGameUI();
      });
    }
    
    if (menuButton) {
      menuButton.addEventListener('click', () => {
        this.hideEndScreen();
        this.showMainMenu();
      });
    }
  }
  
  // Loading screen methods
  showLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'flex';
      this.loadingScreen.style.opacity = '1';
    }
  }
  
  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        this.loadingScreen.style.display = 'none';
      }, 1000);
    }
  }
  
  updateLoadingProgress(progress) {
    if (this.progressBarFill) {
      this.progressBarFill.style.width = `${progress * 100}%`;
    }
    
    if (this.loadingText) {
      this.loadingText.textContent = `Loading... ${Math.floor(progress * 100)}%`;
    }
  }
  
  // Main menu methods
  showMainMenu() {
    if (this.mainMenu) {
      this.mainMenu.classList.remove('hidden');
    }
  }
  
  hideMainMenu() {
    if (this.mainMenu) {
      this.mainMenu.classList.add('hidden');
    }
  }
  
  // Tutorial methods
  showTutorial() {
    if (this.tutorialScreen) {
      this.tutorialScreen.classList.remove('hidden');
    }
  }
  
  hideTutorial() {
    if (this.tutorialScreen) {
      this.tutorialScreen.classList.add('hidden');
    }
  }
  
  // Game UI methods
  showGameUI() {
    if (this.gameUI) {
      this.gameUI.classList.remove('hidden');
    }
  }
  
  hideGameUI() {
    if (this.gameUI) {
      this.gameUI.classList.add('hidden');
    }
  }
  
  // End screen methods
  showEndScreen(time, checkpoints, totalCheckpoints) {
    if (this.endScreen) {
      this.endScreen.classList.remove('hidden');
    }
    
    if (this.finalTimeElement) {
      this.finalTimeElement.textContent = time.toFixed(3);
    }
    
    if (this.finalCheckpointsElement) {
      this.finalCheckpointsElement.textContent = `${checkpoints}/${totalCheckpoints}`;
    }
  }
  
  hideEndScreen() {
    if (this.endScreen) {
      this.endScreen.classList.add('hidden');
    }
  }
  
  // Timer methods
  updateTimer(time) {
    if (this.timerElement) {
      this.timerElement.textContent = time.toFixed(1);
      
      // Add warning class if time is low
      if (time <= 10) {
        this.timerElement.classList.add('time-low');
      } else {
        this.timerElement.classList.remove('time-low');
      }
    }
  }
  
  // Checkpoint methods
  updateCheckpointCounter(count, total) {
    if (this.checkpointCountElement) {
      this.checkpointCountElement.textContent = count;
    }
    
    if (this.checkpointTotalElement) {
      this.checkpointTotalElement.textContent = total;
    }
  }
  
  // General UI methods
  showScreen(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.remove('hidden');
    }
  }
  
  hideScreen(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('hidden');
    }
  }
  
  hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
      screen.classList.add('hidden');
    });
  }
  
  // Audio settings methods
  showAudioSettings() {
    if (this.audioSettingsUI) {
      this.audioSettingsUI.show();
    }
  }
  
  hideAudioSettings() {
    if (this.audioSettingsUI) {
      this.audioSettingsUI.hide();
    }
  }
  
  toggleAudioSettings() {
    if (this.audioSettingsUI) {
      this.audioSettingsUI.toggle();
    }
  }
}
