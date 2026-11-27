import { gameState, say, TASKS } from './00-state';
import { X } from './registry';
import { COMBAT_SKILLS, DISHES, FOOD, GL, MEMBERS, HK, IT, LD, LT, PETS, PB, REQ, GATHER_SKILLS, SP, SPX, SELL_VALUE, asg, cb, cl, lv, KITSIG, kit, kitNext, kitTier, mst, nsl, pm, roster, known, spTxt, sicOn } from './01-species-pets';
import { sicBuff } from './08-party-state';
import { OUTFIT_SK, OUT_TIERS, outPerkTxt } from './02-outfits';
import { AF, BWEAPONS, CE, KEEPX, ZN, dropTier, uniqLine, KEEP, KP, PRE, RF, RFN, gateOk, refRecipe } from './02-gear-data';
import { GATE, RD, exFmt, exOf, exView, gatesView, hrView, raidView } from './03-world-expeditions';
import { set_hitsStr } from './04-loadout';
import { combatView, istat } from './05-combat';
import { icon } from './06-icons';
import { ACHIEVEMENTS, CR, CSK, DISH, bspd, burn, gearView, mentor, mspd, power, recipe, skill, slayerView, slots, tab, toolRow, tt, who } from './07-gear-ui';

import { BRATE, buL, burrowView, wxView } from './09-seasons-burrow';
import { famShare, logView } from './10-achievements-log';
import { alchPage, farmPage, potStatus } from './12-farm-alchemy';
import { SKG, actorChips, bars, capeRow, crew, curName, hasWork, isOn, pcx, tile, workNames } from './11-engine';
// Skills, party and top-level views. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export function skillsView(){
  if(skill)return skillPage(skill);
  return wxView()+SKG.map((g:any)=>'<h2>'+g[0]+'</h2><div class="pick">'+g[1].map(tile).join('')+'</div>').join('')+hrView()+gatesView();
}
export function skillPage(k:string){
  const body=GATHER_SKILLS.includes(k)?gatherPage(k):k=='Cooking'?cookPage():k=='Farming'?farmPage():k=='Alchemy'?alchPage():CR.includes(k)?craftPage(k):k=='Slayer'?slayerView():leadView();
  return '<p style="margin:0 0 4px"><button class="btn" data-back="1">← Skills</button></p><h2 style="margin-top:8px">'+k+' · level '+lv(gameState.xp[k])+'</h2><div class="bar xp"><i style="width:'+pcx(k)+'%"></i></div><p class="mu" style="margin:4px 0 0">'+Math.floor(gameState.xp[k]).toLocaleString()+' xp</p>'+body;
}
export function gatherPage(k:string){
  const chips=actorChips(),l=lv(gameState.xp[k]),sp=who=='you'?1:mspd(who);
  return wxView()+chips+toolRow(k)+ACHIEVEMENTS.filter(a=>a.sk==k).map(a=>{
    const gl=!gateOk(a.gate),lock=l<a.lv||gl,on=isOn('s',a.id),sec=Math.round(tt(a)/sp*10)/10;
    return '<button class="row'+(on?' on':'')+'" data-do="s:'+a.id+'"'+(lock?' disabled':'')+'><span>'+a.n+'<small>Yields '+a.item+' · in pack '+(gameState.inv[a.item]||0)+'</small></span><small>'+(lock?(gl?'Needs '+GATE[a.gate-1].n:'Needs level '+a.lv):sec+'s'+(who=='you'?' · '+a.xp+' xp':''))+crew('s',a.id)+'</small></button>';
  }).join('');
}
export function cookPage(){
  const l=lv(gameState.xp.Cooking);
  let h='<p class="sub">Meals heal far more than raw food, and each Cooking level adds 0.4% healing. Burning gets rarer as you outlevel a recipe.</p>'+actorChips();
  h+=Object.keys(DISH).sort((a,b)=>DISH[a].lv-DISH[b].lv).map(id=>{
    const d=DISH[id];if(l<GL[Math.max(0,GL.indexOf(d.lv)-1)])return '';
    const ok=l>=d.lv&&gateOk(d.gate),on=isOn('k',id);
    return '<button class="row'+(on?' on':'')+'" data-do="k:'+id+'"'+(ok?'':' disabled')+'><span>'+d.n+'<small>Heals '+d.heal+' · '+d.raw+' '+(gameState.inv[d.raw]||0)+'/'+d.q+(d.side?', '+d.side+' '+(gameState.inv[d.side]||0)+'/1':'')+' · in pack '+(gameState.inv[d.n]||0)+'</small></span><small>'+(ok?Math.round(burn(d)*100)+'% burn':(l>=d.lv?'Needs '+GATE[d.gate!-1].n:'Level '+d.lv))+crew('k',id)+'</small></button>';
  }).join('');
  return h;
}
export const CGN:Record<string,string>={w0:'Melee weapons',w1:'Ranged weapons',w2:'Magic weapons',x0:'Melee two-handers',x1:'Ranged two-handers',x2:'Magic two-handers',o0:'Melee off-hands',o1:'Ranged off-hands',o2:'Magic off-hands',y:'Shields',b:'Chest armor',h:'Helms',g:'Legs',r:'Rings',n:'Necklaces',c:'Cloaks'};
export const cgOf=(id:string)=>'wxo'.includes(id[0])?id.slice(0,2):id[0];
export const CF:Record<string,any>={g:{},f:{}};
export const famLab=(sl:string)=>AF[sl].map((f:Item)=>f.n.replace(/^(Band|Pendant|Cloak) of (the )?/,''));
export function craftPage(sk:string){
  const l=lv(gameState.xp[sk]);
  let h='<p class="sub">Turn gathered goods and zone materials into gear. A craft repeats until you run out; spares are sold as scrap.</p>'+actorChips();
  if(RF[sk]){const rl=Object.keys(RFN).filter(id=>RFN[id].sk==sk&&l>=REQ[RFN[id].t-1]);if(rl.length)h+='<h2>Refining</h2><p class="mu">Heavy components for the deepest gear. Slow, costly, and gated.</p>';rl.forEach(id=>{const f=RFN[id],r=refRecipe(id),gl=!gateOk(f.t-7),ok=l>=f.req&&!gl,on=isOn('r',id);h+='<button class="row'+(on?' on':'')+'" data-do="r:'+id+'"'+(ok?'':' disabled')+'><span>'+f.n+'<small>Refined component · in pack '+(gameState.inv[f.n]||0)+' · '+Object.keys(r).map(k=>k+' '+(gameState.inv[k]||0)+'/'+(r as any)[k]).join(', ')+'</small></span><small>'+(ok?'':gl?'Needs '+GATE[f.t-8].n:'Level '+f.req)+crew('r',id)+'</small></button>'})}
  const all=Object.keys(IT).filter(id=>id[0]!='t'&&!IT[id].q&&CSK(id)==sk),grs:any=[];all.forEach(id=>{const g=cgOf(id);if(!grs.includes(g))grs.push(g)});
  const cg=CF.g[sk]||grs[0],sl=cg=='r'?'ring':cg=='n'?'neck':cg=='c'?'cloak':null,cf=CF.f[sk]==null?'all':CF.f[sk];
  h+='<h2>Gear</h2><div class="chips">'+grs.map((g:string)=>'<button class="'+(cg==g?'on':'')+'" data-cf="g:'+g+'">'+CGN[g]+'</button>').join('')+'<button class="'+(cg=='all'?'on':'')+'" data-cf="g:all">All</button></div>';
  if(sl)h+='<div class="chips"><button class="'+(cf=='all'?'on':'')+'" data-cf="f:all">All types</button>'+famLab(sl).map((n:number,i:number)=>'<button class="'+(cf==i?'on':'')+'" data-cf="f:'+i+'">'+n+'</button>').join('')+'</div>';
  all.filter(id=>(cg=='all'||cgOf(id)==cg)&&(!sl||cf=='all'||IT[id].fam==cf)).sort((a,b)=>IT[a].tier-IT[b].tier||(IT[a].fam||0)-(IT[b].fam||0)).forEach(id=>{
    const it=IT[id];if(it.tier>0&&l<REQ[it.tier-1])return;
    const r=recipe(id),gl=it.tier>=8&&!gateOk(it.tier-7),ok=l>=it.req&&!gl,on=isOn('f',id);
    h+='<button class="row'+(on?' on':'')+'" data-do="f:'+id+'"'+(ok?'':' disabled')+'><span>'+it.n+(gameState.own[id]?' ✓':'')+'<small>'+istat(it)+' · '+Object.keys(r).map(k=>k+' '+(gameState.inv[k]||0)+'/'+(r as any)[k]).join(', ')+'</small></span><small>'+(ok?'':gl?'Needs '+GATE[it.tier-8].n:'Level '+it.req)+crew('f',id)+'</small></button>';
  });
  return h;
}
export function leadView(){
  const l=LD(),n=nsl(),nx=LT.find(t=>t>l),nu=HK.find(k=>MEMBERS[k].lt==nx);
  return '<p class="sub">Leadership grows when party members work or fight beside you. It opens party slots and speeds up everyone you lead.</p>'+
  '<div class="row"><span>Party slots<small>'+n+' of '+slots()+' used'+(nx?' · next slot at level '+nx+(nu?' ('+MEMBERS[nu].n+')':''):'')+'</small></span></div>'+
  '<div class="row"><span>Member work speed<small>Rises about 0.75% per level, to full speed at 99</small></span><b>'+Math.round(bspd()*100)+'%</b></div>'+
  '<div class="row"><span>Share to your pack<small>Working members send about a third of what they make to you, rising to half by level 99. Their families keep the rest.</small></span><b>'+Math.round(famShare()*100)+'%</b></div>'+
  '<div class="row"><span>Fast ways to train<small>Turn on Command in Fight with members beside you, or keep members busy on skills.</small></span></div>'+
  '<p><button class="btn" data-tab="party">Manage party</button></p>';
}
export const PKN:Record<string,string[]>={acc:['+','% hit chance'],hp:['+','% max health'],dmg:['+','% damage'],taken:['−','% damage taken'],heal:['heals ','% hp per kill'],speed:['expeditions ','% faster'],loot:['+','% expedition loot'],succ:['+','% expedition odds']};
export function perkTxt(k:string){return Object.keys(MEMBERS[k].pk).map(n=>{const v=MEMBERS[k].pk[n]*(1+(cl(k)-1)*.02)*pm()*(MEMBERS[k].pet?1.25:1),x=n=='succ'?Math.round(v):Math.round(v*100);return PKN[n][0]+x+PKN[n][1]}).join(', ')}
export const kitRow=(k:string)=>{
  const t=kitTier(k),n=kitNext(k);
  return '<div class="chips" style="margin:8px 0 0"><small style="align-self:center">Kit: '+(t?PRE[t]+' (tier '+t+', +'+t+'% to perks and damage)':'none')+'</small>'+(KITSIG[k]?'<small class="mu" style="align-self:center">'+(t>=10?'Signature perks unlocked: ':t>=5?'First signature perk unlocked (second at tier 10): ':'Signature perks at tiers 5 and 10: ')+KITSIG[k][2]+'.</small>':'')+(n?'<button data-kit="'+k+'"'+(gameState.a<n.cost||cl(k)<n.req?' disabled':'')+'>Outfit '+PRE[n.t]+' · '+n.cost.toLocaleString()+(cl(k)<n.req?' · needs level '+n.req:'')+'</button>':'')+'</div>';
};
export const statTxt=(k:string)=>{const s=mst(k);return 'Attack '+s.a+' · Defense '+s.d+' · Vitality '+s.v+(kit(k)>0?' · kit +'+(Math.round(kit(k)*1000)/10)+'%':'')};
export function memName(k:string){const t=asg(k);return t.k=='exp'?'On expedition · back in '+exFmt(exOf(k)?exOf(k)!.dur-exOf(k)!.p:0):t.k=='war'?'Fighting beside you':t.k=='bar'?'Training in the barracks · '+Math.round(BRATE(buL('bar'))*mentor()).toLocaleString()+' xp/h':t.k=='s'?'Gathering: '+ACHIEVEMENTS.find(a=>a.id==t.id).n:t.k=='k'?'Cooking: '+DISH[t.id!].n:t.k=='f'?'Crafting: '+IT[t.id!].n:t.k=='r'?'Refining: '+RFN[t.id!].n:TASKS[t.k]&&TASKS[t.k].mname?TASKS[t.k].mname!(t):'Resting. Send them to work from a skill page.'}
export function partyView(){
  const hs=Object.keys(gameState.hired),l=LD(),sl=slots();
  let h='<h2>Your party</h2><p class="sub">Leadership '+l+' · '+nsl()+' of '+sl+' slots · members work at '+Math.round(bspd()*100)+'% of your speed. Raise Leadership for more slots and faster work.</p>';
  h+='<p>Party power: <b>'+power()+'</b> <span class="mu" style="display:inline">(half your total levels, plus members fighting with you)</span></p>';
  {const sk=gameState.sic&&sicOn()?sicBuff(gameState.sic):null;h+='<p class="mu">'+(sk?'<b>Second in command: '+MEMBERS[gameState.sic!].n+'</b> · '+sk.n+': '+sk.d+(sk.s>1?' (scaled by level)':'')+'.':'Name a fighting recruit second in command for a party buff.')+'</p>'}
  if(roster().length>1)h+='<div class="chips"><small style="align-self:center">Auto-fill the party:</small><button data-auto="stats">Best stats</button><button data-auto="level">Highest level</button></div><p class="mu">Seats the strongest recruits and pets in your open slots. Specialists and anyone on an expedition stay put.</p>';
  if(!roster().length)h+='<p class="mu">No one has joined yet. Recruit your first member below.</p>';
  h+=hs.map(k=>{
    const m=MEMBERS[k],t=asg(k),work=t.k!='war'&&t.k!='idle'&&t.k!='bar'&&t.k!='exp';
    return '<div class="row" style="flex-direction:column;align-items:stretch"><span>'+m.n+' · level '+cl(k)+(k==gameState.lead?' · lead':'')+(gameState.sic==k?' · second in command':'')+'<small>'+m.role+' · '+m.st+' · '+perkTxt(k)+'</small>'+petTag(k)+'<small>'+statTxt(k)+'</small></span><small>'+memName(k)+(work?' · '+Math.round(mspd(k)*100)+'% speed · '+Math.round(famShare()*100)+'% to your pack · family stash '+(gameState.fam[k]||0):'')+'</small>'+(work?'<div class="bar"><i id="mp_'+k+'"></i></div>':'')+kitRow(k)+(t.k=='exp'?'':'<div class="chips" style="margin:8px 0 0"><button class="'+(t.k=='war'?'on':'')+'" data-assign="'+k+':war">Fight with me</button><button class="'+(t.k=='idle'?'on':'')+'" data-assign="'+k+':idle">Rest</button>'+(buL('bar')?'<button class="'+(t.k=='bar'?'on':'')+'" data-assign="'+k+':bar">Barracks</button>':'')+'<button class="'+(gameState.lead==k?'on':'')+'" data-lead="'+k+'">Lead</button>'+(sicBuff(k)&&t.k=='war'?'<button class="'+(gameState.sic==k?'on':'')+'" data-sic="'+k+'">2nd in command</button>':'')+'<button data-dismiss="'+k+'">Bench</button></div>')+'</div>';
  }).join('');
  if(hs.length)h+='<p class="mu">To put a member to work, open a skill and choose them under “Choose who works”. Benched members stay on your roster, keep their level and can train in the barracks. Combat perks apply only while fighting beside you. Speed, loot and odds perks apply on expeditions.</p>';
  const bs=Object.keys(gameState.bench);
  if(bs.length){
    h+='<h2>Resting at home <span class="mu" style="display:inline">· '+bs.length+' on your roster, not in the party</span></h2><p class="mu">Benched members do no work and fight nothing, but they keep their level and can train in the barracks. Open a slot or swap one of your party to bring them back.</p>';
    h+=bs.map(k=>{
      const m=MEMBERS[k],t=asg(k),free=nsl()<sl,sw=Object.keys(gameState.hired).filter(a=>asg(a).k!='exp');
      return '<div class="row" style="flex-direction:column;align-items:stretch"><span>'+m.n+' · level '+cl(k)+'<small>'+m.role+' · '+m.st+' · '+perkTxt(k)+'</small>'+petTag(k)+'</span><small>'+memName(k)+'</small>'+kitRow(k)+(t.k=='exp'?'':'<div class="chips" style="margin:8px 0 0"><button class="'+(t.k!='bar'?'on':'')+'" data-assign="'+k+':idle">Rest</button>'+(buL('bar')?'<button class="'+(t.k=='bar'?'on':'')+'" data-assign="'+k+':bar">Barracks</button>':'')+(free?'<button data-call="'+k+'">Join party</button>':'')+'</div>'+(free?'':'<small style="margin-top:8px">Swap in for:</small><div class="chips" style="margin:4px 0 0">'+sw.map(a=>'<button data-call="'+k+':'+a+'">'+MEMBERS[a].n.split(' ')[0]+'</button>').join('')+'</div>'))+'</div>';
    }).join('');
  }
  const rec=HK.filter(k=>!known(k));
  h+='<h2>Recruit</h2>'+(rec.length?rec.map(k=>{
    const m=MEMBERS[k],unl=l>=m.lt;
    return '<div class="row"><span>'+m.n+'<small>'+m.role+' · '+m.st+' · '+(unl?m.d:'Unlocks at Leadership '+m.lt)+'</small></span>'+(unl?'<button class="btn" data-hire="'+k+'"'+(gameState.a<m.c?' disabled':'')+'>'+m.c+'</button>':'<small>Level '+m.lt+'</small>')+'</div>';
  }).join('')+(nsl()>=sl?'<p class="mu">Your party is full, so new recruits rest at home on your roster until you swap them in. Leadership levels 10, 25, 40, 55, 70, 85, 100 and 115 each open another slot.</p>':''):'<p class="mu">Everyone in the valley has joined.</p>');
  const pr=Object.keys(gameState.pets).filter(k=>!known(k));
  if(pr.length)h+='<h2>Pets at home</h2>'+pr.map(k=>'<div class="row"><span>'+MEMBERS[k].n+'<small>Pet · '+MEMBERS[k].st+' · '+perkTxt(k)+'</small>'+petTag(k)+'</span><button class="btn" data-hire="'+k+'"'+'>Call back</button></div>').join('');
  h+='<h2>Pet collection <span class="mu" style="display:inline">· '+Object.keys(gameState.pets).length+'/'+PETS.length+'</span></h2><p class="mu">Extremely rare drops, found only once each, modelled on RuneScape: skill pets roll about 1 in 100,000 per action (slightly better at higher levels, 15× better at 200M xp), boss pets 1 in 1,000 to 1 in 5,000 per boss kill, raid pets 1 in 80 to 1 in 150 per clear. Skill pets can drop while you or a member trains that skill. Boss pets drop from zone bosses. Raid pets drop when you clear a raid. Pets take a party slot like any member, or rest on your roster, but fight and work better than the members you can recruit.</p><p class="mu">'+PETS.map(q=>gameState.pets[q[0]]?'<b>'+q[1]+'</b>':'???').join(' · ')+'</p>';
  return h;
}
export let logSub='log';
export function set_logSub(v:string){logSub=v}
export const repCard=()=>{
  const r=gameState.rep;if(!r)return '';
  const bits:string[]=[];
  if(r.a)bits.push((r.a>0?'+':'')+r.a.toLocaleString()+' acorns');
  r.xp.forEach((x:any)=>bits.push('+'+x[1].toLocaleString()+' '+x[0]+' xp'));
  if(r.items>0)bits.push(r.items.toLocaleString()+' items gathered');
  if(r.kills>0)bits.push(r.kills.toLocaleString()+' enemies defeated');
  if(r.gear>0)bits.push(r.gear+' new item'+(r.gear>1?'s':'')+' found');
  if(r.pets>0)bits.push(r.pets+' pet'+(r.pets>1?'s':'')+' found');
  
  return '<div class="stat sans" style="position:static"><div class="mu now">While you were away · '+exFmt(r.secs)+'</div><div>'+(bits.length?bits.join(' · ')+'.':'Nothing much happened.')+(r.member?' Your party members gained xp too.':'')+'</div><div style="margin-top:8px"><button class="btn" data-repx="1" style="font-size:14px">Dismiss</button></div></div>';
};
export let saveMsg='';export function set_saveMsg(v:string){saveMsg=v}
export const dataView=()=>'<h2>Your save</h2><p class="mu">Mossglen saves in this browser automatically, and keeps a backup before any upgrade or import. To move your character to another device or browser, export a save code here and import it there.</p><div class="chips"><button data-savex="export">Show save code</button><button data-savex="copy">Copy</button><button data-savex="download">Download file</button></div><textarea id="savebox" rows="4" style="width:100%;box-sizing:border-box;margin-top:8px" placeholder="Paste a save code here to import it"></textarea><div class="chips"><button data-savex="import">Import this code</button></div><p class="mu" id="savemsg">'+saveMsg+'</p><p class="mu">Importing replaces your current character. Your current save is kept as a backup in this browser first.</p><h2>Danger zone</h2><p class="mu">Erases your character, party, gear and every skill. You will be asked to type ERASE to confirm.</p><p><button class="btn" data-reset="1" style="font-size:14px">Erase all progress</button></p>';
export function statsView(){
  const st=gameState.st||{t:0,earn:0,spend:0},sk=GATHER_SKILLS.concat(COMBAT_SKILLS),kills=Object.values(gameState.kc||{}).reduce((s:number,v:any)=>s+v,0) as number,fmt=(n:number)=>Math.round(n).toLocaleString();
  const rows:[string,string][]=[
    ['Time played with the game open',exFmt(st.t)],
    ['Acorns earned',fmt(st.earn)],['Acorns spent',fmt(st.spend)],
    ['Total level',fmt(sk.reduce((q,k)=>q+lv(gameState.xp[k]),0))],
    ['Skills at level 99 or higher',sk.filter(k=>lv(gameState.xp[k])>=99).length+' of '+sk.length],
    ['Enemies defeated',fmt(kills)],
    ['Raids cleared',fmt(Object.values(gameState.rc||{}).reduce((s:number,v:any)=>s+v,0) as number)],
    ['Items in the collection log',fmt(Object.keys(gameState.col||{}).length)],
    ['Pets found',Object.keys(gameState.pets).length+' of '+PETS.length],
    ['Party roster',roster().length+' recruited · '+nsl()+' of '+slots()+' slots in use']
  ];
  return '<h2>Your journey</h2>'+rows.map(r=>'<div class="row"><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('')+'<p class="mu">Counts start from the day this feature arrived, except totals that were already recorded.</p>';
}
export const logTabs=()=>'<div class="seg">'+[['log','Collection'],['guide','Guide'],['stats','Stats'],['data','Data']].map(t=>'<button data-logsub="'+t[0]+'" class="'+(logSub==t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
const dens=(t:string,b:string)=>'<details class="chip"><summary><span>'+t+'</span><em>open</em></summary><div class="mu">'+b+'</div></details>';
// How a pet is found. Skill pets roll while training, boss pets drop from zone bosses, raid pets from clears.
export function petSrc(id:string):string{
  const m=MEMBERS[id];if(!m||!m.pet)return '';
  const sk=m.sk;
  if(sk){
    const r=PB[sk];
    if(sk=='Slayer')return 'Found while completing Slayer tasks, about 1 in 400 per task.';
    if(sk=='Leadership')return 'Found when you clear a raid, about 1 in 150 per clear.';
    if(COMBAT_SKILLS.includes(sk))return 'Found while training '+sk+' in combat, about 1 in '+r.toLocaleString()+' per kill at level 1 (better as you level).';
    return 'Found while training '+sk+', about 1 in '+r.toLocaleString()+' per action at level 1 (better as you level, and 15× better at 200M xp).';
  }
  const z=id.match(/^p_z(\d+)$/);
  if(z){const i=+z[1];return 'Dropped by '+ZN[i][3][3]+', the boss of '+ZN[i][0]+', about 1 in '+(1000+400*i).toLocaleString()+' per boss kill.'}
  const r=id.match(/^p_r(\d+)$/);
  if(r){const i=+r[1];return 'Dropped by clearing '+RD[i].n+', about 1 in '+[80,100,120,150][i]+' per clear.'}
  return '';
}
const petTag=(k:string)=>MEMBERS[k]&&MEMBERS[k].pet?'<small>'+petSrc(k)+'</small>':'';
// ---------- first-run tutorial
export const TUT:string[][]=[
  ['Welcome to Mossglen','You play one hedgehog (or other woodland creature) forever. Everything you start keeps running, even while the game is closed. Tap a skill under Skills to begin gathering.'],
  ['Pack and acorns','Gathered goods land in the Pack tab. Sell them for acorns, but keep food (it heals you in fights) and anything you want to craft with.'],
  ['Fight','In Fight, choose Melee, Ranged or Magic, then an enemy. Counter an enemy\'s style for +25% damage. Gear and Loadout (in Gear) equip your best items for you.'],
  ['Your party','Train Leadership by fighting to unlock party slots, then recruit members in Party. Extra members rest on your roster and can still train in the barracks or go on expeditions.'],
  ['Explore and Burrow','Explore sends expeditions and raids. Burrow has buildings and the seasons. Seasons help gathering, farming and alchemy but never touch combat.'],
  ['Log, Guide and saves','Log holds your Collection, a Guide with every drop source, Stats, and Data where you can copy a save code. Do that now and then to keep a backup.']
];
// What to do to move forward at each step, and whether it is already done.
export function tutGoal(n:number):[string,boolean]{
  const g=gameState,kills=Object.keys(g.kc||{}).reduce((q,k)=>q+g.kc[k],0);
  if(n==0)return ['Start a gathering skill. Try Foraging.',GATHER_SKILLS.some(k=>lv(g.xp[k])>1)];
  if(n==1)return ['Sell something in Pack to earn your first acorns.',(g.st&&g.st.earn>0)||g.a>0];
  if(n==2)return ['Win a fight: pick an enemy in the Fight tab.',kills>0];
  if(n==3)return ['Raise Leadership to level '+LT[1]+' by fighting, then recruit your first member.',lv(g.xp.Leadership)>=LT[1]||roster().length>0];
  if(n==4)return ['Reach combat level '+ZN[1][1]+' to open '+ZN[1][0]+', your next zone.',X.CL()>=ZN[1][1]];
  return ['Open Data and tap Export to copy a save code.',false];
}
export const tutCard=()=>{
  const n=gameState.tut;if(typeof n!='number'||n<0||n>=TUT.length)return '';
  return '<div class="stat sans" style="position:static"><div class="mu now">Quick tour · '+(n+1)+' of '+TUT.length+'</div><div><b>'+TUT[n][0]+'</b></div><div class="mu" style="margin-top:4px">'+TUT[n][1]+'</div><div style="margin-top:6px"><b>Goal:</b> '+tutGoal(n)[0]+(tutGoal(n)[1]?' <span class="good">✓ done</span>':'')+'</div><div style="margin-top:8px;display:flex;gap:8px"><button class="btn" data-tut="next" style="font-size:14px">'+(n==TUT.length-1?'Done':'Next')+'</button><button class="btn" data-tut="skip" style="font-size:14px">Skip tutorial</button></div></div>';
};
// ---------- item directory
export function itemDir():string{
  const zl=ZN.map((z,i)=>{
    const bits:string[]=['Combat level '+z[1]+' · material <b>'+z[4]+'</b> (about 3 in 5 kills)'];
    if(i>7){bits.push('core <b>'+z[6]+'</b> (1 in 40 per kill, 1 in 6 from the boss)');bits.push('<b>'+PRE[dropTier(i)]+'</b> gear from the boss only (about 1 in 30)')}
    else bits.push('<b>'+PRE[dropTier(i)]+'</b> gear (about 1 in 64 per kill, 1 in 10 from the boss)');
    bits.push('boss trophy <b>'+IT['t'+i].n+'</b> (about 1 in 12 per boss kill)');
    return '<div style="margin-top:6px"><b>'+z[0]+'</b><br>'+bits.join('<br>')+'</div>';
  }).join('');
  const dl=DISHES.map(d=>{const m=ZN[(d as any).zb];return '<div style="margin-top:6px"><b>'+d.n+'</b> · needs '+d.req+' combat power, '+(m?'also pays '+m[4]+(((d as any).zb>=8)?' and sometimes '+m[6]:''):'')+'<br>Trophy <b>'+d.tr+'</b> from winning expeditions, better with a good leader and Fortune. Tier 4 and 5 runs can also give a piece of gear.</div>'}).join('');
  const rl=RD.map((r,i)=>'<div style="margin-top:6px"><b>'+r.n+'</b> · combat level '+r.cl+', '+r.party+' members of level '+r.mlv+'+<br>'+(r.core?r.core[0]+' ('+r.core[1]+' or '+(r.core[1]+1)+' per clear), ':'')+'trophy <b>'+IT[r.tr].n+'</b> (about 6% per clear, guaranteed by 25), '+PRE[Math.min(10,[7,8,9,10][i])]+' gear (about 1 in 5, guaranteed by 8), and the raid pet.</div>').join('');
  const note='<p style="margin-top:6px">Chances shown are base rates. Rare-drop bonuses from gear, pets, blessings and tasks multiply them, and bad-luck protection guarantees a drop eventually. Gear can also be bought in the Shop and crafted from materials in the Gear tab.</p>';
  const od=OUTFIT_SK.map(sk=>'<div style="margin-top:6px"><b>'+sk+'</b>: '+[1,2,3].map(t=>OUT_TIERS[t]+' set, '+outPerkTxt(sk,t)).join('; ')+'</div>').join('');
  const ol='<p>Five pieces per skill (Cap, Vest, Gloves, Boots, Legs), three tiers. Each piece gives a little xp. A full set of five gives the bonus of its weakest piece. Novice pieces also turn up while you train that skill (about 1 in 25,000 actions). Zone bosses drop Novice pieces in zones 1 to 4, Adept in zones 5 to 8 and Master in the deep zones. Expeditions and raids drop them too (raids give Adept and Master). Drops only roll for pieces you are missing, and you can set the skill they favour in Gear > Outfits.</p>'+od;
  const ul='<p>Each boss has one signature weapon, about 12% stronger than an Heirloom of its tier, for the style listed. They are extremely rare and found once each.</p>'+BWEAPONS.map(w=>'<div style="margin-top:6px">'+uniqLine(w).replace('Signature weapon ','<b>'+(w.z!=null?w.boss:RD[w.raid!].st[RD[w.raid!].st.length-1][0])+'</b>: ')+'</div>').join('');
  return dens('Item directory · boss signature weapons',ul)+dens('Item directory · skilling outfits',ol)+dens('Item directory · zones',note+zl)+dens('Item directory · delves and expeditions',dl)+dens('Item directory · raids',rl);
}
export function guideView(){
  const found=(id:string)=>gameState.pets[id]?'✓ ':'';
  const rec=HK.filter(k=>!MEMBERS[k].pet).map(k=>'<div style="margin-top:6px">'+(known(k)?'✓ ':'')+'<b>'+MEMBERS[k].n+'</b> · '+MEMBERS[k].role+'<br>Recruit in the Party tab for '+MEMBERS[k].c.toLocaleString()+' acorns once Leadership is level '+MEMBERS[k].lt+'.</div>').join('');
  const pets=PETS.map(q=>'<div style="margin-top:6px">'+found(q[0])+'<b>'+q[1]+'</b> · '+q[2]+'<br>'+petSrc(q[0])+'</div>').join('');
  const memDens=dens('Party members (recruits)',rec)+dens('Pets (found, never bought)','<p>Pets are extremely rare drops. Each is found once, joins your party or roster, and fights and works better than recruits. ✓ marks the ones you have.</p>'+pets);
  const capes=Object.keys(CE).map(k=>capeRow(k).replace('<div class="row"><span>','<div class="row"><span><b>'+k+'</b> · ')).join('');
  const rates='<b>Zone gear</b>: about 1 in 64 per kill, or 1 in 10 from a boss. A guaranteed drop arrives after 150 kills (40 for bosses).<br><b>Deep zones (8+)</b>: crafting materials about 1 in 40 per kill, 1 in 6 from a boss, guaranteed by 100 kills (18 for bosses). Bosses also have a 1 in 30 chance at gear, guaranteed by 70 kills.<br><b>Trinkets</b>: about 1 in 12 per boss kill, guaranteed by 60.<br>These are base chances. Rare-drop bonuses from gear, pets and blessings multiply them.';
  return '<h2>Guide</h2><p class="sub">Reference notes, kept out of the way.</p>'+dens(gameState.sp+' traits','+15% xp in '+SP[gameState.sp!]+'. '+spTxt(gameState.sp))+dens('Capes','<div style="margin-top:6px">'+capes+'</div>')+memDens+itemDir()+dens('Drop rates',rates)+'<p><button class="btn" data-tut="replay">Replay the quick tour</button></p>';
}
// ---------- pack: filters, sell one / some / all, always with confirmation
export let packF='all';let packSel:{k:string;n:number}|null=null,packBulk=false;
const MATS=new Set(ZN.map(z=>z[4]));
export const packCat=(k:string)=>FOOD[k]?'food':KP[k]?'keep':KEEPX[k]?'farm':MATS.has(k)?'mats':'goods';
export const PACKF:string[][]=[['all','All'],['goods','Goods'],['mats','Materials'],['food','Food'],['farm','Seeds & potions'],['keep','Keepsakes']];
export const canSell=(k:string)=>!KP[k]&&SELL_VALUE[k]>0;
const sellVal=(k:string,n:number)=>Math.round(n*SELL_VALUE[k]*(1+cb('sell')));
const owned=()=>Object.keys(gameState.inv).filter(k=>gameState.inv[k]>0);
export function packAct(a:string,v?:string){
  const inv=gameState.inv;
  if(a=='f'){packF=v||'all';packSel=null;packBulk=false}
  else if(a=='sel'){packBulk=false;packSel=packSel&&packSel.k==v&&v?null:v&&inv[v]>0?{k:v,n:1}:null}
  else if(a=='q'&&packSel){const have=inv[packSel.k]||0;let n=packSel.n;
    if(v=='all')n=have;else if(v=='half')n=Math.ceil(have/2);else n+=parseInt(v||'0',10)||0;
    packSel.n=Math.max(1,Math.min(have,n))}
  else if(a=='cancel'){packSel=null;packBulk=false}
  else if(a=='ok'&&packSel){const k=packSel.k,n=Math.min(packSel.n,inv[k]||0);
    if(n>0&&canSell(k)){const g=sellVal(k,n);gameState.a+=g;inv[k]-=n;if(inv[k]<=0)delete inv[k];say('Sold '+n+' '+k+' for '+g+' acorns.')}
    packSel=null}
  else if(a=='bulk'){packSel=null;packBulk=true}
  else if(a=='bulkok'){let g=0,n=0;for(const k of owned()){if(KEEP(k)||!canSell(k))continue;if(packF!='all'&&packCat(k)!=packF)continue;g+=sellVal(k,inv[k]);n++;delete inv[k]}
    gameState.a+=g;say('Sold '+n+' kinds of goods for '+g+' acorns.');packBulk=false}
}
export function packView():string{
  const items=owned(),inF=(k:string)=>packF=='all'||packCat(k)==packF,list=items.filter(inF);
  const bulk=list.filter(k=>!KEEP(k)&&canSell(k)),tot=bulk.reduce((s,k)=>s+sellVal(k,gameState.inv[k]),0);
  if(packSel&&!(gameState.inv[packSel.k]>0))packSel=null;
  let h='<h2>Pack</h2><p class="sub">Crafting uses gathered goods and zone materials, so sell selectively. Every sale asks you to confirm.</p>';
  if(!items.length)return h+'<p class="sub">Your pack is empty. Gather something first.</p>';
  h+='<div class="chips">'+PACKF.map(f=>{const n=items.filter(k=>f[0]=='all'||packCat(k)==f[0]).length;return '<button class="'+(packF==f[0]?'on':'')+'" data-pk="f" data-pv="'+f[0]+'">'+f[1]+' '+n+'</button>'}).join('')+'</div>';
  if(!list.length)h+='<p class="mu">Nothing of that kind in your pack.</p>';
  h+=list.map(k=>{
    const sel=packSel&&packSel.k==k?packSel:null,have=gameState.inv[k];
    let r='<div class="row"><span>'+k+'<small>'+SELL_VALUE[k]+' acorns each'+(FOOD[k]?' · heals '+FOOD[k]:KP[k]?' · keepsake':KEEPX[k]?' · '+KEEPX[k]:'')+'</small></span><b>×'+have+'</b>'+(canSell(k)?'<button class="btn" data-pk="sel" data-pv="'+k+'">'+(sel?'Close':'Sell…')+'</button>':'')+'</div>';
    if(sel)r+='<div class="arena" style="margin:-2px 0 8px"><div class="nm"><span>Sell how many?</span><span>'+sel.n+' of '+have+'</span></div><div class="chips" style="margin:8px 0">'+[['-10','−10'],['-1','−1'],['1','+1'],['10','+10'],['half','Half'],['all','All']].map(q=>'<button data-pk="q" data-pv="'+q[0]+'">'+q[1]+'</button>').join('')+'</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-pk="ok">Confirm: sell '+sel.n+' for '+sellVal(k,sel.n)+' acorns</button><button class="btn" data-pk="cancel">Cancel</button></div></div>';
    return r;
  }).join('');
  if(bulk.length){
    h+=packBulk?'<div class="arena"><div class="nm"><span>Sell '+bulk.length+' kinds of goods'+(packF=='all'?'':' ('+PACKF.find(f=>f[0]==packF)![1].toLowerCase()+')')+' for '+tot+' acorns?</span></div><p class="mu" style="margin:4px 0 8px">Food, keepsakes, seeds and potions are never included.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-pk="bulkok">Yes, sell</button><button class="btn" data-pk="cancel">Cancel</button></div></div>'
      :'<p><button class="btn" data-pk="bulk">Sell all'+(packF=='all'?'':' in this filter')+' (not food or keepsakes) · '+tot+' acorns…</button></p>';
  }
  return h;
}
export function view(){
  if(tab=='burrow')return burrowView();
  if(tab=='log')return logTabs()+(logSub=='guide'?guideView():logSub=='data'?dataView():logSub=='stats'?statsView():logView());
  if(tab=='skills')return skillsView();
  if(tab=='combat')return combatView();
  if(tab=='gear')return gearView();
  if(tab=='party')return partyView();
  if(tab=='delve')return '<h2>Expeditions</h2>'+exView()+raidView();
  return packView();
}
export function render(){
  set_hitsStr(null);
  const app=document.getElementById('app');
  if(!gameState.sp){
    app!.innerHTML='<div class="hero"><span class="leaf">🍃</span><h1>Mossglen</h1></div><p class="sub" style="text-align:center">A quiet valley where small folk work, explore, and nap. Who are you?</p><div class="pick">'+
    Object.keys(SP).map(s=>'<button class="row" data-sp="'+s+'">'+s+'<small>+15% '+SP[s]+' xp</small><small>'+SPX[s].t+'</small><small>'+SPX[s].w+' '+SPX[s].st+' style +4% damage.</small></button>').join('')+'</div>';return;
  }
  const cn=curName(),sb=document.getElementById('savebox') as HTMLTextAreaElement|null,sbv=sb?sb.value:'';
  app!.innerHTML='<div class="top"><h1>Mossglen</h1><span class="acorn" id="ac"></span></div><p class="sub">'+gameState.sp+' of the valley · total level '+GATHER_SKILLS.concat(COMBAT_SKILLS).reduce((s,k)=>s+lv(gameState.xp[k]),0)+'</p>'+
  '<div class="stat sans"><div class="mu now">You are currently</div>'+(cn?'<div style="display:flex;justify-content:space-between"><span>'+cn+(gameState.cur.k=='c'?' <small class="mu" id="se"></small>':'')+'</span><button class="btn" data-stop="1">Rest</button></div><div class="bar'+(gameState.cur.k=='c'?' hp':'')+'"><i id="pb"></i></div>':'<span class="mu">Resting. Choose an activity below to begin.</span>')+potStatus()+(hasWork()?'<div class="mu" style="font-size:14px;margin-top:4px">'+workNames()+'</div>':'')+'</div>'+
  tutCard()+repCard()+
  '<nav>'+[['skills','Skills','leaf'],['combat','Fight','swords'],['gear','Gear','shield'],['party','Party','paw'],['delve','Explore','lantern'],['burrow','Burrow','burrow'],['log','Log','tome'],['pack','Pack','satchel']].map(t=>'<button data-tab="'+t[0]+'" class="'+(tab==t[0]?'on':'')+'"><i>'+icon(t[2],25)+'</i>'+t[1]+'</button>').join('')+'</nav>'+
  view()+'<div id="log">'+gameState.log.map((l:number)=>'<p>'+l+'</p>').join('')+'</div>';
  {const nb=document.getElementById('savebox') as HTMLTextAreaElement|null;if(nb&&sbv)nb.value=sbv}
  bars();
}

Object.defineProperties(X,{render:{get:()=>render,configurable:true}});
