// js/Explosion.js

export default class Explosion {
    /**
     * @param {number} xTile  souřadnice dlaždice
     * @param {number} yTile
     * @param {Image}  sheet  ten velký PNG atlas
     * @param {number} tileSize velikost dlaždice v px
     * @param {number} bornAt čas v ms, kdy začal výbuch
     */
    constructor(xTile, yTile, sheet, tileSize, bornAt, hueRotation = 0) {
        this.xTile    = xTile;
        this.yTile    = yTile;
        this.x    = xTile;
        this.y    = yTile;
        this.sheet    = sheet;
        this.tileSize = tileSize;
        this.bornAt   = bornAt;
        // >>> Souřadnice ve spritesheetu <<<
        this.GRID_LINE    = 2;    // mezery mezi buňkami v atlasu
        this.TOP_BORDER   = 20;   // okraj nad první řadou buněk
        this.LARGE_H      = 110;  // výška větších buněk (postavy atd.)
        this.SMALL_W      = 41;   // šířka malé buňky (explozní snímek)
        this.SMALL_H      = 37;   // výška malé buňky
        // tady leží ta malá sada 40×31 buněk _pod_ 6 velkými řadami (postavy)
        this.REGION_OFFSET_Y =
            6 * this.TOP_BORDER       // okraj nahoře
            + 28 * this.LARGE_H + 5;
        // chceme čtvrtý řádek (index 3) z té malé oblasti
        this.startRowSmall = 4;      // první frame
        this.frameCount = 4;     // máme 4 po sobě jdoucí snímky
        this.FRAME_W = 110;
        this.FRAME_H = 110;
        this.GRID_LINE  = 2;
        this.TOP_BORDER = 20;
        // délka celé animace (např. 300 ms)
        this.duration = 500;
        this.hueRotation = hueRotation;
    }

    /** Vrátí, v jakém frame mám právě být (0 … frameCount-1) */
    _currentFrame(now) {
        const t = now - this.bornAt;
        if (t >= this.duration) return this.frameCount - 1;
        const idx = Math.floor( (t / this.duration) * this.frameCount );
        return Math.min(idx, this.frameCount - 1);
    }

    /** Kreslí ten aktuální snímek */
    draw(ctx, now) {
        const fi = this._currentFrame(now);
        const sx = this.GRID_LINE
            + fi * (this.SMALL_W + this.GRID_LINE);

        const sy = this.REGION_OFFSET_Y
            + this.GRID_LINE
            + this.startRowSmall * (this.SMALL_H + this.GRID_LINE);

        ctx.save();
        if (this.hueRotation) {
            ctx.filter = `hue-rotate(${this.hueRotation}deg)`;
        }
        ctx.drawImage(
            this.sheet,
            sx, sy, this.SMALL_W, this.SMALL_H,
            this.xTile * this.tileSize,
            this.yTile * this.tileSize,
            this.tileSize,
            this.tileSize
        );
        ctx.restore();
    }

    /** Vrátí true, až animace doběhne */
    isDone(now) {
        return now - this.bornAt >= this.duration;
    }
}
