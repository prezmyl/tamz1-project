// Player.js
export default class Player {
    /**
     * @param {number} x      pocatecni X pozice (grid)
     * @param {number} y      pocatecni Y pozice (grid)
     * @param {string} color  barva hrace
     */
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.hasActiveBomb = false;
        this._lastMoveTime = 0;
        this._moveDelay = 150; // ms mezi pohyby
    }

    /**
     * Aktualizuje pozici hrace modle klaves a mapy
     * @param {GameMap} map   instance GameMap pro kontrolu kolize
     * @param {{[key:string]:boolean}} keys  referencovane klavesy
     */
    update(map, keys) {
        const now = Date.now();
        if (now - this._lastMoveTime < this._moveDelay) return;

        let dx = 0, dy = 0;
        if (keys.ArrowUp)    dy = -1;
        else if (keys.ArrowDown) dy =  1;
        else if (keys.ArrowLeft) dx = -1;
        else if (keys.ArrowRight)dx =  1;

        const nx = this.x + dx;
        const ny = this.y + dy;
        if (map.isWalkable(nx, ny)) {
            this.x = nx;
            this.y = ny;
            this._lastMoveTime = now;
        }
    }

    /**
     * Vykreslni hrace
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} tileSize  velikost dlazdicev px
     */
    draw(ctx, tileSize) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x * tileSize,
            this.y * tileSize,
            tileSize,
            tileSize
        );
    }
}
