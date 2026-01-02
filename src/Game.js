import { Elf, Knight, Mage, Warrior } from "./entities/Subclasses.js";
import { InputHandler } from "./utils/InputHandler.js";
import { Particle } from "./utils/Particle.js";

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        this.input = new InputHandler();
        this.projectiles = [];
        this.particles = [];
        this.obstacles = [];

        this.gameState = "TITLE"; // TITLE, SELECTION, PLAYING, GAME_OVER
        this.winner = null;
        this.screenShake = 0;

        this.player1 = null;
        this.player2 = null;

        // Selection State
        this.classes = [Warrior, Mage, Elf, Knight];
        this.classNames = ["Warrior", "Mage", "Elf", "Knight"];
        this.classColors = ["orange", "purple", "green", "blue"];
        this.p1SelectionIndex = 0;
        this.p2SelectionIndex = 0;
        this.p1Selected = false;
        this.p2Selected = false;

        // UI Elements
        this.pauseBtn = document.getElementById("pause-btn");
        this.pauseMenu = document.getElementById("pause-menu");
        this.resumeBtn = document.getElementById("resume-btn");
        this.selectionBtn = document.getElementById("selection-btn");

        this.pauseMenu.classList.add("hidden");
        this.initUI();

        // Input Debounce for selection
        this.lastInputTime = 0;

        this.loop = this.loop.bind(this);
    }

    initUI() {
        this.pauseBtn.addEventListener("click", () => this.togglePause());
        this.resumeBtn.addEventListener("click", () => this.togglePause());
        this.selectionBtn.addEventListener("click", () => this.goToSelection());
    }

    togglePause() {
        if (this.gameState === "PLAYING") {
            this.gameState = "PAUSED";
            this.pauseMenu.classList.remove("hidden");
        } else if (this.gameState === "PAUSED") {
            this.gameState = "PLAYING";
            this.pauseMenu.classList.add("hidden");
        }
    }

    goToSelection() {
        this.gameState = "SELECTION";
        this.pauseMenu.classList.add("hidden");
        this.p1Selected = false;
        this.p2Selected = false;
        this.player1 = null;
        this.player2 = null;
        this.previewP1 = null;
        this.previewP2 = null;
    }

    start() {
        requestAnimationFrame(this.loop);
    }

    loop(timestamp) {
        this.update(timestamp);
        this.draw();
        requestAnimationFrame(this.loop);
    }

    update(timestamp) {
        // Show/Hide Pause Button only during PLAYING or PAUSED
        if (this.gameState === "PLAYING" || this.gameState === "PAUSED") {
            this.pauseBtn.style.display = "block";
        } else {
            this.pauseBtn.style.display = "none";
            this.pauseMenu.classList.add("hidden"); // Force hide menu if not in playing/paused
        }

        if (this.gameState === "TITLE") {
            if (this.input.isDown("Enter") || this.input.isDown("Space")) {
                this.gameState = "SELECTION";
                this.lastInputTime = timestamp; // Prevent accidental selection
            }
        } else if (this.gameState === "SELECTION") {
            this.handleSelectionInput(timestamp);
        } else if (this.gameState === "COUNTDOWN") {
            if (timestamp - this.lastTime >= 1000) {
                this.countdownTimer--;
                this.lastTime = timestamp;
                if (this.countdownTimer < 0) {
                    this.gameState = "PLAYING";
                }
            }
        } else if (this.gameState === "PLAYING") {
            if (this.input.isDown("KeyP")) {
                this.togglePause();
                this.lastInputTime = timestamp;
            }
            this.updateGame();
        } else if (this.gameState === "PAUSED") {
            if (
                this.input.isDown("KeyP") &&
                timestamp - this.lastInputTime > 200
            ) {
                this.togglePause();
                this.lastInputTime = timestamp;
            }
        } else if (this.gameState === "GAME_OVER") {
            if (this.input.isDown("Space")) {
                this.resetGame();
            }
        }
    }

    handleSelectionInput(timestamp) {
        if (timestamp - this.lastInputTime < 200) return;

        // Player 1 Selection (A/D to move, F to select)
        if (!this.p1Selected) {
            if (this.input.isDown("KeyD")) {
                this.p1SelectionIndex = (this.p1SelectionIndex + 1) % 4;
                this.lastInputTime = timestamp;
            }
            if (this.input.isDown("KeyA")) {
                this.p1SelectionIndex = (this.p1SelectionIndex - 1 + 4) % 4;
                this.lastInputTime = timestamp;
            }
            if (this.input.isDown("KeyF")) {
                this.p1Selected = true;
                this.lastInputTime = timestamp;
            }
        }

        // Player 2 Selection (Arrows to move, K to select)
        if (!this.p2Selected) {
            if (this.input.isDown("ArrowRight")) {
                this.p2SelectionIndex = (this.p2SelectionIndex + 1) % 4;
                this.lastInputTime = timestamp;
            }
            if (this.input.isDown("ArrowLeft")) {
                this.p2SelectionIndex = (this.p2SelectionIndex - 1 + 4) % 4;
                this.lastInputTime = timestamp;
            }
            if (this.input.isDown("KeyK")) {
                this.p2Selected = true;
                this.lastInputTime = timestamp;
            }
        }

        if (this.p1Selected && this.p2Selected) {
            this.startGame();
        }
    }

    startGame() {
        const p1Class = this.classes[this.p1SelectionIndex];
        const p2Class = this.classes[this.p2SelectionIndex];

        const p1Controls = {
            up: "KeyW",
            down: "KeyS",
            left: "KeyA",
            right: "KeyD",
            attack: "KeyF",
            defend: "KeyG",
        };

        const p2Controls = {
            up: "ArrowUp",
            down: "ArrowDown",
            left: "ArrowLeft",
            right: "ArrowRight",
            attack: "KeyK",
            defend: "KeyL",
        };

        this.player1 = new p1Class(100, 300, p1Controls);
        this.player2 = new p2Class(600, 300, p2Controls);

        // Initialize Map Obstacles
        this.obstacles = [
            { x: 300, y: 100, width: 50, height: 400, color: "#666" }, // Center wall
            { x: 100, y: 100, width: 100, height: 50, color: "#666" }, // Top left
            { x: 600, y: 450, width: 100, height: 50, color: "#666" }, // Bottom right
        ];

        // Slow Zones (mud/water)
        this.slowZones = [
            {
                x: 350,
                y: 0,
                width: 100,
                height: 600,
                color: "rgba(0, 0, 255, 0.2)",
                factor: 0.5,
            }, // River
        ];

        this.projectiles = [];
        this.gameState = "COUNTDOWN";
        this.countdownTimer = 3;
        this.lastTime = performance.now();
    }

    updateGame() {
        // Screen Shake Decay
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        // Update Players
        this.player1.update(
            this.input,
            this.width,
            this.height,
            this.obstacles,
            this.slowZones,
            this.player2,
            this
        );
        this.player2.update(
            this.input,
            this.width,
            this.height,
            this.obstacles,
            this.slowZones,
            this.player1,
            this
        );

        // Update Projectiles
        this.projectiles.forEach((p) =>
            p.update(
                this.width,
                this.height,
                this.obstacles,
                p.owner === this.player1 ? this.player2 : this.player1,
                this
            )
        );
        this.projectiles = this.projectiles.filter((p) => !p.markedForDeletion);

        // Update Particles
        this.particles.forEach((p) => p.update());
        this.particles = this.particles.filter((p) => !p.markedForDeletion);

        // Check Win Condition
        if (this.player1.health <= 0) {
            this.winner = "Player 2";
            this.gameState = "GAME_OVER";
            this.createExplosion(
                this.player1.x + this.player1.width / 2,
                this.player1.y + this.player1.height / 2,
                this.player1.color,
                50
            );
        } else if (this.player2.health <= 0) {
            this.winner = "Player 1";
            this.gameState = "GAME_OVER";
            this.createExplosion(
                this.player2.x + this.player2.width / 2,
                this.player2.y + this.player2.height / 2,
                this.player2.color,
                50
            );
        }
    }

    createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const velocity = {
                x: (Math.random() - 0.5) * 10,
                y: (Math.random() - 0.5) * 10,
            };
            this.particles.push(
                new Particle(x, y, Math.random() * 4 + 2, color, velocity)
            );
        }
        this.screenShake = 10;
    }

    resetGame() {
        this.p1Selected = false;
        this.p2Selected = false;
        this.gameState = "SELECTION";
        this.winner = null;
    }

    draw() {
        // Clear Screen
        this.ctx.fillStyle = "#222";
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.gameState === "TITLE") {
            this.drawTitleScreen();
        } else if (this.gameState === "SELECTION") {
            this.drawSelectionScreen();
        } else if (
            this.gameState === "COUNTDOWN" ||
            this.gameState === "PLAYING" ||
            this.gameState === "PAUSED" ||
            this.gameState === "GAME_OVER"
        ) {
            this.drawGame();
            if (this.gameState === "COUNTDOWN") {
                this.drawCountdown();
            } else if (this.gameState === "GAME_OVER") {
                this.drawGameOver();
            }
        }
    }

    drawCountdown() {
        this.ctx.save();
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = "white";
        this.ctx.font = "100px 'Orbitron', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.shadowColor = "#fff";
        this.ctx.shadowBlur = 20;

        let text = this.countdownTimer > 0 ? this.countdownTimer : "FIGHT!";
        this.ctx.fillText(text, this.width / 2, this.height / 2);
        this.ctx.restore();
    }

    drawTitleScreen() {
        this.ctx.fillStyle = "#111";
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.textAlign = "center";

        // Title Glow
        this.ctx.shadowColor = "#0ff";
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = "white";
        this.ctx.font = "80px 'Orbitron', sans-serif";
        this.ctx.fillText("WILD DUELS", this.width / 2, this.height / 2 - 50);

        // Subtitle
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = "#aaa";
        this.ctx.font = "20px 'Orbitron', sans-serif";
        this.ctx.fillText(
            "PRESS ENTER TO START",
            this.width / 2,
            this.height / 2 + 50
        );

        this.ctx.restore();
    }

    drawSelectionScreen() {
        this.ctx.save();
        this.ctx.fillStyle = "white";
        this.ctx.font = "40px 'Orbitron', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.shadowColor = "#fff";
        this.ctx.shadowBlur = 10;
        this.ctx.fillText("CHARACTER SELECTION", this.width / 2, 100);
        this.ctx.shadowBlur = 0;

        // Update Previews
        const p1Class = this.classes[this.p1SelectionIndex];
        if (!this.previewP1 || this.previewP1.constructor !== p1Class) {
            this.previewP1 = new p1Class(0, 300, null);
            this.previewP1.x = this.width * 0.25 - this.previewP1.width / 2;
        }
        this.previewP1.animTimer++;

        const p2Class = this.classes[this.p2SelectionIndex];
        if (!this.previewP2 || this.previewP2.constructor !== p2Class) {
            this.previewP2 = new p2Class(0, 300, null);
            this.previewP2.x = this.width * 0.75 - this.previewP2.width / 2;
            this.previewP2.facing = "left";
        }
        this.previewP2.animTimer++;

        // Draw Previews
        this.previewP1.draw(this.ctx);
        this.previewP2.draw(this.ctx);

        // P1 Selection UI
        this.ctx.textAlign = "center";
        
        // Player Label
        this.ctx.fillStyle = "#0ff"; // Cyan for P1
        this.ctx.font = "20px 'Orbitron', sans-serif";
        this.ctx.fillText("PLAYER 1", this.width * 0.25, 180);

        // Class Name
        this.ctx.shadowColor = "#0ff";
        this.ctx.shadowBlur = 15;
        this.ctx.font = "bold 36px 'Orbitron', sans-serif";
        this.ctx.fillText(
            this.classNames[this.p1SelectionIndex].toUpperCase(),
            this.width * 0.25,
            230
        );
        this.ctx.shadowBlur = 0;

        this.ctx.font = "16px 'Orbitron', sans-serif";
        this.ctx.fillStyle = "#aaa";
        if (this.p1Selected) {
            this.ctx.fillStyle = "#0f0";
            this.ctx.shadowColor = "#0f0";
            this.ctx.shadowBlur = 10;
            this.ctx.fillText("READY", this.width * 0.25, 450);
            this.ctx.shadowBlur = 0;
        } else {
            this.ctx.fillText(
                "(A/D: Select, F: Confirm)",
                this.width * 0.25,
                450
            );
        }

        // P2 Selection UI
        // Player Label
        this.ctx.fillStyle = "#f0f"; // Magenta for P2
        this.ctx.font = "20px 'Orbitron', sans-serif";
        this.ctx.fillText("PLAYER 2", this.width * 0.75, 180);

        // Class Name
        this.ctx.shadowColor = "#f0f";
        this.ctx.shadowBlur = 15;
        this.ctx.font = "bold 36px 'Orbitron', sans-serif";
        this.ctx.fillText(
            this.classNames[this.p2SelectionIndex].toUpperCase(),
            this.width * 0.75,
            230
        );
        this.ctx.shadowBlur = 0;

        this.ctx.font = "16px 'Orbitron', sans-serif";
        this.ctx.fillStyle = "#aaa";
        if (this.p2Selected) {
            this.ctx.fillStyle = "#0f0";
            this.ctx.shadowColor = "#0f0";
            this.ctx.shadowBlur = 10;
            this.ctx.fillText("READY", this.width * 0.75, 450);
            this.ctx.shadowBlur = 0;
        } else {
            this.ctx.fillText(
                "(Arrows: Select, K: Confirm)",
                this.width * 0.75,
                450
            );
        }
        this.ctx.restore();
    }

    drawGame() {
        // Draw Floor/Background with Grid
        this.ctx.fillStyle = "#111";
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Grid
        this.ctx.strokeStyle = "#222";
        this.ctx.lineWidth = 2;
        const gridSize = 50;
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Draw Slow Zones
        this.slowZones.forEach((zone) => {
            this.ctx.fillStyle = zone.color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            this.ctx.globalAlpha = 1.0;
            this.ctx.strokeStyle = zone.color;
            this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
        });

        // Draw Obstacles
        this.obstacles.forEach((obs) => {
            this.ctx.fillStyle = obs.color;
            this.ctx.shadowColor = obs.color;
            this.ctx.shadowBlur = 5;
            this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            this.ctx.shadowBlur = 0;
        });

        // Draw Particles
        this.particles.forEach((p) => p.draw(this.ctx));

        // Draw Players
        this.player1.draw(this.ctx);
        this.player2.draw(this.ctx);

        // Draw Projectiles
        this.projectiles.forEach((p) => p.draw(this.ctx));

        // Draw HUD
        this.drawHUD();
    }

    drawHUD() {
        this.ctx.save();
        this.ctx.font = "20px 'Orbitron', sans-serif";

        // P1 Health Bar
        const p1HealthPercent = Math.max(
            0,
            this.player1.health / this.player1.maxHealth
        );
        this.ctx.fillStyle = "#333";
        this.ctx.fillRect(20, 20, 200, 20);
        this.ctx.fillStyle = "#0ff";
        this.ctx.fillRect(20, 20, 200 * p1HealthPercent, 20);
        this.ctx.strokeStyle = "#fff";
        this.ctx.strokeRect(20, 20, 200, 20);
        this.ctx.fillStyle = "#fff";
        this.ctx.textAlign = "left";
        this.ctx.fillText(`P1`, 20, 15);

        // P2 Health Bar
        const p2HealthPercent = Math.max(
            0,
            this.player2.health / this.player2.maxHealth
        );
        this.ctx.fillStyle = "#333";
        this.ctx.fillRect(this.width - 220, 20, 200, 20);
        this.ctx.fillStyle = "#f0f";
        this.ctx.fillRect(this.width - 220, 20, 200 * p2HealthPercent, 20);
        this.ctx.strokeStyle = "#fff";
        this.ctx.strokeRect(this.width - 220, 20, 200, 20);
        this.ctx.fillStyle = "#fff";
        this.ctx.textAlign = "right";
        this.ctx.fillText(`P2`, this.width - 20, 15);

        this.ctx.restore();
    }

    drawGameOver() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.fillStyle = "white";
        this.ctx.font = "60px 'Orbitron', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.shadowColor = this.winner === "Player 1" ? "#0ff" : "#f0f";
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(
            `${this.winner} WINS!`,
            this.width / 2,
            this.height / 2
        );
        this.ctx.restore();

        this.ctx.fillStyle = "#aaa";
        this.ctx.font = "20px 'Orbitron', sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
            "Press SPACE to Restart",
            this.width / 2,
            this.height / 2 + 60
        );
    }
}
