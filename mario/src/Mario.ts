import Phaser from "phaser";

export class Mario {
  scene: any;
  sprite: any;
  moveSpeed: number;
  isRunning: boolean;

    constructor(scene: Phaser.Scene, x: number, y: number) {
      this.scene = scene;
      this.isRunning = false;
  
      const blockSize = 32;
      const marioHeight = 16; // Mario's actual sprite height
      const marioWidth = 16;  // Assuming Mario's width is also 16px
      
      // Create sprite using the loaded image
      this.sprite = scene.physics.add
        .sprite(x, y, 'mario-default')
        .setOrigin(0.5, 1);  // Set origin to bottom center
        
      // Scale to make Mario fit within a block
      // If sprite is 16px and block is 32px, scale = 2.0
      this.sprite.setScale(2.0);
      
      this.sprite.setCollideWorldBounds(false);
      this.sprite.setBounce(0);
      // Set physics body to match visual appearance
      this.sprite.body.setSize(marioWidth, marioHeight).setOffset(0, 0);
      this.moveSpeed = 220;
  
      this.createAnimations();
  }

  createAnimations() {
    // Create running animation by alternating between default and running sprites
    this.scene.anims.create({
      key: 'running',
      frames: [
        { key: 'mario-default' },
        { key: 'mario-running' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // Standing animation just uses the default sprite
    this.scene.anims.create({
      key: 'standing',
      frames: [{ key: 'mario-default' }],
      frameRate: 10,
      repeat: 0
    });
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined) {
    if (!cursors) return;

    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-this.moveSpeed);
      this.sprite.anims.play('running', true);
      this.sprite.setFlipX(true);
      this.isRunning = true;
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(this.moveSpeed);
      this.sprite.anims.play('running', true);
      this.sprite.setFlipX(false);
      this.isRunning = true;
    } else {
      this.sprite.setVelocityX(0);
      this.sprite.anims.play('standing');
      this.isRunning = false;
    }

    if (cursors.up.isDown &&
      (this.sprite.body.touching.down || this.sprite.body.blocked.down)) {
      this.sprite.setVelocityY(-876);
    }
  }

  collectPowerUp(scaleFactor: number, speedFactor: number) {
    this.sprite.setScale(1.0 * scaleFactor); // Adjust based on new base scale of 1.0
    this.moveSpeed *= speedFactor;
  }
}
