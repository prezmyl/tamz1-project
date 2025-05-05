


export class GameMap {
    constructor(data) {
        this.data = data;
    }

    draw(ctx, tileSize){
        for (let row = 0; row < this.data.length; row++) {
            for (let col = 0; col < this.data[0].length; col++) {
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

