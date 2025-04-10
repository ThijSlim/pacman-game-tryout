import { Mario } from "./Mario";


export class Goomba {
  scene: any;
  speed: number;
  direction: number;
  sprite: any;
  isJumping: boolean;
  jumpInterval: number;

  constructor(scene: { physics: { add: { sprite: (arg0: any, arg1: any, arg2: string) => any; }; }; time: { addEvent: (arg0: { delay: number; callback: () => void; loop: boolean; }) => void; delayedCall: (arg0: number, arg1: () => void) => void; }; }, x: number, y: number, direction = -1) {
    this.scene = scene;
    this.speed = 50;
    this.direction = direction;

    if (!this.scene.textures.exists('goomba')) {
      const goombaGraphics = this.scene.add.graphics();
      goombaGraphics.fillStyle(0x8b4513, 1); // Brown color
      goombaGraphics.fillCircle(16, 16, 16);
      goombaGraphics.generateTexture('goomba', 32, 32);
      goombaGraphics.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, 'goomba');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setVelocityX(this.speed * this.direction);
    this.sprite.goomba = this;

    this.isJumping = false;
    this.jumpInterval = Phaser.Math.Between(2000, 4000); // Random jump interval between 2-4 seconds

    this.startJumping();
  }

  startJumping() {
    this.scene.time.addEvent({
      delay: this.jumpInterval,
      callback: () => {
        if (!this.isJumping) {
          this.jump();
        }
      },
      loop: true
    });
  }

  jump() {
    if (this.sprite.body.blocked.down) { // Only jump if on the ground
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

    // Reverse direction if blocked
    if (this.sprite.body.blocked.left || this.sprite.body.touching.left) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed * this.direction);
    } else if (this.sprite.body.blocked.right || this.sprite.body.touching.right) {
      this.direction = -1;
      this.sprite.setVelocityX(this.speed * this.direction);
    }
  }

  handlePlayerCollision(playerSprite: any, playerObj: Mario, onStompedCallback: { (): void; (): void; }, onGameOverCallback: { (): void; (): void; }) {
    // If player hits Goomba from above
    if (playerSprite.body.touching.down && this.sprite.body.touching.up) {
      // Goomba defeated
      this.sprite.destroy();
      playerSprite.setVelocityY(-876);
      if (onStompedCallback) onStompedCallback();
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
