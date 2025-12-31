import { Elf, Knight, Mage, Warrior } from "./entities/Subclasses.js";
import { InputHandler } from "./utils/InputHandler.js";

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        this.input = new InputHandler();
        this.projectiles = [];
        this.platforms = []; // Could add platforms later

        this.gameState = "SELECTION"; // SELECTION, PLAYING, GAME_OVER
        this.winner = null;

        this.player1 = null;
        this.player2 = null;

        // Selection State
        this.classes = [Warrior, Mage, Elf, Knight];
        this.classNames = ["Warrior", "Mage", "Elf", "Knight"];
        this.p1SelectionIndex = 0;
        this.p2SelectionIndex = 0;
        this.p1Selected = false;
        this.p2Selected = false;

        // Input Debounce for selection
        this.lastInputTime = 0;

        this.loop = this.loop.bind(this);
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
        if (this.gameState === "SELECTION") {
            this.handleSelectionInput(timestamp);
        } else if (this.gameState === "PLAYING") {
            this.updateGame();
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
        this.gameState = "PLAYING";
    }

    updateGame() {
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
                p.owner === this.player1 ? this.player2 : this.player1
            )
        );
        this.projectiles = this.projectiles.filter((p) => !p.markedForDeletion);

        // Check Win Condition
        if (this.player1.health <= 0) {
            this.winner = "Player 2";
            this.gameState = "GAME_OVER";
        } else if (this.player2.health <= 0) {
            this.winner = "Player 1";
            this.gameState = "GAME_OVER";
        }
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

        if (this.gameState === "SELECTION") {
            this.drawSelectionScreen();
        } else if (
            this.gameState === "PLAYING" ||
            this.gameState === "GAME_OVER"
        ) {
            this.drawGame();
            if (this.gameState === "GAME_OVER") {
                this.drawGameOver();
            }
        }
    }

    drawSelectionScreen() {
        this.ctx.fillStyle = "white";
        this.ctx.font = "30px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("CHARACTER SELECTION", this.width / 2, 100);

        // P1 Selection UI
        this.ctx.textAlign = "center";
        this.ctx.fillText(
            `Player 1: ${this.classNames[this.p1SelectionIndex]}`,
            this.width * 0.25,
            300
        );

        this.ctx.font = "20px Arial";
        if (this.p1Selected)
            this.ctx.fillText("(READY)", this.width * 0.25, 350);
        else
            this.ctx.fillText(
                "(A/D: Select, F: Confirm)",
                this.width * 0.25,
                350
            );

        // P2 Selection UI
        this.ctx.font = "30px Arial";
        this.ctx.fillText(
            `Player 2: ${this.classNames[this.p2SelectionIndex]}`,
            this.width * 0.75,
            300
        );

        this.ctx.font = "20px Arial";
        if (this.p2Selected)
            this.ctx.fillText("(READY)", this.width * 0.75, 350);
        else
            this.ctx.fillText(
                "(Arrows: Select, K: Confirm)",
                this.width * 0.75,
                350
            );
    }

    drawGame() {
        // Draw Floor/Background
        this.ctx.fillStyle = "#333"; // Darker ground
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Slow Zones
        this.slowZones.forEach((zone) => {
            this.ctx.fillStyle = zone.color;
            this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        });

        // Draw Obstacles
        this.obstacles.forEach((obs) => {
            this.ctx.fillStyle = obs.color;
            this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });

        // Draw Players
        this.player1.draw(this.ctx);
        this.player2.draw(this.ctx);

        // Draw Projectiles
        this.projectiles.forEach((p) => p.draw(this.ctx));

        // Draw HUD
        this.drawHUD();
    }

    drawHUD() {
        this.ctx.fillStyle = "white";
        this.ctx.font = "20px Arial";

        // P1 Health
        this.ctx.textAlign = "left";
        this.ctx.fillText(`P1: ${Math.ceil(this.player1.health)}`, 20, 30);

        // P2 Health
        this.ctx.textAlign = "right";
        this.ctx.fillText(
            `P2: ${Math.ceil(this.player2.health)}`,
            this.width - 20,
            30
        );
    }

    drawGameOver() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = "white";
        this.ctx.font = "50px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
            `${this.winner} WINS!`,
            this.width / 2,
            this.height / 2
        );

        this.ctx.font = "20px Arial";
        this.ctx.fillText(
            "Press SPACE to Restart",
            this.width / 2,
            this.height / 2 + 50
        );
    }
}
