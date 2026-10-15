/* Privacy-conscious analytics hooks. Events are sent only when an owner-configured endpoint exists. */
(() => {
  'use strict';
  const endpoint = window.MANLY_CONFIG?.analyticsEndpoint;
  if (!endpoint || !/^https:\/\//i.test(endpoint)) return;
  const start = Date.now();
  let lastActivity = start;
  const allowed = new Set(['visit','engagement','curse_cast','favorite_added','favorite_removed','duel_vote','share','copy','save_card','view']);
  function track(name, data = {}) {
    if (!allowed.has(name)) return;
    const payload = JSON.stringify({event:name, at:new Date().toISOString(), path:location.pathname, ...data});
    try { navigator.sendBeacon?.(endpoint, new Blob([payload], {type:'text/plain'})) || fetch(endpoint,{method:'POST',mode:'no-cors',keepalive:true,body:payload}); } catch {}
  }
  window.manlyAnalytics = {track};
  track('visit');
  const map = {generateBtn:'curse_cast',favoriteBtn:'favorite_added',voteA:'duel_vote',voteB:'duel_vote',shareBtn:'share',copyBtn:'copy',imageBtn:'save_card'};
  document.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.id === 'favoriteBtn') {
      track(button.getAttribute('aria-pressed') === 'true' ? 'favorite_removed' : 'favorite_added');
    } else if (map[button.id]) {
      track(map[button.id], button.id === 'voteA' || button.id === 'voteB' ? {side:button.id === 'voteA'?'A':'B'} : {});
    } else if (button.dataset.view) {
      track('view',{feature:button.dataset.view});
    }
    lastActivity = Date.now();
  }, true);
  for (const event of ['pointerdown','keydown','scroll']) document.addEventListener(event,()=>{lastActivity=Date.now()},{passive:true});
  function engagement() {
    const seconds = Math.min(1800, Math.max(0, Math.round((Math.min(Date.now(),lastActivity+30000)-start)/1000)));
    if (seconds>0) track('engagement',{seconds});
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')engagement()});
  window.addEventListener('pagehide',engagement);
})();
