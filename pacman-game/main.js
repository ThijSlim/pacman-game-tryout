import Phaser from "phaser";
import EasyStar from "easystarjs";
import mazeLayout from "./src/mazelayout";

const config = {
  type: Phaser.AUTO,
  width: 800, // Set your desired game width
  height: 600, // Set your desired game height
  physics: {
    default: "arcade",
    arcade: {
      debug: false, // Set to true if you want to see physics boundaries
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.spritesheet("pacman", "/pacman.png", {
    frameWidth: 16, // Adjust based on your sprite sheet
    frameHeight: 16,
  });
  // Load game assets here
}

function create() {
  // Initialize cursors for input
  this.cursors = this.input.keyboard.createCursorKeys();
  this.tileSize = 32; // or whatever size suits your game

  const initialCol = 2; // Adjust based on your maze layout
  const initialRow = 2; // Adjust based on your maze layout
  const x = initialCol * this.tileSize;
  const y = initialRow * this.tileSize;

  this.anims.create({
    key: "move_right",
    frames: this.anims.generateFrameNumbers("pacman", { start: 0, end: 1 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "move_left",
    frames: this.anims.generateFrameNumbers("pacman", { start: 2, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "move_up",
    frames: this.anims.generateFrameNumbers("pacman", { start: 4, end: 5 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "move_down",
    frames: this.anims.generateFrameNumbers("pacman", { start: 6, end: 7 }),
    frameRate: 10,
    repeat: -1,
  });

  this.pacman = new Pacman(this, x, y);

  this.grid = [];

  this.mazeLayout = mazeLayout;

  this.mazeWidth = this.mazeLayout[0].length;
  this.mazeHeight = this.mazeLayout.length;

  const isWall = (x, y) => {
    // Ensure x and y are within the bounds of the maze
    if (x < 0 || x >= this.mazeWidth || y < 0 || y >= this.mazeHeight) {
      return true; // Treat out-of-bounds as walls
    }

    // Return true if the mazeLayout at (x, y) is 1 (wall)
    return this.mazeLayout[y][x] === 1;
  };

  // Create pathfinding grid
  for (let y = 0; y < this.mazeHeight; y++) {
    const row = [];
    for (let x = 0; x < this.mazeWidth; x++) {
      const tile = isWall(x, y) ? 1 : 0;
      row.push(tile);
    }
    this.grid.push(row);
  }

  // Initialize EasyStar
  this.easystar = new EasyStar.js();
  this.easystar.setGrid(this.grid);
  this.easystar.setAcceptableTiles([0]); // 0 represents open path

  // Create a group for walls
  this.walls = this.physics.add.staticGroup();

  // Enable collision between Pacman and walls
  this.physics.add.collider(this.pacman, this.walls);

  // Create a group for dots
  this.dots = this.physics.add.staticGroup();

  // Define dot positions (typically aligned with maze grid)
  const dotPositions = [
    { x: 150, y: 150 },
    { x: 200, y: 150 },
    // ... Add more dot positions
  ];

  dotPositions.forEach((pos) => {
    // Create a Graphics object for the dot
    const dot = this.add.graphics();
    dot.fillStyle(0xffffff, 1); // White color
    dot.fillCircle(0, 0, 4); // Small circle with radius 4

    // Set the position of the dot
    dot.setPosition(pos.x, pos.y);

    // Enable physics on the dot
    this.physics.add.existing(dot, true);

    // Adjust the physics body to match the dot
    dot.body.setCircle(4);
    dot.body.setOffset(-4, -4); // Offset to center the body on the dot

    // Add to dots group
    this.dots.add(dot);
  });

  // Overlap detection between Pacman and dots
  this.physics.add.overlap(this.pacman, this.dots, eatDot, null, this);

  // Create ghosts group
  this.ghosts = this.physics.add.group();

  // Create ghost instances
  const ghost1 = new Ghost(this, 400, 200, 0xff0000); // Red ghost
  this.ghosts.add(ghost1);

  // Enable collision between ghosts and walls
  this.physics.add.collider(this.ghosts, this.walls);

  // Enable collision between Pacman and ghosts
  this.physics.add.overlap(this.pacman, this.ghosts, hitGhost, null, this);

  function hitGhost(pacman, ghost) {
    this.lives -= 1;
    this.livesText.setText("Lives: " + this.lives);

    if (this.lives <= 0) {
      // Game over logic
      this.physics.pause();
      this.add
        .text(400, 300, "GAME OVER", {
          fontSize: "64px",
          fill: "#fff",
        })
        .setOrigin(0.5);
    } else {
      // Reset Pacman's position
      this.pacman.body.setPosition(400, 300);
    }
  }

  this.score = 0;
  this.scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "24px",
    fill: "#fff",
  });

  function eatDot(pacman, dot) {
    dot.destroy();
    this.score += 10;
    this.scoreText.setText("Score: " + this.score);

    // Check if all dots are eaten
    if (this.dots.countActive(true) === 0) {
      // Proceed to next level or restart
      this.scene.restart();
    }
  }

  this.lives = 3;
  this.livesText = this.add.text(16, 40, "Lives: 3", {
    fontSize: "24px",
    fill: "#fff",
  });

  this.mazeLayout.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      const x = colIndex * this.tileSize;
      const y = rowIndex * this.tileSize;

      if (tile === 1) {
        // Create wall at (x, y)
        const wall = this.add.rectangle(
          x + this.tileSize / 2,
          y + this.tileSize / 2,
          this.tileSize,
          this.tileSize,
          0x0000ff
        );
        wall.setOrigin(0.5, 0.5);
        this.physics.add.existing(wall, true);
        this.walls.add(wall);
      } else if (tile === 0) {
        // Create dot at (x, y)
        const dot = this.add.circle(
          x + this.tileSize / 2,
          y + this.tileSize / 2,
          4,
          0xffffff
        );
        this.physics.add.existing(dot, true);
        this.dots.add(dot);
      }
    });
  });
}

function update(time, delta) {
  this.pacman.update(this.cursors);

  // Update ghosts
  this.ghosts.children.iterate(function (ghost) {
    ghost.update();
  });
}
class Pacman extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "pacman");
    this.scene = scene;
    this.direction = "right";
    this.desiredDirection = "right";
    this.speed = this.scene.tileSize * 5;

    // Add Pacman to the scene
    this.scene.add.existing(this);

    this.setScale(1.6);

    // Enable physics on Pacman
    this.scene.physics.world.enable(this);

    // Set initial position and properties
    this.setOrigin(-0.5, -0.5);
    this.body.setCollideWorldBounds(true);

    // Play the initial animation
    this.anims.play("move_right");
  }

  canMove(direction) {
    const tileSize = this.scene.tileSize;
    const mazeLayout = this.scene.mazeLayout;
    const gridX = Math.floor(this.x / tileSize);
    const gridY = Math.floor(this.y / tileSize);
    let targetX = gridX;
    let targetY = gridY;

    switch (direction) {
      case "left":
        targetX -= 1;
        break;
      case "right":
        targetX += 1;
        break;
      case "up":
        targetY -= 1;
        break;
      case "down":
        targetY += 1;
        break;
    }

    if (
      targetX < 0 ||
      targetX >= mazeLayout[0].length ||
      targetY < 0 ||
      targetY >= mazeLayout.length
    ) {
      return false;
    }

    return mazeLayout[targetY][targetX] === 0;
  }

  update(cursors) {
    // Check for input and set desired direction
    if (cursors.left.isDown) {
      this.desiredDirection = "left";
    } else if (cursors.right.isDown) {
      this.desiredDirection = "right";
    } else if (cursors.up.isDown) {
      this.desiredDirection = "up";
    } else if (cursors.down.isDown) {
      this.desiredDirection = "down";
    }

    const tileSize = this.scene.tileSize;
    const halfTileSize = tileSize / 2;

    // Get current position on the grid
    const currentTileX = Math.floor(this.x / tileSize);
    const currentTileY = Math.floor(this.y / tileSize);

    // Calculate distance to the center of the current tile
    const tileCenterX = currentTileX * tileSize + halfTileSize;
    const tileCenterY = currentTileY * tileSize + halfTileSize;
    const distanceToTileCenterX = this.x - tileCenterX;
    const distanceToTileCenterY = this.y - tileCenterY;

    const alignmentTolerance = 5;

    // If desiredDirection is different from current direction
    if (this.desiredDirection !== this.direction) {
      // Check if we can move in desiredDirection
      if (this.canMove(this.desiredDirection)) {
        console.log("Changing direction ", this.desiredDirection);
        // Check alignment based on the axis
        console.log("distanceToTileCenterX", distanceToTileCenterX);
        console.log("distanceToTileCenterY", distanceToTileCenterY);
        if (
          (this.direction === "left" || this.direction === "right") &&
          Math.abs(distanceToTileCenterY) < alignmentTolerance
        ) {
          // Align Y position
          this.y = tileCenterY;
          this.direction = this.desiredDirection;
        } else if (
          (this.direction === "up" || this.direction === "down") &&
          Math.abs(distanceToTileCenterX) < alignmentTolerance
        ) {
          // Align X position
          console.log("Aligning X position");
          this.x = tileCenterX;
          this.direction = this.desiredDirection;
        }
      }
    }

    // Set velocity based on the current direction
    // this.body.setVelocity(0);

    console.log("Current direction", this.direction);

    switch (this.desiredDirection) {
      case "left":
        this.body.setVelocityX(-this.speed);
        this.anims.play("move_left", true);
        break;
      case "right":
        this.body.setVelocityX(this.speed);
        this.anims.play("move_right", true);
        break;
      case "up":
        this.body.setVelocityY(-this.speed);
        this.anims.play("move_up", true);
        break;
      case "down":
        this.body.setVelocityY(this.speed);
        this.anims.play("move_down", true);
        break;
      default:
        this.anims.stop();
        break;
    }
  }
}

