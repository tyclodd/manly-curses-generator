import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const stop=new Set('may your you the a an and or to of in on at be is it every always just for when as with into from get gets have has one each not that this will would even only never after before off all are whenever then'.split(' '));
export const normalized=text=>String(text).toLowerCase().replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim();
const tokens=text=>normalized(text).split(' ').filter(w=>!stop.has(w)).map(w=>w.replace(/(ing|ed|es|s)$/,'')).filter(w=>w.length>2);
export function assessOriginality(text,corpus){
  const documents=corpus.map(row=>tokens(row.text)),query=tokens(text),df=new Map();
  for(const doc of documents)for(const word of new Set(doc))df.set(word,(df.get(word)||0)+1);
  const vector=words=>{const counts=new Map();for(const word of words)counts.set(word,(counts.get(word)||0)+1);return new Map([...counts].map(([word,n])=>[word,n*(1+Math.log((corpus.length+1)/(1+(df.get(word)||0))))]));};
  const q=vector(query),norm=v=>Math.sqrt([...v.values()].reduce((n,x)=>n+x*x,0)),qNorm=norm(q),queryNorm=normalized(text);
  const closest=corpus.map((row,i)=>{
    const v=vector(documents[i]),dot=[...q].reduce((n,[word,weight])=>n+weight*(v.get(word)||0),0);
    const score=queryNorm===normalized(row.text)?1:dot/Math.max(1e-10,qNorm*norm(v));
    return {id:row.id,text:row.text,score:Number(score.toFixed(4))};
  }).sort((a,b)=>b.score-a.score||a.id-b.id);
  const phrases=new Set();for(let i=0;i<=query.length-4;i++)phrases.add(query.slice(i,i+4).join(' '));
  const copiedPhrase=documents.some(doc=>{for(let i=0;i<=doc.length-4;i++)if(phrases.has(doc.slice(i,i+4).join(' ')))return true;return false;});
  return {passes:closest[0]?.score<.45&&!copiedPhrase,maximumSimilarity:closest[0]?.score||0,copiedContentPhrase:copiedPhrase,closest:closest.slice(0,15)};
}
export function validateFeed(feed){
  if(feed?.schema!==1||feed.timezone!=='America/Toronto'||!Array.isArray(feed.releases)||feed.releases.length>10000)throw Error('Invalid feed');
  const texts=new Set();let previous='';
  for(const [i,row] of feed.releases.entries()){
    if(row.id!==2001+i||!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!Number.isFinite(Date.parse(row.date+'T12:00:00Z'))||new Date(row.date+'T12:00:00Z').toISOString().slice(0,10)!==row.date||row.date<=previous||row.category!=='Daily Originals'||typeof row.text!=='string'||row.text.length<25||row.text.length>280||/[<>\u0000-\u001f]/.test(row.text))throw Error('Invalid release');
    if(texts.has(normalized(row.text)))throw Error('Duplicate release');texts.add(normalized(row.text));previous=row.date;
  }
  return feed;
}
const isMain=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  try{
    const [command,candidatePath]=process.argv.slice(2),project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=existsSync(path.join(project,'static-snapshot'))?path.join(project,'static-snapshot'):project;
    if(!['check','publish','verify'].includes(command))throw Error('Use: node qa/daily-release.mjs check|publish candidate.json, or verify');
    const context={window:{}};vm.runInNewContext(readFileSync(path.join(root,'curses-data.js'),'utf8'),context,{timeout:1000});
    const base=context.window.MANLY_CURSES,feed=validateFeed(JSON.parse(readFileSync(path.join(root,'daily-curses.json'),'utf8')));
    if(base.length!==2000||new Set(base.map(row=>normalized(row.text))).size!==2000)throw Error('The original collection must stay intact');
    if(command==='verify'){
      for(const row of feed.releases){const report=assessOriginality(row.text,[...base,...feed.releases.filter(other=>other.id!==row.id)]);if(!report.passes)throw Error('Originality check failed for #'+row.id);}
      console.log(JSON.stringify({ok:true,originalCount:base.length,dailyCount:feed.releases.length,total:base.length+feed.releases.length,lastRelease:feed.releases.at(-1)},null,2));
    }else{
      const candidate=JSON.parse(readFileSync(candidatePath,'utf8'));
      const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
      if(candidate.date!==today)throw Error('Publish only for the current Toronto date');
      if(feed.releases.some(row=>row.date===today))throw Error('A curse is already published for this date; do not add another');
      if(typeof candidate.concept!=='string'||candidate.concept.length<25)throw Error('Describe the new comic mechanism');
      const report=assessOriginality(candidate.text,[...base,...feed.releases]);
      console.log(JSON.stringify({candidate,originality:report},null,2));
      if(!report.passes)throw Error('Choose a different premise; wording is too close');
      const release={id:2001+feed.releases.length,date:today,category:'Daily Originals',text:candidate.text,concept:candidate.concept};
      validateFeed({...feed,releases:[...feed.releases,release]});
      if(command==='publish'){
        if(typeof candidate.editorialReview!=='string'||candidate.editorialReview.length<80)throw Error('A semantic review is required; describe why the premise and payoff differ from the collection and nearest matches');
        release.review={note:candidate.editorialReview,closestIds:report.closest.slice(0,5).map(row=>row.id),maximumLexicalSimilarity:report.maximumSimilarity};
        feed.releases.push(release);writeFileSync(path.join(root,'daily-curses.json'),JSON.stringify(feed,null,2)+'\n');
        console.log('Prepared one release. Commit daily-curses.json, verify readback, and wait for successful GitHub Pages deployment.');
      }
    }
  }catch(error){console.error(error.message);process.exitCode=1;}
}
