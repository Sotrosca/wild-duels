import { Collision } from "../utils/Collision.js";

export class Projectile {
    constructor(x, y, velocity, width, height, color, damage, owner) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.width = width;
        this.height = height;
        this.color = color;
        this.damage = damage;
        this.owner = owner; // To avoid hitting self
        this.markedForDeletion = false;
    }

    update(gameWidth, gameHeight, obstacles, enemy) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Screen bounds
        if (
            this.x < 0 ||
            this.x > gameWidth ||
            this.y < 0 ||
            this.y > gameHeight
        ) {
            this.markedForDeletion = true;
        }

        // Collision with obstacles
        for (const obs of obstacles) {
            if (Collision.checkAABB(this, obs)) {
                this.markedForDeletion = true;
                break;
            }
        }

        // Collision with enemy
        if (Collision.checkAABB(this, enemy)) {
            enemy.takeDamage(this.damage);
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
