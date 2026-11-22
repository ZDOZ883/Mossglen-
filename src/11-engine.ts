import { FXSRC, gameState, TASKS, TICKS, say } from './00-state';
import { X } from './registry';
import { MEMBERS, IT, GATHER_SKILLS, XT, asg, lv, maxhp, nsl, set_FXC, spFx } from './01-species-pets';
import { ENEMIES, RFN, gearFx, gearSync, itFx, qrank } from './02-gear-data';
import { exFinish, exs, hrFx } from './03-world-expeditions';
import { hits, hitsStr, set_hitsStr } from './04-loadout';
import { canEq, istat, reqText } from './05-combat';
import { ACHIEVEMENTS, CSK, DISH, mspd, set_who, slots, who } from './07-gear-ui';
import { mdur } from './08-party-state';
import { buFx, buL, sgFx, wxCheck, wxFx } from './09-seasons-burrow';
import { checkAch, dur, famShare, finish, memTick } from './10-achievements-log';
// Main tick loop and progress bars. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export function tick(dt:any,quiet:any){
  if(dt<=0)return;
  if(gameState.cur){gameState.p+=dt;const d=dur();let n=0;while(gameState.cur&&gameState.p>=d&&n<20000){gameState.p-=d;finish(quiet);n++}}
  for(const e of exs().slice()){e.p+=dt;if(e.p>=e.dur)exFinish(quiet,e)}
  TICKS.forEach(f=>f(dt,quiet));memTick(dt);clampXp();checkCapes();checkAch();wxCheck();gearSync();
}
export function bars(){
  const c=gameState.cur&&gameState.cur.k=='c'?ENEMIES.find(e=>e.id==gameState.cur.id):null;
  const b=document.getElementById('pb');
  if(b&&gameState.cur){
    if(c){const cur=gameState.ehid==c.id&&gameState.ehp!=null?Math.max(0,gameState.ehp):c.hp;b.style.width=Math.max(0,Math.min(100,cur/c.hp*100))+'%'}
    else b.style.width=Math.max(0,Math.min(100,gameState.p/dur()*100))+'%';
  }
  const ph=document.getElementById('ph');if(ph)ph.textContent=Math.max(0,Math.round(gameState.hp))+' / '+maxhp();
  if(c){
    const cur=gameState.ehid==c.id&&gameState.ehp!=null?Math.max(0,Math.ceil(gameState.ehp)):c.hp,rest=gameState.p<0,txt=rest?'recovering':cur+' / '+c.hp;
    const eh=document.getElementById('eh');if(eh)eh.textContent=txt;
    const ehb=document.getElementById('ehb');if(ehb)ehb.style.width=(rest?100:cur/c.hp*100)+'%';
    const se=document.getElementById('se');if(se)se.textContent=(rest?'recovering':cur+'/'+c.hp+' hp')+' · you '+Math.max(0,Math.round(gameState.hp))+'/'+maxhp();
  }
  const hl=document.getElementById('hits');
  if(hl){const t=hits.join('<br>')||(c?'Waiting for the first strike.':'');if(t!==hitsStr){set_hitsStr(t);hl.innerHTML=t}}
  const hb=document.getElementById('hp');if(hb)hb.style.width=Math.max(0,Math.min(100,gameState.hp/maxhp()*100))+'%';
  Object.keys(gameState.hired).forEach(k=>{const t=asg(k),e=document.getElementById('mp_'+k);if(e&&t.k!='war'&&t.k!='idle'&&t.k!='bar'&&t.k!='exp')e.style.width=Math.max(0,Math.min(100,(t.p||0)/mdur(k,t)*100))+'%'});
  exs().forEach((e,i)=>{const xb=document.getElementById('exb_'+i);if(xb)xb.style.width=Math.max(0,Math.min(100,e.p/e.dur*100))+'%'});
  const o=document.getElementById('ac');if(o)o.textContent='🌰 '+Math.floor(gameState.a).toLocaleString();
}
export function curName(){return gameState.cur?taskName(gameState.cur):null}
export const CAPN:Record<string,string>={Foraging:'Forager',Woodcutting:'Woodsman',Fishing:'Angler',Mining:'Delver',Hunting:'Trapper',Farming:'Gardener',Alchemy:'Alchemist',Cooking:'Cook',Smithing:'Smith',Fletching:'Fletcher',Enchanting:'Enchanter',Tailoring:'Tailor',Attack:'Duelist',Strength:'Brawler',Defense:'Warden',Vitality:'Survivor',Slayer:'Slayer',Leadership:'Commander'};
export const TNAME=['','Skill Cape','120 Cape','Sub-master Cape','Master Cape'];
export const CE:Record<string,any[][][]>={
Foraging:[[['yld',.15]],[['xp',.1]],[['spd',.1]],[['heal',.25]]],
Woodcutting:[[['yld',.15]],[['xp',.1]],[['spd',.1]],[['sell',.15]]],
Fishing:[[['yld',.15]],[['xp',.1]],[['spd',.1]],[['regen',.5]]],
Mining:[[['yld',.15]],[['xp',.1]],[['spd',.1]],[['taken',.08]]],
Hunting:[[['yld',.15]],[['xp',.1]],[['spd',.1]],[['drop',.15]]],
Cooking:[[['burn',.5]],[['xp',.1]],[['spd',.1]],[['heal',.25]]],
Smithing:[[['save',.15]],[['xp',.1]],[['spd',.1]],[['dmgm',.05]]],
Fletching:[[['save',.15]],[['xp',.1]],[['spd',.1]],[['acc',.05]]],
Enchanting:[[['save',.15]],[['xp',.1]],[['spd',.1]],[['xpm',.08]]],
Tailoring:[[['save',.15]],[['xp',.1]],[['spd',.1]],[['taken',.06]]],
Attack:[[['acc',.06]],[['xpm',.1]],[['crit',.08]],[['acc',.06]]],
Strength:[[['dmgm',.08]],[['xpm',.1]],[['lsteal',.05]],[['dmgm',.1]]],
Defense:[[['taken',.08]],[['xpm',.1]],[['ls',1]],[['taken',.08]]],
Vitality:[[['hpm',.1]],[['xpm',.1]],[['regen',.5]],[['hpm',.1],['heal',.15]]],
Slayer:[[['tdmg',.1]],[['pts',.25]],[['tdrop',.15]],[['tdmg',.15]]],
Farming:[[['yld',.15]],[['xp',.1]],[['spd',.1]],[['sell',.15]]],
Alchemy:[[['save',.15]],[['xp',.1]],[['spd',.1]],[['pot',.25]]],
Leadership:[[['mspd',.15]],[['pmult',.15]],[['mspd',.15]],[['pmult',.15],['mspd',.15]]]};
export const GRP:Record<string,string[]>={Combat:['Attack','Strength','Defense','Vitality'],Gathering:GATHER_SKILLS,Production:['Cooking','Smithing','Fletching','Enchanting','Tailoring'],Cultivation:['Farming','Alchemy']};
export const GE:Record<string,any[][][]>={
Combat:[[['xpm',.05],['taken',.04]],[['dmgm',.05],['acc',.04]],[['crit',.05],['regen',.25]],[['dmgm',.1],['taken',.1],['drop',.1]]],
Gathering:[[['yld',.1]],[['xp',.05]],[['spd',.05]],[['yld',.1],['sell',.1]]],
Production:[[['save',.1]],[['xp',.05]],[['spd',.05]],[['save',.1],['burn',.25],['sell',.1]]],
Cultivation:[[['yld',.1]],[['xp',.05]],[['spd',.05]],[['pot',.15],['sell',.1]]]};
GRP.Max=Object.keys(CE);GE.Max=[[['xp',.05],['xpm',.05]],[['yld',.05],['save',.05],['drop',.05]],[['spd',.05],['crit',.05]],[['xp',.1],['xpm',.1],['sell',.1],['mspd',.1]]];
export const gw=(g:string)=>g=='Max'?'skill':g.toLowerCase();
export const CTX=['yld','xp','spd','save','burn'];
export const pc=(v:number)=>Math.round(v*100);
export const FXT:Record<string,(v:number)=>string>={pot:(v:number)=>'+'+pc(v)+'% potion duration',yld:(v:number)=>pc(v)+'% chance of a double yield',xp:(v:number)=>'+'+pc(v)+'% xp',spd:(v:number)=>pc(v)+'% faster work',save:(v:number)=>pc(v)+'% chance to save materials',burn:(v:number)=>pc(v)+'% less burning',heal:(v:number)=>'+'+pc(v)+'% food healing',sell:(v:number)=>'+'+pc(v)+'% acorns from sales',drop:(v:number)=>'+'+pc(v)+'% rare drops',regen:(v:number)=>'+'+pc(v)+'% health regeneration',taken:(v:number)=>'−'+pc(v)+'% damage taken',acc:(v:number)=>'+'+pc(v)+'% hit chance',dmgm:(v:number)=>'+'+pc(v)+'% max hit',crit:(v:number)=>pc(v)+'% chance to hit twice as hard',lsteal:(v:number)=>'heal '+pc(v)+'% of damage dealt',ls:(v:number)=>'survive one lethal hit per fight',hpm:(v:number)=>'+'+pc(v)+'% max health',xpm:(v:number)=>'+'+pc(v)+'% combat xp',ttaken:(v:number)=>'−'+pc(v)+'% damage taken on task',txp:(v:number)=>'+'+pc(v)+'% Slayer xp',tdmg:(v:number)=>'+'+pc(v)+'% damage on Slayer tasks',tdrop:(v:number)=>'+'+pc(v)+'% rare drops on task',pts:(v:number)=>'+'+pc(v)+'% slayer points',mspd:(v:number)=>'+'+pc(v)+'% member work speed',pmult:(v:number)=>'+'+pc(v)+'% member perks'};
export const fxTxt=(arr:any)=>{const m:Record<string,any>={},o:any=[];arr.forEach((e:FxDef)=>{if(!(e[0] in m)){m[e[0]]=0;o.push(e[0])}m[e[0]]+=e[1]});return o.map((k:string)=>FXT[k](m[k])).join(', ')};
export const cumFx=(k:string,t:number)=>{let a:any[]=[];for(let i=0;i<t;i++)a=a.concat(CE[k][i]);return fxTxt(a)};
export const gcumFx=(g:string,t:number)=>{let a:any[]=[];for(let i=0;i<t;i++)a=a.concat(GE[g][i]);return fxTxt(a)};
export const capeTier=(k:string)=>{const x=gameState.xp[k],l=lv(x);return x>=2e8?4:x>=1.5e8?3:l>=120?2:l>=99?1:0};
export const grpTier=(g:string)=>Math.min.apply(null,GRP[g].map(capeTier));
export const capeName=(k:string,t:number)=>CAPN[k]+'’s '+TNAME[t];
export const grpName=(g:string,t:number)=>g+' '+(t==1?'Cape':TNAME[t]);
export const capeLabel=(id:string)=>id.indexOf('I:')==0?IT[id.slice(2)].n:id.indexOf('G:')==0?grpName(id.slice(2),grpTier(id.slice(2))):capeName(id,capeTier(id));
export const capeOk=(id:string)=>id.indexOf('I:')==0?(!!IT[id.slice(2)]&&!!gameState.own[id.slice(2)]):id.indexOf('G:')==0?grpTier(id.slice(2))>=1:capeTier(id)>=1;
export function capeFx(){
  const id=gameState.cape,out:any=[];if(!id)return out;
  if(id.indexOf('I:')==0)return itFx(IT[id.slice(2)]);
  const add=(arr:any,sk:string)=>arr.forEach((e:FxDef)=>out.push({k:e[0],v:e[1],sk:CTX.includes(e[0])?sk:null}));
  if(id.indexOf('G:')==0){const g=id.slice(2),t=grpTier(g);for(let i=0;i<t;i++){GRP[g].forEach((sk:string)=>add(CE[sk][i],sk));add(GE[g][i],'*');if(g=='Max')['Combat','Gathering','Production','Cultivation'].forEach(q=>add(GE[q][i],'*'))}}
  else{const t=capeTier(id);for(let i=0;i<t;i++)add(CE[id][i],id)}
  return out;
}
export function refreshFx(){if(gameState.cape&&!capeOk(gameState.cape))gameState.cape=null;set_FXC(capeFx().concat(hrFx(),buFx(),sgFx(),wxFx(),gearFx(),spFx(),...FXSRC.map(f=>f())))}
export function clampXp(){for(const k in gameState.xp)if(gameState.xp[k]>2e8)gameState.xp[k]=2e8}
export function checkCapes(){
  let ch=false;
  Object.keys(CE).forEach(k=>{const t=capeTier(k);if(t>(gameState.ct[k]||0)){gameState.ct[k]=t;say(capeName(k,t)+' unlocked! '+fxTxt(CE[k][t-1])+'. Wear it from the Gear tab.');if(!gameState.cape)gameState.cape=k;ch=true}});
  Object.keys(GRP).forEach(g=>{const t=grpTier(g);if(t>(gameState.cg[g]||0)){gameState.cg[g]=t;say(grpName(g,t)+' unlocked! It carries every '+gw(g)+' cape bonus, plus '+fxTxt(GE[g][t-1])+'.');ch=true}});
  if(ch)refreshFx();
}
export function capeRow(k:string){
  const t=capeTier(k),x=gameState.xp[k],th=[XT[99],XT[120],1.5e8,2e8];
  const nx=t<4?'Next: '+capeName(k,t+1)+' ('+fxTxt(CE[k][t])+') at '+(t<2?'level '+[99,120][t]:[150,200][t-2]+'M xp')+' · '+Math.ceil(th[t]-x).toLocaleString()+' xp to go':'Every cape tier earned.';
  return '<div class="row"><span>'+(t?capeName(k,t):'No cape yet')+(t?'<small>'+cumFx(k,t)+'</small>':'')+'<small>'+nx+'</small></span></div>';
}
export function capesView(){
  const wear=(id:string,t:number)=>t?(gameState.cape==id?'<span class="good">Worn</span>':'<button class="btn" data-cape="'+id+'">Wear</button>'):'';
  let h='<h2>Capes</h2><p class="sub">Wear one cape at a time. A skill cape unlocks at level 99, upgrades at level 120, then at 150M and 200M xp, adding a bonus each time. A group cape wears every bonus of its skills, plus extras, once all of them reach the same tier.</p>';
  h+='<div class="row"><span>Worn<small>'+(gameState.cape?capeLabel(gameState.cape):'No cape')+'</small></span>'+(gameState.cape?'<button class="btn" data-cape="">Remove</button>':'')+'</div>';
  h+=Object.keys(GRP).map(g=>{const t=grpTier(g),id='G:'+g;return '<div class="row'+(gameState.cape==id?' on':'')+'"><span>'+(t?grpName(g,t):g+' Cape')+'<small>'+(t?'Every '+gw(g)+' cape bonus, plus '+gcumFx(g,t):'Needs every '+(g=='Max'?'one of the 16':gw(g))+' skill at level 99')+'</small></span>'+wear(id,t)+'</div>'}).join('');
  h+=Object.keys(CE).map(k=>{const t=capeTier(k);return '<div class="row'+(gameState.cape==k?' on':'')+'"><span>'+(t?capeName(k,t):CAPN[k]+'’s Cape')+'<small>'+(t?cumFx(k,t):k+' level '+lv(gameState.xp[k])+' of 99')+'</small></span>'+wear(k,t)+'</div>'}).join('');
  const cl=Object.keys(gameState.own).filter(i=>IT[i]&&IT[i].slot=='cloak').sort((a,b)=>IT[a].tier-IT[b].tier||qrank(IT[a])-qrank(IT[b]));
  if(cl.length){h+='<h2>Crafted cloaks</h2>';h+=cl.map(i=>{const it=IT[i],id='I:'+i,ok=canEq(it);return '<div class="row'+(gameState.cape==id?' on':'')+'"><span>'+it.n+'<small>'+istat(it)+(ok?'':' · needs '+reqText(it))+'</small></span>'+(gameState.cape==id?'<span class="good">Worn</span>':ok?'<button class="btn" data-cape="'+id+'">Wear</button>':'')+'</div>'}).join('')}
  return h;
}
export const SKG=[['Gathering',['Foraging','Woodcutting','Fishing','Mining','Hunting']],['Artisan',['Cooking','Smithing','Fletching','Enchanting','Tailoring']],['Cultivation',['Farming','Alchemy']],['Specialist',['Slayer','Leadership']]];
export const skOf=(t:any)=>!t?null:t.k=='s'?(ACHIEVEMENTS.find(a=>a.id==t.id)||{}).sk:t.k=='k'?'Cooking':t.k=='f'?CSK(t.id):t.k=='r'?RFN[t.id].sk:TASKS[t.k]?TASKS[t.k].sk:null;
export const pcx=(k:string)=>{const l=lv(gameState.xp[k]);if(l>=120)return Math.max(0,Math.min(100,(gameState.xp[k]-XT[120])/(2e8-XT[120])*100));const lo=XT[l];return Math.max(0,Math.min(100,(gameState.xp[k]-lo)/(XT[l+1]-lo)*100))};
export const isOn=(k:string,id:string)=>{const t=who=='you'?gameState.cur:asg(who);return !!t&&t.k==k&&t.id==id};
export const crew=(k:string,id:string)=>{const n=Object.keys(gameState.hired).filter(m=>{const t=asg(m);return t.k==k&&t.id==id}).map(m=>MEMBERS[m].n.split(' ')[0]);return n.length?'<br>'+n.join(', ')+' working':''};
export const working=()=>Object.keys(gameState.hired).filter(k=>asg(k).k!='war'&&asg(k).k!='idle'&&asg(k).k!='exp');
export const hasWork=()=>exs().length>0||working().length>0||(buL('bar')>0&&Object.keys(gameState.hired).some(k=>asg(k).k=='idle'));
const ING:Record<string,string>=Object.fromEntries('Pick Picking,Dig Digging,Sniff Sniffing,Gather Gathering,Find Finding,Pluck Plucking,Reach Reaching,Cut Cutting,Harvest Harvesting,Gnaw Gnawing,Fell Felling,Hew Hewing,Claim Claiming,Catch Catching,Spear Spearing,Hook Hooking,Trap Trapping,Net Netting,Lure Luring,Land Landing,Collect Collecting,Chip Chipping,Pry Prying,Free Freeing,Mine Mining,Quarry Quarrying,Snare Snaring'.split(',').map(x=>x.split(' ')));
export const ing=(n:string)=>{const w=n.split(' ');return (ING[w[0]]||w[0])+(w.length>1?' '+w.slice(1).join(' '):'')};
export function taskName(c:any):string{return TASKS[c.k]?TASKS[c.k].name(c):c.k=='bar'?'Training in the barracks':c.k=='s'?ing(ACHIEVEMENTS.find(a=>a.id==c.id)!.n):c.k=='k'?'Cooking '+DISH[c.id].n:c.k=='f'?'Crafting '+IT[c.id].n:c.k=='r'?'Refining '+RFN[c.id].n:'Fighting '+ENEMIES.find(e=>e.id==c.id)!.n}
export const workNames=()=>{
  const g:Record<string,string[]>={};working().forEach(k=>{const t=taskName(asg(k));(g[t]=g[t]||[]).push(MEMBERS[k].n.split(' ')[0])});
  return Object.keys(g).map(t=>{const m=g[t],a=t.charAt(0).toLowerCase()+t.slice(1),who=m.length>1?m.slice(0,-1).join(', ')+' and '+m[m.length-1]:m[0];return who+(m.length==1?' is ':m.length==2?' are both ':' are all ')+a}).join('<br>')};
