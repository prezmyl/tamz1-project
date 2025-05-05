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

let lastMoveTime = 0;
const moveDelay = 150;

let lastFrameTime = performance.now();




class GameMap {
    constructor(data) {
        this.data = data;
    }

    draw(){
        for (let row = 0; row < mapRows; row++) {
            for (let col = 0; col < mapCols; col++) {
                const tile = this.data[row][col];

                if (tile === 1) {
                    ctx.fillStyle = "#666"; // pevna zed
                } else if (tile === 2) {
                    ctx.fillStyle = "#c96"; // znicitelny blok
                } else {
                    continue;
                }
                ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);

            }
        }
    }

    isWalkable(x, y){
        return this.data[y][x] !== 1 && this.data[y][x] !== 2;
    }

    destroyTile(x, y){
        if (this.data[y][x] === 2) {
            console.log("destroy tile", x, y);
            this.data[y][x] = 0;
        }
    }

}

class Player {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    update(map) {
        const now = Date.now();
        if (now - lastMoveTime < moveDelay) return;

        let dx = 0;
        let dy = 0;

        if (keys.ArrowUp) dy = -1;
        else if (keys.ArrowDown) dy = 1;
        else if (keys.ArrowLeft) dx = -1;
        else if (keys.ArrowRight) dx = 1;

        const newX = this.x + dx;
        const newY = this.y + dy;

        if (map.isWalkable(newX, newY)) {
            this.x = newX;
            this.y = newY;
            lastMoveTime = now;
        }

    }

    draw(){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize)
    }

}

class Bomb {
    constructor(x, y, map, owner) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.map = map;
        this.owner = owner;

