/* Service worker simples: cacheia só os arquivos estáticos do próprio site
   (para abrir offline depois da primeira visita). Requisições de terceiros
   (fontes, mapas, cotação do euro, favicons) sempre vão direto pra rede. */
var CACHE_NAME = "ie-guide-v1";
var CORE_ASSETS = ["./", "index.html", "styles.css", "app.js", "manifest.json"];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(CORE_ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  var url = new URL(event.request.url);
  if(event.request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var network = fetch(event.request).then(function(resp){
        if(resp && resp.status === 200){
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return resp;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
