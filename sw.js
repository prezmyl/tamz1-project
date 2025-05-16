const CACHE_NAME = 'bomber-v1';
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './game.js',
    './js/GameMap.js',
    './js/Player.js',
    './js/Enemy.js',
    './js/Bomb.js',
    './js/Score.js',
    './js/LevelManager.js',
    './js/levels.js',
    './js/Explosion.js',
    './js/BombAnimation.js',
    './style.css'
];

// Instalace a cache resources
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(URLS_TO_CACHE))
    );
});

// Aktivace a cisteni starych cache
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
});

// Pri fetchi se nejdriv pokusime z cache, pak z networku
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request)
            .then(res => res || fetch(e.request))
    );
});
