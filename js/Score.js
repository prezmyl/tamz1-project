export class Score {
    constructor(value) {
        this.value = value;
    }

    update(value) {
        this.value += value;
    }


    draw(ctx, tileSize) {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Score: " + this.value , 10, 25);
    }
}