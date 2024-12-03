const config = {
  type: Phaser.AUTO,
  width: 800, // Canvas width remains the same
  height: 600,
  scene: {
    preload,
    create,
    update,
  },
};

const game = new Phaser.Game(config);

function preload() {
}

function create() {
}

function update() {
}
