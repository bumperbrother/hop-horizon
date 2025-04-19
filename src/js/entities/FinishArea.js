import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

export class FinishArea {
  constructor(game, options = {}) {
    this.game = game;
    
    // Set default options
    this.options = Object.assign({
      position: { x: 0, y: 0, z: 0 },
      dimensions: { width: 5, height: 5, depth: 5 },
      color: 0x00ffff,
      emissiveIntensity: 0.8,
      pulseSpeed: 1.0,
      rotationSpeed: 0.5
    }, options);
    
    // Create mesh
    this.createMesh();
    
    // Add to physics system
    this.game.physicsManager.setFinishArea(this);
  }
  
  createMesh() {
    // Create a group for the finish area
    this.mesh = new THREE.Group();
    this.mesh.position.set(
      this.options.position.x,
      this.options.position.y,
      this.options.position.z
    );
    
    // Create the outer box (wireframe)
    const boxGeometry = new THREE.BoxGeometry(
      this.options.dimensions.width,
      this.options.dimensions.height,
      this.options.dimensions.depth
    );
    
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: this.options.color,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    
    this.box = new THREE.Mesh(boxGeometry, boxMaterial);
    this.mesh.add(this.box);
    
    // Create inner glow
    const glowGeometry = new THREE.BoxGeometry(
      this.options.dimensions.width * 0.9,
      this.options.dimensions.height * 0.9,
      this.options.dimensions.depth * 0.9
    );
    
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.options.color,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glow);
    
    // Create particles
    this.createParticles();
    
    // Create portal effect
    this.createPortalEffect();
    
    // Add to scene
    this.game.scene.add(this.mesh);
    
    // Set up animation
    this.setupAnimation();
  }
  
  createParticles() {
    // Create particles
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random position within the box
      particlePositions[i3] = (Math.random() - 0.5) * this.options.dimensions.width;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * this.options.dimensions.height;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * this.options.dimensions.depth;
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
  
  createPortalEffect() {
    // Create a circular portal in the center
    const portalGeometry = new THREE.CircleGeometry(
      Math.min(
        this.options.dimensions.width,
        this.options.dimensions.height,
        this.options.dimensions.depth
      ) * 0.3,
      32
    );
    
    const portalMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    this.portal = new THREE.Mesh(portalGeometry, portalMaterial);
    
    // Position at the center of the finish area
    this.portal.position.set(0, 0, 0);
    
    // Rotate to face forward
    this.portal.rotation.y = Math.PI / 2;
    
    this.mesh.add(this.portal);
    
    // Add glow effect around portal
    const portalGlowGeometry = new THREE.RingGeometry(
      portalGeometry.parameters.radius,
      portalGeometry.parameters.radius * 1.2,
      32
    );
    
    const portalGlowMaterial = new THREE.MeshBasicMaterial({
      color: this.options.color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    this.portalGlow = new THREE.Mesh(portalGlowGeometry, portalGlowMaterial);
    this.portalGlow.position.copy(this.portal.position);
    this.portalGlow.rotation.copy(this.portal.rotation);
    
    this.mesh.add(this.portalGlow);
  }
  
  setupAnimation() {
    // Set up pulsing animation
    this.pulseTime = 0;
    
    // Set up rotation animation
    this.rotationTime = 0;
  }
  
  update(deltaTime) {
    // Update pulse animation
    this.pulseTime += deltaTime * this.options.pulseSpeed;
    const pulseScale = 1 + Math.sin(this.pulseTime) * 0.1;
    
    this.box.scale.set(pulseScale, pulseScale, pulseScale);
    
    // Update glow opacity
    if (this.glow) {
      this.glow.material.opacity = 0.1 + Math.abs(Math.sin(this.pulseTime)) * 0.2;
    }
    
    // Update portal
    if (this.portal) {
      this.portal.rotation.z += deltaTime * this.options.rotationSpeed;
      this.portalGlow.rotation.z -= deltaTime * this.options.rotationSpeed * 0.5;
      
      // Pulse portal size
      const portalPulse = 1 + Math.sin(this.pulseTime * 1.5) * 0.1;
      this.portal.scale.set(portalPulse, portalPulse, portalPulse);
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
        positions[i3] = x + Math.sin(this.pulseTime + i * 0.1) * 0.2;
        positions[i3 + 1] = y + Math.cos(this.pulseTime + i * 0.1) * 0.2;
        positions[i3 + 2] = z + Math.sin(this.pulseTime * 0.5 + i * 0.1) * 0.2;
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  triggerFinishEffect() {
    // Create a flash effect
    const flashGeometry = new THREE.SphereGeometry(
      Math.max(
        this.options.dimensions.width,
        this.options.dimensions.height,
        this.options.dimensions.depth
      ),
      16,
      16
    );
    
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    this.mesh.add(flash);
    
    // Animate the flash
    new TWEEN.Tween(flash.scale)
      .to({ x: 3, y: 3, z: 3 }, 1000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
    
    new TWEEN.Tween(flashMaterial)
      .to({ opacity: 0 }, 1000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        this.mesh.remove(flash);
        flashGeometry.dispose();
        flashMaterial.dispose();
      })
      .start();
    
    // Animate portal
    if (this.portal) {
      new TWEEN.Tween(this.portal.scale)
        .to({ x: 3, y: 3, z: 3 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
      
      new TWEEN.Tween(this.portal.material)
        .to({ opacity: 0 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
      
      new TWEEN.Tween(this.portalGlow.material)
        .to({ opacity: 0 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    }
  }
}
