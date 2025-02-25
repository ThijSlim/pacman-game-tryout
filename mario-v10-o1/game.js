const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 2040 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

let player;
let goomba1;
let goomba2;
let platforms;
let cursors;
let score = 0;
let scoreText;

const game = new Phaser.Game(config);

function preload() {
  // No external assets to load
}

function create() {
  // Create a simple background that covers the extended world
  const worldWidth = 2400;
  const background = this.add.graphics();
  background.fillStyle(0x87ceeb, 1);
  background.fillRect(0, 0, worldWidth, 600);

  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#000',
  });
  scoreText.setScrollFactor(0);

  // Set the physics world bounds to the new world size
  this.physics.world.setBounds(0, 0, worldWidth, 600);

  // Create platforms using the updated Platforms class
  platforms = new Platforms(this, worldWidth);

  // Create the player using the updated Mario class
  player = new Mario(this, 100, 450);

  // Create Goomba texture if it doesn't exist
  if (!this.textures.exists('goomba')) {
    const goombaGraphics = this.add.graphics();
    goombaGraphics.fillStyle(0x8B4513, 1);
    goombaGraphics.fillCircle(16, 16, 16);
    goombaGraphics.generateTexture('goomba', 32, 32);
    goombaGraphics.destroy();
  }

  // Create two Goombas
  goomba1 = new Goomba(this, 600, 500, 1);
  goomba2 = new Goomba(this, 800, 500, -1);

  this.physics.add.collider(goomba1.sprite, platforms.group);
  this.physics.add.collider(goomba2.sprite, platforms.group);

  // Add collision between Goombas themselves
  this.physics.add.collider(goomba1.sprite, goomba2.sprite, reverseGoombaDirection, null, this);

  // Add collision between Mario and Goombas
  this.physics.add.collider(player.sprite, goomba1.sprite, hitGoomba, null, this);
  this.physics.add.collider(player.sprite, goomba2.sprite, hitGoomba, null, this);

  // Set the camera to follow the player
  this.cameras.main.setBounds(0, 0, worldWidth, 600);
  this.cameras.main.startFollow(player.sprite);

  // Add collision between player and platforms with a collision callback
  this.physics.add.collider(player.sprite, platforms.group, hitBlock, null, this);

  // Input events
  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  player.update(cursors);
  goomba1.update();
  goomba2.update();

  // Game over if Mario falls below the visible area
  if (player.sprite.y > 600) {
    this.physics.pause();
    player.sprite.setTint(0xff0000);
    // Add any other game over logic here
  }
}

function reverseGoombaDirection(goombaSprite1, goombaSprite2) {
  const goomba1 = goombaSprite1.goomba;
  const goomba2 = goombaSprite2.goomba;

  goomba1.direction *= -1;
  goomba1.sprite.setVelocityX(goomba1.speed * goomba1.direction);

  goomba2.direction *= -1;
  goomba2.sprite.setVelocityX(goomba2.speed * goomba2.direction);
}

function hitGoomba(playerSprite, goombaSprite) {
  if (playerSprite.body.touching.down && goombaSprite.body.touching.up) {
    goombaSprite.destroy();
    playerSprite.setVelocityY(-876);
    // Increase score or points here
  } else {
    this.physics.pause();
    playerSprite.setTint(0xff0000);
    // Add game over logic here
  }
}

function hitBlock(playerSprite, block) {
  if (block.texture.key === 'questionBlock' && !block.activated) {
    if (playerSprite.body.touching.up && block.body.touching.down) {
      block.activated = true;
      block.setTexture('usedBlock');

      if (block.contains === 'coin') {
        spawnCoin.call(this, block.x + block.width / 2, block.y - block.height);
        score += 10;
        scoreText.setText('Score: ' + score);
      } else if (block.contains === 'powerUp') {
        spawnPowerUp.call(this, block.x + block.width / 2, block.y - block.height);
      }
    }
  }
}

