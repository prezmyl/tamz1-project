// Player.js
const TOP_BORDER = 20;
const GRID_LINE  = 2;
// Player.js

// —————————— konstanty ——————————
const FRAME_W    = 110;
const FRAME_H    = 110;
const MOVE_DELAY = 200;   // ms mezi „celými“ kroky v dlaždicích
const ANIM_DELAY = 75;   // ms mezi snímky animace

// kolik snímků má každá směr–animace
const FRAMES_PER_DIR = {
    down:  4,
    left:   4,
    right:  4,
    up:     4,
};

// na jakém řádku sheetu začíná každá animace
const ROW_FOR_DIR = {
    down:  1,
    right: 3,
    up:    5,
    left:  7,
};
// ——————————————————————————————

export default class Player {
    static sheet;   // přiřadíme v game.js

    constructor(x, y) {
        this.x = x; this.y = y;
        this.dir   = 'down';
        this.frame = 0;

        this._moveTime       = 0;  // čas od posledního posunu
        this._animTime       = 0;  // čas od poslední změny snímku
        this._animatingSteps = 0;  // kolik snímků animace ještě odskočíme
    }

    /**
     * @param {number} dt    ms od posledního frame
     * @param {GameMap} map
     * @param {Object} keys
     */
    update(dt, map, keys) {
        this._moveTime += dt;

        // 1) zjistíme chtěný posun
        let dx=0, dy=0, newDir=this.dir;
        if (keys.ArrowUp)    { dy=-1; newDir='up';    }
        else if (keys.ArrowDown){ dy= 1; newDir='down';}
        else if (keys.ArrowLeft){ dx=-1; newDir='left';}
        else if (keys.ArrowRight){dx= 1; newDir='right';}

        // 2) pokus o přesun
        let moved = false;
        if ((dx||dy) && this._moveTime >= MOVE_DELAY) {
            const nx = this.x+dx, ny=this.y+dy;
            if (map.isWalkable(nx, ny)) {
                this.x = nx; this.y = ny;
                this.dir = newDir;
                this._moveTime = 0;
                moved = true;
            }
        }

        // 3) pokud jsme se pohli, spustíme animaci na FRAMES_PER_DIR snímků
        if (moved) {
            this._animatingSteps = FRAMES_PER_DIR[this.dir];
            this._animTime       = 0;
            this.frame           = 0;
        }

        // 4) cyklus animace – i když už klávesu nepíšete
        if (this._animatingSteps > 0) {
            this._animTime += dt;
            if (this._animTime >= ANIM_DELAY) {
                this._animTime -= ANIM_DELAY;
                // přejdeme na další snímek
                this.frame = (this.frame + 1) % FRAMES_PER_DIR[this.dir];
                this._animatingSteps--;
            }
        } else {
            // když už nic nedobíhá, vrátíme se na první snímek
            this.frame = 0;
        }
    }

    draw(ctx, tileSize) {
        if (!Player.sheet) return;
        const row = ROW_FOR_DIR[this.dir];
        const sx  = GRID_LINE + this.frame * (FRAME_W + GRID_LINE);
        const sy  = TOP_BORDER + row         * (FRAME_H + GRID_LINE);
        ctx.drawImage(
            Player.sheet,
            sx, sy, FRAME_W, FRAME_H,
            this.x*tileSize, this.y*tileSize,
            tileSize, tileSize
        );
    }
}



