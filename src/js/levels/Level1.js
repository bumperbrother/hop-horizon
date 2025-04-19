import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Platform } from '../entities/Platform.js';
import { Checkpoint } from '../entities/Checkpoint.js';
import { FinishArea } from '../entities/FinishArea.js';

export class Level1 {
  constructor(game) {
    this.game = game;
    
    // Level properties
    this.name = 'Hop Horizon - Level 1';
    this.startPosition = { x: 0, y: 2, z: 0 };
    
    // Level objects
    this.platforms = [];
    this.checkpoints = [];
    this.finishArea = null;
    this.player = null;
    
    // Level state
    this.initialized = false;
  }
  
  init() {
    // Create player
    this.player = new Player(this.game, this.startPosition);
    
    // Create level geometry
    this.createEnvironment();
    
    // Create checkpoints
    this.createCheckpoints();
    
    // Create finish area
    this.createFinishArea();
    
    // Set initialized flag
    this.initialized = true;
  }
  
  createEnvironment() {
    // Create skybox
    this.createSkybox();
    
    // Create starting platform
    this.platforms.push(
      new Platform(this.game, {
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 10, height: 1, depth: 10 },
        color: 0x0088ff,
        texture: 'platform'
      })
    );
    
    // Create path platforms
    
    // Platform 1 - First jump
    this.platforms.push(
      new Platform(this.game, {
        position: { x: 0, y: 0, z: -15 },
        dimensions: { width: 8, height: 1, depth: 8 },
        color: 0x0088ff,
        texture: 'platform'
      })
    );
    
    // Platform 2 - Moving platform (horizontal)
    this.platforms.push(
      new Platform(this.game, {
        position: { x: -10, y: 0, z: -25 },
        dimensions: { width: 6, height: 1, depth: 6 },
        color: 0x00aaff,
        texture: 'platform',
        isMoving: true,
        movementPath: [
          { x: 10, y: 0, z: -25 }
        ],
        movementDuration: 4000,
        movementLoop: true,
        emissive: true,
        emissiveColor: 0x0044aa,
        emissiveIntensity: 0.5
      })
    );
    
    // Platform 3 - Higher platform
    this.platforms.push(
      new Platform(this.game, {
        position: { x: 0, y: 3, z: -40 },
        dimensions: { width: 8, height: 1, depth: 8 },
        color: 0x0088ff,
        texture: 'platform'
      })
    );
    
    // Platform 4 - Moving platform (vertical)
    this.platforms.push(
      new Platform(this.game, {
        position: { x: 15, y: 3, z: -50 },
        dimensions: { width: 6, height: 1, depth: 6 },
        color: 0x00aaff,
        texture: 'platform',
        isMoving: true,
        movementPath: [
          { x: 15, y: 8, z: -50 }
        ],
        movementDuration: 3000,
        movementLoop: true,
        emissive: true,
        emissiveColor: 0x0044aa,
        emissiveIntensity: 0.5
      })
    );
    
    // Platform 5 - Higher platform
    this.platforms.push(
      new Platform(this.game, {
        position: { x: 30, y: 8, z: -50 },
        dimensions: { width: 8, height: 1, depth: 8 },
        color: 0x0088ff,
        texture: 'platform'
      })
    );
    
    // Platform 6 - Small platforms in sequence (requires precise jumps)
    for (let i = 0; i < 5; i++) {
      this.platforms.push(
        new Platform(this.game, {
          position: { x: 30 - i * 4, y: 8, z: -65 - i * 4 },
          dimensions: { width: 2, height: 1, depth: 2 },
          color: 0x0088ff,
          texture: 'platform'
        })
      );
    }
    
    // Platform 7 - Moving platform (circular)
    this.platforms.push(
      new Platform(this.game, {
        position: { x: 10, y: 8, z: -85 },
        dimensions: { width: 6, height: 1, depth: 6 },
        color: 0x00aaff,
        texture: 'platform',
        isMoving: true,
        movementPath: [
          { x: 10, y: 8, z: -95 },
          { x: 20, y: 8, z: -95 },
          { x: 20, y: 8, z: -85 }
        ],
        movementDuration: 2000,
        movementLoop: true,
        emissive: true,
        emissiveColor: 0x0044aa,
        emissiveIntensity: 0.5
      })
    );
    
    // Platform 8 - Final platform
    this.platforms.push(
      new Platform(this.game, {
        position: { x: 0, y: 8, z: -110 },
        dimensions: { width: 12, height: 1, depth: 12 },
        color: 0x00ffff,
        texture: 'platform',
        emissive: true,
        emissiveColor: 0x00aaaa,
        emissiveIntensity: 0.7
      })
    );
    
