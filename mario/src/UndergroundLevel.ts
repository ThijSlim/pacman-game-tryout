import Phaser from "phaser";
import { Mario } from "./Mario";
import { Platforms } from "./Platforms";

export class UndergroundLevel extends Phaser.Scene {
  private platforms!: Platforms;
  private player!: Mario;
  private exitPipe: any;
  private blockSize: number = 32;
  private returnX: number = 0; // X position to return to in main level
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UndergroundLevel' });
  }

  init(data: { returnX: number, score: number }) {
    // Store the X position where the player should return to
    this.returnX = data.returnX;
    // Pass the score from the main level
    this.score = data.score;
  }

  create() {
    // Create dark background for underground level
    this.add.rectangle(0, 0, this.scale.width * 2, this.scale.height, 0x000000)
      .setOrigin(0, 0)
      .setDepth(-2);

    const worldWidth = this.scale.width * 2;

    // Create blue-brick ceiling
    for (let x = 0; x < Math.ceil(worldWidth / this.blockSize); x++) {
      this.add.image(x * this.blockSize, 0, 'brick-block')
        .setOrigin(0, 0)
        .setScale(2.0)
        .setTint(0x000066);
    }

    // Create blue-brick walls on left and right
    // Left wall
    for (let y = 1; y < Math.ceil(this.scale.height / this.blockSize) - 2; y++) {
      this.add.image(0, y * this.blockSize, 'brick-block')
        .setOrigin(0, 0)
        .setScale(2.0)
        .setTint(0x000066);
    }
    
    // Right wall
    for (let y = 1; y < Math.ceil(this.scale.height / this.blockSize) - 2; y++) {
      this.add.image(worldWidth - this.blockSize, y * this.blockSize, 'brick-block')
        .setOrigin(0, 0)
        .setScale(2.0)
        .setTint(0x000066);
    }

    // Create blue-brick floor all the way
    this.platforms = new Platforms(this, worldWidth, this.blockSize, []);
    
    // Change the color of the floor blocks to blue
    this.platforms.group.getChildren().forEach((block: any) => {
      block.setTint(0x000066);
    });

    // Create player (Mario)
    this.player = new Mario(this, 100, 400);
    
    // Create blue brick platform under the coins at the center
    const platformWidth = 7 * this.blockSize; // Width for 7 blocks
    const platformX = (worldWidth - platformWidth) / 2; // Center the platform
    const platformY = this.scale.height / 2 + 30; // Position in the middle of the screen with slight offset

    // Create the platform (7 blocks wide)
    for (let i = 0; i < 7; i++) {
      const block = this.physics.add.staticImage(
        platformX + (i * this.blockSize),
        platformY,
        'brick-block'
      )
      .setOrigin(0, 0)
      .setScale(2.0)
      .setTint(0x000066);
      
      // Add to the platform group for collisions
      this.platforms.group.add(block);
    }

    // Create three rows of five coins each
    const coinStartX = (worldWidth - (5 * 50)) / 2; // Center the coins
    const coinSpacing = 50; // Space between each coin
    
    // Create 3 rows of coins
    for (let row = 0; row < 3; row++) {
      const rowY = platformY - (120 - row * 40); // Position above the platform with spacing
      
      // Create 5 coins in this row
      for (let col = 0; col < 5; col++) {
        const coin = this.physics.add.sprite(
          coinStartX + (col * coinSpacing),
          rowY,
          'coin'
        ).setScale(2.0);
        
        coin.body.allowGravity = false;
        
        this.physics.add.overlap(this.player.sprite, coin, () => {
          coin.destroy();
          this.score += 10;
          this.scoreText.setText('Score: ' + this.score);
        });
      }
    }

    // Create big green pipe on the right for exit
    this.exitPipe = this.physics.add.sprite(
      worldWidth - 150, 
      this.scale.height - 2 * this.blockSize, 
      'pipe-large'
    )
      .setOrigin(0, 1)
      .setScale(2.0)
      .setImmovable(true);
    this.exitPipe.body.allowGravity = false;
    this.exitPipe.isExitPipe = true;

    // Add score text
    this.scoreText = this.add.text(16, 16, 'Score: ' + this.score, {
      fontSize: '32px',
      color: '#FFF' // White text for the dark background
    });
    this.scoreText.setScrollFactor(0);

    // Setup collisions
    this.physics.add.collider(this.player.sprite, this.platforms.group);
    this.physics.add.collider(this.player.sprite, this.exitPipe, this.checkPipeExit, undefined, this);

    // Setup camera
    this.cameras.main.setBounds(0, 0, worldWidth, this.scale.height);
    this.cameras.main.startFollow(this.player.sprite);

    // Create a keyboard input for the down key
    this.input.keyboard?.createCursorKeys();
  }

  update() {
    // Update player
    this.player.update(this.input.keyboard?.createCursorKeys());
    
    // Check if player falls into a hole (off the screen bottom)
    if (this.player.sprite.y > this.scale.height) {
      this.returnToMainLevel();
    }
  }

  checkPipeExit(_player: any, pipe: any) {
    if (pipe.isExitPipe && this.input.keyboard?.createCursorKeys().down?.isDown) {
      this.returnToMainLevel();
    }
  }

  returnToMainLevel() {
    // Return to main game scene with the current score
    this.scene.start('MainLevel', { 
      returnFromUnderground: true, 
      returnX: this.returnX,
      score: this.score
    });
  }
}