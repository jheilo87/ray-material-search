const CACHE='raysmart-v1.0-fix-20260730-3';
const ASSETS=['./','./index.html','./search.html','./sn.html','./calendar.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;

  const requestUrl=new URL(event.request.url);

  // HTML navigation: use network first, then the exact cached page.
  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          return response;
        })
        .catch(async()=>{
          return (await caches.match(event.request))
            || (await caches.match(requestUrl.pathname.endsWith('/')?'./index.html':requestUrl.pathname.split('/').pop()))
            || (await caches.match('./index.html'));
        })
    );
    return;
  }

  // Other assets: network first, cache fallback.
  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
