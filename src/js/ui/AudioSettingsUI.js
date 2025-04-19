export class AudioSettingsUI {
  constructor(game) {
    this.game = game;
    this.audioManager = game.audioManager;
    this.container = null;
    this.visible = false;
    
    // Create UI elements
    this.createUI();
    
    // Add event listeners
    this.addEventListeners();
  }
  
  createUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'audio-settings';
    this.container.style.display = 'none';
    
    // Create header
    const header = document.createElement('h2');
    header.textContent = 'Audio Settings';
    this.container.appendChild(header);
    
    // Create volume sliders
    this.createVolumeSlider('Master Volume', 'master');
    this.createVolumeSlider('Music Volume', 'music');
    this.createVolumeSlider('Sound Effects', 'sfx');
    this.createVolumeSlider('UI Sounds', 'ui');
    
    // Create mute button
    const muteButton = document.createElement('button');
    muteButton.className = 'audio-button';
    muteButton.textContent = 'Mute All';
    muteButton.id = 'mute-button';
    this.container.appendChild(muteButton);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'audio-button';
    closeButton.textContent = 'Close';
    closeButton.id = 'close-audio-settings';
    this.container.appendChild(closeButton);
    
    // Add to document
    document.getElementById('ui-container').appendChild(this.container);
  }
  
  createVolumeSlider(label, category) {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    
    // Create label
    const sliderLabel = document.createElement('label');
    sliderLabel.textContent = label;
    sliderContainer.appendChild(sliderLabel);
    
    // Create slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = this.audioManager.volume[category] * 100;
    slider.className = 'volume-slider';
    slider.id = `${category}-volume`;
    sliderContainer.appendChild(slider);
    
    // Create value display
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = `${Math.round(slider.value)}%`;
    valueDisplay.className = 'volume-value';
    valueDisplay.id = `${category}-volume-value`;
    sliderContainer.appendChild(valueDisplay);
    
    // Add to container
    this.container.appendChild(sliderContainer);
  }
  
  addEventListeners() {
    // Volume sliders
    const categories = ['master', 'music', 'sfx', 'ui'];
    
    categories.forEach(category => {
      const slider = document.getElementById(`${category}-volume`);
      const valueDisplay = document.getElementById(`${category}-volume-value`);
      
      if (slider && valueDisplay) {
        slider.addEventListener('input', () => {
          const value = slider.value / 100;
          this.audioManager.setVolume(category, value);
          valueDisplay.textContent = `${Math.round(slider.value)}%`;
          
          // Update mute button text
          this.updateMuteButtonText();
          
          // Play test sound when adjusting sfx or ui volume
          if (category === 'sfx' || category === 'ui') {
            this.playTestSound(category);
          }
        });
      }
    });
    
    // Mute button
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
      muteButton.addEventListener('click', () => {
        const isMuted = this.audioManager.toggleMute();
        this.updateMuteButtonText();
        
        // Update slider values
        categories.forEach(category => {
          const slider = document.getElementById(`${category}-volume`);
          if (slider) {
            slider.disabled = isMuted;
          }
        });
      });
    }
    
    // Close button
    const closeButton = document.getElementById('close-audio-settings');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hide();
      });
    }
  }
  
  updateMuteButtonText() {
    const muteButton = document.getElementById('mute-button');
    if (muteButton) {
      muteButton.textContent = this.audioManager.muted ? 'Unmute' : 'Mute All';
    }
  }
  
  playTestSound(category) {
    if (category === 'sfx') {
      this.audioManager.play('jump', { volume: 0.5 });
    } else if (category === 'ui') {
      // Create a simple UI sound if none exists
      const context = this.audioManager.listener.context;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, context.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 0.1);
    }
  }
  
  show() {
    if (this.container) {
      this.container.style.display = 'block';
      this.visible = true;
      
      // Update UI to reflect current state
      const categories = ['master', 'music', 'sfx', 'ui'];
      
      categories.forEach(category => {
        const slider = document.getElementById(`${category}-volume`);
        const valueDisplay = document.getElementById(`${category}-volume-value`);
        
        if (slider && valueDisplay) {
          slider.value = this.audioManager.volume[category] * 100;
          valueDisplay.textContent = `${Math.round(slider.value)}%`;
          slider.disabled = this.audioManager.muted;
        }
      });
      
      this.updateMuteButtonText();
    }
  }
  
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      this.visible = false;
    }
  }
  
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