class Ghost extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y, color = 0xff0000) {
    super(scene);
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.size = 16;
    this.speed = 100;

    // Add to the scene
    this.scene.add.existing(this);

    // Enable physics
    this.scene.physics.world.enable(this);

    // Set the body properties
    this.body.setCircle(this.size);
    this.body.setCollideWorldBounds(true);

    // Draw the ghost
    this.drawGhost(color);

    this.targetPosition = { x: x, y: y };
  }

  drawGhost(color) {
    this.clear();
    this.fillStyle(color, 1); // Ghost color

    // Draw ghost body
    this.beginPath();
    this.arc(this.size, this.size, this.size, Math.PI, 0, false);
    this.lineTo(this.size * 2, this.size * 2);
    this.lineTo(0, this.size * 2);
    this.closePath();
    this.fill();

    // Draw eyes (simplified)
    this.fillStyle(0xffffff, 1);
    this.fillCircle(this.size - 6, this.size - 4, 4);
    this.fillCircle(this.size + 6, this.size - 4, 4);

    this.fillStyle(0x0000ff, 1);
    this.fillCircle(this.size - 6, this.size - 4, 2);
    this.fillCircle(this.size + 6, this.size - 4, 2);
  }

  update() {
    // Simple random movement
    const directions = ["left", "right", "up", "down"];
    if (!this.moveEvent || this.moveEvent.getProgress() === 1) {
      const direction = Phaser.Utils.Array.GetRandom(directions);
      this.move(direction);
    }

    // Find path to Pacman
    this.findPathToPacman();
  }

  findPathToPacman() {
    const tileSize = this.scene.tileSize;

    const fromX = Math.floor(this.x / tileSize);
    const fromY = Math.floor(this.y / tileSize);
    const toX = Math.floor(this.scene.pacman.x / tileSize);
    const toY = Math.floor(this.scene.pacman.y / tileSize);

    // Check if fromX, fromY, toX, toY are within grid bounds
    const withinBounds =
      fromX >= 0 &&
      fromX < this.scene.mazeWidth &&
      fromY >= 0 &&
      fromY < this.scene.mazeHeight &&
      toX >= 0 &&
      toX < this.scene.mazeWidth &&
      toY >= 0 &&
      toY < this.scene.mazeHeight;

    if (!withinBounds) {
      console.error("Entity positions are outside the grid bounds.");
      return;
    }

    // Proceed with pathfinding
    this.scene.easystar.findPath(fromX, fromY, toX, toY, (path) => {
      if (path && path.length > 1) {
        const nextStep = path[1];
        this.moveTowards(nextStep.x * tileSize, nextStep.y * tileSize);
      } else {
        this.body.setVelocity(0);
      }
    });

    this.scene.easystar.calculate();
  }

  moveTowards(targetX, targetY) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.scene.physics.moveTo(this, targetX, targetY, this.speed);
  }

  move(direction) {
    this.body.setVelocity(0);

    switch (direction) {
      case "left":
        this.body.setVelocityX(-this.speed);
        break;
      case "right":
        this.body.setVelocityX(this.speed);
        break;
      case "up":
        this.body.setVelocityY(-this.speed);
        break;
      case "down":
        this.body.setVelocityY(this.speed);
        break;
    }

    // Change direction every 2 seconds
    this.moveEvent = this.scene.time.addEvent({
      delay: 2000,
      callback: () => {
        this.body.setVelocity(0);
      },
      callbackScope: this,
    });
  }
}
