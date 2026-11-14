/* Vinil: guarda o app para abrir rápido e funcionar sem internet.
   Para publicar uma versão nova, mude o número em CACHE. */
var CACHE = 'vinil-v96';
var CAPAS = 'vinil-capas';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'apple-touch-icon-v2.png', 'privacidade.html'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE && k !== CAPAS; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var u = new URL(req.url);
  /* capas que o Vinil achou na internet: guarda para aparecerem sem internet */
  if(/(^|\.)mzstatic\.com$/.test(u.hostname)){
    e.respondWith(caches.open(CAPAS).then(function(c){
      return c.match(req).then(function(hit){
        return hit || fetch(req).then(function(r){ if(r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; });
      });
    }));
    return;
  }
  if(u.origin !== location.origin) return;
  /* páginas: tenta a internet primeiro e cai para o guardado quando estiver sem rede */
  if(req.mode === 'navigate'){
    e.respondWith(fetch(req).then(function(r){
      var copy = r.clone(); caches.open(CACHE).then(function(c){ c.put('index.html', copy); }); return r;
    }).catch(function(){ return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){ return hit || fetch(req); }));
});
