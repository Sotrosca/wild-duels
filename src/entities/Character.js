import { Collision } from "../utils/Collision.js";

export class Character {
    constructor(x, y, width, height, color, controls) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.controls = controls;

        // Physics
        this.velocity = { x: 0, y: 0 };
        this.speed = 5;
        this.friction = 0.8; // Not used for sliding, but for feel if needed

        // Stats
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.attackPower = 10;
        this.defenseStat = 0; // Percentage reduction (0-1)
        this.type = "Base";
        this.isRanged = false;

        // State
        this.isAttacking = false;
        this.isDefending = false;
        this.facing = "down"; // 'up', 'down', 'left', 'right'
        this.attackCooldown = 0;
        this.attackTimer = 0;
        this.attackDuration = 20; // Frames
        this.cooldownTime = 40; // Frames

        // Hitbox for melee
        this.attackBox = {
            position: { x: this.x, y: this.y },
            width: 50,
            height: 50,
            offset: { x: 0, y: 0 },
        };
    }

    update(input, gameWidth, gameHeight, obstacles, slowZones, enemy, game) {
        this.handleInput(input, game);
        this.applyPhysics(gameWidth, gameHeight, obstacles, slowZones);
        this.updateAttackBox();
        this.handleCombat(enemy, game);
    }

    handleInput(input, game) {
        this.velocity.x = 0;
        this.velocity.y = 0;

        if (this.isAttacking) return; // Stop movement while attacking (optional style choice)

        // Movement
        if (input.isDown(this.controls.left)) {
            this.velocity.x = -this.speed;
            this.facing = "left";
        } else if (input.isDown(this.controls.right)) {
            this.velocity.x = this.speed;
            this.facing = "right";
        }

        if (input.isDown(this.controls.up)) {
            this.velocity.y = -this.speed;
            this.facing = "up";
        } else if (input.isDown(this.controls.down)) {
            this.velocity.y = this.speed;
            this.facing = "down";
        }

        // Normalize diagonal movement
        if (this.velocity.x !== 0 && this.velocity.y !== 0) {
            this.velocity.x *= 0.707;
            this.velocity.y *= 0.707;
        }

        // Attack
        if (input.isDown(this.controls.attack) && this.attackTimer === 0) {
            this.attack(game);
        }

        this.handleDefense(input);
    }

    handleDefense(input) {
        // Defend
        this.isDefending = input.isDown(this.controls.defend);
    }

    applyPhysics(gameWidth, gameHeight, obstacles, slowZones) {
        let nextX = this.x + this.velocity.x;
        let nextY = this.y + this.velocity.y;

        // Check Slow Zones
        let speedFactor = 1;
        const center = {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
        };
        for (const zone of slowZones) {
            if (
                Collision.checkAABB(
                    { x: center.x, y: center.y, width: 1, height: 1 },
                    zone
                )
            ) {
                speedFactor = zone.factor;
                break;
            }
        }

        this.velocity.x *= speedFactor;
        this.velocity.y *= speedFactor;
        nextX = this.x + this.velocity.x;
        nextY = this.y + this.velocity.y;

        // Check Obstacle Collisions (X Axis)
        let collisionX = false;
        for (const obs of obstacles) {
            if (
                Collision.checkAABB(
                    {
                        x: nextX,
                        y: this.y,
                        width: this.width,
                        height: this.height,
                    },
                    obs
                )
            ) {
                collisionX = true;
                break;
            }
        }
        if (!collisionX) this.x = nextX;

        // Check Obstacle Collisions (Y Axis)
        let collisionY = false;
        for (const obs of obstacles) {
            if (
                Collision.checkAABB(
                    {
                        x: this.x,
                        y: nextY,
                        width: this.width,
                        height: this.height,
                    },
                    obs
                )
            ) {
                collisionY = true;
                break;
            }
        }
        if (!collisionY) this.y = nextY;

        // Screen Bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > gameWidth) this.x = gameWidth - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > gameHeight)
            this.y = gameHeight - this.height;
    }

    updateAttackBox() {
        // Reset offset
        this.attackBox.offset = { x: 0, y: 0 };

        switch (this.facing) {
            case "right":
                this.attackBox.width = 50;
                this.attackBox.height = this.height;
                this.attackBox.position.x = this.x + this.width;
                this.attackBox.position.y = this.y;
                break;
            case "left":
                this.attackBox.width = 50;
                this.attackBox.height = this.height;
                this.attackBox.position.x = this.x - 50;
                this.attackBox.position.y = this.y;
                break;
            case "up":
                this.attackBox.width = this.width;
                this.attackBox.height = 50;
                this.attackBox.position.x = this.x;
                this.attackBox.position.y = this.y - 50;
                break;
            case "down":
                this.attackBox.width = this.width;
                this.attackBox.height = 50;
                this.attackBox.position.x = this.x;
                this.attackBox.position.y = this.y + this.height;
                break;
        }
    }

    attack(game) {
        this.isAttacking = true;
        this.attackTimer = this.cooldownTime;
        setTimeout(() => {
            this.isAttacking = false;
        }, 100); // Attack active for 100ms
    }

    handleCombat(enemy, game) {
        if (this.attackTimer > 0) this.attackTimer--;

        // Melee collision check (only if attacking and melee type)
        if (this.isAttacking && !this.isRanged) {
            const hitBox = {
                x: this.attackBox.position.x,
                y: this.attackBox.position.y,
                width: this.attackBox.width,
                height: this.attackBox.height,
            };

            if (Collision.checkAABB(hitBox, enemy) && this.isAttacking) {
                // Ensure we only hit once per attack - simplified here by short duration
                // In a robust engine, we'd track 'hasHit' flag per attack instance
                enemy.takeDamage(this.attackPower);
                this.isAttacking = false; // Disable hitbox after hit
            }
        }
    }

    takeDamage(amount) {
        let damage = amount;
        if (this.isDefending) {
            damage *= 1 - this.defenseStat; // Reduce damage
        }
        this.health -= damage;
        if (this.health < 0) this.health = 0;

        // Visual Feedback
        this.hitFlash = 5; // Flash white for 5 frames
    }

    draw(ctx) {
        // Draw Body
        ctx.fillStyle = this.color;
        if (this.hitFlash > 0) {
            ctx.fillStyle = "white";
            this.hitFlash--;
        }

        // Shadow/Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0; // Reset
        // Draw Direction Indicator (Eyes)
        ctx.fillStyle = "white";
        const eyeSize = 5;
        if (this.facing === "right") {
            ctx.fillRect(
                this.x + this.width - 10,
                this.y + 10,
                eyeSize,
                eyeSize
            );
            ctx.fillRect(
                this.x + this.width - 10,
                this.y + this.height - 15,
                eyeSize,
                eyeSize
            );
        } else if (this.facing === "left") {
            ctx.fillRect(this.x + 5, this.y + 10, eyeSize, eyeSize);
            ctx.fillRect(
                this.x + 5,
                this.y + this.height - 15,
                eyeSize,
                eyeSize
            );
        } else if (this.facing === "up") {
            ctx.fillRect(this.x + 10, this.y + 5, eyeSize, eyeSize);
            ctx.fillRect(
                this.x + this.width - 15,
                this.y + 5,
                eyeSize,
                eyeSize
            );
        } else if (this.facing === "down") {
            ctx.fillRect(
                this.x + 10,
                this.y + this.height - 10,
                eyeSize,
                eyeSize
            );
            ctx.fillRect(
                this.x + this.width - 15,
                this.y + this.height - 10,
                eyeSize,
                eyeSize
            );
        }
        // Draw Attack Box (Debug/Visual)
        if (this.isAttacking && !this.isRanged) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(
                this.attackBox.position.x,
                this.attackBox.position.y,
                this.attackBox.width,
                this.attackBox.height
            );
        }

        // Draw Shield/Defend visual
        if (this.isDefending) {
            ctx.strokeStyle = "cyan";
            ctx.lineWidth = 3;
            ctx.strokeRect(
                this.x - 5,
                this.y - 5,
                this.width + 10,
                this.height + 10
            );
        }

        // Draw Health Bar above head
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y - 20, this.width, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(
            this.x,
            this.y - 20,
            this.width * (this.health / this.maxHealth),
            5
        );
    }
}
