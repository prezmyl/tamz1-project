// Enemy.js

import Bomb from './Bomb.js';
import { tickSound, boomSound } from '../game.js';

// ————— Konstanty pro animaci a pohyb —————
const TOP_BORDER       = 20;
const GRID_LINE        = 2;
const FRAME_W          = 110;
const FRAME_H          = 110;
const MOVE_SPEED       = 100;
const EVADE_SPEED_MULT = 2;
const MOVE_DELAY       = 500;
const ANIM_DELAY       = 150;
const ATTACK_RANGE = 5;
const DIRECTIONS       = [
    { dir:'up', dx:0, dy:-1 },
    { dir:'down', dx:0, dy:1 },
    { dir:'left', dx:-1, dy:0 },
    { dir:'right', dx:1, dy:0 }
];


const FRAMES_PER_DIR = { down: 11, left: 11, right: 11, up: 11 };

const ROW_FOR_DIR    = { down: 0, left: 6, right: 2, up: 4 };

export default class Enemy {
    static sheet;  // priradi se z game.js

    constructor(xTile, yTile, color,
                map, bombs, explosions,
                player, moveDelay, bombTimer,
                tileSize) {
        // grid coords
        this.xTile      = xTile;
        this.yTile      = yTile;
        this.tileSize   = tileSize;
        // pixel coords
        this.x          = xTile * tileSize;
        this.y          = yTile * tileSize;
        this.startX     = this.x;
        this.startY     = this.y;
        this.targetX    = this.x;
        this.targetY    = this.y;
        this.moving     = false;

        // game refs
        this.color      = color;
        this.map        = map;
        this.bombs      = bombs;
        this.explosions = explosions;
        this.player     = player;

        // state + timers
        this.moveTimer     = 0;
        this.bombTimer     = bombTimer;
        this.evading       = false;
        this.evadeTimer    = 0;
        this.hasActiveBomb = false;
        this.lastBombTile  = null;
        this._firstBombDelay = 700;

        // wander inertia
        this.preferredDir  = null;
        this.straightSteps = 0;

        // animation
        this.dir        = 'down';
        this.frame      = 0;
        this._animTime  = 0;
    }

    /**
     * @param {number} dt  ms od posledního volání
     */
    update(dt) {

        if (this._firstBombDelay > 0) {
            this._firstBombDelay -= dt;

            return this._interpolate(dt);
        }

        if (this._assessThreat(dt)) {
            this._interpolate(dt);
            return;
        }
        if (this._planAttack()) {
            this._interpolate(dt);
            return;
        }
        if (this._planMovement(dt)) {
            this._interpolate(dt);
            return;
        }
        this._interpolate(dt);
    }

    /** Predict all tiles that will be in a bomb's explosion range */
    _computeDangerZones() {
        const danger = new Set();
        for (const bomb of this.bombs) {

            const { x: bx, y: by, range = 1 } = bomb;

            danger.add(`${bx},${by}`);

            for (const {dx,dy} of DIRECTIONS) {
                for (let r = 1; r <= range; r++) {
                    const nx = bx + dx * r;
                    const ny = by + dy * r;

                    if (!this.map.isWalkable(nx, ny) && this.map.data[ny][nx] !== 2) break;
                    danger.add(`${nx},${ny}`);
                }
            }
        }
        return danger;
    }



    /** Returns list of safe directions considering current & future explosions */
    _safeDirections() {
        const danger = this._computeDangerZones();
        return DIRECTIONS.map(({dir,dx,dy}) => ({
            dir,
            nx: this.xTile + dx,
            ny: this.yTile + dy
        })).filter(({nx,ny}) =>

            this.map.isWalkable(nx, ny) &&
            !this.explosions.some(e => e.xTile === nx && e.yTile === ny) &&
            !danger.has(`${nx},${ny}`)
        );
    }

