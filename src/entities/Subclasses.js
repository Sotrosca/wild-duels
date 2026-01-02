import { Character } from "./Character.js";
import { Projectile } from "./Projectile.js";

class Fireball extends Projectile {
    drawShape(ctx) {
        const time = Date.now() * 0.01;

        // Outer Glow
        ctx.shadowColor = "red";
        ctx.shadowBlur = 15;

        // Main Core
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner Core
        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 4 + Math.sin(time) * 2, 0, Math.PI * 2);
        ctx.fill();

        // Particles/Flames
        ctx.fillStyle = "rgba(255, 69, 0, 0.5)";
        for (let i = 0; i < 3; i++) {
            const angle = (i * Math.PI * 2) / 3 + time;
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * 10,
                Math.sin(angle) * 10,
                5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
}

class Arrow extends Projectile {
    drawShape(ctx) {
        ctx.shadowColor = "lightgreen";
        ctx.shadowBlur = 5;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        // Shaft
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(this.width / 2, 0);
        ctx.stroke();

        // Head
        ctx.fillStyle = "lightgreen";
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width / 2 - 10, -5);
        ctx.lineTo(this.width / 2 - 10, 5);
        ctx.closePath();
        ctx.fill();

        // Fletching
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 2 - 5, -5);
        ctx.lineTo(-this.width / 2 - 5, 5);
        ctx.closePath();
        ctx.fill();
    }
}

export class Mage extends Character {
    constructor(x, y, controls) {
        super(x, y, 40, 60, "purple", controls);
        this.type = "Mage";
        this.maxHealth = 80;
        this.health = this.maxHealth;
        this.attackPower = 20; // Increased for Fireball
        this.speed = 5;
        this.isRanged = true;

        // Shield Stats
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldMaxTime = 60; // 1 second (60 frames)
        this.shieldCooldown = 0;
        this.shieldMaxCooldown = 180; // 3 seconds
    }

