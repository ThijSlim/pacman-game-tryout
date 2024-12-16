const config = {
  type: Phaser.AUTO,
  width: 800, // Canvas width remains the same
  height: 600,
  physics: {
    default: 'arcade',
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
let gameOver = false;

const game = new Phaser.Game(config);

function preload() {
  // No external assets to load
}

function create() {
  const worldWidth = 2400; // 3 times the original width
  const background = this.add.graphics();
  background.fillStyle(0x87ceeb, 1); // Light blue color
  background.fillRect(0, 0, worldWidth, 600);

  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    fill: '#000',
  });
  scoreText.setScrollFactor(0);

  this.physics.world.setBounds(0, 0, worldWidth, 600);

  platforms = new Platforms(this, worldWidth);

  player = new Mario(this, 300, 450);

  // Create Goomba texture if it doesn't exist
  if (!this.textures.exists('goomba')) {
    const goombaGraphics = this.add.graphics();
    goombaGraphics.fillStyle(0x8b4513, 1); // Brown color
    goombaGraphics.fillCircle(16, 16, 16); // Radius of 16 pixels
    goombaGraphics.generateTexture('goomba', 32, 32);
    goombaGraphics.destroy();
  }

  goomba1 = new Goomba(this, 800, 500, 1);
  goomba2 = new Goomba(this, 1200, 500, -1);

  this.physics.add.collider(goomba1.sprite, platforms.group);
  this.physics.add.collider(goomba2.sprite, platforms.group);

  this.physics.add.collider(
    goomba1.sprite,
    goomba2.sprite,
    reverseGoombaDirection,
    null,
    this
  );

  this.physics.add.collider(
    player.sprite,
    goomba1.sprite,
    hitGoomba,
    null,
    this
  );
  this.physics.add.collider(
    player.sprite,
    goomba2.sprite,
    hitGoomba,
    null,
    this
  );

  this.cameras.main.setBounds(0, 0, worldWidth, 600);
  this.cameras.main.startFollow(player.sprite);

  this.physics.add.collider(
    player.sprite,
    platforms.group,
    hitBlock,
    null,
    this
  );

  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (gameOver) return;

  player.update(cursors);
  goomba1.update();
  goomba2.update();

  // Check if Mario falls into a hole (off the screen bottom)
  if (player.sprite.y > this.scale.height) {
    // Mario fell off the bottom of the screen
    endGame.call(this);
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
    score += 50; // Award points for defeating a Goomba
    scoreText.setText('Score: ' + score);
  } else {
    // Mario hit Goomba from the side or bottom - game over
    endGame.call(this);
  }
}

function hitBlock(playerSprite, block) {
  // Check if Mario is hitting the block from below (player must be moving upward into the block)
  if (playerSprite.body.touching.up && block.body.touching.down) {
    // If it's a question block and not activated yet
    if (block.texture.key === 'questionBlock' && !block.activated) {
      block.activated = true;
      block.setTexture('usedBlock');

      if (block.contains === 'coin') {
        spawnCoin.call(this, block.x + block.width / 2, block.y - block.height);
        score += 10;
        scoreText.setText('Score: ' + score);
      } else if (block.contains === 'powerUp') {
        spawnPowerUp.call(
          this,
          block.x + block.width / 2,
          block.y - block.height
        );
      }
    }
    // If it's a used block, do nothing special
    else if (block.texture.key === 'usedBlock') {
      // No action for used blocks when hit again
    } else {
      // It's a normal block (e.g., groundBlock, platformBlock, pipeBlock)
      // Break the block
      breakBlock.call(this, block);
    }
  }
}

