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
        this.load.image("obstacle", "./public/assets/diamond.png");
        this.load.image("bigObstacle", "./public/assets/square.png");
    }

    create() {
        const config = this.sys.game.config;

        // Jugador
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, config.height / 2, "player");
        this.player.setGravityY(gameOptions.playerGravity);
        this.player.setScale(0.25);

        // Create platforms group
        this.platforms = this.physics.add.group();

        const platformY = config.height * 0.7; // Platforms are now higher
        const platformWidth = config.width * 1.5;

        // First platform
        let platform1 = this.platforms.create(0, platformY, "platform");
        platform1.setOrigin(0, 0.1);
        platform1.displayWidth = platformWidth;
        platform1.displayHeight = 450; // Make platform thick (adjust value as needed)
        platform1.setImmovable(true);
        platform1.body.allowGravity = false;

        // Second platform
        let platform2 = this.platforms.create(platformWidth, platformY, "platform");
        platform2.setOrigin(0, 0.1);
        platform2.displayWidth = platformWidth;
        platform2.displayHeight = 450;
        platform2.setImmovable(true);
        platform2.body.allowGravity = false;

        // Add collider AFTER creating platforms
        this.physics.add.collider(this.player, this.platforms);

        // Obstacles group
        this.obstacleGroup = this.add.group();
        this.obstaclePool = this.add.group();

        this.playerJumps = 0;
        this.isJumping = false;
        this.jumpTimer = 0;
        this.maxJumpTime = 350;

        this.lastObstacleX = 0;
        this.lastObstacleSpawnX = 0;
        this.minObstacleSpacing = 120; // Adjust as needed
        this.obstacleDistance = 0;

        this.input.on("pointerdown", this.jump, this);
        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.collider(this.player, this.obstacleGroup, () => {
            this.scene.restart();
        }, null, this);
    }

    // Removed obstacle spawning from addPlatform!
    addPlatform(platformWidth, posX){
        const config = this.sys.game.config;
        let platform;
        if(this.platformPool && this.platformPool.getLength()){
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
            if (this.platformGroup) {
                this.platformGroup.add(platform);
            }
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
        // No obstacle spawning here!
    }

    addObstacle(posX, platformY, platformWidth){
        let obstacle = null;
        // Find an inactive obstacle in the pool
        this.obstaclePool.getChildren().forEach(obj => {
            if (!obstacle && !obj.active) obstacle = obj;
        });
        if(obstacle){
            this.obstaclePool.remove(obstacle);
            this.obstacleGroup.remove(obstacle);
            obstacle.x = posX;
            obstacle.y = platformY;
            obstacle.setTexture("obstacle");
            obstacle.setScale(0.4);
            obstacle.setActive(true);
            obstacle.setVisible(true);
        } else {
            obstacle = this.physics.add.sprite(posX, platformY, "obstacle");
            obstacle.setImmovable(true);
            obstacle.setScale(0.4);
        }
        this.obstacleGroup.add(obstacle);
    }

    addBigObstacle(posX, platformY) {
        let obstacle = null;
        // Find an inactive obstacle in the pool
        this.obstaclePool.getChildren().forEach(obj => {
            if (!obstacle && !obj.active) obstacle = obj;
        });
        if(obstacle){
            this.obstaclePool.remove(obstacle);
            this.obstacleGroup.remove(obstacle);
            obstacle.x = posX;
            obstacle.y = platformY;
            obstacle.setTexture("bigObstacle");
            obstacle.setScale(0.7);
            obstacle.setActive(true);
            obstacle.setVisible(true);
        } else {
            obstacle = this.physics.add.sprite(posX, platformY, "bigObstacle");
            obstacle.setImmovable(true);
            obstacle.setScale(0.7);
        }
        this.obstacleGroup.add(obstacle);
    }

    jump(){
        if(this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)){
            if(this.player.body.touching.down){
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps ++;
            this.isJumping = true;
            this.jumpTimer = 0;
        }
    }

    update() {
        const config = this.sys.game.config;
        if (this.player.y > config.height) {
            this.scene.restart();
        }
        this.player.x = gameOptions.playerStartPosition;

        // Jump logic (unchanged)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.jump();
        }
        const jumpKeyDown = this.cursors.up.isDown || this.cursors.space.isDown;
        if (
            this.isJumping &&
            jumpKeyDown &&
            this.jumpTimer < this.maxJumpTime &&
            this.player.body.velocity.y < 0
        ) {
            this.player.setVelocityY(this.player.body.velocity.y - 15);
            this.jumpTimer += this.game.loop.delta;
        } else {
            if (!jumpKeyDown || this.jumpTimer >= this.maxJumpTime || this.player.body.velocity.y >= 0) {
                this.isJumping = false;
            }
        }
        if (this.player.body.touching.down) {
            this.isJumping = false;
            this.jumpTimer = 0;
        }

        // Move and loop the platforms
        const speed = gameOptions.platformStartSpeed * this.game.loop.delta / 1000;
        this.platforms.children.iterate(platform => {
            platform.x -= speed;
            if (platform.x + platform.displayWidth < 0) {
                let rightmost = 0;
                this.platforms.children.iterate(p => {
                    if (p.x > rightmost) rightmost = p.x;
                });
                platform.x = rightmost + platform.displayWidth;
            }
        });

        // Move obstacles left and remove off-screen ones
        let toRemove = [];
        this.obstacleGroup.children.iterate(obstacle => {
            obstacle.x -= speed;
            if (obstacle.x + obstacle.displayWidth < 0) {
                obstacle.setActive(false);
                obstacle.setVisible(false);
                this.obstaclePool.add(obstacle);
                toRemove.push(obstacle);
            }
        });
        toRemove.forEach(obstacle => {
            this.obstacleGroup.remove(obstacle);
        });

        // Obstacle spawning logic (random small or big)
        this.obstacleDistance += speed;
        if (
            this.obstacleDistance > 150 && // 150 pixels since last spawn
            Phaser.Math.Between(0, 100) < 4 // Chance
        ) {
            // Only spawn if there are no active obstacles
            let anyActiveObstacle = false;
            this.obstacleGroup.getChildren().forEach(obj => {
                if (obj.active) anyActiveObstacle = true;
            });
            if (!anyActiveObstacle) {
                // Find the rightmost platform
                let rightmostPlatform = null;
                let rightmostX = -Infinity;
                this.platforms.children.iterate(platform => {
                    if (platform.x > rightmostX) {
                        rightmostX = platform.x;
                        rightmostPlatform = platform;
                    }
                });
                if (rightmostPlatform) {
                    const spawnX = rightmostPlatform.x + rightmostPlatform.displayWidth / 2;
                    if (Phaser.Math.Between(0, 1) === 0) {
                        const spawnY = rightmostPlatform.y - 60; // Small obstacle
                        this.addObstacle(spawnX, spawnY, rightmostPlatform.displayWidth);
                    } else {
                        const spawnY = rightmostPlatform.y - 100; // Higher for big obstacle
                        this.addBigObstacle(spawnX, spawnY);
                    }
                    this.lastObstacleSpawnX = spawnX;
                    this.obstacleDistance = 0;
                }
            }
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