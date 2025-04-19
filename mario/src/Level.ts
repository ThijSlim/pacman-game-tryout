import Phaser from "phaser";
import { Goomba } from "./Goomba";
import { GreenTurtle } from "./GreenTurtle";
import { Platforms } from "./Platforms";

// The new Level class
export class Level {
  scene: any;
  blockSize: number;
  holes: number[][];
  pipePositions: number[][];
  platformRows: (string | number)[][];
  stairBlocks: number[][];
  questionBlocks: (string | number)[][];
  goombaPositions: { gridX: number; gridY: number; direction: number; }[];
  greenTurtlePositions: { gridX: number; gridY: number; direction: number; }[];
  finishingPolePosition: number;
  platforms: Platforms;
  goombas: Goomba[];
  greenTurtles: GreenTurtle[];
  pole: any;
  flag: any;
  castle: any;
  constructor(scene: Phaser.Scene, worldWidth: number) {
    this.scene = scene;
    this.blockSize = 32;

    // All grid-based configuration
    this.holes = [
      [70, 72], // First hole
      [147, 149], // Second hole

      // Removed the hole at [70, 75] which was under the flag
    ];

    // Pipe positions: [gridX, heightInBlocks]
    this.pipePositions = [
      [28, 2],
      [38, 3],
      [46, 4],
      [57, 4],
      [157, 2],
      [174, 2],
    ];


    // Stairs configuration near the finishing pole - extended for longer runway
    this.stairBlocks = [
      [128, 1],
      [129, 2],
      [130, 3],
      [131, 4],
      // one ersed
      [134, 4],
      [135, 3],
      [136, 2],
      [137, 1],

      [142, 1],
      [143, 2],
      [144, 3],
      [145, 4],
      [146, 4],

      // reversed
      [149, 4],
      [150, 3],
      [151, 2],
      [152, 1],

      [177, 1],
      [178, 2],
      [179, 3],
      [180, 4],
      [181, 5],
      [182, 6],
      [183, 7],
      [184, 8],
      [185, 8],
    ];

    // Platform rows: startGridX, gridY, numBlocks, texture
    this.platformRows = [
      [19, 3, 1, 'platformBlock'],
      [21, 3, 1, 'platformBlock'],
      [23, 3, 1, 'platformBlock'],
      [78, 3, 1, 'platformBlock'],
      [80, 3, 1, 'platformBlock'],
      [81, 7, 8, 'platformBlock'],
      [84, 7, 3, 'platformBlock'],
      [89, 3, 1, 'platformBlock'],
      [95, 3, 1, 'platformBlock'],
      [111, 3, 1, 'platformBlock'],
      [114, 7, 3, 'platformBlock'],
      [121, 7, 1, 'platformBlock'],
      [122, 3, 2, 'platformBlock'],
      [124, 7, 1, 'platformBlock'],
      [162, 3, 1, 'platformBlock'],
      [163, 3, 1, 'platformBlock'],
      [165, 3, 1, 'platformBlock'],
    ];


    // Question blocks: gridX, gridY, contains
    this.questionBlocks = [
      [16, 3, 'coin'],
      [20, 3, 'coin'],
      [22, 3, 'coin'],
      [21, 7, 'powerUp'],
      [79, 3, 'powerUp'],
      [89, 7, 'coin'],
      [96, 3, 'star'],
      [101, 3, 'coin'],
      [104, 3, 'coin'],
      [104, 7, 'powerUp'],
      [107, 3, 'coin'],
      [122, 7, 'coin'],
      [123, 7, 'coin'],
      [164, 3, 'coin'],


    ];

    // Goomba positions: {gridX, gridY, direction}
    this.goombaPositions = [
      { gridX: 25, gridY: 4, direction: 1 },
      { gridX: 42, gridY: 4, direction: -1 },
      { gridX: 52, gridY: 4, direction: 1 },
      { gridX: 53, gridY: 4, direction: -1 },
      { gridX: 100, gridY: 4, direction: 1 },
      { gridX: 166, gridY: 4, direction: -1 },
      { gridX: 167, gridY: 4, direction: 1 },
    ];

    // Green Turtle positions: {gridX, gridY, direction}
    this.greenTurtlePositions = [
      { gridX: 10, gridY: 5, direction: 1 },
      { gridX: 48, gridY: 4, direction: -1 },
      { gridX: 105, gridY: 4, direction: 1 },
    ];

    // Finishing pole position (near end of level)
    this.finishingPolePosition = 194; // Moved to the end of the level

    // Create all platforms and environment
    this.platforms = new Platforms(this.scene, worldWidth, this.blockSize, this.holes);

    // Add pipes, blocks, platforms, question blocks, etc.
    this.createGreenPipes();
    this.createPlatformBlocks();
    this.createQuestionBlocks();
    this.createFinishingPole();
    this.createStairs(); // Add stairs to reach the top of the pole


    // Add Goombas
    this.goombas = [];
    this.createGoombas();

    // Add Green Turtles
    this.greenTurtles = [];
    this.createGreenTurtles();
  }