    _planMovement(dt) {
        // 1) akumulate cas
        this.moveTimer += dt;
        if (this.moveTimer < MOVE_DELAY) return false;
        this.moveTimer = 0;
        if (this.moving) return true;

        if (this._planEvade())      return true;
        if (this._planAttack())     return true;
        if (this._planIntercept())  return true;
        if (this._planChase())      return true;
        return this._planWander();
    }


    _planEvade() {
        if (!this.evading || !this.lastBombTile) return false;
        // 1) najdi, bombu co si polozil
        const bomb = this.bombs.find(b => b.x === this.lastBombTile.x && b.y === this.lastBombTile.y);
        if (!bomb) return false;
        const range = bomb.range || 1;
        const start = { x: this.xTile, y: this.yTile };
        const goalCheck = p =>
            Math.abs(p.x - bomb.x) + Math.abs(p.y - bomb.y) > range;

        // 2) vytvor set aktual expl
        const blocked = new Set(this.explosions.map(e => `${e.x},${e.y}`));

        // 3) BFS fronta
        const key   = p => `${p.x},${p.y}`;
        const seen  = new Set([key(start)]);
        const queue = [[ start ]];  // každá položka je cesta [ {x,y,dir?}, ... ]
        while (queue.length) {
            const path = queue.shift();
            const cur  = path[path.length - 1];

            // 4) pokud jsme mimo blast range, máme cíl!
            if (goalCheck(cur)) {
                // první krok z cesty:
                const next = path[1];
                this._startMoveTo(next.x, next.y, next.dir);
                return true;
            }

            // 5) expand sousedy
            for (const {dx,dy,dir} of DIRECTIONS) {
                const nx = cur.x + dx, ny = cur.y + dy;
                const k  = `${nx},${ny}`;
                if (seen.has(k))           continue;
                if (!this.map.isWalkable(nx, ny)) continue;
                if (blocked.has(k))        continue;
                seen.add(k);
                queue.push(path.concat({ x: nx, y: ny, dir }));
            }
        }


        return false;
    }




    /**
     * BFS-based chase: najde shortest safe path k hráči.
     */
    _planChase() {

        const blocking = new Set(
            this.explosions.map(e => `${e.x},${e.y}`)
            );
        for (const b of this.bombs) {
            blocking.add(`${b.x},${b.y}`);
        }

        const start  = { x: this.xTile, y: this.yTile };
        const target = { x: this.player.xTile, y: this.player.yTile };
        const path = bfsFindPath(start, target, this.map, blocking);

        if (!path || path.length < 2) return false;
        const next = path[1];
        this._startMoveTo(next.x, next.y, next.dir);
        return true;
    }




    _planWander() {
        const safeDirs = this._safeDirections();
        if (!safeDirs.length) return false;

        // inertia
        if (this.preferredDir && this.straightSteps > 0) {
            const cont = safeDirs.find(d => d.dir === this.preferredDir);
            if (cont) {
                this.straightSteps--;
                this._startMoveTo(cont.nx, cont.ny, cont.dir);
                return true;
            }
        }

        // fresh random
        const rnd = safeDirs[Math.floor(Math.random() * safeDirs.length)];
        this.preferredDir  = rnd.dir;
        this.straightSteps = 2;
        this._startMoveTo(rnd.nx, rnd.ny, rnd.dir);
        return true;
    }


    /**
     * Returns true if we handled threat (evading or waiting) and should stop update early
     */
    _assessThreat(dt) {
        // Decrease evade timer
        if (this.evading) {
            this.evadeTimer -= dt;
            if (this.evadeTimer <= 0) {
                this.evading = false;

            }
        }

        else if (this.lastBombTile) {
            const stillDanger = this.explosions.some(e =>
                e.x === this.lastBombTile.x && e.y === this.lastBombTile.y
            );
            if (stillDanger) return true;
            this.lastBombTile = null;
        }


        if (!this.evading &&
            this.explosions.some(e => e.x === this.xTile && e.y === this.yTile)) {
            this._evade(this.xTile, this.yTile);
            return true;
        }

        return false;
    }

