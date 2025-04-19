import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

export class Platform {
  constructor(game, options = {}) {
    this.game = game;
    
    // Set default options
    this.options = Object.assign({
      position: { x: 0, y: 0, z: 0 },
      dimensions: { width: 10, height: 1, depth: 10 },
      color: 0x0088ff,
      texture: null,
      isMoving: false,
      movementPath: [],
      movementDuration: 3000,
      movementLoop: true,
      movementDelay: 0,
      emissive: false,
      emissiveColor: 0x001133,
      emissiveIntensity: 0.5
    }, options);
    
    // Create mesh
    this.createMesh();
    
    // Set up movement if this is a moving platform
    if (this.options.isMoving && this.options.movementPath.length > 0) {
      this.setupMovement();
    }
    
    // Add to physics system
    this.game.physicsManager.addCollider(this);
  }
  
  createMesh() {
    // Create geometry
    const geometry = new THREE.BoxGeometry(
      this.options.dimensions.width,
      this.options.dimensions.height,
      this.options.dimensions.depth
    );
    
    // Create material
    let material;
    
    if (this.options.texture) {
      // Use texture if provided
      const texture = this.game.assetManager.getTexture(this.options.texture);
      
      if (texture) {
        // Set texture repeat based on dimensions
        texture.repeat.set(
          this.options.dimensions.width / 2,
          this.options.dimensions.depth / 2
        );
        
        material = new THREE.MeshStandardMaterial({
          map: texture,
          color: this.options.color
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: this.options.color
        });
      }
    } else {
      material = new THREE.MeshStandardMaterial({
        color: this.options.color
      });
    }
    
    // Add emissive properties if enabled
    if (this.options.emissive) {
      material.emissive.set(this.options.emissiveColor);
      material.emissiveIntensity = this.options.emissiveIntensity;
    }
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    
    // Set position
    this.mesh.position.set(
      this.options.position.x,
      this.options.position.y,
      this.options.position.z
    );
    
    // Enable shadows
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Add to scene
    this.game.scene.add(this.mesh);
  }
  
  setupMovement() {
    // Create a sequence of tweens for each point in the movement path
    this.tweens = [];
    
    // Start with the current position
    let currentPosition = {
      x: this.options.position.x,
      y: this.options.position.y,
      z: this.options.position.z
    };
    
    // Create a tween for each point in the path
    for (let i = 0; i < this.options.movementPath.length; i++) {
      const nextPosition = this.options.movementPath[i];
      
      // Calculate duration based on distance
      let duration = this.options.movementDuration;
      if (this.options.speedBased) {
        const distance = Math.sqrt(
          Math.pow(nextPosition.x - currentPosition.x, 2) +
          Math.pow(nextPosition.y - currentPosition.y, 2) +
          Math.pow(nextPosition.z - currentPosition.z, 2)
        );
        duration = distance * this.options.movementSpeed;
      }
      
      // Create tween
      const tween = new TWEEN.Tween(currentPosition)
        .to(nextPosition, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          this.mesh.position.set(
            currentPosition.x,
            currentPosition.y,
            currentPosition.z
          );
        });
      
      // Add to tweens array
      this.tweens.push(tween);
      
      // Update current position
      currentPosition = {
        x: nextPosition.x,
        y: nextPosition.y,
        z: nextPosition.z
      };
    }
    
    // If looping, add a tween back to the start
    if (this.options.movementLoop && this.options.movementPath.length > 0) {
      const startPosition = {
        x: this.options.position.x,
        y: this.options.position.y,
        z: this.options.position.z
      };
      
      // Calculate duration based on distance
      let duration = this.options.movementDuration;
      if (this.options.speedBased) {
        const distance = Math.sqrt(
          Math.pow(startPosition.x - currentPosition.x, 2) +
          Math.pow(startPosition.y - currentPosition.y, 2) +
          Math.pow(startPosition.z - currentPosition.z, 2)
        );
        duration = distance * this.options.movementSpeed;
      }
      
      // Create tween
      const tween = new TWEEN.Tween(currentPosition)
        .to(startPosition, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          this.mesh.position.set(
            currentPosition.x,
            currentPosition.y,
            currentPosition.z
          );
        });
      
      // Add to tweens array
      this.tweens.push(tween);
    }
    
    // Chain tweens
    for (let i = 0; i < this.tweens.length - 1; i++) {
      this.tweens[i].chain(this.tweens[i + 1]);
    }
    
    // If looping, chain the last tween to the first
    if (this.options.movementLoop && this.tweens.length > 0) {
      this.tweens[this.tweens.length - 1].chain(this.tweens[0]);
    }
    
    // Start movement after delay
    setTimeout(() => {
      if (this.tweens.length > 0) {
        this.tweens[0].start();
      }
    }, this.options.movementDelay);
  }
  
  update(deltaTime) {
    // Update is handled by TWEEN for moving platforms
  }
}
