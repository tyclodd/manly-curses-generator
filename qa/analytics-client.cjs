const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{webcrypto}=require('node:crypto');
const source=fs.readFileSync(__dirname+'/../analytics.js','utf8');
function boot({storage=new Map(),dnt=false,gpc=false,offline=false}={}){
 let now=Date.now();const listeners={},docListeners={},intervals=[],timers=[],batches=[];
 const date=class extends Date{static now(){return now}};
 const button={addEventListener(){},setAttribute(){},disabled:false};
 const document={visibilityState:'visible',getElementById:()=>button,addEventListener:(e,fn)=>docListeners[e]=fn};
 const navigator={userAgent:'Mobile Android',doNotTrack:dnt?'1':'0',globalPrivacyControl:gpc,onLine:!offline};
 const window={MANLY_CONFIG:{analyticsEndpoint:'https://example.com/api/analytics-collect'},MANLY_CATEGORIES:['The Founding Fifty'],addEventListener:(e,fn)=>listeners[e]=fn};
 const fetch=async(url,o)=>{const b=JSON.parse(o.body).events;batches.push(b);return Response.json({accepted:b.map(e=>e.id)})};
 const context={window,document,navigator,location:{search:'?analytics_test=1&to=PRIVATE_NAME'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},crypto:webcrypto,Date:date,URLSearchParams,fetch,Response,AbortSignal,matchMedia:()=>({matches:false}),setTimeout:(fn)=>{timers.push(fn);return timers.length},setInterval:fn=>intervals.push(fn)};
 vm.runInNewContext(source,context);
 return{api:window.manlyAnalytics,storage,batches,navigator,document,listeners,docListeners,step(ms){now+=ms;intervals.forEach(fn=>fn())},runTimers(){timers.splice(0).forEach(fn=>fn())}};
}
(async()=>{
 const a=boot();a.api.track('curse_cast',{curseId:2,category:'The Founding Fifty',feature:'play',name:'PRIVATE_NAME',target:'PRIVATE_NAME'});await a.api.flush();assert.equal(a.batches.flat().filter(e=>e.event==='visit').length,1);assert(!JSON.stringify(a.batches).includes('PRIVATE_NAME'));assert(a.batches.flat().every(e=>e.test));
 for(let i=0;i<60;i++){a.step(1000);for(let j=0;j<6;j++)await Promise.resolve();}await a.api.flush();const ms=a.batches.flat().reduce((n,e)=>n+(e.engagementMs||0),0);assert.equal(ms,30000,'Idle engagement inflated');
 a.document.visibilityState='hidden';a.docListeners.visibilitychange();a.step(60000);await a.api.flush();assert.equal(a.batches.flat().reduce((n,e)=>n+(e.engagementMs||0),0),30000,'Hidden time counted');
 const visits=a.batches.flat().filter(e=>e.event==='visit').length;a.step(31*60000);a.document.visibilityState='visible';a.docListeners.pointerdown();a.api.track('favorite_added',{feature:'favorites',curseId:2});await a.api.flush();assert.equal(a.batches.flat().filter(e=>e.event==='visit').length,visits+1);assert(a.batches.flat().at(-1).returning);
 const off=boot({offline:true});off.api.track('curse_cast',{feature:'daily',category:'Daily Originals',curseId:2001});await off.api.flush();assert.equal(off.batches.length,0);assert(off.api.status().pending>=2);const reload=boot({storage:off.storage});await reload.api.flush();assert.equal(reload.batches.flat().filter(e=>e.event==='curse_cast').length,1,'Offline event lost');
 reload.api.setEnabled(false);reload.api.track('curse_cast',{curseId:2});await reload.api.flush();assert.equal(reload.api.status().pending,0);assert.equal(reload.storage.get('manly-analytics-disabled'),'true');
 for(const opt of [{dnt:true},{gpc:true}]){const x=boot(opt);x.api.track('curse_cast');await x.api.flush();assert.equal(x.batches.length,0);assert.equal(x.api.status().enabled,false)}
 console.log('PASS: real client script, privacy signals and opt-out, metadata allowlist, 30-second idle cutoff, hidden-tab exclusion, new/returning sessions and persisted offline retries.');
})().catch(e=>{console.error(e);process.exitCode=1});
