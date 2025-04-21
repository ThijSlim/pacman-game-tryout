import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound>;
  private backgroundMusic: Phaser.Sound.BaseSound | null;
  private isMuted: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sounds = new Map();
    this.backgroundMusic = null;
    this.isMuted = false;

    // Create a mute button in the top-right corner
    this.createMuteButton();
  }

  preloadSounds() {
    // Load all sound files
    this.scene.load.audio('background-music', 'sound/mario-background-repeating.mp3');
    this.scene.load.audio('jump', 'sound/jump-small.mp3');
    this.scene.load.audio('coin', 'sound/coin.mp3');
    this.scene.load.audio('break-block', 'sound/breakblock.mp3');
    this.scene.load.audio('stomp', 'sound/stomp.mp3');
    this.scene.load.audio('powerup-appears', 'sound/powerup-appears.mp3');
    this.scene.load.audio('powerup-collect', 'sound/powerup.mp3');
    this.scene.load.audio('level-clear', 'sound/level-clear.mp3');
    this.scene.load.audio('game-over', 'sound/gameover-1.mp3');
    this.scene.load.audio('starman', 'sound/starman-repeating.mp3');
  }

  initSounds() {
    // Create and store sounds with appropriate settings
    this.sounds.set('jump', this.scene.sound.add('jump', { volume: 0.5 }));
    this.sounds.set('coin', this.scene.sound.add('coin', { volume: 0.5 }));
    this.sounds.set('break-block', this.scene.sound.add('break-block', { volume: 0.6 }));
    this.sounds.set('stomp', this.scene.sound.add('stomp', { volume: 0.5 }));
    this.sounds.set('powerup-appears', this.scene.sound.add('powerup-appears', { volume: 0.5 }));
    this.sounds.set('powerup-collect', this.scene.sound.add('powerup-collect', { volume: 0.6 }));
    this.sounds.set('level-clear', this.scene.sound.add('level-clear', { volume: 0.7 }));
    this.sounds.set('game-over', this.scene.sound.add('game-over', { volume: 0.7 }));
    this.sounds.set('starman', this.scene.sound.add('starman', { volume: 0.5, loop: true }));
    
    // Initialize background music with looping
    this.backgroundMusic = this.scene.sound.add('background-music', {
      volume: 0.4,
      loop: true
    });
  }

  playBackgroundMusic() {
    if (this.backgroundMusic && !this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play();
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
      this.backgroundMusic.stop();
    }
  }

  playStarmanMusic() {
    // First stop the regular background music
    this.stopBackgroundMusic();
    
    // Play the starman music
    this.play('starman');
  }

  stopStarmanMusic() {
    // Stop starman music
    this.stop('starman');
    
    // Resume regular background music
    this.playBackgroundMusic();
  }

  play(key: string) {
    const sound = this.sounds.get(key);
    if (sound && !this.isMuted && !sound.isPlaying) {
      sound.play();
    }
    return sound;
  }

  stop(key: string) {
    const sound = this.sounds.get(key);
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      // Mute all sounds
      this.scene.sound.setMute(true);
    } else {
      // Unmute all sounds
      this.scene.sound.setMute(false);
    }
    
    return this.isMuted;
  }

  private createMuteButton() {
    // Create a simple text button for muting
    const muteButton = this.scene.add.text(
      this.scene.scale.width - 60, 
      20, 
      '🔊', 
      { 
        fontSize: '24px', 
        backgroundColor: '#ffffff80',
        padding: { left: 10, right: 10, top: 5, bottom: 5 }
      }
    );
    
    muteButton.setInteractive();
    muteButton.setScrollFactor(0); // Make it stick to the camera
    
    muteButton.on('pointerdown', () => {
      const isMuted = this.toggleMute();
      muteButton.setText(isMuted ? '🔇' : '🔊');
    });
  }
}
