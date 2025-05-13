// Enemy.js

import Bomb from './Bomb.js';

// —————— Konstanty pro animaci a pohyb ——————
const TOP_BORDER       = 20;    // pixely nad první řadou buněk v atlasu
const GRID_LINE        = 2;     // pixely mezi buňkami
const FRAME_W          = 110;   // šířka jedné buňky
const FRAME_H          = 110;   // výška jedné buňky
const MOVE_SPEED       = 80;    // px/s – základní rychlost pohybu
const EVADE_SPEED_MULT = 2;     // násobek rychlosti při útěku
const MOVE_DELAY       = 500;   // ms mezi normálními kroky
const ANIM_DELAY       = 150;   // ms mezi snímky animace

// počet snímků ve vybrané části atlasu pro každý směr
const FRAMES_PER_DIR = { down: 11, left: 11, right: 11, up: 11 };
// index řádku v atlasu, kde je každá směrová animace
const ROW_FOR_DIR    = { down: 0, left: 6, right: 2, up: 4 };

export default class Enemy {
    static sheet;  // přiřadí se z game.js vedle Player.sheet

    /**
     * @param {number} xTile   výchozí X v dlaždicích
     * @param {number} yTile   výchozí Y v dlaždicích
     * @param {string} color
     * @param {GameMap} map
     * @param {Bomb[]} bombs
     * @param {{x:number,y:number,time:number}[]} explosions
     * @param {Player} player
     * @param {number} moveDelay
     * @param {number} bombTimer
     * @param {number} tileSize
     */
    constructor(xTile, yTile, color,
                map, bombs, explosions,
                player, moveDelay, bombTimer,
                tileSize) {
        // gridové souřadnice
        this.xTile         = xTile;
        this.yTile         = yTile;
        this.tileSize      = tileSize;

        // pixelové souřadnice
        this.x             = xTile * tileSize;
        this.y             = yTile * tileSize;
        this.startX        = this.x;
        this.startY        = this.y;
        this.targetX       = this.x;
        this.targetY       = this.y;
        this.moving        = false;

        // reference do herních objektů
        this.color         = color;
        this.map           = map;
        this.bombs         = bombs;
        this.explosions    = explosions;
        this.player        = player;

        // timery a stavy
        this.moveDelay     = moveDelay;
        this.moveTimer     = 0;
        this.bombTimer     = bombTimer;
        this.evading       = false;
        this.evadeTimer    = 0;
        this.hasActiveBomb = false;

        // animace
        this.dir           = 'down';
        this.frame         = 0;
        this._animTime     = 0;

        // pro útěk od poslední položení bomby
        this.lastBombTile  = null; // { x:…, y:… }
    }

    /**
     * @param {number} dt  ms od posledního frame
     */
    update(dt) {
        // 1) sníž evasion timer
        if (this.evading) {
            this.evadeTimer -= dt;
            if (this.evadeTimer <= 0) {
                this.evading = false;
                this.lastBombTile = null;
            }
        }

        // 2) pokud stojíme na explozi, vyvolat útěk
        if (!this.evading &&
            this.explosions.some(e => e.x === this.xTile && e.y === this.yTile)) {
            this._evade(this.xTile, this.yTile);
            return;
        }

        // 3) polož bombu u vedlejší zničitelné dlaždice
        if (!this.hasActiveBomb && this._adjacentDestructible()) {
            Bomb.place(this, this.map, this.bombs, this.explosions, this.bombTimer);
            this._evade(this.xTile, this.yTile);
            return;
        }

        // 4) polož bombu, když vidí hráče
        if (!this.hasActiveBomb && this._canSeePlayer()) {
            Bomb.place(this, this.map, this.bombs, this.explosions, this.bombTimer);
            this._evade(this.xTile, this.yTile);
            return;
        }

        // 5) plánování dalšího kroku
        if (!this.moving) {
            // zvýš timer pokud neevadujeme, jinak planuj ihned
            if (this.evading || (this.moveTimer += dt) >= this.moveDelay) {
                this.moveTimer = 0;

                // zjisti možné směry
                let dirs = this._safeDirections();

                if (this.evading && this.lastBombTile) {
                    // řaď podle vzdálenosti od poslední bomby
                    dirs = this._rankByBombDistance(dirs);
                } else {
                    // nekdyž nejde o útěk, zamíchej pro náhodný pohyb
                    dirs = this._shuffle(dirs);
                }

                if (dirs.length) {
                    const m = dirs[0];  // nejlepší nebo náhodná volba
                    const nx = this.xTile + m.dx;
                    const ny = this.yTile + m.dy;

                    if (this.map.isWalkable(nx, ny)) {
                        // grid coords hned aktualizuj pro logiku
                        this.xTile = nx;
                        this.yTile = ny;

                        // naplánuj pixelovou interpolaci
                        this.startX  = this.x;
                        this.startY  = this.y;
                        this.targetX = nx * this.tileSize;
                        this.targetY = ny * this.tileSize;
                        this.dir     = m.dx ===  1 ? 'right'
                            : m.dx === -1 ? 'left'
                                : m.dy ===  1 ? 'down'
                                    : 'up';
                        this.moving = true;
                    }
                }
            }
        }

        // 6) interpolace a animace
        if (this.moving) {
            const speed = this.evading
                ? MOVE_SPEED * EVADE_SPEED_MULT
                : MOVE_SPEED;
            const step = speed * dt / 1000;

            // posun v pixelech
            if (this.x < this.targetX) this.x = Math.min(this.x + step, this.targetX);
            else if (this.x > this.targetX) this.x = Math.max(this.x - step, this.targetX);
            if (this.y < this.targetY) this.y = Math.min(this.y + step, this.targetY);
            else if (this.y > this.targetY) this.y = Math.max(this.y - step, this.targetY);

            // spočti progres (0…1) a nastav frame
            const prog = Math.abs(
                (this.dir === 'left' || this.dir === 'right')
                    ? (this.x - this.startX) / this.tileSize
                    : (this.y - this.startY) / this.tileSize
            );
            this.frame = Math.min(
                Math.floor(prog * FRAMES_PER_DIR[this.dir]),
                FRAMES_PER_DIR[this.dir] - 1
            );

            // dokončení pohybu
            if (this.x === this.targetX && this.y === this.targetY) {
                this.moving = false;
                this.frame  = 0;
            }
        }
    }

