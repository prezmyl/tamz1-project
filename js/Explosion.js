

export default class Explosion {

    constructor(xTile, yTile, sheet, tileSize, bornAt, hueRotation = 0) {
        this.xTile    = xTile;
        this.yTile    = yTile;
        this.x    = xTile;
        this.y    = yTile;
        this.sheet    = sheet;
        this.tileSize = tileSize;
        this.bornAt   = bornAt;
        // >>> Souradnnice ve spritesheetu <<<
        this.GRID_LINE    = 2;
        this.TOP_BORDER   = 20;
        this.LARGE_H      = 110;
        this.SMALL_W      = 41;
        this.SMALL_H      = 37;

        this.REGION_OFFSET_Y =
            6 * this.TOP_BORDER
            + 28 * this.LARGE_H + 5;

        this.startRowSmall = 4;
        this.frameCount = 4;
        this.FRAME_W = 110;
        this.FRAME_H = 110;
        this.GRID_LINE  = 2;
        this.TOP_BORDER = 20;

        this.duration = 500;
        this.hueRotation = hueRotation;
    }


    _currentFrame(now) {
        const t = now - this.bornAt;
        if (t >= this.duration) return this.frameCount - 1;
        const idx = Math.floor( (t / this.duration) * this.frameCount );
        return Math.min(idx, this.frameCount - 1);
    }


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


    isDone(now) {
        return now - this.bornAt >= this.duration;
    }
}
