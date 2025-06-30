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

        this.currentPlatformSpeed = gameOptions.platformStartSpeed;
        this.platformSpeedIncrease = 5; // Speed increase per second (tweak as needed)
        this.maxPlatformSpeed = 900;    // Optional: set a max speed

        // Score variables
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
        this.scoreTimer = 0;

        // Padding and layout constants
        const padding = 30;
        this.labelValueGap = 16; // space between label and value
        const topY = 20;
        const lineGap = 32;

        this.rightEdge = this.sys.game.config.width - 30;

        // Score value (right-aligned, flush with right edge)
        this.scoreText = this.add.text(
            this.rightEdge, topY,
            this.padScore(this.score),
            { fontFamily: 'PublicPixel', fontSize: '24px', fill: '#fff', align: 'right' }
        ).setOrigin(1, 0);

        // SCORE label (to the left of the score number)
        this.scoreLabel = this.add.text(
            this.rightEdge - this.scoreText.width - this.labelValueGap, topY,
            "SCORE",
            { fontFamily: 'PublicPixel', fontSize: '24px', fill: '#fff', align: 'right' }
        ).setOrigin(1, 0);

        // High score value (right-aligned, flush with right edge)
        this.highScoreText = this.add.text(
            this.rightEdge, topY + lineGap,
            this.padScore(this.highScore),
            { fontFamily: 'PublicPixel', fontSize: '20px', fill: '#fff', align: 'right' }
        ).setOrigin(1, 0);

        // HI label (to the left of the high score number)
        this.hiLabel = this.add.text(
            this.rightEdge - this.highScoreText.width - this.labelValueGap, topY + lineGap,
            "HI",
            { fontFamily: 'PublicPixel', fontSize: '20px', fill: '#fff', align: 'right' }
        ).setOrigin(1, 0);

        this.hideText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2,
            "HIDE",
            { fontFamily: 'PublicPixel', fontSize: '64px', fill: '#fff' }
        ).setOrigin(0.5, 0.5);
        this.hideText.setDepth(1001);
        this.hideText.setVisible(false);
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
            obstacle.setActive(true);
            obstacle.setVisible(true);
            // Make it rectangular and longer
            obstacle.displayWidth = 80;   // Adjust as needed for jumpability
            obstacle.displayHeight = 40;  // Adjust as needed
        } else {
            obstacle = this.physics.add.sprite(posX, platformY, "obstacle");
            obstacle.setImmovable(true);
            obstacle.displayWidth = 80;
            obstacle.displayHeight = 40;
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
            obstacle.setActive(true);
            obstacle.setVisible(true);
            // Make it more rectangular and longer
            obstacle.displayWidth = 140;  // Adjust as needed for jumpability
            obstacle.displayHeight = 50;  // Adjust as needed
        } else {
            obstacle = this.physics.add.sprite(posX, platformY, "bigObstacle");
            obstacle.setImmovable(true);
            obstacle.displayWidth = 140;
            obstacle.displayHeight = 50;
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
            obstacle.displayWidth = 370; // Was 320, now longer
            obstacle.displayHeight = 65; // Slightly taller if you want
        } else {
            obstacle = this.physics.add.sprite(posX, platformY, "bigObstacle");
            obstacle.setImmovable(true);
            obstacle.displayWidth = 370; // Was 320, now longer
            obstacle.displayHeight = 65;
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
        
        let drone = this.droneGroup.create(posX, posY, "drone");
        drone.setImmovable(true);
        
        drone.setScale(0.8); 
        
        drone.body.allowGravity = false;
        drone.collected = false;
    }

    collectDrone(player, drone) {
        if (!drone.collected) {
            drone.collected = true;
            drone.setVisible(false);
            drone.setActive(false);
            this.canTripleJump = true;
            // If the player is in the air, set playerJumps to 1
            if (!this.player.body.touching.down) {
                this.playerJumps = 1;
            }
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

          
            if (this.canTripleJump && this.playerJumps === 3) {
                this.canTripleJump = false;
            }
        }
    }

    padScore(num, size = 6) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
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
            this.player.setVelocityY(this.player.body.velocity.y - 7); // Lower jump hold power
            this.jumpTimer += this.game.loop.delta;
        } else {
            if (!jumpKeyDown || this.jumpTimer >= this.maxJumpTime || this.player.body.velocity.y >= 0) {
                this.isJumping = false;
            }
        }
        if (this.player.body.touching.down) {
            this.isJumping = false;
            this.jumpTimer = 0;
            this.canTripleJump = false; // <-- Reset triple jump when landing!
        }

        // Move and loop the platforms
        const speed = this.currentPlatformSpeed * this.game.loop.delta / 1000;
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
            this.mustHide = true;
            this.flashOverlay.fillColor = 0x000000;
            this.flashOverlay.fillAlpha = 0.5; // Slightly black
            this.hideText.setVisible(true);
        }

        if (this.isFlashing) {
            this.flashTimer += this.game.loop.delta;

            // Show overlay and text
            this.flashOverlay.fillAlpha = 0.5;
            this.hideText.setVisible(true);

            // End after 2 seconds
            if (this.flashTimer > 2000) {
                this.isFlashing = false;
                this.flashOverlay.fillAlpha = 0;
                this.hideText.setVisible(false);
                if (this.mustHide) {
                    this.scene.restart();
                }
            }
            if (this.cursors.down.isDown) {
                this.mustHide = false;
                this.flashOverlay.fillAlpha = 0;
                this.hideText.setVisible(false);
                this.isFlashing = false;
            }
        } else {
            this.hideText.setVisible(false);
            this.flashOverlay.fillAlpha = 0;
        }

        // Increase platform speed over time, up to a max speed
        this.currentPlatformSpeed += this.platformSpeedIncrease * (this.game.loop.delta / 1000);
        if (this.currentPlatformSpeed > this.maxPlatformSpeed) {
            this.currentPlatformSpeed = this.maxPlatformSpeed;
        }

        // Move and loop the platforms with increased speed
        this.platforms.children.iterate(platform => {
            platform.x -= this.currentPlatformSpeed * this.game.loop.delta / 1000;
            if (platform.x + platform.displayWidth < 0) {
                let rightmost = 0;
                this.platforms.children.iterate(p => {
                    if (p.x > rightmost) rightmost = p.x;
                });
                platform.x = rightmost + platform.displayWidth;
            }
        });

        // Score increases faster (every 100ms, +1 point per tick)
        this.scoreTimer += this.game.loop.delta;
        if (this.scoreTimer >= 100) { // 100 ms per tick
            this.score += 1;
            this.scoreText.setText(this.padScore(this.score));
            this.scoreLabel.x = this.rightEdge - this.scoreText.width - this.labelValueGap;
            this.hiLabel.x = this.rightEdge - this.highScoreText.width - this.labelValueGap;

            this.highScoreText.setText(this.padScore(this.highScore));
            this.scoreTimer = 0;
        }

        // Check and update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
            this.highScoreText.setText(this.padScore(this.highScore));
            this.hiLabel.x = this.rightEdge - this.highScoreText.width - this.labelValueGap;
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

/* Add the CSS styles directly in the JavaScript file */
const style = document.createElement('style');
style.innerHTML = `
body {
    background: #222;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
canvas {
    display: block;
    margin: auto;k;
}   margin: auto;
`;
document.head.appendChild(style);
document.head.appendChild(style);