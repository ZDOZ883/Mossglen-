import { gameState, say } from './00-state';
import { X } from './registry';
import { FM, FOOD, GP, MEMBERS, IT, SL, XS, adv, cb, fighters, ldx, lv, maxhp, mxp, onTask, petRoll, pk, skPet, weak , OFF } from './01-species-pets';
import { ACCL, ENEMIES, PRE, ZN, dropTier, elv, fxTxt, gearSync, qrank, rsLv, scopeTxt, skey, zoneOpen } from './02-gear-data';
import { RD, raidKill, raidOk } from './03-world-expeditions';
import { CL, RT, armor, dwf, eHitP, ef, emax, hit, hitP, maxHit, memDpr, set_hits, shT } from './04-loadout';
// Fight maths, loot, combat rounds, combat view. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export function fight(e:Enemy){
  const Ep=hitP(e)*(maxHit(e)+1)/2*(1+dwf())+memDpr(e),rounds=Math.max(1,e.hp/Math.max(.01,Ep));
  const Ee=eHitP(e)*(emax(e)+1)/2*(1-armor())*(1+FM![gameState.form].taken)*(1-Math.min(.6,pk('taken')+cb('taken')+shT()+(onTask(e)?cb('ttaken'):0))),reg=maxhp()*.01*RT*(1+FM![gameState.form].regen+cb('regen'));
  return{ttk:rounds*RT,dmg:Math.max(0,(Ee-reg)*rounds-maxhp()*pk('heal'))};
}
export function canEq(it:Item){if(it.rs)return rsLv(it.rs)>=it.req;return lv(gameState.xp[SL.includes(it.slot)?OFF[it.slot][0]:it.slot=='trinket'?'Vitality':'Defense'])>=it.req}
export function autoEq(id:string){const it=IT[id];if(it.slot=='ring'){if(!canEq(it))return;const k=!gameState.eq.ring1?'ring1':!gameState.eq.ring2?'ring2':null;if(k){gameState.eq[k]=id;say('Equipped '+it.n+'.');gearSync()}return}if(it.slot=='cloak'){if(!gameState.cape&&canEq(it)){gameState.cape='I:'+id;X.refreshFx();say('Wearing '+it.n+'.')}return}const cur=gameState.eq[it.slot];if(!cur&&canEq(it)){gameState.eq[it.slot]=id;say('Equipped '+it.n+'.');gearSync()}}
export function gainItem(id:string){const it=IT[id];if(gameState.own[id]){const v=Math.round((GP[it.tier]||50)*.4);gameState.a+=v;say('Duplicate '+it.n+' sold for '+v+' acorns.');return}gameState.own[id]=1;gameState.col[id]=1;say('Rare drop: '+it.n+'!');autoEq(id)}
export function rndGear(t:number){const ac=()=>{const sl=['ring','neck','cloak'][Math.floor(Math.random()*3)];return ACCL[sl]+Math.floor(Math.random()*4)+'_'+t};const pool=[0,1,2].map(i=>'w'+i+t).concat([0,1,2].map(i=>'x'+i+t),[0,1,2].map(i=>'o'+i+t),['y'+t,'b'+t,'h'+t,'g'+t,ac(),ac()]);return pool[Math.floor(Math.random()*pool.length)]+'d'}
export function loot(e:Enemy,quiet?:boolean){
  const z=e.zone,g=1+ef('drop')+cb('drop')+FM[gameState.form].drop+(onTask(e)?.1+(gameState.su.fort?.25:0)+cb('tdrop'):0),t=dropTier(z),k='z'+z+(e.boss?'b':'m');
  if(Math.random()<.6){const m=ZN[z][4];gameState.inv[m]=(gameState.inv[m]||0)+1+(Math.random()<.4?1:0)}
  gameState.pity[k]=(gameState.pity[k]||0)+1;
  if(z>7){const ck=k+'c',cn=ZN[z][6];gameState.pity[ck]=(gameState.pity[ck]||0)+1;if(Math.random()<(e.boss?1/6:1/40)*g||gameState.pity[ck]>=(e.boss?18:100)){gameState.pity[ck]=0;gameState.inv[cn!]=(gameState.inv[cn!]||0)+1}}
  if(z<8&&(Math.random()<(e.boss?.1:1/64)*g||gameState.pity[k]>=(e.boss?40:150))){gameState.pity[k]=0;gainItem(rndGear(t))}
  if(e.boss&&z>7){const hk='z'+z+'h';gameState.pity[hk]=(gameState.pity[hk]||0)+1;if(Math.random()<g/30||gameState.pity[hk]>=70){gameState.pity[hk]=0;gainItem(rndGear(z))}}
  if(e.boss){const tk='z'+z+'t';gameState.pity[tk]=(gameState.pity[tk]||0)+1;if(Math.random()<g/12||gameState.pity[tk]>=60){gameState.pity[tk]=0;gainItem('t'+z)}}
}
// Everything an enemy can drop, as short lines for the "Drops" panel.
export function dropInfo(e:Enemy):string[]{
  if(e.raid)return ['Raid foes pay nothing on their own. Clear the whole raid for its rewards (see Explore > Raids).'];
  if(e.inst)return ['Delve foes drop nothing in a live fight. Delves pay out through expeditions (see Explore).'];
  const z=e.zone,zz=ZN[z],t=dropTier(z),o:string[]=[];
  o.push('Acorns every kill (about '+e.a+').');
  o.push(zz[4]+': about 3 in 5 kills, 1 or 2 at a time.');
  if(z>7){
    o.push(zz[6]+': '+(e.boss?'1 in 6':'1 in 40')+' per kill, guaranteed by '+(e.boss?18:100)+' kills.');
    if(e.boss)o.push(PRE[t]+' gear: about 1 in 30, guaranteed by 70 boss kills.');
  }else o.push(PRE[t]+' gear (weapon, off-hand, armor or accessory): '+(e.boss?'1 in 10':'1 in 64')+' per kill, guaranteed by '+(e.boss?40:150)+' kills.');
  if(e.boss){
    o.push(IT['t'+z].n+' (trinket): about 1 in 12, guaranteed by 60 boss kills.');
    o.push('Boss pet: 1 in '+(1000+400*z).toLocaleString()+' per boss kill.');
  }
  o.push('Rare-drop bonuses from gear, pets, blessings and Slayer tasks raise these chances.');
  return o;
}
export const dropPanel=(e:Enemy)=>'<details class="chip" style="margin-top:8px"><summary><span>Drops</span><em>open</em></summary><div class="mu">'+dropInfo(e).map(l=>'<div>• '+l+'</div>').join('')+'</div></details>';
export function onKill(e:Enemy,quiet?:boolean){
  gameState.lsu=false;
  const xs=XS[gameState.stance],xm=1+ef('xp')+cb('xpm'),c0=CL(),ks=['Attack','Strength','Ranged','Magic','Defense','Vitality'],b=ks.map(k=>lv(gameState.xp[k]));
  const ox=Math.min(1,Math.pow((elv(e)+15)/Math.max(1,c0),2));
  const fg=fighters(),cm=gameState.cmd&&fg.length>0,sp=cm?.6:1;
  {const gx=e.xp*xm*ox*sp,o=OFF[gameState.style]||OFF.Melee;gameState.xp[o[0]]+=gx*xs[1];gameState.xp[o[1]]+=gx*xs[2];gameState.xp.Defense+=gx*xs[3];gameState.xp.Vitality+=gx*xs[4]}
  const g=Math.round(e.a*(1+ef('gold')+FM[gameState.form].gold));gameState.a+=g;gameState.kc[e.id]=(gameState.kc[e.id]||0)+1;if(!e.inst)X.slayKill(e);
  if(fg.length){ldx(e.xp*(xs[5]+(cm?2.4:0))*xm*ox);fg.forEach(k=>mxp(k,e.xp*1.6*ox))}
  ks.forEach((k,i)=>{if(lv(gameState.xp[k])>b[i])say(k+' reaches level '+lv(gameState.xp[k])+'.')});
  const c1=CL();if(c1>c0)say('Combat level '+c1+'.'+ZN.filter(z=>z[1]>c0&&z[1]<=c1&&!z[5]).map(z=>' New zone: '+z[0]+'.').join(''));
  ['Attack','Strength','Ranged','Magic','Defense','Vitality'].forEach(skPet);
  if(e.boss&&!e.inst)petRoll('p_z'+e.zone,1000+400*e.zone);
  if(!quiet)hit('<b>You defeat '+e.n+'. +'+g+' acorns.</b>');
  if(e.raid)raidKill(e,quiet);else loot(e);
}
export const healers=()=>{const n=fighters().filter(k=>(MEMBERS[k].pk.heal||0)>0).map(k=>MEMBERS[k].n.split(' ')[0]);return n.length>1?n.slice(0,-1).join(', ')+' and '+n[n.length-1]:n[0]||'Your party'};
export function cround(e:Enemy,quiet?:boolean){
  const m=maxhp();
  if(e.raid){const r=RD.find(x=>x.id==e.raid)!;if(!raidOk(r)){gameState.cur=null;gameState.ehp=null;say('The raid party broke up. You pull out of '+r.n+'.');return}gameState.rr=(gameState.rr||0)+1}
  if(gameState.ehid!==e.id||gameState.ehp==null){gameState.ehid=e.id;gameState.ehp=e.hp;gameState.rr=0;gameState.hrr=Math.max(1,e.hp/Math.max(.01,hitP(e)*(maxHit(e)+1)/2*(1+dwf())+memDpr(e)));if(!quiet)set_hits([])}
  if(gameState.hp<m*.55){
    const hl=1+ef('heal')+cb('heal')+lv(gameState.xp.Cooking)*.004,fk=Object.keys(FOOD).filter(k=>gameState.inv[k]>0).sort((a,b)=>FOOD[a]-FOOD[b]),k=fk.find(q=>FOOD[q]*hl>=m*.15)||fk[fk.length-1];
    if(k){gameState.inv[k]--;const h=Math.round(FOOD[k]*hl);gameState.hp=Math.min(m,gameState.hp+h);if(!quiet)hit('You eat '+k+' (+'+h+').')}
  }
  if(Math.random()<hitP(e)){let d=1+Math.floor(Math.random()*maxHit(e));const cr=Math.random()<cb('crit');if(cr)d*=2;gameState.ehp-=d+Math.round(memDpr(e)*(.75+Math.random()*.5));if(cb('lsteal'))gameState.hp=Math.min(m,gameState.hp+d*cb('lsteal'));if(!quiet)hit('You '+(cr?'crit for ':'hit ')+d+'.')}else if(!quiet)hit('You miss.');
  if(gameState.ehp>0&&dwf()>0&&Math.random()<hitP(e)){const od=1+Math.floor(Math.random()*Math.max(1,Math.floor(maxHit(e)*dwf())));gameState.ehp-=od;if(!quiet)hit('Your off-hand hits for '+od+'.')}
  if(gameState.ehp<=0){gameState.ehp=null;onKill(e,quiet);return}
  if(Math.random()<eHitP(e)){const d=Math.max(1,Math.round((1+Math.floor(Math.random()*emax(e)))*(1-armor())*(1+FM![gameState.form].taken)*(1-Math.min(.6,pk('taken')+cb('taken')+shT()+(onTask(e)?cb('ttaken'):0)))));gameState.hp-=d;if(!quiet)hit(e.n+' hits you for '+d+'.')}else if(!quiet)hit(e.n+' misses.');
  if(gameState.hp<=0&&cb('ls')>0&&!gameState.lsu){gameState.lsu=true;gameState.hp=1;if(!quiet)hit('Last stand! You hold on with 1 hp.')}
  if(gameState.hp<=0){gameState.lsu=false;gameState.hp=m/2;gameState.p=-15;gameState.ehp=null;say(e.n+' overpowers you. You limp off to rest a while.');if(e.raid){gameState.cur=null;say('The raid is lost. Resupply, then try again.')}if(!quiet)hit('You are knocked out.');return}
  // Healers mend you every round of the fight. Over a typical fight it adds up to the same total they used to give after each kill.
  const hr=pk('heal');if(hr>0&&gameState.hp>0&&gameState.hp<m){const h=Math.max(.5,m*hr/Math.max(1,gameState.hrr||8));gameState.hp=Math.min(m,gameState.hp+h);if(!quiet&&h>=1)hit(healers()+' mends you (+'+Math.round(h)+').')}
  gameState.hp=Math.min(m,gameState.hp+m*.01*RT*(1+FM![gameState.form].regen+cb('regen')));
}
export function cycle(k:string){const ot=k=='ring1'?gameState.eq.ring2:k=='ring2'?gameState.eq.ring1:null;const o=Object.keys(gameState.own).filter(i=>IT[i].slot==skey(k)&&canEq(IT[i])&&i!=ot).sort((a,b)=>IT[a].tier-IT[b].tier||qrank(IT[a])-qrank(IT[b])||(IT[a].fam||0)-(IT[b].fam||0));if(!o.length)return;gameState.eq[k]=o[(o.indexOf(gameState.eq[k])+1)%o.length];gearSync()}
export const price=(it:Item)=>Math.round(GP[it.tier]*(it.cmb?1.3:1)*(it.q=='s'?.6:1));
export function shopBuy(id:string){const it=IT[id],c=price(it);if(!gameState.own[id]&&gameState.a>=c){gameState.a-=c;gameState.own[id]=1;say('Bought '+it.n+'.');autoEq(id)}}
export function istat(it:Item){if(it.eff){const N:Record<string,any>={gold:'acorns',dmg:'damage',heal:'food healing',drop:'rare drops',xp:'combat xp'};return Object.keys(it.eff).map(k=>'+'+Math.round(it.eff[k]*100)+'% '+N[k]).join(', ')}if(it.fx)return fxTxt(it.fx.map((e)=>[e[0],e[1]]))+scopeTxt(it);if(it.kind=='2h')return '+'+it.stat+' attack · two-handed: +30% damage, no off-hand';if(it.kind=='off')return '+'+it.stat+' attack · off-hand for '+it.st+': dual wield adds an extra strike';if(it.kind=='shield')return '+'+it.stat+' defense · −8% damage taken';return '+'+it.stat+(it.slot=='body'||it.slot=='head'||it.slot=='legs'?' defense':' attack')}
export function reqText(it:Item){if(it.rs)return ({gath:'any gathering skill',prod:'any production skill'}[it.rs]||it.rs)+' '+it.req;return it.slot=='body'||it.slot=='head'||it.slot=='legs'?'Defense '+it.req:'Attack '+it.req}
export function arenaView(){
  const c=gameState.cur&&gameState.cur.k=='c'?ENEMIES.find(e=>e.id==gameState.cur.id):null,food=Object.keys(FOOD).reduce((s,k)=>s+(gameState.inv[k]||0),0);
  let h='<div class="arena"><div class="nm"><b>You</b><span id="ph" class="mu"></span></div><div class="bar"><i id="hp"></i></div><small class="mu">'+gameState.style+(c?' · hit '+Math.round(hitP(c)*100)+'% · max hit '+maxHit(c)+(adv(gameState.style,c.type)>0?' · type advantage':adv(gameState.style,c.type)<0?' · type disadvantage':''):'')+' · food '+food+' (eaten below 55% hp)</small>';
  if(c)h+='<div class="nm" style="margin-top:12px"><b>'+(c.boss?'Boss: ':'')+c.n+'</b><span id="eh" class="mu"></span></div><div class="bar hp"><i id="ehb"></i></div><small class="mu">'+c.type+' · weak to '+weak(c.type)+' · hit '+Math.round(eHitP(c)*100)+'% · max hit '+emax(c)+(c.raid?' · enrages after '+c.soft+' rounds (round '+(gameState.rr||0)+')':'')+'</small>'+dropPanel(c);
  else h+='<p class="mu" style="margin:12px 0 0">Not fighting. Pick an enemy below.</p>';
  return h+'<div id="hits" class="hits"></div></div>';
}
// Ranged and Magic train one skill, so Accurate and Aggressive would do the same thing there: they show as a single Focused stance.
const ranged=()=>(gameState.style||'Melee')!='Melee';
export const stanceList=()=>ranged()?['bal','acc','def']:Object.keys(XS);
export const stanceNow=()=>ranged()&&gameState.stance=='agg'?'acc':gameState.stance;
export const stanceName=(k:string)=>ranged()&&k=='acc'?'Focused':XS[k][0];
export const stanceNote=(k:string)=>ranged()&&k=='acc'?'Trains your '+gameState.style+' skill, which sets both your hit chance and your damage.':XS[k][6];
export function statTiles(){
  const xs=XS[gameState.stance],note={Attack:'Melee hit chance',Strength:'Melee max hit',Ranged:'Ranged hit chance and max hit',Magic:'Magic hit chance and max hit',Defense:'Enemy hit chance (all styles)',Vitality:'Health '+maxhp()+' (all styles)'};
  const sh=(k:string)=>{const o=OFF[gameState.style]||OFF.Melee;return k=='Defense'?xs[3]:k=='Vitality'?xs[4]:(o[0]==k?xs[1]:0)+(o[1]==k?xs[2]:0)};
  return '<div class="pick">'+['Attack','Strength','Ranged','Magic','Defense','Vitality'].map((k)=>'<div class="row'+(sh(k)>0?' on':'')+'" style="flex-direction:column;align-items:flex-start;gap:2px"><span>'+k+' · '+lv(gameState.xp[k])+'</span><small>'+(note as any)[k]+'</small><div class="bar xp" style="width:100%"><i style="width:'+X.pcx(k)+'%"></i></div></div>').join('')+'</div>';
}
export function combatView(){
  const m=maxhp(),st=gameState.style,z=gameState.zone,zz=ZN[z],cl=CL(),fgn=fighters();
  let h='<h2>Combat · level '+cl+'</h2>'+arenaView();
  h+='<p class="sub">Melee beats Ranged, Ranged beats Magic, Magic beats Melee: counter an enemy for +25% damage.</p>';
  h+='<div class="pick" style="grid-template-columns:repeat(3,1fr)">'+SL.map(s=>'<button class="row'+(st==s?' on':'')+'" data-style="'+s+'">'+s+'<small>'+(gameState.eq[s]?IT[gameState.eq[s]].n:'No weapon')+'</small></button>').join('')+'</div>';
  h+='<h2>Combat stats</h2>'+statTiles();
  h+='<h2>Stance <span class="mu" style="display:inline">· where xp goes</span></h2><div class="chips">'+stanceList().map(k=>'<button class="'+(stanceNow()==k?'on':'')+'" data-stance="'+k+'">'+stanceName(k)+'</button>').join('')+'</div><p class="mu">'+stanceNote(stanceNow())+'</p><div class="chips"><button class="'+(gameState.cmd?'on':'')+'" data-cmd="1">Command: '+(gameState.cmd?'on':'off')+'</button></div><p class="mu">Command splits your xp with Leadership. While members fight beside you, your stat xp drops to 60% and Leadership gains 2.4× a kill’s base xp.'+(gameState.cmd&&!fgn.length?' No members are fighting with you, so Command is doing nothing and you keep full xp.':'')+'</p>';
  h+='<h2>Form <span class="mu" style="display:inline">· combat buffs</span></h2><div class="chips">'+Object.keys(FM).map(k=>'<button class="'+(gameState.form==k?'on':'')+'" data-form="'+k+'"'+(cl<FM[k].cl?' disabled':'')+'>'+FM[k].n+(cl<FM[k].cl?' (CL '+FM[k].cl+')':'')+'</button>').join('')+'</div><p class="mu">'+FM[gameState.form].d+'</p>';
  h+='<p class="mu">Fighting beside you: '+(fgn.length?fgn.map(k=>MEMBERS[k].n).join(', '):'no one. Recruit members in the Party tab.')+'</p>';
  h+='<h2>Zones</h2><div class="chips">'+ZN.map((q,i)=>'<button class="'+(z==i?'on':'')+'" data-zone="'+i+'"'+(zoneOpen(i)?'':' disabled')+'>'+q[0]+(zoneOpen(i)?'':cl<q[1]?' (CL '+q[1]+')':' (Gate '+q[5]+')')+'</button>').join('')+'</div>';
  const kills=ENEMIES.filter(x=>x.zone==z&&!x.boss&&!x.inst).reduce((s,x)=>s+(gameState.kc[x.id]||0),0);
  h+=ENEMIES.filter(e=>e.zone==z&&!e.inst).map(e=>{const f=fight(e),on=gameState.cur&&gameState.cur.k=='c'&&gameState.cur.id==e.id,lock=e.boss&&kills<30;
    return '<button class="row'+(on?' on':'')+'" data-do="c:'+e.id+'"'+(lock?' disabled':'')+'><span>'+(e.boss?'Boss: ':'')+e.n+'<small>'+(onTask(e)?'On task · ':'')+e.type+' · '+e.hp+' hp · weak to '+weak(e.type)+' · '+(lock?'defeat '+kills+'/30 foes here first':'kills '+(gameState.kc[e.id]||0))+'</small></span><small class="'+(f.dmg>m*.7?'bad':'')+'">~'+Math.round(f.ttk)+'s<br>−'+Math.round(f.dmg/m*100)+'% hp</small></button>'}).join('');
  const t=dropTier(z);
  h+=z>7?'<h2>Loot</h2><p class="mu">Every kill pays acorns and sometimes '+zz[4]+'. Foes here drop '+zz[6]+' (1/40, or 1/6 from the boss, with bad-luck protection). Cores go into tier '+z+' gear and the next gate. No gear drops here: it is all crafted. The boss also drops '+IT['t'+z].n+' (1/12).</p>':'<h2>Loot</h2><p class="mu">Every kill pays acorns and sometimes '+zz[4]+'. Rare gear roll: 1/64 per kill, 1/10 from the boss, with bad-luck protection. Pool: '+[0,1,2].map(i=>IT['w'+i+t].n).concat([IT['b'+t].n,IT['h'+t].n]).join(', ')+'. The boss also drops '+IT['t'+z].n+' (1/12).</p>';
  {const nf=ENEMIES.find(e=>e.zone==z&&!e.boss&&!e.inst),bf=ENEMIES.find(e=>e.zone==z&&e.boss&&!e.inst);if(nf)h+='<p class="mu" style="margin:0">Drops by foe:</p>'+dropPanel(nf).replace('<span>Drops</span>','<span>Regular foes here</span>')+(bf?dropPanel(bf).replace('<span>Drops</span>','<span>The boss</span>'):'')}
  return h;
}

Object.defineProperties(X,{gainItem:{get:()=>gainItem,configurable:true},rndGear:{get:()=>rndGear,configurable:true},canEq:{get:()=>canEq,configurable:true},fight:{get:()=>fight,configurable:true}});