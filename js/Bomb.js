
export default class Bomb {
    constructor(x, y, map, owner, explosionTiles, timer) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.map = map;
        this.mapCols = map.data[0].length;
        this.mapRows = map.data.length;
        this.owner = owner;
        this.owner.hasActiveBomb = true;
        this.explosionTiles = explosionTiles

        setTimeout(() => {
            this.explode();
            this.active = false;
        }, timer);
    }

    draw(ctx, tileSize) {
        if (!this.active) return;
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc((this.x + 0.5) * tileSize, (this.y + 0.5) * tileSize, tileSize / 3, 0, Math.PI * 2);
        ctx.fill();


    }

    explode() {
        console.log("💥 Bomb exploded at", this.x, this.y);
        const dirs = [
            { dx: 0, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        for (const dir of dirs) {
            const tx = this.x + dir.dx;
            const ty = this.y + dir.dy;
            if (tx >= 0 && tx < this.mapCols && ty >= 0 && ty < this.mapRows) {
                this.map.destroyTile(tx, ty);
                this.explosionTiles.push({x: tx, y: ty, time: Date.now()});

            }
        }
        if (this.owner){
            this.owner.hasActiveBomb = false;
        }
        this.active = false;
    }

    static place(owner, map, bombs, explosionTiles, timer) {
        // 1) zkontrolujeme, zda owner nemá bombu
        if (owner.hasActiveBomb) return;
        // 2) vytvoříme instanci a přihodíme do pole
        const bomb = new Bomb(
            owner.x,
            owner.y,
            map,
            owner,
            explosionTiles,
            timer
        );
        bombs.push(bomb);
    }
}