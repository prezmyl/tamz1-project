// get canvas and its context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//player
const player = {
    x: 400,
    y: 300,
    width: 40,
    height: 40,
    speed: 5,
    color: "white",
};

//objects_coin
let score = 0;

//random coin coordinates generated
function generateCoin() {
    const size = 20;

    return {
        x: Math.floor(Math.random() * (canvas.width - size)),
        y: Math.floor(Math.random() * (canvas.height - size)),
        size: size,
        color: "gold",
    };
}


//first iteration -> keyboard input -> then touchscreen
const keys ={
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

//event listener
//keydonwn je keyPressed ne konkretni klaves
document.addEventListener("keydown", (e) => {
    if (e.code in keys) keys[e.code] = true;
});
//keydown je uvolneni klavesy
document.addEventListener("keyup", (e) => {
    if (e.code in keys) keys[e.code] = false;
});

//main game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

//player movement
function update() {
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;

    //borders for player
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    //colision between player and coin
    if (isColliding(player, coin)) {
        score++;
        coin = generateCoin();
    }
}

function isColliding(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.size &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.size &&
        obj1.y + obj1.height > obj2.y
    );
}

// draw the scene
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    //draw coin
    ctx.fillStyle = coin.color;
    ctx.beginPath();
    ctx.arc(coin.x + coin.size / 2, coin.y + coin.size / 2, coin.size / 2, 0, Math.PI * 2);
    ctx.fill();

    //draw score
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 25);

}

// start

coin = generateCoin();
gameLoop();