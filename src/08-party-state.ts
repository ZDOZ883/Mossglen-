import { gameState, TASKS, FXSRC } from './00-state';
import { X } from './registry';
import { IT, asg, cb, cl, MEMBERS, ldx, lv, mxp, pbs, sicOn, skPet } from './01-species-pets';
import { RFN, ctime, gateOk, refineDone } from './02-gear-data';

import { hrCount } from './03-world-expeditions';
import { ACHIEVEMENTS, CSK, DISH, cookDone, craftDone, mspd, tt } from './07-gear-ui';
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
export const SIC:Record<string,{n:string;fx:[string,number][];d:string}>={
  Tank:{n:'Hold the line',fx:[['taken',.04]],d:'−4% damage taken'},
  Striker:{n:'Rally the charge',fx:[['pmult',.06]],d:'+6% party damage'},
  Healer:{n:'Tend the wounded',fx:[['regen',.25]],d:'+25% recovery'},
  Scout:{n:'Read the field',fx:[['drop',.04],['xpm',.03]],d:'+4% rare drops, +3% combat xp'},
  Specialist:{n:'Keep the camp',fx:[['xpm',.05]],d:'+5% combat xp'}};
export const sicBuff=(k:string)=>{const b=SIC[MEMBERS[k].role];return b?{...b,s:1+Math.min(1,cl(k)/100)*.5}:null};
FXSRC.push(()=>{const k=gameState.sic;if(!k||!sicOn())return[];const b=sicBuff(k);return b?b.fx.map(([q,v])=>({k:q,v:v*b.s,sk:null as any})):[]});
