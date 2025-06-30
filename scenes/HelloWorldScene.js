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
        this.load.image("drone", "./public/assets/triangle.png");
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
        this.droneGroup = this.physics.add.group(); // <-- add this line

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

        this.physics.add.overlap(this.player, this.droneGroup, this.collectDrone, null, this);
        this.canTripleJump = false;

        // Flash overlay for damage indication
        this.flashOverlay = this.add.rectangle(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            this.sys.game.config.width,
            this.sys.game.config.height,
            0xffffff,
            0 // Start transparent
        );
        this.flashOverlay.setDepth(1000); // On top of everything
        this.isFlashing = false;
        this.flashTimer = 0;
        this.flashColor = 0xffffff;
        this.mustHide = false;

        this.lastFlashSwitch = 0;
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

    addBiggestObstacle(posX, platformY) {
        let obstacle = null;
        this.obstaclePool.getChildren().forEach(obj => {
            if (!obstacle && !obj.active) obstacle = obj;
        });
        if(obstacle){
            this.obstaclePool.remove(obstacle);
            this.obstacleGroup.remove(obstacle);
            obstacle.x = posX;
            obstacle.y = platformY;
            obstacle.setTexture("bigObstacle");
            obstacle.setActive(true);
            obstacle.setVisible(true);
            // Make it even longer and rectangular
            obstacle.displayWidth = 320; // Much longer
            obstacle.displayHeight = 60;
        } else {
            obstacle = this.physics.add.sprite(posX, platformY, "bigObstacle");
            obstacle.setImmovable(true);
            obstacle.displayWidth = 320; // Much longer
            obstacle.displayHeight = 60;
        }
        this.obstacleGroup.add(obstacle);

        // Only spawn a drone if there isn't one at this X
        let droneExists = false;
        this.droneGroup.getChildren().forEach(drone => {
            if (drone.active && Math.abs(drone.x - posX) < 5) droneExists = true;
        });
        if (!droneExists) {
            this.addDrone(posX, platformY - 100);
        }
    }

    addDrone(posX, posY) {
        // Always use the existing group
        let drone = this.droneGroup.create(posX, posY, "drone");
        drone.setImmovable(true);
        drone.setScale(0.5);
        drone.body.allowGravity = false;
        drone.collected = false;
    }

    collectDrone(player, drone) {
        if (!drone.collected) {
            drone.collected = true;
            drone.setVisible(false);
            drone.setActive(false);
            this.canTripleJump = true;
        }
    }

    jump(){
        let maxJumps = gameOptions.jumps;
        if (this.canTripleJump) maxJumps = 3;
        if(this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < maxJumps)){
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

        // Move drones left and remove off-screen ones
        let dronesToRemove = [];
        this.droneGroup.children.iterate(drone => {
            drone.x -= speed;
            if (drone.x + drone.displayWidth < 0) {
                drone.setActive(false);
                drone.setVisible(false);
                dronesToRemove.push(drone);
            }
        });
        dronesToRemove.forEach(drone => {
            this.droneGroup.remove(drone, true, true);
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
                    const rand = Phaser.Math.Between(0, 9);
                    if (rand < 4) {
                        const spawnY = rightmostPlatform.y - 60;
                        this.addObstacle(spawnX, spawnY, rightmostPlatform.displayWidth);
                    } else if (rand < 8) {
                        const spawnY = rightmostPlatform.y - 100;
                        this.addBigObstacle(spawnX, spawnY);
                    } else {
                        const spawnY = rightmostPlatform.y - 120;
                        this.addBiggestObstacle(spawnX, spawnY);
                    }
                    this.lastObstacleSpawnX = spawnX;
                    this.obstacleDistance = 0;
                }
            }
        }

        // Check for no obstacles or player in air
        let noObstacles = true;
        this.obstacleGroup.getChildren().forEach(obj => {
            if (obj.active) noObstacles = false;
        });
        let playerInAir = !this.player.body.touching.down;

        // Randomly trigger flash if not already flashing
        if ((noObstacles || playerInAir) && !this.isFlashing && Phaser.Math.Between(0, 1000) < 2) {
            this.isFlashing = true;
            this.flashTimer = 0;
            this.flashColor = 0xffffff;
            this.mustHide = true;
        }

        if (this.isFlashing) {
            this.flashTimer += this.game.loop.delta;

            // Only switch color every 200ms (adjust as needed)
            if (this.flashTimer - this.lastFlashSwitch > 200) {
                this.flashColor = (this.flashColor === 0xffffff) ? 0x000000 : 0xffffff;
                this.flashOverlay.fillColor = this.flashColor;
                this.lastFlashSwitch = this.flashTimer;
            }
            this.flashOverlay.fillAlpha = 0.7;

            // Flash for 2 seconds (2000 ms)
            if (this.flashTimer > 2000) {
                this.isFlashing = false;
                this.flashOverlay.fillAlpha = 0;
                if (this.mustHide) {
                    this.scene.restart();
                }
            }
            if (this.cursors.down.isDown) {
                this.mustHide = false;
                this.flashOverlay.fillAlpha = 0;
                this.isFlashing = false;
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