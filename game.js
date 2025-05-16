// game.js

import LevelManager from './js/LevelManager.js';
import Bomb         from './js/Bomb.js';
import Player       from './js/Player.js';
import Enemy        from './js/Enemy.js';
import Explosion    from './js/Explosion.js';


// ——————————————————————————————————————————————————
//  SETUP CANVAS + GLOBALS
// ——————————————————————————————————————————————————
const canvas        = document.getElementById('gameCanvas');
const ctx           = canvas.getContext('2d');
let LM;                      // LevelManager instance
let lastFrameTime;           // for dt in gameLoop

// input state
const keys = {
    ArrowUp:    false,
    ArrowDown:  false,
    ArrowLeft:  false,
    ArrowRight: false
};

// ——————————————————————————————————————————————————
//  LISTEN FOR KEYBOARD
// ——————————————————————————————————————————————————
document.addEventListener('keydown', e => {
    if (e.code in keys) {
        keys[e.code] = true;
    }
    if (e.code === 'Space' && LM) {
        Bomb.place(
            LM.player,
            LM.map,
            LM.bombs,
            LM.explosions,
            LM.bombTimer
        );
    }
});
document.addEventListener('keyup', e => {
    if (e.code in keys) keys[e.code] = false;
});

// ——————————————————————————————————————————————————
//  TOUCH CONTROLS (optional on‐screen buttons)
// ——————————————————————————————————————————————————
const touchMap = {
    'btn-up':    'ArrowUp',
    'btn-down':  'ArrowDown',
    'btn-left':  'ArrowLeft',
    'btn-right': 'ArrowRight'
};
Object.entries(touchMap).forEach(([btnId, key]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        keys[key] = true;
    }, { passive: false });
    btn.addEventListener('touchend', e => {
        e.preventDefault();
        keys[key] = false;
    }, { passive: false });
});
const bombBtn = document.getElementById('btn-bomb');
if (bombBtn) {
    bombBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (LM) Bomb.place(
            LM.player,
            LM.map,
            LM.bombs,
            LM.explosions,
            LM.bombTimer
        );
    }, { passive: false });
}

// ——————————————————————————————————————————————————
//  MAIN GAME LOOP
// ——————————————————————————————————————————————————
function gameLoop(now) {
    if (LM.gameOver) return;

    const dt = now - lastFrameTime;
    lastFrameTime = now;

    // 1) UPDATE
    LM.player.update(dt, LM.map, keys);
    LM.enemies.forEach(e => e.update(dt));

//KILL all -> comment in to stop automatic self destruction
    //LM.enemies.forEach(e => {e.killAll(2000)})
//    Enemy.killAll(LM.enemies,2000);

    // eliminate any enemies hit by explosions
    for (let i = LM.enemies.length - 1; i >= 0; i--) {
        if (LM.enemies[i].isHitByExplosion(LM.explosions)) {
            LM.enemies.splice(i, 1);
            LM.score.update(10);
        }
    }

    // if level clear, advance
    if (LM.enemies.length === 0 &&
        LM.bombs.length    === 0 &&
        LM.explosions.length === 0) {
        LM.next();
        onResize();
        requestAnimationFrame(gameLoop);
        return;
    }

    // 2) DRAW
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    LM.draw();

    // 2) translate to map area & draw the world
    ctx.save();
    ctx.translate(LM.offsetX, LM.offsetY);

    // draw the tilemap (including break animations)
    LM.map.draw(ctx);

    // bombs (cleanup inactive, then update+draw)
    for (let i = LM.bombs.length - 1; i >= 0; i--) {
        if (!LM.bombs[i].active) LM.bombs.splice(i, 1);
    }
    LM.bombs.forEach(b => {
        b.update(dt, now);
        b.draw(ctx, LM.map.tileSize, now);
    });

    // player & enemies
    LM.player.draw(ctx);
    LM.enemies.forEach(e => e.draw(ctx, LM.map.tileSize));

    // explosions (update+draw & cleanup)
    for (let i = LM.explosions.length - 1; i >= 0; i--) {
        const ex = LM.explosions[i];
        ex.draw(ctx, now);
        if (ex.isDone(now)) {
            LM.explosions.splice(i, 1);
        }
    }

    ctx.restore();

    // score overlay
    LM.score.draw(ctx);

    requestAnimationFrame(gameLoop);
}

