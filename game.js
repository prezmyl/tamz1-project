import LevelManager from './js/LevelManager.js';
import Bomb         from './js/Bomb.js';
import Player from "./js/Player.js";
import Enemy from "./js/Enemy.js";


// ======== init ========
// get canvas and its context
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");


//animation sheet -> must be done befor starting gameloop
const playerSheet = new Image();
playerSheet.src   = 'assets/Atomic_Bomberman_Green.png';

let LM;
let lastFrameTime = performance.now();

//first iteration -> keyboard input -> then touchscreen
const keys ={
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};


//========== listeners =============
document.addEventListener("keydown", (e) => {
    if (e.code in keys) keys[e.code] = true;
    if (e.code === "Space" ) {
        Bomb.place(
            LM.player,
            LM.map,
            LM.bombs,
            LM.explosions,
            LM.bombTimer
        );

    }
});

document.addEventListener("keyup", (e) => {
    if (e.code in keys) keys[e.code] = false;
});

// -------- touch controls --------
const touchMap = {
    'btn-up':    'ArrowUp',
    'btn-down':  'ArrowDown',
    'btn-left':  'ArrowLeft',
    'btn-right': 'ArrowRight',
};
//pohyb pres touch
Object.entries(touchMap).forEach(([btnId, keyCode]) => {
    const btn = document.getElementById(btnId);
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        keys[keyCode] = true;
    }, { passive:false });
    btn.addEventListener('touchend', e => {
        e.preventDefault();
        keys[keyCode] = false;
    }, { passive:false });
});

// bomba pres touch
const bombBtn = document.getElementById('btn-bomb');
bombBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    Bomb.place(
        LM.player,
        LM.map,
        LM.bombs,
        LM.explosions,
        LM.bombTimer
    );
}, { passive:false });


//======= main game loop ========
function gameLoop(now) {
    if (LM.gameOver) return; //ukonci smycku pri gameOver flagu

    console.log("→ gameLoop start, level:", LM.current);

    const dt = now - lastFrameTime;
    lastFrameTime = now;

    // --- 1) AKTUALIZACE ---
    // pohyb player
    LM.player.update(dt, LM.map, keys);

    // pohyb enemy
    LM.enemies.forEach(e => e.update(dt));

    //kill them
    //LM.enemies.forEach(e => {LM.scheduleEnemyKill(e, 3000)});

    // removing dead enemies and changing score
    for (let i = LM.enemies.length - 1; i >= 0; i--) {
        if (LM.enemies[i].isHitByExplosion(LM.explosions)) {
            LM.enemies.splice(i, 1);
            LM.score.update(10);
        }
    }

    // move to next level, when no more enemies are alive
    if (LM.enemies.length === 0) {
        LM.next();
        requestAnimationFrame(gameLoop);
        return;
    }

    // --- 2) VYKRESLEVANI ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // mapa
    LM.map.draw(ctx);



    // bombs (in-place removing explouaded and draw)
    for (let i = LM.bombs.length - 1; i >= 0; i--) {
        if (!LM.bombs[i].active) LM.bombs.splice(i, 1);
    }
    LM.bombs.forEach(b => b.draw(ctx, LM.map.tileSize));

    // hrac
    LM.player.draw(ctx);

    // enemies
    LM.enemies.forEach(e => e.draw(ctx, LM.map.tileSize));

    // exploze (in-place odstranění a vykreslení)
    for (let i = LM.explosions.length - 1; i >= 0; i--) {
        if (Date.now() - LM.explosions[i].time >= 300) {
            LM.explosions.splice(i, 1);
        }
    }
    LM.explosions.forEach(tile => {
        ctx.fillStyle = "orange";
        ctx.fillRect(
            tile.x * LM.map.tileSize,
            tile.y * LM.map.tileSize,
            LM.map.tileSize,
            LM.map.tileSize
        );
    });

    // score
    LM.score.draw(ctx);

    requestAnimationFrame(gameLoop);
}

playerSheet.onload = () => {
    // 1) přiřazení atlasu
    Player.sheet = playerSheet;
    Enemy.sheet  = playerSheet;

    // 2) inicializace LevelManageru
    LM = new LevelManager(ctx);
    LM.load(0);

    // 3) po load() máme LM.map.tileSize → předáme ho hráči i nepřátelům
    const ts = LM.map.tileSize;
    LM.player.tileSize = ts;
    LM.player.x = LM.player.xTile * ts;
    LM.player.y = LM.player.yTile * ts;
    // obdobně u enemy, pokud je budete chtít plynule pohybovat,
    // museli byste jim do konstruktoru přidat tileSize a stejnou logiku.

    // 4) start
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
};
