// Bomb.js
import Explosion from './Explosion.js';
import BombAnimation from './BombAnimation.js';
import Enemy from "./Enemy.js";
import { tickSound, boomSound } from '../game.js';

const HUE_ROTATIONS = {
    green: 120,
    blue:  240,
    red:     0
};
export default class Bomb {
    constructor(xTile, yTile, map, owner, explosionTiles, timer) {
        // xTile/yTile mista bomby
        this.x = xTile;
        this.y = yTile;
        this.active = true;
        this.map = map;
        this.mapCols = map.data[0].length;
        this.mapRows = map.data.length;
        this.owner = owner;
        this.owner.hasActiveBomb = true;
        this.explosionTiles = explosionTiles;
        this.hueRotation = HUE_ROTATIONS[ owner.color ] || 0;

        this.bornAt     = performance.now();
        this.timer      = timer;

        this.anim       = new BombAnimation(
            xTile, yTile,
            Enemy.sheet,    // loaded sprite‐sheet
            this.map.tileSize,
            this.bornAt,
            this.timer,
            this.hueRotation
        );

        setTimeout(() => {
            this.explode();
            this.active = false;
        }, timer);
    }

    update(dt, now) {


    }

    draw(ctx, tileSize, now) {
        if (!this.active) return;
        this.anim.draw(ctx, now);
    }

    explode() {
        boomSound.currentTime = 0;
        boomSound.play().catch(()=>{});

        const dirs = [
            { dx: 0, dy: 0 }, { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },{ dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
        for (const {dx,dy} of dirs) {
            const tx = this.x + dx, ty = this.y + dy;
            if (this.map.data[ty][tx] !== 1) {
                this.map.destroyTile(tx, ty);
                this.explosionTiles.push(
                    new Explosion(tx, ty, Enemy.sheet, this.map.tileSize, performance.now(), this.hueRotation)
                );
            }
        }
        this.owner.hasActiveBomb = false;
        this.active = false;
    }

    static place(owner, map, bombs, explosionTiles, timer) {
        const ts = owner.tileSize;
        const xTile = Math.floor((owner.x + ts/2) / ts);
        const yTile = Math.floor((owner.y + ts/2) / ts);
        if (owner.hasActiveBomb) return;
        if (bombs.some(b => b.x===xTile && b.y===yTile && b.active)) return;
        tickSound.currentTime = 0;
        tickSound.play().catch(()=>{});
        const bomb = new Bomb(xTile, yTile, map, owner, explosionTiles, timer);
        bombs.push(bomb);
    }
}
