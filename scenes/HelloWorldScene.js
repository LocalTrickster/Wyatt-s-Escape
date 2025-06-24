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
        this.load.image("obstacle", "./public/assets/diamond.png")
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

        this.obstacleGroup = this.add.group({
            removeCallback: function(obstacle){
                obstacle.scene.obstaclePool.add(obstacle)
            }
        });
        this.obstaclePool = this.add.group({
            removeCallback: function(obstacle){
                obstacle.scene.obstacleGroup.add(obstacle)
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

        this.physics.add.collider(this.player, this.obstacleGroup, () => {
            this.scene.restart();
        }, null, this);

        this.input.on("pointerdown", this.jump, this);

        // NUEVO: Controles de teclado
        this.cursors = this.input.keyboard.createCursorKeys();
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

        // Probabilidad de generar un obstáculo en la plataforma
        if (Phaser.Math.Between(0, 1)) {
            this.addObstacle(
                posX, 
                platform.y, 
                platformWidth
            );
        }
    }

    addObstacle(posX, platformY, platformWidth){
        let obstacle;
        if(this.obstaclePool.getLength()){
            obstacle = this.obstaclePool.getFirst();
            obstacle.x = posX;
            obstacle.y = platformY - 40; // Ajusta la altura según el sprite
            obstacle.active = true;
            obstacle.visible = true;
            this.obstaclePool.remove(obstacle);
        } else {
            obstacle = this.physics.add.sprite(posX, platformY - 40, "obstacle");
            obstacle.setImmovable(true);
            obstacle.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.obstacleGroup.add(obstacle);
        }
        // Opcional: escala o tamaño del obstáculo
        obstacle.setScale(0.4);
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

        // NUEVO: Control de salto con teclado
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.jump();
        }

        let maxRight = 0;
        this.platformGroup.getChildren().forEach(function(platform){
            let rightEdge = platform.x + platform.displayWidth / 2;
            if (rightEdge > maxRight) {
                maxRight = rightEdge;
            }
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        if(maxRight < config.width){
            var nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            this.addPlatform(nextPlatformWidth, maxRight + nextPlatformWidth / 2);
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