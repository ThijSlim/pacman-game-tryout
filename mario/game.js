const config = {
  type: Phaser.AUTO,
  width: 800, // Canvas width remains the same
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
let platforms;
let cursors;

const game = new Phaser.Game(config);

function preload() {
  // No external assets to load
}

function create() {
  // Create a simple background that covers the extended world
  const worldWidth = 2400; // 3 times the original width
  const background = this.add.graphics();
  background.fillStyle(0x87ceeb, 1); // Light blue color
  background.fillRect(0, 0, worldWidth, 600);

  // Set the physics world bounds to the new world size
  this.physics.world.setBounds(0, 0, worldWidth, 600);

  // Create platforms using the updated Platforms class
  platforms = new Platforms(this, worldWidth);

  // Create the player using the updated Mario class
  player = new Mario(this, 100, 450);

  // Create Goomba texture if it doesn't exist
  if (!this.textures.exists('goomba')) {
    const goombaGraphics = this.add.graphics();
    goombaGraphics.fillStyle(0x8B4513, 1); // Brown color
    goombaGraphics.fillCircle(16, 16, 16); // Radius of 16 pixels
    goombaGraphics.generateTexture('goomba', 32, 32);
    goombaGraphics.destroy();
  }

  // Create two Goombas
  const goomba1 = new Goomba(this, 600, 500);
  const goomba2 = new Goomba(this, 800, 500);

  // Add collision between Goombas and platforms
  this.physics.add.collider(goomba1.sprite, platforms.group);
  this.physics.add.collider(goomba2.sprite, platforms.group);

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
  // Update the player
  player.update(cursors);
}

function hitGoomba(playerSprite, goombaSprite) {
  if (playerSprite.body.touching.down && goombaSprite.body.touching.up) {
    // Mario is jumping down onto Goomba
    goombaSprite.destroy();
    // Increase score or points here
  } else {
    // Mario hit Goomba from the side or bottom - game over
    this.physics.pause();
    playerSprite.setTint(0xff0000);
    // Add game over logic here
  }
}

// Function to handle collision between Mario and blocks
function hitBlock(playerSprite, block) {
  // Check if the block is the question block and hasn't been activated yet
  if (block.texture.key === 'questionBlock' && !block.activated) {
    // Check if collision is from below
    if (playerSprite.body.touching.up && block.body.touching.down) {
      // Mark block as activated to prevent multiple activations
      block.activated = true;

      // Change the block's texture to indicate it has been used
      block.setTexture('usedBlock');

      // Spawn the power-up
      spawnPowerUp.call(this, block.x + block.width / 2, block.y - block.height);
    }
  }
}

// Function to spawn the power-up
function spawnPowerUp(x, y) {
  // Create power-up texture if it doesn't exist
  if (!this.textures.exists('powerUp')) {
    const powerUpGraphics = this.add.graphics();
    powerUpGraphics.fillStyle(0xFF0000, 1); // Red color for power-up
    powerUpGraphics.fillCircle(15, 15, 15); // Draw a simple circle
    powerUpGraphics.generateTexture('powerUp', 30, 30);
    powerUpGraphics.destroy();
  }

  // Create the power-up sprite
  const powerUp = this.physics.add.sprite(x, y, 'powerUp');

  // Initial upward movement
  powerUp.setVelocityY(-100);

  // Disable gravity initially
  powerUp.body.allowGravity = false;

  // After 500ms, enable gravity
  this.time.delayedCall(500, () => {
    powerUp.setVelocityY(0);
    powerUp.body.allowGravity = true;
  });

  // Add collision between power-up and platforms
  this.physics.add.collider(powerUp, platforms.group);

  // Add overlap between player and power-up
  this.physics.add.overlap(player.sprite, powerUp, collectPowerUp, null, this);
}

// Function to handle collecting the power-up
function collectPowerUp(playerSprite, powerUp) {
  // Remove the power-up sprite
  powerUp.destroy();

  var scaleFactor = 1.5;
  var speedFactor = 1.5;
  // Animate Mario's growth
  this.tweens.add({
    targets: player.sprite,
    scaleX: scaleFactor,
    scaleY: scaleFactor,
    yoyo: true,
    repeat: 2,
    duration: 100,
    onComplete: () => {
      // Apply power-up effects to Mario after the animation
      player.collectPowerUp(scaleFactor, speedFactor);
    }
  });
}

class Mario {
  constructor(scene, x, y) {
    this.scene = scene;

    // Adjusted scale factor to make Mario the same height as a block
    const scaleFactor = 0.625; // 50 (block height) / 80 (original Mario height)

    // Draw the character using graphics
    const marioGraphics = scene.add.graphics();

    // Draw the head
    marioGraphics.fillStyle(0xffcc99, 1); // Skin color
    marioGraphics.fillCircle(16 * scaleFactor, 16 * scaleFactor, 16 * scaleFactor);

    // Draw the body
    marioGraphics.fillStyle(0xff0000, 1); // Red color for the shirt
    marioGraphics.fillRect(0, 32 * scaleFactor, 32 * scaleFactor, 32 * scaleFactor);

    // Draw the legs
    marioGraphics.fillStyle(0x0000ff, 1); // Blue color for the pants
    marioGraphics.fillRect(0, 64 * scaleFactor, 32 * scaleFactor, 16 * scaleFactor);

    // Generate a texture from the graphics
    marioGraphics.generateTexture('marioTexture', 32 * scaleFactor, 80 * scaleFactor);
    marioGraphics.destroy();

    // Create the sprite with the updated texture and set origin to bottom center
    this.sprite = scene.physics.add.sprite(x, y, 'marioTexture').setOrigin(0.5, 1);

    // Apply physics properties
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0); // Ensure no bouncing occurs

    // Adjust the physics body size and offset
    this.sprite.body.setSize(20, 50).setOffset(6, 0); // Adjusted for new sprite size

    // Initialize movement speed
    this.moveSpeed = 220;

    // Create animations
    this.createAnimations();
  }

  createAnimations() {
    // Since we're using a static texture, we'll simulate animations by flipping the sprite
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
      this.sprite.setFlipX(true); // Flip the sprite to face left
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(this.moveSpeed);
      this.sprite.anims.play('right', true);
      this.sprite.setFlipX(false); // Face right
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

    // Define block size
    this.blockSize = 50; // Size of each block in pixels

    // Create ground blocks
    this.createGround(worldWidth);

    // Create platforms
    this.createLevelPlatforms();

    // Create question blocks
    this.createQuestionBlock(280, this.scene.scale.height - this.blockSize * 4.5);
  }

  createGround(worldWidth) {
    // Create platform graphics for ground blocks
    const groundGraphics = this.scene.add.graphics();
    groundGraphics.fillStyle(0x8B4513, 1); // Brown color for ground
    groundGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
    groundGraphics.generateTexture('groundBlock', this.blockSize, this.blockSize);
    groundGraphics.destroy();

    // Create ground blocks across the bottom of the screen  
    for (let x = 0; x <= worldWidth; x += this.blockSize) {
      this.group
        .create(x, this.scene.scale.height - this.blockSize / 2, 'groundBlock')
        .setOrigin(0, 0.5)
        .refreshBody();
    }
  }

  createLevelPlatforms() {
    // Create platform graphics for normal blocks
    if (!this.scene.textures.exists('platformBlock')) {
      const platformGraphics = this.scene.add.graphics();
      platformGraphics.fillStyle(0xA0522D, 1); // Sienna color for platforms
      platformGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      platformGraphics.generateTexture('platformBlock', this.blockSize, this.blockSize);
      platformGraphics.destroy();
    }

    // Platforms placed 3 blocks above the ground
    // Original platform
    this.createPlatformRow(
      490,
      this.scene.scale.height - this.blockSize * 3.5, // Adjusted Y position
      4,
      'platformBlock'
    );

    // New platform further to the right
    this.createPlatformRow(
      1200, // New X position further to the right
      this.scene.scale.height - this.blockSize * 3.5,
      5, // Number of blocks in the new platform
      'platformBlock'
    );
  }

  createPlatformRow(startX, y, numBlocks, texture) {
    for (let i = 0; i < numBlocks; i++) {
      this.group
        .create(startX + i * this.blockSize, y, texture)
        .setOrigin(0, 0.5)
        .refreshBody();
    }
  }

  createQuestionBlock(x, y) {
    // Create question block graphics if not already created
    if (!this.scene.textures.exists('questionBlock')) {
      const questionBlockGraphics = this.scene.add.graphics();
      questionBlockGraphics.fillStyle(0xFFD700, 1); // Gold color for question block
      questionBlockGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      questionBlockGraphics.generateTexture('questionBlock', this.blockSize, this.blockSize);
      questionBlockGraphics.destroy();
    }

    // Create used block graphics
    if (!this.scene.textures.exists('usedBlock')) {
      const usedBlockGraphics = this.scene.add.graphics();
      usedBlockGraphics.fillStyle(0xA9A9A9, 1); // Dark gray color for used block
      usedBlockGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      usedBlockGraphics.generateTexture('usedBlock', this.blockSize, this.blockSize);
      usedBlockGraphics.destroy();
    }

    // Add the question block to the group and keep a reference
    const questionBlock = this.group
      .create(x, y, 'questionBlock')
      .setOrigin(0, 0.5)
      .refreshBody();

    // Custom property to identify the question block
    questionBlock.isQuestionBlock = true;
  }
}

class Goomba {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'goomba');

    // Set Goomba properties
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setVelocityX(-50); // Move left slowly
    this.sprite.setBounceX(1); // Bounce when hitting walls

    // Enable collision with world bounds
    this.sprite.body.onWorldBounds = true;
    scene.physics.world.on('worldbounds', (body) => {
      if (body.gameObject === this.sprite) {
        this.sprite.setVelocityX(-this.sprite.body.velocity.x);
      }
    });
  }
}