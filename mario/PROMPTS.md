```
Create a completely new character class. This is a green turtle. It moves slightly to the left and right and occasionally jumps. It has a special ability to throw a hammer to the left and right every few seconds. The hammer can hit Mario and he is game-over. When Mario jumps on the turtle it transform into a shell. when Mario hits the shell on the left of right side he is game-over.
```

Solution:

```ts
class GreenTurtle {
  constructor(scene, x, y, direction = -1) {
    this.scene = scene;
    this.speed = 30;
    this.direction = direction;
    this.jumpTimer = 0;
    this.hammerTimer = 0;
    this.hammerInterval = 3000; // throw hammer every 3 seconds (tweak to taste)
    this.jumpInterval = 2000;   // jump every 2 seconds (randomized inside code)
    this.state = 'normal';      // 'normal' or 'shell'

    // Create textures if they don't exist
    this.createTextures();

    // Create sprite
    this.sprite = this.scene.physics.add.sprite(x, y, 'greenTurtle');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setVelocityX(this.speed * this.direction);
    // Associate a back-reference so collision callbacks can access this class
    this.sprite.greenTurtle = this;

    // A group for hammers this turtle throws
    this.hammers = this.scene.physics.add.group();
  }

  createTextures() {
    // Turtle in normal state
    if (!this.scene.textures.exists('greenTurtle')) {
      const turtleGraphics = this.scene.add.graphics();
      turtleGraphics.fillStyle(0x008000, 1); // Green
      turtleGraphics.fillCircle(16, 16, 16);
      turtleGraphics.fillStyle(0x000000, 1); // Eye or detail if desired
      turtleGraphics.fillRect(10, 10, 4, 4);
      turtleGraphics.generateTexture('greenTurtle', 32, 32);
      turtleGraphics.destroy();
    }

    // Turtle shell
    if (!this.scene.textures.exists('greenShell')) {
      const shellGraphics = this.scene.add.graphics();
      shellGraphics.fillStyle(0x008000, 1); // Green
      shellGraphics.fillCircle(16, 16, 16);
      shellGraphics.fillStyle(0xffffff, 1);
      shellGraphics.fillRect(8, 14, 16, 4);
      shellGraphics.generateTexture('greenShell', 32, 32);
      shellGraphics.destroy();
    }

    // Hammer
    if (!this.scene.textures.exists('hammer')) {
      const hammerGraphics = this.scene.add.graphics();
      hammerGraphics.fillStyle(0x333333, 1); // Dark gray
      // Head of hammer
      hammerGraphics.fillRect(0, 0, 12, 6);
      // Handle
      hammerGraphics.fillStyle(0x654321, 1); 
      hammerGraphics.fillRect(4, 6, 4, 10);
      hammerGraphics.generateTexture('hammer', 12, 16);
      hammerGraphics.destroy();
    }
  }

  update(time, delta) {
    // If the turtle is in shell state, it shouldn't move on its own
    if (this.state === 'shell') {
      this.sprite.setVelocityX(0);
      return;
    }

    // Basic left-right logic
    if (this.sprite.body.blocked.left || this.sprite.body.touching.left) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed * this.direction);
    } else if (this.sprite.body.blocked.right || this.sprite.body.touching.right) {
      this.direction = -1;
      this.sprite.setVelocityX(this.speed * this.direction);
    }

    // Jump logic
    this.jumpTimer += delta;
    if (this.jumpTimer > this.jumpInterval) {
      this.jumpTimer = 0;
      // Attempt a jump if on ground
      if (this.sprite.body.blocked.down) {
        this.sprite.setVelocityY(-200);
      }
      // Optionally randomize next jump interval
      this.jumpInterval = Phaser.Math.Between(2000, 4000);
    }

    // Hammer throwing logic
    this.hammerTimer += delta;
    if (this.hammerTimer > this.hammerInterval) {
      this.hammerTimer = 0;
      this.throwHammer();
    }
  }

  throwHammer() {
    // Create a hammer sprite
    const hammer = this.hammers.create(this.sprite.x, this.sprite.y - 10, 'hammer');
    // Hammer should have a slight arc or just horizontal velocity
    let hammerSpeed = 100;
    hammer.body.allowGravity = true; 
    hammer.setBounce(0.2);

    // Throw in same direction as turtle is facing
    hammer.setVelocityX(this.direction * hammerSpeed);
    // Give it a bit of upward velocity for an arc
    hammer.setVelocityY(-50);

    // Destroy the hammer after some time to avoid clutter
    this.scene.time.addEvent({
      delay: 4000,
      callback: () => {
        if (hammer.active) {
          hammer.destroy();
        }
      },
    });
  }

  handlePlayerCollision(playerSprite, playerObj, onGameOverCallback) {
    // If the turtle is normal
    if (this.state === 'normal') {
      // Check if Mario stomped from above
      if (
        playerSprite.body.touching.down &&
        this.sprite.body.touching.up
      ) {
        // Transform turtle into shell
        this.transformIntoShell();
        // Mario bounces
        playerSprite.setVelocityY(-300);
      } else {
        // Otherwise, it's game over for Mario
        if (onGameOverCallback) onGameOverCallback();
      }
    } else {
      // If the turtle is already a shell
      // If Mario hits from above again => maybe do nothing, or could "kick" the shell
      if (
        playerSprite.body.touching.down &&
        this.sprite.body.touching.up
      ) {
        // Optional: bounce Mario up slightly
        playerSprite.setVelocityY(-300);
      } else {
        // Collisions from side => game-over
        if (onGameOverCallback) onGameOverCallback();
      }
    }
  }

  transformIntoShell() {
    this.state = 'shell';
    this.sprite.setTexture('greenShell');
  }

  handleHammerCollision(playerSprite, playerObj, hammer, onGameOverCallback) {
    // If hammer overlaps Mario => game over
    if (onGameOverCallback) onGameOverCallback();
  }
}
```

```ts

function create() {
  // ... Your existing setup code ...

  // Create a green turtle
  this.turtle = new GreenTurtle(this, 600, 450, -1);

  // Make turtle collide with platforms
  this.physics.add.collider(this.turtle.sprite, level.platforms.group);

  // Handle turtle <-> player collision
  this.physics.add.collider(player.sprite, this.turtle.sprite, (playerSprite, turtleSprite) => {
    // Access our class instance
    const turtle = turtleSprite.greenTurtle;
    turtle.handlePlayerCollision(playerSprite, player, endGame.bind(this));
  });

  // Handle hammer <-> player collision
  this.physics.add.overlap(
    player.sprite,
    this.turtle.hammers,
    (playerSprite, hammer) => {
      const turtle = hammer.parentContainer || hammer.getData('owner'); 
      // Or just handle here directly:
      this.turtle.handleHammerCollision(playerSprite, player, hammer, endGame.bind(this));
    },
    null,
    this
  );
}
```

```ts
function update(time, delta) {
  if (gameOver) return;

  player.update(cursors);
  level.goombas.forEach((goomba) => goomba.update());
  
  // Update turtle
  if (this.turtle) {
    this.turtle.update(time, delta);
  }

  // Check if Mario fell off bottom
  if (player.sprite.y > this.scale.height) {
    endGame.call(this);
  }
}
```