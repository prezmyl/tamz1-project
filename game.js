import LevelManager from './js/LevelManager.js';
import Bomb         from './js/Bomb.js';
// (odstraň import GameMap, Player, Enemy, Score, levels)



// get canvas and its context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const mapCols = 20;
const mapRows = 15;


const LM     = new LevelManager(ctx);
LM.load(0);  // spustíme Level 1


//first iteration -> keyboard input -> then touchscreen
const keys ={
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};




//================== init ==================
//zacnu mapou v kodu, pak prejdu na title app pro vytvareni levlu
// 0 - empty, 1 = wall, 2 - desctructable wall


//listeners
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



//main game loop
// game.js

let lastFrameTime = performance.now();
requestAnimationFrame(gameLoop);

function gameLoop(now) {
    const dt = now - lastFrameTime;
    lastFrameTime = now;

    // --- 1) AKTUALIZACE ---
    // pohyb hráče
    LM.player.update(LM.map, keys);

    // pohyb nepřátel
    LM.enemies.forEach(e => e.update(dt));

    // odstranění padlých nepřátel a inkrementace skóre
    for (let i = LM.enemies.length - 1; i >= 0; i--) {
        if (LM.enemies[i].isHitByExplosion(LM.explosions)) {
            LM.enemies.splice(i, 1);
            LM.score.update(10);
        }
    }

    // přechod na další level, pokud už nejsou nepřátelé
    if (LM.enemies.length === 0) {
        LM.next();
        return;
    }

    // --- 2) VYKRESLOVÁNÍ ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // mapa
    LM.map.draw(ctx);

    // hráč
    LM.player.draw(ctx, LM.map.tileSize);

    // nepřátelé
    LM.enemies.forEach(e => e.draw(ctx, LM.map.tileSize));

    // bomby (in-place odstranění a vykreslení)
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

    // skóre
    LM.score.draw(ctx);

    requestAnimationFrame(gameLoop);
}



// start
requestAnimationFrame(gameLoop);