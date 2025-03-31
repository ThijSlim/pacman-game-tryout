import Phaser from "phaser";

const config = {
  type: Phaser.AUTO,
  width: 800, // Canvas width remains the same
  height: 600,
  physics: {
    default: 'arcade',
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

let player: Mario;
let cursors: Phaser.Types.Input.Keyboard.CursorKeys| undefined;
let score = 0;
let scoreText: Phaser.GameObjects.Text;
let gameOver = false;
let levelCompleted = false;
let level: Level;

const game = new Phaser.Game(config as any);

function preload() {
  // No external assets to load
}

function create(this: Phaser.Scene) {
  const worldWidth = 2400; // 3 times the original width
  const background = this.add.graphics();
  background.fillStyle(0x87ceeb, 1); // Light blue color
  background.fillRect(0, 0, worldWidth, 600);

  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    color: '#000',
  });
  scoreText.setScrollFactor(0);

  this.physics.world.setBounds(0, 0, worldWidth, 600);

  // Create and initialize the Level
  level = new Level(this, worldWidth);
  player = new Mario(this, 2200, 450); // Adjusted Mario's starting position to spawn more in the back

  // Make player collide with platforms
  this.physics.add.collider(player.sprite, level.platforms.group, hitBlock, undefined, this);
  
  // Add flag collision detection
  this.physics.add.overlap(player.sprite, level.flag, reachFinishingPole, undefined, this);

  // Setup Goomba collisions
  level.goombas.forEach((goomba) => {
    // Goombas collide with platforms
    this.physics.add.collider(goomba.sprite, level.platforms.group);
    
    // Goomba & Player collision - handled inside Goomba class
    this.physics.add.collider(player.sprite, goomba.sprite,  (playerSprite, goombaSprite) => {
      goomba.handlePlayerCollision(playerSprite, player, () => {
        score += 50;
        scoreText.setText('Score: ' + score);
      }, endGame.bind(this));
    }, undefined, this);

    // Collide goombas with each other
    level.goombas.forEach((otherGoomba) => {
      if (otherGoomba !== goomba) {
        this.physics.add.collider(goomba.sprite, otherGoomba.sprite, function (goombaSprite1, goombaSprite2) {
          goomba.handleGoombaCollision(goombaSprite1, goombaSprite2);
        }, undefined, this);
      }
    });
  });

  this.cameras.main.setBounds(0, 0, worldWidth, 600);
  this.cameras.main.startFollow(player.sprite);

  cursors = this.input.keyboard?.createCursorKeys();
}

function update(this: Phaser.Scene) {
  if (gameOver || levelCompleted) return;

  player.update(cursors);

  // Update all goombas
  level.goombas.forEach((goomba) => goomba.update());

  // Check if Mario falls into a hole (off the screen bottom)
  if (player.sprite.y > this.scale.height) {
    // Mario fell off the bottom of the screen
    endGame.call(this);
  }
}

function hitBlock(this: Phaser.Scene, playerSprite: any, block: any) {
  if (playerSprite.body.touching.up && block.body.touching.down) {
    // If it's a question block and not activated yet
    if (block.texture.key === 'questionBlock' && !block.activated) {
      block.activated = true;
      block.setTexture('usedBlock');

      if (block.contains === 'coin') {
        spawnCoin.call(this, block.x + block.width / 2, block.y - block.height);
        score += 10;
        scoreText.setText('Score: ' + score);
      } else if (block.contains === 'powerUp') {
        spawnPowerUp.call(
          this,
          block.x + block.width / 2,
          block.y - block.height
        );
      }
    } else if (block.texture.key === 'usedBlock') {
      // No action
    } else {
      // Normal block: break it
      breakBlock.call(this, block);
    }
  }
}