    _planAttack() {
        if (this.hasActiveBomb || this.evading) return false;

        // 1) Adjacent‐destructible: only if existuje únik
        if (this._adjacentDestructible()) {
            if (!this._canEscapeAfterBomb(this.xTile, this.yTile, 1))
                return false;
            this._placeBomb();
            this._evade(this.xTile, this.yTile);
            return true;
        }

        // 2) LOS + vzdalenost ≤ ATTACK_RANGE: jen pokud pak mzuze utyct
        const dist = Math.abs(this.player.xTile - this.xTile)
            + Math.abs(this.player.yTile - this.yTile);
        if (this._canSeePlayer() && dist <= ATTACK_RANGE) {
            if (!this._canEscapeAfterBomb(this.xTile, this.yTile, 1))
                return false;
            this._placeBomb();
            this._evade(this.xTile, this.yTile);
            return true;
        }

        return false;
    }



    _canEscapeAfterBomb(x, y, range) {
        const startKey = `${x},${y}`;
        const visited  = new Set([startKey]);

        const queue    = [{ x, y }];

        while (queue.length) {
            const cur = queue.shift();

            const md = Math.abs(cur.x - x) + Math.abs(cur.y - y);
            if (md > range) {
                return true;
            }

            for (const {dx, dy} of DIRECTIONS) {
                const nx = cur.x + dx, ny = cur.y + dy;
                const key = `${nx},${ny}`;
                if (
                    !visited.has(key) &&
                    nx >= 0 && nx < this.map.cols &&
                    ny >= 0 && ny < this.map.rows &&
                    this.map.isWalkable(nx, ny)
                ) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                }
            }
        }

