import { S } from './00-state';
import { X } from './registry';
import { CS, FOOD, H, HK, IT, LT, PETS, REQ, SK, SP, SPX, V, lv, nsl, spTxt } from './01-species-pets';
import { AF, KEEP, KP, RF, RFN, gateOk, refRecipe } from './02-gear-data';
import { GATE, exFmt, exView, gatesView, hrView, raidView } from './03-world-expeditions';
import { set_hitsStr } from './04-loadout';
import { combatView, istat } from './05-combat';
import { icon } from './06-icons';
import { A, CR, CSK, DISH, GL, LD, asg, bspd, burn, cl, gearView, mspd, power, recipe, skill, slayerView, slots, tab, toolRow, tt, who } from './07-gear-ui';
import { pm } from './08-party-state';
import { BRATE, buL, burrowView, wxView } from './09-seasons-burrow';
import { famShare, logView } from './10-achievements-log';
import { alchPage, farmPage, potStatus } from './12-farm-alchemy';
import { SKG, actorChips, bars, capeRow, cb, crew, curName, hasWork, isOn, pcx, tile, workNames } from './11-engine';
// Skills, party and top-level views. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export function skillsView(){
  if(skill)return skillPage(skill);
  return wxView()+SKG.map((g:any)=>'<h2>'+g[0]+'</h2><div class="pick">'+g[1].map(tile).join('')+'</div>').join('')+hrView()+gatesView();
}
export function skillPage(k:string){
  const body=SK.includes(k)?gatherPage(k):k=='Cooking'?cookPage():k=='Farming'?farmPage():k=='Alchemy'?alchPage():CR.includes(k)?craftPage(k):k=='Slayer'?slayerView():leadView();
  return '<p style="margin:0 0 4px"><button class="btn" data-back="1">← Skills</button></p><h2 style="margin-top:8px">'+k+' · level '+lv(S.xp[k])+'</h2><div class="bar xp"><i style="width:'+pcx(k)+'%"></i></div><p class="mu" style="margin:4px 0 0">'+Math.floor(S.xp[k]).toLocaleString()+' xp</p>'+body;
}
export function gatherPage(k:string){
  const chips=actorChips(),l=lv(S.xp[k]),sp=who=='you'?1:mspd(who);
  return wxView()+chips+toolRow(k)+A.filter(a=>a.sk==k).map(a=>{
    const gl=!gateOk(a.gate),lock=l<a.lv||gl,on=isOn('s',a.id),sec=Math.round(tt(a)/sp*10)/10;
    return '<button class="row'+(on?' on':'')+'" data-do="s:'+a.id+'"'+(lock?' disabled':'')+'><span>'+a.n+'<small>Yields '+a.item+' · in pack '+(S.inv[a.item]||0)+'</small></span><small>'+(lock?(gl?'Needs '+GATE[a.gate-1].n:'Needs level '+a.lv):sec+'s'+(who=='you'?' · '+a.xp+' xp':''))+crew('s',a.id)+'</small></button>';
  }).join('');
}
export function cookPage(){
  const l=lv(S.xp.Cooking);
  let h='<p class="sub">Meals heal far more than raw food, and each Cooking level adds 0.4% healing. Burning gets rarer as you outlevel a recipe.</p>'+actorChips();
  h+=Object.keys(DISH).sort((a,b)=>DISH[a].lv-DISH[b].lv).map(id=>{
    const d=DISH[id];if(l<GL[Math.max(0,GL.indexOf(d.lv)-1)])return '';
    const ok=l>=d.lv&&gateOk(d.gate),on=isOn('k',id);
    return '<button class="row'+(on?' on':'')+'" data-do="k:'+id+'"'+(ok?'':' disabled')+'><span>'+d.n+'<small>Heals '+d.heal+' · '+d.raw+' '+(S.inv[d.raw]||0)+'/'+d.q+(d.side?', '+d.side+' '+(S.inv[d.side]||0)+'/1':'')+' · in pack '+(S.inv[d.n]||0)+'</small></span><small>'+(ok?Math.round(burn(d)*100)+'% burn':(l>=d.lv?'Needs '+GATE[d.gate!-1].n:'Level '+d.lv))+crew('k',id)+'</small></button>';
  }).join('');
  return h;
}
export const CGN:Record<string,string>={w0:'Melee weapons',w1:'Ranged weapons',w2:'Magic weapons',x0:'Melee two-handers',x1:'Ranged two-handers',x2:'Magic two-handers',o0:'Melee off-hands',o1:'Ranged off-hands',o2:'Magic off-hands',y:'Shields',b:'Chest armor',h:'Helms',g:'Legs',r:'Rings',n:'Necklaces',c:'Cloaks'};
export const cgOf=(id:string)=>'wxo'.includes(id[0])?id.slice(0,2):id[0];
export const CF:Record<string,any>={g:{},f:{}};
export const famLab=(sl:string)=>AF[sl].map((f:Item)=>f.n.replace(/^(Band|Pendant|Cloak) of (the )?/,''));
export function craftPage(sk:string){
  const l=lv(S.xp[sk]);
  let h='<p class="sub">Turn gathered goods and zone materials into gear. A craft repeats until you run out; spares are sold as scrap.</p>'+actorChips();
  if(RF[sk]){const rl=Object.keys(RFN).filter(id=>RFN[id].sk==sk&&l>=REQ[RFN[id].t-1]);if(rl.length)h+='<h2>Refining</h2><p class="mu">Heavy components for the deepest gear. Slow, costly, and gated.</p>';rl.forEach(id=>{const f=RFN[id],r=refRecipe(id),gl=!gateOk(f.t-7),ok=l>=f.req&&!gl,on=isOn('r',id);h+='<button class="row'+(on?' on':'')+'" data-do="r:'+id+'"'+(ok?'':' disabled')+'><span>'+f.n+'<small>Refined component · in pack '+(S.inv[f.n]||0)+' · '+Object.keys(r).map(k=>k+' '+(S.inv[k]||0)+'/'+(r as any)[k]).join(', ')+'</small></span><small>'+(ok?'':gl?'Needs '+GATE[f.t-8].n:'Level '+f.req)+crew('r',id)+'</small></button>'})}
  const all=Object.keys(IT).filter(id=>id[0]!='t'&&!IT[id].q&&CSK(id)==sk),grs:any=[];all.forEach(id=>{const g=cgOf(id);if(!grs.includes(g))grs.push(g)});
  const cg=CF.g[sk]||grs[0],sl=cg=='r'?'ring':cg=='n'?'neck':cg=='c'?'cloak':null,cf=CF.f[sk]==null?'all':CF.f[sk];
  h+='<h2>Gear</h2><div class="chips">'+grs.map((g:string)=>'<button class="'+(cg==g?'on':'')+'" data-cf="g:'+g+'">'+CGN[g]+'</button>').join('')+'<button class="'+(cg=='all'?'on':'')+'" data-cf="g:all">All</button></div>';
  if(sl)h+='<div class="chips"><button class="'+(cf=='all'?'on':'')+'" data-cf="f:all">All types</button>'+famLab(sl).map((n:number,i:number)=>'<button class="'+(cf==i?'on':'')+'" data-cf="f:'+i+'">'+n+'</button>').join('')+'</div>';
  all.filter(id=>(cg=='all'||cgOf(id)==cg)&&(!sl||cf=='all'||IT[id].fam==cf)).sort((a,b)=>IT[a].tier-IT[b].tier||(IT[a].fam||0)-(IT[b].fam||0)).forEach(id=>{
    const it=IT[id];if(it.tier>0&&l<REQ[it.tier-1])return;
    const r=recipe(id),gl=it.tier>=8&&!gateOk(it.tier-7),ok=l>=it.req&&!gl,on=isOn('f',id);
    h+='<button class="row'+(on?' on':'')+'" data-do="f:'+id+'"'+(ok?'':' disabled')+'><span>'+it.n+(S.own[id]?' ✓':'')+'<small>'+istat(it)+' · '+Object.keys(r).map(k=>k+' '+(S.inv[k]||0)+'/'+(r as any)[k]).join(', ')+'</small></span><small>'+(ok?'':gl?'Needs '+GATE[it.tier-8].n:'Level '+it.req)+crew('f',id)+'</small></button>';
  });
  return h;
}
export function leadView(){
  const l=LD(),n=nsl(),nx=LT.find(t=>t>l),nu=HK.find(k=>H[k].lt==nx);
  return '<p class="sub">Leadership grows when party members work or fight beside you. It opens party slots and speeds up everyone you lead.</p>'+
  '<div class="row"><span>Party slots<small>'+n+' of '+slots()+' used'+(nx?' · next slot at level '+nx+(nu?' ('+H[nu].n+')':''):'')+'</small></span></div>'+
  '<div class="row"><span>Member work speed<small>Rises about 0.75% per level, to full speed at 99</small></span><b>'+Math.round(bspd()*100)+'%</b></div>'+
  '<div class="row"><span>Share to your pack<small>Working members send about a third of what they make to you, rising to half by level 99. Their families keep the rest.</small></span><b>'+Math.round(famShare()*100)+'%</b></div>'+
  '<div class="row"><span>Fast ways to train<small>Turn on Command in Fight with members beside you, or keep members busy on skills.</small></span></div>'+
  '<p><button class="btn" data-tab="party">Manage party</button></p>';
}
export const PKN:Record<string,string[]>={acc:['+','% hit chance'],hp:['+','% max health'],dmg:['+','% damage'],taken:['−','% damage taken'],heal:['heals ','% hp per kill'],speed:['expeditions ','% faster'],loot:['+','% expedition loot'],succ:['+','% expedition odds']};
export function perkTxt(k:string){return Object.keys(H[k].pk).map(n=>{const v=H[k].pk[n]*(1+(cl(k)-1)*.02)*pm()*(H[k].pet?1.25:1),x=n=='succ'?Math.round(v):Math.round(v*100);return PKN[n][0]+x+PKN[n][1]}).join(', ')}
export function memName(k:string){const t=asg(k);return t.k=='exp'?'On expedition · back in '+exFmt(S.ex?S.ex.dur-S.ex.p:0):t.k=='war'?'Fighting beside you':t.k=='bar'?'Training in the barracks · '+BRATE(buL('bar')).toLocaleString()+' xp/h':t.k=='s'?'Gathering: '+A.find(a=>a.id==t.id).n:t.k=='k'?'Cooking: '+DISH[t.id!].n:t.k=='f'?'Crafting: '+IT[t.id!].n:t.k=='r'?'Refining: '+RFN[t.id!].n:'Resting. Send them to work from a skill page.'}
export function partyView(){
  const hs=Object.keys(S.hired),l=LD(),sl=slots();
  let h='<h2>Your party</h2><p class="sub">Leadership '+l+' · '+nsl()+' of '+sl+' slots · members work at '+Math.round(bspd()*100)+'% of your speed. Raise Leadership for more slots and faster work.</p>';
  h+='<p>Party power: <b>'+power()+'</b> <span class="mu" style="display:inline">(half your total levels, plus members fighting with you)</span></p>';
  if(!hs.length)h+='<p class="mu">No one has joined yet. Recruit your first member below.</p>';
  h+=hs.map(k=>{
    const m=H[k],t=asg(k),work=t.k!='war'&&t.k!='idle'&&t.k!='bar'&&t.k!='exp';
    return '<div class="row" style="flex-direction:column;align-items:stretch"><span>'+m.n+' · level '+cl(k)+(k==S.lead?' · lead':'')+'<small>'+m.role+' · '+m.st+' · '+perkTxt(k)+'</small></span><small>'+memName(k)+(work?' · '+Math.round(mspd(k)*100)+'% speed · '+Math.round(famShare()*100)+'% to your pack · family stash '+(S.fam[k]||0):'')+'</small>'+(work?'<div class="bar"><i id="mp_'+k+'"></i></div>':'')+(t.k=='exp'?'':'<div class="chips" style="margin:8px 0 0"><button class="'+(t.k=='war'?'on':'')+'" data-assign="'+k+':war">Fight with me</button><button class="'+(t.k=='idle'?'on':'')+'" data-assign="'+k+':idle">Rest</button>'+(buL('bar')?'<button class="'+(t.k=='bar'?'on':'')+'" data-assign="'+k+':bar">Barracks</button>':'')+'<button class="'+(S.lead==k?'on':'')+'" data-lead="'+k+'">Lead</button><button data-dismiss="'+k+'">Dismiss</button></div>')+'</div>';
  }).join('');
  if(hs.length)h+='<p class="mu">To put a member to work, open a skill and choose them under “Choose who works”. Members keep their level if dismissed. Combat perks apply only while fighting beside you. Speed, loot and odds perks apply on expeditions.</p>';
  const rec=HK.filter(k=>!S.hired[k]);
  h+='<h2>Recruit</h2>'+(rec.length?rec.map(k=>{
    const m=H[k],unl=l>=m.lt,full=nsl()>=sl;
    return '<div class="row"><span>'+m.n+'<small>'+m.role+' · '+m.st+' · '+(unl?m.d:'Unlocks at Leadership '+m.lt)+'</small></span>'+(unl?'<button class="btn" data-hire="'+k+'"'+(S.a<m.c||full?' disabled':'')+'>'+m.c+'</button>':'<small>Level '+m.lt+'</small>')+'</div>';
  }).join('')+(nsl()>=sl?'<p class="mu">Your slots are full. Leadership levels 10, 25, 40, 55 and 70 each open another.</p>':''):'<p class="mu">Everyone in the valley has joined.</p>');
  const pr=Object.keys(S.pets).filter(k=>!S.hired[k]);
  if(pr.length)h+='<h2>Pets at home</h2>'+pr.map(k=>'<div class="row"><span>'+H[k].n+'<small>Pet · '+H[k].st+' · '+perkTxt(k)+'</small></span><button class="btn" data-hire="'+k+'"'+(nsl()>=sl?' disabled':'')+'>Call back</button></div>').join('');
  h+='<h2>Pet collection <span class="mu" style="display:inline">· '+Object.keys(S.pets).length+'/'+PETS.length+'</span></h2><p class="mu">Extremely rare drops, found only once each, modelled on RuneScape: skill pets roll about 1 in 100,000 per action (slightly better at higher levels, 15× better at 200M xp), boss pets 1 in 1,000 to 1 in 5,000 per boss kill, raid pets 1 in 80 to 1 in 150 per clear. Skill pets can drop while you or a member trains that skill. Boss pets drop from zone bosses. Raid pets drop when you clear a raid. Pets take a party slot like any member, but fight and work better than the members you can recruit.</p><p class="mu">'+PETS.map(q=>S.pets[q[0]]?'<b>'+q[1]+'</b>':'???').join(' · ')+'</p>';
  return h;
}
export let logSub='log';
export function set_logSub(v:string){logSub=v}
export const logTabs=()=>'<div class="seg">'+[['log','Collection'],['guide','Guide']].map(t=>'<button data-logsub="'+t[0]+'" class="'+(logSub==t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
const dens=(t:string,b:string)=>'<details class="chip"><summary><span>'+t+'</span><em>open</em></summary><div class="mu">'+b+'</div></details>';
export function guideView(){
  const capes=Object.keys(X.CE).map(k=>capeRow(k).replace('<div class="row"><span>','<div class="row"><span><b>'+k+'</b> · ')).join('');
  const rates='<b>Zone gear</b>: about 1 in 64 per kill, or 1 in 10 from a boss. A guaranteed drop arrives after 150 kills (40 for bosses).<br><b>Deep zones (8+)</b>: crafting materials about 1 in 40 per kill, 1 in 6 from a boss, guaranteed by 100 kills (18 for bosses). Bosses also have a 1 in 30 chance at gear, guaranteed by 70 kills.<br><b>Trinkets</b>: about 1 in 12 per boss kill, guaranteed by 60.<br>These are base chances. Rare-drop bonuses from gear, pets and blessings multiply them.';
  return '<h2>Guide</h2><p class="sub">Reference notes, kept out of the way.</p>'+dens(S.sp+' traits','+15% xp in '+SP[S.sp!]+'. '+spTxt(S.sp))+dens('Capes','<div style="margin-top:6px">'+capes+'</div>')+dens('Drop rates',rates);
}
export function view(){
  if(tab=='burrow')return burrowView();
  if(tab=='log')return logTabs()+(logSub=='guide'?guideView():logView());
  if(tab=='skills')return skillsView();
  if(tab=='combat')return combatView();
  if(tab=='gear')return gearView();
  if(tab=='party')return partyView();
  if(tab=='delve')return '<h2>Expeditions</h2>'+exView()+raidView();
  const items=Object.keys(S.inv).filter(k=>S.inv[k]>0),tot=Math.round(items.reduce((s,k)=>s+(KEEP(k)?0:S.inv[k]*V[k]),0)*(1+cb('sell')));
  return '<h2>Pack</h2><p class="sub">Crafting uses gathered goods and zone materials, so sell selectively.</p>'+(items.length?items.map(k=>'<div class="row"><span>'+k+'<small>'+V[k]+' acorns each'+(FOOD[k]?' · heals '+FOOD[k]:KP[k]?' · keepsake':'')+'</small></span><b>×'+S.inv[k]+'</b>'+(KEEP(k)?'':'<button class="btn" data-sellone="'+k+'">Sell</button>')+'</div>').join('')+'<p><button class="btn" data-sell="1">Sell all but food and keepsakes for '+tot+' acorns</button></p>':'<p class="sub">Your pack is empty. Gather something first.</p>');
}
export function render(){
  set_hitsStr(null);
  const app=document.getElementById('app');
  if(!S.sp){
    app!.innerHTML='<div class="hero"><span class="leaf">🍃</span><h1>Mossglen</h1></div><p class="sub" style="text-align:center">A quiet valley where small folk work, explore, and nap. Who are you?</p><div class="pick">'+
    Object.keys(SP).map(s=>'<button class="row" data-sp="'+s+'">'+s+'<small>+15% '+SP[s]+' xp</small><small>'+SPX[s].t+'</small><small>'+SPX[s].w+' '+SPX[s].st+' style +4% damage.</small></button>').join('')+'</div>';return;
  }
  const cn=curName();
  app!.innerHTML='<div class="top"><h1>Mossglen</h1><span class="acorn" id="ac"></span></div><p class="sub">'+S.sp+' of the valley · total level '+SK.concat(CS).reduce((s,k)=>s+lv(S.xp[k]),0)+'</p>'+
  '<div class="stat sans"><div class="mu now">You are currently</div>'+(cn?'<div style="display:flex;justify-content:space-between"><span>'+cn+(S.cur.k=='c'?' <small class="mu" id="se"></small>':'')+'</span><button class="btn" data-stop="1">Rest</button></div><div class="bar'+(S.cur.k=='c'?' hp':'')+'"><i id="pb"></i></div>':'<span class="mu">Resting. Choose an activity below to begin.</span>')+potStatus()+(hasWork()?'<div class="mu" style="font-size:14px;margin-top:4px">'+workNames()+'</div>':'')+'</div>'+
  '<nav>'+[['skills','Skills','leaf'],['combat','Fight','swords'],['gear','Gear','shield'],['party','Party','paw'],['delve','Explore','lantern'],['burrow','Burrow','burrow'],['log','Log','tome'],['pack','Pack','satchel']].map(t=>'<button data-tab="'+t[0]+'" class="'+(tab==t[0]?'on':'')+'"><i>'+icon(t[2],25)+'</i>'+t[1]+'</button>').join('')+'</nav>'+
  view()+'<div id="log">'+S.log.map((l:number)=>'<p>'+l+'</p>').join('')+'</div>'+
  '<p class="mu" style="margin-top:24px"><button class="btn" data-reset="1" style="font-size:14px">Start over</button></p>';
  bars();
}

Object.defineProperties(X,{render:{get:()=>render,configurable:true}});
