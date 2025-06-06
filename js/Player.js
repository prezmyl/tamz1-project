

// —————— Konstanty ——————
const TOP_BORDER    = 20;    // pixely nad prvním řádkem v atlasu
const GRID_LINE     = 2;     // pixely mezi buňkami v atlasu
const FRAME_W       = 110;   // šířka buňky v atlasu
const FRAME_H       = 110;   // výška buňky v atlasu
const MOVE_SPEED    = 80;    // px/s – rychlost pohybu
const ANIM_DELAY    = 150;   // ms mezi snímky animace
const FRAMES_PER_DIR= { down:11, left:11, right:11, up:11 };
const ROW_FOR_DIR   = { down:0, left:6, right:2, up:4 };

export default class Player {
    static sheet;

    /**
     * @param {number} xTile počáteční sloupec v dlaždicích
     * @param {number} yTile počáteční řádek v dlaždicích
     * @param {number} tileSize velikost dlaždice v pixelech
     */
    constructor(xTile, yTile, tileSize, lives) {

        this.xTile = xTile;
        this.yTile = yTile;

        this.tileSize = tileSize;
        this.x = xTile * tileSize;
        this.y = yTile * tileSize;

        this.targetX = this.x;
        this.targetY = this.y;
        this.moving  = false;

        this.dir       = 'down';
        this.frame     = 0;
        this._animTime = 0;

        this.invulnerableUntil = 0;
        this.lives = lives;
    }


    update(dt, map, keys) {
        const ts = this.tileSize;

        if (this.moving) {
            // 1) interpolace pohybu v pixelech
            const step = MOVE_SPEED * dt / 1000;
            if (this.x < this.targetX) this.x = Math.min(this.x + step, this.targetX);
            else if (this.x > this.targetX) this.x = Math.max(this.x - step, this.targetX);
            if (this.y < this.targetY) this.y = Math.min(this.y + step, this.targetY);
            else if (this.y > this.targetY) this.y = Math.max(this.y - step, this.targetY);


            this._animTime += dt;
            if (this._animTime >= ANIM_DELAY) {
                this._animTime -= ANIM_DELAY;
                this.frame = (this.frame + 1) % FRAMES_PER_DIR[this.dir];
            }


            if (this.x === this.targetX && this.y === this.targetY) {
                this.xTile  = this.targetX / ts;
                this.yTile  = this.targetY / ts;
                this.moving = false;
                this.frame  = 0;
            }

        } else {

            let dx = 0, dy = 0, newDir = this.dir;
            if (keys.ArrowUp)    { dy = -1; newDir = 'up';    }
            else if (keys.ArrowDown){ dy =  1; newDir = 'down'; }
            else if (keys.ArrowLeft){ dx = -1; newDir = 'left'; }
            else if (keys.ArrowRight){dx =  1; newDir = 'right';}

            if (dx || dy) {
                const nx = this.xTile + dx;
                const ny = this.yTile + dy;
                if (map.isWalkable(nx, ny)) {
                    this.targetX = nx * ts;
                    this.targetY = ny * ts;
                    this.dir     = newDir;
                    this.moving  = true;
                    this._animTime = 0;
                    this.frame     = 0;
                }
            }
        }
    }


    draw(ctx) {
        if (!Player.sheet) return;
        const row = ROW_FOR_DIR[this.dir];
        const sx  = GRID_LINE + this.frame * (FRAME_W + GRID_LINE);
        const sy  = TOP_BORDER + row   * (FRAME_H + GRID_LINE);

        ctx.drawImage(
            Player.sheet,
            sx, sy, FRAME_W, FRAME_H,
            this.x, this.y,
            this.tileSize, this.tileSize
        );
    }


    resetInterpolation() {
        this.x     = this.xTile * this.tileSize;
        this.y     = this.yTile * this.tileSize;
        this.targetX = this.x;
        this.targetY = this.y;
        this.moving  = false;
        this.frame   = 0;
        this._animTime = 0;
    }

    isInvulnerable(now) {
        return now < this.invulnerableUntil;
    }

}
