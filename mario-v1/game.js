const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: { preload, create, update },
  physics: { default: 'arcade' },
};

const game = new Phaser.Game(config);

function preload() {
  // Load assets here
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
  playerGraphics.generateTexture('playerTexture', 32, 48);
  playerGraphics.destroy();

  // Add the player sprite using the generated texture
  player = this.physics.add.sprite(400, 300, 'playerTexture');

  // Player physics properties
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  // Input events
  cursors = this.input.keyboard.createCursorKeys();

  // Create animations
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });

  this.anims.create({
    key: 'turn',
    frames: [{ key: 'player', frame: 4 }],
    frameRate: 20
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });
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
}