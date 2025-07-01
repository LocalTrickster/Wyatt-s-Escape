// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/

// Opciones del juego
const gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [100, 350],
    platformSize: 150,
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
        this.load.image("playerStanding", "./public/assets/wyattstanding.png");
        this.load.image("playerRunning", "./public/assets/wyattrunning.png");
        this.load.image("obstacle", "./public/assets/table.png");
        this.load.image("bigObstacle", "./public/assets/barrel.png");
        this.load.image('drone', 'public/assets/drone.png');
        this.load.image('door', 'public/assets/door.png');
        this.load.image('window', 'public/assets/window.png');
        this.load.image('biggestobstacle', 'public/assets/box.png');
        this.load.audio('jump', 'public/assets/jump.mp3');
        this.load.audio('lasershoot', 'public/assets/lasershoot.mp3');
        this.load.audio('theme', 'public/assets/wyattescapesong2.mp3');
    }

    create() {
        const config = this.sys.game.config;

        
        this.player = this.physics.add.sprite(
            gameOptions.playerStartPosition,
            config.height / 2,
            "playerStanding"
        );
        this.player.setGravityY(gameOptions.playerGravity);
        this.player.setScale(1);

        
        this.platforms = this.physics.add.group();

        const platformY = config.height * 0.7;
        const platformWidth = config.width * 1.5;

        
        let platform1 = this.platforms.create(0, platformY, "platform");
        platform1.setOrigin(0, 0.1);
        platform1.displayWidth = platformWidth;
        platform1.displayHeight = 450;
        platform1.setImmovable(true);
        platform1.body.allowGravity = false;

        
        let platform2 = this.platforms.create(platformWidth, platformY, "platform");
        platform2.setOrigin(0, 0.1);
        platform2.displayWidth = platformWidth;
        platform2.displayHeight = 450;
        platform2.setImmovable(true);
        platform2.body.allowGravity = false;

       
        this.physics.add.collider(this.player, this.platforms);

        
        this.obstacleGroup = this.add.group();
        this.obstaclePool = this.add.group();
        this.droneGroup = this.physics.add.group();

        this.playerJumps = 0;
        this.isJumping = false;
        this.jumpTimer = 0;
        this.maxJumpTime = 350;

        this.lastObstacleX = 0;
        this.lastObstacleSpawnX = 0;
        this.minObstacleSpacing = 120;
        this.obstacleDistance = 0;

        this.input.on("pointerdown", this.jump, this);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        
        this.jumpSound = this.sound.add('jump');
        this.laserShootSound = this.sound.add('lasershoot');
        
        if (!this.sound.get('theme')) {
            this.themeMusic = this.sound.add('theme', { loop: true });
        } else {
            this.themeMusic = this.sound.get('theme');
        }

        
        this.physics.add.collider(
            this.player,
            this.obstacleGroup,
            (player, obstacle) => {
                if (obstacle.active && obstacle.visible) {
                    this.gameOver();
                }
            },
            null,
            this
        );

        this.physics.add.overlap(this.player, this.droneGroup, this.collectDrone, null, this);
        this.canTripleJump = false;

        
        this.flashOverlay = this.add.rectangle(
            config.width / 2,
            config.height / 2,
            config.width,
            config.height,
            0xffffff,
            0
        );
        this.flashOverlay.setDepth(1000);
        this.isFlashing = false;
        this.flashTimer = 0;
        this.flashColor = 0xffffff;
        this.mustHide = false;
        this.lastFlashSwitch = 0;

        this.currentPlatformSpeed = gameOptions.platformStartSpeed;
        this.platformSpeedIncrease = 5;
        this.maxPlatformSpeed = 900;

       
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
        this.scoreTimer = 0;

        
        const padding = 30;
        this.labelValueGap = 16;
        const topY = 20;
        const lineGap = 32;

        this.rightEdge = config.width - 30;

        
        this.scoreText = this.add.text(
            this.rightEdge, topY,
            this.padScore(this.score),
            { fontFamily: 'PublicPixel', fontSize: '24px', fill: '#fff', align: 'right' }
        ).setOrigin(1, 0);

       
        this.scoreLabel = this.add.text(
            this.rightEdge - this.scoreText.width - this.labelValueGap, topY,
            "SCORE",
            { fontFamily: 'PublicPixel', fontSize: '24px', fill: '#fff', align: 'right' }
        ).setOrigin(1, 0);

       
        this.highScoreText = this.add.text(
            this.rightEdge, topY + lineGap,
            this.padScore(this.highScore),
            { fontFamily: 'PublicPixel', fontSize: '20px', fill: '#fff', align: 'right' }
        ).setOrigin(1, 0);

       
        this.hiLabel = this.add.text(
            this.rightEdge - this.highScoreText.width - this.labelValueGap, topY + lineGap,
            "HI",
            { fontFamily: 'PublicPixel', fontSize: '20px', fill: '#fff', align: 'right' }
        ).setOrigin(1, 0);

        this.hideText = this.add.text(
            config.width / 2,
            config.height / 2,
            "HIDE",
            { fontFamily: 'PublicPixel', fontSize: '64px', fill: '#fff' }
        ).setOrigin(0.5, 0.5);
        this.hideText.setDepth(1001);
        this.hideText.setVisible(false);

        // Game Over text
        this.isGameOver = false;
        this.gameOverText = this.add.text(
            config.width / 2,
            config.height / 2 - 40,
            "GAME OVER",
            { fontFamily: 'PublicPixel', fontSize: '48px', fill: '#fff' }
        ).setOrigin(0.5, 0.5);
        this.gameOverText.setDepth(2000);
        this.gameOverText.setVisible(false);

        this.restartText = this.add.text(
            config.width / 2,
            config.height / 2 + 20,
            "Press R to restart",
            { fontFamily: 'PublicPixel', fontSize: '24px', fill: '#fff' }
        ).setOrigin(0.5, 0.5);
        this.restartText.setDepth(2000);
        this.restartText.setVisible(false);

        this.startText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 140,
            "Press the jump button to start\nPress S or Down for Controls",
            { fontFamily: 'PublicPixel', fontSize: '24px', fill: '#fff', align: 'center' }
        ).setOrigin(0.5, 0.5);
        this.startText.setDepth(2000);
        this.startText.setVisible(true);

        this.inIntroRoom = true;

        // Place the door at the ninja's starting X, above the first platform
        const platform = this.platforms.getChildren()[0];
        const ninjaX = this.player.x;
        platform.doorSprite = this.add.image(
            ninjaX,
            platform.y - 40,
            'door'
        );
        platform.doorSprite.setOrigin(0.5, 1);
        platform.doorSprite.setScale(3.2);
        platform.doorSprite.setDepth(-10);
        platform.doorOffsetX = ninjaX - platform.x;
        this.textures.get('door').setFilter(Phaser.Textures.FilterMode.NEAREST);

        // Animation variables for PNG toggle
        this.isRunning = false;
        this.runFrame = 0;
        this.runAnimTimer = 0;
        this.runAnimInterval = 200; // ms between frame switches (adjust for speed)
        this.player.setTexture("playerStanding");
    }

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
    }

    addObstacle(posX, platformY, platformWidth){
        let obstacle = null;
        this.obstaclePool.getChildren().forEach(obj => {
            if (!obstacle && !obj.active) obstacle = obj;
        });
        const yOffset = 4; 
        if(obstacle){
            this.obstaclePool.remove(obstacle);
            this.obstacleGroup.remove(obstacle);
            obstacle.x = posX;
            obstacle.y = platformY - yOffset; 
            obstacle.setTexture("obstacle");
            obstacle.setActive(true);
            obstacle.setVisible(true);
            obstacle.displayWidth = 80;
            obstacle.displayHeight = 40;
        } else {
            obstacle = this.physics.add.sprite(posX, platformY - yOffset, "obstacle"); 
            obstacle.setImmovable(true);
            obstacle.displayWidth = 80;
            obstacle.displayHeight = 40;
        }
        this.obstacleGroup.add(obstacle);
    }

    addBigObstacle(posX, platformY) {
        let obstacle = null;
        this.obstaclePool.getChildren().forEach(obj => {
            if (!obstacle && !obj.active) obstacle = obj;
        });
        const yOffset = -10; 
        if(obstacle){
            this.obstaclePool.remove(obstacle);
            this.obstacleGroup.remove(obstacle);
            obstacle.x = posX;
            obstacle.y = platformY - yOffset;
            obstacle.setTexture("bigObstacle");
            obstacle.setActive(true);
            obstacle.setVisible(true);
            obstacle.displayWidth = 260;
            obstacle.displayHeight = 90;
        } else {
            obstacle = this.physics.add.sprite(posX, platformY - yOffset, "bigObstacle");
            obstacle.setImmovable(true);
            obstacle.displayWidth = 260;
            obstacle.displayHeight = 90;
        }
        this.obstacleGroup.add(obstacle);
    }

    addBiggestObstacle(posX, platformY) {
        let obstacle = null;
        this.obstaclePool.getChildren().forEach(obj => {
            if (!obstacle && !obj.active) obstacle = obj;
        });
        const yOffset = -30; 
        if(obstacle){
            this.obstaclePool.remove(obstacle);
            this.obstacleGroup.remove(obstacle);
            obstacle.x = posX;
            obstacle.y = platformY - yOffset;
            obstacle.setTexture("biggestobstacle");
            obstacle.setActive(true);
            obstacle.setVisible(true);
            obstacle.displayWidth = 320;
            obstacle.displayHeight = 90;
        } else {
            obstacle = this.physics.add.sprite(posX, platformY - yOffset, "biggestobstacle");
            obstacle.setImmovable(true);
            obstacle.displayWidth = 320;
            obstacle.displayHeight = 90;
        }
        this.obstacleGroup.add(obstacle);

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
            if (!this.player.body.touching.down) {
                this.playerJumps = 1;
            }
            if (this.laserShootSound) this.laserShootSound.play(); // <-- Play laser shoot sound
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
            if (this.jumpSound) this.jumpSound.play();
        }
    }

    padScore(num, size = 6) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    update() {
        // Freeze all game logic if game over
        if (this.isGameOver) {
            this.gameOverText.setVisible(true);
            this.restartText.setVisible(true);

            if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
                if (this.themeMusic && this.themeMusic.isPlaying) {
                    this.themeMusic.stop();
                }
                this.scene.restart();
            }
            return;
        }

        // --- INTRO ROOM LOGIC ---
        if (this.inIntroRoom) {
            // Blinking effect: visible for 500ms, hidden for 500ms
            const blink = Math.floor(this.time.now / 500) % 2 === 0;
            this.startText.setVisible(blink);

            // Always show standing frame during intro
            this.player.setTexture("playerStanding");

            // Go to controls scene
            if (
                Phaser.Input.Keyboard.JustDown(this.cursors.down) ||
                Phaser.Input.Keyboard.JustDown(this.keyS)
            ) {
                this.scene.start('controls');
                return;
            }

            // Start game
            if (
                Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                Phaser.Input.Keyboard.JustDown(this.keyW) ||
                Phaser.Input.Keyboard.JustDown(this.keySpace) ||
                this.input.activePointer.isDown
            ) {
                this.inIntroRoom = false;
                this.startText.setVisible(false);
                this.isRunning = true;
                this.runFrame = 0;
                this.runAnimTimer = 0;
                this.player.setTexture("playerStanding");
                if (this.themeMusic && !this.themeMusic.isPlaying) {
                    this.themeMusic.play();
                }
            }
            return;
        } else {
            if (this.startText) this.startText.setVisible(false);
        }

        const config = this.sys.game.config;
        if (this.player.y > config.height) {
            this.gameOver();
        }
        this.player.x = gameOptions.playerStartPosition;

        // Jump logic
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.keyW) ||
            Phaser.Input.Keyboard.JustDown(this.keySpace)
        ) {
            this.jump();
        }
        const jumpKeyDown = this.cursors.up.isDown || this.cursors.space.isDown;
        if (
            this.isJumping &&
            jumpKeyDown &&
            this.jumpTimer < this.maxJumpTime &&
            this.player.body.velocity.y < 0
        ) {
            this.player.setVelocityY(this.player.body.velocity.y - 7);
            this.jumpTimer += this.game.loop.delta;
        } else {
            if (!jumpKeyDown || this.jumpTimer >= this.maxJumpTime || this.player.body.velocity.y >= 0) {
                this.isJumping = false;
            }
        }
        if (this.player.body.touching.down) {
            this.isJumping = false;
            this.jumpTimer = 0;
            this.canTripleJump = false;
        }

        // Move and loop the platforms
        let speed = this.currentPlatformSpeed * this.game.loop.delta / 1000;

        // Find the rightmost platform's right edge
        let rightmostEdge = -Infinity;
        this.platforms.children.iterate(platform => {
            platform.x -= speed;
            let platformRight = platform.x + platform.displayWidth;
            if (platformRight > rightmostEdge) {
                rightmostEdge = platformRight;
            }
        });

        // Reposition platforms that go off screen and spawn doors/windows
        this.platforms.children.iterate(platform => {
            if (platform.x + platform.displayWidth < 0) {
                platform.x = rightmostEdge;
                rightmostEdge = platform.x + platform.displayWidth;

                // 20% chance to spawn a door decoration ON TOP OF THE PLATFORM
                if (Phaser.Math.Between(0, 4) === 0) {
                    platform.doorSprite = this.add.image(
                        platform.x + 100,
                        platform.y - 40,
                        'door'
                    );
                    platform.doorSprite.setOrigin(0.5, 1);
                    platform.doorSprite.setScale(3.2);
                    platform.doorSprite.setDepth(-10);
                    platform.doorOffsetX = 100;
                    this.textures.get('door').setFilter(Phaser.Textures.FilterMode.NEAREST);
                } else {
                    if (platform.doorSprite) {
                        platform.doorSprite.destroy();
                        platform.doorSprite = null;
                    }
                }

                // 20% chance to spawn a window on the wall (background)
                if (Phaser.Math.Between(0, 4) === 0) {
                    const wallY = 80;
                    const wallX = platform.x + 80; // match the update logic
                    platform.windowSprite = this.add.image(
                        wallX,
                        wallY,
                        'window'
                    );
                    platform.windowSprite.setOrigin(0, 0);
                    platform.windowSprite.setDepth(-20);
                    platform.windowSprite.setScale(0.55); // slightly smaller
                    this.textures.get('window').setFilter(Phaser.Textures.FilterMode.NEAREST);
                } else {
                    if (platform.windowSprite) {
                        platform.windowSprite.destroy();
                        platform.windowSprite = null;
                    }
                }
            }
        });

        // Move obstacles left at the same speed as platforms
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
            this.obstacleDistance > 150 &&
            Phaser.Math.Between(0, 100) < 4
        ) {
            let anyActiveObstacle = false;
            this.obstacleGroup.getChildren().forEach(obj => {
                if (obj.active) anyActiveObstacle = true;
            });
            if (!anyActiveObstacle) {
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
        if ((noObstacles || playerInAir) && !this.isFlashing && Phaser.Math.Between(0, 1000) < 2 && this.player.body.touching.down) {
            this.isFlashing = true;
            this.flashTimer = 0;
            this.mustHide = true;
            this.flashOverlay.fillColor = 0x000000;
            this.flashOverlay.fillAlpha = 0.5;
            this.hideText.setVisible(true);
        }

        if (this.isFlashing) {
            this.flashTimer += this.game.loop.delta;
            this.flashOverlay.fillAlpha = 0.5;
            this.hideText.setVisible(true);

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

        // Score increases faster (every 100ms, +1 point per tick)
        this.scoreTimer += this.game.loop.delta;
        if (this.scoreTimer >= 100) {
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

        // Game over logic (redundant, but safe)
        if (this.isGameOver) {
            this.gameOverText.setVisible(true);
            this.restartText.setVisible(true);
            if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
                this.scene.restart();
            }
        }

        // Move door and window with platform
        const firstPlatform = this.platforms.getChildren()[0];
        const ninjaOffset = this.player.x - firstPlatform.x;
        this.platforms.children.iterate(platform => {
            if (platform.doorSprite) {
                platform.doorSprite.x = platform.x + (platform.doorOffsetX || 0);
                platform.doorSprite.y = platform.y - 40;
            }
            if (platform.windowSprite) {
                // Attach window to a fixed offset from the platform's LEFT edge
                platform.windowSprite.x = platform.x + 80; // 80px from platform's left edge
                platform.windowSprite.y = 80; // fixed Y
                platform.windowSprite.setScale(0.55); // slightly smaller
            }
        });

        // Running animation toggle
        if (this.isRunning && !this.isGameOver) {
            this.runAnimTimer += this.game.loop.delta;
            if (this.runAnimTimer >= this.runAnimInterval) {
                this.runFrame = 1 - this.runFrame; // toggles between 0 and 1
                if (this.runFrame === 0) {
                    this.player.setTexture("playerStanding");
                } else {
                    this.player.setTexture("playerRunning");
                }
                this.runAnimTimer = 0;
            }
        }
    }

    gameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.isRunning = false;
        this.player.setTexture("playerStanding");
        this.physics.pause();
        this.gameOverText.setVisible(true);
        this.restartText.setVisible(true);
        this.hideText.setVisible(false);
        this.flashOverlay.fillAlpha = 0;
        if (this.themeMusic && this.themeMusic.isPlaying) {
            this.themeMusic.stop();
        }
    }
}

// --- Canvas Resize and CSS Injection (OUTSIDE the class!) ---

function resizeGame() {
    let canvas = document.querySelector("canvas");
    if (!canvas) return;
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let gameRatio = canvas.width / canvas.height;
    let windowRatio = windowWidth / windowHeight;
    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    } else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}

// Add the CSS styles directly in the JavaScript file
const style = document.createElement('style');
style.innerHTML = `
body {
    background: #222;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
canvas {
    display: block;
    margin: auto;
}
`;
document.head.appendChild(style);

window.addEventListener("resize", resizeGame);
window.addEventListener("DOMContentLoaded", resizeGame);