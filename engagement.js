/* Optional next steps. No automatic casts, votes, saves, shares or install prompts. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 let api,casts=0,active=null,ready=false;
 const seen=new Set(),dismissed=new Set();
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const track=(event,placement,data={})=>{try{window.manlyAnalytics?.track(event,{feature:api?.snapshot().view||'play',placement,...data});}catch{}};
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className='eng-button';b.addEventListener('click',fn);return b;};
 function impression(el,placement){
  if(!el||seen.has(placement)||el.hidden)return;
  const mark=()=>{if(seen.has(placement)||el.hidden)return;seen.add(placement);track('prompt_shown',placement);};
  if(typeof IntersectionObserver==='function'){
   const observer=new IntersectionObserver(rows=>{if(rows.some(r=>r.isIntersecting)){mark();observer.disconnect();}},{threshold:.4});observer.observe(el);
  }else mark();
 }
 function action(placement,outcome,fn){track('prompt_action',placement,{outcome});return fn();}
 function qualified(){const s=api.snapshot();return s.totalCasts>=5||s.favorites.length>0;}
 function installed(){return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
 function refresh(){
  const s=api.snapshot();
  $('installTop').hidden=!qualified()||installed();
  for(const id of ['shareCollection','saveCollection','favoriteDuel'])$(id).disabled=!s.favorites.length;
  $('collectionSummary').textContent=s.favorites.length?'Share up to 12 saved curses. Cards show the first 6. Your device keeps the full collection.':'Save a favorite to build a collection or send one into a Duel.';
 }
 function closePrompt(dismiss=false){
  if(active&&dismiss){dismissed.add(active);track('prompt_dismissed',active,{outcome:'dismissed'});try{sessionStorage.setItem('manly-engagement-dismissed-'+today(),JSON.stringify([...dismissed]));}catch{}}
  active=null;$('nextStep').hidden=true;
 }
 function prompt(placement,title,label,fn){
  if(dismissed.has(placement)||seen.has(placement)||api.snapshot().view!=='play')return;
  closePrompt();active=placement;$('nextStepTitle').textContent=title;
  const b=$('nextStepAction');b.textContent=label;b.onclick=()=>{const p=active;closePrompt();action(p,'clicked',fn);};
  $('nextStep').hidden=false;impression($('nextStep'),placement);
 }
 function dailyPair(){
  const pool=api.snapshot().catalog.filter(c=>c.id<=2000);let n=2166136261;
  for(const ch of today())n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;
  const a=n%pool.length;const b=(a+1+(n>>>12)%(pool.length-1))%pool.length;
  return [pool[a].id,pool[b].id];
 }
 function startDailyDuel(){api.openDuel(dailyPair(),'daily_showdown');}
 function shareCollection(){
  const favorites=api.snapshot().favorites.slice(0,12);if(!favorites.length)return;
  return api.shareText('My petty collection',favorites.map(c=>'#'+c.id+' · '+c.text).join('\n\n'),{view:'favorites',collection:favorites.map(c=>c.id).join(','),campaign:'collection_share'},'collection_share');
 }
 async function saveCollection(){
  const all=api.snapshot().favorites.slice(0,12);if(!all.length)return;
  try{
   const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1500;const ctx=canvas.getContext('2d');if(!ctx)throw Error();
   ctx.fillStyle='#092b60';ctx.fillRect(0,0,1080,1500);ctx.fillStyle='#ffdb38';ctx.font='900 76px system-ui';ctx.fillText('MY PETTY COLLECTION',55,115);
   ctx.fillStyle='#fff';ctx.font='28px system-ui';ctx.fillText('MANLY CURSES · '+Math.min(6,all.length)+' saved picks',58,165);
   let y=215;for(const c of all.slice(0,6)){
    ctx.fillStyle='#fffdf3';ctx.fillRect(45,y,990,164);ctx.fillStyle='#16477a';ctx.font='bold 22px system-ui';ctx.fillText('#'+c.id+' · '+c.category,65,y+32);
    let lines=[],size=32;do{size-=1;ctx.font='bold '+size+'px system-ui';lines=[];let line='';for(const word of c.text.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>940&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);}while(lines.length>3&&size>18);
    lines.forEach((s,i)=>ctx.fillText(s,65,y+68+i*(size+4)));y+=180;
   }
   ctx.fillStyle='#ffdb38';ctx.font='bold 24px system-ui';ctx.fillText('OPEN THE LINK TO VIEW UP TO 12 PICKS',55,1340);
   ctx.fillStyle='white';ctx.font='21px system-ui';const url=api.url({view:'favorites',collection:all.map(c=>c.id).join(','),campaign:'collection_share'});
   for(let i=0;i<url.length;i+=85)ctx.fillText(url.slice(i,i+85),55,1380+Math.floor(i/85)*28);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error();
   const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='my-petty-collection.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),15000);
   track('download','collection_card',{feature:'favorites',method:'file'});api.toast('COLLECTION CARD READY. YOUR FULL SAVE IS UNCHANGED.');
  }catch{api.toast('COULD NOT MAKE THE COLLECTION CARD. TRY SHARING THE LINK.');}
 }
 function readCollection(){
  const raw=new URLSearchParams(location.search).get('collection');if(!raw||!/^\d+(,\d+){0,11}$/.test(raw))return;
  const s=api.snapshot(),ids=[...new Set(raw.split(',').map(Number))],rows=ids.map(id=>s.catalog.find(c=>c.id===id)).filter(Boolean);if(!rows.length)return;
  const box=$('sharedCollection');box.hidden=false;const grid=$('sharedCollectionItems');grid.replaceChildren();
  for(const c of rows){const item=document.createElement('article'),text=document.createElement('p');text.textContent='#'+c.id+' · '+c.text;item.append(text,button('VIEW CURSE',()=>api.viewCurse(c.id)),button('SAVE / REMOVE FAVORITE',()=>api.favorite(c.id,'collection_share')));grid.append(item);}
  track('collection_open','collection_share',{feature:'favorites'});
 }
 const module={
  init(adapter){
   api=adapter;ready=true;try{for(const p of JSON.parse(sessionStorage.getItem('manly-engagement-dismissed-'+today())||'[]'))dismissed.add(p);}catch{}
   const s=api.snapshot(),latest=s.latest;
   $('dailyCard').hidden=!latest;
   if(latest){$('dailyCardTitle').textContent=latest.date===today()?"TODAY'S DAILY ORIGINAL":"LATEST DAILY ORIGINAL";$('dailyCardMeta').textContent=latest.date+' · #'+latest.id+' · A new tiny inconvenience';}
   $('dailyCardCast').addEventListener('click',()=>action('daily_card','cast',()=>api.cast(latest.id,'daily','daily_card')));
   $('dailyCardShare').addEventListener('click',()=>action('daily_share','share',()=>api.shareText('Today’s Daily Original',latest.text,{curse:latest.id,shared:1,campaign:'daily_share'},'daily_share',latest.id)));
   $('sameCategory').addEventListener('click',()=>action('same_category','cast',()=>{const current=api.snapshot().current,pool=api.snapshot().catalog.filter(c=>c.category===current.category&&c.id!==current.id);if(!pool.length)return api.toast('MORE ORIGINALS WILL ARRIVE HERE. TRY ANOTHER CATEGORY.');api.cast(pool[Math.floor(Math.random()*pool.length)].id,'play','same_category');}));
   $('nextStepClose').addEventListener('click',()=>closePrompt(true));
   for(const id of ['dailyShowdown','duelDailyShowdown'])$(id).addEventListener('click',()=>action('daily_showdown','duel',startDailyDuel));
   $('shareCollection').addEventListener('click',()=>action('collection_share','share',shareCollection));
   $('saveCollection').addEventListener('click',()=>action('collection_card','download',saveCollection));
   $('favoriteDuel').addEventListener('click',()=>action('favorites_duel','duel',()=>{const s=api.snapshot(),first=s.favorites[0]?.id;if(!first)return;const pool=s.catalog.filter(c=>c.id!==first);api.openDuel([first,pool[Math.floor(Math.random()*pool.length)].id],'favorites_duel');}));
   for(const b of document.querySelectorAll('[data-eng-category]'))b.addEventListener('click',()=>action('category_landing','category',()=>api.selectCategory(b.dataset.engCategory)));
   readCollection();refresh();module.onView(s.view);
  },
  onCast(){if(!ready)return;casts++;refresh();const s=api.snapshot();if(casts===2&&!s.favorites.some(c=>c.id===s.current.id))prompt('after_two_casts','KEEP A CURSE THAT MAKES YOU SMILE.','SAVE THIS FAVORITE',()=>api.favorite(s.current.id,'after_two_casts'));
   else if(casts===3)prompt('after_three_casts','TWO CURSES. YOU PICK THE PETTIER ONE.','TRY A DUEL',()=>api.openDuel(null,'after_three_casts'));
   else if(casts===4)prompt('share_after_four','FOUND A GOOD ONE? SEND A TINY INCONVENIENCE.','SHARE THIS CURSE',()=>api.share('share_after_four'));
   else if(casts===5&&qualified()&&!installed())prompt('install_offer','KEEP THE PETTINESS CLOSE. PLAY OFFLINE TOO.','INSTALL OPTIONS',()=>api.install('install_offer'));
  },
  onFavorite(added){if(!ready)return;refresh();if(added&&casts<2&&api.snapshot().view==='play'&&!installed())prompt('after_favorite','YOUR FAVORITES CAN TRAVEL WITH THE APP.','INSTALL OPTIONS',()=>api.install('after_favorite'));},
  onView(view){if(!ready)return;closePrompt();refresh();if(view==='play'){impression($('dailyCard'),'daily_card');impression($('dailyCardShare'),'daily_share');impression($('sameCategory'),'same_category');impression($('dailyShowdown'),'daily_showdown');}
   if(view==='favorites'&&api.snapshot().favorites.length){impression($('shareCollection'),'collection_share');impression($('saveCollection'),'collection_card');impression($('favoriteDuel'),'favorites_duel');}
   if(view==='duel')impression($('duelGuide'),'duel_intro');
  },dailyPair
 };
 window.manlyEngagement=module;
})();
