import Bomb    from './js/Bomb.js';
import Enemy from "./js/Enemy.js";
import GameMap from "./js/GameMap.js";
import Player from "./js/Player.js";
import Score from "./js/Score.js";


// get canvas and its context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const mapCols = 20;
const mapRows = 15;

//first iteration -> keyboard input -> then touchscreen
const keys ={
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

let lastFrameTime = performance.now();


//================== init ==================
//zacnu mapou v kodu, pak prejdu na title app pro vytvareni levlu
// 0 - empty, 1 = wall, 2 - desctructable wall
const mapData = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,2,0,2,0,0,2,0,2,0,0,2,0,2,0,0,0,1],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
    [1,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,2,1],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
    [1,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1],
    [1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,1],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
    [1,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,2,1],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
    [1,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const gameMap = new GameMap(
    mapData,
    mapCols,    // 20
    mapRows,    // 15
    tileSize    // 40
);

const player = new Player(1,1, "white")
let bombs = [];
let explosionTiles = []; //x,y, time
let enemies = [
    new Enemy(5,  5,  'blue',  gameMap, bombs, explosionTiles, player),
    new Enemy(15, 10, 'green', gameMap, bombs, explosionTiles, player),
];

const score = new Score(0);


//listeners
document.addEventListener("keydown", (e) => {
    if (e.code in keys) keys[e.code] = true;
    if (e.code === "Space" ) {
        Bomb.place(player, gameMap, bombs, explosionTiles);
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code in keys) keys[e.code] = false;
});



//main game loop
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    player.update(gameMap, keys);
    for (const enemy of enemies) {
        enemy.update(deltaTime, gameMap);
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].isHitByExplosion(explosionTiles)) {
            enemies.splice(i, 1);
        }
    }


    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameMap.draw(ctx);
    player.draw(ctx, tileSize);
    for (const enemy of enemies) {
        enemy.draw(ctx, tileSize);
    }

    for (let i = bombs.length - 1; i >= 0; i--) {
        if (!bombs[i].active) {
            bombs.splice(i, 1);
        }
    }
    for (const b of bombs) b.draw(ctx, tileSize);

    //vykresleni exploze
    for (let i = explosionTiles.length - 1; i >= 0; i--) {
        if (Date.now() - explosionTiles[i].time >= 300) {
            explosionTiles.splice(i, 1);
        }
    }
    for (const tile of explosionTiles) {
        ctx.fillStyle = "orange";
        ctx.fillRect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
    }

    score.draw(ctx);

    requestAnimationFrame(gameLoop)

}


// start
requestAnimationFrame(gameLoop);