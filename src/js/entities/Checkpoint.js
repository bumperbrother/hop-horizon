import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

export class Checkpoint {
  constructor(game, options = {}) {
    this.game = game;
    
    // Set default options
    this.options = Object.assign({
      position: { x: 0, y: 0, z: 0 },
      radius: 1.5,
      height: 0.1,
      color: 0xff00ff,
      emissiveIntensity: 0.8,
      pulseSpeed: 2.0,
      rotationSpeed: 1.0
    }, options);
    
    // State
    this.triggered = false;
    
    // Create mesh
    this.createMesh();
    
    // Add to physics system
    this.game.physicsManager.addCheckpoint(this);
  }
  
  createMesh() {
    // Create a group for the checkpoint
    this.mesh = new THREE.Group();
    this.mesh.position.set(
      this.options.position.x,
      this.options.position.y,
      this.options.position.z
    );
    
    // Create the base (cylinder)
    const baseGeometry = new THREE.CylinderGeometry(
      this.options.radius,
      this.options.radius,
      this.options.height,
      32
    );
    
    // Create material
    let baseMaterial;
    
    if (this.game.assetManager.getTexture('checkpoint')) {
      // Use checkpoint texture if available
      const texture = this.game.assetManager.getTexture('checkpoint');
      
      baseMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        color: this.options.color,
        transparent: true,
        opacity: 0.8,
        emissive: this.options.color,
        emissiveIntensity: this.options.emissiveIntensity
      });
    } else {
      // Otherwise use a basic material
      baseMaterial = new THREE.MeshStandardMaterial({
        color: this.options.color,
        transparent: true,
        opacity: 0.8,
        emissive: this.options.color,
        emissiveIntensity: this.options.emissiveIntensity
      });
    }
    
    this.base = new THREE.Mesh(baseGeometry, baseMaterial);
    this.base.rotation.x = Math.PI / 2; // Lay flat
    this.mesh.add(this.base);
    
    // Create the holographic effect (rings)
    this.rings = [];
    
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(
        this.options.radius * (0.6 + i * 0.2),
        0.05,
        16,
        32
      );
      
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: this.options.color,
        transparent: true,
        opacity: 0.5,
        emissive: this.options.color,
        emissiveIntensity: this.options.emissiveIntensity,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2; // Align with base
      ring.position.y = 0.5 + i * 0.3; // Stack above base
      
      this.rings.push(ring);
      this.mesh.add(ring);
    }
    
    // Create particles for the holographic effect
    this.createParticles();
    
    // Add to scene
    this.game.scene.add(this.mesh);
    
    // Set up animation
    this.setupAnimation();
  }
  
  createParticles() {
    // Create particles
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.options.radius;
      
      particlePositions[i3] = Math.cos(angle) * radius;
      particlePositions[i3 + 1] = Math.random() * 2; // Height
      particlePositions[i3 + 2] = Math.sin(angle) * radius;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: this.options.color,
      size: 0.1,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.mesh.add(this.particles);
    
    // Store original positions for animation
    this.particleOriginalPositions = particlePositions.slice();
  }
  
  setupAnimation() {
    // Set up pulsing animation
    this.pulseTime = 0;
    
    // Set up rotation animation
    this.rotationTime = 0;
  }
  
  update(deltaTime) {
    if (this.triggered) return;
    
    // Update pulse animation
    this.pulseTime += deltaTime * this.options.pulseSpeed;
    const pulseScale = 1 + Math.sin(this.pulseTime) * 0.1;
    
    this.base.scale.set(pulseScale, pulseScale, 1);
    
    // Update ring rotation
    this.rotationTime += deltaTime * this.options.rotationSpeed;
    
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      ring.rotation.z = this.rotationTime * (i % 2 === 0 ? 1 : -1);
    }
    
    // Update particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const i3 = i * 3;
        
        // Get original position
        const x = this.particleOriginalPositions[i3];
        const y = this.particleOriginalPositions[i3 + 1];
        const z = this.particleOriginalPositions[i3 + 2];
        
        // Apply floating animation
        positions[i3] = x;
        positions[i3 + 1] = y + Math.sin(this.pulseTime + i) * 0.2;
        positions[i3 + 2] = z;
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  trigger() {
    if (this.triggered) return;
    
    this.triggered = true;
    
    // Create a flash effect
    this.createFlashEffect();
    
    // Fade out the checkpoint
    this.fadeOut();
  }
  
  createFlashEffect() {
    // Create a flash of light
    const flashGeometry = new THREE.SphereGeometry(this.options.radius * 2, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: this.options.color,
      transparent: true,
      opacity: 1
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    this.mesh.add(flash);
    
    // Animate the flash
    new TWEEN.Tween(flash.scale)
      .to({ x: 3, y: 3, z: 3 }, 500)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
    
    new TWEEN.Tween(flashMaterial)
      .to({ opacity: 0 }, 500)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        this.mesh.remove(flash);
        flashGeometry.dispose();
        flashMaterial.dispose();
      })
      .start();
  }
  
  fadeOut() {
    // Fade out the base
    new TWEEN.Tween(this.base.material)
      .to({ opacity: 0.2 }, 1000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
    
    // Fade out the rings
    for (const ring of this.rings) {
      new TWEEN.Tween(ring.material)
        .to({ opacity: 0.1 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    }
    
    // Fade out particles
    if (this.particles) {
      new TWEEN.Tween(this.particles.material)
        .to({ opacity: 0.1 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    }
  }
}
