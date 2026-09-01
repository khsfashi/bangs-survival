const CACHE_NAME='bangs-survival-static-v8';
const STATIC_ASSETS=['/','/index.html','/styles.css','/art.css','/delight.css','/week.css','/ux-refresh.css','/logic.js','/horizon.js','/map.js','/app.js','/week.js','/fairies.js','/evidence.js','/encouragement.js','/gacha.js','/fairy-details.js','/manifest.webmanifest','/icon.svg'];

self.addEventListener('install',(event)=>{
  event.waitUntil(caches.open(CACHE_NAME).then((cache)=>cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',(event)=>{
  event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key!==CACHE_NAME).map((key)=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;

  event.respondWith(
    fetch(event.request)
      .then((response)=>{
        if(response.ok){
          const clone=response.clone();
          caches.open(CACHE_NAME).then((cache)=>cache.put(event.request,clone)).catch(()=>{});
        }
        return response;
      })
      .catch(()=>caches.match(event.request).then((cached)=>cached||caches.match('/index.html')))
  );
});