function spawnPowerUp(x, y) {
  if (!this.textures.exists('powerUp')) {
    const powerUpGraphics = this.add.graphics();
    powerUpGraphics.fillStyle(0xFF0000, 1);
    powerUpGraphics.fillCircle(15, 15, 15);
    powerUpGraphics.generateTexture('powerUp', 30, 30);
    powerUpGraphics.destroy();
  }

  const powerUp = this.physics.add.sprite(x, y, 'powerUp');
  powerUp.setVelocityY(-100);
  powerUp.body.allowGravity = false;

  this.time.delayedCall(500, () => {
    powerUp.setVelocityY(0);
    powerUp.body.allowGravity = true;
  });

  this.physics.add.collider(powerUp, platforms.group);
  this.physics.add.overlap(player.sprite, powerUp, collectPowerUp, null, this);
}

function spawnCoin(x, y) {
  if (!this.textures.exists('coin')) {
    const coinGraphics = this.add.graphics();
    coinGraphics.fillStyle(0xFFFF00, 1);
    coinGraphics.fillCircle(15, 15, 15);
    coinGraphics.generateTexture('coin', 30, 30);
    coinGraphics.destroy();
  }

  const coin = this.physics.add.sprite(x, y, 'coin');
  coin.body.allowGravity = false;

  this.tweens.add({
    targets: coin,
    y: y - 50,
    alpha: 0,
    duration: 800,
    ease: 'Power1',
    onComplete: () => {
      coin.destroy();
    },
  });
}

function collectPowerUp(playerSprite, powerUp) {
  powerUp.destroy();

  const scaleFactor = 1.5;
  const speedFactor = 1.5;

  this.tweens.add({
    targets: player.sprite,
    scaleX: scaleFactor,
    scaleY: scaleFactor,
    yoyo: true,
    repeat: 2,
    duration: 100,
    onComplete: () => {
      player.collectPowerUp(scaleFactor, speedFactor);
    }
  });
}

class Mario {
  constructor(scene, x, y) {
    this.scene = scene;
    const scaleFactor = 0.625;

    const marioGraphics = scene.add.graphics();
    marioGraphics.fillStyle(0xffcc99, 1);
    marioGraphics.fillCircle(16 * scaleFactor, 16 * scaleFactor, 16 * scaleFactor);

    marioGraphics.fillStyle(0xff0000, 1);
    marioGraphics.fillRect(0, 32 * scaleFactor, 32 * scaleFactor, 32 * scaleFactor);

    marioGraphics.fillStyle(0x0000ff, 1);
    marioGraphics.fillRect(0, 64 * scaleFactor, 32 * scaleFactor, 16 * scaleFactor);

    marioGraphics.generateTexture('marioTexture', 32 * scaleFactor, 80 * scaleFactor);
    marioGraphics.destroy();

    this.sprite = scene.physics.add.sprite(x, y, 'marioTexture').setOrigin(0.5, 1);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.body.setSize(20, 50).setOffset(6, 0);

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

  update(cursors) {
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

    if (cursors.up.isDown && (this.sprite.body.touching.down || this.sprite.body.blocked.down)) {
      this.sprite.setVelocityY(-876);
    }
  }

  increaseSpeed(factor) {
    this.moveSpeed *= factor;
  }

  collectPowerUp(scaleFactor, speedFactor) {
    this.sprite.setScale(scaleFactor);
    this.moveSpeed *= speedFactor;
  }
}

class Platforms {
  constructor(scene, worldWidth) {
    this.scene = scene;
    this.group = this.scene.physics.add.staticGroup();
    this.blockSize = 32;

    // Create ground blocks
    this.createGround(worldWidth);

    // Create platforms above
    this.createLevelPlatforms();

    // Create question blocks
    this.createQuestionBlocks();
  }

