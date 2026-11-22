import { S, save, say } from './00-state';
import { X } from './registry';
import { lv } from './01-species-pets';
import { GSK, ZN } from './02-gear-data';
import { GN } from './07-gear-ui';
// Slayer gear, seasons, burrow. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
// ---------- slayer gear and seasons
export const SG=[
{id:'helm',n:['Slayer Cowl','Slayer Helm','Hunter’s Visage','Warden’s Crown'],d:'On task: more damage.',e:'tdmg',v:[.08,.16,.25,.35]},
{id:'ring',n:['Tracker’s Ring','Hunter’s Ring','Stalker’s Signet','Warden’s Signet'],d:'On task: more rare drops.',e:'tdrop',v:[.1,.2,.35,.5]},
{id:'cloak',n:['Task Cloak','Thistle Cloak','Warden’s Mantle','Hollow Mantle'],d:'On task: less damage taken.',e:'ttaken',v:[.06,.12,.2,.3]},
{id:'charm',n:['Task Charm','Thistle Charm','Warden’s Charm','Hollow Charm'],d:'More Slayer points and Slayer xp from tasks.',e:'pts',v:[.1,.2,.3,.5]}];
export const SGC=[50,150,400,900],SGL=[10,35,60,85];
export const sgT=(id:string)=>(S.sg&&S.sg[id])||0;
export function sgBuy(id:string){const g=SG.find(x=>x.id==id),t=sgT(id);if(!g||t>=4||S.pt<SGC[t]||lv(S.xp.Slayer)<SGL[t])return;S.pt-=SGC[t];S.sg[id]=t+1;X.refreshFx();say('Slayer gear: '+g.n[t]+' acquired.')}
export function sgFx(){const o:any[]=[];if(!S||!S.sg)return o;SG.forEach(g=>{const t=sgT(g.id);if(!t)return;o.push({k:g.e,v:g.v[t-1],sk:null});if(g.id=='charm')o.push({k:'txp',v:g.v[t-1],sk:null})});return o}
export function sgView(){
  return '<h2>Slayer gear</h2><p class="mu">Always worn. The bonuses only work while you fight your current task monster.</p>'+SG.map(g=>{const t=sgT(g.id);
    return '<div class="row"><span>'+(t?g.n[t-1]+' · tier '+t:g.n[0].replace(/ .*/,'')+' gear · not owned')+'<small>'+g.d+(t?' Now: '+Math.round(g.v[t-1]*100)+'%.':'')+(t<4?' Next: '+Math.round(g.v[t]*100)+'% · needs Slayer '+SGL[t]+'.':' Fully upgraded.')+'</small></span>'+(t<4?'<button class="btn" data-sgbuy="'+g.id+'"'+(S.pt<SGC[t]||lv(S.xp.Slayer)<SGL[t]?' disabled':'')+'>'+SGC[t]+' pts</button>':'<span class="good">Max</span>')+'</div>'}).join('');
}
export const WX=[
{id:'spring',n:'Spring',i:'🌱',d:'New growth. Foragers thrive, the shallows run well, and the rock stays muddy.',fx:[['spd',.2,['Foraging']],['yld',.05,['Foraging']],['spd',.1,['Fishing']],['spd',-.1,['Mining']]]},
{id:'summer',n:'Summer',i:'☀️',d:'Long bright days. Good for fishing, timber and the stove, hard on the berry patches.',fx:[['spd',.2,['Fishing']],['spd',.1,['Woodcutting']],['spd',.15,['Cooking']],['burn',-.15,['Cooking']],['spd',-.1,['Foraging']]]},
{id:'autumn',n:'Autumn',i:'🍂',d:'Harvest time. Prey is fat and the traplines pay well, but the rivers are low.',fx:[['spd',.2,['Hunting']],['yld',.1,['Hunting']],['xp',.1,['Foraging']],['spd',-.1,['Fishing']]]},
{id:'winter',n:'Winter',i:'❄️',d:'Hard frost. Dig deep and keep the hearth lit, because little grows and the water ices over.',fx:[['spd',.2,['Mining']],['yld',.05,['Mining']],['spd',.15,['Cooking']],['spd',-.2,['Foraging']],['spd',-.15,['Fishing']],['spd',-.1,['Woodcutting']]]}];
export const WS=43200;
export const wxSlot=()=>Math.floor(Date.now()/1000/WS);
export function wxAt(sl:any){return WX[((sl%4)+4)%4]}
export const wxNow=()=>wxAt(wxSlot());
export function wxFx(){const o:any[]=[];wxNow().fx.forEach((e:any)=>e[2].forEach((sk:string)=>o.push({k:e[0],v:e[1],sk})));return o}
export function wxCheck(){const sl=wxSlot();if(S.wxs!==sl){const first=S.wxs==null;S.wxs=sl;X.refreshFx();if(!first)say(wxNow().i+' The season turns: '+wxNow().n+' begins.')}}
export const wxTxt=(w:any)=>w.fx.map((e:Enemy)=>e[2].map((sk:string)=>sk+' '+(e[1]>0?'+':'−')+Math.round(Math.abs(e[1])*100)+'% '+(e[0]=='burn'?(e[1]>0?'less burning':'more burning'):({spd:'speed',yld:'double yields',xp:'xp'} as any)[e[0]]||e[0])).join(', ')).join(' · ');
export function wxView(){
  const w=wxNow(),s0=wxSlot(),left=Math.max(0,(s0+1)*WS*1000-Date.now()),m=Math.ceil(left/60000),nx=wxAt(s0+1),n2=wxAt(s0+2);
  const ends=(m>=60?Math.floor(m/60)+'h ':'')+m%60+'m';
  return '<details class="chip"><summary><span>'+w.i+' '+w.n+'</span><em>'+ends+'</em></summary><div class="mu">'+w.d+'<br>'+wxTxt(w)+'<br>Next: '+nx.i+' '+nx.n+', then '+n2.i+' '+n2.n+'. Combat is never affected.</div></details>';
}
// ---------- burrow home base
export const CRS=['Smithing','Fletching','Enchanting','Tailoring'];
export const BUA=[3000,25000,150000,900000,5000000],BUQ=[40,80,150,250,400],BUI=[1,3,5,7,9];
export const BRATE=(L:any)=>[0,400,900,1600,2600,4000][L];
export const buL=(id:string)=>(S&&S.bu&&S.bu[id])||0;
export const BU=[
{id:'lodge',n:'Gatherer’s Lodge',d:'Faster gathering and a better chance of double yields.',mats:['Woodcutting','Mining'],fx:(L:any)=>[['spd',.03*L,GSK],['yld',.02*L,GSK]],tx:(L:any)=>3*L+'% faster gathering, '+2*L+'% more double yields'},
{id:'shop',n:'Workshop',d:'Faster crafting and refining, and a chance to save materials.',mats:['Mining','Hunting'],fx:(L:any)=>[['spd',.03*L,CRS],['save',.03*L,CRS]],tx:(L:any)=>3*L+'% faster crafting, '+3*L+'% chance to save materials'},
{id:'kitchen',n:'Kitchen',d:'Faster cooking, fewer burnt meals and stronger food.',mats:['Foraging','Fishing'],fx:(L:any)=>[['spd',.03*L,['Cooking']],['burn',.08*L,['Cooking']],['heal',.04*L,null]],tx:(L:any)=>3*L+'% faster cooking, '+8*L+'% less burning, +'+4*L+'% food healing'},
{id:'larder',n:'Larder',d:'Sell goods for more, and your skilling members send more home to you.',mats:['Hunting','Fishing'],fx:(L:any)=>[['sell',.03*L,null]],tx:(L:any)=>'+'+3*L+'% acorns from sales, members send +'+2*L+'% more to your pack'},
{id:'bar',n:'Barracks',d:'Members you send here train a little, even when idle. Members who are resting trickle at a quarter of that rate. Set members to Barracks in the Party tab.',mats:['Foraging','Woodcutting'],fx:(L:any):any[]=>[],tx:(L:any)=>BRATE(L).toLocaleString()+' xp per hour per member'}];
export function buCost(b:any,t:number){const i=BUI[t-1],it={};b.mats.forEach((sk:string)=>(it as any)[GN[sk][i][1]]=BUQ[t-1]);if(t>=3)(it as any)[ZN[i][4]]=Math.round(BUQ[t-1]/2);return{a:BUA[t-1],it}}
export function buOk(b:any){const L=buL(b.id);if(L>=5)return false;const c=buCost(b,L+1);return S.a>=c.a&&Object.keys(c.it).every(k=>(S.inv[k]||0)>=(c.it as any)[k])}
export function buUp(id:string){const b=BU.find(x=>x.id==id);if(!b||!buOk(b))return;const L=buL(id),c=buCost(b,L+1);S.a-=c.a;Object.keys(c.it).forEach(k=>S.inv[k]-=(c.it as any)[k]);S.bu[id]=L+1;X.refreshFx();say(b.n+' upgraded to tier '+(L+1)+'.')}
export function buFx(){const o:any[]=[];if(!S||!S.bu)return o;BU.forEach(b=>{const L=buL(b.id);if(!L)return;b.fx(L).forEach(e=>{if(e[2])e[2].forEach((sk:string)=>o.push({k:e[0],v:e[1],sk}));else o.push({k:e[0],v:e[1],sk:null})})});return o}
export function burrowView(){
  return '<h2>The Burrow</h2><p class="sub">Your home base. Spend acorns and gathered goods to upgrade it. Each tier asks for deeper goods than the last, so the top tiers wait on the gates.</p>'+BU.map(b=>{
    const L=buL(b.id),c=L<5?buCost(b,L+1):null;
    return '<div class="row" style="flex-direction:column;align-items:stretch"><span>'+b.n+' · tier '+L+' of 5<small>'+b.d+'</small></span><small>'+(L?'Now: '+b.tx(L):'Not built yet.')+(L<5?'<br>Next: '+b.tx(L+1)+'<br>Cost: '+c!.a.toLocaleString()+' acorns'+(S.a>=c!.a?' ✓':' ✗')+', '+Object.keys(c!.it).map(k=>(c!.it as any)[k]+' × '+k+' ('+(S.inv[k]||0)+')'+((S.inv[k]||0)>=(c!.it as any)[k]?' ✓':' ✗')).join(', '):'<br>Fully upgraded.')+'</small>'+(L<5?'<div style="margin-top:8px"><button class="btn" data-bu="'+b.id+'"'+(buOk(b)?'':' disabled')+'>'+(L?'Upgrade':'Build')+'</button></div>':'')+'</div>'}).join('');
}


Object.defineProperties(X,{CRS:{get:()=>CRS,configurable:true},sgView:{get:()=>sgView,configurable:true},buL:{get:()=>buL,configurable:true}});