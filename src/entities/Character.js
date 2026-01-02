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
        this.attackActiveTimer = 0; // Frames the attack is visually active
        this.attackDuration = 20; // Frames
        this.cooldownTime = 40; // Frames
        this.hasHit = false; // To prevent multiple hits in one swing

        // Hitbox for melee
        this.attackBox = {
            position: { x: this.x, y: this.y },
            width: 50,
            height: 50,
            offset: { x: 0, y: 0 },
        };

        // Animation
        this.animTimer = 0;
    }

    update(input, gameWidth, gameHeight, obstacles, slowZones, enemy, game) {
        this.animTimer++;
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
        let dx = 0;
        let dy = 0;

        if (input.isDown(this.controls.left)) {
            this.velocity.x = -this.speed;
            dx = -1;
        } else if (input.isDown(this.controls.right)) {
            this.velocity.x = this.speed;
            dx = 1;
        }

        if (input.isDown(this.controls.up)) {
            this.velocity.y = -this.speed;
            dy = -1;
        } else if (input.isDown(this.controls.down)) {
            this.velocity.y = this.speed;
            dy = 1;
        }

        // Update Facing
        if (dx !== 0 || dy !== 0) {
            if (dx === 1 && dy === 0) this.facing = "right";
            else if (dx === -1 && dy === 0) this.facing = "left";
            else if (dx === 0 && dy === -1) this.facing = "up";
            else if (dx === 0 && dy === 1) this.facing = "down";
            else if (dx === 1 && dy === -1) this.facing = "up-right";
            else if (dx === -1 && dy === -1) this.facing = "up-left";
            else if (dx === 1 && dy === 1) this.facing = "down-right";
            else if (dx === -1 && dy === 1) this.facing = "down-left";
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
            case "up-right":
                this.attackBox.width = 50;
                this.attackBox.height = 50;
                this.attackBox.position.x = this.x + this.width;
                this.attackBox.position.y = this.y - 25;
                break;
            case "up-left":
                this.attackBox.width = 50;
                this.attackBox.height = 50;
                this.attackBox.position.x = this.x - 50;
                this.attackBox.position.y = this.y - 25;
                break;
            case "down-right":
                this.attackBox.width = 50;
                this.attackBox.height = 50;
                this.attackBox.position.x = this.x + this.width;
                this.attackBox.position.y = this.y + this.height - 25;
                break;
            case "down-left":
                this.attackBox.width = 50;
                this.attackBox.height = 50;
                this.attackBox.position.x = this.x - 50;
                this.attackBox.position.y = this.y + this.height - 25;
                break;
        }
    }

    attack(game) {
        this.isAttacking = true;
        this.hasHit = false;
        this.attackActiveTimer = this.attackDuration;
        this.attackTimer = this.cooldownTime;
    }

    handleCombat(enemy, game) {
        if (this.attackTimer > 0) this.attackTimer--;
        if (this.attackActiveTimer > 0) {
            this.attackActiveTimer--;
            if (this.attackActiveTimer === 0) {
                this.isAttacking = false;
            }
        }

        // Melee collision check (only if attacking and melee type)
        if (this.isAttacking && !this.isRanged && !this.hasHit) {
            const hitBox = {
                x: this.attackBox.position.x,
                y: this.attackBox.position.y,
                width: this.attackBox.width,
                height: this.attackBox.height,
            };

            if (Collision.checkAABB(hitBox, enemy)) {
                enemy.takeDamage(this.attackPower);
                this.hasHit = true;
                // We don't set isAttacking = false here so the animation finishes
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
        ctx.save();

        // Hit Flash Effect
        if (this.hitFlash > 0) {
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "white";
            this.hitFlash--;
        } else {
            ctx.fillStyle = this.color;
        }

        // Draw the specific character shape
        this.drawBody(ctx);

        ctx.restore();

        // Draw Attack Visual (Melee)
        if (this.isAttacking && !this.isRanged) {
            this.drawMeleeAttack(ctx);
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

    drawMeleeAttack(ctx) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 10;

        const bx = this.attackBox.position.x + this.attackBox.width / 2;
        const by = this.attackBox.position.y + this.attackBox.height / 2;

        ctx.beginPath();
        if (this.facing === "right" || this.facing === "left") {
            ctx.moveTo(bx, by - 20);
            ctx.lineTo(bx, by + 20);
        } else {
            ctx.moveTo(bx - 20, by);
            ctx.lineTo(bx + 20, by);
        }
        ctx.stroke();
        ctx.restore();
    }

    drawBody(ctx) {
        // Default implementation (Rectangle)
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        if (this.hitFlash > 0) ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = "white";
        const eyeSize = 5;

        let eyeX1, eyeY1, eyeX2, eyeY2;

        if (this.facing === "right") {
            eyeX1 = this.x + this.width - 10;
            eyeY1 = this.y + 10;
            eyeX2 = this.x + this.width - 10;
            eyeY2 = this.y + this.height - 15;
        } else if (this.facing === "left") {
            eyeX1 = this.x + 5;
            eyeY1 = this.y + 10;
            eyeX2 = this.x + 5;
            eyeY2 = this.y + this.height - 15;
        } else if (this.facing === "up") {
            eyeX1 = this.x + 10;
            eyeY1 = this.y + 5;
            eyeX2 = this.x + this.width - 15;
            eyeY2 = this.y + 5;
        } else {
            // down
            eyeX1 = this.x + 10;
            eyeY1 = this.y + this.height - 10;
            eyeX2 = this.x + this.width - 15;
            eyeY2 = this.y + this.height - 10;
        }

        ctx.fillRect(eyeX1, eyeY1, eyeSize, eyeSize);
        ctx.fillRect(eyeX2, eyeY2, eyeSize, eyeSize);
    }
}