    draw(ctx) {
        if (!Enemy.sheet) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.tileSize, this.tileSize);
            return;
        }

        ctx.save();
        ctx.filter = `hue-rotate(${this._hueRotate()}deg)`;

        const row = ROW_FOR_DIR[this.dir];
        const sx  = GRID_LINE + this.frame * (FRAME_W + GRID_LINE);
        const sy  = TOP_BORDER + row   * (FRAME_H + GRID_LINE);

        ctx.drawImage(
            Enemy.sheet,
            sx, sy, FRAME_W, FRAME_H,
            this.x, this.y,
            this.tileSize, this.tileSize
        );
        ctx.restore();
    }

    isHitByExplosion(explosions) {
        return explosions.some(e => e.x === this.xTile && e.y === this.yTile);
    }

    _adjacentDestructible() {
        return [ {dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1} ]
            .some(({dx,dy}) => {
                const x = this.xTile + dx, y = this.yTile + dy;
                return x>=0 && x<this.map.cols && y>=0 && y<this.map.rows
                    && this.map.data[y][x] === 2;
            });
    }

    _canSeePlayer() {
        if (this.xTile === this.player.xTile) {
            const [y1,y2] = [this.yTile,this.player.yTile].sort((a,b)=>a-b);
            for (let y = y1 + 1; y < y2; y++)
                if (!this.map.isWalkable(this.xTile, y)) return false;
            return true;
        }
        if (this.yTile === this.player.yTile) {
            const [x1,x2] = [this.xTile,this.player.xTile].sort((a,b)=>a-b);
            for (let x = x1 + 1; x < x2; x++)
                if (!this.map.isWalkable(x, this.yTile)) return false;
            return true;
        }
        return false;
    }

    _safeDirections() {
        return [ {dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1} ]
            .filter(({dx,dy}) => {
                const x = this.xTile + dx, y = this.yTile + dy;
                return x>=0 && x<this.map.cols && y>=0 && y<this.map.rows
                    && this.map.isWalkable(x, y)
                    && !this.explosions.some(e => e.x===x && e.y===y);
            });
    }

    _rankByBombDistance(dirs) {
        const { x: bx, y: by } = this.lastBombTile || {};
        return dirs.map(m => {
            const x = this.xTile + m.dx, y = this.yTile + m.dy;
            const dist = Math.abs(bx - x) + Math.abs(by - y);
            return { m, dist };
        })
            .sort((a, b) => b.dist - a.dist)
            .map(o => o.m);
    }

    _shuffle(arr) {
        // Fisher–Yates shuffle
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    _evade(bombX, bombY) {
        this.evading      = true;
        this.evadeTimer   = 1000;
        this.lastBombTile = { x: bombX, y: bombY };
        // první krok naplánuje update(), žádný teleport
    }

    _hueRotate() {
        switch(this.color) {
            case 'green': return 120;
            case 'blue':  return 240;
            case 'red':   return   0;
            default:      return   0;
        }
    }
}
