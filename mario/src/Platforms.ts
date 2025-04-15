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
    const numBlocks = Math.ceil(worldWidth / this.blockSize);

    // Create two layers of ground blocks
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x <= numBlocks; x++) {
        if (this.isInHole(x)) {
          continue;
        }
        const groundBlock = this.group
          .create(
            x * this.blockSize,
            this.scene.scale.height - (y * this.blockSize) - this.blockSize / 2,
            'ground-block'
          )
          .setOrigin(0, 0.5)
          .setScale(2.0)  // Scale up from 16px to 32px
          .refreshBody();
      }
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
