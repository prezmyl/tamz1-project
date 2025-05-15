// GameMap.js
export default class GameMap {
    /**
     * @param {number[][]} data    2D pole mapy
     * @param {number} cols        pocet sloupcu
     * @param {number} rows        pocet radku
     * @param {number} tileSize    velikost dlazdicce v pixelech
     */
    constructor(data, cols, rows, tileSize, bombs) {
        this.data     = data;
        this.cols     = cols;
        this.rows     = rows;
        this.tileSize = tileSize;
        this.bombs = bombs;
    }

    draw(ctx) {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const tile = this.data[y][x];
                if      (tile === 1) ctx.fillStyle = "#666";  // pevná zeď
                else if (tile === 2) ctx.fillStyle = "#c96";  // zničitelný blok
                else continue;                                // prázdno
                ctx.fillRect(
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }
    }

    isWalkable(x, y) {
        if (this.data[y][x] === 1 || this.data[y][x] === 2) return false;
        // 2) aktivní bomba = neprůchozí
        if (this.bombs.some(b => b.x === x && b.y === y && b.active)) return false;
        return true;
    }

    destroyTile(x, y) {
        if (this.data[y][x] === 2) {
            this.data[y][x] = 0;
        }
    }
}
