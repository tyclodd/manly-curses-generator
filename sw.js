/* Offline game assets, navigation fallback, and cached soundtrack seeking. */
const RELEASE = '4.3.2';
const CACHE = 'manly-curses-diamond-v'+RELEASE;
const APP_FILES = [
 './', './index.html', './style.css', './v3-design.css', './app.js', './config.js',
 './curses-data.js', './categories-data.js', './community.css', './refinements.css', './manifest.webmanifest',
 './assets/tye-mascot.webp', './favicon.ico', './assets/favicon-official-16.png', './assets/favicon-official-32.png', './assets/favicon-official-48.png',
 './assets/apple-touch-icon-official-180.png', './assets/icon-official-192.png', './assets/icon-official-512.png',
 './assets/icon-official-maskable-192.png', './assets/icon-official-maskable-512.png',
 './assets/social-preview.jpg', './photo-trial.css', './photo-trial.js', './assets/tye-capybara-photo.webp', './assets/hes-a-manly-man.mp3'
];
const PRECACHE=APP_FILES.map(file=>/\.(js|css)$/.test(file)?file+'?v='+RELEASE:file);
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('manly-curses-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const req=event.request;
 if(req.method!=='GET' || new URL(req.url).origin!==self.location.origin)return;
 // Journal pages and live ranking/vote APIs must bypass the offline game cache.
 if(/^\/(?:journal|api)(?:\/|$)/.test(new URL(req.url).pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  // Keep navigation and the stable installation manifest fresh while online.
  const url=new URL(req.url);
  if(req.mode==='navigate'||url.pathname.endsWith('/manifest.webmanifest')){
   const fallback=req.mode==='navigate'?'./index.html':'./manifest.webmanifest';
   try {
    const response=await fetch(req);
    if(response.ok)event.waitUntil(cache.put(fallback,response.clone()));
    return response;
   } catch(error) {
    const page=await cache.match(fallback);
    if(page)return page;
    throw error;
   }
  }
  const version=url.searchParams.get('v');
  const cached=version&&version!==RELEASE?undefined:await cache.match(req,{ignoreSearch:true});
  if(cached){
   const range=req.headers.get('Range');
   if(range)return partialResponse(cached,range);
   return cached;
  }
  return fetch(req);
 })());
});

async function partialResponse(response,range){
 const match=/^bytes=(\d*)-(\d*)$/.exec(range);
 if(!match || (!match[1]&&!match[2]))return response;
 const buffer=await response.arrayBuffer(),size=buffer.byteLength;
 let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
 let end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||start>end||(!match[1]&&Number(match[2])===0)){
  return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
 }
 const headers=new Headers(response.headers);
 headers.set('Accept-Ranges','bytes');
 headers.set('Content-Range',`bytes ${start}-${end}/${size}`);
 headers.set('Content-Length',String(end-start+1));
 headers.delete('Content-Encoding');
 return new Response(buffer.slice(start,end+1),{status:206,statusText:'Partial Content',headers});
}
