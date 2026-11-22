import { gameState, say } from './00-state';
import { X } from './registry';
import { DISHES, FM, GL, MEMBERS, IT, T, asg, cb, cl, fighters, ldx, lv, maxhp, mxp, petRoll, pm } from './01-species-pets';
import { AK, CTX, D0, ENEMIES, GSK, H0, PSK, XK, ZN, fxTxt, gateOk } from './02-gear-data';
// Gates, raids, expeditions, harvest raids. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
// ---------- ancient gates
export const GATE=[
{n:'The Rootgate',gather:95,prod:90,cl:95,sk:{},items:{'Hollow Heart':5,'Badger Claw':5,'Crow Feather':5,'star dust':250},a:2000000,d:'Sealed roots wall off the deep wood. Opens Deepwood Hollow, level 100 gathering, tier 8 gear, the first Moonlit raid and the Rootgate Descent.'},
{n:'The Wyrmgate',gather:105,prod:100,cl:105,sk:{Slayer:90},items:{'Deepwood Core':15,'deep root':200,'Crow Feather':15},a:12000000,d:'A scaled door under the ridge. Opens Wyrmscale Ridge, level 110 gathering, tier 9 gear and tougher raids.'},
{n:'The Eclipse Gate',gather:115,prod:110,cl:115,sk:{Slayer:105,Leadership:90},items:{'Wyrm Core':20,'wyrm scale':300,'Deepwood Core':20},a:48000000,d:'The last seal. Opens Eclipse Sanctum, level 120 gathering, tier 10 gear and the Eclipse Citadel.'}];
export function gateChecks(i:number){const g=GATE[i-1],c=[];
  if(i>1)c.push([GATE[i-2].n+' open',gateOk(i-1)]);
  c.push(['Gathering skills at '+g.gather,GSK.every(k=>lv(gameState.xp[k])>=g.gather)]);
  c.push(['Production skills at '+g.prod,PSK.every(k=>lv(gameState.xp[k])>=g.prod)]);
  c.push(['Combat level '+g.cl,X.CL()>=g.cl]);
  Object.keys(g.sk).forEach(k=>c.push([k+' level '+(g.sk as any)[k],lv(gameState.xp[k])>=(g.sk as any)[k]]));
  Object.keys(g.items).forEach(k=>c.push([(g.items as any)[k]+' × '+k+' ('+(gameState.inv[k]||0)+')',(gameState.inv[k]||0)>=(g.items as any)[k]]));
  c.push([g.a.toLocaleString()+' acorns',gameState.a>=g.a]);return c}
export function openGate(i:number){
  if(gameState.gates[i]||!GATE[i-1]||!gateChecks(i).every(c=>c[1]))return;
  const g=GATE[i-1];Object.keys(g.items).forEach(k=>gameState.inv[k]-=(g.items as any)[k]);gameState.a-=g.a;gameState.gates[i]=1;
  say(g.n+' grinds open!'+ZN.filter(z=>z[5]==i).map(z=>' New zone: '+z[0]+'.').join(''));
}
export const OPEN:Record<string,boolean>={};
export const fold=(id:string,title:string,body:string)=>'<details class="fold" data-fold="'+id+'"'+(OPEN[id]?' open':'')+'><summary><h2>'+title+'</h2></summary>'+body+'</details>';
export function gatesView(){
  return fold('gates','Ancient gates','<p class="sub">Past level 99 the valley is sealed. Each gate is a long job: levels, rare goods and a heavy toll. Opening one unlocks deeper gathering, a new zone, craft-only gear, harder raids and food.</p>'+GATE.map((g,j)=>{const i=j+1,open=gateOk(i),ck=gateChecks(i);
    return '<div class="row" style="flex-direction:column;align-items:stretch"><span>'+g.n+(open?' · <b class="good">Open</b>':'')+'<small>'+g.d+'</small></span>'+(open?'':'<small>'+ck.map(c=>(c[1]?'✓ ':'✗ ')+c[0]).join('<br>')+'</small><div style="margin-top:8px"><button class="btn" data-gate="'+i+'"'+(ck.every(c=>c[1])?'':' disabled')+'>Open the gate</button></div>')+'</div>'}).join(''));
}