  createGreenPipes() {
    // Use the pipePositions array defined at the top
    this.pipePositions.forEach(([gridX, heightInBlocks]) => {
      this.createPipeAtGrid(gridX, heightInBlocks);
    });
  }

  createPipeAtGrid(gridX: number, heightInBlocks: number) {
    const x = gridX * this.blockSize;
    const groundY = this.scene.scale.height - (2 * this.blockSize); // Adjusted for double-height ground

    // Determine which pipe sprite to use based on height
    let pipeKey: string;

    switch (heightInBlocks) {
      case 1:
        pipeKey = 'pipe-small'; // 32x32px
        break;
      case 2:
        pipeKey = 'pipe-small'; // 32x32px
        break;
      case 3:
        pipeKey = 'pipe-medium'; // 32x48px
        break;
      case 4:
      default:
        pipeKey = 'pipe-large'; // 32x64px
        break;
    }

    // Create the pipe as a static physics object
    const pipe = this.platforms.group
      .create(x, groundY, pipeKey)
      .setOrigin(0, 1)
      .setScale(2.0)  // Scale up from 16px to 32px
      .refreshBody();

    // Ensure the pipe sprite has proper collision body
    if (heightInBlocks === 3) {
      pipe.body.setSize(32 * 2, 48 * 2).setOffset(0); // Adjusted offset for 3-block height
    } else if (heightInBlocks === 4) {
      pipe.body.setSize(32 * 2, 64 * 2).setOffset(0); // Adjusted offset for 4-block height
    }
  }

  createPlatformBlocks() {
    if (!this.scene.textures.exists('platformBlock')) {
      const platformGraphics = this.scene.add.graphics();
      platformGraphics.fillStyle(0xa0522d, 1);
      platformGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      platformGraphics.generateTexture('platformBlock', this.blockSize, this.blockSize);
      platformGraphics.destroy();
    }

    // Use the platformRows array defined at the top
    this.platformRows.forEach(([startGridX, gridY, numBlocks, texture]) => {
      this.createPlatformRowAtGrid(startGridX as number, gridY as number, numBlocks as number, texture as string);
    });
  }

  createPlatformRowAtGrid(startGridX: number, gridY: number, numBlocks: number, texture: string) {
    const startX = startGridX * this.blockSize;
    const y = this.scene.scale.height - ((gridY + 2) * this.blockSize) - this.blockSize / 2; // Added +2 for double-height ground
    for (let i = 0; i < numBlocks; i++) {
      this.platforms.group
        .create(startX + i * this.blockSize, y, 'brick-block')
        .setOrigin(0, 0.5)
        .setScale(2.0)  // Scale up from 16px to 32px
        .refreshBody();
    }
  }

  createQuestionBlocks() {
    // Use the coin block sprites instead of generating graphics
    this.questionBlocks.forEach(([gridX, gridY, contains]) => {
      this.createQuestionBlock(gridX as number, gridY as number, contains as string);
    });
  }

  createQuestionBlock(gridX: number, gridY: number, contains: string | number) {
    const x = gridX * this.blockSize;
    const y = this.scene.scale.height - ((gridY + 2) * this.blockSize) - this.blockSize / 2;

    const questionBlock = this.platforms.group
      .create(x, y, 'coin-block-active')
      .setOrigin(0, 0.5)
      .setScale(2.0)
      .refreshBody();

    questionBlock.contains = contains;
    questionBlock.activated = false;

    // Add support for star power-up
    questionBlock.onHit = () => {
      if (questionBlock.activated) return;
      questionBlock.activated = true;
      questionBlock.setTexture('coin-block-deactive');
    };
  }

