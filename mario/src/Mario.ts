import Phaser from "phaser";

export class Mario {
  scene: any;
  sprite: any;
  moveSpeed: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    const blockSize = 32;
    const scaleFactor = 1;
    const marioHeight = blockSize;
    const marioWidth = (2 / 3) * marioHeight;

    const marioGraphics = scene.add.graphics();
    // Head
    marioGraphics.fillStyle(0xffcc99, 1);
    marioGraphics.fillCircle(marioWidth / 2, marioHeight / 4, marioHeight / 4);
    // Body
    marioGraphics.fillStyle(0xff0000, 1);
    marioGraphics.fillRect(0, marioHeight / 2, marioWidth, marioHeight / 2);

    marioGraphics.generateTexture('marioTexture', marioWidth, marioHeight);
    marioGraphics.destroy();

    this.sprite = scene.physics.add
      .sprite(x, y, 'marioTexture')
      .setOrigin(0.5, 1);
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setBounce(0);
    this.sprite.body.setSize(marioWidth, marioHeight).setOffset(0, 0);
    this.moveSpeed = 220;

    this.createAnimations();
  }

  createAnimations() {
    this.scene.anims.create({
      key: 'left',
      frames: [{ key: 'marioTexture' }],
      frameRate: 10,
      repeat: -1,
    });

    this.scene.anims.create({
      key: 'turn',
      frames: [{ key: 'marioTexture' }],
      frameRate: 20,
    });

    this.scene.anims.create({
      key: 'right',
      frames: [{ key: 'marioTexture' }],
      frameRate: 10,
      repeat: -1,
    });
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined) {
    if (!cursors) return;

    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-this.moveSpeed);
      this.sprite.anims.play('left', true);
      this.sprite.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(this.moveSpeed);
      this.sprite.anims.play('right', true);
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
      this.sprite.anims.play('turn');
    }

    if (cursors.up.isDown &&
      (this.sprite.body.touching.down || this.sprite.body.blocked.down)) {
      this.sprite.setVelocityY(-876);
    }
  }

  collectPowerUp(scaleFactor: number, speedFactor: number) {
    this.sprite.setScale(scaleFactor);
    this.moveSpeed *= speedFactor;
  }
}