function breakBlock(this: Phaser.Scene, block) {
  const x = block.x;
  const y = block.y;

  block.destroy();

  const debrisCount = 4;
  const debrisSize = 8;
  if (!this.textures.exists('debris')) {
    const debrisGraphics = this.add.graphics();
    debrisGraphics.fillStyle(0x8b4513, 1); // Brown pieces
    debrisGraphics.fillRect(0, 0, debrisSize, debrisSize);
    debrisGraphics.generateTexture('debris', debrisSize, debrisSize);
    debrisGraphics.destroy();
  }

  for (let i = 0; i < debrisCount; i++) {
    const debris = this.physics.add.sprite(x, y - 8, 'debris');
    debris.setVelocity(
      Phaser.Math.Between(-100, 100),
      Phaser.Math.Between(-300, -200)
    );
    debris.body.allowGravity = true;

    this.tweens.add({
      targets: debris,
      alpha: 0,
      duration: 500,
      delay: 300,
      onComplete: () => {
        debris.destroy();
      },
    });
  }

  score += 5;
  scoreText.setText('Score: ' + score);
}

function spawnPowerUp(this: Phaser.Scene, x, y) {
  if (!this.textures.exists('powerUp')) {
    const powerUpGraphics = this.add.graphics();
    powerUpGraphics.fillStyle(0xff0000, 1);
    powerUpGraphics.fillCircle(15, 15, 15);
    powerUpGraphics.generateTexture('powerUp', 30, 30);
    powerUpGraphics.destroy();
  }

  const powerUp = this.physics.add.sprite(x, y, 'powerUp');
  powerUp.setVelocityY(-100);
  powerUp.body.allowGravity = false;

  this.time.delayedCall(500, () => {
    powerUp.setVelocityY(0);
    powerUp.body.allowGravity = true;
  });

  this.physics.add.collider(powerUp, level.platforms.group);
  this.physics.add.overlap(player.sprite, powerUp, collectPowerUp, undefined, this);
}

function spawnCoin(this: Phaser.Scene, x, y) {
  if (!this.textures.exists('coin')) {
    const coinGraphics = this.add.graphics();
    coinGraphics.fillStyle(0xffff00, 1);
    coinGraphics.fillCircle(15, 15, 15);
    coinGraphics.generateTexture('coin', 30, 30);
    coinGraphics.destroy();
  }

  const coin = this.physics.add.sprite(x, y, 'coin');
  coin.body.allowGravity = false;

  this.tweens.add({
    targets: coin,
    y: y - 50,
    alpha: 0,
    duration: 800,
    ease: 'Power1',
    onComplete: () => {
      coin.destroy();
    },
  });
}

function collectPowerUp(this: Phaser.Scene, playerSprite, powerUp) {
  powerUp.destroy();

  var scaleFactor = 1.5;
  var speedFactor = 1.5;

  this.tweens.add({
    targets: player.sprite,
    scaleX: scaleFactor,
    scaleY: scaleFactor,
    yoyo: true,
    repeat: 2,
    duration: 100,
    onComplete: () => {
      player.collectPowerUp(scaleFactor, speedFactor);
    },
  });
}

function endGame(this: Phaser.Scene) {
  gameOver = true;
  player.sprite.setTint(0xff0000);

  this.physics.pause();
  const gameOverText = this.add.text(
    this.cameras.main.midPoint.x,
    this.cameras.main.midPoint.y,
    'Game Over',
    { fontSize: '64px', color: '#000' }
  );
  gameOverText.setOrigin(0.5);
}

function reachFinishingPole(this: Phaser.Scene, playerSprite, flag) {
  if (levelCompleted) return;
  levelCompleted = true;

  // Store blockSize for proper positioning
  const blockSize = level.blockSize;

  // Ensure Mario is aligned with the pole
  playerSprite.x = level.pole.x;

  // Stop player horizontal movement
  playerSprite.setVelocityX(0);

  // Animate the flag going down
  this.tweens.add({
    targets: flag,
    y: this.scale.height - blockSize * 2, // Use blockSize
    duration: 1000,
    ease: 'Linear',
  });

  // Animate Mario sliding down the pole
  this.tweens.add({
    targets: playerSprite,
    y: this.scale.height - blockSize * 2, // Use blockSize
    duration: 1000,
    ease: 'Linear',
    onComplete: () => {
      // Make Mario move automatically to the castle
      playerSprite.setVelocityX(100);

      // Once Mario reaches the castle, show level complete message
      this.time.delayedCall(1500, () => {
        // Stop all movement
        this.physics.pause();

        // Make Mario disappear (entered the castle)
        playerSprite.setVisible(false);

        // Display level complete message
        const completedText = this.add.text(
          this.cameras.main.midPoint.x,
          this.cameras.main.midPoint.y,
          'Level Complete!\nScore: ' + score,
          { fontSize: '48px', color: '#000', align: 'center' }
        );
        completedText.setOrigin(0.5);

        // Set up for next level or restart
        this.time.delayedCall(3000, () => {
          const restartText = this.add.text(
            this.cameras.main.midPoint.x,
            this.cameras.main.midPoint.y + 100,
            'Press SPACE to restart',
            { fontSize: '24px', color: '#000' }
          );
          restartText.setOrigin(0.5);

          // Add event listener for restart
          this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
            score = 0;
            gameOver = false;
            levelCompleted = false;
          });
        });
      });
    },
  });
}

