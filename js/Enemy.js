// Enemy.js

import Bomb from './Bomb.js';

// —————————— Konstanty pro ořez a animaci ——————————
const TOP_BORDER      = 20;   // pixely nad začátkem první řady buněk
const GRID_LINE       = 2;    // pixely mezi buňkami v sheetu
const FRAME_W         = 110;  // šířka jedné buňky
const FRAME_H         = 110;  // výška jedné buňky
const ANIM_DELAY      = 75;  // ms mezi snímky animace

// kolik snímků má každá animace (vždy 4, dle vybraných řádků)
const FRAMES_PER_DIR  = { down:4, right:4, up:4, left:4 };

// na jakém (0-based) řádku sheetu jsou animace pro jednotlivé směry
// (podle vybraných řádků 1,3,5,7)
const ROW_FOR_DIR     = { down:1, right:3, up:5, left:7 };

export default class Enemy {
    static sheet; // přiřadí game.js v onload

    constructor(x, y, color, map, bombs, explosions, player, moveDelay, bombTimer) {
        this.x           = x;
        this.y           = y;
        this.color       = color;
        this.map         = map;
        this.bombs       = bombs;
        this.explosions  = explosions;
        this.player      = player;
        this.moveDelay   = moveDelay;
        this.bombTimer   = bombTimer;

        this.moveTimer       = 0;     // čas od posledního pokusu o krok (ms)
        this.evadeTimer      = 0;     // čas zbývající v únikovém modu (ms)
        this.evading         = false; // zda právě utíká z exploze
        this.hasActiveBomb   = false; // znak, že už má položenu bombu

        // animace
        this.dir             = 'down'; // výchozí směr
        this.frame           = 0;      // index anim. snímku (0…FRAMES_PER_DIR[this.dir]-1)
        this._animTime       = 0;      // akumulovaný čas pro animaci (ms)
        this._animatingSteps = 0;      // zbývající počet snímků k přehrání
    }

    /**
     * @param {number} dt    čas od posledního frame v ms
     */
    update(dt) {
        // 1) Evade logic
        if (this.evading) {
            this.evadeTimer -= dt;
            if (this.evadeTimer <= 0) this.evading = false;
            // i když utíká, necháme mu doběhnout animaci (moved = false)
        }

        // 2) Run from explosion if standing on one
        if (!this.evading && this.explosions.some(e => e.x === this.x && e.y === this.y)) {
            this._evade();
            return;
        }

        // 3) Place bomb next to destructible
        if (!this.hasActiveBomb && this._adjacentDestructible()) {
            Bomb.place(this, this.map, this.bombs, this.explosions, this.bombTimer);
            this._evade();
            return;
        }

        // 4) Place bomb if sees player
        if (!this.hasActiveBomb && this._canSeePlayer()) {
            Bomb.place(this, this.map, this.bombs, this.explosions, this.bombTimer);
            this._evade();
            return;
        }

        // 5) Movement and animation
        this.moveTimer += dt;
        let moved = false;
        let dx = 0, dy = 0, newDir = this.dir;

        if (!this.evading && this.moveTimer >= this.moveDelay) {
            this.moveTimer = 0;
            const dirs = this._safeDirections();
            if (dirs.length) {
                const m = dirs[Math.floor(Math.random() * dirs.length)];
                dx = m.dx;
                dy = m.dy;
                newDir = dx === 1  ? 'right'
                    : dx === -1 ? 'left'
                        : dy === 1  ? 'down'
                            :             'up';

                const nx = this.x + dx;
                const ny = this.y + dy;
                if (this.map.isWalkable(nx, ny)) {
                    this.x = nx;
                    this.y = ny;
                    this.dir = newDir;
                    moved = true;
                }
            }
        }

        // if we moved one tile, schedule full animation cycle
        if (moved) {
            this._animatingSteps = FRAMES_PER_DIR[this.dir];
            this._animTime       = 0;
            this.frame           = 0;
        }

        // run animation frames even if no new input
        if (this._animatingSteps > 0) {
            this._animTime += dt;
            if (this._animTime >= ANIM_DELAY) {
                this._animTime -= ANIM_DELAY;
                this.frame = (this.frame + 1) % FRAMES_PER_DIR[this.dir];
                this._animatingSteps--;
            }
        } else {
            // no animation queued → reset to first frame
            this.frame = 0;
        }
    }

    draw(ctx, tileSize) {
        if (!Enemy.sheet) {
            // fallback: barevný čtverec
            ctx.fillStyle = this.color;
            ctx.fillRect(
                this.x * tileSize,
                this.y * tileSize,
                tileSize, tileSize
            );
            return;
        }

        ctx.save();
        // obarvíme dle barvy nepřítele
        ctx.filter = `hue-rotate(${this._hueRotate()}deg)`;

        const row = ROW_FOR_DIR[this.dir];
        const sx  = GRID_LINE + this.frame * (FRAME_W  + GRID_LINE);
        const sy  = TOP_BORDER + row   * (FRAME_H  + GRID_LINE);

        ctx.drawImage(
            Enemy.sheet,
            sx,  sy,
            FRAME_W, FRAME_H,
            this.x * tileSize,
            this.y * tileSize,
            tileSize, tileSize
        );

        ctx.restore();
    }

    /** Returns true if any explosion overlaps this enemy */
    isHitByExplosion(explosionTiles) {
        return explosionTiles.some(tile => tile.x === this.x && tile.y === this.y);
    }

    _adjacentDestructible() {
        const rows = this.map.rows;
        const cols = this.map.cols;
        return [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ].some(({ dx, dy }) => {
            const nx = this.x + dx;
            const ny = this.y + dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false;
            return this.map.data[ny][nx] === 2;
        });
    }

    _canSeePlayer() {
        if (this.x === this.player.x) {
            const [y1, y2] = [this.y, this.player.y].sort((a, b) => a - b);
            for (let y = y1 + 1; y < y2; y++) {
                if (!this.map.isWalkable(this.x, y)) return false;
            }
            return true;
        }
        if (this.y === this.player.y) {
            const [x1, x2] = [this.x, this.player.x].sort((a, b) => a - b);
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
        ].filter(({ dx, dy }) => {
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
        this.evading   = true;
        this.evadeTimer = 1000;
    }

    _hueRotate() {
        switch (this.color) {
            case 'green': return 120;
            case 'blue':  return 240;
            case 'red':   return   0;
            default:      return   0;
        }
    }
}
