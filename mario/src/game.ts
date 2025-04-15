import Phaser from "phaser";
import { Mario } from "./Mario";
import { Level } from "./Level";

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

function preload(this: Phaser.Scene) {
  this.load.image('mario-default', 'public/mario/mario-default.png');
  this.load.image('mario-running', 'public/mario/mario-running.png');
  this.load.image('mario-jumping', 'public/mario/mario-jumping.png');
  
  // Load the goomba sprites
  this.load.image('goomba-1', 'public/goomba/goomba-1.png');
  this.load.image('goomba-2', 'public/goomba/goomba-2.png');
  this.load.image('goomba-dead', 'public/goomba/goomba-dead.png');
  
  // Load the coin block sprites
  this.load.image('coin-block-active', 'public/blocks/coin-block-active.png');
  this.load.image('coin-block-deactive', 'public/blocks/coin-block-deactive.png');
  // Load the ground block sprite
  this.load.image('ground-block', 'public/blocks/ground-block.png');
  // Load the brick block sprite
  this.load.image('brick-block', 'public/blocks/brick-block.png');
  // Load the background image
  this.load.image('background', 'public/background/repeated-background.png');
  
  // Load the pipe sprites
  this.load.image('pipe-small', 'public/pipes/pipe-small.png');
  this.load.image('pipe-medium', 'public/pipes/pipe-medium.png');
  this.load.image('pipe-large', 'public/pipes/pipe-large.png');
}

function create(this: Phaser.Scene) {
  const worldWidth = 2400; // 3 times the original width

  const background = this.add.graphics();
  background.fillStyle(0x4b7ffc, 1); 
  background.fillRect(0, 0, worldWidth, 600);
  background.setDepth(-2); // Set background depth to -1 to render behind other objects


  // Create multiple static background images across the entire world
  // This approach uses individual images instead of a scrolling tileSprite
  const bgHeight = config.height;
  const bgWidth = 1500;
  const numBackgrounds = Math.ceil(worldWidth / bgWidth);
  
  // Create multiple background images placed side by side
  // Offset the background 64 pixels from the bottom to position it above the floor tiles
  for (let i = 0; i < numBackgrounds; i++) {
    this.add.image(i * bgWidth, 0, 'background')
      .setOrigin(0, 0)
      .setDisplaySize(bgWidth, bgHeight - 64) // Reduce height to account for bottom offset
      .setDepth(-1)
      .setScrollFactor(1); // Makes it static relative to the world (not the camera)
  }

  scoreText = this.add.text(16, 16, 'Score: 0', {
    fontSize: '32px',
    color: '#000',
  });
  scoreText.setScrollFactor(0);

  this.physics.world.setBounds(0, 0, worldWidth, 600);

  // Create and initialize the Level
  level = new Level(this, worldWidth);
  player = new Mario(this, 100, 450 - 32); // Adjusted spawn height for double-height ground

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
    // If it's a coin block and not activated yet
    if (block.texture.key === 'coin-block-active' && !block.activated) {
      block.activated = true;
      block.setTexture('coin-block-deactive')
          .setScale(2.0); // Maintain scale when changing texture

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
    } else if (block.texture.key === 'coin-block-deactive') {
      // No action for already hit blocks
    } else {
      // Normal block: break it
      breakBlock.call(this, block);
    }
  }
}

function breakBlock(this: Phaser.Scene, block: { x: any; y: any; destroy: () => void; }) {
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

function spawnPowerUp(this: Phaser.Scene, x: number, y: number) {
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

function spawnCoin(this: Phaser.Scene, x: number, y: number) {
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

function collectPowerUp(this: Phaser.Scene, playerSprite: any, powerUp: { destroy: () => void; }) {
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

function reachFinishingPole(this: Phaser.Scene, playerSprite: any, flag: any) {
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
    y: this.scale.height - blockSize * 3, // Adjusted for double-height ground
    duration: 1000,
    ease: 'Linear',
  });

  // Animate Mario sliding down the pole
  this.tweens.add({
    targets: playerSprite,
    y: this.scale.height - blockSize * 3, // Adjusted for double-height ground
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
          this.input.keyboard?.once('keydown-SPACE', () => {
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
