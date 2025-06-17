import HelloWorldScene from "./scenes/HelloWorldScene.js";

// global game options
let gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [100, 350],
    platformSizeRange: [50, 250],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 2
};

let game;

// playGame scene
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
}

// Create a new Phaser config object
const config = {
    type: Phaser.AUTO,
    width: 1334,
    height: 750,
    scene: [HelloWorldScene],
    backgroundColor: 0x444444,

    // physics settings
    physics: {
        default: "arcade",
        arcade: {
          debug: true,
          
        }
    }
};

// Create a new Phaser game instance
window.onload = function() {
    game = new Phaser.Game(config);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
};
