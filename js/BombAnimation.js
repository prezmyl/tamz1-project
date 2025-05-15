// BombAnimation.js

export default class BombAnimation {
    // -- your measured per‐frame sizes --
    static FRAME_SPECS = [
        { sw: 36, sh: 36 },
        { sw: 35, sh: 34 },
        { sw: 34, sh: 32 },
        { sw: 32, sh: 31 },
        { sw: 30, sh: 29 },
        { sw: 28, sh: 27 },
        { sw: 26, sh: 25 },
        { sw: 25, sh: 24 },
        { sw: 24, sh: 22 },
        { sw: 22, sh: 21 }
    ];

    // -- where does the very first frame live in your big PNG? --
    static FIRST_FRAME_X = 2;
    static FIRST_FRAME_Y = 3246;
    static GRID         = 2;   // px between frames

    // build a small table that includes the computed sx,sy
    static FRAME_INFO = (() => {
        const out = [];
        let x = BombAnimation.FIRST_FRAME_X;
        for (const { sw, sh } of BombAnimation.FRAME_SPECS) {
            out.push({ sx: x, sy: BombAnimation.FIRST_FRAME_Y, sw, sh });
            x += sw + BombAnimation.GRID;
        }
        return out;
    })();

    constructor(xTile, yTile, sheet, tileSize, bornAt, duration = 500, hueRotation = 0) {
        this.xTile     = xTile;
        this.yTile     = yTile;
        this.sheet     = sheet;
        this.tileSize  = tileSize;
        this.bornAt    = bornAt;
        this.duration  = duration;
        this.frameCount = BombAnimation.FRAME_INFO.length;
        this.hueRotation = hueRotation;
    }

    _currentFrame(now) {
        const t = now - this.bornAt;
        if (t <= 0) return 0;
        const pct = Math.min(1, t / this.duration);
        return Math.floor(pct * (this.frameCount - 1));
    }

    draw(ctx, now) {
        const fi    = this._currentFrame(now);
        const { sx, sy, sw, sh } = BombAnimation.FRAME_INFO[fi];
        ctx.save();
        if (this.hueRotation) {
            ctx.filter = `hue-rotate(${this.hueRotation}deg)`;
            }
        ctx.drawImage(
            this.sheet,
            sx, sy,         // top-left corner of this frame in atlas
            sw, sh,         // measured size
            this.xTile * this.tileSize,
            this.yTile * this.tileSize,
            this.tileSize,  // stretch to one game‐tile
            this.tileSize
        );
        ctx.restore();
    }

    isDone(now) {
        return now - this.bornAt >= this.duration;
    }
}
