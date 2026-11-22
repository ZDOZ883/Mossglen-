import { S, say } from './00-state';
import { X } from './registry';
import { FM, FOOD, GP, H, IT, SL, XS, adv, cb, cl, fighters, ldx, lv, maxhp, mxp, onTask, petRoll, pk, skPet, weak } from './01-species-pets';
import { ACCL, E, ZN, dropTier, elv, gearSync, qrank, rsLv, scopeTxt, skey, zoneOpen } from './02-gear-data';
import { RD, raidKill, raidOk } from './03-world-expeditions';
import { CL, RT, armor, dwf, eHitP, ef, emax, hit, hitP, maxHit, memDpr, set_hits, shT } from './04-loadout';
// Fight maths, loot, combat rounds, combat view. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export function fight(e:Enemy){
  const Ep=hitP(e)*(maxHit(e)+1)/2*(1+dwf())+memDpr(e),rounds=Math.max(1,e.hp/Math.max(.01,Ep));
  const Ee=eHitP(e)*(emax(e)+1)/2*(1-armor())*(1+FM![S.form].taken)*(1-Math.min(.6,pk('taken')+cb('taken')+shT()+(onTask(e)?cb('ttaken'):0))),reg=maxhp()*.01*RT*(1+FM![S.form].regen+cb('regen'));
  return{ttk:rounds*RT,dmg:Math.max(0,(Ee-reg)*rounds-maxhp()*pk('heal'))};
}
export function canEq(it:Item){if(it.rs)return rsLv(it.rs)>=it.req;return lv(S.xp[SL.includes(it.slot)?'Attack':it.slot=='trinket'?'Vitality':'Defense'])>=it.req}
export function autoEq(id:string){const it=IT[id];if(it.slot=='ring'){if(!canEq(it))return;const k=!S.eq.ring1?'ring1':!S.eq.ring2?'ring2':null;if(k){S.eq[k]=id;say('Equipped '+it.n+'.');gearSync()}return}if(it.slot=='cloak'){if(!S.cape&&canEq(it)){S.cape='I:'+id;X.refreshFx();say('Wearing '+it.n+'.')}return}const cur=S.eq[it.slot];if(!cur&&canEq(it)){S.eq[it.slot]=id;say('Equipped '+it.n+'.');gearSync()}}
export function gainItem(id:string){const it=IT[id];if(S.own[id]){const v=Math.round((GP[it.tier]||50)*.4);S.a+=v;say('Duplicate '+it.n+' sold for '+v+' acorns.');return}S.own[id]=1;S.col[id]=1;say('Rare drop: '+it.n+'!');autoEq(id)}
export function rndGear(t:number){const ac=()=>{const sl=['ring','neck','cloak'][Math.floor(Math.random()*3)];return ACCL[sl]+Math.floor(Math.random()*4)+'_'+t};const pool=[0,1,2].map(i=>'w'+i+t).concat([0,1,2].map(i=>'x'+i+t),[0,1,2].map(i=>'o'+i+t),['y'+t,'b'+t,'h'+t,'g'+t,ac(),ac()]);return pool[Math.floor(Math.random()*pool.length)]+'d'}
export function loot(e:Enemy,quiet?:boolean){
  const z=e.zone,g=1+ef('drop')+cb('drop')+FM[S.form].drop+(onTask(e)?.1+(S.su.fort?.25:0)+cb('tdrop'):0),t=dropTier(z),k='z'+z+(e.boss?'b':'m');
  if(Math.random()<.6){const m=ZN[z][4];S.inv[m]=(S.inv[m]||0)+1+(Math.random()<.4?1:0)}
  S.pity[k]=(S.pity[k]||0)+1;
  if(z>7){const ck=k+'c',cn=ZN[z][6];S.pity[ck]=(S.pity[ck]||0)+1;if(Math.random()<(e.boss?1/6:1/40)*g||S.pity[ck]>=(e.boss?18:100)){S.pity[ck]=0;S.inv[cn!]=(S.inv[cn!]||0)+1}}
  if(z<8&&(Math.random()<(e.boss?.1:1/64)*g||S.pity[k]>=(e.boss?40:150))){S.pity[k]=0;gainItem(rndGear(t))}
  if(e.boss&&z>7){const hk='z'+z+'h';S.pity[hk]=(S.pity[hk]||0)+1;if(Math.random()<g/30||S.pity[hk]>=70){S.pity[hk]=0;gainItem(rndGear(z))}}
  if(e.boss){const tk='z'+z+'t';S.pity[tk]=(S.pity[tk]||0)+1;if(Math.random()<g/12||S.pity[tk]>=60){S.pity[tk]=0;gainItem('t'+z)}}
}
export function onKill(e:Enemy,quiet?:boolean){
  S.lsu=false;
  const m=maxhp(),xs=XS[S.stance],xm=1+ef('xp')+cb('xpm'),c0=CL(),ks=['Attack','Strength','Defense','Vitality'],b=ks.map(k=>lv(S.xp[k]));
  const ox=Math.min(1,Math.pow((elv(e)+15)/Math.max(1,c0),2));
  const fg=fighters(),cm=S.cmd&&fg.length>0,sp=cm?.6:1;
  ks.forEach((k,i)=>S.xp[k]+=e.xp*xs[i+1]*xm*ox*sp);
  const g=Math.round(e.a*(1+ef('gold')+FM[S.form].gold));S.a+=g;S.kc[e.id]=(S.kc[e.id]||0)+1;if(!e.inst)X.slayKill(e);
  if(fg.length){ldx(e.xp*(xs[5]+(cm?2.4:0))*xm*ox);fg.forEach(k=>mxp(k,e.xp*1.6*ox))}
  S.hp=Math.min(m,S.hp+m*pk('heal'));
  ks.forEach((k,i)=>{if(lv(S.xp[k])>b[i])say(k+' reaches level '+lv(S.xp[k])+'.')});
  const c1=CL();if(c1>c0)say('Combat level '+c1+'.'+ZN.filter(z=>z[1]>c0&&z[1]<=c1&&!z[5]).map(z=>' New zone: '+z[0]+'.').join(''));
  ['Attack','Strength','Defense','Vitality'].forEach(skPet);
  if(e.boss&&!e.inst)petRoll('p_z'+e.zone,1000+400*e.zone);
  if(!quiet)hit('<b>You defeat '+e.n+'. +'+g+' acorns.</b>');
  if(e.raid)raidKill(e,quiet);else loot(e);
}
export function cround(e:Enemy,quiet?:boolean){
  const m=maxhp();
  if(e.raid){const r=RD.find(x=>x.id==e.raid)!;if(!raidOk(r)){S.cur=null;S.ehp=null;say('The raid party broke up. You pull out of '+r.n+'.');return}S.rr=(S.rr||0)+1}
  if(S.ehid!==e.id||S.ehp==null){S.ehid=e.id;S.ehp=e.hp;S.rr=0;if(!quiet)set_hits([])}
  if(S.hp<m*.55){
    const hl=1+ef('heal')+cb('heal')+lv(S.xp.Cooking)*.004,fk=Object.keys(FOOD).filter(k=>S.inv[k]>0).sort((a,b)=>FOOD[a]-FOOD[b]),k=fk.find(q=>FOOD[q]*hl>=m*.15)||fk[fk.length-1];
    if(k){S.inv[k]--;const h=Math.round(FOOD[k]*hl);S.hp=Math.min(m,S.hp+h);if(!quiet)hit('You eat '+k+' (+'+h+').')}
  }
  if(Math.random()<hitP(e)){let d=1+Math.floor(Math.random()*maxHit(e));const cr=Math.random()<cb('crit');if(cr)d*=2;S.ehp-=d+Math.round(memDpr(e)*(.75+Math.random()*.5));if(cb('lsteal'))S.hp=Math.min(m,S.hp+d*cb('lsteal'));if(!quiet)hit('You '+(cr?'crit for ':'hit ')+d+'.')}else if(!quiet)hit('You miss.');
  if(S.ehp>0&&dwf()>0&&Math.random()<hitP(e)){const od=1+Math.floor(Math.random()*Math.max(1,Math.floor(maxHit(e)*dwf())));S.ehp-=od;if(!quiet)hit('Your off-hand hits for '+od+'.')}
  if(S.ehp<=0){S.ehp=null;onKill(e,quiet);return}
  if(Math.random()<eHitP(e)){const d=Math.max(1,Math.round((1+Math.floor(Math.random()*emax(e)))*(1-armor())*(1+FM![S.form].taken)*(1-Math.min(.6,pk('taken')+cb('taken')+shT()+(onTask(e)?cb('ttaken'):0)))));S.hp-=d;if(!quiet)hit(e.n+' hits you for '+d+'.')}else if(!quiet)hit(e.n+' misses.');
  if(S.hp<=0&&cb('ls')>0&&!S.lsu){S.lsu=true;S.hp=1;if(!quiet)hit('Last stand! You hold on with 1 hp.')}
  if(S.hp<=0){S.lsu=false;S.hp=m/2;S.p=-15;S.ehp=null;say(e.n+' overpowers you. You limp off to rest a while.');if(e.raid){S.cur=null;say('The raid is lost. Resupply, then try again.')}if(!quiet)hit('You are knocked out.');return}
  S.hp=Math.min(m,S.hp+m*.01*RT*(1+FM![S.form].regen+cb('regen')));
}
export function cycle(k:string){const ot=k=='ring1'?S.eq.ring2:k=='ring2'?S.eq.ring1:null;const o=Object.keys(S.own).filter(i=>IT[i].slot==skey(k)&&canEq(IT[i])&&i!=ot).sort((a,b)=>IT[a].tier-IT[b].tier||qrank(IT[a])-qrank(IT[b])||(IT[a].fam||0)-(IT[b].fam||0));if(!o.length)return;S.eq[k]=o[(o.indexOf(S.eq[k])+1)%o.length];gearSync()}
export const price=(it:Item)=>Math.round(GP[it.tier]*(it.cmb?1.3:1)*(it.q=='s'?.6:1));
export function shopBuy(id:string){const it=IT[id],c=price(it);if(!S.own[id]&&S.a>=c){S.a-=c;S.own[id]=1;say('Bought '+it.n+'.');autoEq(id)}}
export function istat(it:Item){if(it.eff){const N:Record<string,any>={gold:'acorns',dmg:'damage',heal:'food healing',drop:'rare drops',xp:'combat xp'};return Object.keys(it.eff).map(k=>'+'+Math.round(it.eff[k]*100)+'% '+N[k]).join(', ')}if(it.fx)return X.fxTxt(it.fx.map((e:any)=>[e[0],e[1]]))+scopeTxt(it);if(it.kind=='2h')return '+'+it.stat+' attack · two-handed: +30% damage, no off-hand';if(it.kind=='off')return '+'+it.stat+' attack · off-hand for '+it.st+': dual wield adds an extra strike';if(it.kind=='shield')return '+'+it.stat+' defense · −8% damage taken';return '+'+it.stat+(it.slot=='body'||it.slot=='head'||it.slot=='legs'?' defense':' attack')}
export function reqText(it:Item){if(it.rs)return ({gath:'any gathering skill',prod:'any production skill'}[it.rs]||it.rs)+' '+it.req;return it.slot=='body'||it.slot=='head'||it.slot=='legs'?'Defense '+it.req:'Attack '+it.req}
export function arenaView(){
  const c=S.cur&&S.cur.k=='c'?E.find(e=>e.id==S.cur.id):null,food=Object.keys(FOOD).reduce((s,k)=>s+(S.inv[k]||0),0);
  let h='<div class="arena"><div class="nm"><b>You</b><span id="ph" class="mu"></span></div><div class="bar"><i id="hp"></i></div><small class="mu">'+S.style+(c?' · hit '+Math.round(hitP(c)*100)+'% · max hit '+maxHit(c)+(adv(S.style,c.type)>0?' · type advantage':adv(S.style,c.type)<0?' · type disadvantage':''):'')+' · food '+food+' (eaten below 55% hp)</small>';
  if(c)h+='<div class="nm" style="margin-top:12px"><b>'+(c.boss?'Boss: ':'')+c.n+'</b><span id="eh" class="mu"></span></div><div class="bar hp"><i id="ehb"></i></div><small class="mu">'+c.type+' · weak to '+weak(c.type)+' · hit '+Math.round(eHitP(c)*100)+'% · max hit '+emax(c)+(c.raid?' · enrages after '+c.soft+' rounds (round '+(S.rr||0)+')':'')+'</small>';
  else h+='<p class="mu" style="margin:12px 0 0">Not fighting. Pick an enemy below.</p>';
  return h+'<div id="hits" class="hits"></div></div>';
}
export function statTiles(){
  const xs=XS[S.stance],note={Attack:'Hit chance',Strength:'Max hit',Defense:'Enemy hit chance',Vitality:'Health '+maxhp()};
  return '<div class="pick">'+['Attack','Strength','Defense','Vitality'].map((k,i)=>'<div class="row'+(xs[i+1]>0?' on':'')+'" style="flex-direction:column;align-items:flex-start;gap:2px"><span>'+k+' · '+lv(S.xp[k])+'</span><small>'+(note as any)[k]+'</small><div class="bar xp" style="width:100%"><i style="width:'+X.pcx(k)+'%"></i></div></div>').join('')+'</div>';
}
export function combatView(){
  const m=maxhp(),st=S.style,z=S.zone,zz=ZN[z],cl=CL(),fgn=fighters();
  let h='<h2>Combat · level '+cl+'</h2>'+arenaView();
  h+='<p class="sub">Melee beats Ranged, Ranged beats Magic, Magic beats Melee: counter an enemy for +25% damage.</p>';
  h+='<div class="pick" style="grid-template-columns:repeat(3,1fr)">'+SL.map(s=>'<button class="row'+(st==s?' on':'')+'" data-style="'+s+'">'+s+'<small>'+(S.eq[s]?IT[S.eq[s]].n:'No weapon')+'</small></button>').join('')+'</div>';
  h+='<h2>Combat stats</h2>'+statTiles();
  h+='<h2>Stance <span class="mu" style="display:inline">· where xp goes</span></h2><div class="chips">'+Object.keys(XS).map(k=>'<button class="'+(S.stance==k?'on':'')+'" data-stance="'+k+'">'+XS[k][0]+'</button>').join('')+'</div><p class="mu">'+XS[S.stance][6]+'</p><div class="chips"><button class="'+(S.cmd?'on':'')+'" data-cmd="1">Command: '+(S.cmd?'on':'off')+'</button></div><p class="mu">Command splits your xp with Leadership. While members fight beside you, your stat xp drops to 60% and Leadership gains 2.4× a kill’s base xp.'+(S.cmd&&!fgn.length?' No members are fighting with you, so Command is doing nothing and you keep full xp.':'')+'</p>';
  h+='<h2>Form <span class="mu" style="display:inline">· combat buffs</span></h2><div class="chips">'+Object.keys(FM).map(k=>'<button class="'+(S.form==k?'on':'')+'" data-form="'+k+'"'+(cl<FM[k].cl?' disabled':'')+'>'+FM[k].n+(cl<FM[k].cl?' (CL '+FM[k].cl+')':'')+'</button>').join('')+'</div><p class="mu">'+FM[S.form].d+'</p>';
  h+='<p class="mu">Fighting beside you: '+(fgn.length?fgn.map(k=>H[k].n).join(', '):'no one. Recruit members in the Party tab.')+'</p>';
  h+='<h2>Zones</h2><div class="chips">'+ZN.map((q,i)=>'<button class="'+(z==i?'on':'')+'" data-zone="'+i+'"'+(zoneOpen(i)?'':' disabled')+'>'+q[0]+(zoneOpen(i)?'':cl<q[1]?' (CL '+q[1]+')':' (Gate '+q[5]+')')+'</button>').join('')+'</div>';
  const kills=E.filter(x=>x.zone==z&&!x.boss&&!x.inst).reduce((s,x)=>s+(S.kc[x.id]||0),0);
  h+=E.filter(e=>e.zone==z&&!e.inst).map(e=>{const f=fight(e),on=S.cur&&S.cur.k=='c'&&S.cur.id==e.id,lock=e.boss&&kills<30;
    return '<button class="row'+(on?' on':'')+'" data-do="c:'+e.id+'"'+(lock?' disabled':'')+'><span>'+(e.boss?'Boss: ':'')+e.n+'<small>'+(onTask(e)?'On task · ':'')+e.type+' · '+e.hp+' hp · weak to '+weak(e.type)+' · '+(lock?'defeat '+kills+'/30 foes here first':'kills '+(S.kc[e.id]||0))+'</small></span><small class="'+(f.dmg>m*.7?'bad':'')+'">~'+Math.round(f.ttk)+'s<br>−'+Math.round(f.dmg/m*100)+'% hp</small></button>'}).join('');
  const t=dropTier(z);
  h+=z>7?'<h2>Loot</h2><p class="mu">Every kill pays acorns and sometimes '+zz[4]+'. Foes here drop '+zz[6]+' (1/40, or 1/6 from the boss, with bad-luck protection). Cores go into tier '+z+' gear and the next gate. No gear drops here: it is all crafted. The boss also drops '+IT['t'+z].n+' (1/12).</p>':'<h2>Loot</h2><p class="mu">Every kill pays acorns and sometimes '+zz[4]+'. Rare gear roll: 1/64 per kill, 1/10 from the boss, with bad-luck protection. Pool: '+[0,1,2].map(i=>IT['w'+i+t].n).concat([IT['b'+t].n,IT['h'+t].n]).join(', ')+'. The boss also drops '+IT['t'+z].n+' (1/12).</p>';
  return h;
}

Object.defineProperties(X,{gainItem:{get:()=>gainItem,configurable:true},rndGear:{get:()=>rndGear,configurable:true},canEq:{get:()=>canEq,configurable:true},fight:{get:()=>fight,configurable:true}});