function breakBlock(block) {
  const x = block.x;
  const y = block.y;

  // Destroy the original block
  block.destroy();

  // Create debris pieces for break animation
  // We'll create 4 small debris sprites
  const debrisCount = 4;
  const debrisSize = 8; // smaller pieces
  if (!this.textures.exists('debris')) {
    const debrisGraphics = this.add.graphics();
    debrisGraphics.fillStyle(0x8b4513, 1); // Brown pieces, same as ground
    debrisGraphics.fillRect(0, 0, debrisSize, debrisSize);
    debrisGraphics.generateTexture('debris', debrisSize, debrisSize);
    debrisGraphics.destroy();
  }

  for (let i = 0; i < debrisCount; i++) {
    const debris = this.physics.add.sprite(x, y - 8, 'debris');
    debris.setVelocity(
      Phaser.Math.Between(-100, 100), // random horizontal velocity
      Phaser.Math.Between(-300, -200) // random upward velocity
    );
    debris.body.allowGravity = true;

    // Fade out the debris and destroy it after some time
    this.tweens.add({
      targets: debris,
      alpha: 0,
      duration: 500,
      delay: 300,
      onComplete: () => {
        debris.destroy();
      },
    });
  }

  // Increase score for breaking a block
  score += 5;
  scoreText.setText('Score: ' + score);
}