    // Add some decorative elements
    this.createDecorations();
  }
  
  createSkybox() {
    // Create a simple skybox
    const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyboxMaterials = [];
    
    // Create gradient materials for each side
    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');
      
      // Create gradient
      const gradient = context.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#000520');
      gradient.addColorStop(1, '#003070');
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 512);
      
      // Add some stars
      context.fillStyle = '#ffffff';
      for (let j = 0; j < 100; j++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = Math.random() * 1.5;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      skyboxMaterials.push(new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide }));
    }
    
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
    this.game.scene.add(skybox);
  }
  
  createDecorations() {
    // Add some floating decorative elements
    
    // Create some floating cubes
    for (let i = 0; i < 20; i++) {
      const size = Math.random() * 2 + 0.5;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(Math.random() * 0.1, Math.random() * 0.1 + 0.4, Math.random() * 0.1 + 0.8),
        transparent: true,
        opacity: 0.7,
        emissive: new THREE.Color(0, 0.2, 0.5),
        emissiveIntensity: 0.5
      });
      
      const cube = new THREE.Mesh(geometry, material);
      
      // Position randomly around the level
      cube.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 50 + 20,
        (Math.random() - 0.5) * 100 - 50
      );
      
      // Rotate randomly
      cube.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      this.game.scene.add(cube);
      
      // Add animation
      const rotationSpeed = {
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2,
        z: (Math.random() - 0.5) * 0.2
      };
      
      cube.userData.update = (deltaTime) => {
        cube.rotation.x += rotationSpeed.x * deltaTime;
        cube.rotation.y += rotationSpeed.y * deltaTime;
        cube.rotation.z += rotationSpeed.z * deltaTime;
      };
      
      // Add to update list
      if (!this.decorations) this.decorations = [];
      this.decorations.push(cube);
    }
    
    // Add some light beams
    for (let i = 0; i < 5; i++) {
      const height = Math.random() * 50 + 50;
      const geometry = new THREE.CylinderGeometry(0.5, 0.5, height, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0, 1, 1),
        transparent: true,
        opacity: 0.2
      });
      
      const beam = new THREE.Mesh(geometry, material);
      
      // Position randomly
      beam.position.set(
        (Math.random() - 0.5) * 100,
        height / 2,
        (Math.random() - 0.5) * 100 - 50
      );
      
      this.game.scene.add(beam);
    }
  }
  
  createCheckpoints() {
    // Checkpoint 1 - After first jump
    this.checkpoints.push(
      new Checkpoint(this.game, {
        position: { x: 0, y: 1, z: -15 },
        color: 0xff00ff
      })
    );
    
    // Checkpoint 2 - After moving platform
    this.checkpoints.push(
      new Checkpoint(this.game, {
        position: { x: 0, y: 1, z: -25 },
        color: 0xff00ff
      })
    );
    
    // Checkpoint 3 - On higher platform
    this.checkpoints.push(
      new Checkpoint(this.game, {
        position: { x: 0, y: 4, z: -40 },
        color: 0xff00ff
      })
    );
    
    // Checkpoint 4 - After vertical moving platform
    this.checkpoints.push(
      new Checkpoint(this.game, {
        position: { x: 30, y: 9, z: -50 },
        color: 0xff00ff
      })
    );
    
    // Checkpoint 5 - After small platforms
    this.checkpoints.push(
      new Checkpoint(this.game, {
        position: { x: 10, y: 9, z: -85 },
        color: 0xff00ff
      })
    );
    
    // Checkpoint 6 - Before final platform
    this.checkpoints.push(
      new Checkpoint(this.game, {
        position: { x: 0, y: 9, z: -100 },
        color: 0xff00ff
      })
    );
  }
  
  createFinishArea() {
    // Create finish area on the final platform
    this.finishArea = new FinishArea(this.game, {
      position: { x: 0, y: 11, z: -110 },
      dimensions: { width: 5, height: 5, depth: 5 },
      color: 0x00ffff
    });
  }
  
  update(deltaTime) {
    // Update checkpoints
    for (const checkpoint of this.checkpoints) {
      if (checkpoint.update) {
        checkpoint.update(deltaTime);
      }
    }
    
    // Update finish area
    if (this.finishArea && this.finishArea.update) {
      this.finishArea.update(deltaTime);
    }
    
    // Update decorations
    if (this.decorations) {
      for (const decoration of this.decorations) {
        if (decoration.userData.update) {
          decoration.userData.update(deltaTime);
        }
      }
    }
  }
  
  reset() {
    // Reset player position
    if (this.player) {
      this.player.reset(this.startPosition);
    }
    
    // Reset checkpoints
    for (const checkpoint of this.checkpoints) {
      checkpoint.triggered = false;
    }
  }
}
