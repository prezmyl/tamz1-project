// GameMap.js
export default class GameMap {
    constructor(data, cols, rows, tileSize, bombs, tilesImg) {
        this.data        = data;
        this.cols        = cols;
        this.rows        = rows;
        this.tileSize    = tileSize;
        this.bombs       = bombs;
        this.tilesImg    = tilesImg;


        this.TOP_BORDER  =   9;
        this.GRID_LINE   =   4;
        this.CELL_W      =  40;
        this.CELL_H      =  36;


        const T = ({r,c}) => ({
            sx: this.GRID_LINE  + c * (this.CELL_W + this.GRID_LINE),
            sy: this.TOP_BORDER  + r * (this.CELL_H + this.GRID_LINE),
            w:  this.CELL_W,
            h:  this.CELL_H
        });
        this.tileSrc = {
            0: T({r:0,c:0}),    // floor / empty
            1: T({r:2,c:1}),    // unbreakable wall
            2: T({r:1,c:0})     // breakable block (static)
        };

        // and for the **break animation**, capture all frames in row 1, cols 1…N:
        this.breakFrames = [];
        let c = 1;
        while (true) {
            const sx = this.TOP_BORDER + c*(this.CELL_W+this.GRID_LINE);

            if (sx + this.CELL_W > this.tilesImg.width) break;
            this.breakFrames.push({ sx, sy: this.tileSrc[2].sy, w:this.CELL_W, h:this.CELL_H });
            c++;
        }


        this._breaking = []; // { xTile, yTile, startedAt }
    }

    /** call this *instead* of instantly clearing data[y][x] */
    destroyTile(x,y) {
        if (this.data[y][x] !== 2) return;

        this._breaking.push({ x,y, startedAt: performance.now() });

    }

    draw(ctx) {
        const now = performance.now();
        // 1) draw the static map
        for (let y=0; y<this.rows; y++) {
            for (let x=0; x<this.cols; x++) {
                const t = this.data[y][x];

                if (t === 0) continue;

                const src = this.tileSrc[t];
                ctx.drawImage(
                    this.tilesImg,
                    src.sx, src.sy, src.w, src.h,
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }

        // 2) overlay any break animations
        const DURATION = 300;       // ms per break animation
        const frames   = this.breakFrames.length;
        for (let i=this._breaking.length-1; i>=0; i--) {
            const b = this._breaking[i];
            const elapsed = now - b.startedAt;
            const pct     = elapsed / DURATION;

            if (pct >= 1) {

                this.data[b.y][b.x] = 0;
                this._breaking.splice(i,1);
                continue;
            }

            // choose frame index
            const fi = Math.floor(pct * frames);
            const f  = this.breakFrames[fi];

            ctx.drawImage(
                this.tilesImg,
                f.sx, f.sy, f.w, f.h,
                b.x * this.tileSize,
                b.y * this.tileSize,
                this.tileSize,
                this.tileSize
            );
        }
    }

    isWalkable(x,y) {

        if (this.data[y][x] === 1 || this.data[y][x] === 2) return false;
        if (this.bombs.some(b => b.x===x&&b.y===y&&b.active))    return false;
        return true;
    }
}
