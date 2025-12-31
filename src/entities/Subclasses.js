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

    draw(ctx) {
        super.draw(ctx);

        // Draw Fire Shield
        if (this.shieldActive) {
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
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.attackPower = 12;
        this.speed = 5;
        this.isRanged = false;
    }
}

export class Elf extends Character {
    constructor(x, y, controls) {
        super(x, y, 35, 55, "green", controls);
        this.type = "Elf";
        this.maxHealth = 90;
        this.health = this.maxHealth;
        this.attackPower = 8;
        this.speed = 8;
        this.isRanged = true;
    }

    attack(game) {
        super.attack(game);
        let velocity = { x: 0, y: 0 };
        let startX = this.x;
        let startY = this.y;
        let pWidth = 15;
        let pHeight = 5;

        switch (this.facing) {
            case "right":
                velocity.x = 15;
                startX += this.width;
                startY += 25;
                break;
            case "left":
                velocity.x = -15;
                startX -= 15;
                startY += 25;
                break;
            case "up":
                velocity.y = -15;
                startX += 10;
                startY -= 15;
                pWidth = 5;
                pHeight = 15; // Rotate projectile shape
                break;
            case "down":
                velocity.y = 15;
                startX += 10;
                startY += this.height;
                pWidth = 5;
                pHeight = 15;
                break;
        }

        const projectile = new Projectile(
            startX,
            startY,
            velocity,
            pWidth,
            pHeight,
            "lightgreen",
            this.attackPower,
            this
        );
        game.projectiles.push(projectile);
    }
}

export class Knight extends Character {
    constructor(x, y, controls) {
        super(x, y, 60, 70, "blue", controls);
        this.type = "Knight";
        this.maxHealth = 130;
        this.health = this.maxHealth;
        this.attackPower = 10;
        this.speed = 3;
        this.defenseStat = 0.5; // 50% damage reduction when defending
        this.isRanged = false;
    }
}