// ---------- combat raids
export const RD:Raid[]=[
{id:'r0',n:'The Hollow Warren',cl:85,gate:0,party:2,mlv:25,lvl:90,H:112740,D:91.3,ref:1278,rw:36000,core:null,tr:'t11',st:[['Warren Sentries','Melee',1,1],['Burrow Alchemist','Magic',1.2,1.1],['Tunnel Behemoth','Melee',1.6,1.3],['Matriarch Brindlemaw','Ranged',4,1.7]]},
{id:'r1',n:'Thornspire Keep',cl:100,gate:1,party:3,mlv:50,lvl:105,H:310720,D:101.5,ref:2113,rw:150000,core:['Deepwood Core',2],tr:'t12',st:[['Thorn Wardens','Melee',1,1],['Keep Sappers','Ranged',1.1,1.1],['Spire Hexcaller','Magic',1.4,1.2],['Barbfang the Gatekeeper','Melee',1.8,1.4],['Queen Bramblethorn','Ranged',4.5,1.8]]},
{id:'r2',n:'The Gloamwyrm Lair',cl:110,gate:2,party:4,mlv:75,lvl:115,H:752120,D:195.8,ref:3487,rw:540000,core:['Wyrm Core',2],tr:'t13',st:[['Scale Cultists','Magic',1,1],['Ashen Drakelings','Ranged',1.1,1.1],['Gloam Brood Mother','Melee',1.5,1.25],['Twin Wyrmguards','Melee',1.8,1.4],['Ember Oracle','Magic',2,1.5],['Gloamwyrm Vaerath','Ranged',5,2]]},
{id:'r3',n:'The Eclipse Citadel',cl:118,gate:3,party:5,mlv:100,lvl:125,H:1842473,D:237.6,ref:5873,rw:1800000,core:['Eclipse Core',3],tr:'t14',st:[['Citadel Vanguard','Melee',1,1],['Dusk Archers','Ranged',1.1,1.1],['Umbral Magi','Magic',1.3,1.25],['Eclipse Knight-Commander','Melee',1.7,1.4],['The Hollow Choir','Magic',1.9,1.5],['Warden of the Last Light','Ranged',2.2,1.6],['The Eclipse Sovereign','Melee',5.5,2.1]]}];
// Acorn payout per raid, tuned so a raid earns about what farming its matching zone does (the first raid used to pay well above that).
export const RPAY:Record<string,number>={r0:1.15,r1:1.3,r2:1.05,r3:.8};
RD.forEach(r=>r.st.forEach((st:any,j:number)=>{const hp=Math.round(r.H*st[2]);ENEMIES.push({id:r.id+'s'+j,zone:7,raid:r.id,inst:1,stage:j,lvl:r.lvl,n:st[0],type:st[1],hp,dps:r.D*st[3],soft:Math.round(hp/r.ref),xp:Math.round(hp*XK[10]*.5),a:Math.round(hp*AK[10]*.3*RPAY[r.id]),boss:j==r.st.length-1})}));

