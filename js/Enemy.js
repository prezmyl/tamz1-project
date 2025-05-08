// Enemy.js
import Bomb from './Bomb.js';

export default class Enemy {
    constructor(x, y, color, map, bombs, explosions, player, moveDelay, bombTimer) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.map = map;
        this.bombs = bombs;
        this.explosions = explosions;
        this.player = player;

        this.bombTimer = bombTimer;
        this.moveTimer = 0;
        this.evadeTimer = 1500;
        this.moveDelay = moveDelay;

        this.evading = false;
        this.hasActiveBomb = false;
    }

    update(delta) {
        this.moveTimer += delta;


        // 0) most prio by order -> run if you are evading
        if (this.evading) {
            this.evadeTimer -= delta;
            if (this.evadeTimer <= 0) this.evading = false;
            return;
        }

        // 1) if on an explosion tile -> evade
        if (this.explosions.some(e => e.x === this.x && e.y === this.y)) {
            this._evade();
            return;
        }

        // 2) destructible block adjacent? -> place bomb + evade
        if (!this.hasActiveBomb && this._adjacentDestructible()) {
            Bomb.place(this, this.map, this.bombs, this.explosions, this.bombTimer);
            this._evade();
            return;
        }

        // 3) sees player in straight line? -> place bomb + evade
        if (!this.hasActiveBomb && this._canSeePlayer()) {
            Bomb.place(this, this.map, this.bombs, this.explosions, this.bombTimer);
            this._evade();
            return;
        }

        // 4) random move every 500ms
        if (this.moveTimer >= this.moveDelay) {
            this.moveTimer = 0;
            const dirs = this._safeDirections();
            if (dirs.length) {
                const m = dirs[Math.floor(Math.random() * dirs.length)];
                this.x += m.dx;
                this.y += m.dy;
            }
        }
    }

    draw(ctx, tileSize) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        ctx.fill();
    }

    /** Returns true if any explosion overlaps this enemy */
    isHitByExplosion(explosionTiles) {
        return explosionTiles.some(tile => tile.x === this.x && tile.y === this.y);
    }

    // --- internal helpers ---
    _adjacentDestructible() {
        const rows = this.map.rows;
        const cols = this.map.cols;
        return [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ].some(({dx, dy}) => {
            const nx = this.x + dx;
            const ny = this.y + dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false;
            return this.map.data[ny][nx] === 2;
        });
    }

    _canSeePlayer() {
        if (this.x === this.player.x) {
            const [y1, y2] = [this.y, this.player.y].sort((a,b) => a-b);
            for (let y = y1 + 1; y < y2; y++) {
                if (!this.map.isWalkable(this.x, y)) return false;
            }
            return true;
        }
        if (this.y === this.player.y) {
            const [x1, x2] = [this.x, this.player.x].sort((a,b) => a-b);
            for (let x = x1 + 1; x < x2; x++) {
                if (!this.map.isWalkable(x, this.y)) return false;
            }
            return true;
        }
        return false;
    }

    _safeDirections() {
        const rows = this.map.rows;
        const cols = this.map.cols;
        return [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ].filter(({dx, dy}) => {
            const nx = this.x + dx;
            const ny = this.y + dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false;
            return this.map.isWalkable(nx, ny)
                && !this.explosions.some(e => e.x === nx && e.y === ny);
        });
    }

    _evade() {
        const dirs = this._safeDirections();
        if (!dirs.length) return;
        const m = dirs[Math.floor(Math.random() * dirs.length)];
        this.x += m.dx;
        this.y += m.dy;
        this.evading = true;
        this.evadeTimer = 1000;
    }


}



