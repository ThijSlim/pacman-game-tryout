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
  // Load game assets here
}

function create() {
  // Initialize cursors for input
  this.cursors = this.input.keyboard.createCursorKeys();
  this.tileSize = 32; // or whatever size suits your game

  const initialCol = 12; // Adjust based on your maze layout
  const initialRow = 9; // Adjust based on your maze layout
  const x = initialCol * this.tileSize;
  const y = initialRow * this.tileSize;
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

  // Example walls (define these based on your maze layout)
  const wallData = [
    { x: 100, y: 100, width: 600, height: 20 },
    { x: 100, y: 500, width: 600, height: 20 },
    { x: 100, y: 100, width: 20, height: 420 },
    { x: 680, y: 100, width: 20, height: 420 },
    // Add more walls as needed
  ];

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

class Pacman extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y) {
    super(scene);
    this.scene = scene;
    this.size = 16; // Radius of Pacman
    this.direction = "right";
    this.speed = 160;

    // Set initial position
    this.x = x;
    this.y = y;

    // Add to the scene
    this.scene.add.existing(this);

    // Enable physics
    this.scene.physics.world.enable(this);

    // Adjust the physics body
    this.body.setCircle(this.size);
    this.body.setCollideWorldBounds(true);

    // Position the physics body to match the graphics
    this.body.setOffset(0, 0);

    // Initial drawing
    this.drawPacman();
  }

  drawPacman() {
    this.clear();
    this.fillStyle(0xffff00, 1); // Yellow color

    // Calculate mouth angle for animation
    const openAngle = 0.2 + 0.1 * Math.sin(this.scene.time.now / 100);

    // Draw Pacman as a sector (arc) centered at (0, 0)
    this.beginPath();
    this.moveTo(0, 0);
    this.arc(
      0,
      0,
      this.size,
      Phaser.Math.DegToRad(360 * openAngle),
      Phaser.Math.DegToRad(360 * (1 - openAngle)),
      false
    );
    this.closePath();
    this.fill();

    // Rotate Pacman based on direction
    let rotation = 0;
    switch (this.direction) {
      case "up":
        rotation = -90;
        break;
      case "down":
        rotation = 90;
        break;
      case "left":
        rotation = 180;
        break;
      case "right":
      default:
        rotation = 0;
        break;
    }
    this.setRotation(Phaser.Math.DegToRad(rotation));
  }

  canMove(direction) {
    const tileSize = this.scene.tileSize;
    const mazeLayout = this.scene.mazeLayout;

    // Use Pacman's center position
    const centerX = this.x + this.size;
    const centerY = this.y + this.size;

    // Calculate the grid position Pacman is currently in
    const gridX = Math.floor(centerX / tileSize);
    const gridY = Math.floor(centerY / tileSize);

    // Determine the grid position Pacman wants to move to
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

    // Check if the target position is within the maze bounds
    if (
      targetX < 0 ||
      targetX >= mazeLayout[0].length ||
      targetY < 0 ||
      targetY >= mazeLayout.length
    ) {
      return false;
    }

    // Return true if the target tile is not a wall (i.e., it's 0)
    return mazeLayout[targetY][targetX] === 0;
  }

  update(cursors) {
    this.body.setVelocity(0);

    let desiredDirection = this.direction;

    if (cursors.left.isDown) {
      desiredDirection = "left";
    } else if (cursors.right.isDown) {
      desiredDirection = "right";
    } else if (cursors.up.isDown) {
      desiredDirection = "up";
    } else if (cursors.down.isDown) {
      desiredDirection = "down";
    }

    // Check if Pacman is aligned with the grid
    const tileSize = this.scene.tileSize;
    const centerX = this.x + this.size;
    const centerY = this.y + this.size;
    const isAlignedWithGrid =
      Math.abs(centerX % tileSize - tileSize / 2) < 2 &&
      Math.abs(centerY % tileSize - tileSize / 2) < 2;

    if (isAlignedWithGrid) {
      // Check if Pacman can move in the desired direction
      if (this.canMove(desiredDirection)) {
        this.direction = desiredDirection;
      } else if (!this.canMove(this.direction)) {
        // Stop moving if can't continue in the current direction
        this.direction = null;
      }
    }

    // Move in the current direction if possible
    switch (this.direction) {
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

    // Redraw Pacman to update mouth animation and rotation
    this.drawPacman();
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
