/* Private, pseudonymous usage analytics. No names, targets, text, URLs or IPs. */
(() => {
 'use strict';
 const endpoint=window.MANLY_CONFIG?.analyticsEndpoint;
 if(!endpoint||!/^https:\/\//.test(endpoint)||!crypto.randomUUID)return;
 const EVENTS=new Set(['visit','engagement','curse_cast','favorite_added','favorite_removed','duel_vote','share','copy','download','view','category_selected','install_prompt','app_installed','app_open','prompt_shown','prompt_action','prompt_dismissed','duel_open','duel_vote_accepted','install_choice','collection_open']);
 const PLACEMENTS=new Set(['daily_card','daily_share','same_category','favorite_action','after_two_casts','after_three_casts','share_after_four','install_offer','after_favorite','favorites_duel','daily_showdown','duel_intro','collection_share','collection_card','install_top','install_about','category_landing']);
 const OUTCOMES=new Set(['clicked','cast','favorite','duel','share','download','category','accepted','dismissed','instructions']);
 const CAMPAIGNS=new Set(['instagram_story','instagram_bio','duel_poll','youtube_short','daily_share','collection_share']);
 const campaign=new URLSearchParams(location.search).get('campaign');
 const FEATURES=new Set(['play','daily','duel','vault','favorites','support','suggest','achievements','install','settings']);
 const categories=new Set([...(window.MANLY_CATEGORIES||[]),'Daily Originals']);
 const test=new URLSearchParams(location.search).get('analytics_test')==='1';
 const prefix='manly-analytics-'+(test?'qa-':'')+'v2-',OPT='manly-analytics-disabled';
 const read=k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
 const remove=k=>{try{localStorage.removeItem(k);}catch{}};
 const signal=()=>navigator.globalPrivacyControl===true||navigator.doNotTrack==='1';
 let enabled=read(OPT)!==true&&!signal(),queue=read(prefix+'queue'),visitor=read(prefix+'visitor'),session=read(prefix+'session');
 queue=Array.isArray(queue)?queue.filter(e=>Number.isSafeInteger(e.at)&&e.at>Date.now()-7*86400000).slice(-200):[];
 let flushing=false,timer=null,lastActivity=Date.now(),lastTick=Date.now(),activeMs=0,lastHeartbeat=Date.now();
 const device=/iPad|Tablet/i.test(navigator.userAgent)?'tablet':/Mobi|Android|iPhone/i.test(navigator.userAgent)?'mobile':'desktop';
 function persist(){write(prefix+'queue',queue);}
 function append(event,data,at=Date.now()){
  const e={id:crypto.randomUUID(),visitorId:visitor.id,sessionId:session.id,event,at,device,returning:session.returning,test};
  if(FEATURES.has(data.feature))e.feature=data.feature;
  if(Number.isInteger(data.curseId)&&data.curseId>0&&data.curseId<=1000000)e.curseId=data.curseId;
  if(categories.has(data.category))e.category=data.category;
  if(['native','clipboard','file','prompt','manual'].includes(data.method))e.method=data.method;
  if(PLACEMENTS.has(data.placement))e.placement=data.placement;
  if(OUTCOMES.has(data.outcome))e.outcome=data.outcome;
  if(CAMPAIGNS.has(session.campaign))e.campaign=session.campaign;
  if(event==='engagement')e.engagementMs=Math.min(30000,Math.max(0,Math.round(data.engagementMs||0)));
  queue.push(e);queue=queue.slice(-200);persist();
 }
 function ensureSession(){
  const now=Date.now();
  if(!visitor?.id||now-visitor.createdAt>=90*86400000){visitor={id:crypto.randomUUID(),createdAt:now,hadSession:false};session=null;}
  if(!session?.id||session.visitorId!==visitor.id||now-session.lastAt>=30*60000){
   session={id:crypto.randomUUID(),visitorId:visitor.id,lastAt:now,returning:!!visitor.hadSession,campaign:CAMPAIGNS.has(campaign)?campaign:null};
   visitor.hadSession=true;write(prefix+'visitor',visitor);write(prefix+'session',session);append('visit',{});
  }
  session.lastAt=now;write(prefix+'session',session);
 }
 function schedule(){if(timer===null)timer=setTimeout(()=>{timer=null;void flush();},2000);}
 function track(event,data={}){
  if(!enabled||signal()||!EVENTS.has(event)||event==='visit')return;
  try{ensureSession();append(event,data);schedule();}catch{}
 }
 async function flush(){
  if(!enabled||signal()||flushing||!queue.length||navigator.onLine===false)return;
  flushing=true;
  try{
   // Each acknowledged event ID is removed once. Retries are deduplicated server-side.
   for(let n=0;n<10&&queue.length&&enabled;n++){
    const batch=queue.slice(0,20);
    const response=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({events:batch}),keepalive:true,cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)break;
    const result=await response.json();if(!Array.isArray(result.accepted))break;
    const accepted=new Set(result.accepted);queue=queue.filter(e=>!accepted.has(e.id));persist();
    if(!batch.some(e=>accepted.has(e.id)))break;
   }
  }catch{}finally{flushing=false;}
 }
 function tick(){
  const now=Date.now();
  if(enabled&&document.visibilityState==='visible')activeMs+=Math.max(0,Math.min(now,lastActivity+30000)-lastTick);
  lastTick=now;
 }
 function heartbeat(){
  tick();
  if(activeMs>=1000){const ms=Math.min(30000,activeMs);activeMs-=ms;track('engagement',{engagementMs:ms});}
  lastHeartbeat=Date.now();
 }
 function updatePrivacy(){
  const el=document.getElementById('analyticsToggle');if(!el)return;
  el.textContent=signal()?'ANONYMOUS ANALYTICS OFF · PRIVACY SIGNAL':enabled?'TURN OFF ANONYMOUS ANALYTICS':'ALLOW ANONYMOUS ANALYTICS';
  el.setAttribute('aria-pressed',String(enabled&&!signal()));el.disabled=signal();
 }
 function setEnabled(value){
  enabled=!!value&&!signal();write(OPT,!value);
  if(!enabled){queue=[];activeMs=0;visitor=null;session=null;for(const k of ['visitor','session','queue'])remove(prefix+k);}
  else{lastActivity=lastTick=Date.now();ensureSession();schedule();}
  updatePrivacy();
 }
 window.manlyAnalytics={track,flush,setEnabled,status:()=>({enabled:enabled&&!signal(),testTraffic:test,pending:queue.length})};
 document.getElementById('analyticsToggle')?.addEventListener('click',()=>setEnabled(!enabled));
 for(const ev of ['pointerdown','keydown','scroll'])document.addEventListener(ev,()=>{tick();lastActivity=Date.now();},{passive:true});
 document.addEventListener('visibilitychange',()=>{heartbeat();if(document.visibilityState==='visible'){lastActivity=lastTick=Date.now();}void flush();});
 window.addEventListener('pagehide',()=>{heartbeat();void flush();});
 window.addEventListener('online',()=>void flush());
 setInterval(()=>{tick();if(Date.now()-lastHeartbeat>=15000)heartbeat();},1000);
 setInterval(()=>void flush(),15000);
 if(enabled){try{ensureSession();if(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true)track('app_open',{feature:'install'});schedule();}catch{}}
 else{queue=[];for(const k of ['visitor','session','queue'])remove(prefix+k);}
 updatePrivacy();
})();
