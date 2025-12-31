import { Character } from "./Character.js";
import { Projectile } from "./Projectile.js";

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
        let velocity = { x: 0, y: 0 };
        let startX = this.x;
        let startY = this.y;

        switch (this.facing) {
            case "right":
                velocity.x = 12;
                startX += this.width;
                startY += 20;
                break;
            case "left":
                velocity.x = -12;
                startX -= 20;
                startY += 20;
                break;
            case "up":
                velocity.y = -12;
                startX += 10;
                startY -= 20;
                break;
            case "down":
                velocity.y = 12;
                startX += 10;
                startY += this.height;
                break;
        }

        const projectile = new Projectile(
            startX,
            startY,
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
        this.attackTimer = this.cooldownTime;
        setTimeout(() => {
            this.isAttacking = false;
        }, 100);

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
            }

            const projectile = new Projectile(
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

        // Central Diamond
        ctx.beginPath();
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx + 10, cy);
        ctx.lineTo(cx, cy + 15);
        ctx.lineTo(cx - 10, cy);
        ctx.closePath();
        ctx.fill();

        // Floating Wings (Triangles)
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy - 5 + bob);
        ctx.lineTo(cx - 25, cy + bob);
        ctx.lineTo(cx - 15, cy + 5 + bob);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx + 15, cy - 5 + bob);
        ctx.lineTo(cx + 25, cy + bob);
        ctx.lineTo(cx + 15, cy + 5 + bob);
        ctx.fill();

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

        // Shield Shape
        ctx.beginPath();
        ctx.moveTo(this.x, this.y); // Top Left
        ctx.lineTo(this.x + this.width, this.y); // Top Right
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.6); // Side Right
        ctx.lineTo(cx, this.y + this.height); // Bottom Point
        ctx.lineTo(this.x, this.y + this.height * 0.6); // Side Left
        ctx.closePath();
        ctx.fill();

        // Cross Detail
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fillRect(cx - 5, this.y + 10, 10, this.height - 30);
        ctx.fillRect(this.x + 10, cy - 10, this.width - 20, 10);

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
