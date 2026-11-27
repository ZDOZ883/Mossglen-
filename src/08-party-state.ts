import { gameState, TASKS, FXSRC } from './00-state';
import { X } from './registry';
import { IT, MEMBERS, asg, cb, cl, kit, ldx, lv, mst, mxp, pbs, roster, sicOn, skPet } from './01-species-pets';
import { RFN, ctime, fxTxt, gateOk, refineDone } from './02-gear-data';

import { hrCount } from './03-world-expeditions';
import { ACHIEVEMENTS, CSK, DISH, cookDone, craftDone, mspd, slots, tt } from './07-gear-ui';
export function validTask(t:any){return !!t&&((!!TASKS[t.k]&&TASKS[t.k].valid(t))||t.k=='war'||t.k=='idle'||t.k=='bar'||t.k=='exp'||(t.k=='s'&&!!ACHIEVEMENTS.find(a=>a.id==t.id))||(t.k=='k'&&!!DISH[t.id])||(t.k=='f'&&!!IT[t.id]&&t.id[0]!='t')||(t.k=='r'&&!!RFN[t.id]))}
export function assign(k:string,kind:string,id?:any){
  if(gameState.bench[k]&&!gameState.hired[k]){if(kind=='bar'&&X.buL('bar')>0)gameState.mt[k]={k:'bar'};else if(kind=='idle')gameState.mt[k]={k:'idle'};return}
  if(!gameState.hired[k]||asg(k).k=='exp')return;
  const t=gameState.mt[k];
  if(kind=='bar'){if(X.buL('bar')>0)gameState.mt[k]={k:'bar'};return}
  if(kind=='war'||kind=='idle'){gameState.mt[k]={k:kind};return}
  if(t&&t.k==kind&&t.id==id){gameState.mt[k]={k:'idle'};return}
  gameState.mt[k]={k:kind,id,p:0};
}
export const mdur=(k:string,t:any)=>TASKS[t.k]&&TASKS[t.k].mdur?TASKS[t.k].mdur!(k,t):(t.k=='s'?tt(ACHIEVEMENTS.find(a=>a.id==t.id)):t.k=='k'?3.5*Math.max(.3,1-cb('spd','Cooking')):t.k=='r'?6*Math.max(.3,1-cb('spd',RFN[t.id].sk)):ctime(t.id)*Math.max(.3,1-cb('spd',CSK(t.id))))/(mspd(k)*pbs(k,X.skOf(t)));
export function memAct(k:string,t:any){
  const bail=()=>{gameState.mt[k]={k:'idle'}};
  if(t.k=='s'){const a=ACHIEVEMENTS.find(x=>x.id==t.id);if(!a||lv(gameState.xp[a.sk])<a.lv||!gateOk(a.gate))return bail();skPet(a.sk);const yn=1+(Math.random()<lv(gameState.xp[a.sk])*.004+cb('yld',a.sk)+(pbs(k,a.sk)>1?.15:0)?1:0);const pn=X.famCut(k,yn);gameState.inv[a.item]=(gameState.inv[a.item]||0)+pn;hrCount(a,pn);mxp(k,a.xp*.6);ldx(a.xp*.5)}
  else if(TASKS[t.k]&&TASKS[t.k].mact)TASKS[t.k].mact!(k,t);
  else if(t.k=='k')cookDone(t.id,k);
  else if(t.k=='f'){if(lv(gameState.xp[CSK(t.id)])<IT[t.id].req)return bail();craftDone(t.id,k)}
  else if(t.k=='r'){if(lv(gameState.xp[RFN[t.id].sk])<RFN[t.id].req)return bail();refineDone(t.id,k)}
}

Object.defineProperties(X,{validTask:{get:()=>validTask,configurable:true}});
// Every recruit commands differently, so each has a buff of their own. Level scales it, up to +50% at level 100.
export const SIC:Record<string,{n:string;fx:[string,number][]}>={
  mole:{n:'Dig in',fx:[['taken',.02],['hpm',.03]]},
  hare:{n:'Swift orders',fx:[['pmult',.06],['mspd',.06]]},
  owl:{n:'Eagle eye',fx:[['drop',.05],['acc',.03]]},
  otter:{n:'Field hospital',fx:[['regen',.1],['heal',.04]]},
  badger:{n:'Stand firm',fx:[['ttaken',.07],['hpm',.05]]},
  fox:{n:'Opening strike',fx:[['crit',.05],['dmgm',.05]]},
  dormouse:{n:'Well fed',fx:[['heal',.05],['regen',.05]]},
  shrew:{n:'Brewer’s boon',fx:[['pot',.15],['xpm',.04]]},
  magpie:{n:'Spoils of war',fx:[['sell',.05],['drop',.03]]}};
// Pets have no buff of their own, so they lead with the strength they fight with: the two biggest of their perks, shrunk to leader size.
const PETSIC:Record<string,[string,number]>={dmg:['pmult',.5],taken:['taken',.3],heal:['regen',3],speed:['mspd',.4],loot:['drop',.2]};
const petSic=(k:string)=>{const pk=MEMBERS[k].pk,fx=Object.keys(pk).filter(n=>PETSIC[n]).sort((a,b)=>pk[b]*PETSIC[b][1]-pk[a]*PETSIC[a][1]).slice(0,2).map((n):[string,number]=>[PETSIC[n][0],Math.round(pk[n]*PETSIC[n][1]*1000)/1000]);return fx.length?{n:'Pack leader',fx}:null};
export const sicBuff=(k:string)=>{const b=MEMBERS[k]&&MEMBERS[k].pet?petSic(k):SIC[k];if(!b)return null;const s=1+Math.min(1,cl(k)/100)*.5;return{n:b.n,fx:b.fx,s,d:fxTxt(b.fx.map(([q,v])=>[q,v*s]))}};
FXSRC.push(()=>{const k=gameState.sic;if(!k||!sicOn())return[];const b=sicBuff(k);return b?b.fx.map(([q,v])=>({k:q,v:v*b.s,sk:null as any})):[]});

// Auto-fill: seat the strongest fighters in the open slots, by combined stats or by level. Specialists and anyone away on an expedition stay as they are.
export const memPower=(k:string)=>{const s=mst(k);return(s.a*1.5+s.d+s.v)*(1+kit(k))*(MEMBERS[k].pet?1.25:1)};
export function autoParty(mode:string){
  const keep=(k:string)=>!!MEMBERS[k].spec||asg(k).k=='exp',pool=roster().filter(k=>!keep(k));
  const open=Math.max(0,slots()-Object.keys(gameState.hired).filter(keep).length);
  const score=(k:string)=>mode=='level'?cl(k)*1e6+memPower(k):memPower(k);
  const pick=pool.sort((a,b)=>score(b)-score(a)).slice(0,open);
  pool.forEach(k=>{const inP=!!gameState.hired[k],want=pick.includes(k);
    if(want&&!inP){delete gameState.bench[k];gameState.hired[k]=1;gameState.mt[k]={k:'war'}}
    else if(want&&inP&&asg(k).k!='war')gameState.mt[k]={k:'war'};
    else if(!want&&inP){delete gameState.hired[k];gameState.bench[k]=1;gameState.mt[k]={k:'idle'}}});
  if(!gameState.hired[gameState.lead||'']||false)gameState.lead=Object.keys(gameState.hired)[0]||null;
  return pick;
}
