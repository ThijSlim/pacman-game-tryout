const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 2040 }, // Updated gravity from 1000 to 2040
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
  // Create a simple background
  const background = this.add.graphics();
  background.fillStyle(0x87ceeb, 1); // Light blue color
  background.fillRect(0, 0, 800, 600);

  // Create platforms using the Platforms class
  platforms = new Platforms(this);

  // Create the player using the Mario class
  player = new Mario(this, 100, 450);

  // Add collision between player and platforms
  this.physics.add.collider(player.sprite, platforms.group);

  // Input events
  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  // Update the player
  player.update(cursors);
}

// Mario character class
class Mario {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'marioTexture');

    // Draw the character using graphics
    const marioGraphics = scene.add.graphics();

    // Draw the body
    marioGraphics.fillStyle(0xff0000, 1); // Red color for the shirt
    marioGraphics.fillRect(0, 0, 32, 32);

    // Draw the legs
    marioGraphics.fillStyle(0x0000ff, 1); // Blue color for the pants
    marioGraphics.fillRect(0, 32, 32, 16);

    // Draw the head
    marioGraphics.fillStyle(0xffcc99, 1); // Skin color
    marioGraphics.fillCircle(16, -16, 16);

    // Generate a texture from the graphics
    marioGraphics.generateTexture('marioTexture', 32, 48);
    marioGraphics.destroy();

    // Apply physics properties
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0); // Ensure no bouncing occurs

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
    const moveSpeed = 220; // Increased movement speed from 200 to 220

    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-moveSpeed);
      this.sprite.anims.play('left', true);
      this.sprite.setFlipX(true); // Flip the sprite to face left
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(moveSpeed);
      this.sprite.anims.play('right', true);
      this.sprite.setFlipX(false); // Face right
    } else {
      this.sprite.setVelocityX(0);
      this.sprite.anims.play('turn');
    }

    // Allow the player to jump if touching the ground
    if (cursors.up.isDown && this.sprite.body.touching.down) {
      this.sprite.setVelocityY(-715); // Updated jump velocity from -500 to -715
    }
  }
}

// Platforms class remains the same
class Platforms {
  constructor(scene) {
    this.scene = scene;
    this.group = this.scene.physics.add.staticGroup();

    // Create platform graphics
    const platformGraphics = this.scene.add.graphics();
    platformGraphics.fillStyle(0x654321, 1); // Brown color
    platformGraphics.fillRect(0, 0, 800, 50);
    platformGraphics.generateTexture('platformTexture', 800, 50);
    platformGraphics.destroy();

    // Create ground platform
    this.group
      .create(400, 575, 'platformTexture')
      .setOrigin(0.5, 0.5)
      .refreshBody();

    // Create some additional platforms
    this.group
      .create(600, 400, 'platformTexture')
      .setScale(0.5, 0.1)
      .refreshBody();
    this.group
      .create(50, 250, 'platformTexture')
      .setScale(0.3, 0.1)
      .refreshBody();
    this.group
      .create(750, 220, 'platformTexture')
      .setScale(0.4, 0.1)
      .refreshBody();
  }
}