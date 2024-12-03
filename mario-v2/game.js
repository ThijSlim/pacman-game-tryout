const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 }, // Add gravity to the game
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

  // Create the player graphics
  const playerGraphics = this.add.graphics();
  playerGraphics.fillStyle(0xff0000, 1); // Red color
  playerGraphics.fillRect(0, 0, 32, 48);

  // Generate a texture from the graphics
  playerGraphics.generateTexture("playerTexture", 32, 48);
  playerGraphics.destroy();

  // Add the player sprite using the generated texture
  player = this.physics.add.sprite(400, 300, "playerTexture");

  // Player physics properties
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  // Input events
  cursors = this.input.keyboard.createCursorKeys();

  // Create platforms using the Platforms class
  platforms = new Platforms(this);

  // Add collision between player and platforms
  this.physics.add.collider(player, platforms.group);
}

function update() {
  // Player movement
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
  } else {
    player.setVelocityX(0);
  }

  // Allow the player to jump if touching the ground
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }
}

// Platforms class to manage platform sprites
class Platforms {
  constructor(scene) {
    this.scene = scene;
    this.group = this.scene.physics.add.staticGroup();

    // Create platform graphics
    const platformGraphics = this.scene.add.graphics();
    platformGraphics.fillStyle(0x654321, 1); // Brown color
    platformGraphics.fillRect(0, 0, 800, 50);
    platformGraphics.generateTexture("platformTexture", 800, 50);
    platformGraphics.destroy();

    // Create ground platform
    this.group
      .create(400, 575, "platformTexture")
      .setOrigin(0.5, 0.5)
      .refreshBody();

    // Create some additional platforms
    this.group
      .create(600, 400, "platformTexture")
      .setScale(0.5, 0.1)
      .refreshBody();
    this.group
      .create(50, 250, "platformTexture")
      .setScale(0.3, 0.1)
      .refreshBody();
    this.group
      .create(750, 220, "platformTexture")
      .setScale(0.4, 0.1)
      .refreshBody();
  }
}