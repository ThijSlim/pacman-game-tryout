import Phaser from "phaser";

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

  // Create Pacman instance
  this.pacman = new Pacman(this, 400, 300);

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

  wallData.forEach((wall) => {
    // Create a Graphics object for the wall
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x0000ff, 1); // Blue color
    wallGraphics.fillRect(0, 0, wall.width, wall.height);

    // Set the position of the wall
    wallGraphics.setPosition(wall.x, wall.y);

    // Enable physics on the wallGraphics
    this.physics.add.existing(wallGraphics, true);

    // Adjust the body size and offset to match the graphics
    wallGraphics.body.setSize(wall.width, wall.height);
    wallGraphics.body.setOffset(0, 0);

    // Add wallGraphics to the walls group
    this.walls.add(wallGraphics);
  });

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
  }

  this.lives = 3;
  this.livesText = this.add.text(16, 40, "Lives: 3", {
    fontSize: "24px",
    fill: "#fff",
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
    this.x = x;
    this.y = y;
    this.size = 16; // Radius of Pacman
    this.direction = "right";
    this.speed = 160;
    this.angleValue = 0; // Used for mouth animation

    // Add to the scene
    this.scene.add.existing(this);

    // Enable physics
    this.scene.physics.world.enable(this);

    // Set the body properties
    this.body.setCircle(this.size);
    this.body.setCollideWorldBounds(true);

    // Initial drawing
    this.drawPacman();
  }

  drawPacman() {
    this.clear();
    this.fillStyle(0xffff00, 1); // Yellow color

    // Calculate mouth angle for animation
    const openAngle = 0.2 + 0.1 * Math.sin(this.scene.time.now / 100);

    // Draw Pacman as a sector (arc)
    this.beginPath();
    this.moveTo(this.size, this.size);
    this.arc(
      this.size,
      this.size,
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

  update(cursors) {
    this.body.setVelocity(0);

    if (cursors.left.isDown) {
      this.body.setVelocityX(-this.speed);
      this.direction = "left";
    } else if (cursors.right.isDown) {
      this.body.setVelocityX(this.speed);
      this.direction = "right";
    } else if (cursors.up.isDown) {
      this.body.setVelocityY(-this.speed);
      this.direction = "up";
    } else if (cursors.down.isDown) {
      this.body.setVelocityY(this.speed);
      this.direction = "down";
    }

    // Redraw Pacman to update mouth animation and rotation
    this.drawPacman();

    // Update position to match physics body
    this.x = this.body.x;
    this.y = this.body.y;
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

    // Update position to match physics body
    this.x = this.body.x;
    this.y = this.body.y;
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
