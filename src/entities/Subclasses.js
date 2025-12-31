import { Character } from "./Character.js";
import { Projectile } from "./Projectile.js";

export class Mage extends Character {
    constructor(x, y, controls) {
        super(x, y, 40, 60, "purple", controls);
        this.type = "Mage";
        this.maxHealth = 80;
        this.health = this.maxHealth;
        this.attackPower = 15;
        this.speed = 5;
        this.isRanged = true;
    }

    attack(game) {
        super.attack(game);
        let velocity = { x: 0, y: 0 };
        let startX = this.x;
        let startY = this.y;

        switch (this.facing) {
            case "right":
                velocity.x = 10;
                startX += this.width;
                startY += 20;
                break;
            case "left":
                velocity.x = -10;
                startX -= 20;
                startY += 20;
                break;
            case "up":
                velocity.y = -10;
                startX += 10;
                startY -= 20;
                break;
            case "down":
                velocity.y = 10;
                startX += 10;
                startY += this.height;
                break;
        }

        const projectile = new Projectile(
            startX,
            startY,
            velocity,
            20,
            20,
            "violet",
            this.attackPower,
            this
        );
        game.projectiles.push(projectile);
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
