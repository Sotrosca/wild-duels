# Wild Duels: Character Design Guide

This document defines the standards for creating new characters and abilities in Wild Duels to maintain a consistent "Neon-Composite" aesthetic and balanced gameplay.

## 1. Visual Aesthetic: Composite Shapes

Characters are not sprites; they are built using **Canvas API primitives**.

### Core Principles:

-   **Geometric Construction**: Use `rect`, `arc`, `beginPath`, and `lineTo` to build the body and equipment.
-   **Neon Glow**: Every character must have a `shadowBlur` (usually 15-20px) matching their primary color.
-   **Directional Feedback**: Characters must visually indicate their `facing` direction (e.g., eyes, visors, or weapon orientation).
-   **Dynamic Breathing**: Use `this.animTimer` with `Math.sin()` to create "breathing" or pulsing effects in the `drawBody` method.

### Example `drawBody` Pattern:

```javascript
drawBody(ctx) {
    const breath = Math.sin(this.animTimer * 0.1) * 2;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;

    // Main Body
    ctx.fillRect(this.x, this.y + breath, this.width, this.height);

    // Directional Eyes
    ctx.fillStyle = "white";
    // ... logic to position eyes based on this.facing
}
```

## 2. Gameplay Balance (The Triangle)

New characters should fit into the balance triangle: **Health vs. Speed vs. Range/Power**.

| Archetype               | Health     | Speed    | Attack Power | Range          |
| :---------------------- | :--------- | :------- | :----------- | :------------- |
| **Tank** (Knight)       | High (150) | Low (3)  | High (25)    | Melee          |
| **Glass Cannon** (Mage) | Low (80)   | Mid (5)  | High (20)    | Ranged         |
| **Scout** (Elf)         | Mid (90)   | High (7) | Low (8)      | Ranged (Multi) |
| **Bruiser** (Warrior)   | Mid (110)  | Mid (5)  | Mid (15)     | Melee (AoE)    |

## 3. Code Structure

All characters must extend the `Character` class and implement:

1.  **`constructor`**: Define stats and call `super()`.
2.  **`handleDefense(input)`**: Define the unique defensive mechanic (Dash, Shield, Sprint, Invulnerability).
3.  **`drawBody(ctx)`**: The unique visual representation.
4.  **`attack(game)`**: (Optional) Override if the character has a unique attack pattern (like the Elf's triple shot).

## 4. Weapon Standards

-   **Melee Weapons**: Should be drawn relative to the character's center and rotate based on `isAttacking` and `facing`.
-   **Projectiles**: Should extend `Projectile` or a custom subclass and implement `drawShape(ctx)` for unique visuals (e.g., `Fireball`, `Arrow`).

## 5. Animation States

-   **Idle**: Subtle pulsing or breathing.
-   **Moving**: Can include slight bobbing.
-   **Attacking**: Fast rotation or translation of weapons.
-   **Defending**: Visual overlay (shields, aura) and state-specific changes (rooted, speed boost).
-   **Hit**: Handled by the base class `hitFlash` (white flash).
