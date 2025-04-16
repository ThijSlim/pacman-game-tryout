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
      // Removed the hole at [70, 75] which was under the flag
    ];

    // Pipe positions: [gridX, heightInBlocks]
    this.pipePositions = [
      [28, 2],
      [38, 3],
      [46, 4],
      [57, 4],
    ];


    // Stairs configuration near the finishing pole - extended for longer runway
    this.stairBlocks = [
      // New stairs at the end of the level
      [135, 1, 4], // First stairs at the end of level
      [136, 2, 3],
      [137, 3, 2],
      [138, 4, 1],
      [140, 1, 4], // Final stairs before flag
      [141, 2, 3],
      [142, 3, 2],
      [143, 4, 1],
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

    ];

    // Goomba positions: {gridX, gridY, direction}
    this.goombaPositions = [
      { gridX: 25, gridY: 4, direction: 1 },
      { gridX: 42, gridY: 4, direction: -1 },
      { gridX: 52, gridY: 4, direction: 1 },
      { gridX: 53, gridY: 4, direction: -1 },
      { gridX: 100, gridY: 4, direction: 1 },
    ];

    // Green Turtle positions: {gridX, gridY, direction}
    this.greenTurtlePositions = [
      { gridX: 10, gridY: 5, direction: 1 },
      { gridX: 48, gridY: 4, direction: -1 },
      { gridX: 105, gridY: 4, direction: 1 },
    ];

    // Finishing pole position (near end of level)
    this.finishingPolePosition = 145; // Moved to the end of the level

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
    // Create textures for flag and pole if they don't exist
    if (!this.scene.textures.exists('poleTexture')) {
      const poleGraphics = this.scene.add.graphics();
      poleGraphics.fillStyle(0xC0C0C0, 1); // Silver color
      poleGraphics.fillRect(0, 0, 8, this.blockSize * 8);
      poleGraphics.generateTexture('poleTexture', 8, this.blockSize * 8);
      poleGraphics.destroy();
    }

    if (!this.scene.textures.exists('flagTexture')) {
      const flagGraphics = this.scene.add.graphics();
      flagGraphics.fillStyle(0x008000, 1); // Green flag
      flagGraphics.fillRect(0, 0, 32, 32);
      flagGraphics.generateTexture('flagTexture', 32, 32);
      flagGraphics.destroy();
    }

    // Position the flag at the top of the pole
    const poleX = this.finishingPolePosition * this.blockSize;
    const groundY = this.scene.scale.height - (2 * this.blockSize); // Adjusted for double-height ground
    const poleHeight = this.blockSize * 8;

    // Create the pole (static, not collidable)
    this.pole = this.scene.add.sprite(poleX, groundY - poleHeight / 2, 'poleTexture');

    // Create the flag as a physics object for collision detection
    this.flag = this.scene.physics.add.sprite(poleX + 16, groundY - poleHeight + 16, 'flagTexture');
    this.flag.body.allowGravity = false;
    this.flag.isFlag = true; // Mark this object as a flag for collision handling


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
    if (!this.scene.textures.exists('stairBlock')) {
      const stairGraphics = this.scene.add.graphics();
      stairGraphics.fillStyle(0x8b4513, 1); // Brown color for stairs
      stairGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      stairGraphics.lineStyle(2, 0x5c2d11); // Darker outline
      stairGraphics.strokeRect(0, 0, this.blockSize, this.blockSize);
      stairGraphics.generateTexture('stairBlock', this.blockSize, this.blockSize);
      stairGraphics.destroy();
    }

    // Create each stair section based on stairBlocks configuration
    this.stairBlocks.forEach(([gridX, heightBlocks, numBlocks]) => {
      for (let i = 0; i < numBlocks; i++) {
        for (let j = 0; j < heightBlocks; j++) {
          const x = (gridX + i) * this.blockSize;
          const y = this.scene.scale.height - ((j + 2) * this.blockSize) - this.blockSize / 2; // Added +2 for double-height ground

          this.platforms.group
            .create(x, y, 'stairBlock')
            .setOrigin(0, 0.5)
            .refreshBody();
        }
      }
    });
  }
}
