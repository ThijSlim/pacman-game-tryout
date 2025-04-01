
export class Platforms {
  scene: any;
  group: any;
  blockSize: any;
  holes: any;
  constructor(scene: any, worldWidth: any, blockSize: number, holes: number[][]) {
    this.scene = scene;
    this.group = this.scene.physics.add.staticGroup();
    this.blockSize = blockSize;
    this.holes = holes;

    this.createGround(worldWidth);
  }

  createGround(worldWidth: number) {
    if (!this.scene.textures.exists('groundBlock')) {
      const groundGraphics = this.scene.add.graphics();
      groundGraphics.fillStyle(0x8b4513, 1);
      groundGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      groundGraphics.generateTexture('groundBlock', this.blockSize, this.blockSize);
      groundGraphics.destroy();
    }

    const numBlocks = Math.ceil(worldWidth / this.blockSize);

    for (let x = 0; x <= numBlocks; x++) {
      if (this.isInHole(x)) {
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

  isInHole(blockIndex: number) {
    for (const [start, end] of this.holes) {
      if (blockIndex >= start && blockIndex < end) {
        return true;
      }
    }
    return false;
  }
}
