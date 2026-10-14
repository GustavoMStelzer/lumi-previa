importScripts('./audio-cache.js');
const CACHE='lumi-static-v3-'+self.LUMI_AUDIO_REVISION;
const ASSETS=['./','./index.html','./styles.css','./app.js','./content.js','./narration.js','./audio-manifest.js','./audio-cache.js','./assets/audio/lumi-voz-preview.mp3','./assets/audio/roteiro-narracao.txt','./model.js','./manifest.webmanifest','./assets/lumi.svg','./assets/forest.svg','./assets/icon-192.png','./assets/icon-512.png',...self.LUMI_AUDIO_FILES];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lumi-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok&&!response.redirected){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,clone));}return response;}).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate'){const page=await caches.match('./index.html');if(page)return page;}return new Response('Sem conexão. Abra a Lumi com internet uma primeira vez.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}));
});
