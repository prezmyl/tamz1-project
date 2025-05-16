

import LevelManager from './js/LevelManager.js';
import Bomb         from './js/Bomb.js';
import Player       from './js/Player.js';
import Enemy        from './js/Enemy.js';
import Explosion    from './js/Explosion.js';
import Score        from './js/Score.js';

// ——————————————————————————————————————————————————
//  MENU HELPERS
// ——————————————————————————————————————————————————
export function showMenu(name) {


    document.getElementById('menu-container')
        .classList.remove('hidden');

    if (LM) LM.gameOver = true;

    ['main','gameover','victory'].forEach(id => {
        document.getElementById(id + '-menu')
            .classList.toggle('hidden', id !== name);
    });
}

export function refreshHighscoreList() {
    const top = Score.loadHighScores();
    const ol  = document.getElementById('highscore-list');
    ol.innerHTML = '';
    top.forEach((e,i) => {
        const li = document.createElement('li');
        li.textContent = `${i+1}. ${e.name}: ${e.value}`;
        ol.appendChild(li);
    });
}

// ——————————————————————————————————————————————————
//  BIND MENU BUTTONS
// ——————————————————————————————————————————————————
function bindMenuButtons() {
    const startBtn       = document.getElementById('btn-start');
    const quitMainBtn    = document.getElementById('btn-quit-main');
    const replayLoseBtn  = document.getElementById('btn-replay-lose');
    const quitLoseBtn    = document.getElementById('btn-quit-lose');
    const replayWinBtn   = document.getElementById('btn-replay-win');
    const quitWinBtn     = document.getElementById('btn-quit-win');
    const exportBtn      = document.getElementById('btn-export-scores');
    const importInput    = document.getElementById('import-scores');

    console.log('Binding menu buttons:', {
        startBtn, quitMainBtn,
        replayLoseBtn, quitLoseBtn,
        replayWinBtn, quitWinBtn,
        exportBtn, importInput
    });

    startBtn.addEventListener('click', () => {
        console.log('▶ Start clicked');
        document.getElementById('menu-container')
            .classList.add('hidden');
        LM.gameOver = false;
        lastFrameTime = performance.now();
        requestAnimationFrame(gameLoop);
    });

    quitMainBtn.addEventListener('click', () => {
        console.log('⏹ Quit (main) clicked');
        window.location.reload();
    });

    replayLoseBtn.addEventListener('click', () => {
        console.log('↺ Replay after lose clicked');
        window.location.reload();
    });
    quitLoseBtn.addEventListener('click', () => {
        console.log('⏹ Quit (lose) clicked');
        window.location.reload();
    });

    replayWinBtn.addEventListener('click', () => {
        console.log('↺ Replay after win clicked');
        window.location.reload();
    });
    quitWinBtn.addEventListener('click', () => {
        console.log('⏹ Quit (win) clicked');
        window.location.reload();
    });

    exportBtn.addEventListener('click', () => {
        console.log('⬇ Export scores clicked');
        Score.exportHighScores();
    });
    importInput.addEventListener('change', e => {
        console.log('⬆ Import scores change event');
        const file = e.target.files[0];
        if (file) {
            Score.importHighScores(file);
            // aktualizace seznamu v menu
            refreshHighscoreList();
        }
    });
}


window.addEventListener('DOMContentLoaded', bindMenuButtons);

// ——————————————————————————————————————————————————
//  SETUP CANVAS + GLOBALS
// ——————————————————————————————————————————————————
const canvas      = document.getElementById('gameCanvas');
const ctx         = canvas.getContext('2d');
let LM;            // LevelManager instance
let lastFrameTime; // for dt in gameLoop

const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };

// ——————————————————————————————————————————————————
//  KEYBOARD & TOUCH
// ——————————————————————————————————————————————————
document.addEventListener('keydown', e => {
    if (e.code in keys) keys[e.code] = true;
    if (e.code === 'Space' && LM) {
        Bomb.place(LM.player, LM.map, LM.bombs, LM.explosions, LM.bombTimer);
    }
});
document.addEventListener('keyup', e => { if (e.code in keys) keys[e.code] = false; });

const touchMap = { 'btn-up':'ArrowUp','btn-down':'ArrowDown','btn-left':'ArrowLeft','btn-right':'ArrowRight' };
Object.entries(touchMap).forEach(([id,key])=>{
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e=>{ e.preventDefault(); keys[key]=true; }, {passive:false});
    btn.addEventListener('touchend',   e=>{ e.preventDefault(); keys[key]=false; },{passive:false});
});
const bombBtn = document.getElementById('btn-bomb');
if (bombBtn) bombBtn.addEventListener('touchstart', e=>{ e.preventDefault();
    if (LM) Bomb.place(LM.player,LM.map,LM.bombs,LM.explosions,LM.bombTimer);
},{passive:false});

