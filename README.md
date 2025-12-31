# Wild Duels

A 2D local multiplayer combat game built with HTML5 Canvas and Vanilla JavaScript.

## How to Run

1. Open the project folder in VS Code.
2. Use a local server extension (like "Live Server") to serve `index.html`.
    - Alternatively, you can open `index.html` directly in a browser, but ES6 modules usually require a server context to avoid CORS issues.

## Controls

### Player 1 (Left Side)

-   **Move**: W / A / S / D
-   **Attack**: F
-   **Defend**: G

### Player 2 (Right Side)

-   **Move**: Arrow Keys (Up/Down/Left/Right)
-   **Attack**: K
-   **Defend**: L

## Game Mechanics

-   **Top-Down View**: Move freely in X and Y axes.
-   **Obstacles**: Grey walls block movement and projectiles.
-   **Slow Zones**: Blue areas (water/mud) slow you down.
-   **Health**: When it reaches 0, the player loses.
-   **Defense**: Holding the defend key reduces incoming damage.
-   **Classes**:
    -   **Warrior**: Balanced stats, melee range.
    -   **Mage**: Low health, high attack, ranged projectile.
    -   **Elf**: High speed, ranged projectile.
    -   **Knight**: High health/defense, low speed, melee range.
