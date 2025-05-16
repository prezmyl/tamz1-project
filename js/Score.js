
export default class Score {
    /**
     * @param {number} initialValue  Pocat. score (vychozi je 0)
     */
    constructor(initialValue = 0, lives) {
        this.value = initialValue;
        this.x = 10;
        this.y = 20;
        this.level = 1;
        this.lives = lives;
    }

    /**
     * Prictek aktualnimu skore zadanou hodnotu
     * @param {number} amount  Hodnota k pridani (i zaporna)
     */
    update(amount) {
        this.value += amount;
    }

    /**
     * Vykresli skore na canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Score: ${this.value}`, this.x, this.y);
        ctx.fillText(`Level: ${this.level}`, this.x, this.y + 20);
        if (this.lives !== undefined) {
            ctx.fillText(`Lives: ${this.lives}`, this.x, this.y + 40);
        }
    }


    // ======== Local Storage =========
    static loadHighScores() {
        const raw = localStorage.getItem('highscores');
        if (raw) return JSON.parse(raw);
        else return [];
    }

    static saveHighScores(entry) {
        const arr = Score.loadHighScores();
        arr.push(entry);
        arr.sort((a, b) => b.value - a.value);
        localStorage.setItem('highscores', JSON.stringify(arr.slice(0, 10)));
    }
}
