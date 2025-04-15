import Phaser from "phaser";
import { Goomba } from "./Goomba";
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
  finishingPolePosition: number;
  platforms: Platforms;
  goombas: Goomba[];
  pole: any;
  flag: any;
  castle: any;
  constructor(scene: Phaser.Scene, worldWidth: number) {
    this.scene = scene;
    this.blockSize = 32;

    // All grid-based configuration
    this.holes = [
      [60, 65], // First hole
      // Removed the hole at [70, 75] which was under the flag
    ];

    // Pipe positions: [gridX, heightInBlocks]
    this.pipePositions = [
      [30, 2],
      [39, 3],
      [46, 4],
      [56, 4],
    ];

    // Platform rows: startGridX, gridY, numBlocks, texture
    this.platformRows = [
      [19, 4, 1, 'platformBlock'],
      [21, 4, 1, 'platformBlock'],
      [23, 4, 1, 'platformBlock'],
    ];

    // Stairs configuration near the finishing pole - extended for longer runway
    this.stairBlocks = [
      [62, 1, 4], // [startGridX, heightBlocks, numBlocks] - first stair (moved earlier)
      [63, 2, 3], // second stair (moved earlier)
      [64, 3, 2], // third stair (moved earlier)
      [65, 4, 1], // fourth stair (moved earlier)
      [67, 1, 4], // Additional stairs for longer runway
      [68, 2, 3],
      [69, 3, 2],
      [70, 4, 1],
    ];

    // Question blocks: gridX, gridY, contains
    this.questionBlocks = [
      [16, 4, 'coin'],
      [20, 4, 'coin'],
      [22, 4, 'coin'],
      [21, 8, 'powerUp'],
    ];

    // Goomba positions: {gridX, gridY, direction}
    this.goombaPositions = [
      { gridX: 25, gridY: 4, direction: 1 },
      { gridX: 42, gridY: 4, direction: -1 },
      { gridX: 52, gridY: 4, direction: 1 },
      { gridX: 53, gridY: 4, direction: -1 },
    ];

    // Finishing pole position (near end of level)
    this.finishingPolePosition = 72;

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
  }

  createGreenPipes() {
    if (!this.scene.textures.exists('pipeBlock')) {
      const pipeGraphics = this.scene.add.graphics();
      pipeGraphics.fillStyle(0x008000, 1); // Green
      pipeGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      pipeGraphics.generateTexture('pipeBlock', this.blockSize, this.blockSize);
      pipeGraphics.destroy();
    }

    // Use the pipePositions array defined at the top
    this.pipePositions.forEach(([gridX, heightInBlocks]) => {
      this.createPipeAtGrid(gridX, heightInBlocks);
    });
  }

  createPipeAtGrid(gridX: number, heightInBlocks: number) {
    const x = gridX * this.blockSize;
    const groundY = this.scene.scale.height - (2 * this.blockSize); // Adjusted for double-height ground

    for (let i = 0; i < heightInBlocks; i++) {
      const y = groundY - i * this.blockSize;
      this.platforms.group
        .create(x, y, 'pipeBlock')
        .setOrigin(0, 1)
        .refreshBody();
      this.platforms.group
        .create(x + this.blockSize, y, 'pipeBlock')
        .setOrigin(0, 1)
        .refreshBody();
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
    const y = this.scene.scale.height - ((gridY + 2) * this.blockSize) - this.blockSize / 2; // Added +2 for double-height ground

    const questionBlock = this.platforms.group
      .create(x, y, 'coin-block-active')
      .setOrigin(0, 0.5)
      .setScale(2.0)  // Scale up the 16x16 sprite to 32x32
      .refreshBody();

    questionBlock.contains = contains;
    questionBlock.activated = false;
  }

  createGoombas() {
    this.goombaPositions.forEach((pos) => {
      const x = pos.gridX * this.blockSize;
      const y = this.scene.scale.height - ((pos.gridY + 2) * this.blockSize); // Added +2 for double-height ground

      const goomba = new Goomba(this.scene, x, y, pos.direction);
      this.goombas.push(goomba);
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
