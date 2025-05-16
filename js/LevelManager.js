// js/LevelManager.js
import { levels } from './levels.js';
import GameMap from './GameMap.js';
import Player  from './Player.js';
import Enemy   from './Enemy.js';
import Score   from './Score.js';
import Bomb    from './Bomb.js';

export default class LevelManager {
    constructor(ctx, tilesImg, fieldsImg) {
        this.ctx = ctx;
        this.score = new Score(0);
        this.current = 0;
        this.gameOver = false;
        this.tilesImg = tilesImg;
        this.fieldsImg = fieldsImg;

        // these constants come from your fields.png layout
        this.TOP_BORDER_Y  = 46;
        this.FIELD_W     = 640;
        this.FIELD_H     = 480 - this.TOP_BORDER_Y;
        this.FIELD_BORDER= 3;

    }

    // LevelManager.js

    draw() {
        // figure out which 640×480 chunk to slice from fieldsImg
        const sx = this.FIELD_BORDER + this.bgCol * (this.FIELD_W + this.FIELD_BORDER);
        const sy = this.FIELD_BORDER
            + (this.bgRow === 0 ? this.TOP_BORDER_Y : 0)
            + this.bgRow * (this.FIELD_H + this.FIELD_BORDER);

        // how big is our logical map in pixels?
        const mapW = this.map.cols * this.map.tileSize;
        const mapH = this.map.rows * this.map.tileSize;

        // where on screen do we draw it?
        const dx = this.offsetX;
        const dy = this.offsetY;

        // 1) draw *only* that map‐sized background region
        this.ctx.drawImage(
            this.fieldsImg,
            sx, sy,                 // source x,y
            this.FIELD_W, this.FIELD_H,  // source w,h
            dx, dy,                 // dest x,y
            mapW, mapH              // dest w,h
        );

        // 👉 NO this.map.draw() here any more
    }


    load(levelIndex) {
        const lvl = levels[levelIndex];
        this.bgCol = lvl.bgCol;
        this.bgRow = lvl.bgRow;
        this.map    = new GameMap(lvl.mapData, lvl.mapData[0].length, lvl.mapData.length, lvl.tileSize, this.bombs, this.tilesImg);
        this.player = new Player(lvl.playerStart.x, lvl.playerStart.y, lvl.tileSize);
        this.bombs  = [];
        this.map.bombs = this.bombs
        this.explosions = [];
        this.enemies = lvl.enemyStarts.map(pos =>
            new Enemy(pos.x, pos.y, 'blue',
                this.map, this.bombs, this.explosions, this.player,
                lvl.enemyMoveDelay, lvl.bombTimer, this.map.tileSize)
        );
        this.bombTimer = lvl.bombTimer;
        this.current = levelIndex;
    }

    next() {

        console.log("→ gameLoop start, level:", this.current);
        if (this.current + 1 < levels.length) {
            console.log("→ loading level", this.current+1);
            this.load(this.current + 1);
            console.log("→ loaded, new current:", this.current);
        } else {
            // TODO: end-of-game  –> zobraz menu / highscore
            this.gameOver = true;
            console.log("→ game over");
            // 1) save svore
            Score.saveHighScores({ name: 'Player', value: this.score.value });
            // 2) Nactu top10
            const top = Score.loadHighScores();
            // 3) Vykreslim canvas
            const ctx = this.ctx;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.fillText('🎉 Game Over! 🎉', 50, 50);
            ctx.fillText('High Scores:', 50, 90);
            top.forEach((e, i) => {
                ctx.fillText(`${i+1}. ${e.name}: ${e.value}`, 50, 130 + i * 30);
            });
            // 4) Ukonceni smycky <– no more requestAnimationFrame
        }
    }

    scheduleEnemyKill(enemy, deathTime) {
        setTimeout(() => {
            const idx = this.enemies.indexOf(enemy);
            if (idx !== -1) {
                this.enemies.splice(idx, 1);
                this.score.update(10);
            }
        }, deathTime);
    }
}