  createLevelPlatforms() {
    if (!this.scene.textures.exists('platformBlock')) {
      const platformGraphics = this.scene.add.graphics();
      platformGraphics.fillStyle(0xA0522D, 1);
      platformGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      platformGraphics.generateTexture('platformBlock', this.blockSize, this.blockSize);
      platformGraphics.destroy();
    }

    this.createPlatformRowAtGrid(9, 5, 1, 'platformBlock');
    this.createPlatformRowAtGrid(11, 5, 1, 'platformBlock');
    this.createPlatformRowAtGrid(13, 5, 1, 'platformBlock');
    this.createPlatformRowAtGrid(16, 2, 1, 'platformBlock');
    this.createPlatformRowAtGrid(26, 2, 1, 'platformBlock');
  }

  createQuestionBlocks() {
    this.createQuestionBlock(6, 5, 'coin');
    this.createQuestionBlock(10, 5, 'coin');
    this.createQuestionBlock(12, 5, 'coin');
    this.createQuestionBlock(11, 9, 'powerUp');
  }

  createPlatformRowAtGrid(startGridX, gridY, numBlocks, texture) {
    const startX = startGridX * this.blockSize;
    const y = this.scene.scale.height - gridY * this.blockSize;
    for (let i = 0; i < numBlocks; i++) {
      this.group
        .create(startX + i * this.blockSize, y, texture)
        .setOrigin(0, 0.5)
        .refreshBody();
    }
  }

  createGround(worldWidth) {
    const groundGraphics = this.scene.add.graphics();
    groundGraphics.fillStyle(0x8B4513, 1);
    groundGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
    groundGraphics.generateTexture('groundBlock', this.blockSize, this.blockSize);
    groundGraphics.destroy();

    const numBlocks = Math.ceil(worldWidth / this.blockSize);

    for (let x = 0; x <= numBlocks; x++) {
      // Skip a small range to create a hole
      if (x >= 30 && x <= 32) {
        continue;
      }
      this.group
        .create(x * this.blockSize, this.scene.scale.height - this.blockSize / 2, 'groundBlock')
        .setOrigin(0, 0.5)
        .refreshBody();
    }
  }

  createQuestionBlock(gridX, gridY, contains) {
    const x = gridX * this.blockSize;
    const y = this.scene.scale.height - gridY * this.blockSize;

    if (!this.scene.textures.exists('questionBlock')) {
      const questionBlockGraphics = this.scene.add.graphics();
      questionBlockGraphics.fillStyle(0xFFD700, 1);
      questionBlockGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      questionBlockGraphics.generateTexture('questionBlock', this.blockSize, this.blockSize);
      questionBlockGraphics.destroy();
    }

    if (!this.scene.textures.exists('usedBlock')) {
      const usedBlockGraphics = this.scene.add.graphics();
      usedBlockGraphics.fillStyle(0xA9A9A9, 1);
      usedBlockGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      usedBlockGraphics.generateTexture('usedBlock', this.blockSize, this.blockSize);
      usedBlockGraphics.destroy();
    }

    const questionBlock = this.group
      .create(x, y, 'questionBlock')
      .setOrigin(0, 0.5)
      .refreshBody();

    questionBlock.contains = contains;
    questionBlock.activated = false;
  }
}

class Goomba {
  constructor(scene, x, y, direction = -1) {
    this.scene = scene;
    this.speed = 50;
    this.direction = direction;
    this.sprite = scene.physics.add.sprite(x, y, 'goomba');

    this.sprite.setCollideWorldBounds(true);
    this.sprite.setVelocityX(this.speed * this.direction);

    // Link the sprite to this Goomba instance
    this.sprite.goomba = this;
  }

  update() {
    if (!this.sprite.body?.blocked) {
      return;
    }

    if (this.sprite.body.blocked.left || this.sprite.body.touching.left) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed * this.direction);
    } else if (this.sprite.body.blocked.right || this.sprite.body.touching.right) {
      this.direction = -1;
      this.sprite.setVelocityX(this.speed * this.direction);
    }
  }
}