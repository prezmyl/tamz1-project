
export class Bomb {
    constructor(x, y, owner, gameState) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.owner = owner;
        this.gameState = gameState;
        this.map = gameState.map;



        setTimeout(() => {
            this.explode();
            this.active = false;
        }, 2000);
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
            if (tx >= 0 && tx < this.map.data.length && ty >= 0 && ty < this.map.data[0].length) {
                this.map.destroyTile(tx, ty);
                this.gameState.explosionTiles.push({x: tx, y: ty, time: Date.now()});

            }
        }
        if (this.owner){
            this.owner.hasActiveBomb = false;
        }
        this.active = false;
    }
}