// ---------- delves: short raids with boons
export const DX:Record<string,Partial<Delve>>={hollow:{cl:10,party:0,mlv:0,zb:1,st:[['Oak Gnawers','Melee'],['Rot Sprites','Magic'],['The Hollow Heart','Magic']]},
sett:{cl:30,party:1,mlv:12,zb:3,st:[['Sett Guards','Melee'],['Tunnel Diggers','Ranged'],['Badger Chieftain','Melee']]},
roost:{cl:58,party:2,mlv:30,zb:5,st:[['Roost Scouts','Ranged'],['Carrion Mystics','Magic'],['The Crow King','Ranged']]},
root:{cl:92,party:3,mlv:60,zb:8,st:[['Rootbound Wardens','Melee'],['Gloom Weavers','Magic'],['The Rootgate Keeper','Ranged']]},
wyrmc:{cl:104,party:3,mlv:80,zb:9,st:[['Cellar Drakes','Magic'],['Scale Brutes','Melee'],['The Wyrm Warden','Melee']]},
vault:{cl:114,party:4,mlv:100,zb:10,st:[['Vault Sentinels','Melee'],['Umbral Casters','Magic'],['The Eclipse Curator','Ranged']]}};
export const DHM=[1.5,2,4],DDM=[1.2,1.3,1.8],dvTm=(t:number)=>[1,1.4,1.9,2.5,3.2][t-1],dvTd=(t:number)=>[1,1.25,1.55,1.9,2.3][t-1];
DISHES.forEach(d=>{const x=DX[d.id];Object.assign(d,x);for(let t=1;t<=5;t++)x.st.forEach((st:any,j:number)=>{const hp=Math.round(H0[x.zb!]*DHM[j]*dvTm(t));ENEMIES.push({id:'d_'+d.id+'_'+t+'_'+j,zone:x.zb!,inst:1,dv:d.id,tier:t,stage:j,lvl:ZN[x.zb!][1],n:st[0],type:st[1],hp,dps:D0[x.zb!]*DDM[j]*dvTd(t),xp:Math.round(hp*XK[x.zb!]*1.2),a:Math.round(hp*AK[x.zb!]*.8),boss:j==2})})});
// ---------- expeditions (delves sent out on a timer)
export let exSel:Record<string,any>={d:null,l:null,m:[],b:null};
export const EXB:Record<string,string[]>={might:['Might','+12% party damage'],stone:['Stone Skin','−10% damage taken'],focus:['Keen Eye','+8% party damage'],vigor:['Vigor','+10% party health'],crit:['Killer Instinct','+10% party damage'],fortune:['Fortune','+25% rewards'],wind:['Second Wind','+10% party health']};
export const exDur=(d:Delve,t:number)=>Math.min(7*3600,Math.round([2400,4500,7200,10800,16200][t-1]*(1+d.zb*.06)));
export const exFmt=(sec:any)=>{sec=Math.max(0,Math.round(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60);return (h?h+'h ':'')+m+'m'};
export const EXK=12;
export const mhpx=(k:string)=>(30+cl(k)*10)*(MEMBERS[k].pet?1.25:1);
export const exLead=(k:string)=>k?Math.min(.35,.08+cl(k)/500):0;
export function exEligible(d:Delve,k:string){return !!gameState.hired[k]&&asg(k).k!='exp'&&cl(k)>=d.mlv}
export const exPk=(mem:string[],n:string)=>mem.reduce((s,k)=>s+(MEMBERS[k].pk[n]||0)*(1+(cl(k)-1)*.02)*pm()*(MEMBERS[k].pet?1.25:1),0);
export function exOdds(d:Delve,t:number,lead:any,mem:any,boon:any){
  const all=(lead?[lead]:[]).concat(mem.filter((k:string)=>k!=lead)),need=Math.max(1,d.party);
  const lb=exLead(lead);let dm=1,hm=1,dt=1;
  if(boon=='might'||boon=='crit')dm=boon=='might'?1.12:1.1;if(boon=='focus')dm=1.08;if(boon=='vigor'||boon=='wind')hm=1.1;if(boon=='stone')dt=.9;
  const es=[0,1,2].map(j=>ENEMIES.find(e=>e.id=='d_'+d.id+'_'+t+'_'+j));
  const PH=all.reduce((q,k)=>q+mhpx(k),0)*(1+lb/2)*hm;
  let dmg=0;
  if(all.length){es.forEach(e=>{const dpr=Math.max(.01,all.reduce((q,k)=>q+X.mdmg(k,e!),0)*.9*(1+lb)*dm*EXK);dmg+=e!.hp/dpr*.65*e!.dps*dt})}
  const ok=all.length>=need&&X.CL()>=d.cl&&gateOk(d.gate)&&all.every(k=>cl(k)>=d.mlv);
  const rho=all.length?PH*1.5/Math.max(1,dmg):0;
  const p=!all.length?0:Math.max(.03,Math.min(.97,.5+.55*(rho-1)));
  return{p:Math.max(.03,Math.min(.97,p+exPk(all,'succ')/100)),ok,rho,dur:Math.round(exDur(d,t)*(1-Math.min(.4,exPk(all,'speed')))),lb,need,n:all.length};
}
export function exStart(){
  const d=DISHES.find(x=>x.id==exSel.d);if(!d||exs().length>=exSlots()||!exSel.l)return;
  const t=T(d),mem=[exSel.l].concat(exSel.m.filter((k:string)=>k!=exSel.l)).filter(k=>exEligible(d,k)),o=exOdds(d,t,exSel.l,mem,exSel.b);
  if(!o.ok||mem.length<o.need)return;
  const prev:Record<string,any>={};mem.forEach(k=>{prev[k]=gameState.mt[k]||{k:'war'};gameState.mt[k]={k:'exp'}});
  exs().push({id:d.id,tier:t,leader:exSel.l,mem,boon:exSel.b,p:0,dur:o.dur,odds:o.p,prev,par:EXPAR[exs().length]||.5});
  say('Expedition sent to '+d.n+' (tier '+t+'), led by '+MEMBERS[exSel.l].n+'. Back in '+exFmt(o.dur)+'.');
  exSel={d:null,l:null,m:[],b:null};
}
// Leadership lets you run several expeditions at once (2nd at 85, 3rd at 105). Each extra one pays a smaller share of acorns.
export const exs=():Expedition[]=>gameState.exs=gameState.exs||[];
export const exSlots=()=>{const l=lv(gameState.xp.Leadership);return 1+(l>=85?1:0)+(l>=105?1:0)};
export const EXPAR=[1,.6,.4];
export const exOf=(k:string)=>exs().find(e=>e.mem.includes(k));
export function exRestore(e:Expedition){e.mem.forEach(k=>{if(!gameState.hired[k])return;const pv=e.prev&&e.prev[k];gameState.mt[k]=pv&&X.validTask(pv)&&pv.k!='exp'?pv:{k:'war'}});}
export function exRecall(i:number){const e=exs()[i];if(!e)return;const d=DISHES.find(x=>x.id==e.id)!;exRestore(e);exs().splice(i,1);say('The expedition to '+d.n+' is called home early. Nothing was gained.')}
export function exFinish(quiet:any,e:Expedition){
  const d=DISHES.find(x=>x.id==e.id)!,t=e.tier,win=Math.random()<e.odds;
  const bn=e.boon=='fortune'?.25:0,lead=e.leader,scale=e.dur/600;
  const m=Math.min(1.3,(1+exPk(e.mem,'loot'))*(1+bn)*(1+exLead(lead)/2))*(1+.6*(t-1));// boosters stack, but cap at +30%
  const full=Math.round(ENEMIES.filter(x=>x.dv==d.id&&x.tier==t).reduce((q,x)=>q+x.a,0)*1*m*(2+e.dur/7200));
  const g=Math.round((win?full:Math.round(full*.25))*(e.par||1));gameState.a+=g;
  let s=(win?'Expedition to '+d.n+' (tier '+t+') returned in triumph! +':'Expedition to '+d.n+' (tier '+t+') was driven back. +')+g.toLocaleString()+' acorns.';
  if(win){
    const mat=ZN[d.zb][4],q=3+t*2+Math.floor(Math.random()*(t+1));gameState.inv[mat]=(gameState.inv[mat]||0)+q;s+=' +'+q+' '+mat+'.';
    if(d.zb>=8&&Math.random()<.2*t){const c=ZN[d.zb][6];gameState.inv[c!]=(gameState.inv[c!]||0)+1;s+=' +1 '+c+'.'}
    if(Math.random()<(.4+exLead(lead))*(1+X.ef('drop')+cb('drop'))){gameState.seen[d.tr]=1;gameState.inv[d.tr]=(gameState.inv[d.tr]||0)+1;s+=' Trophy: '+d.tr+'.'}
    if(t>=4&&Math.random()<.04*(t-3)*(1+cb('drop'))){X.gainItem(X.rndGear(Math.min(10,d.zb)))}
    const prev=gameState.best[d.id]||0;gameState.best[d.id]=Math.max(prev,t);if(t>prev&&t<5)say('Tier '+(t+1)+' of '+d.n+' unlocked.');
  }
  e.mem.forEach(k=>{if(gameState.hired[k])mxp(k,12*t*scale*(win?1:.4)*(k==lead?1.5:1))});
  ldx(30*t*e.mem.length*(scale/2)*(win?1:.4));
  say(s);exRestore(e);exs().splice(exs().indexOf(e),1);
}
export function exView(){
  let run='';
  exs().forEach((e,i)=>{
    const d=DISHES.find(x=>x.id==e.id),left=e.dur-e.p;
    run+='<div class="row" style="flex-direction:column;align-items:stretch"><span>'+d!.n+' · tier '+e.tier+'<small>Led by '+MEMBERS[e.leader].n+' with '+e.mem.filter(k=>k!=e.leader).map(k=>MEMBERS[k].n.split(" ")[0]).join(', ')+(e.mem.length==1?' (alone)':'')+(e.boon?' · '+EXB[e.boon][0]:'')+((e.par||1)<1?' · pays '+Math.round((e.par||1)*100)+'%':'')+'</small></span><small>Odds when they set out: '+Math.round(e.odds*100)+'%. They return in '+exFmt(left)+', and these members are away until then.</small><div class="bar"><i id="exb_'+i+'"></i></div><div style="margin-top:8px"><button class="btn" data-exrecall="'+i+'">Recall party</button></div></div>';
  });
  if(exs().length>=exSlots())return run+(exSlots()<3?'<p class="mu">Leadership '+(exSlots()<2?85:105)+' lets you run another expedition at the same time.</p>':'');
  const hs=Object.keys(gameState.hired);
  let h=run+'<p class="sub">Send your party on an expedition without you'+(exSlots()>1?' (up to '+exSlots()+' at once, extra ones pay less)':'')+'. A leader gives the group a bonus. Everyone who goes is away until they return, so they cannot fight, work or train meanwhile. You stay free to do anything else, even while you are offline.</p>';
  if(!hs.length)return h+'<p class="mu">Recruit a party member in the Party tab first.</p>';
  const sel=exSel.d?DISHES.find(x=>x.id==exSel.d):null;
  h+=DISHES.map(d=>{
    const t=T(d),on=sel&&sel.id==d.id,ready=hs.filter(k=>exEligible(d,k)).length,ck=[['Combat level '+d.cl,X.CL()>=d.cl],[Math.max(1,d.party)+' member'+(Math.max(1,d.party)>1?'s':'')+(d.mlv?' of level '+d.mlv+'+':'')+' ('+ready+' ready)',ready>=Math.max(1,d.party)]].concat(d.gate?[[GATE[d.gate-1].n+' open',gateOk(d.gate)]]:[]);
    return '<button class="row'+(on?' on':'')+'" style="flex-direction:column;align-items:stretch" data-exd="'+d.id+'"><span>'+d.n+(gameState.best[d.id]?' · best tier '+gameState.best[d.id]:'')+'<small>'+ENEMIES.filter(e=>e.dv==d.id&&e.tier==t).map(e=>e.n).join(' → ')+' · about '+exFmt(exDur(d,t))+'</small></span><small>'+ck.map(c=>(c[1]?'✓ ':'✗ ')+c[0]).join(' · ')+'</small></button>';
  }).join('');
  if(sel){
    const t=T(sel),av=hs.filter(k=>asg(k).k!='exp'),el=av.filter(k=>exEligible(sel,k));
    exSel.m=exSel.m.filter((k:string)=>el.includes(k));if(exSel.l&&!el.includes(exSel.l))exSel.l=null;
    const team=(exSel.l?[exSel.l]:[]).concat(exSel.m.filter((k:string)=>k!=exSel.l)),o=exOdds(sel,t,exSel.l,team.filter(k=>k!=exSel.l),exSel.b);
    h+='<h2>'+sel.n+'</h2><p class="mu" style="margin-top:0">Tier</p><div class="chips">'+X.tierChips(sel)+'</div>';
    h+='<p class="mu" style="margin:6px 0 4px">Leader (gives the group a bonus based on level)</p><div class="chips">'+(el.length?el.map(k=>'<button class="'+(exSel.l==k?'on':'')+'" data-exl="'+k+'">'+MEMBERS[k].n.split(" ")[0]+' L'+cl(k)+'</button>').join(''):'<span class="mu">No one is ready.</span>')+'</div>';
    h+='<p class="mu" style="margin:6px 0 4px">Members</p><div class="chips">'+el.filter(k=>k!=exSel.l).map(k=>'<button class="'+(exSel.m.includes(k)?'on':'')+'" data-exm="'+k+'">'+MEMBERS[k].n.split(" ")[0]+' L'+cl(k)+'</button>').join('')+'</div>';
    h+='<p class="mu" style="margin:6px 0 4px">Provision (optional)</p><div class="chips">'+Object.keys(EXB).map(b=>'<button class="'+(exSel.b==b?'on':'')+'" data-exb="'+b+'" title="'+EXB[b][1]+'">'+EXB[b][0]+'</button>').join('')+'</div>'+(exSel.b?'<p class="mu" style="margin-top:0">'+EXB[exSel.b][1]+'.</p>':'');
    h+='<div class="arena" style="margin:10px 0"><div class="nm"><span>Odds of success</span><span>'+(o.n?Math.round(o.p*100)+'%':'—')+'</span></div><p class="mu" style="margin:4px 0 0">'+(o.n?'Leader bonus +'+Math.round(o.lb*100)+'% damage. ':'Pick a leader. ')+'Away for about '+exFmt(o.dur)+'. A failed run still pays a quarter of the acorns.</p></div>';
    h+='<p><button class="btn" data-exgo="1"'+(o.ok&&exSel.l?'':' disabled')+'>Send the expedition</button></p>';
  }
  return h;
}
export const enr=(e:Enemy)=>e.raid&&gameState.ehid==e.id&&(gameState.rr||0)>e.soft?1+((gameState.rr||0)-e.soft)*.04:1;
export function raidOk(r:any){const fg=fighters();return X.CL()>=r.cl&&gateOk(r.gate)&&fg.filter(k=>cl(k)>=r.mlv).length>=r.party}
export function startRaid(id:string){const r=RD.find(x=>x.id==id);if(!r||!raidOk(r))return;gameState.hp=maxhp();gameState.ehp=null;gameState.rr=0;X.hits=[];gameState.cur={k:'c',id:id+'s0'};gameState.p=0;say('You lead your party into '+r.n+'.')}
export function raidKill(e:Enemy,quiet?:any){
  const r=RD.find(x=>x.id==e.raid)!,n=r.st.length;
  if(e.stage!<n-1){gameState.cur={k:'c',id:r.id+'s'+(e.stage!+1)};gameState.ehp=null;say(r.n+': '+e.n+' falls. '+r.st[e.stage!+1][0]+' steps forward.');return}
  gameState.rc[r.id]=(gameState.rc[r.id]||0)+1;petRoll('p_r'+RD.indexOf(r),[80,100,120,150][RD.indexOf(r)]);petRoll('p_Leadership',150);
  const g=Math.round(r.rw*RPAY[r.id]*(1+X.ef('gold')+FM[gameState.form].gold));gameState.a+=g;let m=r.n+' cleared! +'+g.toLocaleString()+' acorns.';
  if(r.core){const q=r.core[1]+(Math.random()<.5?1:0);gameState.inv[r.core[0]]=(gameState.inv[r.core[0]]||0)+q;m+=' +'+q+' '+r.core[0]+'.'}
  const k='rt'+r.id;gameState.pity[k]=(gameState.pity[k]||0)+1;
  if(Math.random()<(1+X.ef('drop')+cb('drop'))*.06||gameState.pity[k]>=25){gameState.pity[k]=0;X.gainItem(r.tr)}
  const hk2='rh'+r.id;gameState.pity[hk2]=(gameState.pity[hk2]||0)+1;if(Math.random()<(1+X.ef('drop')+cb('drop'))*.2||gameState.pity[hk2]>=8){gameState.pity[hk2]=0;X.gainItem(X.rndGear(Math.min(10,[7,8,9,10][RD.indexOf(r)]+(Math.random()<.25?1:0))))}
  say(m);
  const fg=fighters();fg.forEach(q=>mxp(q,r.rw*.01));if(fg.length)ldx(r.rw*.004*fg.length);
  gameState.cur={k:'c',id:r.id+'s0'};gameState.ehp=null;
}
export function raidView(){
  const fg=fighters();
  return '<h2>Raids</h2><p class="sub">Raids are chains of hard fights with no breaks. Lose once and the run ends. They need several strong members set to “Fight with me”, good gear and plenty of food. Bosses enrage if a fight drags on. A cleared raid restarts on its own while you are away.</p>'+RD.map(r=>{
    const act=gameState.cur&&gameState.cur.k=='c'&&ENEMIES.find(e=>e.id==gameState.cur.id&&e.raid==r.id),rdy=fg.filter(k=>cl(k)>=r.mlv).length;
    const ck=[['Combat level '+r.cl,X.CL()>=r.cl],[r.party+' members fighting beside you, each level '+r.mlv+' ('+rdy+' ready)',rdy>=r.party]].concat(r.gate?[[GATE[r.gate!-1].n+' open',gateOk(r.gate)]]:[]);
    return '<div class="row" style="flex-direction:column;align-items:stretch"><span>'+r.n+(gameState.rc[r.id]?' · cleared ×'+gameState.rc[r.id]:'')+'<small>'+ENEMIES.filter(e=>e.raid==r.id).map(e=>e.n+' ('+e.type+', '+e.hp.toLocaleString()+' hp)').join(' → ')+'</small></span><small>'+ck.map(c=>(c[1]?'✓ ':'✗ ')+c[0]).join('<br>')+'<br>Reward: '+Math.round(r.rw/1000).toLocaleString()+'k acorns'+(r.core?', '+r.core[0]+'s':'')+', and a rare '+IT[r.tr].n+'.</small>'+(act?'<div style="margin-top:8px"><span class="good">In progress: '+act.n+'</span> <button class="btn" data-stop="1">Retreat</button></div>':'<div style="margin-top:8px"><button class="btn" data-raid="'+r.id+'"'+(raidOk(r)?'':' disabled')+'>Enter the raid</button></div>')+'</div>'}).join('');
}

// ---------- harvest raids (non-combat)
export const HR:Harvest[]=[
{id:'h0',n:'The Bramble Harvest',gate:0,tier:3,q:150,fx:[['xp',.06]]},
{id:'h1',n:'The Moonlit Gathering',gate:1,tier:7,q:200,fx:[['yld',.08],['spd',.04]]},
{id:'h2',n:'The Wyrmwood Tithe',gate:2,tier:8,q:250,fx:[['yld',.1],['spd',.06],['xp',.06],['sell',.1]]},
{id:'h3',n:'The Eclipse Reaping',gate:3,tier:9,q:300,fx:[['yld',.12],['spd',.1],['xp',.1],['sell',.15]]}];
export const hrOk=(r:any)=>gateOk(r.gate)&&GSK.every(k=>lv(gameState.xp[k])>=GL[r.tier]);
export const hrTxt=(r:any)=>fxTxt(r.fx)+' on every gathering skill';
export function hrFx(){const o:any[]=[];HR.forEach(r=>{if(!(gameState.hrc&&gameState.hrc[r.id]))return;r.fx.forEach((e:FxDef)=>{if(CTX.includes(e[0]))GSK.forEach(sk=>o.push({k:e[0],v:e[1],sk}));else o.push({k:e[0],v:e[1],sk:null})})});return o}
export function hrCount(a:any,n:number){
  const h=gameState.hr;if(!h)return;const r=HR.find(x=>x.id==h.id);if(!r||+a.id.slice(2)<r.tier)return;
  h.q[a.sk]=Math.min(r.q,(h.q[a.sk]||0)+n);
  if(GSK.every(k=>(h.q[k]||0)>=r.q)){
    gameState.hr=null;gameState.hrc[r.id]=(gameState.hrc[r.id]||0)+1;const first=gameState.hrc[r.id]==1,g=Math.round(r.q*5*(r.tier+1)*40);gameState.a+=g;
    say(r.n+' complete! +'+g.toLocaleString()+' acorns.'+(first?' Blessing earned: '+hrTxt(r)+'.':''));if(first)X.refreshFx();
  }
}
export function startHR(id:string){const r=HR.find(x=>x.id==id);if(!r||!hrOk(r))return;if(gameState.hr&&gameState.hr.id==id){gameState.hr=null;return}gameState.hr={id,q:{}};say(r.n+' begins. Gather tier '+(r.tier+1)+' goods or better, alone or with your party.')}
export function hrView(){
  return fold('hr','Harvest raids','<p class="sub">A raid for gatherers. Collect a quota from every gathering skill, at or above the stated tier. You and your party members all count. The first clear of each grants a permanent blessing.</p>'+HR.map(r=>{
    const on=gameState.hr&&gameState.hr.id==r.id,ok=hrOk(r),n=gameState.hrc[r.id]||0;
    return '<div class="row" style="flex-direction:column;align-items:stretch"><span>'+r.n+(n?' · cleared ×'+n:'')+'<small>'+r.q+' from each gathering skill at tier '+(r.tier+1)+' ('+GL[r.tier]+'+) or better. Blessing: '+hrTxt(r)+'.</small></span>'+
    (on?'<small>'+GSK.map(k=>k+' '+(gameState.hr.q[k]||0)+'/'+r.q).join(' · ')+'</small>':(ok?'':'<small>'+(gateOk(r.gate)?'':'✗ '+GATE[r.gate!-1].n+' open<br>')+(GSK.every(k=>lv(gameState.xp[k])>=GL[r.tier])?'':'✗ Every gathering skill at '+GL[r.tier])+'</small>'))+
    '<div style="margin-top:8px"><button class="btn" data-hraid="'+r.id+'"'+(ok||on?'':' disabled')+'>'+(on?'Abandon':'Begin')+'</button></div></div>'}).join(''));
}


export function set_exSel(v:any){exSel=v}