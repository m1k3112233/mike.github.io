import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../meal-planner/sw.js', import.meta.url), 'utf8');
function worker({brokenInstall=false}={}) {
  const events = new Map(), deleted=[], requests=[];
  const cachedIndex = new Response('<main>Previous complete app</main>', {headers:{'content-type':'text/html'}});
  const cache = {
    addAll: async (list) => {requests.push(...list); if(brokenInstall) throw new Error('Integrity mismatch');},
    match: async (request) => String(request.url || request).endsWith('/index.html') ? cachedIndex.clone() : undefined,
    put: async () => {},
  };
  let claimed=false, skipped=false, networkCalls=0;
  const self = {location:new URL('https://app.example/mealplanner/sw.js'),clients:{claim:async()=>{claimed=true;}},skipWaiting:()=>{skipped=true;},addEventListener:(name,handler)=>events.set(name,handler)};
  const sandbox = {self,URL,Request,Response,caches:{open:async()=>cache,keys:async()=>['meal-planner-%2Fmealplanner%2F-old','other-app-cache','meal-planner-%2Felsewhere%2F-old'],delete:async key=>deleted.push(key)},fetch:async()=>{networkCalls++; return new Response('network');}};
  const built = source.replaceAll('__BUILD_VERSION__','build-runtime-check').replace(/__SRI_[A-Z0-9_]+__/g,'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
  vm.runInNewContext(`${built}\nself.cacheName = CACHE_NAME;`,sandbox);
  return {self,events,requests,deleted,get claimed(){return claimed;},get skipped(){return skipped;},get networkCalls(){return networkCalls;}};
}

test('built worker uses its real content version and installs an integrity-checked complete shell', async()=>{
  const w=worker(); let pending;
  w.events.get('install')({waitUntil:value=>{pending=value;}}); await pending;
  assert.match(w.self.cacheName,/build-runtime-check$/);
  for(const r of w.requests){assert.match(r.integrity,/^sha256-/);assert.equal(r.cache,'reload');assert.ok(r.url.startsWith('https://app.example/mealplanner/'));}
  assert.ok(w.requests.some(r=>r.url.endsWith('/app.js')));
  assert.ok(w.requests.some(r=>r.url.endsWith('/icons/apple-touch-icon.png')));
  assert.equal(w.skipped,false,'New versions must wait for explicit user approval');
});

test('incomplete or mixed deployment rejects installation',async()=>{
  const w=worker({brokenInstall:true});let pending;
  w.events.get('install')({waitUntil:value=>{pending=value;}});
  await assert.rejects(pending,/Integrity mismatch/);
  assert.equal(w.claimed,false);
});

test('activation cleans only this app scope and explicit update message activates',async()=>{
  const w=worker();let pending;
  w.events.get('activate')({waitUntil:value=>{pending=value;}});await pending;
  assert.deepEqual(w.deleted,['meal-planner-%2Fmealplanner%2F-old']);assert.equal(w.claimed,true);
  w.events.get('message')({data:{type:'SKIP_WAITING'}});assert.equal(w.skipped,true);
});

test('offline navigations keep the active shell and unrelated requests are left alone',async()=>{
  const w=worker();let response;
  w.events.get('fetch')({request:{method:'GET',mode:'navigate',url:'https://app.example/mealplanner/?day=2026-09-07'},respondWith:value=>{response=value;}});
  assert.match(await(await response).text(),/Previous complete app/);assert.equal(w.networkCalls,0);
  let intercepted=false;
  for(const url of ['https://app.example/other/','https://external.example/mealplanner/']) w.events.get('fetch')({request:{method:'GET',url},respondWith:()=>{intercepted=true;}});
  assert.equal(intercepted,false);
});
