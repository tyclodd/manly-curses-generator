/* Fetch the shared daily catalog before opening progress, with a durable offline copy. */
(() => {
  'use strict';
  const key='manly-curses-daily-v1',today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const validate=feed=>{
    if(feed?.schema!==1||feed.timezone!=='America/Toronto'||!Array.isArray(feed.releases)||feed.releases.length>10000)throw Error('Invalid catalog');
    let previous='';const texts=new Set();
    for(const [i,row] of feed.releases.entries()){
      if(row.id!==2001+i||!/^\d{4}-\d{2}-\d{2}$/.test(row.date||'')||!Number.isFinite(Date.parse(row.date+'T12:00:00Z'))||new Date(row.date+'T12:00:00Z').toISOString().slice(0,10)!==row.date||row.date<=previous||row.date>today||row.category!=='Daily Originals'||typeof row.text!=='string'||row.text.length<25||row.text.length>280||/[<>\u0000-\u001f]/.test(row.text))throw Error('Invalid release');
      const normalized=row.text.toLowerCase().replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim();if(texts.has(normalized))throw Error('Duplicate release');texts.add(normalized);previous=row.date;
    }
    return feed;
  };
  let best={schema:1,timezone:'America/Toronto',releases:[]};
  try{best=validate(JSON.parse(localStorage.getItem(key)));}catch{}
  const adopt=feed=>{
    validate(feed);
    if(feed.releases.length<best.releases.length||!best.releases.every((old,i)=>['id','date','text','category'].every(k=>old[k]===feed.releases[i][k])))return;
    best=feed;
  };
  const settings=window.MANLY_CONFIG||{};
  const api=settings.duelApiOrigin?new URL('/api/daily-curses',settings.duelApiOrigin).href:'./api/daily-curses';
  const read=async url=>{
    try{const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('Unavailable');const text=await response.text();if(text.length>4000000)throw Error('Too large');adopt(JSON.parse(text));}catch{}
  };
  window.MANLY_DAILY_READY=Promise.all([read('./daily-curses.json'),read(api)]).then(()=>{
    window.MANLY_DAILY_RELEASES=best.releases;
    try{localStorage.setItem(key,JSON.stringify(best));}catch{}
  });
})();
