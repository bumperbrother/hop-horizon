import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetManager {
  constructor() {
    // Asset storage
    this.models = {};
    this.textures = {};
    this.audio = {};
    
    // Loaders
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    
    // Loading tracking
    this.totalAssets = 0;
    this.loadedAssets = 0;
    
    // Callbacks
    this.onProgress = null;
    this.onComplete = null;
  }
  
  registerModel(name, path) {
    this.totalAssets++;
    return { name, path, type: 'model' };
  }
  
  registerTexture(name, path) {
    this.totalAssets++;
    return { name, path, type: 'texture' };
  }
  
  registerAudio(name, path) {
    this.totalAssets++;
    
    // Create a hidden audio element in the DOM
    const audioElement = document.createElement('div');
    audioElement.setAttribute('data-asset-type', 'audio');
    audioElement.setAttribute('data-asset-name', name);
    audioElement.setAttribute('data-asset-path', path);
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
    
    return { name, path, type: 'audio' };
  }
  
  loadAssets() {
    // If no assets to load, call onComplete immediately
    if (this.totalAssets === 0) {
      if (this.onComplete) this.onComplete();
      return;
    }
    
    // Load models
    this.loadModels();
    
    // Load textures
    this.loadTextures();
    
    // Load audio
    this.loadAudio();
  }
  
  loadModels() {
    // Find all model registrations
    const modelElements = document.querySelectorAll('[data-asset-type="model"]');
    
    modelElements.forEach(element => {
      const name = element.getAttribute('data-asset-name');
      const path = element.getAttribute('data-asset-path');
      
      this.gltfLoader.load(
        path,
        (gltf) => {
          this.models[name] = gltf;
          this.assetLoaded();
        },
        (xhr) => {
          // Progress callback if needed
        },
        (error) => {
          console.error(`Error loading model ${name}:`, error);
          this.assetLoaded();
        }
      );
    });
    
    // Handle case where no models are registered
    if (modelElements.length === 0) {
      // Create placeholder rabbit model if no models are loaded
      // This is just for development until real assets are available
      this.createPlaceholderRabbitModel();
    }
  }
  
  createPlaceholderRabbitModel() {
    // Create a detailed rabbit using primitives
    const rabbitGroup = new THREE.Group();
    
    // Body - make it EXTREMELY bright and colorful with MASSIVE glow
    const bodyGeometry = new THREE.SphereGeometry(0.8, 24, 24);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff00ff, // Bright magenta color
      emissive: 0xff00ff, // Same color for emissive
      emissiveIntensity: 2.0, // SUPER strong glow
      shininess: 200
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 0.8, 1.2); // Make it oval-shaped
    rabbitGroup.add(body);
    
    // Add a MASSIVE glow effect around the rabbit
    const glowGeometry = new THREE.SphereGeometry(1.0, 24, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.7, // Much more visible
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.set(2.0, 1.8, 2.2); // MUCH larger than the body
    rabbitGroup.add(glow);
    
    // Add a second, even larger glow layer
    const outerGlowGeometry = new THREE.SphereGeometry(1.0, 24, 24);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    outerGlow.scale.set(3.0, 2.8, 3.2); // ENORMOUS glow effect
    rabbitGroup.add(outerGlow);
    
    // Head - larger and more detailed with glow
    const headGeometry = new THREE.SphereGeometry(0.5, 24, 24);
    const headMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff99ff, // Slightly lighter pink
      emissive: 0xff00ff,
      emissiveIntensity: 0.7,
      shininess: 80
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 0.5, 0.8);
    rabbitGroup.add(head);
    
    // Add a glow effect around the head
    const headGlowGeometry = new THREE.SphereGeometry(0.6, 24, 24);
    const headGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const headGlow = new THREE.Mesh(headGlowGeometry, headGlowMaterial);
    headGlow.position.copy(head.position);
    rabbitGroup.add(headGlow);
    
    // Ears - more prominent and shaped like rabbit ears
    const earGeometry = new THREE.ConeGeometry(0.2, 0.8, 12);
    const earMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff77ff, // Pink
      emissive: 0x550055,
      emissiveIntensity: 0.3,
      shininess: 30
    });
    
    // Inner ears
    const innerEarGeometry = new THREE.ConeGeometry(0.15, 0.7, 12);
    const innerEarMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffbbff, // Lighter pink
      emissive: 0x550055,
      emissiveIntensity: 0.1,
      shininess: 30
    });
    
    // Left ear with inner ear
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(-0.25, 1.1, 0.7);
    leftEar.rotation.set(-0.3, 0, -0.2);
    rabbitGroup.add(leftEar);
    
    const leftInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
    leftInnerEar.position.set(0, 0, 0.01);
    leftEar.add(leftInnerEar);
    
    // Right ear with inner ear
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(0.25, 1.1, 0.7);
    rightEar.rotation.set(-0.3, 0, 0.2);
    rabbitGroup.add(rightEar);
    
    const rightInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
    rightInnerEar.position.set(0, 0, 0.01);
    rightEar.add(rightInnerEar);
    
    // Feet - larger and more detailed
    const frontFootGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const footMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff99ff, // Pink
      emissive: 0x550055,
      emissiveIntensity: 0.2,
      shininess: 30
    });
    
    // Front feet
    const leftFrontFoot = new THREE.Mesh(frontFootGeometry, footMaterial);
    leftFrontFoot.position.set(-0.4, -0.3, 0.6);
    leftFrontFoot.scale.set(0.7, 0.4, 0.7);
    rabbitGroup.add(leftFrontFoot);
    
    const rightFrontFoot = new THREE.Mesh(frontFootGeometry, footMaterial);
    rightFrontFoot.position.set(0.4, -0.3, 0.6);
    rightFrontFoot.scale.set(0.7, 0.4, 0.7);
    rabbitGroup.add(rightFrontFoot);
    
    // Back feet - larger
    const backFootGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    
    const leftBackFoot = new THREE.Mesh(backFootGeometry, footMaterial);
    leftBackFoot.position.set(-0.4, -0.4, -0.4);
    leftBackFoot.scale.set(1, 0.5, 1.5);
    rabbitGroup.add(leftBackFoot);
    
    const rightBackFoot = new THREE.Mesh(backFootGeometry, footMaterial);
    rightBackFoot.position.set(0.4, -0.4, -0.4);
    rightBackFoot.scale.set(1, 0.5, 1.5);
    rabbitGroup.add(rightBackFoot);
    
    // Tail - fluffy and more visible
    const tailGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const tailMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, // White
      emissive: 0x550055,
      emissiveIntensity: 0.1,
      shininess: 30
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0, -1.0);
    rabbitGroup.add(tail);
    
    // Eyes - larger and more expressive
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x000000, // Black
      shininess: 100
    });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 0.6, 1.2);
    rabbitGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 0.6, 1.2);
    rabbitGroup.add(rightEye);
    
    // Eye highlights
    const highlightGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    leftHighlight.position.set(0.03, 0.03, 0.03);
    leftEye.add(leftHighlight);
    
    const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    rightHighlight.position.set(0.03, 0.03, 0.03);
    rightEye.add(rightHighlight);
    
    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const noseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff5555, // Red
      emissive: 0x550000,
      emissiveIntensity: 0.2,
      shininess: 80
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.45, 1.25);
    nose.scale.set(1, 0.8, 0.8);
    rabbitGroup.add(nose);
    
    // Whiskers
    const whiskerMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // Left whiskers
    for (let i = 0; i < 3; i++) {
      const whiskerGeometry = new THREE.BufferGeometry();
      const points = [
        new THREE.Vector3(-0.1, 0.45, 1.25),
        new THREE.Vector3(-0.5, 0.45 + (i - 1) * 0.1, 1.2)
      ];
      whiskerGeometry.setFromPoints(points);
      const whisker = new THREE.Line(whiskerGeometry, whiskerMaterial);
      rabbitGroup.add(whisker);
    }
    
    // Right whiskers
    for (let i = 0; i < 3; i++) {
      const whiskerGeometry = new THREE.BufferGeometry();
      const points = [
        new THREE.Vector3(0.1, 0.45, 1.25),
        new THREE.Vector3(0.5, 0.45 + (i - 1) * 0.1, 1.2)
      ];
      whiskerGeometry.setFromPoints(points);
      const whisker = new THREE.Line(whiskerGeometry, whiskerMaterial);
      rabbitGroup.add(whisker);
    }
    
    // Mouth
    const mouthGeometry = new THREE.BufferGeometry();
    const mouthPoints = [
      new THREE.Vector3(-0.1, 0.35, 1.25),
      new THREE.Vector3(0, 0.3, 1.25),
      new THREE.Vector3(0.1, 0.35, 1.25)
    ];
    mouthGeometry.setFromPoints(mouthPoints);
    const mouth = new THREE.Line(mouthGeometry, new THREE.LineBasicMaterial({ color: 0x000000 }));
    rabbitGroup.add(mouth);
    
    // Scale the entire rabbit to make it more visible
    rabbitGroup.scale.set(1.5, 1.5, 1.5);
    
    // Store the model
    this.models.rabbit = { scene: rabbitGroup };
  }
  
  loadTextures() {
    // Find all texture registrations
    const textureElements = document.querySelectorAll('[data-asset-type="texture"]');
    
    textureElements.forEach(element => {
      const name = element.getAttribute('data-asset-name');
      const path = element.getAttribute('data-asset-path');
      
      this.textureLoader.load(
        path,
        (texture) => {
          this.textures[name] = texture;
          this.assetLoaded();
        },
        undefined,
        (error) => {
          console.error(`Error loading texture ${name}:`, error);
          this.assetLoaded();
        }
      );
    });
    
    // Handle case where no textures are registered
    if (textureElements.length === 0) {
      // Create placeholder textures
      this.createPlaceholderTextures();
    }
  }
  
  createPlaceholderTextures() {
    // Create a simple platform texture
    const platformCanvas = document.createElement('canvas');
    platformCanvas.width = 512;
    platformCanvas.height = 512;
    const platformCtx = platformCanvas.getContext('2d');
    
    // Fill with dark blue
    platformCtx.fillStyle = '#0a1a2a';
    platformCtx.fillRect(0, 0, 512, 512);
    
    // Add grid lines
    platformCtx.strokeStyle = '#0088ff';
    platformCtx.lineWidth = 2;
    
    // Horizontal lines
    for (let i = 0; i < 512; i += 32) {
      platformCtx.beginPath();
      platformCtx.moveTo(0, i);
      platformCtx.lineTo(512, i);
      platformCtx.stroke();
    }
    
    // Vertical lines
    for (let i = 0; i < 512; i += 32) {
      platformCtx.beginPath();
      platformCtx.moveTo(i, 0);
      platformCtx.lineTo(i, 512);
      platformCtx.stroke();
    }
    
    // Create texture from canvas
    const platformTexture = new THREE.CanvasTexture(platformCanvas);
    platformTexture.wrapS = THREE.RepeatWrapping;
    platformTexture.wrapT = THREE.RepeatWrapping;
    this.textures.platform = platformTexture;
    
    // Create a checkpoint texture
    const checkpointCanvas = document.createElement('canvas');
    checkpointCanvas.width = 512;
    checkpointCanvas.height = 512;
    const checkpointCtx = checkpointCanvas.getContext('2d');
    
    // Fill with transparent
    checkpointCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    checkpointCtx.fillRect(0, 0, 512, 512);
    
    // Draw glowing circle
    const gradient = checkpointCtx.createRadialGradient(256, 256, 50, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 0, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
    
    checkpointCtx.fillStyle = gradient;
    checkpointCtx.beginPath();
    checkpointCtx.arc(256, 256, 256, 0, Math.PI * 2);
    checkpointCtx.fill();
    
    // Create texture from canvas
    const checkpointTexture = new THREE.CanvasTexture(checkpointCanvas);
    this.textures.checkpoint = checkpointTexture;
  }
  
  loadAudio() {
    // Find all audio registrations
    const audioElements = document.querySelectorAll('[data-asset-type="audio"]');
    
    // Keep track of how many audio files we're loading
    let audioFilesToLoad = audioElements.length;
    
    // If no audio elements found, create placeholders and return
    if (audioElements.length === 0) {
      this.createPlaceholderAudio();
      return;
    }
    
    // Function to handle audio loading completion
    const handleAudioLoaded = (name, audio) => {
      console.log(`Audio loaded: ${name}`);
      this.audio[name] = audio;
      this.assetLoaded();
    };
    
    // Function to handle audio loading errors
    const handleAudioError = (name, error) => {
      console.error(`Error loading audio ${name}:`, error);
      this.assetLoaded();
    };
    
    // Process each audio element
    audioElements.forEach(element => {
      const name = element.getAttribute('data-asset-name');
      const path = element.getAttribute('data-asset-path');
      
      console.log(`Loading audio: ${name} from ${path}`);
      
      try {
        // Create audio element
        const audio = new Audio();
        
        // Set up event listeners
        audio.addEventListener('canplaythrough', () => {
          handleAudioLoaded(name, audio);
        }, { once: true });
        
        audio.addEventListener('error', (e) => {
          handleAudioError(name, e.error);
        }, { once: true });
        
        // Set source and start loading
        audio.preload = 'auto';
        audio.src = path;
        audio.load();
        
        // Set a timeout in case the audio never triggers canplaythrough
        setTimeout(() => {
          if (!this.audio[name]) {
            console.warn(`Audio ${name} load timed out, continuing anyway`);
            handleAudioLoaded(name, audio);
          }
        }, 5000);
      } catch (error) {
        handleAudioError(name, error);
      }
    });
  }
  
  createPlaceholderAudio() {
    // For development, we'll just create empty audio elements
    // In a real game, you'd want to load actual audio files
    
    const audioTypes = ['jump', 'checkpoint', 'background', 'timer-low'];
    
    audioTypes.forEach(type => {
      const audio = new Audio();
      audio.volume = 0;
      this.audio[type] = audio;
    });
  }
  
  assetLoaded() {
    this.loadedAssets++;
    
    // Calculate progress
    const progress = this.loadedAssets / this.totalAssets;
    
    // Call progress callback
    if (this.onProgress) {
      this.onProgress(progress);
    }
    
    // Check if all assets are loaded
    if (this.loadedAssets >= this.totalAssets) {
      // Call complete callback
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }
  
  getModel(name) {
    return this.models[name];
  }
  
  getTexture(name) {
    return this.textures[name];
  }
  
  getAudio(name) {
    return this.audio[name];
  }
}
