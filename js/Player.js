



export class Player {
    constructor(x, y, color, keys) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.keys = keys;
        this.lastMoveTime = 0;
        this.moveDelay = 150;
    }

    update(map) {
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveDelay) return;

        let dx = 0;
        let dy = 0;

        if (this.keys.ArrowUp) dy = -1;
        else if (this.keys.ArrowDown) dy = 1;
        else if (this.keys.ArrowLeft) dx = -1;
        else if (this.keys.ArrowRight) dx = 1;

        const newX = this.x + dx;
        const newY = this.y + dy;

        if (map.isWalkable(newX, newY)) {
            this.x = newX;
            this.y = newY;
            this.lastMoveTime = now;
        }

    }

    draw(ctx, tileSize){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize)
    }

}