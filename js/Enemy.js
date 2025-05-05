import { Bomb } from "./Bomb.js";




export class Enemy {
    constructor(x, y, color, map, gameState) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.map = map;
        this.gameState = gameState;

        this.moveTimer = 0;
        this.bombCooldown = Math.random() * 2000 + 2000; // 2–4s
        this.timeSinceLastBomb = 0;
        this.hasActiveBomb = false;

        this.evading = false;
        this.evadeTimer = 1500;


    }

    draw(ctx, tileSize) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc((this.x + 0.5) * tileSize, (this.y + 0.5) * tileSize, tileSize / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    update(deltaTime, map) {
        this.moveTimer += deltaTime;

        // 0. Pamatuj, jestli stále utika
        if (this.evading) {
            this.evadeTimer -= deltaTime;
            if (this.evadeTimer <= 0) {
                this.evading = false;
            } else {
                return; // nedelj nic jineho behem uteku
            }
        }

        // 1. Pokud hrozí vybuch – utikej a konec update
        if (this.isInDanger(this.gameState.explosionTiles)) {
            this.tryEvade(map, this.gameState.explosionTiles);
            return;
        }

        // 2. Pokud vidí zničitelný blok a má možnost úniku, položí bombu a uteče
        if (this.getDestructibleBlockInRange(map) && !this.hasActiveBomb) {
            const exists = this.gameState.bombs.some(b => b.x === this.x && b.y === this.y);
            const safeDirs = this.getSafeDirections(map, this.gameState.explosionTiles);
            if (!exists && safeDirs.length > 0) {
                this.gameState.bombs.push(new Bomb(this.x, this.y, map, this));
                this.hasActiveBomb = true;
                this.tryEvade(map, this.gameState.explosionTiles);
                return;
            }
        }

        // 3. Položí bombu, pokud vidí hráče a má kam utéct
        if (this.canSeePlayer(this.gameState.player, map) && !this.hasActiveBomb) {
            const exists = this.gameState.bombs.some(b => b.x === this.x && b.y === this.y);
            const safeDirs = this.getSafeDirections(map, this.gameState.explosionTiles);
            if (!exists && safeDirs.length > 0) {
                this.gameState.bombs.push(new Bomb(this.x, this.y, map, this));
                this.hasActiveBomb = true;
                this.tryEvade(map, this.gameState.explosionTiles);
                return;
            }
        }

        // 4. Náhodný pohyb – ale jen pokud není ohrožen
        if (this.moveTimer > 500) {
            this.moveTimer = 0;
            const dirs = this.getSafeDirections(map, this.gameState.explosionTiles);
            if (dirs.length > 0) {
                const move = dirs[Math.floor(Math.random() * dirs.length)];
                this.x += move.dx;
                this.y += move.dy;
            }
        }


    }


    tryDropBomb(deltaTime, map) {
        if (this.hasActiveBomb) {
            return;
        }

        this.timeSinceLastBomb += deltaTime;
        if (this.timeSinceLastBomb >= this.bombCooldown) {
            const exists = this.gameState.bombs.some(b => b.x === this.x && b.y === this.y);
            if (!exists) {
                this.gameState.bombs.push(new Bomb(this.x, this.y, map));
                this.timeSinceLastBomb = 0;
                this.bombCooldown = Math.random() * 2000 + 2000;
            }
        }

    }

    isInDanger(explosions) {
        return explosions.some(tile => tile.x === this.x && tile.y === this.y);
    }

    getSafeDirections(map, explosions) {
        const directions = [
            {dx: 0, dy: -1},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 1, dy: 0}
        ];
        return directions.filter(dir => {
            const nx = this.x + dir.dx;
            const ny = this.y + dir.dy;
            return map.isWalkable(nx, ny) &&
                !explosions.some(e => e.x === nx && e.y === ny);
        });
    }

    tryEvade(map, explosions) {
        const safeDirs = this.getSafeDirections(map, explosions);
        if (safeDirs.length > 0) {
            const move = safeDirs[Math.floor(Math.random() * safeDirs.length)];
            this.x += move.dx;
            this.y += move.dy;

            this.evading = true;
            this.evadeTimer = 1000; // 1 sekunda vyhýbání
        }
    }


    canSeePlayer(player, map) {
        if (this.x === player.x) {
            const y1 = Math.min(this.y, player.y);
            const y2 = Math.max(this.y, player.y);
            for (let y = y1 + 1; y < y2; y++) {
                if (!map.isWalkable(this.x, y)) return false;
            }
            return true;
        }
        if (this.y === player.y) {
            const x1 = Math.min(this.x, player.x);
            const x2 = Math.max(this.x, player.x);
            for (let x = x1 + 1; x < x2; x++) {
                if (!map.isWalkable(x, this.y)) return false;
            }
            return true;
        }
        return false;
    }

    getDestructibleBlockInRange(map) {
        const dirs = [
            {dx: 0, dy: -1},
            {dx: 0, dy: 1},
            {dx: -1, dy: 0},
            {dx: 1, dy: 0}
        ];
        for (const dir of dirs) {
            const tx = this.x + dir.dx;
            const ty = this.y + dir.dy;
            if (tx >= 0 && tx < this.map.data[0].length && ty >= 0 && ty < this.map.data.length) {
                if (map.data[ty][tx] === 2) return true;
            }
        }
        return false;
    }


    canSeeDestructibleBlock(map) {
        // horizontalne
        for (let x = this.x - 1; x >= 0; x--) {
            if (map.data[this.y][x] === 1) break;
            if (map.data[this.y][x] === 2) return true;
        }
        for (let x = this.x + 1; x < this.map.data[0].length; x++) {
            if (map.data[this.y][x] === 1) break;
            if (map.data[this.y][x] === 2) return true;
        }

        // vertikalne
        for (let y = this.y - 1; y >= 0; y--) {
            if (map.data[y][this.x] === 1) break;
            if (map.data[y][this.x] === 2) return true;
        }
        for (let y = this.y + 1; y < this.map.data.length; y++) {
            if (map.data[y][this.x] === 1) break;
            if (map.data[y][this.x] === 2) return true;
        }

        return false;
    }

    isHitByExplosion(explosionTiles){
        return explosionTiles.some(tile => tile.x === this.x && tile.y === this.y)
    }
}