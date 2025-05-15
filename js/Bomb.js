// Bomb.js

export default class Bomb {
    constructor(xTile, yTile, map, owner, explosionTiles, timer) {
        // xTile/yTile místa bomby
        this.x = xTile;
        this.y = yTile;
        this.active = true;
        this.map = map;
        this.mapCols = map.data[0].length;
        this.mapRows = map.data.length;
        this.owner = owner;
        this.owner.hasActiveBomb = true;
        this.explosionTiles = explosionTiles;

        setTimeout(() => {
            this.explode();
            this.active = false;
        }, timer);
    }

    draw(ctx, tileSize) {
        if (!this.active) return;
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(
            (this.x + 0.5) * tileSize,
            (this.y + 0.5) * tileSize,
            tileSize / 3, 0, Math.PI * 2
        );
        ctx.fill();
    }

    explode() {
        const dirs = [
            { dx: 0, dy: 0 }, { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },{ dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
        for (const {dx,dy} of dirs) {
            const tx = this.x + dx, ty = this.y + dy;
            if (tx>=0 && tx<this.mapCols && ty>=0 && ty<this.mapRows) {
                this.map.destroyTile(tx, ty);
                this.explosionTiles.push({ x: tx, y: ty, time: Date.now() });
            }
        }
        this.owner.hasActiveBomb = false;
        this.active = false;
    }

    static place(owner, map, bombs, explosionTiles, timer) {
        const ts = owner.tileSize;
        // vezmeme střed hráče/enemy a přepočteme na tile
        const xTile = Math.floor((owner.x + ts/2) / ts);
        const yTile = Math.floor((owner.y + ts/2) / ts);
        if (owner.hasActiveBomb) return;
        if (bombs.some(b => b.x===xTile && b.y===yTile && b.active)) return;
        const bomb = new Bomb(xTile, yTile, map, owner, explosionTiles, timer);
        bombs.push(bomb);
    }
}
