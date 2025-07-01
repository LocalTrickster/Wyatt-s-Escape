export default class ControlsScene extends Phaser.Scene {
    constructor() {
        super("controls");
    }

    preload() {
        this.load.image('drone', 'public/assets/drone.png');
    }

    create() {
        const { width, height } = this.sys.game.config;

        this.add.text(width / 2, 80, "CONTROLS & MECHANICS", {
            fontFamily: 'PublicPixel',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 160, "W / UP ARROW / SPACE: JUMP", {
            fontFamily: 'PublicPixel',
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(width / 2, 200, "Press again in air for double jump", {
            fontFamily: 'PublicPixel',
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0.5);

        
        const droneY = 300;
        this.add.image(width / 2 - 380, droneY, 'drone').setScale(1.2);
        this.add.text(width / 2, droneY, "Collect drones for a triple jump!", {
            fontFamily: 'PublicPixel',
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0.5, 0.5);

       
        this.add.text(width / 2, 420, "HIDING: When 'HIDE' appears, press S / DOWN ARROW in time!", {
            fontFamily: 'PublicPixel',
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height - 80, "Press ESC or ENTER to return", {
            fontFamily: 'PublicPixel',
            fontSize: '20px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-ESC', () => this.scene.start('hello-world'));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('hello-world'));
    }
}