// ——————————————————————————————————————————————————
//  ASSET LOADING
// ——————————————————————————————————————————————————

// —————————— Images ——————————
const playerSheet = new Image();
playerSheet.src   = 'assets/Atomic_Bomberman_Green.png';

const tilesImg = new Image();
tilesImg.src   = 'assets/Atomic_Bomberman_Tiles.png';  // from your import

const fieldsImg = new Image();
fieldsImg.src   = 'assets/Atomic_Bomberman_Fields.png';

let assetsToLoad = 3;
function onAssetLoad() {
    if (--assetsToLoad === 0) initGame();
}


playerSheet.onload = onAssetLoad;
tilesImg.onload    = onAssetLoad;
fieldsImg.onload   = onAssetLoad;

// —————————— Sound ——————————
export const tickSound = new Audio('assets/sounds/tick.ogg');
export const boomSound = new Audio('assets/sounds/boom.ogg');
// Optional: background loop
const bgMusic   = new Audio('assets/sounds/bg.ogg');
bgMusic.loop    = true;
bgMusic.volume  = 0.2;   // dial it down a bit


// ——————————————————————————————————————————————————
//  INITIALIZE EVERYTHING
// ——————————————————————————————————————————————————
function initGame() {
    // 1) assign our sprite‐sheet to Player/Enemy/Bomb
    Player.sheet = playerSheet;
    Enemy.sheet  = playerSheet;
    Bomb.sheet   = playerSheet;

    // 2) create the LevelManager (passing in the tileset)
    LM = new LevelManager(ctx, tilesImg, fieldsImg);
    LM.load(0);

    // 3) now that we know tileSize, patch Player & Enemies
    const ts = LM.map.tileSize;
    LM.player.tileSize = ts;
    LM.player.x = LM.player.xTile * ts;
    LM.player.y = LM.player.yTile * ts;
    LM.enemies.forEach(e => e.tileSize = ts);

    // START background music *after* user interaction if needed
    // defer bgMusic until first user gesture
    const startBG = () => {
        bgMusic.play().catch(()=>{});
        // remove the listener after first use
        window.removeEventListener('keydown', startBG);
        window.removeEventListener('pointerdown', startBG);
    };
    window.addEventListener('keydown', startBG);
    window.addEventListener('pointerdown', startBG);

    // 4) start the loop
    lastFrameTime = performance.now();
    // setup responsiveness
    window.addEventListener('resize', onResize);
    onResize();
    requestAnimationFrame(gameLoop);
}



// Call this any time the window size changes (and once at startup)
function onResize() {
    // 1) Fill the window
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width  = w;
    canvas.height = h;



    // 2) Compute two candidate tileSizes
    const cols = LM.map.cols;
    const rows = LM.map.rows;
    const tsByW = Math.floor(w / cols);   // would fill width exactly
    const tsByH = Math.floor(h / rows);   // would fill height exactly

    // 3) Pick the largest that won’t overflow vertically
    let ts;
    if (tsByW * rows <= h) {
        // we *can* fill horizontally without vertical scroll
        ts = tsByW;
    } else {
        // otherwise, fit to height and leave horizontal padding
        ts = tsByH;
    }

    // 4) Apply the chosen tileSize everywhere
    LM.map.tileSize    = ts;
    LM.player.tileSize = ts;
    LM.player.resetInterpolation();
    LM.enemies.forEach(e => {
        e.tileSize = ts;
        e.resetInterpolation();
    });
    LM.bombs.forEach(b => {
        b.anim.tileSize = ts;
    });
    LM.explosions.forEach(ex => {
        ex.tileSize = ts;
    })

    // 5) Compute centering offsets
    const mapW = cols * ts;
    const mapH = rows * ts;
    LM.offsetX = Math.floor((w - mapW) / 2);
    LM.offsetY = Math.floor((h - mapH) / 2);

    // 6) (Optional) reposition your HUD/score
    // 6) reposition your HUD: Score + Level
    //   landscape → in the left black bar (centered horizontally there)
    //   portrait  → above the map, as before
    if (w > h) {
        // landscape: left bar is width = offsetX
        LM.score.x = 10;
        LM.score.y = 30;
    } else {
        // portrait: place just above the map
        LM.score.x = LM.offsetX + 10;
        LM.score.y = Math.max(20, LM.offsetY - 40);
    }
    // update the level number for Score.draw()
    LM.score.level = LM.current + 1;
}




