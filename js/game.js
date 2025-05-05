//imports
import { Player } from "./Player.js";
import { Enemy } from "./Enemy.js";
import { GameMap } from "./GameMap.js";
import { Bomb } from "./Bomb.js";
import { Score } from "./Score.js";



// get canvas and its context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");







//================== init ==================

let lastFrameTime = performance.now();

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

const tileSize = 40;

//first iteration -> keyboard input -> then touchscreen
const keys ={
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

const gameMap = new GameMap(mapData);
const bombs = [];
const explosionTiles = [];
const player = new Player(1, 1, "white", keys);
const score = new Score(0);

const gameState = {
    player,
    gameMap,
    bombs,
    explosionTiles,
    enemies: [], // zatím prázdné
    score,

};


// az tady muzu ytvorit enemies, protoze potrebuji gameState
const enemies = [
    new Enemy(5, 5, "blue", gameMap, gameState),
    new Enemy(15, 10, "blue", gameMap, gameState)
];

gameState.enemies = enemies;







document.addEventListener("keydown", (e) => {
    if (e.code in gameState.keys) gameState.keys[e.code] = true;
    if (e.code === "Space" ) {
        const exists = gameState.bombs.some(b => b.x === gameState.player.x && b.y === gameState.player.y);

        if (!exists) {
            gameState.bombs.push(new Bomb(gameState.player.x, gameState.player.y, player, gameState));
        }
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code in gameState.keys) gameState.keys[e.code] = false;
});


//main game loop
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    gameState.player.update(gameMap);
    for (const enemy of gameState.enemies) {
        enemy.update(deltaTime, gameMap);
    }
    gameState.enemies = enemies.filter(e => !e.isHitByExplosion(gameState.explosionTiles));


    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameState.gameMap.draw(ctx, tileSize);
    gameState.player.draw(ctx, tileSize);
    for (const enemy of gameState.enemies) {
        enemy.draw(ctx, tileSize);
    }

    gameState.bombs = bombs.filter(b => b.active);
    for (const b of gameState.bombs) b.draw(ctx, tileSize);

    //vykresleni exploze
    gameState.explosionTiles = explosionTiles.filter(tile => Date.now() - tile.time < 300);
    for (const tile of gameState.explosionTiles) {
        ctx.fillStyle = "orange";
        ctx.fillRect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
    }


    score.draw(ctx, tileSize);
    requestAnimationFrame(gameLoop)


}



// start
requestAnimationFrame(gameLoop);