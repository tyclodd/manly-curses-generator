// Scenario checks execute the production scripts in an isolated DOM/media adapter.
// This covers game behavior and API fallbacks; it is not browser or device QA.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {File}=require('node:buffer');
const dist=process.argv[2],tree=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};

function boot(saved={}, options={}){
  const env={now:Date.UTC(2026,9,13,12),mediaBlocked:true,standalone:false,reducedMotion:true,storageBlocked:false,downloads:[],shared:[],clipboard:[],playCalls:0,reloads:0,registered:[],effects:0,navigation:[],...options};
  let timerId=0;
  const timers=new Map(),intervals=new Map(),frames=new Map(),storage=new Map(Object.entries(saved)),blobUrls=new Map();
  class Events{
    constructor(){this.events=new Map();}
    addEventListener(type,fn,opts={}){if(!this.events.has(type))this.events.set(type,[]);this.events.get(type).push({fn,opts});}
    async emit(type,event={}){event.type=type;event.target??=this;event.preventDefault??=()=>{event.defaultPrevented=true;};for(const entry of [...(this.events.get(type)||[])]){await entry.fn(event);if(entry.opts.once)this.events.set(type,this.events.get(type).filter(x=>x!==entry));}}
  }
  class Element extends Events{
    constructor(tag,attrs={},text=''){super();this.tagName=tag.toUpperCase();this.attrs={...attrs};this.children=[];this._text=text;this.parentElement=null;this.hidden='hidden'in attrs;this.disabled='disabled'in attrs;this.checked='checked'in attrs;this.value=attrs.value??(tag==='textarea'?text:'');this.style={setProperty:(k,v)=>{this.style[k]=v;}};this.dataset=new Proxy({},{set:(data,key,value)=>{data[key]=String(value);this.attrs['data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=String(value);return true;}});for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;
      this.classList={add:(...v)=>{this.className=[...new Set([...this.className.split(/\s+/).filter(Boolean),...v])].join(' ');},remove:(...v)=>{this.className=this.className.split(/\s+/).filter(x=>!v.includes(x)).join(' ');},contains:v=>this.className.split(/\s+/).includes(v),toggle:(v,flag)=>{const on=flag===undefined?!this.classList.contains(v):flag;on?this.classList.add(v):this.classList.remove(v);return on;}};
      this.paused=true;this.ended=false;this.error=null;this.muted=false;this.duration=229;this.currentTime=0;
    }
    get id(){return this.attrs.id;}
    get className(){return this.attrs.class||'';}set className(v){this.attrs.class=v;}
    get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this._text=String(v);this.children=[];}
    get innerHTML(){return this._text;}set innerHTML(v){this._text=v;this.children=[];}
    get href(){return this.attrs.href||'';}set href(v){this.attrs.href=String(v);}
    get src(){return this.attrs.src||'';}set src(v){this.attrs.src=String(v);}
    get offsetWidth(){return 500;}
    get isConnected(){let n=this;while(n.parentElement)n=n.parentElement;return n===page;}
    setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}removeAttribute(k){delete this.attrs[k];}
    append(...nodes){for(const n of nodes){if(n.tagName==='FRAGMENT'){this.append(...n.children);continue;}n.parentElement=this;this.children.push(n);}}
    replaceChildren(...nodes){this._text='';this.children=[];this.append(...nodes);}
    remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);}
    cloneNode(deep=false){const n=new Element(this.tagName.toLowerCase(),this.attrs,this._text);n.value=this.value;if(deep)n.append(...this.children.map(c=>c.cloneNode(true)));return n;}
    querySelectorAll(selector){return descendants(this).filter(n=>matches(n,selector));}querySelector(s){return this.querySelectorAll(s)[0]||null;}
    closest(s){let n=this;while(n){if(matches(n,s))return n;n=n.parentElement;}return null;}
    focus(){document.activeElement=this;}select(){}scrollIntoView(){}getBoundingClientRect(){return {left:0,top:0,width:500,height:350};}
    reportValidity(){return this.querySelectorAll('[required]').every(n=>n.attrs.type==='checkbox'?n.checked:!!n.value);}
    async click(){if(this.disabled)return;if(this.tagName==='A'&&this.download)env.downloads.push({name:this.download,blob:blobUrls.get(this.href)});await this.emit('click');if(this.onclick)await this.onclick({target:this});}
    play(){env.playCalls++;if(env.mediaBlocked)return Promise.reject(new Error('Autoplay requires gesture'));this.paused=false;this.emit('playing');return Promise.resolve();}
    pause(){this.paused=true;this.emit('pause');}
    load(){this.paused=true;this.error=null;env.audioReloads=(env.audioReloads||0)+1;}
    getContext(){return canvasContext;}toBlob(cb){cb(new Blob(['adapter image'],{type:'image/png'}));}
  }
  function descendants(node){return node.children.flatMap(n=>[n,...descendants(n)]);}
  function matches(node,selector){return selector.split(',').some(raw=>{const s=raw.trim();if(s.startsWith('#'))return node.id===s.slice(1);if(s.startsWith('.'))return node.classList.contains(s.slice(1));const attr=/^\[([^\]=]+)(?:=["']?([^"'\]]+)["']?)?\]$/.exec(s);if(attr)return attr[1]in node.attrs&&(attr[2]===undefined||node.attrs[attr[1]]===attr[2]);if(s==='button:not([disabled])')return node.tagName==='BUTTON'&&!node.disabled;if(s==='a[href]')return node.tagName==='A'&&!!node.href;return node.tagName.toLowerCase()===s;});}
  function build(data){const n=new Element(data.tag,data.attrs,data.text);n.append(...data.children.map(build));if(n.tagName==='SELECT')n.value=n.children[0]?.value||'';return n;}
  const document=new Events(),page=build(tree);
  Object.assign(document,{readyState:options.readyState||'complete',hidden:false,body:page.querySelector('body'),documentElement:page,createElement:t=>new Element(t),createDocumentFragment:()=>new Element('fragment'),getElementById:id=>descendants(page).find(n=>n.id===id)||null,querySelector:s=>page.querySelector(s),querySelectorAll:s=>page.querySelectorAll(s),execCommand:()=>env.fallbackCopy!==false});
  const canvasContext=new Proxy({measureText:text=>({width:text.length*22}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(target,k)=>k in target?target[k]:(()=>{}),set:(target,k,v)=>{target[k]=v;return true;}});
  class TestURL extends URL{static createObjectURL(blob){const key='blob:qa/'+blobUrls.size;blobUrls.set(key,blob);return key;}static revokeObjectURL(key){blobUrls.delete(key);}}
  const location={url:new URL('https://game.example/'+(options.search||'')),get href(){return this.url.href;},set href(value){env.lastLocation=value;this.url=new URL(value,this.url);},get protocol(){return this.url.protocol;},get origin(){return this.url.origin;},get pathname(){return this.url.pathname;},get search(){return this.url.search;},reload(){env.reloads++;}};
  const window=new Events();Object.assign(window,{document,location,isSecureContext:true,devicePixelRatio:1,matchMedia:q=>({matches:q.includes('reduced-motion')&&env.reducedMotion||q.includes('standalone')&&env.standalone}),setTimeout:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),setInterval:(fn,delay)=>{const id=++timerId;intervals.set(id,{fn,delay});return id;},clearInterval:id=>intervals.delete(id),scrollTo(){}});
  const gain=()=>({gain:{value:1,setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(){}},connect(){}});
  window.AudioContext=class {constructor(){this.currentTime=0;this.state='running';this.destination={};}createGain(){return gain();}createOscillator(){env.effects++;return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){},stop(){}};}resume(){return Promise.resolve();}};
  const navigator={get onLine(){return env.online!==false;},userAgent:'Android Chrome',clipboard:{writeText:async t=>env.clipboard.push(t)},share:async p=>{if(env.cancelShare)throw Object.assign(new Error('cancel'),{name:'AbortError'});env.shared.push(p);},canShare:()=>true,vibrate(){},serviceWorker:{register:async (p,options)=>{env.registered.push(p);env.registrationOptions=options;return {};},ready:Promise.resolve({active:{}})}};
  class TestDate extends Date{constructor(...args){super(...(args.length?args:[env.now]));}static now(){return env.now;}}
  class TestImage{set src(v){this._src=v;this.width=541;this.height=1150;queueMicrotask(()=>this.onload?.());}}
  const context=vm.createContext({window,document,navigator,location,localStorage:{getItem:k=>{if(env.storageBlocked)throw new Error('Storage disabled');return storage.get(k)??null;},setItem:(k,v)=>{if(env.storageBlocked)throw new Error('Storage disabled');storage.set(k,v);}},history:{replaceState:(_,title,url)=>{location.href=url;},pushState:(_,title,url)=>{env.navigation.push(location.href);location.href=url;}},Date:TestDate,URL:TestURL,URLSearchParams,AbortSignal,fetch:(url,options)=>env.fetch?env.fetch(url,options):Promise.reject(new Error('Offline test adapter')),File:options.fileSupported===false?undefined:File,Blob,Image:TestImage,crypto:webcrypto,console,setTimeout:window.setTimeout,clearTimeout:window.clearTimeout,setInterval:window.setInterval,clearInterval:window.clearInterval,requestAnimationFrame:fn=>{const id=++timerId;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),performance:{now:()=>env.frameClock||0},matchMedia:window.matchMedia,innerWidth:390,innerHeight:844,devicePixelRatio:1,queueMicrotask});
  env.usage=[];window.manlyAnalytics={track:(event,data)=>env.usage.push({event,...data})};
  for(const filename of ['config.js','categories-data.js','curses-data.js','engagement.js','app.js','photo-trial.js']){
    let source=fs.readFileSync(dist+'/'+filename,'utf8');
    if(filename==='app.js'&&options.dailyReleases)window.MANLY_DAILY_RELEASES=options.dailyReleases;
    if(filename==='app.js')source=source.replace('  if(document.readyState===',`  window.__qa={acceptRankings,renderFavorites,renderWorldRanking,loadWorldRankings,syncDuelVotes,unlockCurses,isUnlocked,state,badges,randomId,showCurse,cast,favorite,switchView,selectCategory,renderVault,dailyId,newDuel,voteDuel,shareDuel,share,renderSimilarity,suggestionMessage,validateSuggestion,sendSuggestion,recordManlinessActivity,manlinessMonths,monthlyAnniversary,manlinessTitle,renderJourney,save,requestMusic,setMasterSound,install,installInstructions,backupSave,restoreSave,openBadge,shareBadge,saveCard};\n  if(document.readyState===`);
    vm.runInContext(source,context,{filename});
    if(filename==='config.js'&&options.apiOrigin)window.MANLY_CONFIG=Object.freeze({...window.MANLY_CONFIG,duelApiOrigin:options.apiOrigin});
  }
  return {env,window,document,navigator,location,storage,frames,intervals,api:window.__qa,$:id=>document.getElementById(id),flushTimers:(max=1300)=>{for(const [id,timer]of [...timers])if(timer.delay<=max){timers.delete(id);timer.fn();}},flushFrames:time=>{env.frameClock=time;for(const [id,fn]of [...frames]){frames.delete(id);fn(time);}},flushIntervals:()=>{for(const entry of intervals.values())entry.fn();}};
}