// ——————————————————————————————————————————————————
//  MAIN GAME LOOP
// ——————————————————————————————————————————————————
function gameLoop(now) {
    if (LM.gameOver) return;

    const dt = now - lastFrameTime;
    lastFrameTime = now;

    // UPDATE
    LM.player.update(dt, LM.map, keys);
    LM.enemies.forEach(e=>e.update(dt));
    //Enemy.killAll(LM.enemies, LM.score, 2000);


    // collision + life loss
    for (let i=LM.enemies.length-1;i>=0;i--){
        if (LM.enemies[i].isHitByExplosion(LM.explosions)) {
            LM.enemies.splice(i,1);
            LM.score.update(10);
        }
    }
    const hit = LM.explosions.some(e=>e.xTile===LM.player.xTile && e.yTile===LM.player.yTile);
    if (hit && !LM.player.isInvulnerable(now)) {
        LM.score.lives--;
        LM.player.invulnerableUntil=now+2000;
        LM.player.xTile=LM.playerStart.x;
        LM.player.yTile=LM.playerStart.y;
        LM.player.resetInterpolation();
        LM.bombs.length=0;
        if (LM.score.lives<=0) return LM.endGame(false);
    }

    // level clear
    if (LM.enemies.length===0 && LM.bombs.length===0 && LM.explosions.length===0) {
        LM.next();
        if (LM.gameOver) return;
        onResize();
        requestAnimationFrame(gameLoop);
        return;
    }

    // DRAW
    ctx.clearRect(0,0,canvas.width,canvas.height);
    LM.draw();
    ctx.save();
    ctx.translate(LM.offsetX,LM.offsetY);
    LM.map.draw(ctx);

    // bombs
    for (let i=LM.bombs.length-1;i>=0;i--) if (!LM.bombs[i].active) LM.bombs.splice(i,1);
    LM.bombs.forEach(b=>{ b.update(dt,now); b.draw(ctx,LM.map.tileSize,now); });

    // player & enemies
    LM.player.draw(ctx);
    LM.enemies.forEach(e=>e.draw(ctx,LM.map.tileSize));

    // explosions
    for (let i=LM.explosions.length-1;i>=0;i--){
        const ex=LM.explosions[i];
        ex.draw(ctx,now);
        if (ex.isDone(now)) LM.explosions.splice(i,1);
    }

    ctx.restore();
    LM.score.draw(ctx);

    requestAnimationFrame(gameLoop);
}

// ——————————————————————————————————————————————————
//  ASSET LOADING
// ——————————————————————————————————————————————————
const playerSheet = new Image();
const tilesImg    = new Image();
const fieldsImg   = new Image();
playerSheet.onload = onAssetLoad; playerSheet.src = 'assets/Atomic_Bomberman_Green.png';
tilesImg.onload    = onAssetLoad;    tilesImg.src    = 'assets/Atomic_Bomberman_Tiles.png';
fieldsImg.onload   = onAssetLoad;    fieldsImg.src   = 'assets/Atomic_Bomberman_Fields.png';

let assetsToLoad=3;
function onAssetLoad(){
    if (--assetsToLoad===0) initGame();
}

// ——————————————————————————————————————————————————
//  AUDIO
// ——————————————————————————————————————————————————
export const tickSound = new Audio('assets/sounds/tick.ogg');
export const boomSound = new Audio('assets/sounds/boom.ogg');
const bgMusic = new Audio('assets/sounds/bg.ogg');
bgMusic.loop   = true; bgMusic.volume = 0.2;

// ——————————————————————————————————————————————————
//  INITIALIZE EVERYTHING
// ——————————————————————————————————————————————————
function initGame() {
    Player.sheet = playerSheet;
    Enemy.sheet  = playerSheet;
    Bomb.sheet   = playerSheet;

    LM = new LevelManager(ctx, tilesImg, fieldsImg);
    LM.load(0);
    LM.gameOver = true;

    // sizing & start menu
    window.addEventListener('resize', onResize);
    onResize();
    lastFrameTime = performance.now();
    showMenu('main');
}

// ——————————————————————————————————————————————————
//  RESIZING
// ——————————————————————————————————————————————————
function onResize() {
    const w=window.innerWidth, h=window.innerHeight;
    canvas.width=w; canvas.height=h;
    const cols=LM.map.cols, rows=LM.map.rows;
    const ts = (Math.floor(w/cols)*rows <= h) ? Math.floor(w/cols) : Math.floor(h/rows);
    LM.map.tileSize=ts; LM.player.tileSize=ts; LM.player.resetInterpolation();
    LM.enemies.forEach(e=>{ e.tileSize=ts; e.resetInterpolation(); });
    LM.bombs.forEach(b=> b.anim.tileSize=ts);
    LM.explosions.forEach(ex=> ex.tileSize=ts);

    const mapW=cols*ts, mapH=rows*ts;
    LM.offsetX=Math.floor((w-mapW)/2); LM.offsetY=Math.floor((h-mapH)/2);

    if (w>h) { LM.score.x=10; LM.score.y=30; }
    else    { LM.score.x=LM.offsetX+10; LM.score.y=Math.max(20,LM.offsetY-40); }
    LM.score.level=LM.current+1;

    // adjust touch-controls
    const dpad=document.querySelector('.dpad');
    const bomb=document.getElementById('btn-bomb');
    if (w>h) {
        dpad.style.transform='scale(1)'; bomb.style.transform='scale(1.6)';
        dpad.style.left='30px'; dpad.style.bottom='40px';
        bomb.style.right='50px'; bomb.style.bottom='90px';
    } else {
        dpad.style.transform='scale(2.4)'; bomb.style.transform='scale(2.4)';
        dpad.style.left='120px'; dpad.style.bottom='200px';
        bomb.style.right='160px'; bomb.style.bottom='200px';
    }
}