class Mario {
  scene: any;
  sprite: any;
  moveSpeed: number;
  
  constructor(scene, x, y) {
    this.scene = scene;

    const blockSize = 32;
    const scaleFactor = 1;
    const marioHeight = blockSize;
    const marioWidth = (2 / 3) * marioHeight;

    const marioGraphics = scene.add.graphics();
    // Head
    marioGraphics.fillStyle(0xffcc99, 1);
    marioGraphics.fillCircle(marioWidth / 2, marioHeight / 4, marioHeight / 4);
    // Body
    marioGraphics.fillStyle(0xff0000, 1);
    marioGraphics.fillRect(0, marioHeight / 2, marioWidth, marioHeight / 2);

    marioGraphics.generateTexture('marioTexture', marioWidth, marioHeight);
    marioGraphics.destroy();

    this.sprite = scene.physics.add
      .sprite(x, y, 'marioTexture')
      .setOrigin(0.5, 1);
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setBounce(0);
    this.sprite.body.setSize(marioWidth, marioHeight).setOffset(0, 0);
    this.moveSpeed = 220;

    this.createAnimations();
  }

  createAnimations() {
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

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys| undefined) {
    if (!cursors) return;
    
    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-this.moveSpeed);
      this.sprite.anims.play('left', true);
      this.sprite.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(this.moveSpeed);
      this.sprite.anims.play('right', true);
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
      this.sprite.anims.play('turn');
    }

    if (
      cursors.up.isDown &&
      (this.sprite.body.touching.down || this.sprite.body.blocked.down)
    ) {
      this.sprite.setVelocityY(-876);
    }
  }

  collectPowerUp(scaleFactor: number, speedFactor: number) {
    this.sprite.setScale(scaleFactor);
    this.moveSpeed *= speedFactor;
  }
}

class Platforms {
  scene: any;
  group: any;
  blockSize: any;
  holes: any;
  constructor(scene, worldWidth, blockSize, holes) {
    this.scene = scene;
    this.group = this.scene.physics.add.staticGroup();
    this.blockSize = blockSize;
    this.holes = holes;

    this.createGround(worldWidth);
  }

  createGround(worldWidth) {
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

  isInHole(blockIndex) {
    for (const [start, end] of this.holes) {
      if (blockIndex >= start && blockIndex < end) {
        return true;
      }
    }
    return false;
  }
}

class Goomba {
  scene: any;
  speed: number;
  direction: number;
  sprite: any;
  constructor(scene, x, y, direction = -1) {
    this.scene = scene;
    this.speed = 50;
    this.direction = direction;

    if (!this.scene.textures.exists('goomba')) {
      const goombaGraphics = this.scene.add.graphics();
      goombaGraphics.fillStyle(0x8b4513, 1); // Brown color
      goombaGraphics.fillCircle(16, 16, 16); 
      goombaGraphics.generateTexture('goomba', 32, 32);
      goombaGraphics.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, 'goomba');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setVelocityX(this.speed * this.direction);
    this.sprite.goomba = this;
  }