        setTimeout(() => {
            this.explode();
            this.active = false;
        }, 2000);
    }

    draw() {
        if (!this.active) return;
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc((this.x + 0.5) * tileSize, (this.y + 0.5) * tileSize, tileSize / 3, 0, Math.PI * 2);
        ctx.fill();


    }

    explode() {
        console.log("💥 Bomb exploded at", this.x, this.y);
        const dirs = [
            { dx: 0, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        for (const dir of dirs) {
            const tx = this.x + dir.dx;
            const ty = this.y + dir.dy;
            if (tx >= 0 && tx < mapCols && ty >= 0 && ty < mapRows) {
                this.map.destroyTile(tx, ty);
                explosionTiles.push({x: tx, y: ty, time: Date.now()});

            }
        }
        if (this.owner){
            this.owner.hasActiveBomb = false;
        }
        this.active = false;
    }
}

class Score {
    constructor(value) {
        this.value = value;
    }

    update(value) {
        this.value += value;
    }


    draw() {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Score: " + this.value , 10, 25);
    }
}

class Enemy {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.moveTimer = 0;
        this.bombCooldown = Math.random() * 2000 + 2000; // 2–4s
        this.timeSinceLastBomb = 0;
        this.hasActiveBomb = false;

        this.evading = false;
        this.evadeTimer = 1500;


    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc((this.x + 0.5) * tileSize, (this.y + 0.5) * tileSize, tileSize / 3, 0, Math.PI * 2);
        ctx.fill();
    }

    update(deltaTime, map) {
        this.moveTimer += deltaTime;

        // 0. Pamatuj, jestli stále utika
        if (this.evading) {
            this.evadeTimer -= deltaTime;
            if (this.evadeTimer <= 0) {
                this.evading = false;
            } else {
                return; // nedelj nic jineho behem uteku
            }
        }

        // 1. Pokud hrozí vybuch – utikej a konec update
        if (this.isInDanger(explosionTiles)) {
            this.tryEvade(map, explosionTiles);
            return;
        }

        // 2. Pokud vidí zničitelný blok a má možnost úniku, položí bombu a uteče
        if (this.getDestructibleBlockInRange(map) && !this.hasActiveBomb) {
            const exists = bombs.some(b => b.x === this.x && b.y === this.y);
            const safeDirs = this.getSafeDirections(map, explosionTiles);
            if (!exists && safeDirs.length > 0) {
                bombs.push(new Bomb(this.x, this.y, map, this));
                this.hasActiveBomb = true;
                this.tryEvade(map, explosionTiles);
                return;
            }
        }

        // 3. Položí bombu, pokud vidí hráče a má kam utéct
        if (this.canSeePlayer(player, map) && !this.hasActiveBomb) {
            const exists = bombs.some(b => b.x === this.x && b.y === this.y);
            const safeDirs = this.getSafeDirections(map, explosionTiles);
            if (!exists && safeDirs.length > 0) {
                bombs.push(new Bomb(this.x, this.y, map, this));
                this.hasActiveBomb = true;
                this.tryEvade(map, explosionTiles);
                return;
            }
        }

        // 4. Náhodný pohyb – ale jen pokud není ohrožen
        if (this.moveTimer > 500) {
            this.moveTimer = 0;
            const dirs = this.getSafeDirections(map, explosionTiles);
            if (dirs.length > 0) {
                const move = dirs[Math.floor(Math.random() * dirs.length)];
                this.x += move.dx;
                this.y += move.dy;
            }
        }


    }


    tryDropBomb(deltaTime, map){
        if (this.hasActiveBomb) {
            return;
        }

        this.timeSinceLastBomb += deltaTime;
        if (this.timeSinceLastBomb >= this.bombCooldown) {
            const exists = bombs.some(b => b.x === this.x && b.y === this.y);
            if (!exists) {
                bombs.push(new Bomb(this.x, this.y, map));
                this.timeSinceLastBomb = 0;
                this.bombCooldown = Math.random() * 2000 + 2000;
            }
        }

    }

    isInDanger(explosions) {
        return explosions.some(tile => tile.x === this.x && tile.y === this.y);
    }

    getSafeDirections(map, explosions) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];
        return directions.filter(dir => {
            const nx = this.x + dir.dx;
            const ny = this.y + dir.dy;
            return map.isWalkable(nx, ny) &&
                !explosions.some(e => e.x === nx && e.y === ny);
        });
    }

    tryEvade(map, explosions) {
        const safeDirs = this.getSafeDirections(map, explosions);
        if (safeDirs.length > 0) {
            const move = safeDirs[Math.floor(Math.random() * safeDirs.length)];
            this.x += move.dx;
            this.y += move.dy;

            this.evading = true;
            this.evadeTimer = 1000; // 1 sekunda vyhýbání
        }
    }


    canSeePlayer(player, map) {
        if (this.x === player.x) {
            const y1 = Math.min(this.y, player.y);
            const y2 = Math.max(this.y, player.y);
            for (let y = y1 + 1; y < y2; y++) {
                if (!map.isWalkable(this.x, y)) return false;
            }
            return true;
        }
        if (this.y === player.y) {
            const x1 = Math.min(this.x, player.x);
            const x2 = Math.max(this.x, player.x);
            for (let x = x1 + 1; x < x2; x++) {
                if (!map.isWalkable(x, this.y)) return false;
            }
            return true;
        }
        return false;
    }

    getDestructibleBlockInRange(map) {
        const dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];
        for (const dir of dirs) {
            const tx = this.x + dir.dx;
            const ty = this.y + dir.dy;
            if (tx >= 0 && tx < mapCols && ty >= 0 && ty < mapRows) {
                if (map.data[ty][tx] === 2) return true;
            }
        }
        return false;
    }


    canSeeDestructibleBlock(map) {
        // horizontalne
        for (let x = this.x - 1; x >= 0; x--) {
            if (map.data[this.y][x] === 1) break;
            if (map.data[this.y][x] === 2) return true;
        }
        for (let x = this.x + 1; x < mapCols; x++) {
            if (map.data[this.y][x] === 1) break;
            if (map.data[this.y][x] === 2) return true;
        }

        // vertikalne
        for (let y = this.y - 1; y >= 0; y--) {
            if (map.data[y][this.x] === 1) break;
            if (map.data[y][this.x] === 2) return true;
        }
        for (let y = this.y + 1; y < mapRows; y++) {
            if (map.data[y][this.x] === 1) break;
            if (map.data[y][this.x] === 2) return true;
        }

        return false;
    }



    isHitByExplosion(explosionTiles){
        return explosionTiles.some(tile => tile.x === this.x && tile.y === this.y)
    }


}


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



const gameMap = new GameMap(mapData);
const player = new Player(1,1, "white")
let bombs = [];
let explosionTiles = []; //x,y, time
let enemies = [new Enemy(5, 5, "blue"), new Enemy(15, 10, "blue")];

const score = new Score(0);





document.addEventListener("keydown", (e) => {
    if (e.code in keys) keys[e.code] = true;
    if (e.code === "Space" ) {
        const exists = bombs.some(b => b.x === player.x && b.y === player.y);

        if (!exists) {
            bombs.push(new Bomb(player.x, player.y, gameMap));
        }
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code in keys) keys[e.code] = false;
});


//main game loop
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    player.update(gameMap);
    for (const enemy of enemies) {
        enemy.update(deltaTime, gameMap);
    }
    enemies = enemies.filter(e => !e.isHitByExplosion(explosionTiles));


    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameMap.draw();
    player.draw();
    for (const enemy of enemies) {
        enemy.draw();
    }

    bombs = bombs.filter(b => b.active);
    for (const b of bombs) b.draw();

    //vykresleni exploze
    explosionTiles = explosionTiles.filter(tile => Date.now() - tile.time < 300);
    for (const tile of explosionTiles) {
        ctx.fillStyle = "orange";
        ctx.fillRect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
    }



    score.draw();
    requestAnimationFrame(gameLoop)


}



// start
requestAnimationFrame(gameLoop);