export function actorChips(){
  const hs=Object.keys(gameState.hired);if(!hs.length)return '';
  if(who!='you'&&!gameState.hired[who])set_who('you');
  return '<p class="mu" style="margin:6px 0 4px">Choose who works:</p><div class="chips">'+['you'].concat(hs).map(k=>'<button class="'+(who==k?'on':'')+'" data-who="'+k+'">'+(k=='you'?'You':MEMBERS[k].n)+'</button>').join('')+'</div>'+(who!='you'?'<p class="mu">'+MEMBERS[who].n+' works at '+Math.round(mspd(who)*100)+'% of your speed. About '+Math.round(famShare()*100)+'% of what they gather, cook or refine comes to your pack; their family keeps the rest. Pick an activity to assign, or pick it again to stop.</p>':'');
}
export function tile(k:string){
  const w:any[]=[];if(gameState.cur&&skOf(gameState.cur)==k)w.push('You');
  Object.keys(gameState.hired).forEach(m=>{if(skOf(asg(m))==k)w.push(MEMBERS[m].n.split(' ')[0])});
  const extra=k=='Leadership'?' · '+nsl()+'/'+slots()+' slots':'';
  return '<button class="row'+(w.length?' on':'')+'" data-skill="'+k+'"><span>'+k+'</span><small>Level '+lv(gameState.xp[k])+(capeTier(k)?' · '+TNAME[capeTier(k)]:'')+extra+(w.length?' · '+w.join(', '):'')+'</small><div class="bar xp" style="width:100%"><i style="width:'+pcx(k)+'%"></i></div></button>';
}

Object.defineProperties(X,{refreshFx:{get:()=>refreshFx,configurable:true},fxTxt:{get:()=>fxTxt,configurable:true},CTX:{get:()=>CTX,configurable:true},capeFx:{get:()=>capeFx,configurable:true},GRP:{get:()=>GRP,configurable:true},CE:{get:()=>CE,configurable:true},capeOk:{get:()=>capeOk,configurable:true},capeLabel:{get:()=>capeLabel,configurable:true},pcx:{get:()=>pcx,configurable:true},capesView:{get:()=>capesView,configurable:true},skOf:{get:()=>skOf,configurable:true},grpTier:{get:()=>grpTier,configurable:true},capeTier:{get:()=>capeTier,configurable:true},capeName:{get:()=>capeName,configurable:true},grpName:{get:()=>grpName,configurable:true}});