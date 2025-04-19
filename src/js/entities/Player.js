import * as THREE from 'three';

export class Player {
  constructor(game, startPosition = { x: 0, y: 1, z: 0 }) {
    this.game = game;
    
    // Player properties
    this.height = 1.0;
    this.radius = 0.5;
    this.moveSpeed = 5.0;
    this.sprintMultiplier = 1.8;
    this.jumpForce = 8.0;
    this.doubleJumpForce = 6.0;
    
    // Physics properties
    this.position = new THREE.Vector3(startPosition.x, startPosition.y, startPosition.z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.isOnGround = false;
    this.affectedByGravity = true;
    this.checkCollisions = true;
    
    // Sound properties
    this.footstepTimer = 0;
    this.footstepInterval = 0.4; // Time between footsteps in seconds
    
    // Create mesh
    this.createMesh();
    
    // Add to physics system
    this.game.physicsManager.addEntity(this);
  }
  
  createMesh() {
    // Create a group for the player
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    
    // Create a simple capsule for collision
    this.collider = new THREE.Mesh(
      new THREE.CapsuleGeometry(this.radius, this.height - this.radius * 2, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true, visible: false })
    );
    this.mesh.add(this.collider);
    
    // Create a rabbit character using basic shapes
    this.rabbitGroup = new THREE.Group();
    this.rabbitGroup.position.y = 0.5; // Raise it above the platform
    this.mesh.add(this.rabbitGroup);
    
    // Material for all rabbit parts - bright pink with glow
    const rabbitMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff, // Hot pink
      emissive: 0xff00ff, // Same color for emissive
      emissiveIntensity: 1.0, // Strong glow
      shininess: 100
    });
    
    // Body - elongated sphere
    const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const body = new THREE.Mesh(bodyGeometry, rabbitMaterial);
    body.scale.set(1.0, 0.8, 1.5); // Make it oval-shaped
    this.rabbitGroup.add(body);
    
    // Head - sphere
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const head = new THREE.Mesh(headGeometry, rabbitMaterial);
    head.position.set(0, 0.3, 0.9); // Position at front of body
    this.rabbitGroup.add(head);
    
    // Ears - cylinders
    const earGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 8);
    
    // Left ear
    this.leftEar = new THREE.Mesh(earGeometry, rabbitMaterial);
    this.leftEar.position.set(-0.25, 0.9, 0.7);
    this.leftEar.rotation.set(-0.2, 0, -0.1);
    this.rabbitGroup.add(this.leftEar);
    
    // Right ear
    this.rightEar = new THREE.Mesh(earGeometry, rabbitMaterial);
    this.rightEar.position.set(0.25, 0.9, 0.7);
    this.rightEar.rotation.set(-0.2, 0, 0.1);
    this.rabbitGroup.add(this.rightEar);
    
    // Tail - small sphere
    const tailGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const tail = new THREE.Mesh(tailGeometry, rabbitMaterial);
    tail.position.set(0, 0.2, -0.9); // Position at back of body
    this.rabbitGroup.add(tail);
    
    // Legs - cylinders
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8);
    
    // Front legs
    const frontLeftLeg = new THREE.Mesh(legGeometry, rabbitMaterial);
    frontLeftLeg.position.set(-0.4, -0.5, 0.5);
    this.rabbitGroup.add(frontLeftLeg);
    
    const frontRightLeg = new THREE.Mesh(legGeometry, rabbitMaterial);
    frontRightLeg.position.set(0.4, -0.5, 0.5);
    this.rabbitGroup.add(frontRightLeg);
    
    // Back legs
    const backLeftLeg = new THREE.Mesh(legGeometry, rabbitMaterial);
    backLeftLeg.position.set(-0.4, -0.5, -0.5);
    this.rabbitGroup.add(backLeftLeg);
    
    const backRightLeg = new THREE.Mesh(legGeometry, rabbitMaterial);
    backRightLeg.position.set(0.4, -0.5, -0.5);
    this.rabbitGroup.add(backRightLeg);
    
    // Eyes - small dark spheres
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0.4, 1.4);
    this.rabbitGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0.4, 1.4);
    this.rabbitGroup.add(rightEye);
    
    // Nose - small sphere
    const noseGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const noseMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0.2, 1.5);
    this.rabbitGroup.add(nose);
    
    // Add a glow effect around the rabbit
    const glowGeometry = new THREE.SphereGeometry(2.0, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.rabbitGroup.add(glow);
    
    // Scale the entire rabbit to match the cube size
    this.rabbitGroup.scale.set(0.8, 0.8, 0.8);
    
    // Store reference to model for animations
    this.model = this.rabbitGroup;
    
    // Animation properties
    this.earAnimationTime = 0;
    
    // Add to scene
    this.game.scene.add(this.mesh);
    
    // Create trail effect
    this.createTrailEffect();
  }
  
  createTrailEffect() {
    // Create a trail effect that follows the player
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.7
    });
    
    // Create trail points
    const trailPoints = [];
    for (let i = 0; i < 50; i++) {
      trailPoints.push(this.position.clone());
    }
    
    trailGeometry.setFromPoints(trailPoints);
    this.trail = new THREE.Line(trailGeometry, trailMaterial);
    this.game.scene.add(this.trail);
    
    // Store trail points for updating
    this.trailPoints = trailPoints;
    this.trailUpdateCounter = 0;
  }
  
  update(deltaTime) {
    // Skip if game is not running
    if (!this.game.isRunning) return;
    
    // Get movement direction from input
    const direction = this.game.inputManager.getMovementDirection();
    
    // Apply movement
    this.move(direction, deltaTime);
    
    // Apply velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Update mesh position
    this.updatePosition();
    
    // Check if player fell out of the world
    if (this.position.y < -10) {
      this.game.gameOver();
    }
    
    // Update trail effect
    this.updateTrail(deltaTime);
    
    // Animate rabbit ears
    if (this.leftEar && this.rightEar) {
      // Update animation time
      this.earAnimationTime += deltaTime * 2;
      
      // Animate ears with a gentle bobbing motion
      const earAngle = Math.sin(this.earAnimationTime) * 0.1;
      
      // Left ear moves opposite to right ear
      this.leftEar.rotation.z = -0.1 + earAngle;
      this.rightEar.rotation.z = 0.1 - earAngle;
      
      // Add a slight forward/backward motion too
      this.leftEar.rotation.x = -0.2 + Math.cos(this.earAnimationTime * 0.7) * 0.05;
      this.rightEar.rotation.x = -0.2 + Math.cos(this.earAnimationTime * 0.7) * 0.05;
      
      // When jumping, make ears flop back
      if (!this.isOnGround) {
        this.leftEar.rotation.x = Math.min(this.leftEar.rotation.x - 0.2, -0.3);
        this.rightEar.rotation.x = Math.min(this.rightEar.rotation.x - 0.2, -0.3);
      }
    }
  }
  
  move(direction, deltaTime) {
    // Skip if no direction
    if (direction.x === 0 && direction.z === 0) {
      // Apply friction to slow down
      this.velocity.x *= 0.9;
      this.velocity.z *= 0.9;
      
      // Stop completely if very slow
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
      
      // Reset footstep timer when not moving
      this.footstepTimer = 0;
      
      return;
    }
    
    // Get camera direction
    const cameraDirection = new THREE.Vector3(0, 0, -1);
    cameraDirection.applyQuaternion(this.game.camera.quaternion);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    // Get camera right direction
    const cameraRight = new THREE.Vector3(1, 0, 0);
    cameraRight.applyQuaternion(this.game.camera.quaternion);
    cameraRight.y = 0;
    cameraRight.normalize();
    
    // Calculate movement direction relative to camera
    const moveDirection = new THREE.Vector3(0, 0, 0);
    moveDirection.addScaledVector(cameraDirection, -direction.z);
    moveDirection.addScaledVector(cameraRight, direction.x);
    moveDirection.normalize();
    
    // Calculate speed
    let speed = this.moveSpeed;
    if (this.game.inputManager.isSprinting()) {
      speed *= this.sprintMultiplier;
    }
    
    // Apply movement
    this.velocity.x = moveDirection.x * speed;
    this.velocity.z = moveDirection.z * speed;
    
    // Rotate rabbit to face movement direction
    if (this.rabbitGroup && (moveDirection.x !== 0 || moveDirection.z !== 0)) {
      const angle = Math.atan2(moveDirection.x, moveDirection.z);
      this.rabbitGroup.rotation.y = angle;
    }
    
    // Play footstep sounds when on ground
    if (this.isOnGround) {
      this.footstepTimer += deltaTime;
      
      // Adjust footstep interval based on speed (faster when sprinting)
      const currentInterval = this.game.inputManager.isSprinting() 
        ? this.footstepInterval / this.sprintMultiplier 
        : this.footstepInterval;
      
      if (this.footstepTimer >= currentInterval) {
        this.footstepTimer = 0;
        
        // Play footstep sound with slight pitch variation
        this.game.audioManager.play('footstep', {
          volume: 0.4,
          pitch: 0.9 + Math.random() * 0.2 // Random pitch between 0.9 and 1.1
        });
      }
    }
  }
  
  jump() {
    if (!this.isOnGround) return;
    
    this.velocity.y = this.jumpForce;
    this.isOnGround = false;
    
    // Play jump sound
    this.game.audioManager.play('jump', {
      volume: 0.8
    });
  }
  
  doubleJump() {
    this.velocity.y = this.doubleJumpForce;
    
    // Play double jump sound
    this.game.audioManager.play('double-jump', {
      volume: 0.9
    });
  }
  
  rotate(x, y) {
    // Rotate horizontally (around Y axis)
    this.rotation.y -= x;
    
    // Rotate vertically (around X axis)
    this.rotation.x -= y;
    
    // Clamp vertical rotation to prevent flipping
    const maxPitch = Math.PI / 2 - 0.01;
    this.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, this.rotation.x));
    
    // Apply rotation to camera
    this.game.camera.rotation.copy(this.rotation);
  }
  
  updatePosition() {
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    // Camera position is now handled by OrbitControls in Game.js
  }
  
  updateTrail(deltaTime) {
    // Update trail effect every few frames
    this.trailUpdateCounter += deltaTime;
    
    if (this.trailUpdateCounter >= 0.05) {
      this.trailUpdateCounter = 0;
      
      // Shift all points back
      for (let i = this.trailPoints.length - 1; i > 0; i--) {
        this.trailPoints[i].copy(this.trailPoints[i - 1]);
      }
      
      // Set first point to current position
      this.trailPoints[0].copy(this.position);
      
      // Update trail geometry
      this.trail.geometry.setFromPoints(this.trailPoints);
      this.trail.geometry.attributes.position.needsUpdate = true;
    }
    
    // Only show trail when moving and not on ground
    if (this.game.inputManager.isMoving() && !this.isOnGround) {
      this.trail.visible = true;
    } else {
      this.trail.visible = false;
    }
  }
  
  reset(position) {
    // Reset position
    this.position.copy(position);
    
    // Reset velocity
    this.velocity.set(0, 0, 0);
    
    // Reset rotation
    this.rotation.set(0, 0, 0, 'YXZ');
    
    // Reset physics state
    this.isOnGround = false;
    
    // Update position
    this.updatePosition();
    
    // Reset trail
    for (let i = 0; i < this.trailPoints.length; i++) {
      this.trailPoints[i].copy(this.position);
    }
    this.trail.geometry.setFromPoints(this.trailPoints);
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.visible = false;
  }
}