(async()=>{
  const game=boot(),{api,$,env,storage,document,window}=game;
  await tick();
  assert.equal(window.MANLY_CURSES.length,2000);assert.equal(window.MANLY_CATEGORIES.length,40);
  assert.equal(new Set(window.MANLY_CURSES.map(c=>c.text.trim().toLowerCase())).size,2000);
  assert(window.MANLY_CURSES.every((c,i)=>c.id===i+1&&window.MANLY_CATEGORIES.includes(c.category)));
  assert.equal(api.badges.length,60);assert.equal($('badgeGrid').children.length,4);assert.equal($('curseText').textContent,window.MANLY_CURSES[1].text);
  assert.equal($('seeAllAchievements').getAttribute('aria-expanded'),null);
  for(let visit=0;visit<8;visit++){
    assert.equal($('allBadgeGrid').children.length,0);assert.equal($('achievementsView').hidden,true);assert.equal($('playView').hidden,false);
    await $('seeAllAchievements').click();assert.equal(api.state.view,'achievements');assert.equal($('badgeGrid').children.length,4);assert.equal($('allBadgeGrid').children.length,60);assert.equal($('achievementsView').hidden,false);assert.equal($('playView').hidden,true);assert.equal(document.activeElement,$('backAchievements'));
    api.renderJourney();assert.equal($('badgeGrid').children.length,4);assert.equal($('allBadgeGrid').children.length,60);
    assert($('allBadgeGrid').children.every(card=>card.classList.contains('locked')&&card.textContent.includes('LOCKED')&&!card.querySelector('button')));
    const shardBadges=$('allBadgeGrid').children.filter(card=>card.textContent.includes('SHARD MILESTONE'));assert.equal(shardBadges.length,15);assert(shardBadges.every(card=>card.textContent.includes('Unlock after earning')));
    await $('backAchievements').click();assert.equal(api.state.view,'play');assert.equal($('badgeGrid').children.length,4);assert.equal(document.activeElement,$('seeAllAchievements'));
  }
  assert.equal($('categorySelect').children.length,41);assert.equal($('offlineStatus').textContent,'OFFLINE READY');assert.equal(env.registered[0],'./sw.js');
  assert.equal(env.registrationOptions.updateViaCache,'none');
  assert.equal($('instagramSocial').href,'https://www.instagram.com/tye_clodd/');assert.equal($('youtubeSocial').href,'https://www.youtube.com/channel/UCjVevpjstKyvHacahdAyRgg');
  const referencedIds=[...fs.readFileSync(dist+'/app.js','utf8').matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
  for(const id of referencedIds)assert($(id),'Missing game element: '+id);
  console.log('PASS: all 2,000 unique entries, 40 categories, 60 badges, four-card preview, repeated separate-screen navigation, explicit milestone targets, HTML hooks, and script initialization');

  const assertNoCastProgress=game=>{
    assert.equal(game.api.state.count,0);assert.equal(game.api.state.seen.length,0);assert.equal(game.api.manlinessMonths(),0);
    assert.equal(game.$('discoveryCount').textContent,'0');assert.equal(game.$('manlinessMeter').style.width,'0%');assert.equal(game.$('manlinessMeter').parentElement.getAttribute('aria-valuenow'),'0');assert.equal(game.$('manlinessYearLabel').textContent,'0 / 12 MONTHLY STEPS EARNED');
    assert.equal(game.$('manlinessIntro').textContent,'YOUR STARTING TITLE');assert.equal(game.$('manlinessShards').children.length,12);
    assert(game.$('manlinessShards').children.every(shard=>shard.textContent==='○'&&!shard.classList.contains('earned')));
    assert(game.document.querySelectorAll('[data-rank-month]').every(tile=>!tile.classList.contains('earned')&&!tile.classList.contains('current')));
  };
  assertNoCastProgress(game);assert.equal(api.state.earnedBadges.length,0);
  let passiveSave=storage.get('manly-curses-v3');
  for(let visit=0;visit<8;visit++){
    const passive=boot({'manly-curses-v3':passiveSave},{search:'?curse='+(202+visit)});await tick();assertNoCastProgress(passive);assert.equal(passive.api.state.earnedBadges.length,0);assert.equal(passive.$('badgeGrid').children.length,4);passiveSave=passive.storage.get('manly-curses-v3');
  }
  const phantom={count:0,history:[2,202,302,402,502],seen:[2,202,302,402,502],streak:3,lastCastDate:'2026-10-13',lastDailyCastDate:'2026-10-13',firstCastDate:'2026-07-13',activeMonthKeys:['2026-07','2026-08','2026-09','2026-10'],earnedBadges:['spark','fiveunique','daily','streak3','manly-month-3'],badgeNotified:['spark','manly-month-3']};
  const ghost=boot({'manly-curses-v3':JSON.stringify(phantom)});await tick();assertNoCastProgress(ghost);assert.equal(ghost.api.state.earnedBadges.length,0);assert.equal(ghost.api.state.firstCastDate,'');assert.equal(ghost.api.state.activeMonthKeys.length,0);
  await ghost.api.restoreSave({size:500,text:async()=>JSON.stringify({version:3,progress:phantom})});const importedGhost=JSON.parse(ghost.storage.get('manly-curses-v3'));assert.equal(importedGhost.seen.length,0);assert.equal(importedGhost.earnedBadges.length,0);assert.equal(importedGhost.activeMonthKeys.length,0);
  const independent=boot({'manly-curses-v3':JSON.stringify({...phantom,favorites:[2],duelWins:1,totalShares:1,earnedBadges:['firstheart','firstjudge','share','manly-month-3']})});await tick();assertNoCastProgress(independent);assert.equal([...independent.api.state.earnedBadges].sort().join(','),'firstheart,firstjudge,share');
  const genuine={count:50,seen:[2,202,302,402,502],firstCastDate:'2026-07-13',activeMonthKeys:['2026-07','2026-08','2026-09','2026-10']};
  const savedProgress=boot({'manly-curses-v3':JSON.stringify(genuine)});await tick();assert.equal(savedProgress.api.manlinessMonths(),3);assert.equal(savedProgress.$('manlinessShards').children.filter(s=>s.classList.contains('earned')).length,3);assert.equal(savedProgress.$('manlinessYearLabel').textContent,'3 / 12 MONTHLY STEPS EARNED');assert(savedProgress.api.state.earnedBadges.includes('manly-month-3'));
  const oneCast=boot({'manly-curses-v3':JSON.stringify({...genuine,count:1,activeMonthKeys:[...genuine.activeMonthKeys,'2030-01']})});await tick();assert.equal(oneCast.api.manlinessMonths(),0);
  console.log('PASS: repeated no-cast reloads/shared links remain at zero, stale passive progress is repaired on load/import, independent achievements and genuine monthly progress are preserved');

  assert($('musicStatus').textContent.includes('TAP ANYWHERE'));
  env.mediaBlocked=false;await document.emit('pointerdown',{target:$('generateBtn')});await tick();
  assert.equal($('backgroundMusic').paused,false);assert($('musicStatus').textContent.includes('PLAYING'));assert($('backgroundMusic').attrs.loop!==undefined);
  await $('soundBtn').click();assert.equal(api.state.sound,false);assert.equal($('backgroundMusic').paused,true);assert.equal($('backgroundMusic').muted,true);
  const mutedEffects=env.effects;await $('generateBtn').click();game.flushTimers();assert.equal(api.state.count,1);assert.equal(env.effects,mutedEffects);
  await $('musicBtn').click();await tick();assert.equal(api.state.sound,true);assert.equal($('backgroundMusic').paused,false);
  console.log('PASS: blocked-autoplay fallback, tap-to-play, shared music/effects mute, and persisted sound setting');

  assert(api.state.earnedBadges.includes('spark'));assert(api.state.earnedBadges.includes('daily'));assert.equal(api.manlinessMonths(),0);
  assert($('manlinessShards').children.every(s=>!s.classList.contains('earned')));
  assert($('badgeGrid').children.some(card=>card.classList.contains('unlocked')&&card.textContent.includes('EARNED')));
  await $('seeAllAchievements').click();const fullShare=$('allBadgeGrid').querySelector('[data-badge]');assert(fullShare);document.activeElement=fullShare;await $('allBadgeGrid').emit('click',{target:fullShare});assert.equal($('badgeShareDialog').hidden,false);await $('badgeShareClose').click();assert.equal($('badgeShareDialog').hidden,true);assert.equal(document.activeElement,fullShare);await $('backAchievements').click();assert.equal($('badgeGrid').children.length,4);
  $('friendName').value='  Izzy   Dubs  ';await $('friendName').emit('input');assert($('curseTarget').textContent.includes('IZZY DUBS'));
  for(const category of window.MANLY_CATEGORIES){api.selectCategory(category);const next=api.randomId();assert.equal(window.MANLY_CURSES[next-1].category,category);api.showCurse(next,{count:true});}
  assert(api.state.earnedBadges.includes('allcats'));assert.equal(new Set(api.state.seen).size,api.state.seen.length);
  await $('favoriteBtn').click();assert(api.state.favorites.includes(api.state.currentId));assert(api.state.earnedBadges.includes('firstheart'));
  const permanent=api.state.earnedBadges.length;await $('favoriteBtn').click();assert(api.state.earnedBadges.length>=permanent);
  await $('dailyBtn').click();game.flushTimers();const today=api.state.currentId;await $('dailyBtn').click();game.flushTimers();assert.equal(api.state.currentId,today);
  api.switchView('vault');assert.equal($('vaultGrid').children.length,24);await $('loadMore').click();assert.equal($('vaultGrid').children.length,48);
  $('vaultSearch').value='#202';await $('vaultSearch').emit('input');assert.equal($('vaultGrid').children.length,1);assert($('vaultGrid').textContent.includes('#0202'));
  $('vaultSearch').value='a sentence that cannot match any existing curse 938284';await $('vaultSearch').emit('input');assert($('vaultGrid').textContent.includes('No curses match'));
  console.log('PASS: casting, category pools, targets, daily curse, favorites, Vault search/pagination, and permanent badges');

  api.switchView('duel');assert.notEqual(api.state.duelPair[0],api.state.duelPair[1]);assert.equal($('duelSaveWinner').disabled,true);
  await $('voteA').click();const winner=api.state.duelWinner;assert.equal(api.state.duelWins,1);await $('voteB').click();assert.equal(api.state.duelWins,1);
  await $('duelSaveWinner').click();assert(api.state.favorites.includes(winner));assert.equal($('duelBest').textContent,'1');assert(api.state.earnedBadges.includes('firstjudge'));
  await $('duelShareWinner').click();assert(env.shared.at(-1).url.includes('?curse='+winner));assert(api.state.earnedBadges.includes('share'));
  await $('duelRematch').click();assert.equal(api.state.duelWinner,null);assert.equal($('duelSaveWinner').disabled,true);
  api.showCurse(189);await $('shareBtn').click();assert(env.shared.at(-1).url.includes('curse=189'));
  const shares=api.state.totalShares;env.cancelShare=true;await $('shareBtn').click();assert.equal(api.state.totalShares,shares);env.cancelShare=false;
  delete game.navigator.share;await $('shareBtn').click();assert(env.clipboard.at(-1).includes('curse=189'));
  console.log('PASS: duel voting guard, saved winners, rematches, share URLs, cancelled sharing, and clipboard fallback');

  game.location.href='https://game.example/';api.switchView('suggest');
  $('suggestText').value='tiny';assert.equal(api.validateSuggestion(),false);
  $('suggestCategory').value=window.MANLY_CATEGORIES[0];$('suggestText').value='May your remote always teleport underneath the refrigerator.';
  assert.equal(api.validateSuggestion(),false);$('suggestAgree').checked=true;assert.equal(api.validateSuggestion(),true);
  $('suggestText').value='x'.repeat(261);assert.equal(api.validateSuggestion(),false);
  $('suggestText').value=window.MANLY_CURSES[1].text;await $('suggestText').emit('input');assert($('similarStatus').textContent.includes('VERY CLOSE MATCH'));
  $('suggestText').value='May your remote always teleport underneath the refrigerator.';
  await $('suggestForm').emit('submit');const draft=new URL(env.lastLocation);
  assert.equal(draft.protocol,'mailto:');assert.equal(draft.pathname,'bookclodd@gmail.com');assert(draft.searchParams.get('body').includes($('suggestText').value));assert(draft.searchParams.get('subject').includes($('suggestCategory').value));
  await $('suggestCopy').click();assert(env.clipboard.at(-1).includes('I give permission'));
  console.log('PASS: suggestion length/category/consent checks, duplicate hints, email recipient/body encoding, and copy fallback');

  game.location.href='https://game.example/';await $('installTop').click();assert.equal($('aboutDialog').hidden,false);assert($('installInstructions').textContent.includes('Android'));
  let prompted=0,prevented=0;await window.emit('beforeinstallprompt',{preventDefault(){prevented++;},prompt:async()=>prompted++,userChoice:Promise.resolve({outcome:'accepted'})});
  await $('modalInstall').click();assert.equal(prompted,1);assert.equal(prevented,1);await window.emit('appinstalled');assert($('toast').textContent.includes('IS INSTALLED'));
  env.standalone=true;await $('installTop').click();assert($('toast').textContent.includes('ALREADY INSTALLED'));env.standalone=false;
  const portrait=document.querySelector('.mascot');assert(portrait.src.includes('photo'));await $('portraitToggle').click();assert(portrait.src.includes('mascot.webp'));
  api.openBadge('spark');assert.equal($('badgeShareDialog').hidden,false);await $('badgeSaveNow').click();assert(env.downloads.at(-1).name.endsWith('.png'));
  await $('imageBtn').click();assert(env.downloads.at(-1).name.startsWith('manly-curse-'));
  console.log('PASS: install-prompt wiring, Android instructions, standalone detection, portrait switch, and image export API paths');

  env.now=Date.UTC(2026,9,13,12);api.state.streak=0;api.state.lastCastDate='';
  for(let day=0;day<30;day++){env.now=Date.UTC(2026,9,13+day,12);api.showCurse(2,{count:true});}
  assert.equal(api.state.streak,30);assert(api.state.earnedBadges.includes('streak30'));
  env.now+=3*86400000;api.showCurse(2,{count:true});assert.equal(api.state.streak,1);assert(api.state.earnedBadges.includes('streak30'));
  const lastDay=api.monthlyAnniversary(new Date(2024,0,31),1);assert.equal(lastDay.getDate(),29);
  const normal=api.monthlyAnniversary(new Date(2025,0,31),1);assert.equal(normal.getDate(),28);
  api.state.count=100;api.state.firstCastDate='2020-01-31';api.state.activeMonthKeys=Array.from({length:73},(_,i)=>{const d=new Date(2020,i,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');});
  env.now=Date.UTC(2026,0,30,12);assert.equal(api.manlinessMonths(),71);
  env.now=Date.UTC(2026,0,31,12);assert.equal(api.manlinessMonths(),72);api.renderJourney();assert.equal($('rankBoss').hidden,false);assert(api.state.earnedBadges.includes('manly-year-6'));
  env.now=Date.UTC(2030,0,31,12);assert.equal(api.manlinessMonths(),72);
  const finalName=api.manlinessTitle(72);assert.equal(finalName,'THE MANLIEST MANLY MAN!!!!!');
  api.state.count=1000;api.state.seen=window.MANLY_CURSES.map(c=>c.id);api.state.favorites=api.state.seen.slice(0,30);api.state.duelWins=100;api.renderJourney();assert.equal(api.state.earnedBadges.length,60);
  api.save();api.backupSave();const backup=JSON.parse(await env.downloads.at(-1).blob.text());assert.equal(backup.progress.earnedBadges.length,60);
  const before=storage.get('manly-curses-v3');await api.restoreSave({size:5,text:async()=>'{bad'});assert.equal(storage.get('manly-curses-v3'),before);
  backup.progress.favorites=[1,1,2001,-2];await api.restoreSave({size:200,text:async()=>JSON.stringify(backup)});const restored=JSON.parse(storage.get('manly-curses-v3'));assert.deepEqual(restored.favorites,[1]);assert.equal(restored.earnedBadges.length,60);assert.equal(restored.activeMonthKeys.length,73);
  const reload=boot({'manly-curses-v3':storage.get('manly-curses-v3')},{now:Date.UTC(2026,9,13,12)});await tick();assert.equal(reload.api.state.favorites.length,1);assert.equal(reload.api.state.earnedBadges.length,60);
  const corrupt=boot({'manly-curses-v3':'{bad'},{search:'?curse=202'});await tick();assert.equal(corrupt.api.state.currentId,202);assert.equal(corrupt.api.state.count,0);
  console.log('PASS: streaks, anniversary/leap-year boundaries, Diamond ceiling, all 60 achievement conditions, backup/restore, invalid saves, and shared-link boot');

  const shared=boot({}, {search:'?curse=189&to=Izzy%20Dubs&shared=1'});await tick();
  assert.equal(shared.$('friendName').value,'Izzy Dubs');assert(shared.$('curseTarget').textContent.includes('IZZY DUBS'));assert.equal(shared.$('sharedCurseNotice').hidden,false);assert.equal(shared.$('generateLabel').textContent,'CAST ONE BACK!');
  await shared.$('shareBtn').click();const sent=new URL(shared.env.shared.at(-1).url);assert.equal(sent.searchParams.get('to'),'Izzy Dubs');assert.equal(sent.searchParams.get('curse'),'189');
  await shared.$('generateBtn').click();shared.flushTimers();assert.equal(shared.$('sharedCurseNotice').hidden,true);assert.equal(new URL(shared.location.href).searchParams.has('shared'),false);
  shared.api.openBadge('spark');await shared.$('badgeShareNow').click();assert(shared.env.shared.at(-1).text.includes('https://game.example/'));
  const sharedDuel=boot({}, {search:'?view=duel&duel=2-202'});await tick();assert.equal(sharedDuel.api.state.view,'duel');assert.equal(sharedDuel.api.state.duelPair.join('-'),'2-202');assert.equal(sharedDuel.$('duelView').hidden,false);
  await sharedDuel.$('duelChallengeBtn').click();const invitation=new URL(sharedDuel.env.shared.at(-1).url);assert.equal(invitation.searchParams.get('duel'),'2-202');
  const recipient=boot({}, {search:invitation.search});await tick();assert.equal(recipient.api.state.duelPair.join('-'),'2-202');await recipient.$('voteB').click();assert.equal(recipient.api.state.duelWinner,202);
  const nav=boot();await tick();nav.api.switchView('vault');nav.api.switchView('suggest');assert.equal(nav.env.navigation.length,2);nav.location.href=nav.env.navigation.pop();await nav.window.emit('popstate');assert.equal(nav.api.state.view,'vault');assert.equal(nav.$('vaultView').hidden,false);nav.location.href=nav.env.navigation.pop();await nav.window.emit('popstate');assert.equal(nav.api.state.view,'play');
  await nav.$('seeAllAchievements').click();assert.equal(nav.$('allBadgeGrid').children.length,60);nav.location.href=nav.env.navigation.pop();await nav.window.emit('popstate');assert.equal(nav.api.state.view,'play');assert.equal(nav.$('allBadgeGrid').children.length,0);assert.equal(nav.$('badgeGrid').children.length,4);
  const trophyLink=boot({}, {search:'?view=achievements'});await tick();assert.equal(trophyLink.api.state.view,'achievements');assert.equal(trophyLink.$('allBadgeGrid').children.length,60);await trophyLink.$('backAchievements').click();assert.equal(trophyLink.$('allBadgeGrid').children.length,0);assert.equal(trophyLink.$('playView').hidden,false);
  const blocked=boot({}, {storageBlocked:true});await tick();await blocked.$('generateBtn').click();blocked.flushTimers();blocked.api.backupSave();assert.equal(JSON.parse(await blocked.env.downloads.at(-1).blob.text()).progress.count,1);assert(blocked.$('saveStatus').textContent.includes('cannot save'));
  const noFile=boot({}, {fileSupported:false});await tick();await noFile.$('generateBtn').click();noFile.flushTimers();noFile.api.openBadge('spark');await noFile.$('badgeShareNow').click();assert(noFile.env.shared.at(-1).url.includes('https://game.example/'));
  for(const search of ['?view=duel&duel=2-2','?view=duel&duel=0-202','?view=duel&duel=2-2001','?curse=-99&to='+encodeURIComponent('<img src=x onerror=bad()>'.repeat(4))]){const badLink=boot({}, {search});await tick();assert(badLink.$('friendName').value.length<=35);assert(badLink.api.state.currentId>=1&&badLink.api.state.currentId<=2000);if(badLink.api.state.view==='duel')assert.notEqual(badLink.api.state.duelPair[0],badLink.api.state.duelPair[1]);}
  console.log('PASS: social links, personalized sharing/replies, badge game links, shared duel round trips, Back navigation, disabled storage backups, and malformed input fallbacks');

  const animated=boot({}, {reducedMotion:false,mediaBlocked:false});await tick();
  for(let round=0;round<12;round++){
    const before=animated.api.state.count;await animated.$('generateBtn').click();await animated.$('generateBtn').click();
    assert.equal(animated.$('shareBtn').disabled,true);assert.equal(animated.$('imageBtn').disabled,true);assert.equal(animated.api.state.count,before);
    const phrase=animated.$('roulettePreview').textContent;animated.flushIntervals();assert.notEqual(animated.$('roulettePreview').textContent,phrase);
    animated.flushTimers();assert.equal(animated.api.state.count,before+1);assert.equal(animated.$('shareBtn').disabled,false);assert.equal(animated.intervals.size,0);
    animated.flushFrames(round*1700);animated.flushFrames((round+1)*1700);assert.equal(animated.frames.size,0);
    if(round%2===0){await animated.$('soundBtn').click();assert.equal(animated.api.state.sound,false);await animated.$('soundBtn').click();await tick();assert.equal(animated.$('backgroundMusic').paused,false);}
  }
  animated.$('backgroundMusic').error={code:2};animated.$('backgroundMusic').paused=true;await animated.$('backgroundMusic').emit('error');await animated.document.emit('pointerdown',{target:animated.$('generateBtn')});await tick();assert.equal(animated.env.audioReloads,1);assert.equal(animated.$('backgroundMusic').paused,false);
  animated.document.activeElement=animated.$('shareManliness');await animated.$('shareManliness').click();assert.equal(animated.$('badgeShareDialog').hidden,false);
  animated.document.activeElement=animated.$('badgeSaveNow');await animated.document.emit('keydown',{key:'Tab',target:animated.$('badgeSaveNow')});assert.equal(animated.document.activeElement,animated.$('badgeShareClose'));
  await animated.document.emit('keydown',{key:'Escape',target:animated.$('badgeShareClose')});assert.equal(animated.$('badgeShareDialog').hidden,true);assert.equal(animated.document.activeElement,animated.$('shareManliness'));
  await animated.$('openAbout').click();await animated.$('motionBtn').click();assert.equal(animated.api.state.reducedMotion,true);await animated.document.emit('keydown',{key:'Escape'});
  animated.document.hidden=true;await animated.$('generateBtn').click();animated.flushTimers();assert.equal(animated.frames.size,0);
  const loading=boot({}, {readyState:'loading'});assert.equal(loading.$('categorySelect').children.length,1);await loading.document.emit('DOMContentLoaded');await tick();assert.equal(loading.$('categorySelect').children.length,41);await loading.window.emit('load');await tick();assert.equal(loading.env.registered.length,1);
  const installError=boot();await tick();await installError.window.emit('beforeinstallprompt',{prompt:async()=>{throw new Error('Install prompt unavailable');},userChoice:Promise.resolve({outcome:'dismissed'})});await installError.$('installTop').click();assert.equal(installError.$('aboutDialog').hidden,false);
  const invalidSaves=boot();await tick();const storedBefore=invalidSaves.storage.get('manly-curses-v3');for(const value of [null,[],{version:3,progress:[]},{version:99,progress:{}},'bad']){await invalidSaves.api.restoreSave({size:100,text:async()=>JSON.stringify(value)});assert.equal(invalidSaves.storage.get('manly-curses-v3'),storedBefore);}
  const muted=boot({'manly-curses-v3':JSON.stringify({masterSound:false})});await tick();assert.equal(muted.env.playCalls,0);assert.equal(muted.$('backgroundMusic').muted,true);
  const noClipboard=boot();await tick();delete noClipboard.navigator.share;delete noClipboard.navigator.clipboard;await noClipboard.$('shareBtn').click();assert.equal(noClipboard.api.state.totalShares,1);noClipboard.env.fallbackCopy=false;await noClipboard.$('shareBtn').click();assert.equal(noClipboard.api.state.totalShares,1);assert(noClipboard.$('toast').textContent.includes('NOT AVAILABLE'));
  console.log('PASS: repeated animated play, rapid-click guards, sharing during casts, timer cleanup, audio error recovery, modal keyboard/focus, motion reduction, deferred script loading, install errors, bad saves, muted startup, and unavailable sharing');

  const emptyFavorites=boot();await tick();
  await emptyFavorites.document.querySelector('[data-view="favorites"]').click();
  assert.equal(emptyFavorites.api.state.view,'favorites');assert.equal(emptyFavorites.$('favoritesView').hidden,false);
  assert(emptyFavorites.$('favoritesGrid').textContent.includes('YOUR NEXT FAVORITE'));
  assert.equal(emptyFavorites.location.url.searchParams.get('view'),'favorites');
  emptyFavorites.api.switchView('play');await emptyFavorites.document.querySelector('[data-go="favorites"]').click();assert.equal(emptyFavorites.api.state.view,'favorites');
  const favoriteIds=Array.from({length:31},(_,i)=>i+1);
  const collection=boot({'manly-curses-v3':JSON.stringify({count:31,seen:favoriteIds,favorites:favoriteIds})},{search:'?view=favorites'});await tick();
  assert.equal(collection.api.state.unlocked.length,31);assert.equal(collection.$('favoritesGrid').children.length,24);assert.equal(collection.$('favoritesMore').hidden,false);
  await collection.$('favoritesMore').click();assert.equal(collection.$('favoritesGrid').children.length,31);
  collection.$('favoritesSearch').value='#31';await collection.$('favoritesSearch').emit('input');assert.equal(collection.$('favoritesGrid').children.length,1);assert(collection.$('favoritesGrid').textContent.includes('#0031'));
  const removeFavorite=collection.$('favoritesGrid').querySelector('[data-fav]');await collection.$('favoritesGrid').emit('click',{target:removeFavorite});
  assert(!collection.api.state.favorites.includes(31));assert(collection.api.isUnlocked(31),'Removing a favorite must not relock it');assert.equal(collection.$('navFavCount').textContent,'30');
  const savedCollection=collection.storage.get('manly-curses-v3');const reopened=boot({'manly-curses-v3':savedCollection},{search:'?view=favorites'});await tick();
  assert.equal(reopened.api.state.favorites.length,30);assert(reopened.api.isUnlocked(31));assert.equal(reopened.api.state.count,31);
  collection.$('favoritesSearch').value='';await collection.$('favoritesSearch').emit('input');const useFavorite=collection.$('favoritesGrid').querySelector('[data-use]');await collection.$('favoritesGrid').emit('click',{target:useFavorite});assert.equal(collection.api.state.view,'play');assert.equal(collection.api.state.count,31,'Using a saved favorite must not award another cast');
  await reopened.api.restoreSave({size:1000,text:async()=>JSON.stringify({version:3,progress:JSON.parse(savedCollection)})});assert(JSON.parse(reopened.storage.get('manly-curses-v3')).unlocked.includes(31));
  console.log('PASS: Favorites navigation/counter/deep links, empty states, full-list search and pagination, removal, saved-card reuse, legacy migration, reload and backup/restore without changing cast progress');

  const worldRows=Array.from({length:2000},(_,i)=>({id:i+1,wins:i===1999?10:i===201?9:i===998?8:0,duels:i===1999?12:i===201?11:i===998?10:0})).sort((a,b)=>b.wins-a.wins||a.id-b.id);
  const worldData={rankings:worldRows,updatedAt:'2026-10-15T02:00:00.000Z',totalVotes:27};
  const reply=data=>({ok:true,status:200,json:async()=>data});
  const world=boot({}, {search:'?view=duel&duel=2-202',fetch:async()=>reply(worldData)});await tick();
  assert.equal(world.$('worldRankingList').children.length,25);
  const firstRank=world.$('worldRankingList').children[0],secondRank=world.$('worldRankingList').children[1];
  assert(firstRank.textContent.includes('#1'));assert(firstRank.textContent.includes('UNDISCOVERED CURSE'));assert(!firstRank.textContent.includes(world.window.MANLY_CURSES[1999].text));assert.equal(firstRank.querySelector('button'),null);
  assert(firstRank.classList.contains('is-locked'));assert(secondRank.textContent.includes('#2'));assert(secondRank.textContent.includes(world.window.MANLY_CURSES[201].text));assert.equal(secondRank.classList.contains('is-unlocked'),true);
  assert.equal(world.api.state.count,0);assert.equal(world.api.state.seen.length,0,'Duel discovery must not award cast achievements');
  const rankHeart=secondRank.querySelector('[data-fav]');await world.$('worldRankingList').emit('click',{target:rankHeart});assert(world.api.state.favorites.includes(202));
  world.api.showCurse(2000,{count:true});world.api.renderWorldRanking();assert(world.$('worldRankingList').children[0].textContent.includes(world.window.MANLY_CURSES[1999].text));assert(!world.$('worldRankingList').children[0].textContent.includes('UNDISCOVERED'));
  await world.$('rankingMore').click();assert.equal(world.$('worldRankingList').children.length,50);
  const oldTop=world.$('worldRankingList').children[0].textContent;world.api.switchView('play');world.api.switchView('duel');await tick();assert.equal(world.$('worldRankingList').children[0].textContent,oldTop);
  assert(world.$('rankingStatus').textContent.includes('27 VOTES FROM ALL PLAYERS'));
  const offlineWorld=boot({'manly-curses-ranking-v1':JSON.stringify(worldData)}, {search:'?view=duel&duel=2-202',online:false});await tick();
  assert(offlineWorld.$('rankingStatus').textContent.includes('SAVED RANKING'));assert(offlineWorld.$('worldRankingList').children[0].textContent.includes('UNDISCOVERED'));
  console.log('PASS: shared world-ranking display, #1/#2/#3 positions, locked text absent from rendered rows, no locked actions, immediate reveal after unlock, favorite actions, pagination, and offline cached ranking');
  const apiRequests=[];
  const separateHost=boot({}, {search:'?view=duel&duel=2-202',apiOrigin:'https://shared-game.example',fetch:async(url,options={})=>{apiRequests.push(url);return options.method==='POST'?reply({accepted:true,voteId:JSON.parse(options.body).voteId}):reply(worldData);}});
  await tick();await separateHost.$('voteA').click();await tick();
  assert(apiRequests.includes('https://shared-game.example/api/duel-rankings?catalog=2000'));
  assert(apiRequests.includes('https://shared-game.example/api/duel-votes'));
  assert(separateHost.$('worldRankingList').children[0].textContent.includes('UNDISCOVERED'));
  console.log('PASS: exported game uses the configured shared voting backend while preserving player-specific locked ranking text');


  let ballotRequests=0;const acceptedBallots=new Set();
  const retryServer=async(url,options={})=>{
    if(!url.includes('duel-votes'))return reply(worldData);
    ballotRequests++;const ballot=JSON.parse(options.body);acceptedBallots.add(ballot.voteId);
    if(ballotRequests===1)throw new Error('Response lost after recording vote');
    return reply({accepted:true,voteId:ballot.voteId});
  };
  const retryGame=boot({}, {search:'?view=duel&duel=2-202',fetch:retryServer});await tick();await retryGame.$('voteA').click();await tick();
  assert.equal(acceptedBallots.size,1);assert.equal(JSON.parse(retryGame.storage.get('manly-curses-duel-outbox-v1')).votes.length,1);
  const retryReload=boot({'manly-curses-v3':retryGame.storage.get('manly-curses-v3'),'manly-curses-duel-outbox-v1':retryGame.storage.get('manly-curses-duel-outbox-v1')},{fetch:retryServer});await tick();
  assert.equal(acceptedBallots.size,1);assert.equal(ballotRequests,2);assert.equal(JSON.parse(retryReload.storage.get('manly-curses-duel-outbox-v1')).votes.length,0);
  await retryReload.api.syncDuelVotes();assert.equal(ballotRequests,2);
  await offlineWorld.$('voteB').click();await tick();assert.equal(JSON.parse(offlineWorld.storage.get('manly-curses-duel-outbox-v1')).votes.length,1);assert(offlineWorld.$('rankingStatus').textContent.includes('1 VOTE WAITING TO SYNC'));
  offlineWorld.env.online=true;offlineWorld.env.fetch=retryServer;await offlineWorld.window.emit('online');await tick();assert.equal(JSON.parse(offlineWorld.storage.get('manly-curses-duel-outbox-v1')).votes.length,0);
  console.log('PASS: offline ballots persist across reload, reconnect sync, double-click protection, and retrying a recorded ballot without duplicate global votes');


  const release=JSON.parse(fs.readFileSync(dist+'/daily-curses.json','utf8')).releases[0];
  const dailyOptions={now:Date.parse(release.date+'T16:00:00Z'),dailyReleases:[release]};
  const fresh=boot({},dailyOptions);await tick();
  assert.equal(fresh.window.MANLY_CURSES.length,2001);assert.equal(fresh.window.MANLY_CATEGORIES.length,41);
  assert.equal(fresh.api.dailyId(),2001);assert.equal(fresh.$('discoveryBar').getAttribute('aria-valuemax'),'2001');
  assert(fresh.$('dailyDropStatus').textContent.includes('NEW TODAY'));
  const dailyRankRows=[{id:2001,wins:8,duels:8},...Array.from({length:2000},(_,i)=>({id:i+1,wins:0,duels:0}))];
  assert(fresh.api.acceptRankings({rankings:dailyRankRows,updatedAt:'2026-10-15T16:00:00Z'}));fresh.api.renderWorldRanking();
  assert(!fresh.$('worldRankingList').children[0].textContent.includes(release.text),'New daily text leaked while locked');
  await fresh.$('dailyBtn').click();fresh.flushTimers();
  assert.equal(fresh.api.state.currentId,2001);assert(fresh.api.state.seen.includes(2001));assert.equal(fresh.$('curseText').textContent,release.text);
  fresh.api.renderWorldRanking();assert(fresh.$('worldRankingList').children[0].textContent.includes(release.text));
  fresh.api.favorite(2001);fresh.api.switchView('favorites');assert(fresh.$('favoritesGrid').textContent.includes(release.text));
  const savedDaily=fresh.storage.get('manly-curses-v3');
  const returned=boot({'manly-curses-v3':savedDaily},dailyOptions);await tick();assert(returned.api.state.favorites.includes(2001));assert(returned.api.state.seen.includes(2001));
  const nextMorning=boot({}, {...dailyOptions,now:Date.parse('2026-10-16T16:00:00Z')});await tick();
  assert.equal(nextMorning.api.dailyId(),2001);assert(nextMorning.$('dailyDropStatus').textContent.includes('LATEST ORIGINAL'));assert(!nextMorning.$('dailyDropStatus').textContent.includes('NEW TODAY'));
  assert(fresh.env.usage.some(e=>e.event==='curse_cast'&&e.curseId===2001&&e.feature==='daily'));
  assert(fresh.env.usage.some(e=>e.event==='favorite_added'&&e.curseId===2001));
  assert(env.usage.some(e=>e.event==='favorite_removed'));
  assert(env.usage.some(e=>e.event==='duel_vote'));
  assert(!JSON.stringify(env.usage).includes('Izzy Dubs'));
  console.log('PASS: successful casts, favorites and Duel actions emit private analytics without target names');
  console.log('PASS: daily originals expand totals and categories, daily casting unlocks the new curse, locked rankings stay private, favorites/progress survive reload, and stale drops are labelled honestly');

  {
  const journey=boot({},dailyOptions);await tick();
  assert.equal(journey.$('dailyCard').hidden,false);assert.equal(journey.$('installTop').hidden,true);assert.equal(journey.api.state.count,0);
  await journey.$('dailyCardCast').click();journey.flushTimers();assert.equal(journey.api.state.currentId,2001);assert.equal(journey.api.state.count,1);
  journey.api.cast(2);journey.flushTimers();assert.equal(journey.$('nextStep').hidden,false);assert(journey.$('nextStepAction').textContent.includes('FAVORITE'));
  await journey.$('nextStepAction').click();assert(journey.api.state.favorites.includes(2));assert.equal(journey.$('installTop').hidden,false);
  journey.api.cast(3);journey.flushTimers();assert(journey.$('nextStepAction').textContent.includes('DUEL'));await journey.$('nextStepClose').click();assert.equal(journey.$('nextStep').hidden,true);
  const before=journey.api.state.count;await journey.$('sameCategory').click();journey.flushTimers();assert.equal(journey.api.state.count,before+1);assert.equal(journey.window.MANLY_CURSES[journey.api.state.currentId-1].category,'The Founding Fifty');assert.notEqual(journey.api.state.currentId,3);
  const pairA=[...journey.window.manlyEngagement.dailyPair()];const other=boot({},dailyOptions);await tick();assert.equal(pairA.join(','),[...other.window.manlyEngagement.dailyPair()].join(','));assert.notEqual(pairA[0],pairA[1]);
  const castCount=journey.api.state.count;await journey.$('dailyShowdown').click();assert.equal(journey.api.state.view,'duel');assert.equal(journey.api.state.duelPair.join(','),pairA.join(','));assert.equal(journey.api.state.count,castCount);
  journey.api.switchView('favorites');await journey.$('shareCollection').click();assert(journey.env.shared.at(-1).url.includes('collection=2'));assert(journey.env.shared.at(-1).url.includes('campaign=collection_share'));
  await journey.$('saveCollection').click();await tick();assert(journey.env.downloads.some(x=>x.name==='my-petty-collection.png'));
  const incoming=boot({}, {...dailyOptions,search:'?view=favorites&collection=2,202,999999'});await tick();assert.equal(incoming.api.state.favorites.length,0);assert.equal(incoming.api.state.count,0);assert.equal(incoming.$('sharedCollectionItems').children.length,2);assert.equal(incoming.$('sharedCollection').hidden,false);
  const qaBallots=[];const qaGame=boot({'manly-curses-duel-outbox-v1':JSON.stringify({votes:[{voteId:'1bfe1bbb-ecac-4052-ab28-1247a0adee77',winnerId:2,loserId:202}]})},{search:'?analytics_test=1&view=duel&duel=2-202',fetch:async(url,o={})=>{if(o.method==='POST'){qaBallots.push(JSON.parse(o.body));return reply({accepted:true,voteId:JSON.parse(o.body).voteId});}return reply(worldData);}});await tick();assert.equal(qaBallots.length,0,'QA replayed a real pending ballot');await qaGame.$('voteA').click();await tick();assert.equal(qaBallots.length,1);assert.equal(qaBallots[0].testTraffic,true);assert.equal(JSON.parse(qaGame.storage.get('manly-curses-duel-outbox-v1')).votes.length,1);
  assert(qaGame.env.usage.some(e=>e.event==='duel_vote_accepted'));assert(journey.env.usage.some(e=>e.event==='curse_cast'&&e.placement==='daily_card'));
  console.log('PASS: Daily card, same-category continuation, contextual/dismissible prompts, qualified install offers, deterministic daily Duel, favorite collection link/image, opt-in collection saves, QA outbox isolation and server acknowledgement events');
  }

})().catch(error=>{console.error(error);process.exitCode=1;});
