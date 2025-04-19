import Phaser from "phaser";

export class GreenTurtle {
  scene: Phaser.Scene;
  sprite: any;
  speed: number;
  direction: number;
  state: string;

  private createAnimations() {
    // Walking animation
    this.scene.anims.create({
      key: 'greenTurtleWalking',
      frames: [
        { key: 'greenTurtle' },
        { key: 'greenTurtleWalking' } // Using same frame twice until we implement walking animation properly
      ],
      frameRate: 8,
      repeat: -1
    });
  }

  constructor(scene: Phaser.Scene, x: number, y: number, direction: number = -1) {
    this.scene = scene;
    this.speed = 30;
    this.direction = direction;
    this.state = 'normal';

    // Create animations
    this.createAnimations();


    // Create sprite
    this.sprite = this.scene.physics.add.sprite(x, y, 'green-turtle-default');
    this.sprite.setScale(2.0);

    this.sprite.setCollideWorldBounds(true);
    this.sprite.setVelocityX(this.speed * this.direction);
    this.sprite.anims.play('greenTurtleWalking');
    
    // Set the correct flip state based on direction
    // If direction is -1 (left), flip the sprite; if 1 (right), don't flip
    this.sprite.setFlipX(this.direction === -1);

    this.sprite?.body.setSize(16, 23);

    // Associate a back-reference so collision callbacks can access this class
    this.sprite.greenTurtle = this;
  }

  update() {
    if (!this.sprite.body?.blocked) {
      return;
    }

    // If the turtle is in shell state, it shouldn't move on its own
    if (this.state === 'shell' || this.state === 'destroyed') {
      this.transformIntoShell();
      return;
    }

    // Basic left-right movement logic
    if (this.sprite.body.blocked.left || this.sprite.body.touching.left) {
      this.direction = 1;
      this.sprite.setVelocityX(this.speed * this.direction);
      // Flip sprite to face right
      this.sprite.setFlipX(false);
    } else if (this.sprite.body.blocked.right || this.sprite.body.touching.right) {
      this.direction = -1;
      this.sprite.setVelocityX(this.speed * this.direction);
      // Flip sprite to face left
      this.sprite.setFlipX(true);
    }
  }

  handlePlayerCollision(playerSprite: Phaser.Physics.Arcade.Sprite, playerObj: any, onStompedCallback: Function, onGameOverCallback: Function) {
    if (!playerSprite.body || !this.sprite.body) return;

    // If Mario is invincible (star active), destroy turtle instantly from any direction
    if (playerObj.isInvincible) {
      this.state = 'destroyed';
      this.sprite.setCollideWorldBounds(false);
      this.sprite.setVelocityY(300);
      this.sprite.setAngularVelocity(300);
      this.sprite.setBounce(0.5);
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          this.sprite.destroy();
        }
      });
      if (onStompedCallback) onStompedCallback();
      return;
    }

    // If the turtle is normal
    if (this.state === 'normal') {
      // If player hits Turtle from above
      if (playerSprite.body.touching.down && this.sprite.body.touching.up) {
        // Turtle transforms into a shell
        this.transformIntoShell();
        playerSprite.setVelocityY(-300);
        if (onStompedCallback) onStompedCallback();
      } else {
        // Player hit Turtle from side or bottom - game over
        if (onGameOverCallback) onGameOverCallback();
      }
    } else if (this.state === 'shell') {
      // If player hits shell from above - destroy the shell
      if (playerSprite.body.touching.down && this.sprite.body.touching.up) {
        playerSprite.setVelocityY(-300);
        this.destroyShell();
        if (onStompedCallback) onStompedCallback();
      } else {
        // Player hit shell from side - game over
        if (onGameOverCallback) onGameOverCallback();
      }
    }
  }

  transformIntoShell() {
    this.state = 'shell';
    this.sprite.setTexture('greenShell');
    this.sprite.setVelocityX(0);
    // Update the collision box size to match the shell (16x14)
    this.sprite.body?.setSize(16, 14);
    // No timer to revert back to normal - it stays as a shell
  }

  destroyShell() {
    // Change state to destroyed
    this.state = 'destroyed';

    // Make shell fall off the map
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setVelocityY(300); // Fall down
    
    // Add rotation to make it spin while falling
    this.sprite.setAngularVelocity(300); // Rotate clockwise
    
    // Add a slight bounce effect
    this.sprite.setBounce(0.5);
    
    // Add a small random horizontal velocity for more natural movement
    const randomDirection = Math.random() > 0.5 ? 1 : -1;
    this.sprite.setVelocityX(Math.random() * 100 * randomDirection);
    
    // Add a fade-out effect as it falls
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        this.sprite.destroy();
      }
    });
  }
}