function spawnPowerUp(x, y) {
  if (!this.textures.exists('powerUp')) {
    const powerUpGraphics = this.add.graphics();
    powerUpGraphics.fillStyle(0xff0000, 1);
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
    coinGraphics.fillStyle(0xffff00, 1);
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

  var scaleFactor = 1.5;
  var speedFactor = 1.5;

  this.tweens.add({
    targets: player.sprite,
    scaleX: scaleFactor,
    scaleY: scaleFactor,
    yoyo: true,
    repeat: 2,
    duration: 100,
    onComplete: () => {
      player.collectPowerUp(scaleFactor, speedFactor);
    },
  });
}

function endGame() {
  gameOver = true;
  player.sprite.setTint(0xff0000);

  this.physics.pause();
  // You can add a "Game Over" text or restart logic here
  const gameOverText = this.add.text(
    this.cameras.main.midPoint.x,
    this.cameras.main.midPoint.y,
    'Game Over',
    { fontSize: '64px', fill: '#000' }
  );
  gameOverText.setOrigin(0.5);
}

class Mario {
  constructor(scene, x, y) {
    this.scene = scene;

    const blockSize = 32; // Assuming block size is 32
    const scaleFactor = 1; // Adjusted scale factor

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

    if (
      cursors.up.isDown &&
      (this.sprite.body.touching.down || this.sprite.body.blocked.down)
    ) {
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

    // Define the holes in block coordinates
    this.holes = [
      [60, 65], // A hole from block 28 up to (but not including) block 33
      [70, 75], // Another hole from block 50 up to block 52
    ];

    this.createGround(worldWidth);
    this.createLevelPlatforms();
    this.createQuestionBlocks();
    this.createGreenPipes();
  }

  createGround(worldWidth) {
    // Create ground texture if needed
    if (!this.scene.textures.exists('groundBlock')) {
      const groundGraphics = this.scene.add.graphics();
      groundGraphics.fillStyle(0x8b4513, 1);
      groundGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      groundGraphics.generateTexture(
        'groundBlock',
        this.blockSize,
        this.blockSize
      );
      groundGraphics.destroy();
    }

    const numBlocks = Math.ceil(worldWidth / this.blockSize);

    for (let x = 0; x <= numBlocks; x++) {
      if (this.isInHole(x)) {
        // If x is within any defined hole interval, skip creating a ground block
        continue;
      }

      this.group
        .create(
          x * this.blockSize,
          this.scene.scale.height - this.blockSize / 2,
          'groundBlock'
        )
        .setOrigin(0, 0.5)
        .refreshBody();
    }
  }

  createGreenPipes() {
    if (!this.scene.textures.exists('pipeBlock')) {
      const pipeGraphics = this.scene.add.graphics();
      pipeGraphics.fillStyle(0x008000, 1); // Green color
      pipeGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      pipeGraphics.generateTexture('pipeBlock', this.blockSize, this.blockSize);
      pipeGraphics.destroy();
    }

    // Create first pipe with a height of 2 blocks
    this.createPipeAtGrid(30, 2);

    // Create second pipe with a height of 3 blocks
    this.createPipeAtGrid(39, 3);

    this.createPipeAtGrid(46, 4);

    this.createPipeAtGrid(56, 4);

  }

  createPipeAtGrid(gridX, heightInBlocks) {
    const x = gridX * this.blockSize;
    const groundY = this.scene.scale.height - this.blockSize; // top of ground

    for (let i = 0; i < heightInBlocks; i++) {
      const y = groundY - i * this.blockSize;
      this.group.create(x, y, 'pipeBlock').setOrigin(0, 1).refreshBody();
      this.group
        .create(x + this.blockSize, y, 'pipeBlock')
        .setOrigin(0, 1)
        .refreshBody();
    }
  }

  isInHole(blockIndex) {
    // Check if the given blockIndex falls within any hole interval
    for (const [start, end] of this.holes) {
      if (blockIndex >= start && blockIndex < end) {
        return true;
      }
    }
    return false;
  }

  createLevelPlatforms() {
    if (!this.scene.textures.exists('platformBlock')) {
      const platformGraphics = this.scene.add.graphics();
      platformGraphics.fillStyle(0xa0522d, 1);
      platformGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      platformGraphics.generateTexture(
        'platformBlock',
        this.blockSize,
        this.blockSize
      );
      platformGraphics.destroy();
    }

    this.createPlatformRowAtGrid(19, 4, 1, 'platformBlock');
    this.createPlatformRowAtGrid(21, 4, 1, 'platformBlock');
    this.createPlatformRowAtGrid(23, 4, 1, 'platformBlock');
  }

  createQuestionBlocks() {
    this.createQuestionBlock(16, 4, 'coin');
    this.createQuestionBlock(20, 4, 'coin');
    this.createQuestionBlock(22, 4, 'coin');
    this.createQuestionBlock(21, 8, 'powerUp');
  }

  createPlatformRowAtGrid(startGridX, gridY, numBlocks, texture) {
    const startX = startGridX * this.blockSize;
    const y =
      this.scene.scale.height - gridY * this.blockSize - this.blockSize / 2;
    for (let i = 0; i < numBlocks; i++) {
      this.group
        .create(startX + i * this.blockSize, y, texture)
        .setOrigin(0, 0.5)
        .refreshBody();
    }
  }

  createQuestionBlock(gridX, gridY, contains) {
    const x = gridX * this.blockSize;
    const y =
      this.scene.scale.height - gridY * this.blockSize - this.blockSize / 2;

    if (!this.scene.textures.exists('questionBlock')) {
      const questionBlockGraphics = this.scene.add.graphics();
      questionBlockGraphics.fillStyle(0xffd700, 1);
      questionBlockGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      questionBlockGraphics.generateTexture(
        'questionBlock',
        this.blockSize,
        this.blockSize
      );
      questionBlockGraphics.destroy();
    }

    if (!this.scene.textures.exists('usedBlock')) {
      const usedBlockGraphics = this.scene.add.graphics();
      usedBlockGraphics.fillStyle(0xa9a9a9, 1);
      usedBlockGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      usedBlockGraphics.generateTexture(
        'usedBlock',
        this.blockSize,
        this.blockSize
      );
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
    this.sprite.goomba = this;
  }

  update() {
    if (!this.sprite.body?.blocked) {
      return;
    }

    if (this.sprite.body.blocked.left || this.sprite.body.touching.left) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed * this.direction);
    } else if (
      this.sprite.body.blocked.right ||
      this.sprite.body.touching.right
    ) {
      this.direction = -1;
      this.sprite.setVelocityX(this.speed * this.direction);
    }
  }
}
