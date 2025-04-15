import { Mario } from "./Mario";


export class Goomba {
  scene: any;
  speed: number;
  direction: number;
  sprite: any;
  isJumping: boolean;
  jumpInterval: number;
  animationTimer: number;
  isDead: boolean;
  frameIndex: number;

  constructor(scene: { physics: { add: { sprite: (arg0: any, arg1: any, arg2: string) => any; }; }; time: { addEvent: (arg0: { delay: number; callback: () => void; loop: boolean; }) => void; delayedCall: (arg0: number, arg1: () => void) => void; }; }, x: number, y: number, direction = -1) {
    this.scene = scene;
    this.speed = 50;
    this.direction = direction;
    this.isDead = false;
    this.frameIndex = 0; // Track which frame we're on (0 for goomba-1, 1 for goomba-2)
    this.animationTimer = 0; // Timer to track when to switch frames

    // Create sprite using the first goomba frame
    this.sprite = scene.physics.add.sprite(x, y, 'goomba-1');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setVelocityX(this.speed * this.direction);
    this.sprite.goomba = this;
    this.sprite.setScale(2.0); // Scale the sprite to match the game scale

    this.isJumping = false;
    this.jumpInterval = Phaser.Math.Between(2000, 4000); // Random jump interval between 2-4 seconds

    this.startJumping();
  }

  startJumping() {
    this.scene.time.addEvent({
      delay: this.jumpInterval,
      callback: () => {
        if (!this.isJumping && !this.isDead) {
          this.jump();
        }
      },
      loop: true
    });
  }

  jump() {
    if (this.sprite.body?.blocked.down) { // Only jump if on the ground
      this.isJumping = true;
      this.sprite.setVelocityY(-400); // Increased jump velocity
      this.scene.time.delayedCall(500, () => { // Reset jumping state after 500ms
        this.isJumping = false;
      });
    }
  }

  update() {
    if (!this.sprite.body?.blocked) {
      return;
    }

    if (this.isDead) {
      return; // Don't update animation or movement if dead
    }

    // Reverse direction if blocked
    if (this.sprite.body.blocked.left || this.sprite.body.touching.left) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed * this.direction);
    } else if (this.sprite.body.blocked.right || this.sprite.body.touching.right) {
      this.direction = -1;
      this.sprite.setVelocityX(this.speed * this.direction);
    }

    // Handle walking animation (switching between goomba-1 and goomba-2)
    this.animationTimer += 16; // Assume ~60fps, so ~16ms per frame
    if (this.animationTimer >= 300) { // Switch every 300ms (adjust timing as needed)
      this.animationTimer = 0;
      this.frameIndex = this.frameIndex === 0 ? 1 : 0;
      this.sprite.setTexture(this.frameIndex === 0 ? 'goomba-1' : 'goomba-2');
    }
  }

  handlePlayerCollision(playerSprite: any, playerObj: Mario, onStompedCallback: { (): void; (): void; }, onGameOverCallback: { (): void; (): void; }) {
    // If player hits Goomba from above
    if (playerSprite.body.touching.down && this.sprite.body.touching.up) {
      // Goomba defeated - show dead sprite
      this.isDead = true;
      this.sprite.setTexture('goomba-dead');
      this.sprite.setVelocityX(0); // Stop movement
      
      // Set a smaller hitbox for the squashed goomba
      this.sprite.body.setSize(this.sprite.width * 0.8, this.sprite.height * 0.5);
      this.sprite.body.setOffset(this.sprite.width * 0.1, this.sprite.height * 0.5);
      
      playerSprite.setVelocityY(-876);
      if (onStompedCallback) onStompedCallback();
      
      // Remove the goomba after showing the dead sprite for a moment
      this.scene.time.delayedCall(800, () => {
        if (this.sprite && this.sprite.body) {
          this.sprite.destroy();
        }
      });
    } else {
      // Player hit Goomba from side or bottom - game over
      if (onGameOverCallback) onGameOverCallback();
    }
  }

  handleGoombaCollision(goombaSprite1: any, goombaSprite2: any) {
    // Reverse direction for both goombas
    const goomba1 = goombaSprite1.goomba;
    const goomba2 = goombaSprite2.goomba;

    goomba1.direction *= -1;
    goomba1.sprite.setVelocityX(goomba1.speed * goomba1.direction);

    goomba2.direction *= -1;
    goomba2.sprite.setVelocityX(goomba2.speed * goomba2.direction);
  }
}
