// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/

// Opciones del juego
const gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [100, 350],
    platformSizeRange: [50, 250],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 2
};

export default class HelloWorldScene extends Phaser.Scene {
    constructor() {
        super("hello-world");
    }

    preload() {
        this.load.image("platform", "./public/assets/platform.png");
        this.load.image("player", "./public/assets/Ninja.png");
    }

    create() {
        const config = this.sys.game.config;

        // Grupos de plataformas
        this.platformGroup = this.add.group({
            removeCallback: function(platform){
                platform.scene.platformPool.add(platform)
            }
        });

        this.platformPool = this.add.group({
            removeCallback: function(platform){
                platform.scene.platformGroup.add(platform)
            }
        });

        this.playerJumps = 0;

        // Plataforma inicial
        this.addPlatform(config.width, config.width / 2);

        // Jugador
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, config.height / 2, "player");
        this.player.setGravityY(gameOptions.playerGravity);
        this.player.setScale(0.25); // Escala más pequeña

        this.physics.add.collider(this.player, this.platformGroup);

        this.input.on("pointerdown", this.jump, this);
    }

    addPlatform(platformWidth, posX){
        const config = this.sys.game.config;
        let platform;
        if(this.platformPool.getLength()){
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
        }
        else{
            platform = this.physics.add.sprite(posX, config.height * 0.8, "platform");
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }

    jump(){
        if(this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)){
            if(this.player.body.touching.down){
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps ++;
        }
    }

    update(){
        const config = this.sys.game.config;
        if(this.player.y > config.height){
            this.scene.restart();
        }
        this.player.x = gameOptions.playerStartPosition;

        let minDistance = config.width;
        this.platformGroup.getChildren().forEach(function(platform){
            let platformDistance = config.width - platform.x - platform.displayWidth / 2;
            minDistance = Math.min(minDistance, platformDistance);
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        if(minDistance > this.nextPlatformDistance){
            var nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            this.addPlatform(nextPlatformWidth, config.width + nextPlatformWidth / 2);
        }
    }
}

function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}