    update(input, gameWidth, gameHeight, obstacles, slowZones, enemy, game) {
        super.update(
            input,
            gameWidth,
            gameHeight,
            obstacles,
            slowZones,
            enemy,
            game
        );

        // Shield Timer
        if (this.shieldActive) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                this.shieldCooldown = this.shieldMaxCooldown;
            }
        }

        // Cooldown Timer
        if (this.shieldCooldown > 0) {
            this.shieldCooldown--;
        }
    }

    handleDefense(input) {
        // Activate Shield if key pressed, not active, and not on cooldown
        if (
            input.isDown(this.controls.defend) &&
            !this.shieldActive &&
            this.shieldCooldown <= 0
        ) {
            this.shieldActive = true;
            this.shieldTimer = this.shieldMaxTime;
        }
        // Mage does not use standard continuous defense
        this.isDefending = false;
    }

    takeDamage(amount) {
        if (this.shieldActive) {
            // Shield absorbs all damage
            return;
        }
        super.takeDamage(amount);
    }

    attack(game) {
        super.attack(game);

        const speed = 12;
        let angle = 0;
        // Start from center
        let startX = this.x + this.width / 2;
        let startY = this.y + this.height / 2;

        switch (this.facing) {
            case "right":
                angle = 0;
                startX += this.width / 2 + 10;
                break;
            case "left":
                angle = Math.PI;
                startX -= this.width / 2 + 10;
                break;
            case "up":
                angle = -Math.PI / 2;
                startY -= this.height / 2 + 10;
                break;
            case "down":
                angle = Math.PI / 2;
                startY += this.height / 2 + 10;
                break;
            case "up-right":
                angle = -Math.PI / 4;
                startX += this.width / 2;
                startY -= this.height / 2;
                break;
            case "up-left":
                angle = (-3 * Math.PI) / 4;
                startX -= this.width / 2;
                startY -= this.height / 2;
                break;
            case "down-right":
                angle = Math.PI / 4;
                startX += this.width / 2;
                startY += this.height / 2;
                break;
            case "down-left":
                angle = (3 * Math.PI) / 4;
                startX -= this.width / 2;
                startY += this.height / 2;
                break;
        }

        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
        };

        const projectile = new Fireball(
            startX - 12.5, // Center the projectile (width 25)
            startY - 12.5,
            velocity,
            25, // Larger fireball
            25,
            "orange", // Fire color
            this.attackPower,
            this
        );
        game.projectiles.push(projectile);
    }

    drawBody(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const time = this.animTimer * 0.1;

        // Pulsing Core
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(cx, cy, 15 + Math.sin(time) * 2, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting Orbs
        for (let i = 0; i < 3; i++) {
            const angle = time + (i * (Math.PI * 2)) / 3;
            const ox = cx + Math.cos(angle) * 25;
            const oy = cy + Math.sin(angle) * 25;

            ctx.beginPath();
            ctx.arc(ox, oy, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Glowing Eyes (Direction Indicator)
        ctx.fillStyle = "white";
        let ex = 0,
            ey = 0;
        if (this.facing.includes("right")) ex = 8;
        if (this.facing.includes("left")) ex = -8;
        if (this.facing.includes("up")) ey = -8;
        if (this.facing.includes("down")) ey = 8;

        ctx.beginPath();
        ctx.arc(cx + ex, cy + ey, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    draw(ctx) {
        super.draw(ctx);

        // Draw Fire Shield
        if (this.shieldActive) {
            ctx.save();
            ctx.shadowColor = "orange";
            ctx.shadowBlur = 20;
            ctx.strokeStyle = "orange";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                50,
                0,
                Math.PI * 2
            );
            ctx.stroke();

            ctx.fillStyle = "rgba(255, 165, 0, 0.3)";
            ctx.fill();
            ctx.restore();
        }

        // Draw Cooldown Indicator (small bar below health)
        if (this.shieldCooldown > 0) {
            ctx.fillStyle = "gray";
            ctx.fillRect(this.x, this.y - 30, this.width, 5);
            ctx.fillStyle = "yellow";
            const cooldownPct =
                1 - this.shieldCooldown / this.shieldMaxCooldown;
            ctx.fillRect(this.x, this.y - 30, this.width * cooldownPct, 5);
        }
    }
}

export class Warrior extends Character {
    constructor(x, y, controls) {
        super(x, y, 50, 70, "orange", controls);
        this.type = "Warrior";
        this.maxHealth = 110;
        this.health = this.maxHealth;
        this.attackPower = 15;
        this.speed = 5;
        this.isRanged = false;

        // Dash Stats
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDuration = 10;
        this.dashCooldown = 0;
        this.dashMaxCooldown = 60;
    }

    handleInput(input, game) {
        if (this.isDashing) {
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.velocity.x = 0;
                this.velocity.y = 0;
            }
            return; // Skip normal movement
        }

        super.handleInput(input, game);

        if (this.dashCooldown > 0) this.dashCooldown--;
    }

    handleDefense(input) {
        if (
            input.isDown(this.controls.defend) &&
            this.dashCooldown <= 0 &&
            !this.isDashing
        ) {
            this.startDash();
        }
    }

    startDash() {
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.dashMaxCooldown;

        const dashSpeed = 15;
        const diagSpeed = dashSpeed * 0.707;

        switch (this.facing) {
            case "right":
                this.velocity.x = dashSpeed;
                this.velocity.y = 0;
                break;
            case "left":
                this.velocity.x = -dashSpeed;
                this.velocity.y = 0;
                break;
            case "up":
                this.velocity.x = 0;
                this.velocity.y = -dashSpeed;
                break;
            case "down":
                this.velocity.x = 0;
                this.velocity.y = dashSpeed;
                break;
            case "up-right":
                this.velocity.x = diagSpeed;
                this.velocity.y = -diagSpeed;
                break;
            case "up-left":
                this.velocity.x = -diagSpeed;
                this.velocity.y = -diagSpeed;
                break;
            case "down-right":
                this.velocity.x = diagSpeed;
                this.velocity.y = diagSpeed;
                break;
            case "down-left":
                this.velocity.x = -diagSpeed;
                this.velocity.y = diagSpeed;
                break;
        }
    }

    attack(game) {
        super.attack(game);
        // Whirlwind effect handled in updateAttackBox or draw
    }

    updateAttackBox() {
        if (this.isAttacking) {
            // Whirlwind Hitbox: 360 degrees around player
            this.attackBox.width = 120;
            this.attackBox.height = 120;
            this.attackBox.position.x = this.x + this.width / 2 - 60;
            this.attackBox.position.y = this.y + this.height / 2 - 60;
        } else {
            super.updateAttackBox();
        }
    }

    drawBody(ctx) {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;

        // Main Body (Heavy Block)
        ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);

        // Breathing Armor Plates
        const breath = Math.sin(this.animTimer * 0.1) * 2;

        // Shoulders
        ctx.fillRect(this.x - 2, this.y + breath, 10, 20);
        ctx.fillRect(this.x + this.width - 8, this.y + breath, 10, 20);

        // Center Core
        ctx.fillStyle = "#ffaa00";
        ctx.fillRect(
            this.x + this.width / 2 - 5,
            this.y + this.height / 2 - 5,
            10,
            10
        );

        // Visor (Direction Indicator)
        ctx.fillStyle = "#00ffff";
        if (this.facing === "right") {
            ctx.fillRect(this.x + this.width - 5, this.y + 15, 5, 15);
        } else if (this.facing === "left") {
            ctx.fillRect(this.x, this.y + 15, 5, 15);
        } else if (this.facing === "up") {
            ctx.fillRect(this.x + 15, this.y, 20, 5);
        } else {
            // down
            ctx.fillRect(this.x + 15, this.y + this.height - 5, 20, 5);
        }

        // Sword
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (this.isAttacking) {
            ctx.rotate(this.animTimer * 0.5);
        } else {
            let angle = 0;
            if (this.facing === "right") angle = 0;
            else if (this.facing === "left") angle = Math.PI;
            else if (this.facing === "up") angle = -Math.PI / 2;
            else angle = Math.PI / 2;
            ctx.rotate(angle + 0.5); // Slight offset for idle
        }
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";
        ctx.fillStyle = "#ddd";
        ctx.fillRect(20, -3, 35, 6); // Blade
        ctx.fillStyle = "#888";
        ctx.fillRect(15, -10, 5, 20); // Guard
        ctx.fillStyle = "#552200";
        ctx.fillRect(5, -3, 15, 6); // Handle
        ctx.restore();

        ctx.shadowBlur = 0;
    }

    draw(ctx) {
        super.draw(ctx);
        // Draw Whirlwind visual
        if (this.isAttacking) {
            ctx.save();
            ctx.shadowColor = "orange";
            ctx.shadowBlur = 20;
            ctx.strokeStyle = "rgba(255, 165, 0, 0.8)";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                60,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            ctx.restore();
        }

        // Draw Dash Cooldown
        if (this.dashCooldown > 0) {
            ctx.fillStyle = "cyan";
            const pct = 1 - this.dashCooldown / this.dashMaxCooldown;
            ctx.fillRect(this.x, this.y - 25, this.width * pct, 3);
        }
    }
}

export class Elf extends Character {
    constructor(x, y, controls) {
        super(x, y, 35, 55, "green", controls);
        this.type = "Elf";
        this.maxHealth = 90;
        this.health = this.maxHealth;
        this.attackPower = 8;
        this.baseSpeed = 7;
        this.speed = this.baseSpeed;
        this.isRanged = true;
    }

    handleDefense(input) {
        if (input.isDown(this.controls.defend)) {
            this.speed = 12; // Sprint
            this.isDefending = true; // Visual effect
        } else {
            this.speed = this.baseSpeed;
            this.isDefending = false;
        }
    }

    attack(game) {
        // Custom Triple Shot
        if (this.attackTimer > 0) return;

        this.isAttacking = true;
        this.hasHit = false;
        this.attackActiveTimer = 10; // Shorter visual for ranged
        this.attackTimer = this.cooldownTime;

        const angles = [0, -0.3, 0.3]; // Radians spread

        angles.forEach((angle) => {
            let vx = 0,
                vy = 0;
            const speed = 15;

            switch (this.facing) {
                case "right":
                    vx = Math.cos(angle) * speed;
                    vy = Math.sin(angle) * speed;
                    break;
                case "left":
                    vx = -Math.cos(angle) * speed;
                    vy = Math.sin(angle) * speed;
                    break;
                case "up":
                    vx = Math.sin(angle) * speed;
                    vy = -Math.cos(angle) * speed;
                    break;
                case "down":
                    vx = Math.sin(angle) * speed;
                    vy = Math.cos(angle) * speed;
                    break;
                case "up-right":
                    vx = Math.cos(angle - Math.PI / 4) * speed;
                    vy = Math.sin(angle - Math.PI / 4) * speed;
                    break;
                case "up-left":
                    vx = Math.cos(angle - (3 * Math.PI) / 4) * speed;
                    vy = Math.sin(angle - (3 * Math.PI) / 4) * speed;
                    break;
                case "down-right":
                    vx = Math.cos(angle + Math.PI / 4) * speed;
                    vy = Math.sin(angle + Math.PI / 4) * speed;
                    break;
                case "down-left":
                    vx = Math.cos(angle + (3 * Math.PI) / 4) * speed;
                    vy = Math.sin(angle + (3 * Math.PI) / 4) * speed;
                    break;
            }

            const projectile = new Arrow(
                this.x + this.width / 2 - 7,
                this.y + this.height / 2 - 7,
                { x: vx, y: vy },
                15,
                5,
                "lightgreen",
                this.attackPower,
                this
            );
            game.projectiles.push(projectile);
        });
    }

    drawBody(ctx) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const bob = Math.sin(this.animTimer * 0.2) * 3;

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;

        ctx.save();
        ctx.translate(cx, cy);

        // Rotate based on facing
        let angle = 0;
        if (this.facing === "right") angle = Math.PI / 2;
        else if (this.facing === "left") angle = -Math.PI / 2;
        else if (this.facing === "down") angle = Math.PI;
        else if (this.facing === "up-right") angle = Math.PI / 4;
        else if (this.facing === "up-left") angle = -Math.PI / 4;
        else if (this.facing === "down-right") angle = (3 * Math.PI) / 4;
        else if (this.facing === "down-left") angle = -(3 * Math.PI) / 4;
        // up is 0 (default)

        ctx.rotate(angle);

        // Central Diamond (Relative to 0,0)
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 15);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();

        // Floating Wings (Triangles)
        ctx.beginPath();
        ctx.moveTo(-15, -5 + bob);
        ctx.lineTo(-25, bob);
        ctx.lineTo(-15, 5 + bob);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(15, -5 + bob);
        ctx.lineTo(25, bob);
        ctx.lineTo(15, 5 + bob);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;
    }
}

