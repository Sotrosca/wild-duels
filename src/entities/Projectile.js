import { Collision } from "../utils/Collision.js";
import { Particle } from "../utils/Particle.js";

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

    update(gameWidth, gameHeight, obstacles, enemy, game) {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Spawn Trail Particles
        if (Math.random() < 0.5) {
            game.particles.push(
                new Particle(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    Math.random() * 3 + 1,
                    this.color,
                    { x: Math.random() - 0.5, y: Math.random() - 0.5 }
                )
            );
        }

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
                game.createExplosion(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    this.color,
                    5
                );
                break;
            }
        }

        // Collision with enemy
        if (Collision.checkAABB(this, enemy)) {
            enemy.takeDamage(this.damage);
            this.markedForDeletion = true;
            game.createExplosion(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.color,
                10
            );
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}
