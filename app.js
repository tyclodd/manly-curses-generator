/* MANLY CURSES GENERATOR v4.4.0 · FAVORITES & WORLD RANKING
   2,000 original curses • Zero tracking • Offline-first PWA • Accessible play.
   Every interactive control is functional. No external JavaScript dependencies.
*/
(async () => {
  'use strict';
  if(window.MANLY_DAILY_READY)await window.MANLY_DAILY_READY;
  const $ = id => document.getElementById(id);
  const baseCurses = Array.isArray(window.MANLY_CURSES) ? window.MANLY_CURSES : [];
  const torontoToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const dailyReleases=Array.isArray(window.MANLY_DAILY_RELEASES)?window.MANLY_DAILY_RELEASES.filter((row,i)=>row.id===2001+i&&row.date<=torontoToday()):[];
  const curses=baseCurses.concat(dailyReleases);
  const categories=[...new Set([...(window.MANLY_CATEGORIES||[]),...dailyReleases.map(row=>row.category)])];
  window.MANLY_CURSES=curses;window.MANLY_CATEGORIES=categories;
  const settings = window.MANLY_CONFIG || {};
  const duelApiURL = endpoint => {const url=new URL(settings.duelApiOrigin?'/api/'+endpoint:'./api/'+endpoint,settings.duelApiOrigin||location.href);if(endpoint==='duel-rankings')url.searchParams.set('catalog',String(curses.length));return url.href;};
  const byCategory = new Map([['all', curses]]);
  for (const name of categories) byCategory.set(name, curses.filter(c => c.category === name));
  const storeKey = 'manly-curses-v3'; // Keep the same storage key to preserve existing progress.
  const prevKey = 'manly-curses-v2';
  const oldKey = 'manly-curses-v1';
  const cleanId = id => Number.isInteger(Number(id)) && +id > 0 && +id <= curses.length ? +id : null;
  const padded = n => String(n).padStart(4, '0');
  const dateKey = d => [d.getFullYear(),String(d.getMonth() + 1).padStart(2, '0'),String(d.getDate()).padStart(2, '0')].join('-');
  const systemLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let prefersLessMotion = systemLessMotion;
  const ref = id => curses[id - 1] || null;
  const readLocal = key => { try { const obj = JSON.parse(localStorage.getItem(key)); return obj && typeof obj === 'object' ? obj : {}; } catch { return {}; } };
  const stored = {...readLocal(oldKey), ...readLocal(prevKey), ...readLocal(storeKey)};
  const uniqueValid = value => Array.isArray(value) ? [...new Set(value.map(cleanId).filter(Boolean))] : [];
  const state = {
    currentId: 2,
    favorites: uniqueValid(stored.favorites),
    unlocked: uniqueValid(stored.unlocked),
    history: uniqueValid(stored.history).slice(0, 60),
    seen: uniqueValid(stored.seen).slice(0, curses.length),
    count: Number.isFinite(+stored.count) ? Math.max(0, Math.floor(+stored.count)) : 0,
    streak: Number.isFinite(+stored.streak) ? Math.max(0, Math.floor(+stored.streak)) : 0,
    lastCastDate: typeof stored.lastCastDate === 'string' ? stored.lastCastDate : '',
    // Upgrade the previous independent music/effects settings to one master switch.
    sound: typeof stored.masterSound === 'boolean' ? stored.masterSound : stored.musicEnabled !== false,
    musicEnabled: typeof stored.masterSound === 'boolean' ? stored.masterSound : stored.musicEnabled !== false,
    reducedMotion: stored.reducedMotion === true,
    duelWins: Number.isFinite(+stored.duelWins) ? Math.max(0,Math.floor(+stored.duelWins)) : 0,
    duelRound: Number.isFinite(+stored.duelRound) ? Math.max(0,Math.floor(+stored.duelRound)) : 0,
    duelWinner: null, duelPair: [],
    duelWinnerIds: uniqueValid(stored.duelWinnerIds),
    badgeNotified: Array.isArray(stored.badgeNotified) ? stored.badgeNotified.filter(x=>typeof x === 'string') : [],
    earnedBadges: Array.isArray(stored.earnedBadges) ? stored.earnedBadges.filter(x=>typeof x === 'string') : [],
    lastShareDate: typeof stored.lastShareDate === 'string' ? stored.lastShareDate : '',
    totalShares: Number.isFinite(+stored.totalShares) ? Math.max(0, Math.floor(+stored.totalShares)) : 0,
    lastDailyCastDate: typeof stored.lastDailyCastDate === 'string' ? stored.lastDailyCastDate : '',
    firstCastDate: typeof stored.firstCastDate === 'string' ? stored.firstCastDate : ((stored.count > 0 && typeof stored.lastCastDate === 'string') ? stored.lastCastDate : ''),
    activeMonthKeys: Array.isArray(stored.activeMonthKeys) ? stored.activeMonthKeys.filter(x=>/^\d{4}-(0[1-9]|1[0-2])$/.test(x)).slice(0,360) : ((stored.count > 0 && /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(stored.lastCastDate||'')) ? [stored.lastCastDate.slice(0,7)] : []),

    casting: false, view: 'play', vaultFilter: 'all', vaultPage: 1,
  };
  function clearPassiveCastProgress(progress){
    if(progress.count>0)return;
    progress.seen=[];progress.streak=0;progress.lastCastDate='';progress.lastDailyCastDate='';
    progress.firstCastDate='';progress.activeMonthKeys=[];
    const independentBadges=new Set(['firstheart','hearts','heartthirty','firstjudge','judge','judge25','judge100','share']);
    for(const key of ['earnedBadges','badgeNotified'])progress[key]=(progress[key]||[]).filter(id=>independentBadges.has(id));
  }
  clearPassiveCastProgress(state);
  // Preserve old discoveries and saved winners without awarding extra casts.
  state.unlocked=uniqueValid([...state.unlocked,...state.seen,...state.favorites,...state.duelWinnerIds]);
  if (!Array.isArray(stored.seen) && state.count>0 && state.history.length) state.seen = state.history.slice(0,Math.min(state.count,60));
  if (/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(state.firstCastDate) && !state.activeMonthKeys.includes(state.firstCastDate.slice(0,7))) state.activeMonthKeys.unshift(state.firstCastDate.slice(0,7));
  let toastTimer = 0, castTimer = 0, impactTimer = 0, audioCtx = null, masterEffectsGain = null, deferredPrompt = null, lastModalFocus = null, lastBadgeFocus = null;
  let shownVault = [], favoritesPage = 1;
  const isUnlocked = id => state.unlocked.includes(id) || state.seen.includes(id) || state.favorites.includes(id);
  function unlockCurses(ids) {
    for(const id of uniqueValid(ids))if(!state.unlocked.includes(id))state.unlocked.push(id);
  }
  const rankingCacheKey='manly-curses-ranking-v1', duelOutboxKey='manly-curses-duel-outbox-v1';
  const validVote = vote => vote && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vote.voteId||'') && cleanId(vote.winnerId) && cleanId(vote.loserId) && vote.winnerId!==vote.loserId;
  let pendingDuelVotes=Array.isArray(readLocal(duelOutboxKey).votes)?readLocal(duelOutboxKey).votes.filter(validVote):[];
  let worldRankings=[], rankingPage=1, rankingLoadedAt='', rankingLive=false, rankingLoading=false, syncingVotes=false, rankingRequest=0, duelVoteId=null;
  function acceptRankings(data) {
    if(!Array.isArray(data?.rankings) || data.rankings.length<2000 || data.rankings.length>12000)return false;
    const ids=new Set();
    for(const row of data.rankings){
      if(!Number.isInteger(row.id)||row.id<1||row.id>12000||ids.has(row.id)||!Number.isSafeInteger(row.wins)||row.wins<0||!Number.isSafeInteger(row.duels)||row.duels<row.wins)return false;
      ids.add(row.id);
    }
    worldRankings=data.rankings.filter(row=>cleanId(row.id)).map(row=>({id:row.id,wins:row.wins,duels:row.duels}));
    for(const curse of curses)if(!ids.has(curse.id))worldRankings.push({id:curse.id,wins:0,duels:0});
    worldRankings.sort((a,b)=>b.wins-a.wins||a.id-b.id);
    rankingLoadedAt=typeof data.updatedAt==='string'?data.updatedAt:'';
    return true;
  }
  acceptRankings(readLocal(rankingCacheKey));
  let rouletteTimer = 0, lightningAnimation = 0, activeParticleFrame = 0;
  const activeStreak=()=>{
    const today=new Date(),yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
    return state.lastCastDate===dateKey(today)||state.lastCastDate===dateKey(yesterday)?state.streak:0;
  };
  // Manliness is a long-term, monthly check-in journey. Casting is required;
  // repeatedly pressing the button in one day cannot skip calendar milestones.
  const manlinessNames = [
    'MINI BABY MANCHILD', 'BABY MANCHILD', 'A SLIGHTLY BIGGER MANCHILD',
    'MANCHILD', 'A MAN?', 'PROBABLY A MAN', 'SOMEWHAT MANLY MAN',
    'MANLY MAN IN TRAINING', 'A PRETTY MANLY MAN', 'EXTREMELY MANLY MAN',
    'RIDICULOUSLY MANLY MAN', 'ALMOST THE MANLIEST MANLY MAN'
  ];
  const monthKey = date => dateKey(date).slice(0,7);
  const dateFromKey = key => {
    if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(key || '')) return null;
    const [y,m,d]=key.split('-').map(Number);
    const parsed=new Date(y,m-1,d);
    return parsed.getFullYear()===y && parsed.getMonth()===m-1 && parsed.getDate()===d ? parsed : null;
  };
  const monthlyAnniversary = (first, months) => {
    const y=first.getFullYear(), m=first.getMonth()+months;
    const last=new Date(y,m+1,0).getDate();
    return new Date(y,m,Math.min(first.getDate(),last));
  };
  const elapsedMonths = (first, today=new Date()) => {
    if(!first || today<first)return 0;
    let n=Math.max(0,(today.getFullYear()-first.getFullYear())*12+today.getMonth()-first.getMonth());
    if (monthlyAnniversary(first,n)>today) n--;
    return Math.max(0,n);
  };
  const manlinessMonths = () => {
    if(state.count===0)return 0;
    const first=dateFromKey(state.firstCastDate);
    if(!first)return 0;
    const active=new Set(state.activeMonthKeys.filter(key=>/^\d{4}-(0[1-9]|1[0-2])$/.test(key)&&key>=monthKey(first)&&key<=monthKey(new Date())));
    active.add(monthKey(first));
    // One distinct active month = one step, up to the calendar anniversary.
    // Diamond is the final rank. Progress never exceeds 72 months.
    return Math.max(0,Math.min(72,elapsedMonths(first),active.size-1,state.count-1));
  };
  const rankTiers = [
    {at:0,key:'rookie',name:'ROOKIE',next:'BLACK & WHITE',icon:'✦',metal:'#55cdfa'},
    {at:12,key:'mono',name:'BLACK & WHITE',next:'BRONZE',icon:'◆',metal:'#ededf1'},
    {at:24,key:'bronze',name:'BRONZE',next:'SILVER',icon:'⬡',metal:'#e8a263'},
    {at:36,key:'silver',name:'SILVER',next:'GOLD',icon:'✧',metal:'#e3e9f5'},
    {at:48,key:'gold',name:'GOLD',next:'PLATINUM',icon:'★',metal:'#ffdc59'},
    {at:60,key:'platinum',name:'PLATINUM',next:'DIAMOND',icon:'✦',metal:'#a8f4ff'},
    {at:72,key:'diamond',name:'DIAMOND',next:null,icon:'💎',metal:'#a4f6ff'},
  ];
  const manlinessTier = months=>rankTiers.slice().reverse().find(t=>months>=t.at)||rankTiers[0];
  const manlinessTitle = months=>months<12 ? manlinessNames[months] :
    'THE MANLIEST MANLY MAN'+(Math.floor(Math.min(72,months)/12)===1?'.':'!'.repeat(Math.floor(Math.min(72,months)/12)-1));
  const manlinessPoints = () => 5*state.count + 3*state.seen.length +
    10*state.favorites.length + 15*state.duelWins + 20*state.totalShares +
    25*state.earnedBadges.length;
  const monthLabel = n => n<12 ? manlinessNames[n] : manlinessTitle(n);
  const subRankNames = ['NEW RECRUIT','CURIOUS ROOKIE','LITTLE SPARK','RISING HOPE','TINY POWER','DETERMINED MASCOT','HALFWAY HERO','SHINY ELBOW','BRAVE PRETENDER','SERIOUS BUSINESS','ALMOST LEGENDARY','FINAL PREPARATIONS'];
  const monthFlavor = (months) => {
    if(months>=72) return 'FINAL BOSS · DIAMOND FOREVER';
    if(months<12)return 'ROOKIE QUEST · '+subRankNames[months];
    const nextTier=manlinessTier(Math.min(72,Math.floor(months/12)*12+12));
    return nextTier.name+' QUEST · '+subRankNames[months%12];
  };
  function recordManlinessActivity(day) {
    if(!dateFromKey(day))return;
    if(!dateFromKey(state.firstCastDate) || day<state.firstCastDate)state.firstCastDate=day;
    const key=day.slice(0,7);
    if(!state.activeMonthKeys.includes(key))state.activeMonthKeys.push(key);
  }
  const rankCardColor = (months) => manlinessTier(months).metal;
  function renderManliness() {
    const months=manlinessMonths(),first=state.count>0?dateFromKey(state.firstCastDate):null,tier=manlinessTier(months);
    const title=manlinessTitle(months),points=manlinessPoints(),final=months===72;
    const zone=$('manlinessZone');
    for(const t of rankTiers)zone.classList.toggle('rank-'+t.key,t.key===tier.key);
    $('manlinessRank').textContent=title;
    $('manlinessIntro').textContent=first?'YOUR CURRENT TITLE':'YOUR STARTING TITLE';
    $('manlinessLevel').textContent='MANLINESS LEVEL '+(months+1)+' / 73';
    $('manlinessScore').textContent=points.toLocaleString('en')+' MANLINESS POINTS';
    $('manlinessActivity').textContent=first ? `${new Set(state.activeMonthKeys).size} MONTHLY CHECK-INS · STARTED ${first.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}` : 'CAST YOUR FIRST CURSE TO START THE CLOCK';
    $('rankMaterial').textContent=tier.name+' RANK';
    $('rankChapter').textContent=monthFlavor(months);
    $('rankCrestIcon').textContent=tier.icon;
    $('rankCrestTitle').textContent=tier.name;
    $('rankCrestYear').textContent=months>=12?'YEAR '+Math.floor(months/12):'LEVEL '+(months+1);
    $('rankBoss').hidden=!final;
    const sub=months<12?months:(months%12);
    const nextBoundary=months<12?12:Math.min(72,Math.floor(months/12)*12+12);
    const startBoundary=months<12?0:Math.floor(months/12)*12;
    const span=Math.max(1,nextBoundary-startBoundary);
    const progress=Math.min(12,Math.round((months-startBoundary)/span*12));
    $('manlinessMeter').style.width=(months===72?100:((months-startBoundary)/span*100))+'%';
    $('manlinessMeter').parentElement.setAttribute('aria-valuenow',String(months===72?12:progress));
    $('manlinessYearLabel').textContent=final?'DIAMOND UNLOCKED · FINAL BOSS':`${Math.min(12,months-startBoundary)} / 12 MONTHLY STEPS EARNED`;
    $('manlinessNext').textContent=final?'THE FINAL BOSS IS YOU.':`NEXT: ${months+1===nextBoundary?manlinessTier(nextBoundary).name+' YEAR '+(nextBoundary/12):'MONTH '+(months+1)+' · '+subRankNames[(months+1)%12]}`;
    const due=first&&!final?monthlyAnniversary(first,months+1):null;
    const ready=!!due&&new Date()>=due;
    const activeReady=state.activeMonthKeys.length>months+1;
    $('manlinessRequirement').textContent=final?'You did it: 72 months of manly perseverance. The Diamond Rank is permanent.' : !first ? 'Your first cast starts the clock. Return in new months for rank upgrades.' : !ready ? `Next eligible promotion: ${due.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}.` : !activeReady ? 'Cast a curse in another month to unlock the next step.' : 'Your next promotion is ready. Keep casting!';
    const shards=$('manlinessShards');shards.replaceChildren();
    const targetMaterial=final?tier:manlinessTier(nextBoundary);
    $('shardsTitle').textContent=final?'ALL 12 DIAMOND SHARDS COLLECTED':`COLLECT 12 ${targetMaterial.name} SHARDS`;
    for(let n=1;n<=12;n++){
      const item=document.createElement('span');
      const filled=n<=(final?12:(months-startBoundary));
      item.className='manliness-shard'+(filled?' earned':'')+(filled&&n===months-startBoundary?' latest':'');
      item.textContent=filled?'◆':'○';
      item.title='Step '+n+' of 12 · '+(filled?'Collected':'Locked');
      item.setAttribute('aria-label',item.title);
      shards.append(item);
    }
    for(const el of document.querySelectorAll('[data-rank-month]')){
      const target=Number(el.dataset.rankMonth);
      const earned=!!first&&months>=target;
      el.classList.toggle('earned',earned);
      el.classList.toggle('current',!!first&&months===target);
      el.setAttribute('aria-label',`Month ${target}: ${monthLabel(target)}. ${earned?'Earned':'Locked'}.`);
    }
    for(const el of document.querySelectorAll('[data-metal-at]')){
      const at=Number(el.dataset.metalAt),earned=months>=at;
      el.classList.toggle('earned',earned);
      el.classList.toggle('current',at===tier.at);
      el.setAttribute('aria-label',el.dataset.metalName+': Year '+at/12+'. '+(earned?'Earned':'Locked'));
    }
  }
  function openManlinessCard() {
    lastBadgeFocus=document.activeElement;
    const months=manlinessMonths(),tier=manlinessTier(months),title=manlinessTitle(months);
    activeBadge={id:'manliness-level-'+(months+1),icon:tier.icon,title,
      hint:`${tier.name} RANK · ${monthFlavor(months)} · Manliness Level ${months+1}.`,rankMonths:months};
    $('badgePreviewIcon').textContent=activeBadge.icon;
    $('badgeShareTitle').textContent=activeBadge.title;
    $('badgeShareHint').textContent=activeBadge.hint;
    $('badgeShareDialog').hidden=false;
    $('badgeShareClose').focus();
  }

  const categoryCount=()=>new Set(state.seen.map(id=>ref(id)?.category).filter(Boolean)).size;
  const badges = [
    {id:'spark',icon:'⚡',title:'FIRST SPARK',hint:'Cast your first curse',test:()=>state.count>=1},
    {id:'five',icon:'🎲',title:'FIVE ALIVE',hint:'Cast 5 curses',test:()=>state.count>=5},
    {id:'ten',icon:'🔥',title:'PETTY APPRENTICE',hint:'Cast 10 curses',test:()=>state.count>=10},
    {id:'quarter',icon:'🥊',title:'25 SHADES OF PETTY',hint:'Cast 25 curses',test:()=>state.count>=25},
    {id:'legend',icon:'👑',title:'MANLY LEGEND',hint:'Cast 100 curses',test:()=>state.count>=100},
    {id:'fivehundred',icon:'💥',title:'500 TINY TRAGEDIES',hint:'Cast 500 curses',test:()=>state.count>=500},
    {id:'thousand',icon:'🏰',title:'PETTY EMPEROR',hint:'Cast 1,000 curses',test:()=>state.count>=1000},
    {id:'fiveunique',icon:'🔎',title:'CURIOUS CREATURE',hint:'Discover 5 unique curses',test:()=>state.seen.length>=5},
    {id:'vault',icon:'✦',title:'THE EXPLORER',hint:'Discover 50 unique curses',test:()=>state.seen.length>=50},
    {id:'deepvault',icon:'🗝️',title:'VAULT DIVING',hint:'Discover 200 unique curses',test:()=>state.seen.length>=200},
    {id:'fivehundredunique',icon:'📚',title:'THE ARCHIVIST',hint:'Discover 500 unique curses',test:()=>state.seen.length>=500},
    {id:'all2000',icon:'🌌',title:'ALL THE NONSENSE',hint:'Discover the original 2,000 curses',test:()=>state.seen.filter(id=>id<=2000).length>=2000},
    {id:'firstheart',icon:'💙',title:'SENTIMENTAL SOUL',hint:'Save your first favorite',test:()=>state.favorites.length>=1},
    {id:'hearts',icon:'♥',title:'CURSE COLLECTOR',hint:'Save 10 favorites',test:()=>state.favorites.length>=10},
    {id:'heartthirty',icon:'💎',title:'PETTY HOARDER',hint:'Save 30 favorites',test:()=>state.favorites.length>=30},
    {id:'firstjudge',icon:'🥇',title:'FIRST VERDICT',hint:'Judge your first Curse Duel',test:()=>state.duelWins>=1},
    {id:'judge',icon:'🏆',title:'PETTY JUDGE',hint:'Judge 5 duels',test:()=>state.duelWins>=5},
    {id:'judge25',icon:'⚖️',title:'THE REFEREE',hint:'Judge 25 duels',test:()=>state.duelWins>=25},
    {id:'judge100',icon:'🏟️',title:'ARENA COMMISSIONER',hint:'Judge 100 duels',test:()=>state.duelWins>=100},
    {id:'daily',icon:'☀️',title:"TODAY'S PETTINESS",hint:'Cast at least one curse in a day',test:()=>Boolean(state.lastDailyCastDate)},
    {id:'share',icon:'📣',title:'SPREAD THE NONSENSE',hint:'Use Share on a curse or badge',test:()=>state.totalShares>=1},
    {id:'streak3',icon:'📆',title:'THREE DAYS MANLY',hint:'Build a 3-day casting streak',test:()=>activeStreak()>=3},
    {id:'streak7',icon:'🔥',title:'WEEK OF CHAOS',hint:'Build a 7-day casting streak',test:()=>activeStreak()>=7},
    {id:'streak14',icon:'🦖',title:'TWO WEEKS UNBOTHERED',hint:'Build a 14-day casting streak',test:()=>activeStreak()>=14},
    {id:'streak30',icon:'👑',title:'MONTHLY MENACE',hint:'Build a 30-day casting streak',test:()=>activeStreak()>=30},
    {id:'fivecats',icon:'🗺️',title:'CATEGORY TOURIST',hint:'Explore 5 categories',test:()=>categoryCount()>=5},
    {id:'twentycats',icon:'🌍',title:'CATEGORY NOMAD',hint:'Explore 20 categories',test:()=>categoryCount()>=20},
    {id:'allcats',icon:'🎓',title:'MASTER OF ALL THINGS',hint:'Explore 40 categories',test:()=>categoryCount()>=40},
    ...Array.from({length:11},(_,i)=>({id:'manly-month-'+(i+1),icon:i>=9?'👑':'💪',title:manlinessNames[i+1],hint:`Reach month ${i+1} of your Manliness journey`,test:()=>manlinessMonths()>=i+1})),
    ...[1,2,3,4,5,6].map(y=>({id:'manly-year-'+y,icon:y===6?'💎':'👑',title:y===6?'DIAMOND FINAL BOSS':manlinessTitle(y*12),hint:`Reach year ${y} to unlock ${manlinessTier(y*12).name}`,test:()=>manlinessMonths()>=y*12})),
    ...[1,2,3,4,5].flatMap(y=>[3,6,9].map(q=>({id:`rank-shard-${y}-${q}`,icon:q===9?'🌟':'✦',title:`${manlinessTier((y+1)*12).name} · ${q} SHARD MILESTONE`,hint:`Unlock after earning ${q} of 12 monthly shards toward ${manlinessTier((y+1)*12).name}`,test:()=>manlinessMonths()>=y*12+q}))),
  ];
  let activeBadge=null;
  const progressSnapshot = () => ({favorites:state.favorites,unlocked:state.unlocked,history:state.history,seen:state.seen,count:state.count,streak:state.streak,lastCastDate:state.lastCastDate,sound:state.sound,musicEnabled:state.sound,masterSound:state.sound,reducedMotion:state.reducedMotion,duelWins:state.duelWins,duelRound:state.duelRound,duelWinnerIds:state.duelWinnerIds,badgeNotified:state.badgeNotified,earnedBadges:state.earnedBadges,lastShareDate:state.lastShareDate,totalShares:state.totalShares,lastDailyCastDate:state.lastDailyCastDate,firstCastDate:state.firstCastDate,activeMonthKeys:state.activeMonthKeys});
  const save = () => {
    try {
      localStorage.setItem(storeKey,JSON.stringify(progressSnapshot()));
      $('saveStatus').textContent='Progress saved on this device.';
    } catch {
      $('saveStatus').textContent='This browser cannot save progress. Back up your progress before closing the game.';
    }
  };
  const cleanTarget = value => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 35);
  const safeTarget = () => cleanTarget($('friendName').value);
  const currentCurse = () => ref(state.currentId) || curses[1];

  function toast(message) {
    const box = $('toast'); box.textContent = message; box.classList.add('visible');
    window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => box.classList.remove('visible'), 2900);
  }
  function rand(max) {
    if (max <= 1) return 0;
    if (globalThis.crypto?.getRandomValues) {
      const arr = new Uint32Array(1), limit = Math.floor(4294967296 / max) * max;
      do { crypto.getRandomValues(arr); } while (arr[0] >= limit);
      return arr[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function randomId() {
    const pool = byCategory.get($('categorySelect').value) || curses;
    if (!pool.length) return 2;
    // Avoid recently drawn curses without preventing all results in a narrow category.
    const blacklist = new Set(state.history.slice(0, Math.min(35, pool.length - 1)));
    blacklist.add(state.currentId);
    const fresh = pool.filter(item => !blacklist.has(item.id));
    const choices = fresh.length ? fresh : pool.filter(item => item.id !== state.currentId);
    return (choices.length ? choices : pool)[rand((choices.length ? choices : pool).length)].id;
  }
  function paintStats() {
    $('drawCount').textContent = state.count.toLocaleString('en');
    $('favCount').textContent = String(state.favorites.length);
    $('navFavCount').textContent = String(state.favorites.length);
    const today = new Date(), yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    $('streakCount').textContent = state.lastCastDate === dateKey(today) || state.lastCastDate === dateKey(yesterday) ? String(state.streak) : '0';
    const active = state.favorites.includes(state.currentId);
    $('favoriteBtn').textContent = active ? '♥' : '♡';
    $('favoriteBtn').classList.toggle('active', active);
    $('favoriteBtn').setAttribute('aria-pressed', String(active));
    $('favoriteBtn').setAttribute('aria-label', active ? 'Remove this curse from favorites' : 'Save this curse to favorites');
    renderJourney();
  }
  function updateTarget() {
    const name = safeTarget();
    $('curseTarget').hidden = !name;
    if (name) $('curseTarget').textContent = `🎯 A SPECIAL LITTLE CURSE FOR ${name.toUpperCase()}`;
  }
  function showCurse(id, {count = false, reveal = false, replaceURL = false} = {}) {
    const c = ref(id); if (!c) return;
    state.currentId = c.id;
    $('curseText').textContent = c.text;
    $('curseText').classList.toggle('long-curse', c.text.length > 92);
    $('curseText').classList.toggle('very-long', c.text.length > 170);
    $('curseNum').textContent = 'CURSE #' + padded(c.id);
    $('curseCategory').textContent = c.category.toUpperCase();
    updateTarget();
    const card = $('curseCard');
    card.classList.remove('revealed', 'stamped');
    if (reveal && !prefersLessMotion) {
      void card.offsetWidth;
      card.classList.add('revealed', 'stamped');
    }
    if (count) {
      $('sharedCurseNotice').hidden=true;
      state.count += 1;
      unlockCurses([c.id]);
      if (!state.seen.includes(c.id)) state.seen.push(c.id);
      const today = dateKey(new Date());
      recordManlinessActivity(today);
      if (state.lastCastDate !== today) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        state.streak = state.lastCastDate === dateKey(yesterday) ? state.streak + 1 : 1;
        state.lastCastDate = today;
        state.lastDailyCastDate = today;
      }
    }
    state.history = [c.id, ...state.history.filter(n => n !== c.id)].slice(0, 60);
    $('mascotQuote').textContent = reveal ? 'TYE DOESN’T LIE. THAT ONE FITS.' : 'PRESS THE BUTTON. I HAVE IDEAS.';
    paintStats(); save();
    if (replaceURL && location.protocol.startsWith('http')) {
      try {
        const url = new URL(location.href); url.searchParams.set('curse', String(c.id));
        if(safeTarget())url.searchParams.set('to',safeTarget());else url.searchParams.delete('to');
        url.searchParams.delete('shared');
        history.replaceState(null, '', url.pathname + url.search + url.hash);
      } catch {}
    }
  }
  // One master sound switch controls BOTH the continuously looping song and the
  // synthesized game effects. Autoplay is best-effort: browsers may block audible
  // playback until a user gesture. We try immediately and retry on first interaction.
  let musicActivated = false;
  let musicLoading = false;
  let musicNeedsGesture = false;
  const musicNode = () => $('backgroundMusic');
  const clock = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
  };
  function updateMasterButton() {
    const button = $('soundBtn');
    button.setAttribute('aria-pressed', String(state.sound));
    button.setAttribute('aria-label', state.sound ? 'Mute music and sound effects' : 'Unmute music and sound effects');
    button.title = state.sound ? 'Mute all game audio' : 'Turn on all game audio';
  }
  function updateMusicDock() {
    const song = musicNode();
    const on = state.sound;
    const isPlaying = musicActivated && !song.paused && !song.ended && !song.error;
    const audible = isPlaying && on && !song.muted;
    const dock = $('musicBtn');
    dock.classList.toggle('is-playing', audible);
    dock.classList.toggle('is-muted', !on);
    dock.classList.toggle('is-buffering', on && musicLoading);
    dock.setAttribute('aria-pressed', String(on));
    updateMasterSpeaker();
    dock.setAttribute('aria-label', on ? 'Mute all game audio' : 'Unmute all game audio');
    dock.title = on ? 'Mute music and sound effects' : 'Unmute music and sound effects';
    $('musicSwitch').textContent = !on ? '×' : audible ? '♫' : '▶';
    $('musicStatus').textContent = song.error ? 'TRACK COULD NOT LOAD'
      : !on ? 'ALL AUDIO MUTED • TAP TO UNMUTE'
      : musicLoading ? 'LOADING THE MANLINESS…'
      : isPlaying ? `PLAYING • ${clock(song.currentTime)} / ${clock(Math.ceil(song.duration || 229))}`
      : musicNeedsGesture ? 'TAP ANYWHERE TO START MUSIC' : 'STARTING YOUR THEME SONG…';
    if (Number.isFinite(song.duration) && song.duration > 0) {
      $('musicProgress').style.width = Math.min(100, (song.currentTime / song.duration) * 100) + '%';
    }
  }
  function updateMasterSpeaker() {
    const button = $('soundBtn');
    if (!button) return;
    const on = state.sound;
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? 'Mute all game audio' : 'Unmute all game audio');
    button.title = on ? 'Mute music and sound effects' : 'Unmute music and sound effects';
    button.innerHTML = on
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zM17 8a5 5 0 0 1 0 8m3-11a9 9 0 0 1 0 14"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zm13-1 4 8m0-8-4 8"/></svg>';
  }
  function setMasterAudio(on) {
    state.sound = !!on;
    state.musicEnabled = !!on;
    const song = musicNode();
    song.muted = !on;
    if (!on) { song.pause(); musicLoading = false; }
    save();
    updateMusicDock();
    if (on) requestMusic();
  }
  function requestMusic() {
    const song = musicNode();
    if (!state.sound || musicLoading || (!song.paused && !song.error)) return;
    if(song.error)song.load();
    song.volume = 0.42;
    song.muted = false;
    musicLoading = true;
    updateMusicDock();
    // play() must run synchronously inside a real gesture on restrictive browsers.
    try {
      const result = song.play();
      if (result && typeof result.then === 'function') {
        result.then(() => {
          musicActivated = true; musicLoading = false; musicNeedsGesture = false;
          if (!state.sound) song.pause();
          updateMusicDock();
        }).catch(() => {
          musicLoading = false;
          musicNeedsGesture = true;
          updateMusicDock();
        });
      } else {
        musicActivated = true; musicLoading = false; musicNeedsGesture = false;
        if (!state.sound) song.pause();
        updateMusicDock();
      }
    } catch {
      musicLoading = false; musicNeedsGesture = true; updateMusicDock();
    }
  }
  function setMasterSound(enabled) {
    state.sound = Boolean(enabled);
    state.musicEnabled = state.sound;
    // Cut existing synthesized notes immediately, not only the next sound effect.
    if (masterEffectsGain && audioCtx) masterEffectsGain.gain.setValueAtTime(state.sound ? 1 : 0, audioCtx.currentTime);
    const song = musicNode();
    if (!state.sound) {
      song.muted = true;
      song.pause(); // Saves resources; resumes from the same position on unmute.
      musicLoading = false;
    } else {
      song.muted = false;
      if (song.paused) requestMusic();
    }
    save();
    updateMasterButton();
    updateMusicDock();
  }
  function toggleMasterSound() {
    setMasterSound(!state.sound);
    toast(state.sound ? 'MUSIC + SOUND EFFECTS ON!' : 'ALL AUDIO MUTED.');
  }
  function initMusic() {
    const song = musicNode();
    song.volume = 0.42;
    song.muted = !state.sound;
    song.autoplay = state.sound;
    song.addEventListener('playing', () => {
      musicActivated = true; musicLoading = false; musicNeedsGesture = false;
      if (!state.sound) song.pause();
      updateMusicDock();
    });
    song.addEventListener('pause', updateMusicDock);
    song.addEventListener('timeupdate', updateMusicDock);
    song.addEventListener('loadedmetadata', updateMusicDock);
    song.addEventListener('waiting', () => { if (state.sound && musicActivated) { musicLoading = true; updateMusicDock(); } });
    song.addEventListener('canplay', () => { musicLoading = false; updateMusicDock(); });
    song.addEventListener('error', () => { musicLoading = false; updateMusicDock(); });
    $('musicBtn').addEventListener('click', toggleMasterSound);
    const retryOnGesture = e => {
      if (!state.sound || !musicNode().paused || musicLoading || e.target?.closest?.('#musicBtn, #soundBtn')) return;
      requestMusic();
    };
    // Early pointer input plus click/keyboard fallback for mobile autoplay policies.
    document.addEventListener('pointerdown', retryOnGesture, {passive: true});
    document.addEventListener('click', retryOnGesture, {capture: true});
    document.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey || !['Enter', ' ', 'Spacebar'].includes(e.key)) return;
      retryOnGesture(e);
    });
    updateMasterButton();
    updateMusicDock();
    // Immediate autoplay attempt, gracefully falling back to the first tap.
    if (state.sound) requestMusic();
  }

  function playSound(kind) {
    if (!state.sound) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audioCtx ||= new Context();
      if (!masterEffectsGain) {
        masterEffectsGain = audioCtx.createGain();
        masterEffectsGain.gain.value = state.sound ? 1 : 0;
        masterEffectsGain.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      const tone = (freq, delay, duration, type, volume) => {
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), t = audioCtx.currentTime + delay;
        osc.type = type; osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(Math.max(75, freq * .65), t + duration);
        gain.gain.setValueAtTime(.001, t); gain.gain.exponentialRampToValueAtTime(volume, t + .014); gain.gain.exponentialRampToValueAtTime(.001, t + duration);
        osc.connect(gain); gain.connect(masterEffectsGain); osc.start(t); osc.stop(t + duration + .02);
      };
      if (kind === 'duel') { tone(220,0,.13,'sawtooth',.055);tone(390,.11,.16,'triangle',.085);tone(670,.24,.27,'sine',.085); }
      else if (kind === 'cast') { tone(335,0,.1,'triangle',.08); tone(480,.11,.1,'triangle',.07); tone(640,.23,.18,'triangle',.08); }
      else if (kind === 'reveal') { tone(320,0,.20,'sawtooth',.06); tone(520,.08,.19,'triangle',.09); tone(790,.16,.31,'sine',.10); }
      else if (kind === 'heart') { tone(660,0,.07,'sine',.06); tone(880,.07,.11,'sine',.05); }
      else tone(420,0,.07,'triangle',.03);
    } catch { /* Sound is an optional enhancement. */ }
  }
  // Lightweight canvas particle engine: a single composited layer instead of DOM particles.
  function particles(origin = $('curseCard'), quantity = 42) {
    if (prefersLessMotion || document.hidden) return;
    const canvas = $('burstCanvas'), context = canvas.getContext('2d');
    if (!context) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';canvas.style.height = innerHeight + 'px';
    context.setTransform(dpr,0,0,dpr,0,0);
    const bounds = origin.getBoundingClientRect(), cx = bounds.left + bounds.width*.5, cy = bounds.top + bounds.height*.48;
    const palette = ['#ffd72f','#ff9e1e','#6ce4ff','#ffffff','#0b3672','#d1f6ff'];
    const pieces = Array.from({length:quantity},(_,i)=>{
      const a=2*Math.PI*(i / quantity + (rand(100)/800));const speed=3+rand(70)/12;
      return {x:cx,y:cy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-2,rot:rand(360),spin:(rand(2)?1:-1)*(4+rand(6)),size:4+rand(9),col:palette[i%palette.length],life:1,type:i%4};
    });
    cancelAnimationFrame(activeParticleFrame);
    const start=performance.now();
    const frame=now=>{
      context.clearRect(0,0,innerWidth,innerHeight);
      const elapsed=now-start;
      for(const o of pieces){
        const dt=Math.min(1/30, Math.max(0,(now-(o.last||start))/1000));o.last=now;
        o.x+=o.vx*dt*60;o.y+=o.vy*dt*60;o.vy+=.17*dt*60;o.rot+=o.spin*dt*60;
        o.life=Math.max(0,1-elapsed/1450);context.globalAlpha=o.life;
        context.save();context.translate(o.x,o.y);context.rotate(o.rot*Math.PI/180);context.fillStyle=o.col;
        if(o.type===0){context.font='bold '+(o.size*1.7)+'px system-ui';context.fillText('✦',0,0)}
        else context.fillRect(-o.size/2,-o.size/2,o.size,o.type===1?o.size*.33:o.size);
        context.restore();
      }
      context.globalAlpha=1;
      if(elapsed<1450 && !document.hidden)activeParticleFrame=requestAnimationFrame(frame);
      else context.clearRect(0,0,innerWidth,innerHeight);
    };
    activeParticleFrame=requestAnimationFrame(frame);
  }
  function electricStrike() {
    if(prefersLessMotion) return;
    const canvas=$('arenaCanvas'),arena=canvas?.parentElement;if(!canvas||!arena||document.hidden)return;
    const r=arena.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=r.width*dpr;canvas.height=r.height*dpr;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=r.width,h=r.height,start=performance.now();
    const strokes=Array.from({length:5},(_,i)=>({points:Array.from({length:7},(_,j)=>({x:w*(.12+i*.19)+(rand(45)-22),y:h*.1+j*h*.12})),side:i%2}));
    cancelAnimationFrame(lightningAnimation);
    const draw=(now)=>{
      const progress=(now-start)/650;ctx.clearRect(0,0,w,h);
      if(progress>=1)return;
      for(const [i,stroke] of strokes.entries()){
        ctx.beginPath();stroke.points.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
        ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=12;ctx.strokeStyle=`rgba(57,203,255,${(1-progress)*.22})`;ctx.stroke();
        ctx.lineWidth=2.8;ctx.strokeStyle=`rgba(255,247,179,${(1-progress)*(.75-(i*.07))})`;ctx.stroke();
      }
      lightningAnimation=requestAnimationFrame(draw);
    };
    lightningAnimation=requestAnimationFrame(draw);
  }
  function startRoulette() {
    if(prefersLessMotion)return;
    const phrases=['SCANNING THE PETTYVERSE','LOCATING MINOR DISCOMFORT','CHARGING THE INCONVENIENCE','ALMOST UNREASONABLY READY','YOUR FATE IS EXTREMELY PETTY'];
    let step=0;$('roulettePreview').textContent=phrases[0];
    clearInterval(rouletteTimer);
    rouletteTimer=setInterval(()=>{$('roulettePreview').textContent=phrases[(++step)%phrases.length]},168);
  }

  function cast(id = randomId(), {quick = false} = {}) {
    if (state.casting || !ref(id)) return;
    state.casting = true;
    const machine = $('machine'), btn = $('generateBtn');
    machine.classList.add('casting');btn.disabled = true;
    for(const id of ['copyBtn','shareBtn','imageBtn','favoriteBtn'])$(id).disabled=true;
    $('generateLabel').textContent = 'SUMMONING…';
    $('rollingLabel').textContent = 'SUMMONING PETTINESS';
    $('machineStatus').textContent = 'RESEARCHING THE MOST INCONVENIENT DESTINY…';
    $('mascotQuote').textContent = 'I DECIDED THIS ONE FITS.';
    playSound('cast');electricStrike();startRoulette();
    const delay = quick || prefersLessMotion ? 120 : 1170;
    window.clearTimeout(castTimer);
    castTimer = window.setTimeout(() => {
      clearInterval(rouletteTimer);machine.classList.remove('casting');btn.disabled = false;state.casting = false;
      for(const action of ['copyBtn','shareBtn','imageBtn','favoriteBtn'])$(action).disabled=false;
      $('generateLabel').textContent = 'CAST ANOTHER CURSE!';
      $('machineStatus').textContent = 'CURSE DELIVERED. MAY THEY BE SLIGHTLY ANNOYED.';
      showCurse(id, {count:true,reveal:true,replaceURL:true});
      if (!prefersLessMotion) {
        const arena = document.querySelector('.arena');
        arena.classList.remove('impact');void arena.offsetWidth;arena.classList.add('impact');
        window.clearTimeout(impactTimer);impactTimer = window.setTimeout(() => arena.classList.remove('impact'), 1000);
        particles();
      }
      try { if (navigator.vibrate) navigator.vibrate(42); } catch {}
      playSound('reveal');
      if (state.view === 'vault') renderVault();
    }, delay);
  }
  function favorite(id = state.currentId) {
    if (!ref(id)) return;
    unlockCurses([id]);
    const idx = state.favorites.indexOf(id);
    if (idx === -1) { state.favorites.unshift(id); toast('♥ ADDED TO YOUR PETTY COLLECTION!'); playSound('heart'); }
    else { state.favorites.splice(idx,1); toast('REMOVED FROM FAVORITES.'); }
    paintStats();paintDuelSaved();save();
    if (state.view === 'vault') renderVault();
    if (state.view === 'favorites') renderFavorites();
    if (state.view === 'duel') renderWorldRanking();
  }
  function switchView(name, {scroll = true, push = true} = {}) {
    if (!['play','duel','vault','favorites','support','suggest','achievements'].includes(name)) return;
    if(push && state.view!==name && location.protocol.startsWith('http')){
      try{
        const url=new URL(location.href);
        if(name==='play')url.searchParams.delete('view');else url.searchParams.set('view',name);
        if(name!=='duel')url.searchParams.delete('duel');
        history.pushState(null,'',url.pathname+url.search+url.hash);
      }catch{}
    }
    state.view = name;
    for (const view of ['play','duel','vault','favorites','support','suggest','achievements']) $(view+'View').hidden = view !== name;
    for (const tab of document.querySelectorAll('[data-view]')) {
      const active = tab.dataset.view === name;
      tab.classList.toggle('is-active',active);
      tab.setAttribute('aria-selected',String(active));
    }
    if (name === 'vault') renderVault();
    if (name === 'favorites') renderFavorites();
    if (name === 'duel') {
      if(!state.duelPair.length)newDuel();
      unlockCurses(state.duelPair);save();
      renderWorldRanking();loadWorldRankings();syncDuelVotes();
    }
    if (name === 'suggest') renderSimilarity();
    if (name === 'achievements')renderJourney();
    else $('allBadgeGrid').replaceChildren();
    if (scroll) window.scrollTo({top:0,behavior:prefersLessMotion?'instant':'smooth'});
  }
  function selectCategory(name) {
    if (!byCategory.has(name)) name = 'all';
    $('categorySelect').value = name;
    for (const btn of document.querySelectorAll('.mode-chip')) {
      const active = btn.dataset.category === name;
      btn.classList.toggle('selected',active); btn.setAttribute('aria-pressed',String(active));
    }
  }
  function renderVault() {
    const q = $('vaultSearch').value.trim().toLowerCase(), category = $('vaultCategory').value;
    shownVault = curses.filter(c =>
      (category === 'all' || c.category === category) &&
      (state.vaultFilter === 'all' || (state.vaultFilter === 'favorites' ? state.favorites.includes(c.id) : state.seen.includes(c.id))) &&
      (!q || c.text.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || String(c.id) === q.replace(/^#/,''))
    );
    $('vaultResults').textContent = `${shownVault.length.toLocaleString()} FOUND`;
    const subset = shownVault.slice(0,state.vaultPage * 24), grid = $('vaultGrid');
    grid.replaceChildren();
    if (!subset.length) {
      const empty = document.createElement('p'); empty.className = 'vault-empty';
      empty.textContent = state.vaultFilter === 'favorites' ? 'No favorites yet. Save some curses and they’ll appear here!':'No curses match those filters. Try a different search.';
      grid.append(empty);
    }
    const fragment = document.createDocumentFragment();
    for (const curse of subset) {
      const card = document.createElement('article');card.className = 'vault-item';
      const top = document.createElement('div');top.className='vault-item-top';
      const id = document.createElement('span');id.className='vault-id';id.textContent='#'+padded(curse.id);
      const cat = document.createElement('span');cat.className='vault-category';cat.textContent=curse.category.toUpperCase();top.append(id,cat);
      const text = document.createElement('div');text.className='vault-curse';text.textContent=curse.text;
      const buttons = document.createElement('div');buttons.className='vault-item-bottom';
      const use = document.createElement('button');use.className='vault-use';use.type='button';use.textContent='⚡ USE THIS';use.dataset.use=String(curse.id);
      const heart = document.createElement('button');heart.className='vault-save';heart.classList.toggle('saved',state.favorites.includes(curse.id));heart.type='button';heart.textContent=state.favorites.includes(curse.id)?'♥':'♡';heart.setAttribute('aria-label',(state.favorites.includes(curse.id)?'Remove curse ':'Save curse ')+curse.id);heart.dataset.fav=String(curse.id);
      buttons.append(use,heart);card.append(top,text,buttons);fragment.append(card);
    }
    grid.append(fragment);
    $('loadMore').hidden = subset.length >= shownVault.length;
  }
  function favoriteCard(curse) {
    const card=document.createElement('article');card.className='vault-item';
    const top=document.createElement('div');top.className='vault-item-top';
    const id=document.createElement('span');id.className='vault-id';id.textContent='#'+padded(curse.id);
    const category=document.createElement('span');category.className='vault-category';category.textContent=curse.category.toUpperCase();top.append(id,category);
    const text=document.createElement('div');text.className='vault-curse';text.textContent=curse.text;
    const actions=document.createElement('div');actions.className='vault-item-bottom';
    const use=document.createElement('button');use.type='button';use.className='vault-use';use.dataset.use=String(curse.id);use.textContent='⚡ USE THIS';
    const heart=document.createElement('button');heart.type='button';heart.className='vault-save saved';heart.dataset.fav=String(curse.id);heart.textContent='♥';heart.setAttribute('aria-label','Remove curse '+curse.id+' from favorites');heart.setAttribute('aria-pressed','true');
    actions.append(use,heart);card.append(top,text,actions);return card;
  }
  function renderFavorites() {
    const q=$('favoritesSearch').value.trim().toLowerCase();
    const favorites=state.favorites.filter(isUnlocked).map(ref).filter(Boolean);
    const matches=favorites.filter(c=>!q||c.text.toLowerCase().includes(q)||c.category.toLowerCase().includes(q)||String(c.id)===q.replace(/^#/,''));
    $('favoritesResults').textContent=(q?matches.length+' OF ':'')+favorites.length+' SAVED';
    const grid=$('favoritesGrid');grid.replaceChildren();
    if(!matches.length){
      const empty=document.createElement('div');empty.className='favorites-empty';
      const title=document.createElement('h3');title.textContent=q?'NO FAVORITES MATCH THAT SEARCH.':'YOUR NEXT FAVORITE IS OUT THERE.';
      const hint=document.createElement('p');hint.textContent=q?'Try another word or curse number.':'Discover a curse, tap its heart, and find it here whenever you want.';
      const action=document.createElement('button');action.type='button';action.className='vault-use';action.textContent=q?'CLEAR SEARCH':'⚡ FIND A CURSE';
      action.addEventListener('click',()=>{if(q){$('favoritesSearch').value='';renderFavorites();}else switchView('play');});
      empty.append(title,hint,action);grid.append(empty);
    }
    for(const curse of matches.slice(0,favoritesPage*24))grid.append(favoriteCard(curse));
    $('favoritesMore').hidden=matches.length<=favoritesPage*24;
  }
  function renderWorldRanking() {
    const list=$('worldRankingList');list.replaceChildren();
    const totalVotes=worldRankings.reduce((n,row)=>n+row.wins,0);
    let status=rankingLoading?'UPDATING WORLD RANKING…':rankingLive?'LIVE · '+totalVotes.toLocaleString('en')+' VOTES FROM ALL PLAYERS':worldRankings.length?'SAVED RANKING · CONNECT TO REFRESH':'WORLD RANKING NEEDS A CONNECTION. YOUR DUELS STILL WORK OFFLINE.';
    if(rankingLive&&totalVotes===0)status='NO VOTES YET · PLAY DUEL TO START THE WORLD RANKING.';
    if(pendingDuelVotes.length)status+=' · '+pendingDuelVotes.length+' VOTE'+(pendingDuelVotes.length===1?'':'S')+' WAITING TO SYNC';
    $('rankingStatus').textContent=status;
    $('rankingRefresh').disabled=rankingLoading;
    for(const [index,row] of worldRankings.slice(0,rankingPage*25).entries()){
      const unlocked=isUnlocked(row.id),item=document.createElement('li');item.className='ranking-row'+(unlocked?' is-unlocked':' is-locked');
      const rank=document.createElement('span');rank.className='ranking-position';rank.textContent='#'+(index+1);rank.setAttribute('aria-label','Rank '+(index+1));
      const body=document.createElement('div');body.className='ranking-curse';
      const label=document.createElement('span');label.className='ranking-label';label.textContent=(unlocked?'CURSE #':'🔒 CURSE #')+padded(row.id);
      const text=document.createElement('p');text.textContent=unlocked?ref(row.id).text:'UNDISCOVERED CURSE';
      body.append(label,text);
      if(!unlocked){const hint=document.createElement('small');hint.textContent='Discover this curse to reveal it.';body.append(hint);}
      const score=document.createElement('span');score.className='ranking-score';
      const wins=document.createElement('strong');wins.textContent=row.wins.toLocaleString('en');
      const caption=document.createElement('small');caption.textContent=row.wins===1?'WIN':'WINS';score.append(wins,caption);
      item.append(rank,body,score);
      if(unlocked){const heart=document.createElement('button');heart.type='button';heart.className='ranking-heart';heart.dataset.fav=String(row.id);heart.textContent=state.favorites.includes(row.id)?'♥':'♡';heart.setAttribute('aria-pressed',String(state.favorites.includes(row.id)));heart.setAttribute('aria-label',(state.favorites.includes(row.id)?'Remove curse ':'Save curse ')+row.id+' in favorites');item.append(heart);}
      list.append(item);
    }
    $('rankingMore').hidden=rankingPage*25>=worldRankings.length;
  }
  async function loadWorldRankings() {
    const request=++rankingRequest;rankingLoading=true;renderWorldRanking();
    try {
      const response=await fetch(duelApiURL('duel-rankings'),{cache:'no-store',signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw Error('Ranking unavailable');
      const data=await response.json();
      if(request!==rankingRequest)return;
      if(!acceptRankings(data))throw Error('Invalid ranking');
      rankingLive=true;
      try{localStorage.setItem(rankingCacheKey,JSON.stringify({rankings:worldRankings,updatedAt:rankingLoadedAt}));}catch{}
    }catch{if(request===rankingRequest)rankingLive=false;}
    finally{if(request===rankingRequest){rankingLoading=false;renderWorldRanking();}}
  }
  function saveDuelOutbox() {
    try{localStorage.setItem(duelOutboxKey,JSON.stringify({votes:pendingDuelVotes}));return true;}catch{return false;}
  }
  async function syncDuelVotes() {
    if(syncingVotes||!pendingDuelVotes.length||navigator.onLine===false)return;
    syncingVotes=true;let changed=false;
    try {
      while(pendingDuelVotes.length){
        const vote=pendingDuelVotes[0];
        const response=await fetch(duelApiURL('duel-votes'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(vote),signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw Error('Vote not synced');
        const result=await response.json();
        if(!result.accepted||result.voteId!==vote.voteId)throw Error('Vote not confirmed');
        pendingDuelVotes=pendingDuelVotes.filter(item=>item.voteId!==vote.voteId);saveDuelOutbox();changed=true;
      }
    }catch{rankingLive=false;}
    finally{syncingVotes=false;renderWorldRanking();if(changed&&state.view==='duel')loadWorldRankings();}
  }
  function queueDuelVote(winnerId,loserId) {
    const vote={voteId:duelVoteId||crypto.randomUUID(),winnerId,loserId};
    if(!pendingDuelVotes.some(item=>item.voteId===vote.voteId))pendingDuelVotes.push(vote);
    if(!saveDuelOutbox())toast('VOTE KEPT FOR THIS SESSION. CONNECT TO SYNC IT.');
    renderWorldRanking();
    syncDuelVotes();
  }
  function message() {
    const target = safeTarget(), c = currentCurse();
    return `⚡ MANLY CURSE PICK! ⚡\n${target ? `\nTHIS ONE IS FOR ${target.toUpperCase()}!\n` : ''}\n“${c.text}”\n\nCurse #${padded(c.id)} · Manly Curses Generator by Tye Clodd`;
  }
  function gameURL(params={}) {
    if (!location.protocol.startsWith('http')) return '';
    const url = new URL(location.href);url.search='';url.hash='';
    for(const [name,value] of Object.entries(params))if(value!==undefined&&value!==null&&value!=='')url.searchParams.set(name,String(value));
    return url.href;
  }
  function curseURL() {
    return gameURL({curse:state.currentId,to:safeTarget(),shared:1});
  }
  async function copy(text) {
    try { if (navigator.clipboard?.writeText && window.isSecureContext) { await navigator.clipboard.writeText(text);return true; } } catch {}
    const el=document.createElement('textarea');el.value=text;el.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(el);el.focus();el.select();
    let result = false;try{result=document.execCommand('copy')}catch{}el.remove();return result;
  }
  async function share() {
    const url = curseURL(), payload = {title:'Manly Curses Generator',text:message()};if(url)payload.url=url;
    if(navigator.share){try{await navigator.share(payload);registerShare();return;}catch(err){if(err?.name==='AbortError')return;}}
    const copied=await copy([message(),url].filter(Boolean).join('\n\n'));if(copied)registerShare();toast(copied?'CURSE READY TO SHARE — COPIED!':'SORRY, SHARING IS NOT AVAILABLE.');
  }
  function wrappedLines(ctx, text, maxWidth) {
    const tokens=text.split(/\s+/), lines=[];let line='';
    for(const token of tokens){const next=line?`${line} ${token}`:token;if(ctx.measureText(next).width>maxWidth && line){lines.push(line);line=token;}else line=next;}
    if(line)lines.push(line);
    return lines;
  }
  function box(ctx,x,y,w,h,r,fill,stroke,thickness=1) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
    ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=thickness;ctx.stroke();}
  }
  function graphicImage(url) {
    return new Promise((resolve,reject)=>{const img = new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});
  }
  async function saveCard() {
    try {
      const width=1080,height=1350,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
      const grad=ctx.createLinearGradient(0,0,width,height);grad.addColorStop(0,'#92e9ff');grad.addColorStop(.5,'#259ce8');grad.addColorStop(1,'#053678');ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
      ctx.save();ctx.translate(540,480);for(let i=0;i<30;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,1450,i*2*Math.PI/30+.01,i*2*Math.PI/30+.07);ctx.closePath();ctx.fillStyle='rgba(255,255,255,.15)';ctx.fill();}ctx.restore();
      ctx.textAlign='center';ctx.lineJoin='round';ctx.strokeStyle='#082353';ctx.fillStyle='#36b7ff';ctx.font='1000 145px Impact, Arial Black, sans-serif';ctx.lineWidth=17;ctx.strokeText('MANLY',540,162);ctx.fillText('MANLY',540,162);
      ctx.fillStyle='#ffd632';ctx.font='1000 146px Impact, Arial Black, sans-serif';ctx.strokeText('CURSES',540,300);ctx.fillText('CURSES',540,300);
      ctx.font='1000 46px Impact, Arial Black, sans-serif';ctx.lineWidth=8;ctx.fillStyle='white';ctx.strokeText('GENERATOR  ⚡',540,367);ctx.fillText('GENERATOR  ⚡',540,367);
      box(ctx,55,435,970,555,35,'#0b2355');box(ctx,55,417,970,555,35,'#fffdf3','#082753',8);
      ctx.textAlign='left';ctx.fillStyle='#b97310';ctx.font='1000 28px system-ui';ctx.fillText('✦ OFFICIALLY INCONVENIENT',98,483);
      const name=safeTarget();if(name){ctx.font='1000 29px system-ui';ctx.fillStyle='#d37d0b';ctx.textAlign='center';ctx.fillText(`FOR ${name.toUpperCase()}`,540,549,880);}
      const curse=currentCurse();let fontSize=curse.text.length>160?48:curse.text.length>112?56:curse.text.length>66?68:82;
      const bodyTop=name?590:536,bodyBottom=871,available=bodyBottom-bodyTop;
      let lines=[],lh=0;
      while(fontSize>27){
        ctx.font=`1000 ${fontSize}px Impact,Arial Black,system-ui,sans-serif`;
        lines=wrappedLines(ctx,curse.text,825);lh=fontSize*1.2;
        if(lines.length<=6 && lines.length*lh<=available)break;
        fontSize-=3;
      }
      ctx.textAlign='center';ctx.fillStyle='#102a58';
      const firstBaseline=bodyTop+(available-lines.length*lh)/2+fontSize;
      lines.forEach((line,i)=>ctx.fillText(line,540,firstBaseline+i*lh));
      ctx.beginPath();ctx.setLineDash([14,11]);ctx.strokeStyle='#8ab9d6';ctx.lineWidth=3;ctx.moveTo(100,902);ctx.lineTo(980,902);ctx.stroke();ctx.setLineDash([]);
      ctx.font='1000 24px system-ui';ctx.textAlign='left';ctx.fillStyle='#376d9e';ctx.fillText('CURSE #'+padded(curse.id),100,943);ctx.textAlign='right';ctx.font='1000 19px system-ui';ctx.fillText(curse.category.toUpperCase(),981,943);
      ctx.save();ctx.beginPath();ctx.rect(0,988,1080,362);ctx.clip();try{const img=await graphicImage('assets/tye-mascot.webp');ctx.drawImage(img,710,987,230,488);}catch{}ctx.restore();
      box(ctx,80,1090,680,135,22,'#ffdd39','#082353',8);
      ctx.textAlign='center';ctx.fillStyle='#0b2e63';ctx.font='1000 61px Impact,Arial Black,sans-serif';ctx.fillText('BY TYE CLODD',410,1170);
      ctx.font='1000 22px system-ui';ctx.fillText('PETTY. HARMLESS. DEEPLY INCONVENIENT.',415,1205);
      ctx.textAlign='center';ctx.font='1000 24px system-ui';ctx.fillStyle='white';ctx.fillText('TYE DOESN’T LIE. ⚡',540,1311);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Image conversion failed');
      const nameFile=`manly-curse-${padded(curse.id)}.png`,link=document.createElement('a'),uri=URL.createObjectURL(blob);
      link.href=uri;link.download=nameFile;document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(uri),10000);
      toast('YOUR CURSE CARD IS READY!');playSound('heart');
    }catch(err){console.error(err);toast('SORRY, IMAGE EXPORT IS UNAVAILABLE HERE.');}
  }
  function dailyId() {
    if(dailyReleases.length)return dailyReleases[dailyReleases.length-1].id;
    const key=dateKey(new Date());let hash=2166136261;
    for(const ch of key){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}
    return (hash>>>0)%curses.length+1;
  }
  function isHttpsLink(x){try{const u=new URL(x);return u.protocol==='https:'?u.href:null;}catch{return null;}}
  function configureCreator() {
    for(const [id,url] of [['paypalLink',settings.paypalUrl],['cameoLink',settings.cameoUrl],['merchLink',settings.merchUrl]]) {
      const safe=isHttpsLink(url);if(safe)$(id).href=safe;else {$(id).removeAttribute('href');$(id).setAttribute('aria-disabled','true');}
    }
    for(const [id,url] of [['instagramSocial',settings.instagram],['youtubeSocial',settings.youtube]]){
      const safe=isHttpsLink(url);if(safe)$(id).href=safe;
      else {$(id).removeAttribute('href');$(id).setAttribute('aria-disabled','true');}
    }
    const email=String(settings.interacEmail||'').trim();
    if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))$('interacAddress').textContent=email;
    $('interacBtn').addEventListener('click',async()=>{
      const email=$('interacAddress').textContent;
      toast(await copy(email)?'INTERAC EMAIL COPIED — OPEN YOUR BANKING APP!':'INTERAC EMAIL: '+email);
    });
  }
  function modalOpen() {
    lastModalFocus=document.activeElement;$('installInstructions').textContent=installInstructions();
    $('aboutDialog').hidden=false;document.body.style.overflow='hidden';$('closeAbout').focus();
  }
  function modalClose() {$('aboutDialog').hidden=true;document.body.style.overflow='';lastModalFocus?.focus?.();}
  function installInstructions() {
    if(/iPhone|iPad|iPod/.test(navigator.userAgent))return 'On iPhone, open the live website in Safari, tap Share, then Add to Home Screen.';
    if(/Android/.test(navigator.userAgent))return 'On Android, open the live website in Chrome, open the ⋮ menu, and choose Install app or Add to Home screen.';
    return 'When the site is hosted on HTTPS, use your browser’s Install App or Add to Home Screen option.';
  }
  async function install() {
    if(window.matchMedia('(display-mode: standalone)').matches){toast('YOU ALREADY INSTALLED THE GAME!');return;}
    if(deferredPrompt){
      const prompt=deferredPrompt;deferredPrompt=null;
      try{await prompt.prompt();await prompt.userChoice;return;}catch{}
    }
    if($('aboutDialog').hidden)modalOpen();else toast('USE YOUR BROWSER MENU TO INSTALL THE APP.');
  }
  function achievementCard(badge) {
    const unlocked=state.earnedBadges.includes(badge.id),item=document.createElement('article');
    item.className='badge-item '+(unlocked?'unlocked':'locked');
    item.setAttribute('aria-label',badge.title+'. '+(unlocked?'Earned. Share or save achievement.':'Locked. '+badge.hint));
    const icon=document.createElement('span');icon.className='badge-icon';icon.textContent=badge.icon;icon.setAttribute('aria-hidden','true');
    const title=document.createElement('span');title.className='badge-name';title.textContent=badge.title;
    const status=document.createElement('span');status.className='badge-status';status.textContent=unlocked?'✓ EARNED':'🔒 LOCKED';
    const hint=document.createElement('span');hint.className='badge-meta';hint.textContent=badge.hint;
    item.append(icon,title,status,hint);
    if(unlocked){
      const actions=document.createElement('div');actions.className='badge-actions';
      const share=document.createElement('button');share.type='button';share.className='badge-share';share.textContent='↗ SHARE';share.dataset.badge=badge.id;
      share.setAttribute('aria-label','Share '+badge.title+' achievement');
      actions.append(share);item.append(actions);
    }
    return item;
  }
  function renderJourney() {
    const unique=state.seen.length;
    $('discoveryCount').textContent=unique.toLocaleString('en');
    $('discoveryBar').setAttribute('aria-valuenow',String(unique));
    $('discoveryFill').style.width=Math.min(100,unique/curses.length*100)+'%';
    const newly=badges.filter(b=>b.test()&&!state.earnedBadges.includes(b.id));
    if(newly.length){
      for(const b of newly)state.earnedBadges.push(b.id);
      if(newly.length && (state.count||state.favorites.length||state.duelWins||state.totalShares)){
        toast('🏆 '+newly[0].title+' UNLOCKED'+(newly.length>1?' + '+(newly.length-1)+' MORE!':''));playSound('heart');
      }
      save();
    }
    const grid=$('badgeGrid'), fragment=document.createDocumentFragment();grid.replaceChildren();
    const firstLocked=badges.find(b=>!state.earnedBadges.includes(b.id));
    const earned=badges.filter(b=>state.earnedBadges.includes(b.id)).length;
    const recent=[...new Set(state.earnedBadges)].reverse().map(id=>badges.find(b=>b.id===id)).filter(Boolean);
    const ordered=[...recent,...badges.filter(b=>!state.earnedBadges.includes(b.id))];
    for(const badge of ordered.slice(0,4))fragment.append(achievementCard(badge));
    grid.append(fragment);
    const allGrid=$('allBadgeGrid');allGrid.replaceChildren();
    if(state.view==='achievements'){
      const allFragment=document.createDocumentFragment();
      for(const badge of ordered)allFragment.append(achievementCard(badge));
      allGrid.append(allFragment);
    }
    $('allBadgeCount').textContent=`${earned} / ${badges.length} EARNED`;
    $('badgeCount').textContent=`${earned} / ${badges.length} BADGES EARNED`;
    $('badgeHint').textContent=firstLocked ? 'NEXT BADGE: '+firstLocked.hint+'. Share any unlocked badge above.' : 'EVERY BADGE COLLECTED. THAT IS COMICALLY IMPRESSIVE.';
    renderManliness();
  }
  function registerShare(){
    state.totalShares+=1;state.lastShareDate=dateKey(new Date());
    renderJourney();save();
  }
  function openBadge(id){
    const badge=badges.find(b=>b.id===id);if(!badge||!state.earnedBadges.includes(id))return;
    lastBadgeFocus=document.activeElement;
    activeBadge=badge;
    $('badgePreviewIcon').textContent=badge.icon;
    $('badgeShareTitle').textContent=badge.title;
    $('badgeShareHint').textContent=badge.hint+'.';
    $('badgeShareDialog').hidden=false;
    $('badgeShareClose').focus();
  }
  function closeBadge(){
    const id=activeBadge?.id;
    $('badgeShareDialog').hidden=true;activeBadge=null;
    if(lastBadgeFocus?.isConnected)lastBadgeFocus.focus();
    else (document.querySelector('[data-badge="'+id+'"]')||$('shareManliness')).focus();
  }
  async function makeBadgeImage(badge){
    const c=document.createElement('canvas');c.width=1080;c.height=1350;
    const ctx=c.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
    const gradient=ctx.createLinearGradient(0,0,1080,1350);
    const rankTier=Number.isInteger(badge.rankMonths)?manlinessTier(badge.rankMonths):null;
    const rankColors={rookie:['#0a2554','#217ca9','#071b41'],mono:['#101626','#57677e','#0b172a'],bronze:['#2b1a1a','#a66b3e','#261a19'],silver:['#17293a','#97b0c4','#152538'],gold:['#372206','#b38616','#382409'],platinum:['#0c2843','#7d9db9','#102c43'],diamond:['#09103c','#2878b1','#210a4c']};
    const colors=rankTier?rankColors[rankTier.key]:['#081b42','#064b94','#081b42'];
    gradient.addColorStop(0,colors[0]);gradient.addColorStop(.52,colors[1]);gradient.addColorStop(1,colors[2]);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1350);
    ctx.save();ctx.translate(540,565);for(let i=0;i<24;i++){
      ctx.rotate(Math.PI/12);ctx.fillStyle=i%2?'#38b7fd20':'#ffda3226';
      ctx.fillRect(0,-16,930,30);
    }ctx.restore();
    ctx.fillStyle='#fed941';ctx.textAlign='center';ctx.font='bold 42px system-ui';ctx.fillText('✦ MANLY CURSES GENERATOR ✦',540,120);
    ctx.font='bold 35px system-ui';ctx.fillStyle='#fff';ctx.fillText(rankTier?rankTier.name+' MANLINESS RANK':'OFFICIAL PETTY ACHIEVEMENT',540,218);
    ctx.beginPath();ctx.arc(540,520,235,0,Math.PI*2);ctx.fillStyle=rankTier?rankTier.metal:'#ffd53b';ctx.fill();ctx.lineWidth=20;ctx.strokeStyle='#001b41';ctx.stroke();
    ctx.font='230px system-ui';ctx.fillStyle='#06356f';ctx.fillText(badge.icon,540,598);
    ctx.fillStyle='#fff';let fs=92;
    while(fs>42){ctx.font=`900 ${fs}px Impact,Arial Black,system-ui`;if(ctx.measureText(badge.title).width<=940)break;fs-=4;}
    ctx.fillText(badge.title,540,855);
    ctx.font='bold 37px system-ui';const lines=wrappedLines(ctx,badge.hint,810);lines.forEach((line,i)=>ctx.fillText(line,540,950+i*52));
    ctx.fillStyle='#ffd53b';ctx.fillRect(100,1090,880,95);
    ctx.fillStyle='#0b285b';ctx.font='900 46px system-ui';ctx.fillText('TYE DOESN’T LIE ⚡',540,1154);
    ctx.fillStyle='#a0dbff';ctx.font='26px system-ui';ctx.fillText('A VERY IMPORTANT UNIMPORTANT ACHIEVEMENT',540,1260);
    return await new Promise((resolve,reject)=>c.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG export failed')),'image/png'));
  }
  function downloadBlob(blob,filename){
    const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=filename;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),12000);
  }
  async function shareBadge(saveOnly=false){
    if(!activeBadge)return;
    const badge=activeBadge;
    try{
      const fileName='manly-achievement-'+badge.id+'.png';
      const blob=await makeBadgeImage(badge);
      if(saveOnly){downloadBlob(blob,fileName);toast('ACHIEVEMENT CARD SAVED!');return;}
      const text='🏆 I unlocked '+badge.title+' in Manly Curses Generator! '+badge.hint+'.';
      const url=gameURL();
      const file=typeof File==='function'?new File([blob],fileName,{type:'image/png'}):null;
      if(file&&navigator.share&&navigator.canShare?.({files:[file]})){
        try{await navigator.share({title:'Manly Curses achievement',text:[text,url].filter(Boolean).join('\n\n'),files:[file]});registerShare();return;}
        catch(e){if(e?.name==='AbortError')return;}
      }
      if(navigator.share){
        try{await navigator.share({title:'Manly Curses achievement',text,url:url||undefined});registerShare();return;}
        catch(e){if(e?.name==='AbortError')return;}
      }
      downloadBlob(blob,fileName);
      const copied=await copy([text,url].filter(Boolean).join('\n'));
      if(copied)registerShare();
      toast('BADGE IMAGE SAVED'+(copied?' & CAPTION COPIED!':'!'));
    }catch(e){console.warn('Badge share:',e);toast('COULD NOT GENERATE BADGE IMAGE.');}
  }

  function paintDuelSaved() {
    $('duelBest').textContent=String(state.duelWinnerIds.filter(id=>state.favorites.includes(id)).length);
  }
  function readDuelPair(value) {
    if(!/^\d{1,4}-\d{1,4}$/.test(value||''))return null;
    const pair=value.split('-').map(cleanId);
    return pair.every(Boolean)&&pair[0]!==pair[1]?pair:null;
  }
  function newDuel(pair=null) {
    let first=cleanId(pair?.[0]),second=cleanId(pair?.[1]);
    if(!first||!second||first===second){
      first=rand(curses.length)+1;second=rand(curses.length)+1;
      if(state.duelPair.length)for(let i=0;i<8 && state.duelPair.includes(first);i++)first=rand(curses.length)+1;
      for(let i=0;i<12 && (second===first || ref(second).category===ref(first).category);i++)second=rand(curses.length)+1;
      if(first===second) second=first%curses.length+1;
    }
    state.duelPair=[first,second];state.duelWinner=null;duelVoteId=crypto.randomUUID();
    if(state.view==='duel'){unlockCurses(state.duelPair);save();renderWorldRanking();}
    $('duelTextA').textContent=ref(first).text;$('duelTextB').textContent=ref(second).text;
    $('duelIdA').textContent='CURSE #'+padded(first);$('duelIdB').textContent='CURSE #'+padded(second);
    $('duelRoundTitle').textContent='ROUND '+String(state.duelRound+1).padStart(2,'0');
    $('duelResult').textContent='TWO CURSES. ONE VERY IMPORTANT DECISION.';
    for (const side of ['A','B']){
      $('duelCard'+side).classList.remove('is-winner','is-loser','new-contender');
      void $('duelCard'+side).offsetWidth;
      $('duelCard'+side).classList.add('new-contender');
      $('vote'+side).disabled=false;$('vote'+side).setAttribute('aria-pressed','false');
    }
    $('duelSaveWinner').disabled=true;$('duelShareWinner').disabled=true;
    if(state.view==='duel'&&location.protocol.startsWith('http')){
      try{const url=new URL(location.href);url.searchParams.set('duel',first+'-'+second);history.replaceState(null,'',url.pathname+url.search+url.hash);}catch{}
    }
  }
  function voteDuel(side) {
    if(state.duelWinner || !state.duelPair.length)return;
    const winner=state.duelPair[side==='A'?0:1];
    state.duelWinner=winner;state.duelWins++;state.duelRound++;
    if(!state.duelWinnerIds.includes(winner))state.duelWinnerIds.unshift(winner);
    $('duelWins').textContent=String(state.duelWins);paintDuelSaved();
    for(const s of ['A','B']){
      $('vote'+s).disabled=true;$('vote'+s).setAttribute('aria-pressed',String(s===side));
      $('duelCard'+s).classList.add(s===side?'is-winner':'is-loser');
    }
    $('duelResult').textContent='🏆 THE CROWD HAS DECIDED: CURSE #'+padded(winner)+' WINS!';
    $('duelSaveWinner').disabled=false;$('duelShareWinner').disabled=false;
    particles($('duelCard'+side),65);playSound('duel');renderJourney();save();
    queueDuelVote(winner,state.duelPair.find(id=>id!==winner));
    try{navigator.vibrate?.([32,35,80]);}catch{}
  }
  async function shareDuel() {
    const curse=ref(state.duelWinner);if(!curse)return;
    const text=`🏆 CURSE DUEL WINNER!\n\n“${curse.text}”\n\nCurse #${padded(curse.id)} — Manly Curses Generator by Tye Clodd`;
    const url=gameURL({curse:curse.id,shared:1});
    if(navigator.share){try{await navigator.share({title:'Curse Duel Winner',text,url:url||undefined});registerShare();return;}catch(e){if(e?.name==='AbortError')return;}}
    const copied=await copy(text+(url?'\n'+url:''));if(copied)registerShare();toast(copied?'WINNING CURSE COPIED — READY TO SHARE!':'SHARING IS UNAVAILABLE.');
  }
  async function shareDuelChallenge(){
    if(!state.duelPair.length)newDuel();
    const [first,second]=state.duelPair;
    const text=`🏆 THE WORLD'S PETTIEST DUEL\n\nWhich curse is more annoying?\n\nA: ${ref(first).text}\n\nB: ${ref(second).text}\n\nOpen the challenge and pick your winner. Tye doesn't lie.`;
    const url=gameURL({view:'duel',duel:first+'-'+second});
    if(navigator.share){try{await navigator.share({title:'Pick your Curse Duel winner',text,url:url||undefined});registerShare();return;}catch(e){if(e?.name==='AbortError')return;}}
    const copied=await copy([text,url].filter(Boolean).join('\n\n'));
    if(copied)registerShare();toast(copied?'DUEL CHALLENGE COPIED — SEND IT TO A FRIEND!':'SHARING IS UNAVAILABLE.');
  }
  const suggestionStopWords=new Set('may your you the a and to of in on at be is an it every always just for when as with into from get gets have has one each not that this will would even only never after before off all are'.split(' '));
  const tokenize=text=>new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>!suggestionStopWords.has(w)).map(w=>w.replace(/(ing|ed|es|s)$/,'')).filter(w=>w.length>2&&!suggestionStopWords.has(w)));
  const normalized=text=>text.toLowerCase().replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim();
  const corpus=curses.map(c=>({...c,norm:normalized(c.text),tokens:tokenize(c.text)}));
  const scoreSimilarity=(query,b)=>{
    const ts=query.tokens,sa=query.norm,tb=b.tokens,common=[...ts].filter(x=>tb.has(x)).length;
    const overlap=common / Math.max(1,Math.min(ts.size,tb.size));
    const jaccard=common / Math.max(1,ts.size+tb.size-common);
    if(sa===b.norm)return 1;
    return .53*overlap+.47*jaccard;
  };
  let suggestedClose=[];
  function renderSimilarity(){
    const txt=$('suggestText').value.trim(),box=$('similarList');box.replaceChildren();
    $('suggestCounter').textContent=txt.length+' / 260';
    suggestedClose=[];
    if(txt.length<18){$('similarStatus').textContent='Write at least 18 characters to check existing curses.';return;}
    const category=$('suggestCategory').value;
    const query={tokens:tokenize(txt),norm:normalized(txt)};
    const ranked=corpus.map(c=>({curse:c,score:scoreSimilarity(query,c)+(category===c.category?.005:0)})).sort((a,b)=>b.score-a.score).slice(0,3);
    suggestedClose=ranked.filter(c=>c.score>=.37);
    $('similarStatus').textContent=ranked[0].score>=.78?'VERY CLOSE MATCH FOUND — CONSIDER ANOTHER TWIST.':ranked[0].score>=.48?'SOME SIMILAR IDEAS EXIST. ADD YOUR OWN TWIST.':'LOOKS PROMISING! NO OBVIOUS DUPLICATE FOUND.';
    for(const entry of ranked.filter(x=>x.score>=.24)){
      const row=document.createElement('div');row.className='similar-row';
      const id=document.createElement('strong');id.textContent='#'+padded(entry.curse.id)+' · '+entry.curse.category;
      const content=document.createElement('span');content.textContent=entry.curse.text;
      row.append(id,content);box.append(row);
    }
  }
  function suggestionMessage(){
    const category=$('suggestCategory').value,curse=$('suggestText').value.trim();
    return 'MANLY CURSES GENERATOR — COMMUNITY IDEA\n\nCategory: '+category+'\nSuggested curse: '+curse+'\n\nPossible similar entries: '+(suggestedClose.length?suggestedClose.map(x=>'#'+padded(x.curse.id)+' ('+x.curse.category+')').join(', '):'No obvious close matches found')+'\n\nI give permission to adapt this idea for the game. Please review before publishing.\n\nSubmitted through the Manly Curses Generator community form.';
  }
  function validateSuggestion(){
    const form=$('suggestForm');if(!form.reportValidity())return false;
    const txt=$('suggestText').value.trim();
    if(txt.length<18){toast('PLEASE WRITE AT LEAST 18 CHARACTERS.');$('suggestText').focus();return false;}
    if(txt.length>260){toast('PLEASE SHORTEN YOUR IDEA.');return false;}
    return true;
  }
  function sendSuggestion(event){
    event?.preventDefault();
    if(!validateSuggestion())return;
    renderSimilarity();
    const email=String(settings.suggestionEmail||'bookclodd@gmail.com').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){toast('SUBMISSION EMAIL NOT CONFIGURED.');return;}
    const subject='New Manly Curse suggestion · '+$('suggestCategory').value;
    // Static sites cannot directly send mail without a server/third-party provider.
    // mailto asks the visitor to review and send in their own email application.
    const href='mailto:'+email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(suggestionMessage());
    window.location.href=href;
    toast('EMAIL DRAFT READY — PRESS SEND IN YOUR EMAIL APP!');
  }

  function initArenaMotion() {
    const arena=document.querySelector('.arena');
    if(!arena || prefersLessMotion || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    let raf=0;
    arena.addEventListener('pointermove',e=>{
      const rect=arena.getBoundingClientRect();let x=(e.clientX-rect.left)/rect.width-.5,y=(e.clientY-rect.top)/rect.height-.5;
      if(raf)cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{arena.style.setProperty('--tilt-x',(x*12)+'px');arena.style.setProperty('--tilt-y',(y*8)+'px');});
    },{passive:true});
    arena.addEventListener('pointerleave',()=>{arena.style.setProperty('--tilt-x','0px');arena.style.setProperty('--tilt-y','0px')});
  }

  function applyMotionSetting() {
    prefersLessMotion = systemLessMotion || state.reducedMotion;
    document.body.classList.toggle('user-reduce-motion',prefersLessMotion);
    $('motionBtn').setAttribute('aria-pressed',String(state.reducedMotion));
    $('motionBtn').textContent=state.reducedMotion?'✓ REDUCED MOTION ON':'✦ REDUCE ANIMATIONS';
  }
  function backupSave() {
    const progress={version:3,createdAt:new Date().toISOString(),progress:progressSnapshot()};
    const blob=new Blob([JSON.stringify(progress,null,2)],{type:'application/json'});
    const href=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=href;link.download='manly-curses-progress.json';document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(href),15000);toast('YOUR PETTY PROGRESS IS BACKED UP!');
  }
  async function restoreSave(file) {
    if(!file)return;
    if(file.size>2000000){toast('SAVE FILE IS TOO LARGE.');return;}
    try{
      const raw=JSON.parse(await file.text());
      if(!raw || raw.version!==3 || !raw.progress || typeof raw.progress!=='object' || Array.isArray(raw.progress))throw Error('Invalid save format');
      const obj=raw.progress;
      const safe={favorites:uniqueValid(obj.favorites),history:uniqueValid(obj.history).slice(0,60),seen:uniqueValid(obj.seen).slice(0,curses.length),count:Math.min(1e7,Math.max(0,Math.floor(Number(obj.count)||0))),streak:Math.min(1e5,Math.max(0,Math.floor(Number(obj.streak)||0))),lastCastDate:/^\d{4}-\d{2}-\d{2}$/.test(obj.lastCastDate)?obj.lastCastDate:'',sound:typeof obj.masterSound === 'boolean' ? obj.masterSound : obj.musicEnabled!==false,musicEnabled:typeof obj.masterSound === 'boolean' ? obj.masterSound : obj.musicEnabled!==false,masterSound:typeof obj.masterSound === 'boolean' ? obj.masterSound : obj.musicEnabled!==false,reducedMotion:obj.reducedMotion===true,duelWins:Math.min(1e7,Math.max(0,Math.floor(Number(obj.duelWins)||0))),duelRound:Math.min(1e7,Math.max(0,Math.floor(Number(obj.duelRound)||0))),duelWinnerIds:uniqueValid(obj.duelWinnerIds),badgeNotified:Array.isArray(obj.badgeNotified)?obj.badgeNotified.filter(x=>badges.some(b=>b.id===x)):[],earnedBadges:Array.isArray(obj.earnedBadges)?obj.earnedBadges.filter(x=>badges.some(b=>b.id===x)):[],lastShareDate:typeof obj.lastShareDate==='string'?obj.lastShareDate:'',totalShares:Math.min(1e7,Math.max(0,Math.floor(Number(obj.totalShares)||0))),lastDailyCastDate:typeof obj.lastDailyCastDate==='string'?obj.lastDailyCastDate:'',firstCastDate:dateFromKey(obj.firstCastDate)?obj.firstCastDate:(dateFromKey(obj.lastCastDate)?obj.lastCastDate:''),activeMonthKeys:Array.isArray(obj.activeMonthKeys)?[...new Set(obj.activeMonthKeys.filter(x=>/^\d{4}-(0[1-9]|1[0-2])$/.test(x)))].slice(0,360):[]};
      clearPassiveCastProgress(safe);
      safe.unlocked=uniqueValid([...uniqueValid(obj.unlocked),...safe.seen,...safe.favorites,...safe.duelWinnerIds]);
      try{localStorage.setItem(storeKey,JSON.stringify(safe));}catch{toast('STORAGE IS NOT AVAILABLE HERE.');return;}
      toast('PROGRESS RESTORED! RELOADING…');setTimeout(()=>location.reload(),380);
    }catch{toast('THAT DOES NOT LOOK LIKE A MANLY CURSES SAVE FILE.');}
  }
  function init() {
    if(baseCurses.length!==2000 || categories.length<40 || !curses.every((curse,i)=>curse.id===i+1)){
      console.error('Invalid game data: the original collection or daily releases did not load.',curses.length,categories.length);
      $('curseText').textContent='The curse database did not load. Please refresh the page.';$('generateBtn').disabled=true;
      return;
    }
    $('generateBtn').disabled=false;
    $('machine').removeAttribute('aria-busy');
    for(const el of document.querySelectorAll('[data-curse-total]'))el.textContent=curses.length.toLocaleString('en');
    for(const el of document.querySelectorAll('[data-category-total]'))el.textContent=categories.length.toLocaleString('en');
    $('discoveryBar').setAttribute('aria-valuemax',String(curses.length));
    $('similarStatus').textContent='Start typing to check against '+curses.length.toLocaleString('en')+' existing curses.';
    const latest=dailyReleases[dailyReleases.length-1];
    $('dailyBtn').textContent=latest?'☀ '+(latest.date===torontoToday()?"TODAY'S NEW CURSE":'LATEST DAILY ORIGINAL'):'☀ CLASSIC OF THE DAY';
    $('dailyDropStatus').textContent=latest?(latest.date===torontoToday()?'NEW TODAY':'LATEST ORIGINAL')+' · #'+padded(latest.id)+' · '+latest.date+' · Daily Originals':'Daily originals are unavailable here. Enjoy the classic collection.';
    for(const name of categories){
      const label=document.createElement('option');label.value=name;label.textContent=name;
      $('categorySelect').append(label);
      $('vaultCategory').append(label.cloneNode(true));
      $('suggestCategory').append(label.cloneNode(true));
    }
    $('year').textContent=String(new Date().getFullYear());
    applyMotionSetting();
    initMusic();
    const initialParams=new URLSearchParams(location.search);
    $('friendName').value=cleanTarget(initialParams.get('to'));
    showCurse(cleanId(initialParams.get('curse'))||2);
    const sharedPair=readDuelPair(initialParams.get('duel'));
    if(sharedPair)newDuel(sharedPair);
    switchView(initialParams.get('view')||(sharedPair?'duel':'play'),{scroll:false,push:false});
    if(initialParams.get('shared')==='1'&&cleanId(initialParams.get('curse'))){
      $('sharedCurseNotice').hidden=false;
      $('generateLabel').textContent='CAST ONE BACK!';
    }
    updateMasterButton();
    for(const tab of document.querySelectorAll('[data-view]'))tab.addEventListener('click',()=>switchView(tab.dataset.view));
    $('homeLogo').addEventListener('click',()=>switchView('play'));
    $('manlinessJump').addEventListener('click',()=>{$('manlinessZone').scrollIntoView({behavior:prefersLessMotion?'instant':'smooth',block:'start'});});
    for(const button of document.querySelectorAll('[data-go]'))button.addEventListener('click',()=>switchView(button.dataset.go));
    $('generateBtn').addEventListener('click',()=>cast());
    $('favoritesSearch').addEventListener('input',()=>{favoritesPage=1;renderFavorites();});
    $('favoritesMore').addEventListener('click',()=>{favoritesPage++;renderFavorites();});
    const useOrFavorite=e=>{
      const use=e.target.closest('[data-use]'),heart=e.target.closest('[data-fav]');
      if(use&&isUnlocked(+use.dataset.use)){showCurse(+use.dataset.use);switchView('play');}
      if(heart&&isUnlocked(+heart.dataset.fav))favorite(+heart.dataset.fav);
    };
    $('favoritesGrid').addEventListener('click',useOrFavorite);
    $('worldRankingList').addEventListener('click',useOrFavorite);
    $('rankingRefresh').addEventListener('click',async()=>{await syncDuelVotes();await loadWorldRankings();});
    $('rankingMore').addEventListener('click',()=>{rankingPage++;renderWorldRanking();});
    $('duelRankingJump').addEventListener('click',()=>{$('worldRanking').scrollIntoView({behavior:prefersLessMotion?'instant':'smooth',block:'start'});});
    window.addEventListener('online',async()=>{await syncDuelVotes();if(state.view==='duel')loadWorldRankings();});
    window.addEventListener('offline',()=>{rankingLive=false;renderWorldRanking();});
    if(pendingDuelVotes.length)syncDuelVotes();
    $('duelRematch').addEventListener('click',()=>{newDuel();playSound('cast');});
    $('voteA').addEventListener('click',()=>voteDuel('A'));
    $('voteB').addEventListener('click',()=>voteDuel('B'));
    $('duelSaveWinner').addEventListener('click',()=>{if(state.duelWinner)favorite(state.duelWinner);});
    $('duelShareWinner').addEventListener('click',shareDuel);
    $('duelChallengeBtn').addEventListener('click',shareDuelChallenge);
    $('duelWins').textContent=String(state.duelWins);paintDuelSaved();
    initArenaMotion();
    $('friendName').addEventListener('input',updateTarget);
    $('categorySelect').addEventListener('change',()=>selectCategory($('categorySelect').value));
    document.querySelectorAll('.mode-chip').forEach(el=>el.addEventListener('click',()=>selectCategory(el.dataset.category)));
    $('favoriteBtn').addEventListener('click',()=>favorite());
    $('dailyBtn').addEventListener('click',()=>cast(dailyId()));
    $('randomFavBtn').addEventListener('click',()=>state.favorites.length?cast(state.favorites[rand(state.favorites.length)]):toast('SAVE A FAVORITE CURSE FIRST!'));
    $('copyBtn').addEventListener('click',async()=>toast(await copy([message(),curseURL()].filter(Boolean).join('\n\n'))?'CURSE COPIED. SEND IT TO SOMEONE!':'COPY IS NOT AVAILABLE IN THIS BROWSER.'));
    $('shareBtn').addEventListener('click',share);
    $('imageBtn').addEventListener('click',saveCard);
    $('vaultSearch').addEventListener('input',()=>{state.vaultPage=1;renderVault();});
    $('vaultCategory').addEventListener('change',()=>{state.vaultPage=1;renderVault();});
    for(const f of document.querySelectorAll('[data-filter]'))f.addEventListener('click',()=>{
      state.vaultFilter=f.dataset.filter;state.vaultPage=1;
      document.querySelectorAll('[data-filter]').forEach(b=>{const a=b===f;b.classList.toggle('active',a);b.setAttribute('aria-pressed',String(a));});
      renderVault();
    });
    $('vaultGrid').addEventListener('click',e=>{
      const use=e.target.closest('[data-use]'), fav=e.target.closest('[data-fav]');
      if(use){showCurse(+use.dataset.use);switchView('play');toast('CURSE LOADED. READY TO SHARE!');}
      if(fav)favorite(+fav.dataset.fav);
    });
    $('loadMore').addEventListener('click',()=>{state.vaultPage++;renderVault();});
    $('badgeGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-badge]');if(btn)openBadge(btn.dataset.badge);});
    $('allBadgeGrid').addEventListener('click',e=>{const btn=e.target.closest('[data-badge]');if(btn)openBadge(btn.dataset.badge);});
    $('seeAllAchievements').addEventListener('click',()=>{switchView('achievements');$('backAchievements').focus();});
    $('backAchievements').addEventListener('click',()=>{switchView('play',{scroll:false});$('seeAllAchievements').scrollIntoView({behavior:prefersLessMotion?'instant':'smooth',block:'center'});$('seeAllAchievements').focus();});
    $('badgeShareClose').addEventListener('click',closeBadge);
    $('badgeShareDialog').addEventListener('click',e=>{if(e.target===$('badgeShareDialog'))closeBadge();});
    $('badgeShareNow').addEventListener('click',()=>shareBadge(false));
    $('badgeSaveNow').addEventListener('click',()=>shareBadge(true));
    $('shareManliness').addEventListener('click',openManlinessCard);
    $('suggestText').addEventListener('input',renderSimilarity);
    $('suggestCategory').addEventListener('change',renderSimilarity);
    $('suggestForm').addEventListener('submit',sendSuggestion);
    $('suggestCopy').addEventListener('click',async()=>{if(!validateSuggestion())return;renderSimilarity();toast(await copy(suggestionMessage())?'SUBMISSION COPIED — EMAIL IT TO BOOKCLODD@GMAIL.COM':'COPY NOT AVAILABLE.');});
    $('soundBtn').addEventListener('click',toggleMasterSound);
    $('openAbout').addEventListener('click',modalOpen);$('footerHelp').addEventListener('click',modalOpen);
    $('motionBtn').addEventListener('click',()=>{state.reducedMotion=!state.reducedMotion;applyMotionSetting();save();toast(prefersLessMotion?'ANIMATIONS REDUCED.':'FULL ARCADE ANIMATIONS ON!');});
    $('saveExportBtn').addEventListener('click',backupSave);
    $('saveImportBtn').addEventListener('click',()=>$('saveImportFile').click());
    $('saveImportFile').addEventListener('change',e=>{restoreSave(e.target.files?.[0]);e.target.value='';});
    $('closeAbout').addEventListener('click',modalClose);
    $('aboutDialog').addEventListener('click',e=>{if(e.target===$('aboutDialog'))modalClose();});
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && !$('aboutDialog').hidden)modalClose();
      if(e.key==='Escape' && !$('badgeShareDialog').hidden)closeBadge();
      if(e.key===' ' && e.target===document.body && state.view==='play' && $('aboutDialog').hidden){e.preventDefault();cast();}
      const dialog=!$('badgeShareDialog').hidden?$('badgeShareDialog'):!$('aboutDialog').hidden?$('aboutDialog'):null;
      if(e.key==='Tab' && dialog){
        const focused=Array.from(dialog.querySelectorAll('button:not([disabled]),a[href]'));
        if(e.shiftKey && document.activeElement===focused[0]){e.preventDefault();focused.at(-1).focus();}
        else if(!e.shiftKey && document.activeElement===focused.at(-1)){e.preventDefault();focused[0].focus();}
      }
    });
    $('installTop').addEventListener('click',install);$('modalInstall').addEventListener('click',install);
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;});
    window.addEventListener('appinstalled',()=>{deferredPrompt=null;toast('MANLY CURSES IS INSTALLED!');});
    window.addEventListener('popstate',()=>{
      const params=new URLSearchParams(location.search),pair=readDuelPair(params.get('duel'));
      $('friendName').value=cleanTarget(params.get('to'));
      showCurse(cleanId(params.get('curse'))||2);
      if(pair&&pair.some((id,i)=>id!==state.duelPair[i]))newDuel(pair);
      switchView(params.get('view')||(pair?'duel':'play'),{push:false});
    });
    configureCreator();
    if('serviceWorker' in navigator && window.isSecureContext){
      const prepareOffline=async()=>{
        $('offlineStatus').textContent='PREPARING OFFLINE';
        try {
          await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
          await navigator.serviceWorker.ready;
          $('offlineStatus').textContent='OFFLINE READY';
        } catch(err) {
          $('offlineStatus').textContent='ONLINE PLAY';
          console.warn('Offline mode unavailable:',err);
        }
      };
      if(document.readyState==='complete')prepareOffline();
      else window.addEventListener('load',prepareOffline,{once:true});
    }
    // Do not open unknown user-provided URLs. All curses are text-only and inserted with textContent.
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
