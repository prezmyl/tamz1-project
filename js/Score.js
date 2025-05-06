
export default class Score {
    /**
     * @param {number} initialValue  Pocat. score (vychozi je 0)
     */
    constructor(initialValue = 0) {
        this.value = initialValue;
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
        ctx.fillText(`Score: ${this.value}`, 10, 25);
    }
}
