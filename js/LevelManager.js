// js/LevelManager.js
import { levels } from './levels.js';
import GameMap from './GameMap.js';
import Player  from './Player.js';
import Enemy   from './Enemy.js';
import Score   from './Score.js';
import Bomb    from './Bomb.js';
import { refreshHighscoreList, showMenu} from '../game.js';

const PLAYER_LIVES = 3;



export default class LevelManager {
    constructor(ctx, tilesImg, fieldsImg) {
        this.ctx = ctx;
        this.score = new Score(0, PLAYER_LIVES);
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

        const sx = this.FIELD_BORDER + this.bgCol * (this.FIELD_W + this.FIELD_BORDER);
        const sy = this.FIELD_BORDER
            + this.TOP_BORDER_Y
            + this.bgRow * (this.FIELD_H + this.FIELD_BORDER + this.TOP_BORDER_Y);


        const mapW = this.map.cols * this.map.tileSize;
        const mapH = this.map.rows * this.map.tileSize;


        const dx = this.offsetX;
        const dy = this.offsetY;


        this.ctx.drawImage(
            this.fieldsImg,
            sx, sy,
            this.FIELD_W, this.FIELD_H,
            dx, dy,
            mapW, mapH
        );


    }


    load(levelIndex) {
        const lvl = levels[levelIndex];
        this.bgCol = lvl.bgCol;
        this.bgRow = lvl.bgRow;

        this.map    = new GameMap(lvl.mapData, lvl.mapData[0].length, lvl.mapData.length, lvl.tileSize, this.bombs, this.tilesImg);

        this.player = new Player(lvl.playerStart.x, lvl.playerStart.y, lvl.tileSize, PLAYER_LIVES);
        this.playerStart = { x: this.player.xTile, y: this.player.yTile };

        this.bombs  = [];
        this.map.bombs = this.bombs
        this.explosions = [];
        this.bombTimer = lvl.bombTimer;

        this.enemies = lvl.enemyStarts.map(pos =>
            new Enemy(pos.x, pos.y, 'blue',
                this.map, this.bombs, this.explosions, this.player,
                lvl.enemyMoveDelay, lvl.bombTimer, this.map.tileSize)
        );

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
            this.endGame(true);
        }
    }

    endGame(victory) {

        if (victory) {
            Score.saveHighScores({ name:'You', value: this.score.value });
            refreshHighscoreList();
            showMenu('victory');
        } else {
            showMenu('gameover');
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
