import HelloWorldScene from "./scenes/HelloWorldScene.js";
import ControlsScene from "./scenes/ControlsScene.js"; // <-- Add this

const config = {
    type: Phaser.AUTO,
    width: 1334,
    height: 750,
    scene: [HelloWorldScene, ControlsScene], // <-- Add ControlsScene here
    backgroundColor: 0x11173B, 
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        }
    }
};

let game;

document.fonts.ready.then(() => {
    game = new Phaser.Game(config);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
});

// Resize function (if you use it)
function resize() {
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = config.width / config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    } else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
