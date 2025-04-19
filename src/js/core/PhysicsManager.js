import * as THREE from 'three';

export class PhysicsManager {
  constructor(game) {
    this.game = game;
    
    // Physics settings
    this.gravity = 9.8; // m/s²
    this.entities = [];
    
    // Collision detection
    this.colliders = [];
    this.checkpoints = [];
    this.finishArea = null;
    
    // Raycaster for ground detection
    this.raycaster = new THREE.Raycaster();
    this.downDirection = new THREE.Vector3(0, -1, 0);
  }
  
  addEntity(entity) {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
  }
  
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }
  
  addCollider(collider) {
    if (!this.colliders.includes(collider)) {
      this.colliders.push(collider);
      
      // Add to scene if it has a mesh
      if (collider.mesh) {
        this.game.scene.add(collider.mesh);
      }
    }
  }
  
  removeCollider(collider) {
    const index = this.colliders.indexOf(collider);
    if (index !== -1) {
      this.colliders.splice(index, 1);
      
      // Remove from scene if it has a mesh
      if (collider.mesh) {
        this.game.scene.remove(collider.mesh);
      }
    }
  }
  
  addCheckpoint(checkpoint) {
    if (!this.checkpoints.includes(checkpoint)) {
      this.checkpoints.push(checkpoint);
      
      // Add to scene if it has a mesh
      if (checkpoint.mesh) {
        this.game.scene.add(checkpoint.mesh);
      }
    }
  }
  
  setFinishArea(finishArea) {
    this.finishArea = finishArea;
    
    // Add to scene if it has a mesh
    if (finishArea && finishArea.mesh) {
      this.game.scene.add(finishArea.mesh);
    }
  }
  
  update(deltaTime) {
    // Update all physics entities
    for (const entity of this.entities) {
      if (entity.update) {
        entity.update(deltaTime);
      }
      
      // Apply gravity if entity is affected by it
      if (entity.affectedByGravity) {
        this.applyGravity(entity, deltaTime);
      }
      
      // Check for collisions
      if (entity.checkCollisions) {
        this.checkCollisions(entity);
      }
      
      // Check for checkpoints
      if (entity === this.game.player) {
        this.checkCheckpoints(entity);
        this.checkFinish(entity);
      }
    }
    
    // Update moving platforms or other dynamic colliders
    for (const collider of this.colliders) {
      if (collider.update) {
        collider.update(deltaTime);
      }
    }
  }
  
  applyGravity(entity, deltaTime) {
    // Skip if entity is on ground
    if (entity.isOnGround) return;
    
    // Apply gravity to velocity
    entity.velocity.y -= this.gravity * deltaTime;
    
    // Terminal velocity
    const terminalVelocity = -20;
    if (entity.velocity.y < terminalVelocity) {
      entity.velocity.y = terminalVelocity;
    }
  }
  
  checkGrounded(entity) {
    // Skip if entity doesn't have a position
    if (!entity.position) return false;
    
    // Set up raycaster
    this.raycaster.set(entity.position, this.downDirection);
    
    // Check for intersections with colliders
    const intersections = [];
    for (const collider of this.colliders) {
      if (collider.mesh) {
        const colliderIntersections = this.raycaster.intersectObject(collider.mesh, true);
        intersections.push(...colliderIntersections);
      }
    }
    
    // Sort intersections by distance
    intersections.sort((a, b) => a.distance - b.distance);
    
    // Check if any intersection is within grounding distance
    if (intersections.length > 0) {
      const groundingDistance = entity.height / 2 + 0.1; // Half height plus a small buffer
      return intersections[0].distance <= groundingDistance;
    }
    
    return false;
  }
  
  checkCollisions(entity) {
    // Skip if entity doesn't have a position or collider
    if (!entity.position || !entity.collider) return;
    
    // Simple collision detection using bounding boxes
    const entityBox = new THREE.Box3().setFromObject(entity.mesh);
    
    for (const collider of this.colliders) {
      if (!collider.mesh) continue;
      
      const colliderBox = new THREE.Box3().setFromObject(collider.mesh);
      
      if (entityBox.intersectsBox(colliderBox)) {
        // Handle collision
        this.resolveCollision(entity, collider, entityBox, colliderBox);
      }
    }
  }
  
  resolveCollision(entity, collider, entityBox, colliderBox) {
    // Calculate overlap
    const overlap = {
      x: Math.min(entityBox.max.x - colliderBox.min.x, colliderBox.max.x - entityBox.min.x),
      y: Math.min(entityBox.max.y - colliderBox.min.y, colliderBox.max.y - entityBox.min.y),
      z: Math.min(entityBox.max.z - colliderBox.min.z, colliderBox.max.z - entityBox.min.z)
    };
    
    // Find smallest overlap axis
    let minAxis = 'x';
    if (overlap.y < overlap[minAxis]) minAxis = 'y';
    if (overlap.z < overlap[minAxis]) minAxis = 'z';
    
    // Resolve collision along smallest overlap axis
    if (minAxis === 'y') {
      // Vertical collision
      if (entity.position.y > collider.mesh.position.y) {
        // Entity is above collider
        entity.position.y += overlap.y;
        entity.velocity.y = 0;
        
        // If entity wasn't on ground before, play landing sound
        if (entity === this.game.player && !entity.isOnGround) {
          this.game.audioManager.play('land', {
            volume: Math.min(Math.abs(entity.velocity.y) / 10, 1.0) // Volume based on fall speed
          });
        }
        
        entity.isOnGround = true;
        
        // Reset jump state if this is the player
        if (entity === this.game.player) {
          this.game.inputManager.resetJumpState();
        }
      } else {
        // Entity is below collider
        entity.position.y -= overlap.y;
        entity.velocity.y = 0;
      }
    } else if (minAxis === 'x') {
      // Horizontal X collision
      if (entity.position.x < collider.mesh.position.x) {
        entity.position.x -= overlap.x;
      } else {
        entity.position.x += overlap.x;
      }
      entity.velocity.x = 0;
    } else {
      // Horizontal Z collision
      if (entity.position.z < collider.mesh.position.z) {
        entity.position.z -= overlap.z;
      } else {
        entity.position.z += overlap.z;
      }
      entity.velocity.z = 0;
    }
    
    // Update entity position
    if (entity.updatePosition) {
      entity.updatePosition();
    }
  }
  
  checkCheckpoints(entity) {
    // Skip if entity doesn't have a position or collider
    if (!entity.position || !entity.collider) return;
    
    // Simple collision detection using bounding boxes
    const entityBox = new THREE.Box3().setFromObject(entity.mesh);
    
    for (const checkpoint of this.checkpoints) {
      if (!checkpoint.mesh || checkpoint.triggered) continue;
      
      const checkpointBox = new THREE.Box3().setFromObject(checkpoint.mesh);
      
      if (entityBox.intersectsBox(checkpointBox)) {
        // Trigger checkpoint
        checkpoint.trigger();
        
        // Notify game
        this.game.hitCheckpoint();
      }
    }
  }
  
  checkFinish(entity) {
    // Skip if no finish area or entity doesn't have a position or collider
    if (!this.finishArea || !entity.position || !entity.collider) return;
    
    // Simple collision detection using bounding boxes
    const entityBox = new THREE.Box3().setFromObject(entity.mesh);
    const finishBox = new THREE.Box3().setFromObject(this.finishArea.mesh);
    
    if (entityBox.intersectsBox(finishBox)) {
      // Finish level
      this.game.finishLevel();
    }
  }
  
  reset() {
    // Clear all entities and colliders
    this.entities = [];
    
    // Clear all colliders but don't remove from scene (level will handle that)
    this.colliders = [];
    
    // Clear all checkpoints
    this.checkpoints = [];
    
    // Clear finish area
    this.finishArea = null;
  }
}