        return false;
    }



    _planIntercept() {
        const px = this.player.xTile, py = this.player.yTile;
        const start = { x: this.xTile, y: this.yTile };
        // blokujeme stejné jako při chase
        const blocking = new Set(this.explosions.map(e=>`${e.x},${e.y}`));
        for (const b of this.bombs) blocking.add(`${b.x},${b.y}`);

        let bestPath = null, bestScore = -Infinity;

        const targets = [{ x:px, y:py }];
        for (const {dx,dy} of DIRECTIONS) {
            const tx = px+dx, ty = py+dy;
            if (this.map.isWalkable(tx, ty)) targets.push({ x:tx, y:ty });
        }

        for (const t of targets) {
            const path = bfsFindPath(start, t, this.map, blocking);
            if (!path) continue;
            const dE = path.length;  // enemy cesta
            const dP = Math.abs(px - t.x) + Math.abs(py - t.y); // hráč Manhattan
            const score = dP - dE;
            if (score > bestScore) {
                bestScore = score;
                bestPath = path;
            }
        }

        if (!bestPath || bestPath.length < 2) return false;
        const step = bestPath[1];
        this._startMoveTo(step.x, step.y, step.dir);
        return true;
    }


    /** Convenience to place a bomb and mark state */
    _placeBomb() {

        if (this.hasActiveBomb) return;
        if (this.bombs.some(b => b.x===this.xTile && b.y===this.yTile && b.active))
            return;
        tickSound.currentTime = 0;
        tickSound.play().catch(()=>{});
        const bomb = new Bomb(
            this.xTile, this.yTile,
            this.map, this,
            this.explosions,
            this.bombTimer
        );
        this.bombs.push(bomb);
        this.hasActiveBomb = true;
    }




    /**
     * Initiate evasion state
     */
    _evade(bombX, bombY) {
        this.evading = true;
        this.evadeTimer = 1000;
        this.lastBombTile = { x: bombX, y: bombY };
        // dalsi update naplnje move
    }


    /**
     * Handles pixel interpolation and animation frame update
     */
    _interpolate(dt) {
        if (!this.moving) return;

        const speed = this.evading ? MOVE_SPEED * EVADE_SPEED_MULT : MOVE_SPEED;
        const step  = speed * dt / 1000;

        // Move on X axis
        if (this.x < this.targetX) this.x = Math.min(this.x + step, this.targetX);
        else if (this.x > this.targetX) this.x = Math.max(this.x - step, this.targetX);
        // Move on Y axis
        if (this.y < this.targetY) this.y = Math.min(this.y + step, this.targetY);
        else if (this.y > this.targetY) this.y = Math.max(this.y - step, this.targetY);


        const prog = Math.abs(
            (this.dir === 'left' || this.dir === 'right')
                ? (this.x - this.startX) / this.tileSize
                : (this.y - this.startY) / this.tileSize
        );
        this.frame = Math.min(
            Math.floor(prog * FRAMES_PER_DIR[this.dir]),
            FRAMES_PER_DIR[this.dir] - 1
        );


        if (this.x === this.targetX && this.y === this.targetY) {
            this.moving = false;
            this.frame  = 0;
        }
    }


    resetInterpolation() {
        this.x     = this.xTile * this.tileSize;
        this.y     = this.yTile * this.tileSize;
        this.startX  = this.x;
        this.startY  = this.y;
        this.targetX = this.x;
        this.targetY = this.y;
        this.moving  = false;
        this.frame   = 0;
        this._animTime = 0;
        this.evading = false;
    }




    /**
     * Prepare interpolation: set new tile position and pixel targets
     */
    _startMoveTo(nx, ny, direction) {
        this.xTile = nx;
        this.yTile = ny;
        this.startX  = this.x;
        this.startY  = this.y;
        this.targetX = nx * this.tileSize;
        this.targetY = ny * this.tileSize;
        this.dir     = direction;
        this.moving  = true;
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
        const sx  = GRID_LINE + this.frame*(FRAME_W+GRID_LINE);
        const sy  = TOP_BORDER + row*(FRAME_H+GRID_LINE);
        ctx.drawImage(
            Enemy.sheet,
            sx, sy, FRAME_W, FRAME_H,
            this.x, this.y, this.tileSize, this.tileSize
        );
        ctx.restore();
    }

    isHitByExplosion(explosions) {
        return explosions.some(e=>e.xTile===this.xTile&&e.yTile===this.yTile);
    }

    _adjacentDestructible() {
        return [ {dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1} ]
            .some(({dx,dy})=>{
                const x=this.xTile+dx, y=this.yTile+dy;
                return x>=0&&x<this.map.cols &&
                    y>=0&&y<this.map.rows &&
                    this.map.data[y][x]===2;
            });
    }

    _canSeePlayer() {
        if (this.xTile===this.player.xTile) {
            const [y1,y2]=[this.yTile,this.player.yTile].sort((a,b)=>a-b);
            for(let y=y1+1;y<y2;y++)
                if(!this.map.isWalkable(this.xTile,y)) return false;
            return true;
        }
        if (this.yTile===this.player.yTile) {
            const [x1,x2]=[this.xTile,this.player.xTile].sort((a,b)=>a-b);
            for(let x=x1+1;x<x2;x++)
                if(!this.map.isWalkable(x,this.yTile)) return false;
            return true;
        }
        return false;
    }




    _hueRotate() {
        switch(this.color){
            case 'green': return 120;
            case 'blue':  return 240;
            case 'red':   return   0;
            default:      return   0;
        }
    }

    static killAll(enemies, score, delayMs = 2000) {
        setTimeout(() => {
            const count = enemies.length;
            enemies.splice(0, enemies.length);
            score.update(count * 10);
        }, delayMs);
    }

}


function bfsFindPath(start, target, map, blockingSet) {
    const key = p => `${p.x},${p.y}`;
    const visited = new Set([key(start)]);
    const queue = [[ start ]];

    while (queue.length) {
        const path = queue.shift();
        const { x, y } = path[path.length - 1];
        if (x === target.x && y === target.y) return path;

        for (const {dx,dy,dir} of DIRECTIONS) {
            const nx = x + dx, ny = y + dy;
            const k  = `${nx},${ny}`;
            if (visited.has(k)) continue;
            if (!map.isWalkable(nx, ny)) continue;
            if (blockingSet.has(k)) continue;
            visited.add(k);
            queue.push(path.concat({ x: nx, y: ny, dir }));
        }
    }
    return null;
}

