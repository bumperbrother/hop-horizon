import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';
import Stats from 'stats.js';
import { InputManager } from './InputManager.js';
import { PhysicsManager } from './PhysicsManager.js';
import { AudioManager } from './AudioManager.js';

export class Game {
  constructor(options) {
    this.options = options;
    this.assetManager = options.assetManager;
    this.uiManager = options.uiManager;
    
    // Game state
    this.isRunning = false;
    this.currentLevel = null;
    this.player = null;
    
    // Timer properties
    this.timer = 30.0; // Start with 30 seconds
    this.timerElement = document.getElementById('timer');
    this.checkpointCount = 0;
    this.checkpointTotal = 0;
    this.checkpointCountElement = document.getElementById('checkpoint-count');
    this.checkpointTotalElement = document.getElementById('checkpoint-total');
    this.timerWarningActive = false;
    this.timerWarningSound = null;
    
    // Initialize Three.js
    this.initThree();
    
    // Initialize input manager
    this.inputManager = new InputManager(this);
    
    // Initialize physics
    this.physicsManager = new PhysicsManager(this);
    
    // Initialize audio
    this.audioManager = new AudioManager(this);
    
    // Debug mode
    this.debug = false;
    if (this.debug) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.dom);
    }
  }
  
  initThree() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510);
    this.scene.fog = new THREE.FogExp2(0x050510, 0.01);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    
    // Add lights
    this.addLights();
    
    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Initialize controls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  
  addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 1);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 30, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    
    this.scene.add(directionalLight);
    
    // Add some point lights for the futuristic feel
    const colors = [0x00ffff, 0xff00ff, 0x00ff00];
    
    for (let i = 0; i < 3; i++) {
      const pointLight = new THREE.PointLight(colors[i], 1, 50);
      pointLight.position.set(
        Math.sin(i * Math.PI * 2 / 3) * 20,
        10,
        Math.cos(i * Math.PI * 2 / 3) * 20
      );
      this.scene.add(pointLight);
    }
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  startLevel(level) {
    // Set current level
    this.currentLevel = level;
    
    // Clear existing objects
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
      this.scene.remove(object);
    }
    
    // Add lights back
    this.addLights();
    
    // Initialize level
    level.init();
    
    // Set up player and camera
    this.player = level.player;
    
    // Set up third-person camera - position it MUCH higher and further back for better view of the massive rabbit
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(this.player.position);
    
    // Set up orbit controls for third-person view
    if (this.orbitControls) {
      this.orbitControls.dispose();
    }
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.1;
    this.orbitControls.minDistance = 10;  // Keep camera further back
    this.orbitControls.maxDistance = 30; // Allow camera to go further out
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    this.orbitControls.minPolarAngle = Math.PI / 6; // Prevent going too high
    this.orbitControls.target.copy(this.player.position);
    
    // Set initial camera position relative to player
    const offset = new THREE.Vector3(0, 10, 20);
    this.camera.position.copy(this.player.position).add(offset);
    
    // Add a spotlight that follows the player to make it more visible
    this.playerSpotlight = new THREE.SpotLight(0xffffff, 5); // Increased intensity
    this.playerSpotlight.position.set(0, 8, 0); // Higher position
    this.playerSpotlight.angle = Math.PI / 6; // Narrower angle for more focus
    this.playerSpotlight.penumbra = 0.05; // Sharper edge
    this.playerSpotlight.decay = 0;
    this.playerSpotlight.distance = 30; // Increased distance
    this.playerSpotlight.castShadow = true;
    this.playerSpotlight.shadow.mapSize.width = 1024;
    this.playerSpotlight.shadow.mapSize.height = 1024;
    this.scene.add(this.playerSpotlight);
    this.playerSpotlight.target = this.player.mesh;
    this.scene.add(this.playerSpotlight.target);
    
    // Add a second spotlight from a different angle to better illuminate the rabbit
    this.secondSpotlight = new THREE.SpotLight(0xff88ff, 3); // Pink tint to match rabbit
    this.secondSpotlight.position.set(0, 3, 5); // From behind camera
    this.secondSpotlight.angle = Math.PI / 5;
    this.secondSpotlight.penumbra = 0.1;
    this.secondSpotlight.decay = 0;
    this.secondSpotlight.distance = 20;
    this.secondSpotlight.castShadow = false; // No need for second shadow
    this.scene.add(this.secondSpotlight);
    this.secondSpotlight.target = this.player.mesh;
    this.scene.add(this.secondSpotlight.target);
    
    // Reset timer
    this.timer = 30.0;
    this.updateTimerDisplay();
    
    // Reset checkpoint counter
    this.checkpointCount = 0;
    this.checkpointTotal = level.checkpoints.length;
    this.updateCheckpointCounter();
    
    // Start the game loop
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
    
    // Play background music
    this.audioManager.play('background', {
      category: 'music',
      loop: true,
      volume: 0.5,
      fadeIn: 1.0
    });
  }
  
  animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());
    
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = now;
    
    // Update TWEEN
    TWEEN.update();
    
    // Update orbit controls
    if (this.orbitControls) {
      this.orbitControls.target.copy(this.player.position);
      this.orbitControls.update();
    }
    
    // Update spotlight positions to follow player
    if (this.player) {
      // Update main spotlight
      if (this.playerSpotlight) {
        this.playerSpotlight.position.set(
          this.player.position.x,
          this.player.position.y + 8,
          this.player.position.z
        );
      }
      
      // Update second spotlight
      if (this.secondSpotlight) {
        // Position it behind and slightly above the camera, pointing at the player
        const cameraDirection = new THREE.Vector3(0, 0, -1);
        cameraDirection.applyQuaternion(this.camera.quaternion);
        
        this.secondSpotlight.position.set(
          this.player.position.x - cameraDirection.x * 5,
          this.player.position.y + 3,
          this.player.position.z - cameraDirection.z * 5
        );
      }
    }
    
    // Update physics
    this.physicsManager.update(deltaTime);
    
    // Update player
    if (this.player) {
      this.player.update(deltaTime);
    }
    
    // Update level
    if (this.currentLevel) {
      this.currentLevel.update(deltaTime);
    }
    
    // Update audio
    this.audioManager.update(deltaTime);
    
    // Update timer
    this.updateTimer(deltaTime);
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    
    // Update stats
    if (this.debug && this.stats) {
      this.stats.update();
    }
  }
  
  updateTimer(deltaTime) {
    if (!this.isRunning) return;
    
    this.timer -= deltaTime;
    
    // Check if timer is low
    if (this.timer <= 10 && !this.timerWarningActive) {
      this.timerElement.classList.add('time-low');
      this.timerWarningActive = true;
      
      // Play warning sound
      this.audioManager.play('timer-low', {
        category: 'sfx',
        loop: true,
        volume: 0.7
      });
    } else if (this.timer > 10 && this.timerWarningActive) {
      this.timerElement.classList.remove('time-low');
      this.timerWarningActive = false;
      
      // Stop warning sound
      this.audioManager.stopCategory('sfx');
    }
    
    // Check if timer has run out
    if (this.timer <= 0) {
      this.timer = 0;
      this.gameOver();
    }
    
    this.updateTimerDisplay();
  }
  
  updateTimerDisplay() {
    if (this.timerElement) {
      this.timerElement.textContent = this.timer.toFixed(1);
    }
  }
  
  updateCheckpointCounter() {
    if (this.checkpointCountElement && this.checkpointTotalElement) {
      this.checkpointCountElement.textContent = this.checkpointCount;
      this.checkpointTotalElement.textContent = this.checkpointTotal;
    }
  }
  
  hitCheckpoint() {
    // Increase timer
    this.timer += 15;
    
    // Update checkpoint count
    this.checkpointCount++;
    this.updateCheckpointCounter();
    
    // Play checkpoint sound
    this.audioManager.play('checkpoint', {
      volume: 1.0
    });
    
    // Reset warning if active
    if (this.timerWarningActive && this.timer > 10) {
      this.timerElement.classList.remove('time-low');
      this.timerWarningActive = false;
      
      // Stop warning sound
      if (this.timerWarningSound) {
        this.timerWarningSound.pause();
        this.timerWarningSound.currentTime = 0;
      }
    }
  }
  
  finishLevel() {
    this.isRunning = false;
    
    // Stop background music
    if (this.assetManager.audio.background) {
      this.assetManager.audio.background.pause();
      this.assetManager.audio.background.currentTime = 0;
    }
    
    // Stop all sounds
    this.audioManager.stopAll(0.5);
    
    // Hide game UI
    document.getElementById('game-ui').classList.add('hidden');
    
    // Show end screen with stats
    document.getElementById('end-screen').classList.remove('hidden');
    document.getElementById('final-time').textContent = this.timer.toFixed(3);
    document.getElementById('final-checkpoints').textContent = `${this.checkpointCount}/${this.checkpointTotal}`;
  }
  
  gameOver() {
    this.isRunning = false;
    
    // Stop all sounds
    this.audioManager.stopAll(0.5);
    
    // Hide game UI
    document.getElementById('game-ui').classList.add('hidden');
    
    // Show end screen with game over message
    document.getElementById('end-screen').classList.remove('hidden');
    document.getElementById('final-time').textContent = '0.000';
    document.getElementById('final-checkpoints').textContent = `${this.checkpointCount}/${this.checkpointTotal}`;
  }
  
  stop() {
    this.isRunning = false;
    
    // Stop all sounds
    this.audioManager.stopAll(0.5);
  }
}