  createGoombas() {
    this.goombaPositions.forEach((pos) => {
      const x = pos.gridX * this.blockSize;
      const y = this.scene.scale.height - ((pos.gridY + 2) * this.blockSize); // Added +2 for double-height ground

      const goomba = new Goomba(this.scene, x, y, pos.direction);
      this.goombas.push(goomba);
    });
  }

  createGreenTurtles() {
    this.greenTurtlePositions.forEach((pos) => {
      const x = pos.gridX * this.blockSize;
      const y = this.scene.scale.height - ((pos.gridY + 2) * this.blockSize); // Adjusted for double-height ground

      const greenTurtle = new GreenTurtle(this.scene, x, y, pos.direction);
      this.greenTurtles.push(greenTurtle);
    });
  }

  createFinishingPole() {
    // Create texture for pole if it doesn't exist
    if (!this.scene.textures.exists('poleTexture')) {
      const poleGraphics = this.scene.add.graphics();
      poleGraphics.fillStyle(0x70cb11, 1); // Green color (#70cb11)
      poleGraphics.fillRect(0, 0, 4, this.blockSize * 10); // 4 pixels wide
      poleGraphics.generateTexture('poleTexture', 4, this.blockSize * 10);
      poleGraphics.destroy();
    }

    // Position the flag at the top of the pole
    const poleX = this.finishingPolePosition * this.blockSize;
    const groundY = this.scene.scale.height - (2 * this.blockSize); // Adjusted for double-height ground
    const poleHeight = this.blockSize * 10; // Increased height by 2 blocks
    
    // Create a stair block under the pole
    this.platforms.group
      .create(poleX - 8, groundY - this.blockSize/2, 'stairs-block')
      .setOrigin(0, 0.5)
      .setScale(2.0)
      .refreshBody();

    // Create the pole (static, not collidable) - now 2 blocks higher and on a stair block
    this.pole = this.scene.add.sprite(poleX + 8, groundY - this.blockSize - poleHeight / 2, 'poleTexture');

    // Create the flag orb at the top of the pole
    const flagOrb = this.scene.add.sprite(
      poleX + 8, // Same x as pole
      groundY - this.blockSize - poleHeight, // Top of pole
      'flag-orb'
    ).setScale(2.0);
    
    // Create the flag as a physics object for collision detection
    this.flag = this.scene.physics.add.sprite(
      poleX-8, // Offset to right of pole
      groundY - this.blockSize - poleHeight + 24, // Just below the orb
      'flag'
    ).setScale(2.0);
    
    this.flag.body.allowGravity = false;
    this.flag.isFlag = true; // Mark this object as a flag for collision handling
    
    // Make the flag collision area more balanced - large enough to detect collision but not too large
    this.flag.body.setSize(4, 100); // Adjusted size for reliable collision detection
    this.flag.body.setOffset(12, 0); // Offset to better align with the flag graphic


    // Create a small castle at the end
    if (!this.scene.textures.exists('castleTexture')) {
      const castleGraphics = this.scene.add.graphics();
      castleGraphics.fillStyle(0xA52A2A, 1); // Brown castle
      castleGraphics.fillRect(0, 0, this.blockSize * 3, this.blockSize * 3);
      // Add a small door
      castleGraphics.fillStyle(0x000000, 1);
      castleGraphics.fillRect(this.blockSize, this.blockSize * 1.5, this.blockSize, this.blockSize * 1.5);
      castleGraphics.generateTexture('castleTexture', this.blockSize * 3, this.blockSize * 3);
      castleGraphics.destroy();
    }

    // Add the castle just after the pole
    this.castle = this.scene.add.sprite(poleX + (this.blockSize * 4), groundY - (this.blockSize * 1.5), 'castleTexture');
  }

  createStairs() {
    // Create each stair section based on stairBlocks configuration
    this.stairBlocks.forEach(([gridX, heightBlocks]) => {
      for (let j = 0; j < heightBlocks; j++) {
        const x = (gridX) * this.blockSize;
        const y = this.scene.scale.height - ((j + 2) * this.blockSize) - this.blockSize / 2; // Added +2 for double-height ground

        this.platforms.group
          .create(x, y, 'stairs-block')
          .setOrigin(0, 0.5)
          .setScale(2.0)  // Scale up from 16px to 32px
          .refreshBody();
      }
    });
  }
}
