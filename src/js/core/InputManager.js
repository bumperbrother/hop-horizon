export class InputManager {
  constructor(game) {
    this.game = game;
    
    // Key states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false
    };
    
    // Mouse movement
    this.mouseSensitivity = 0.002;
    this.mouseX = 0;
    this.mouseY = 0;
    
    // Double jump tracking
    this.canDoubleJump = false;
    this.hasJumped = false;
    
    // Set up event listeners
    this.setupKeyboardListeners();
    this.setupMouseListeners();
  }
  
  setupKeyboardListeners() {
    // Key down event
    document.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    });
    
    // Key up event
    document.addEventListener('keyup', (event) => {
      this.handleKeyUp(event);
    });
  }
  
  setupMouseListeners() {
    // Mouse move event
    document.addEventListener('mousemove', (event) => {
      this.handleMouseMove(event);
    });
  }
  
  handleKeyDown(event) {
    if (!this.game.isRunning) return;
    
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = true;
        break;
      case 'KeyS':
        this.keys.backward = true;
        break;
      case 'KeyA':
        this.keys.left = true;
        break;
      case 'KeyD':
        this.keys.right = true;
        break;
      case 'Space':
        if (!this.keys.jump) {
          this.keys.jump = true;
          this.handleJump();
        }
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true;
        break;
    }
  }
  
  handleKeyUp(event) {
    if (!this.game.isRunning) return;
    
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = false;
        break;
      case 'KeyS':
        this.keys.backward = false;
        break;
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'KeyD':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.jump = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false;
        break;
    }
  }
  
  handleMouseMove(event) {
    // In third-person mode, camera rotation is handled by OrbitControls
    // We just need to track mouse movement for other purposes
    this.mouseX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    this.mouseY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
  }
  
  handleJump() {
    if (!this.game.player) return;
    
    // Check if player is on ground
    if (this.game.player.isOnGround) {
      // First jump
      this.game.player.jump();
      this.hasJumped = true;
      this.canDoubleJump = true;
      
      // Play jump sound
      if (this.game.assetManager.audio.jump) {
        this.game.assetManager.audio.jump.currentTime = 0;
        this.game.assetManager.audio.jump.play();
      }
    } else if (this.canDoubleJump && this.hasJumped) {
      // Double jump
      this.game.player.doubleJump();
      this.canDoubleJump = false;
      
      // Play jump sound (maybe a different one for double jump)
      if (this.game.assetManager.audio.jump) {
        this.game.assetManager.audio.jump.currentTime = 0;
        this.game.assetManager.audio.jump.play();
      }
    }
  }
  
  resetJumpState() {
    this.hasJumped = false;
    this.canDoubleJump = false;
  }
  
  isMoving() {
    return this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
  }
  
  getMovementDirection() {
    const direction = { x: 0, z: 0 };
    
    if (this.keys.forward) direction.z -= 1;
    if (this.keys.backward) direction.z += 1;
    if (this.keys.left) direction.x -= 1;
    if (this.keys.right) direction.x += 1;
    
    // Normalize if moving diagonally
    const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    if (length > 0) {
      direction.x /= length;
      direction.z /= length;
    }
    
    return direction;
  }
  
  isSprinting() {
    return this.keys.sprint;
  }
  
  isJumping() {
    return this.keys.jump;
  }
}
