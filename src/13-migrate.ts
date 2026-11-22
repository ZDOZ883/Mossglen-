import { S, save } from './00-state';
import { A } from './07-gear-ui';
import { CS } from './01-species-pets';
import { DISH } from './07-gear-ui';
import { E } from './02-gear-data';
import { H } from './01-species-pets';
import { IT } from './01-species-pets';
import { LT } from './01-species-pets';

import { SK } from './01-species-pets';
import { XS } from './01-species-pets';
import { XT } from './01-species-pets';
import { clampXp } from './11-engine';
import { initDish } from './07-gear-ui';
import { lv } from './01-species-pets';
import { refreshFx } from './11-engine';
import { slots } from './07-gear-ui';
import { validTask } from './08-party-state';
// Save upgrades. ensureDefaults() is idempotent: it fills any field an older save lacks.
// For changes that are not idempotent (renames, rebalances of stored values), add an entry to MIGRATIONS
// with the next version number; each runs once, in order, and S.v records the latest applied version.
export const SAVE_VERSION = 1;

function ensureDefaults() {
  S.tier=S.tier||{};S.best=S.best||{};S.cx=S.cx||{};S.lead=S.lead||null;S.style=S.style||'Melee';S.gear=S.gear||{Melee:0,Ranged:0,Magic:0,arm:0};if(S.xp.Attack==null&&(S.xp.Melee||S.xp.Ranged||S.xp.Magic)){const b0=Math.max(S.xp.Melee||0,S.xp.Ranged||0,S.xp.Magic||0);S.xp.Attack=S.xp.Strength=S.xp.Defense=b0}
  CS.forEach(k=>S.xp[k]=S.xp[k]||(k=='Vitality'?XT[10]:0));S.tool=S.tool||{Foraging:0,Woodcutting:0,Fishing:0,Mining:0};if(S.cur&&S.cur.k=='s'&&!A.find(a=>a.id==S.cur.id))S.cur=null;
  if(S.cur&&S.cur.k=='c'&&!E.find(e=>e.id==S.cur.id))S.cur=null;
  if(S.cur&&S.cur.k=='d')S.cur=null; // live delves were replaced by timed expeditions
  if(!S.own){if(S.gear){const rf=(g:string,c:any)=>c.slice(0,g).reduce((a:number,b:number)=>a+b,0);S.a+=['Melee','Ranged','Magic'].reduce((s,k)=>s+rf(S.gear[k]||0,[80,300,900]),0)+rf(S.gear.arm||0,[100,400,1000]);delete S.gear}S.own={w00:1,w10:1,w20:1};S.eq={Melee:'w00',Ranged:'w10',Magic:'w20',body:null,head:null,trinket:null}}
  S.kc=S.kc||{};S.pity=S.pity||{};S.col=S.col||{};S.zone=S.zone||0;S.stance=S.stance||'bal';S.pt=S.pt||0;S.str=S.str||0;S.su=S.su||{};S.task=S.task||null;if(S.cur&&S.cur.k=='f'&&!IT[S.cur.id])S.cur=null;
  initDish();SK.forEach(k=>S.xp[k]=S.xp[k]||0);S.tool.Hunting=S.tool.Hunting||0;if(S.cur&&S.cur.k=='k'&&!DISH[S.cur.id])S.cur=null;if(S.hp==null)S.hp=30+lv(S.xp.Vitality)*10;
  S.mt=S.mt||{};S.ct=S.ct||{};S.cg=S.cg||{};S.cape=S.cape||null;S.gates=S.gates||{};S.rc=S.rc||{};S.hrc=S.hrc||{};S.hr=S.hr||null;S.lo=S.lo||{};S.pets=S.pets||{};S.fam=S.fam||{};S.bu=S.bu||{};S.ex=S.ex||null;if(S.cur&&S.cur.k=='c'&&String(S.cur.id).indexOf('d_')==0){S.cur=null;S.ehp=null}Object.keys(S.mt).forEach(k=>{if(S.mt[k]&&S.mt[k].k=='exp'&&!S.ex)S.mt[k]={k:'war'}});S.sg=S.sg||{};if(!S.mig19&&S.own&&S.eq){S.mig19=1;const b=S.eq.body;if(b&&IT[b]){S.own['g'+IT[b].tier]=1;if(!S.eq.legs)S.eq.legs='g'+IT[b].tier}}S.ach=S.ach||{};S.seen=S.seen||{};if(S.cur&&S.cur.k=='d')S.cur=null;if(!S.autoSet)S.auto=true;S.rr=S.rr||0;clampXp();refreshFx();
  if(!S.form){S.form=S.stance=='agg'?'fury':S.stance=='def'?'bulwark':'steady';if(S.stance=='agg'||S.stance=='def')S.stance='bal'}
  if(S.stance=='ldr'){S.stance='bal';S.cmd=true}
  if(!XS[S.stance])S.stance='bal';
  S.cmd=!!S.cmd;
  if(S.ehp===undefined||!(S.cur&&S.cur.k=='c'))S.ehp=null;
  {const np=Object.keys(S.hired).filter(k=>!H[k].pet).length;if(np>slots())S.xp.Leadership=XT[LT[Math.min(np,LT.length)-1]];const ps=Object.keys(S.hired).filter(k=>H[k].pet);while(Object.keys(S.hired).length>slots()&&ps.length){const k=ps.pop();delete S.hired[k!];delete S.mt[k!]}}
  Object.keys(S.mt).forEach(k=>{if(!S.hired[k])delete S.mt[k];else if(!validTask(S.mt[k]))S.mt[k]={k:'idle'}});
}

export const MIGRATIONS: { v: number; run: () => void }[] = [
  // { v: 2, run: () => { /* example: S.newField = convert(S.oldField); */ } },
];

export function migrate() {
  ensureDefaults();
  let v = S.v || 1;
  for (const m of MIGRATIONS) if (v < m.v) { m.run(); v = m.v; }
  S.v = Math.max(v, SAVE_VERSION);
}