  update() {
    if (!this.sprite.body?.blocked) {
      return;
    }

    // Reverse direction if blocked
    if (this.sprite.body.blocked.left || this.sprite.body.touching.left) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed * this.direction);
    } else if (this.sprite.body.blocked.right || this.sprite.body.touching.right) {
      this.direction = -1;
      this.sprite.setVelocityX(this.speed * this.direction);
    }
  }

  handlePlayerCollision(playerSprite, playerObj, onStompedCallback, onGameOverCallback) {
    // If player hits Goomba from above
    if (playerSprite.body.touching.down && this.sprite.body.touching.up) {
      // Goomba defeated
      this.sprite.destroy();
      playerSprite.setVelocityY(-876);
      if (onStompedCallback) onStompedCallback();
    } else {
      // Player hit Goomba from side or bottom - game over
      if (onGameOverCallback) onGameOverCallback();
    }
  }

  handleGoombaCollision(goombaSprite1, goombaSprite2) {
    // Reverse direction for both goombas
    const goomba1 = goombaSprite1.goomba;
    const goomba2 = goombaSprite2.goomba;

    goomba1.direction *= -1;
    goomba1.sprite.setVelocityX(goomba1.speed * goomba1.direction);

    goomba2.direction *= -1;
    goomba2.sprite.setVelocityX(goomba2.speed * goomba2.direction);
  }
}

// The new Level class
class Level {
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
  constructor(scene, worldWidth) {
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

  createPipeAtGrid(gridX, heightInBlocks) {
    const x = gridX * this.blockSize;
    const groundY = this.scene.scale.height - this.blockSize;

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
      this.createPlatformRowAtGrid(startGridX, gridY, numBlocks, texture);
    });
  }

  createPlatformRowAtGrid(startGridX, gridY, numBlocks, texture) {
    const startX = startGridX * this.blockSize;
    const y = this.scene.scale.height - gridY * this.blockSize - this.blockSize / 2;
    for (let i = 0; i < numBlocks; i++) {
      this.platforms.group
        .create(startX + i * this.blockSize, y, texture)
        .setOrigin(0, 0.5)
        .refreshBody();
    }
  }

  createQuestionBlocks() {
    if (!this.scene.textures.exists('questionBlock')) {
      const questionBlockGraphics = this.scene.add.graphics();
      questionBlockGraphics.fillStyle(0xffd700, 1);
      questionBlockGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      questionBlockGraphics.generateTexture('questionBlock', this.blockSize, this.blockSize);
      questionBlockGraphics.destroy();
    }

    if (!this.scene.textures.exists('usedBlock')) {
      const usedBlockGraphics = this.scene.add.graphics();
      usedBlockGraphics.fillStyle(0xa9a9a9, 1);
      usedBlockGraphics.fillRect(0, 0, this.blockSize, this.blockSize);
      usedBlockGraphics.generateTexture('usedBlock', this.blockSize, this.blockSize);
      usedBlockGraphics.destroy();
    }

    // Use the questionBlocks array defined at the top
    this.questionBlocks.forEach(([gridX, gridY, contains]) => {
      this.createQuestionBlock(gridX, gridY, contains);
    });
  }

  createQuestionBlock(gridX, gridY, contains) {
    const x = gridX * this.blockSize;
    const y = this.scene.scale.height - gridY * this.blockSize - this.blockSize / 2;

    const questionBlock = this.platforms.group
      .create(x, y, 'questionBlock')
      .setOrigin(0, 0.5)
      .refreshBody();

    questionBlock.contains = contains;
    questionBlock.activated = false;
  }

  createGoombas() {
    this.goombaPositions.forEach((pos) => {
      const x = pos.gridX * this.blockSize;
      const y = this.scene.scale.height - pos.gridY * this.blockSize;

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
    const groundY = this.scene.scale.height - this.blockSize;
    const poleHeight = this.blockSize * 8;
    
    // Create the pole (static, not collidable)
    this.pole = this.scene.add.sprite(poleX, groundY - poleHeight/2, 'poleTexture');
    
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
          const y = this.scene.scale.height - j * this.blockSize - this.blockSize / 2;
          
          this.platforms.group
            .create(x, y, 'stairBlock')
            .setOrigin(0, 0.5)
            .refreshBody();
        }
      }
    });
  }
}