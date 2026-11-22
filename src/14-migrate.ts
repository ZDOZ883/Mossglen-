import { gameState } from './00-state';
import { ACHIEVEMENTS } from './07-gear-ui';
import { COMBAT_SKILLS } from './01-species-pets';
import { DISH } from './07-gear-ui';
import { ENEMIES } from './02-gear-data';
import { MEMBERS } from './01-species-pets';
import { IT } from './01-species-pets';
import { LT } from './01-species-pets';

import { GATHER_SKILLS } from './01-species-pets';
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
export const SAVE_VERSION = 3;

function ensureDefaults() {
  gameState.tier=gameState.tier||{};gameState.best=gameState.best||{};gameState.cx=gameState.cx||{};gameState.bench=gameState.bench||{};gameState.mk=gameState.mk||{};gameState.lead=gameState.lead||null;gameState.style=gameState.style||'Melee';gameState.gear=gameState.gear||{Melee:0,Ranged:0,Magic:0,arm:0};if(gameState.xp.Attack==null&&(gameState.xp.Melee||gameState.xp.Ranged||gameState.xp.Magic)){const b0=Math.max(gameState.xp.Melee||0,gameState.xp.Ranged||0,gameState.xp.Magic||0);gameState.xp.Attack=gameState.xp.Strength=gameState.xp.Defense=b0}
  COMBAT_SKILLS.forEach(k=>gameState.xp[k]=gameState.xp[k]||(k=='Vitality'?XT[10]:0));gameState.tool=gameState.tool||{Foraging:0,Woodcutting:0,Fishing:0,Mining:0};if(gameState.cur&&gameState.cur.k=='s'&&!ACHIEVEMENTS.find(a=>a.id==gameState.cur.id))gameState.cur=null;
  if(gameState.cur&&gameState.cur.k=='c'&&!ENEMIES.find(e=>e.id==gameState.cur.id))gameState.cur=null;
  if(gameState.cur&&gameState.cur.k=='d')gameState.cur=null; // live delves were replaced by timed expeditions
  if(!gameState.own){if(gameState.gear){const rf=(g:string,c:any)=>c.slice(0,g).reduce((a:number,b:number)=>a+b,0);gameState.a+=['Melee','Ranged','Magic'].reduce((s,k)=>s+rf(gameState.gear[k]||0,[80,300,900]),0)+rf(gameState.gear.arm||0,[100,400,1000]);delete gameState.gear}gameState.own={w00:1,w10:1,w20:1};gameState.eq={Melee:'w00',Ranged:'w10',Magic:'w20',body:null,head:null,trinket:null}}
  gameState.kc=gameState.kc||{};gameState.pity=gameState.pity||{};gameState.col=gameState.col||{};gameState.zone=gameState.zone||0;gameState.stance=gameState.stance||'bal';gameState.pt=gameState.pt||0;gameState.str=gameState.str||0;gameState.su=gameState.su||{};gameState.task=gameState.task||null;if(gameState.cur&&gameState.cur.k=='f'&&!IT[gameState.cur.id])gameState.cur=null;
  initDish();GATHER_SKILLS.forEach(k=>gameState.xp[k]=gameState.xp[k]||0);gameState.tool.Hunting=gameState.tool.Hunting||0;if(gameState.cur&&gameState.cur.k=='k'&&!DISH[gameState.cur.id])gameState.cur=null;if(gameState.hp==null)gameState.hp=30+lv(gameState.xp.Vitality)*10;
  gameState.mt=gameState.mt||{};gameState.ct=gameState.ct||{};gameState.cg=gameState.cg||{};gameState.cape=gameState.cape||null;gameState.gates=gameState.gates||{};gameState.rc=gameState.rc||{};gameState.hrc=gameState.hrc||{};gameState.hr=gameState.hr||null;gameState.lo=gameState.lo||{};gameState.pets=gameState.pets||{};gameState.fam=gameState.fam||{};gameState.bu=gameState.bu||{};gameState.exs=gameState.exs||[];if(gameState.ex){gameState.exs.push(gameState.ex)}delete (gameState as any).ex;if(gameState.cur&&gameState.cur.k=='c'&&String(gameState.cur.id).indexOf('d_')==0){gameState.cur=null;gameState.ehp=null}Object.keys(gameState.mt).forEach(k=>{if(gameState.mt[k]&&gameState.mt[k].k=='exp'&&!gameState.ex)gameState.mt[k]={k:'war'}});gameState.sg=gameState.sg||{};if(!gameState.mig19&&gameState.own&&gameState.eq){gameState.mig19=1;const b=gameState.eq.body;if(b&&IT[b]){gameState.own['g'+IT[b].tier]=1;if(!gameState.eq.legs)gameState.eq.legs='g'+IT[b].tier}}gameState.ach=gameState.ach||{};gameState.seen=gameState.seen||{};if(gameState.cur&&gameState.cur.k=='d')gameState.cur=null;if(!gameState.autoSet)gameState.auto=true;gameState.rr=gameState.rr||0;clampXp();refreshFx();
  if(!gameState.form){gameState.form=gameState.stance=='agg'?'fury':gameState.stance=='def'?'bulwark':'steady';if(gameState.stance=='agg'||gameState.stance=='def')gameState.stance='bal'}
  if(gameState.stance=='ldr'){gameState.stance='bal';gameState.cmd=true}
  if(!XS[gameState.stance])gameState.stance='bal';
  gameState.cmd=!!gameState.cmd;
  if(gameState.ehp===undefined||!(gameState.cur&&gameState.cur.k=='c'))gameState.ehp=null;
  {const np=Object.keys(gameState.hired).filter(k=>!MEMBERS[k].pet).length;if(np>slots())gameState.xp.Leadership=XT[LT[Math.min(np,LT.length)-1]];const ps=Object.keys(gameState.hired).filter(k=>MEMBERS[k].pet);while(Object.keys(gameState.hired).length>slots()&&ps.length){const k=ps.pop();delete gameState.hired[k!];delete gameState.mt[k!]}}
  Object.keys(gameState.mt).forEach(k=>{if(!gameState.hired[k]&&!gameState.bench[k])delete gameState.mt[k];else if(!validTask(gameState.mt[k]))gameState.mt[k]={k:'idle'}});
}

export const MIGRATIONS: { v: number; run: () => void }[] = [
  // v2: Farming and Alchemy arrive. Everyone gets a few turnip seeds to start the first plot.
  { v: 2, run: () => { gameState.farm = gameState.farm || []; gameState.buffs = gameState.buffs || {}; if (!(gameState.inv['turnip seeds'] > 0)) gameState.inv['turnip seeds'] = 4; } },
  // v3: Ranged and Magic become their own skills. Existing characters start both at their Attack xp, so no gear locks and nothing is lost.
  { v: 3, run: () => { gameState.xp.Ranged = Math.max(gameState.xp.Ranged || 0, gameState.xp.Attack || 0); gameState.xp.Magic = Math.max(gameState.xp.Magic || 0, gameState.xp.Attack || 0); } },
];

export function migrate() {
  ensureDefaults();
  let v = gameState.v || 1;
  for (const m of MIGRATIONS) if (v < m.v) { m.run(); v = m.v; }
  gameState.v = Math.max(v, SAVE_VERSION);
}
