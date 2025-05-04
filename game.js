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
    constructor(x, y, map) {
        this.x = x;
        this.y = y;
        this.active = true;
        this.map = map;

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
                this.active = false;


            }
        }
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
const score = new Score();




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
function gameLoop() {
    player.update(gameMap);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameMap.draw();
    player.draw();
    bombs = bombs.filter(b => b.active);
    for (const b of bombs) b.draw();

    score.draw();
    requestAnimationFrame(gameLoop)


}



// start
gameLoop();