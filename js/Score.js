import { refreshHighscoreList } from '../game.js';

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

    // Score.js

    /** Přepíše celý seznam nejlepších skóre */
    static setHighScores(arr) {
        const top = arr
            .sort((a,b)=> b.value - a.value)
            .slice(0,10);
        localStorage.setItem('highscores', JSON.stringify(top));
    }

    /** Vygeneruje a stáhne JSON se skóre */
    static exportHighScores() {
        const data = JSON.stringify(Score.loadHighScores(), null, 2);
        const blob = new Blob([data], {type: 'application/json'});
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'highscores.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    /** Naimportuje ze souboru a merge-ne se stávajícím */
    static importHighScores(file) {
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const imported = JSON.parse(e.target.result);
                const existing = Score.loadHighScores();
                // sloučíme, vyfiltrujeme duplicitní jména, setneme top10
                const map = new Map();
                [...existing, ...imported].forEach(ent=>{
                    if (!map.has(ent.name) || map.get(ent.name).value < ent.value) {
                        map.set(ent.name, ent);
                    }
                });
                Score.setHighScores(Array.from(map.values()));
                refreshHighscoreList();
            } catch(err) {
                console.error('error on import', err);
            }
        };
        reader.readAsText(file);
    }

}
