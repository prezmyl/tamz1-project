// js/LevelManager.js
import { levels } from './levels.js';
import GameMap from './GameMap.js';
import Player  from './Player.js';
import Enemy   from './Enemy.js';
import Score   from './Score.js';
import Bomb    from './Bomb.js';

export default class LevelManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.score = new Score(0);
        this.current = 0;
    }

    load(levelIndex) {
        const lvl = levels[levelIndex];
        this.map    = new GameMap(lvl.mapData, lvl.mapData[0].length, lvl.mapData.length, lvl.tileSize);
        this.player = new Player(lvl.playerStart.x, lvl.playerStart.y, 'white');
        this.bombs  = [];
        this.explosions = [];
        this.enemies = lvl.enemyStarts.map(pos =>
            new Enemy(pos.x, pos.y, 'blue',
                this.map, this.bombs, this.explosions, this.player,
                lvl.enemyMoveDelay, lvl.bombTimer)
        );
        this.bombTimer = lvl.bombTimer;
        this.current = levelIndex;
    }

    next() {
        if (this.current + 1 < levels.length) {
            this.load(this.current + 1);
        } else {
            // TODO: end-of-game (vítězství) – zobraz menu / highscore
        }
    }
}
