import { S, say } from './00-state';
import { X } from './registry';
import { CS, D, IT, PETS, SK, SL, SP, TR, lv, skPet } from './01-species-pets';
import { E, GSK, PSK, RFN, ZN, ctime, gateOk, refineDone } from './02-gear-data';
import { HR, RD, hrCount } from './03-world-expeditions';
import { RT } from './04-loadout';
import { cround } from './05-combat';
import { A, CSK, LD, asg, cookDone, craftDone, tt, unlockText } from './07-gear-ui';
import { mdur, memAct, mxp } from './08-party-state';
import { BRATE, BU, buL } from './09-seasons-burrow';
// Achievements and collection log. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
// ---------- achievements and collection log
export const nSk=(n:number)=>SK.concat(CS).filter(k=>lv(S.xp[k])>=n).length;
export const totLv=()=>SK.concat(CS).reduce((q,k)=>q+lv(S.xp[k]),0);
export const kills=()=>Object.keys(S.kc).reduce((q,k)=>q+S.kc[k],0);
export const bossDone=()=>ZN.filter((z,i)=>(S.kc['z'+i+'m3']||0)>0).length;
export const raidClears=()=>Object.keys(S.rc).reduce((q,k)=>q+S.rc[k],0);
export const nPets=()=>Object.keys(S.pets).length;
export const logItems=()=>{const o:any[]=[];for(let t=1;t<=10;t++){SL.forEach((x,i)=>o.push('w'+i+t+'d'));o.push('b'+t+'d');o.push('h'+t+'d')}for(let t=8;t<=10;t++){SL.forEach((x,i)=>o.push('w'+i+t));o.push('b'+t);o.push('h'+t)}for(let i=0;i<TR.length;i++)o.push('t'+i);Object.keys(IT).forEach(id=>{if((/^[grnc]/.test(id)||IT[id].kind)&&IT[id].slot!='trinket'&&IT[id].q!='s')o.push(id)});return o};
export const logFound=(id:string)=>!!(S.col[id]||S.own[id]);
export const nLog=()=>logItems().filter(logFound).length;
export const allBu=(n:number)=>BU.every(b=>buL(b.id)>=n);
export const AC:Ach[]=[
['t1','Getting Hands Dirty','Reach total level 100.',()=>totLv()>=100,500],
['t2','Valley Worker','Reach total level 500.',()=>totLv()>=500,5000],
['t3','Seasoned','Reach total level 1,000.',()=>totLv()>=1000,50000],
['t4','Legend of the Hollow','Reach total level 1,500.',()=>totLv()>=1500,500000],
['s1','Ninety-Nine','Reach level 99 in any skill.',()=>nSk(99)>=1,20000],
['s2','Jack of Many Trades','Reach level 99 in five skills.',()=>nSk(99)>=5,100000],
['s3','Provider','Reach level 99 in every gathering skill.',()=>GSK.every(k=>lv(S.xp[k])>=99),150000],
['s4','Artisan','Reach level 99 in every production skill.',()=>PSK.every(k=>lv(S.xp[k])>=99),150000],
['s5','Warrior of the Hollow','Reach level 99 in every combat stat.',()=>CS.slice(0,4).every(k=>lv(S.xp[k])>=99),150000],
['s6','Beyond the Limit','Reach level 120 in any skill.',()=>nSk(120)>=1,300000],
['s7','Maxed','Reach level 99 in all 16 skills.',()=>nSk(99)>=16,1000000],
['s8','Master of Everything','Earn the Max Master Cape.',()=>X.grpTier('Max')>=4,20000000],
['c1','Pest Control','Defeat 100 foes.',()=>kills()>=100,1000],
['c2','Exterminator','Defeat 1,000 foes.',()=>kills()>=1000,20000],
['c3','Scourge of the Valley','Defeat 10,000 foes.',()=>kills()>=10000,300000],
['c4','Boss Hunter','Defeat 3 zone bosses.',()=>bossDone()>=3,5000],
['c5','Boss Slayer','Defeat every zone boss.',()=>bossDone()>=ZN.length,500000],
['c6','Delver','Clear any delve.',()=>Object.keys(S.best).some(k=>S.best[k]>=1),2000],
['c7','Deep Delver','Clear a delve at tier 5.',()=>Object.keys(S.best).some(k=>S.best[k]>=5),100000],
['c8','Master Delver','Clear every delve at tier 5.',()=>D.every(d=>(S.best[d.id]||0)>=5),2000000],
['c9','Raider','Clear a raid.',()=>raidClears()>=1,50000],
['c10','Citadel Breaker','Clear the Eclipse Citadel.',()=>(S.rc.r3||0)>=1,5000000],
['c11','Raid Veteran','Clear raids 25 times.',()=>raidClears()>=25,1000000],
['c12','Slayer Streak','Complete 10 Slayer tasks.',()=>S.str>=10,10000],
['c13','Task Master','Complete 50 Slayer tasks.',()=>S.str>=50,200000],
['p1','A Friend','Find your first pet.',()=>nPets()>=1,10000],
['p2','Pet Lover','Find 10 pets.',()=>nPets()>=10,1000000],
['p3','Menagerie','Find 20 pets.',()=>nPets()>=20,5000000],
['p4','Gotta Find Them All','Find every pet.',()=>nPets()>=PETS.length,50000000],
['p5','Lucky Find','Find your first rare drop.',()=>Object.keys(S.col).length>=1,2000],
['p6','Hoarder','Fill 25 entries of the collection log.',()=>nLog()>=25,100000],
['g1','Through the Rootgate','Open the Rootgate.',()=>gateOk(1),100000],
['g2','Through the Wyrmgate','Open the Wyrmgate.',()=>gateOk(2),500000],
['g3','Through the Eclipse Gate','Open the Eclipse Gate.',()=>gateOk(3),3000000],
['h1','Harvest Moon','Clear a harvest raid.',()=>Object.keys(S.hrc).length>=1,20000],
['h2','Grand Harvest','Clear every harvest raid.',()=>HR.every(r=>S.hrc[r.id]),2000000],
['b1','Home Sweet Home','Build anything in the Burrow.',()=>BU.some(b=>buL(b.id)>=1),1000],
['b2','Master Builder','Bring every Burrow building to tier 3.',()=>allBu(3),150000],
['b3','The Grand Burrow','Bring every Burrow building to tier 5.',()=>allBu(5),5000000],
['m1','Band of Friends','Have 3 party members.',()=>Object.keys(S.hired).length>=3,3000],
['m2','Full Party','Have 6 party members.',()=>Object.keys(S.hired).length>=6,100000],
['m3','Veteran Squad','Raise a member to level 50.',()=>Object.keys(S.cx).some(k=>lv(S.cx[k])>=50),20000],
['m4','Elite Companion','Raise a member to level 100.',()=>Object.keys(S.cx).some(k=>lv(S.cx[k])>=100),1000000],
['e1','Acorn Collector','Hold 100,000 acorns.',()=>S.a>=1e5,0],
['e2','Wealthy','Hold 5,000,000 acorns.',()=>S.a>=5e6,0],
['f1','Deepcrafter','Craft a tier 8 or better piece of gear.',()=>Object.keys(S.own).some(i=>IT[i]&&IT[i].tier>=8&&!IT[i].q&&IT[i].slot!='trinket'),100000]];
export function checkAch(){
  if(!S.ach)return;
  for(let i=0;i<AC.length;i++){const a=AC[i];if(!S.ach[a[0]]&&a[3]()){S.ach[a[0]]=1;S.a+=a[4];say('🏆 Achievement: '+a[1]+(a[4]?' (+'+a[4].toLocaleString()+' acorns)':'')+'.')}}
}
export function logView(){
  const names=(ids:any)=>ids.map((id:string)=>logFound(id)?'<b>'+IT[id].n+'</b>':'???').join(' · ');
  const rare:any[]=[],craft=[];for(let t=1;t<=10;t++){SL.forEach((x,i)=>rare.push('w'+i+t+'d'));rare.push('b'+t+'d');rare.push('h'+t+'d')}for(let t=8;t<=10;t++){SL.forEach((x,i)=>craft.push('w'+i+t));craft.push('b'+t);craft.push('h'+t)}
  const tr:any[]=[];for(let i=0;i<TR.length;i++)tr.push('t'+i);
  const nw=Object.keys(IT).filter(id=>IT[id].q!='s'&&((/^[grnc]/.test(id)&&['legs','ring','neck','cloak'].includes(IT[id].slot))||IT[id].kind)),nf=nw.filter(logFound);
  const cnt=(ids:any)=>ids.filter(logFound).length+'/'+ids.length;
  let h='<h2>Collection log</h2><p class="sub">Everything you have found. Unfound entries stay hidden as ???.</p>';
  h+='<div class="row" style="flex-direction:column;align-items:stretch"><span>Pets · '+nPets()+'/'+PETS.length+'<small>'+PETS.map(q=>S.pets[q[0]]?'<b>'+q[1]+'</b>':'???').join(' · ')+'</small></span></div>';
  h+='<div class="row" style="flex-direction:column;align-items:stretch"><span>Rare gear drops · '+cnt(rare)+'<small>'+names(rare)+'</small></span></div>';
  h+='<div class="row" style="flex-direction:column;align-items:stretch"><span>Crafted deep gear · '+cnt(craft)+'<small>'+names(craft)+'</small></span></div>';
  h+='<div class="row" style="flex-direction:column;align-items:stretch"><span>Legs, rings, necklaces, cloaks, two-handers, off-hands and shields · '+nf.length+'/'+nw.length+'<small>'+(nf.length?nf.map(i=>'<b>'+IT[i].n+'</b>').join(' · '):'None yet.')+'</small></span></div>';
  h+='<div class="row" style="flex-direction:column;align-items:stretch"><span>Trinkets · '+cnt(tr)+'<small>'+names(tr)+'</small></span></div>';
  h+='<div class="row" style="flex-direction:column;align-items:stretch"><span>Delve trophies · '+D.filter(d=>S.seen[d.tr]||S.inv[d.tr]).length+'/'+D.length+'<small>'+D.map(d=>(S.seen[d.tr]||S.inv[d.tr])?'<b>'+d.tr+'</b> (best tier '+(S.best[d.id]||0)+')':'???').join(' · ')+'</small></span></div>';
  h+='<div class="row" style="flex-direction:column;align-items:stretch"><span>Zone bosses · '+bossDone()+'/'+ZN.length+'<small>'+ZN.map((z,i)=>(S.kc['z'+i+'m3']||0)>0?'<b>'+z[3][3]+'</b> ×'+S.kc['z'+i+'m3']:'???').join(' · ')+'</small></span></div>';
  h+='<div class="row" style="flex-direction:column;align-items:stretch"><span>Raids and harvests<small>'+RD.map(r=>S.rc[r.id]?'<b>'+r.n+'</b> ×'+S.rc[r.id]:'???').join(' · ')+'<br>'+HR.map(r=>S.hrc[r.id]?'<b>'+r.n+'</b> ×'+S.hrc[r.id]:'???').join(' · ')+'</small></span></div>';
  h+='<div class="row" style="flex-direction:column;align-items:stretch"><span>Capes<small>'+Object.keys(X.CE).map(k=>X.capeTier(k)?'<b>'+X.capeName(k,X.capeTier(k))+'</b>':'???').join(' · ')+'<br>'+Object.keys(X.GRP).map(g=>X.grpTier(g)?'<b>'+X.grpName(g,X.grpTier(g))+'</b>':'???').join(' · ')+'</small></span></div>';
  const done=AC.filter(a=>S.ach[a[0]]).length;
  h+='<h2>Achievements <span class="mu" style="display:inline">· '+done+'/'+AC.length+'</span></h2>';
  h+=AC.map(a=>'<div class="row"><span>'+(S.ach[a[0]]?'🏆 ':'')+a[1]+'<small>'+a[2]+(a[4]?' Reward: '+a[4].toLocaleString()+' acorns.':'')+'</small></span>'+(S.ach[a[0]]?'<span class="good">Done</span>':'')+'</div>').join('');
  return h;
}
export const famShare=()=>Math.min(.6,1/3+Math.min(1,LD()/99)/6+.02*buL('larder'));
export function famCut(k:string,n:number){let g=0;for(let i=0;i<n;i++)if(Math.random()<famShare())g++;S.fam[k]=(S.fam[k]||0)+n-g;return g}
export function memTick(dt:any){
  if(S.ex)Object.keys(S.hired).forEach(k=>{if(asg(k).k!='exp'&&S.ex!.mem.includes(k))S.mt[k]={k:'exp'}});
  Object.keys(S.hired).forEach(k=>{
    const t=asg(k);if(t.k=='exp')return;if(t.k=='bar'){mxp(k,dt*BRATE(buL('bar'))/3600);return}if(t.k=='idle'){if(buL('bar'))mxp(k,dt*BRATE(buL('bar'))/3600*.25);return}if(t.k=='war')return;
    t.p=(t.p||0)+dt;const d=mdur(k,t);let n=0;
    while(S.mt[k]===t&&t.p!>=d&&n<5000){t.p!-=d;memAct(k,t);n++}
  });
}
export const T=(d:Delve)=>S.tier[d.id]||1;
export function tierChips(d:Delve){let h='';for(let t=1;t<=5;t++)h+='<button class="'+(T(d)==t?'on':'')+'" data-tier="'+d.id+':'+t+'"'+(t>(S.best[d.id]||0)+1?' disabled':'')+'>Tier '+t+'</button>';return h}
export const dur=()=>{const c=S.cur;if(!c)return 1;if(c.k=='s')return tt(A.find(a=>a.id==c.id));if(c.k=='r')return 6*Math.max(.3,1-X.cb('spd',RFN[c.id].sk));if(c.k=='f')return ctime(c.id)*Math.max(.3,1-X.cb('spd',CSK(c.id)));if(c.k=='k')return 3.5*Math.max(.3,1-X.cb('spd','Cooking'));return RT};
export function finish(quiet:any){
  const c=S.cur;
  if(c.k=='s'){
    const a=A.find(x=>x.id==c.id);if(!gateOk(a.gate)){S.cur=null;return}skPet(a.sk);const b=(SP[S.sp!]==a.sk?1.15:1)*(lv(S.xp[a.sk])>=99?1.1:1)*(1+X.cb('xp',a.sk)),before=lv(S.xp[a.sk]);
    S.xp[a.sk]+=a.xp*b;const yn=1+(Math.random()<lv(S.xp[a.sk])*.004+X.cb('yld',a.sk)?1:0);S.inv[a.item]=(S.inv[a.item]||0)+yn;hrCount(a,yn);
    if(lv(S.xp[a.sk])>before)say(a.sk+' reaches level '+lv(S.xp[a.sk])+'.'+unlockText(a.sk,lv(S.xp[a.sk]))+(lv(S.xp[a.sk])>=99?' Mastery: +10% xp.':''));
    else if(!quiet&&Math.random()<.12)say('You '+a.n.toLowerCase()+'. '+['A breeze rustles the ferns.','Somewhere, a woodpecker approves.','The brook chatters along.'][Math.floor(Math.random()*3)]);
  }else{
    if(c.k=='k'){cookDone(c.id);return}
    if(c.k=='f'){craftDone(c.id);return}
    if(c.k=='r'){refineDone(c.id);return}
    if(c.k=='c'){cround(E.find(e=>e.id==c.id)!,quiet);return}
    S.cur=null;
  }
}

Object.defineProperties(X,{famCut:{get:()=>famCut,configurable:true},T:{get:()=>T,configurable:true},tierChips:{get:()=>tierChips,configurable:true}});