export class Knight extends Character {
    constructor(x, y, controls) {
        super(x, y, 60, 70, "blue", controls);
        this.type = "Knight";
        this.maxHealth = 150;
        this.health = this.maxHealth;
        this.attackPower = 25; // High damage single hit
        this.baseSpeed = 3;
        this.speed = this.baseSpeed;
        this.isRanged = false;
    }

    handleDefense(input) {
        if (input.isDown(this.controls.defend)) {
            this.speed = 0; // Rooted
            this.defenseStat = 1.0; // Invulnerable
            this.isDefending = true;
        } else {
            this.speed = this.baseSpeed;
            this.defenseStat = 0.2; // Passive armor
            this.isDefending = false;
        }
    }

    drawBody(ctx) {
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.save();
        ctx.translate(cx, cy);

        // Rotate based on facing
        let angle = 0;
        if (this.facing === "right") angle = -Math.PI / 2;
        else if (this.facing === "left") angle = Math.PI / 2;
        else if (this.facing === "up") angle = Math.PI;
        else if (this.facing === "up-right") angle = -(3 * Math.PI) / 4;
        else if (this.facing === "up-left") angle = (3 * Math.PI) / 4;
        else if (this.facing === "down-right") angle = -Math.PI / 4;
        else if (this.facing === "down-left") angle = Math.PI / 4;
        // down is 0 (default for shield shape pointing down)

        ctx.rotate(angle);

        // Shield Shape (Relative to 0,0)
        const w = this.width;
        const h = this.height;

        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2); // Top Left
        ctx.lineTo(w / 2, -h / 2); // Top Right
        ctx.lineTo(w / 2, h * 0.1); // Side Right
        ctx.lineTo(0, h / 2); // Bottom Point
        ctx.lineTo(-w / 2, h * 0.1); // Side Left
        ctx.closePath();
        ctx.fill();

