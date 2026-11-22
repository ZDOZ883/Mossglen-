import { X } from './registry';
import { FM, FOOD, GP, H, IT, SL, XS, adv, lv, maxhp, petRoll, skPet, weak } from './01-species-pets';
import { ACCL, E, ZN, dropTier, elv, gearSync, qrank, rsLv, scopeTxt, skey, zoneOpen } from './02-gear-data';
import { RD, raidKill, raidOk } from './03-world-expeditions';
import { CL, RT, armor, dwf, eHitP, ef, emax, hit, hitP, maxHit, memDpr, set_hits, shT } from './04-loadout';
// Fight maths, loot, combat rounds, combat view. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export function fight(e:Enemy){
  const Ep=hitP(e)*(maxHit(e)+1)/2*(1+dwf())+memDpr(e),rounds=Math.max(1,e.hp/Math.max(.01,Ep));
  const Ee=eHitP(e)*(emax(e)+1)/2*(1-armor())*(1+FM![X.S.form].taken)*(1-Math.min(.6,X.pk('taken')+X.cb('taken')+shT()+(X.onTask(e)?X.cb('ttaken'):0))),reg=maxhp()*.01*RT*(1+FM![X.S.form].regen+X.cb('regen'));
  return{ttk:rounds*RT,dmg:Math.max(0,(Ee-reg)*rounds-maxhp()*X.pk('heal'))};
}
export function canEq(it:Item){if(it.rs)return rsLv(it.rs)>=it.req;return lv(X.S.xp[SL.includes(it.slot)?'Attack':it.slot=='trinket'?'Vitality':'Defense'])>=it.req}
export function autoEq(id:string){const it=IT[id];if(it.slot=='ring'){if(!canEq(it))return;const k=!X.S.eq.ring1?'ring1':!X.S.eq.ring2?'ring2':null;if(k){X.S.eq[k]=id;X.say('Equipped '+it.n+'.');gearSync()}return}if(it.slot=='cloak'){if(!X.S.cape&&canEq(it)){X.S.cape='I:'+id;X.refreshFx();X.say('Wearing '+it.n+'.')}return}const cur=X.S.eq[it.slot];if(!cur&&canEq(it)){X.S.eq[it.slot]=id;X.say('Equipped '+it.n+'.');gearSync()}}
export function gainItem(id:string){const it=IT[id];if(X.S.own[id]){const v=Math.round((GP[it.tier]||50)*.4);X.S.a+=v;X.say('Duplicate '+it.n+' sold for '+v+' acorns.');return}X.S.own[id]=1;X.S.col[id]=1;X.say('Rare drop: '+it.n+'!');autoEq(id)}
export function rndGear(t:number){const ac=()=>{const sl=['ring','neck','cloak'][Math.floor(Math.random()*3)];return ACCL[sl]+Math.floor(Math.random()*4)+'_'+t};const pool=[0,1,2].map(i=>'w'+i+t).concat([0,1,2].map(i=>'x'+i+t),[0,1,2].map(i=>'o'+i+t),['y'+t,'b'+t,'h'+t,'g'+t,ac(),ac()]);return pool[Math.floor(Math.random()*pool.length)]+'d'}
export function loot(e:Enemy,quiet?:boolean){
  const z=e.zone,g=1+ef('drop')+X.cb('drop')+FM[X.S.form].drop+(X.onTask(e)?.1+(X.S.su.fort?.25:0)+X.cb('tdrop'):0),t=dropTier(z),k='z'+z+(e.boss?'b':'m');
  if(Math.random()<.6){const m=ZN[z][4];X.S.inv[m]=(X.S.inv[m]||0)+1+(Math.random()<.4?1:0)}
  X.S.pity[k]=(X.S.pity[k]||0)+1;
  if(z>7){const ck=k+'c',cn=ZN[z][6];X.S.pity[ck]=(X.S.pity[ck]||0)+1;if(Math.random()<(e.boss?1/6:1/40)*g||X.S.pity[ck]>=(e.boss?18:100)){X.S.pity[ck]=0;X.S.inv[cn!]=(X.S.inv[cn!]||0)+1}}
  if(z<8&&(Math.random()<(e.boss?.1:1/64)*g||X.S.pity[k]>=(e.boss?40:150))){X.S.pity[k]=0;gainItem(rndGear(t))}
  if(e.boss&&z>7){const hk='z'+z+'h';X.S.pity[hk]=(X.S.pity[hk]||0)+1;if(Math.random()<g/30||X.S.pity[hk]>=70){X.S.pity[hk]=0;gainItem(rndGear(z))}}
  if(e.boss){const tk='z'+z+'t';X.S.pity[tk]=(X.S.pity[tk]||0)+1;if(Math.random()<g/12||X.S.pity[tk]>=60){X.S.pity[tk]=0;gainItem('t'+z)}}
}
export function onKill(e:Enemy,quiet?:boolean){
  X.S.lsu=false;
  const m=maxhp(),xs=XS[X.S.stance],xm=1+ef('xp')+X.cb('xpm'),c0=CL(),ks=['Attack','Strength','Defense','Vitality'],b=ks.map(k=>lv(X.S.xp[k]));
  const ox=Math.min(1,Math.pow((elv(e)+15)/Math.max(1,c0),2));
  const fg=X.fighters(),cm=X.S.cmd&&fg.length>0,sp=cm?.6:1;
  ks.forEach((k,i)=>X.S.xp[k]+=e.xp*xs[i+1]*xm*ox*sp);
  const g=Math.round(e.a*(1+ef('gold')+FM[X.S.form].gold));X.S.a+=g;X.S.kc[e.id]=(X.S.kc[e.id]||0)+1;if(!e.inst)X.slayKill(e);
  if(fg.length){X.ldx(e.xp*(xs[5]+(cm?2.4:0))*xm*ox);fg.forEach(k=>X.mxp(k,e.xp*1.6*ox))}
  X.S.hp=Math.min(m,X.S.hp+m*X.pk('heal'));
  ks.forEach((k,i)=>{if(lv(X.S.xp[k])>b[i])X.say(k+' reaches level '+lv(X.S.xp[k])+'.')});
  const c1=CL();if(c1>c0)X.say('Combat level '+c1+'.'+ZN.filter(z=>z[1]>c0&&z[1]<=c1&&!z[5]).map(z=>' New zone: '+z[0]+'.').join(''));
  ['Attack','Strength','Defense','Vitality'].forEach(skPet);
  if(e.boss&&!e.inst)petRoll('p_z'+e.zone,1000+400*e.zone);
  if(!quiet)hit('<b>You defeat '+e.n+'. +'+g+' acorns.</b>');
  if(e.raid)raidKill(e,quiet);else loot(e);
}
export function cround(e:Enemy,quiet?:boolean){
  const m=maxhp();
  if(e.raid){const r=RD.find(x=>x.id==e.raid)!;if(!raidOk(r)){X.S.cur=null;X.S.ehp=null;X.say('The raid party broke up. You pull out of '+r.n+'.');return}X.S.rr=(X.S.rr||0)+1}
  if(X.S.ehid!==e.id||X.S.ehp==null){X.S.ehid=e.id;X.S.ehp=e.hp;X.S.rr=0;if(!quiet)set_hits([])}
  if(X.S.hp<m*.55){
    const hl=1+ef('heal')+X.cb('heal')+lv(X.S.xp.Cooking)*.004,fk=Object.keys(FOOD).filter(k=>X.S.inv[k]>0).sort((a,b)=>FOOD[a]-FOOD[b]),k=fk.find(q=>FOOD[q]*hl>=m*.15)||fk[fk.length-1];
    if(k){X.S.inv[k]--;const h=Math.round(FOOD[k]*hl);X.S.hp=Math.min(m,X.S.hp+h);if(!quiet)hit('You eat '+k+' (+'+h+').')}
  }
  if(Math.random()<hitP(e)){let d=1+Math.floor(Math.random()*maxHit(e));const cr=Math.random()<X.cb('crit');if(cr)d*=2;X.S.ehp-=d+Math.round(memDpr(e)*(.75+Math.random()*.5));if(X.cb('lsteal'))X.S.hp=Math.min(m,X.S.hp+d*X.cb('lsteal'));if(!quiet)hit('You '+(cr?'crit for ':'hit ')+d+'.')}else if(!quiet)hit('You miss.');
  if(X.S.ehp>0&&dwf()>0&&Math.random()<hitP(e)){const od=1+Math.floor(Math.random()*Math.max(1,Math.floor(maxHit(e)*dwf())));X.S.ehp-=od;if(!quiet)hit('Your off-hand hits for '+od+'.')}
  if(X.S.ehp<=0){X.S.ehp=null;onKill(e,quiet);return}
  if(Math.random()<eHitP(e)){const d=Math.max(1,Math.round((1+Math.floor(Math.random()*emax(e)))*(1-armor())*(1+FM![X.S.form].taken)*(1-Math.min(.6,X.pk('taken')+X.cb('taken')+shT()+(X.onTask(e)?X.cb('ttaken'):0)))));X.S.hp-=d;if(!quiet)hit(e.n+' hits you for '+d+'.')}else if(!quiet)hit(e.n+' misses.');
  if(X.S.hp<=0&&X.cb('ls')>0&&!X.S.lsu){X.S.lsu=true;X.S.hp=1;if(!quiet)hit('Last stand! You hold on with 1 hp.')}
  if(X.S.hp<=0){X.S.lsu=false;X.S.hp=m/2;X.S.p=-15;X.S.ehp=null;X.say(e.n+' overpowers you. You limp off to rest a while.');if(e.raid){X.S.cur=null;X.say('The raid is lost. Resupply, then try again.')}if(!quiet)hit('You are knocked out.');return}
  X.S.hp=Math.min(m,X.S.hp+m*.01*RT*(1+FM![X.S.form].regen+X.cb('regen')));
}
export function cycle(k:string){const ot=k=='ring1'?X.S.eq.ring2:k=='ring2'?X.S.eq.ring1:null;const o=Object.keys(X.S.own).filter(i=>IT[i].slot==skey(k)&&canEq(IT[i])&&i!=ot).sort((a,b)=>IT[a].tier-IT[b].tier||qrank(IT[a])-qrank(IT[b])||(IT[a].fam||0)-(IT[b].fam||0));if(!o.length)return;X.S.eq[k]=o[(o.indexOf(X.S.eq[k])+1)%o.length];gearSync()}
export const price=(it:Item)=>Math.round(GP[it.tier]*(it.cmb?1.3:1)*(it.q=='s'?.6:1));
export function shopBuy(id:string){const it=IT[id],c=price(it);if(!X.S.own[id]&&X.S.a>=c){X.S.a-=c;X.S.own[id]=1;X.say('Bought '+it.n+'.');autoEq(id)}}
export function istat(it:Item){if(it.eff){const N:Record<string,any>={gold:'acorns',dmg:'damage',heal:'food healing',drop:'rare drops',xp:'combat xp'};return Object.keys(it.eff).map(k=>'+'+Math.round(it.eff[k]*100)+'% '+N[k]).join(', ')}if(it.fx)return X.fxTxt(it.fx.map((e:any)=>[e[0],e[1]]))+scopeTxt(it);if(it.kind=='2h')return '+'+it.stat+' attack · two-handed: +30% damage, no off-hand';if(it.kind=='off')return '+'+it.stat+' attack · off-hand for '+it.st+': dual wield adds an extra strike';if(it.kind=='shield')return '+'+it.stat+' defense · −8% damage taken';return '+'+it.stat+(it.slot=='body'||it.slot=='head'||it.slot=='legs'?' defense':' attack')}
export function reqText(it:Item){if(it.rs)return ({gath:'any gathering skill',prod:'any production skill'}[it.rs]||it.rs)+' '+it.req;return it.slot=='body'||it.slot=='head'||it.slot=='legs'?'Defense '+it.req:'Attack '+it.req}
export function arenaView(){
  const c=X.S.cur&&X.S.cur.k=='c'?E.find(e=>e.id==X.S.cur.id):null,food=Object.keys(FOOD).reduce((s,k)=>s+(X.S.inv[k]||0),0);
  let h='<div class="arena"><div class="nm"><b>You</b><span id="ph" class="mu"></span></div><div class="bar"><i id="hp"></i></div><small class="mu">'+X.S.style+(c?' · hit '+Math.round(hitP(c)*100)+'% · max hit '+maxHit(c)+(adv(X.S.style,c.type)>0?' · type advantage':adv(X.S.style,c.type)<0?' · type disadvantage':''):'')+' · food '+food+' (eaten below 55% hp)</small>';
  if(c)h+='<div class="nm" style="margin-top:12px"><b>'+(c.boss?'Boss: ':'')+c.n+'</b><span id="eh" class="mu"></span></div><div class="bar hp"><i id="ehb"></i></div><small class="mu">'+c.type+' · weak to '+weak(c.type)+' · hit '+Math.round(eHitP(c)*100)+'% · max hit '+emax(c)+(c.raid?' · enrages after '+c.soft+' rounds (round '+(X.S.rr||0)+')':'')+'</small>';
  else h+='<p class="mu" style="margin:12px 0 0">Not fighting. Pick an enemy below.</p>';
  return h+'<div id="hits" class="hits"></div></div>';
}
export function statTiles(){
  const xs=XS[X.S.stance],note={Attack:'Hit chance',Strength:'Max hit',Defense:'Enemy hit chance',Vitality:'Health '+maxhp()};
  return '<div class="pick">'+['Attack','Strength','Defense','Vitality'].map((k,i)=>'<div class="row'+(xs[i+1]>0?' on':'')+'" style="flex-direction:column;align-items:flex-start;gap:2px"><span>'+k+' · '+lv(X.S.xp[k])+'</span><small>'+(note as any)[k]+'</small><div class="bar xp" style="width:100%"><i style="width:'+X.pcx(k)+'%"></i></div></div>').join('')+'</div>';
}
export function combatView(){
  const m=maxhp(),st=X.S.style,z=X.S.zone,zz=ZN[z],cl=CL(),fgn=X.fighters();
  let h='<h2>Combat · level '+cl+'</h2>'+arenaView();
  h+='<p class="sub">Melee beats Ranged, Ranged beats Magic, Magic beats Melee: counter an enemy for +25% damage.</p>';
  h+='<div class="pick" style="grid-template-columns:repeat(3,1fr)">'+SL.map(s=>'<button class="row'+(st==s?' on':'')+'" data-style="'+s+'">'+s+'<small>'+(X.S.eq[s]?IT[X.S.eq[s]].n:'No weapon')+'</small></button>').join('')+'</div>';
  h+='<h2>Combat stats</h2>'+statTiles();
  h+='<h2>Stance <span class="mu" style="display:inline">· where xp goes</span></h2><div class="chips">'+Object.keys(XS).map(k=>'<button class="'+(X.S.stance==k?'on':'')+'" data-stance="'+k+'">'+XS[k][0]+'</button>').join('')+'</div><p class="mu">'+XS[X.S.stance][6]+'</p><div class="chips"><button class="'+(X.S.cmd?'on':'')+'" data-cmd="1">Command: '+(X.S.cmd?'on':'off')+'</button></div><p class="mu">Command splits your xp with Leadership. While members fight beside you, your stat xp drops to 60% and Leadership gains 2.4× a kill’s base xp.'+(X.S.cmd&&!fgn.length?' No members are fighting with you, so Command is doing nothing and you keep full xp.':'')+'</p>';
  h+='<h2>Form <span class="mu" style="display:inline">· combat buffs</span></h2><div class="chips">'+Object.keys(FM).map(k=>'<button class="'+(X.S.form==k?'on':'')+'" data-form="'+k+'"'+(cl<FM[k].cl?' disabled':'')+'>'+FM[k].n+(cl<FM[k].cl?' (CL '+FM[k].cl+')':'')+'</button>').join('')+'</div><p class="mu">'+FM[X.S.form].d+'</p>';
  h+='<p class="mu">Fighting beside you: '+(fgn.length?fgn.map(k=>H[k].n).join(', '):'no one. Recruit members in the Party tab.')+'</p>';
  h+='<h2>Zones</h2><div class="chips">'+ZN.map((q,i)=>'<button class="'+(z==i?'on':'')+'" data-zone="'+i+'"'+(zoneOpen(i)?'':' disabled')+'>'+q[0]+(zoneOpen(i)?'':cl<q[1]?' (CL '+q[1]+')':' (Gate '+q[5]+')')+'</button>').join('')+'</div>';
  const kills=E.filter(x=>x.zone==z&&!x.boss&&!x.inst).reduce((s,x)=>s+(X.S.kc[x.id]||0),0);
  h+=E.filter(e=>e.zone==z&&!e.inst).map(e=>{const f=fight(e),on=X.S.cur&&X.S.cur.k=='c'&&X.S.cur.id==e.id,lock=e.boss&&kills<30;
    return '<button class="row'+(on?' on':'')+'" data-do="c:'+e.id+'"'+(lock?' disabled':'')+'><span>'+(e.boss?'Boss: ':'')+e.n+'<small>'+(X.onTask(e)?'On task · ':'')+e.type+' · '+e.hp+' hp · weak to '+weak(e.type)+' · '+(lock?'defeat '+kills+'/30 foes here first':'kills '+(X.S.kc[e.id]||0))+'</small></span><small class="'+(f.dmg>m*.7?'bad':'')+'">~'+Math.round(f.ttk)+'s<br>−'+Math.round(f.dmg/m*100)+'% hp</small></button>'}).join('');
  const t=dropTier(z);
  h+=z>7?'<h2>Loot</h2><p class="mu">Every kill pays acorns and sometimes '+zz[4]+'. Foes here drop '+zz[6]+' (1/40, or 1/6 from the boss, with bad-luck protection). Cores go into tier '+z+' gear and the next gate. No gear drops here: it is all crafted. The boss also drops '+IT['t'+z].n+' (1/12).</p>':'<h2>Loot</h2><p class="mu">Every kill pays acorns and sometimes '+zz[4]+'. Rare gear roll: 1/64 per kill, 1/10 from the boss, with bad-luck protection. Pool: '+[0,1,2].map(i=>IT['w'+i+t].n).concat([IT['b'+t].n,IT['h'+t].n]).join(', ')+'. The boss also drops '+IT['t'+z].n+' (1/12).</p>';
  return h;
}

Object.defineProperties(X,{gainItem:{get:()=>gainItem,configurable:true},rndGear:{get:()=>rndGear,configurable:true},canEq:{get:()=>canEq,configurable:true},fight:{get:()=>fight,configurable:true}});