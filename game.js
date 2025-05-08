import LevelManager from './js/LevelManager.js';
import Bomb         from './js/Bomb.js';


// ======== init ========
// get canvas and its context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const LM     = new LevelManager(ctx);
LM.load(0);  // level 1 to begin with

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



//======= main game loop ========
function gameLoop(now) {
    if (LM.gameOver) return; //ukonci smycku pri gameOver flagu

    console.log("→ gameLoop start, level:", LM.current);

    const dt = now - lastFrameTime;
    lastFrameTime = now;

    // --- 1) AKTUALIZACE ---
    // pohyb player
    LM.player.update(LM.map, keys);

    // pohyb enemy
    LM.enemies.forEach(e => e.update(dt));

    //kill them
    LM.enemies.forEach(e => {LM.scheduleEnemyKill(e, 3000)});

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

    // hrac
    LM.player.draw(ctx, LM.map.tileSize);

    // enemies
    LM.enemies.forEach(e => e.draw(ctx, LM.map.tileSize));

    // bombs (in-place removing explouaded and draw)
    for (let i = LM.bombs.length - 1; i >= 0; i--) {
        if (!LM.bombs[i].active) LM.bombs.splice(i, 1);
    }
    LM.bombs.forEach(b => b.draw(ctx, LM.map.tileSize));

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

//start
requestAnimationFrame(gameLoop);