        // Cross Detail
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(-5, -h / 2 + 10, 10, h - 30);
        ctx.fillRect(-w / 2 + 10, -10, w - 20, 10);

        // Mace/Hammer
        ctx.save();
        let maceAngle = 0.8;
        if (this.isAttacking) maceAngle = Math.sin(this.animTimer * 0.5) * 1.5;
        ctx.rotate(maceAngle);

        ctx.fillStyle = "#555";
        ctx.fillRect(10, -2, 30, 4); // Handle
        ctx.fillStyle = "#333";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(40, 0, 12, 0, Math.PI * 2); // Mace Head
        ctx.fill();

        // Spikes
        ctx.fillStyle = "#777";
        for (let i = 0; i < 8; i++) {
            const sa = (i * Math.PI * 2) / 8;
            ctx.beginPath();
            ctx.arc(
                40 + Math.cos(sa) * 12,
                Math.sin(sa) * 12,
                3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();

        ctx.restore();
        ctx.shadowBlur = 0;
    }

    draw(ctx) {
        super.draw(ctx);
        if (this.isDefending) {
            // Draw Shield Wall
            ctx.save();
            ctx.shadowColor = "cyan";
            ctx.shadowBlur = 20;
            ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
            ctx.fillRect(
                this.x - 10,
                this.y - 10,
                this.width + 20,
                this.height + 20
            );
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                this.x - 10,
                this.y - 10,
                this.width + 20,
                this.height + 20
            );
            ctx.restore();
        }
    }
}
