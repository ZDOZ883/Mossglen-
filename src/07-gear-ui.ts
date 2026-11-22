import { S, say } from './00-state';
import { X } from './registry';
import { AR, CS, FOOD, GP, H, IT, LT, SK, SP, V, W, XT, lv, petRoll, skPet, weak } from './01-species-pets';
import { E, RF, ZN, gateOk, zoneOpen } from './02-gear-data';
import { CL, armor, loadoutView } from './04-loadout';
import { autoEq, istat, price, reqText } from './05-combat';
import { bonusSummary, gsel, gtab, icon, iconOf, pickerHtml, tileHtml } from './06-icons';
// Gear screen. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export function gearView(){
  const tabs=[['eq','Equipment'],['shop','Shop'],['lo','Loadout'],['capes','Capes']];
  let h='<div class="chips" style="margin-top:12px">'+tabs.map(t=>'<button class="'+(gtab==t[0]?'on':'')+'" data-gt="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  if(gtab=='eq'){
    const bs=bonusSummary();
    h+='<div class="arena" style="margin-top:0"><div class="nm"><span>Armor blocks '+Math.round(armor()*100)+'% of damage</span></div><p class="mu" style="margin:4px 0 0">'+(bs?'Accessory bonuses: '+bs+'.':'Rings, necklaces and cloaks add bonuses. Tap a slot to change it.')+'</p></div>';
    h+='<div class="gslots">'+['Melee','Ranged','Magic','head','neck','cape','body','legs','off','trinket','ring1','ring2'].map(tileHtml).join('')+'</div>';
    h+=gsel?pickerHtml(gsel):'<p class="sub" style="margin-top:12px">Tap any slot to see everything you own for it. Pick a grip: a two-hander hits harder, a one-hander can carry a shield (less damage taken, more armor) or an off-hand weapon (an extra strike). Gear comes in three grades per tier: <b>Plain</b> from the shop, <b>Crafted</b> by the production skills, and <b>Heirloom</b> from rare drops, bosses and raids.</p>';
  }else if(gtab=='shop'){
    const fn:any[]=[['Melee',(t:number)=>'w0'+t],['Ranged',(t:number)=>'w1'+t],['Magic',(t:number)=>'w2'+t],['body',(t:number)=>'b'+t],['head',(t:number)=>'h'+t],['legs',(t:number)=>'g'+t],['ring',(t:number)=>'r0_'+t],['neck',(t:number)=>'n0_'+t],['cloak',(t:number)=>'c0_'+t],['off',(t:number)=>'y'+t]],have=(b:number)=>S.own[b]||S.own[b+'d']||S.own[b+'s'];let sh='';
    fn.forEach(f=>{for(let t=0;t<2;t++){const b=f[1](t),id=b+'s';if(!have(b)){const it=IT[id];sh+='<div class="row"><span class="ri">'+icon(iconOf(it),30)+'</span><span style="flex:1">'+it.n+'<small>'+istat(it)+' · needs '+reqText(it)+'</small></span><button class="btn" data-shop="'+id+'"'+(S.a<price(it)?' disabled':'')+'>🌰 '+price(it).toLocaleString()+'</button></div>';break}}});
    h+='<p class="sub">The shop sells Plain starter gear for the first two tiers. Everything better is crafted or found.</p>'+(sh||'<p class="mu">You own everything the shop sells.</p>');
  }else if(gtab=='lo'){h+=loadoutView()}
  else h+=X.capesView();
  return h;
}
export const CR=['Smithing','Fletching','Enchanting','Tailoring'];CS.push(...CR,'Slayer','Leadership');
export const CSK=(id:string)=>id[0]=='y'?'Smithing':id[0]=='g'?'Fletching':id[0]=='r'?'Smithing':id[0]=='n'?'Enchanting':id[0]=='c'?'Tailoring':id[0]=='b'?'Smithing':id[0]=='h'?'Tailoring':id[1]=='0'?'Smithing':id[1]=='1'?'Fletching':'Enchanting';
export function recipe(id:string){
  const it=IT[id],t=it.tier,i=Math.max(0,t-1),m={},s=CSK(id),g=(k:string)=>GN[k][i][1],add=(k:string,q:number)=>(m as any)[k]=((m as any)[k]||0)+q;
  if(s=='Smithing'){add(g('Mining'),id[0]=='b'?10+3*t:5+2*t);add(g('Woodcutting'),2+t);if(id[0]=='b')add(g('Hunting'),2+t)}
  else if(s=='Fletching'){add(g('Woodcutting'),6+2*t);add(g('Foraging'),2+t)}
  else if(s=='Enchanting'){add(g('Foraging'),5+2*t);add(g('Mining'),2+t)}
  else{add(g('Foraging'),4+t);add(g('Hunting'),2+t)}
  if(t>=1)add(ZN[t-1][4],2+t);
  if(it.cmb||it.kind=='2h')Object.keys(m).forEach(k=>(m as any)[k]=Math.ceil((m as any)[k]*1.4));
  if(t>=8){Object.keys(m).forEach(k=>(m as any)[k]=Math.ceil((m as any)[k]*2.5));const mq=t>=9?2:1;(m as any)[RF[s][t-8]]=(id[0]=='b'?12:8)*mq;(m as any)[ZN[t][6]!]=(id[0]=='b'?3:2)*mq}
  return m;
}
export function useMats(r:any,sk:string){if(!Object.keys(r).every(k=>(S.inv[k]||0)>=r[k]))return false;if(sk&&Math.random()<X.cb('save',sk))return true;Object.keys(r).forEach(k=>S.inv[k]-=r[k]);return true}
export function craftDone(id:string,mk?:any){
  const it=IT[id],r=recipe(id),sk=CSK(id),x=it.tier>=8?[4300,7800,14000][it.tier-8]:Math.round(25*Math.pow(1.7,it.tier));
  if(it.tier>=8&&!gateOk(it.tier-7)){if(mk)S.mt[mk]={k:'idle'};else S.cur=null;return}
  if(!useMats(r,sk)){if(mk){S.mt[mk]={k:'idle'};say(H[mk].n+' ran out of materials for '+it.n+'.')}else{S.cur=null;say('Out of materials for '+it.n+'.')}return}
  skPet(sk);
  if(mk){X.mxp(mk,x*.6);X.ldx(x*.5)}else{const b=lv(S.xp[sk]);S.xp[sk]+=x*(1+X.cb('xp',sk));if(lv(S.xp[sk])>b)say(sk+' reaches level '+lv(S.xp[sk])+'.')}
  if(!S.own[id]){S.own[id]=1;say((mk?H[mk].n+' crafted ':'Crafted ')+it.n+'.');autoEq(id)}else S.a+=Math.round(GP[it.tier]*.15);
}
export const onTask=(e:Enemy)=>!!S.task&&S.task.id==e.id;
export function newTask(){
  const sl=lv(S.xp.Slayer),cl=CL(),zm=ZN.reduce((m,z,i)=>zoneOpen(i)?i:m,0);
  const c=E.filter(e=>!e.boss&&e.zone>=zm-2&&zoneOpen(e.zone)&&!e.inst&&Math.floor(ZN[e.zone][1]*.5)<=sl);
  const e=c[Math.floor(Math.random()*c.length)],n=20+Math.floor(Math.random()*21);
  S.task={id:e.id,n,left:n};say('New task: defeat '+n+' × '+e.n+'.');
}
export function slayKill(e:Enemy){
  const k=S.task;if(!k||k.id!=e.id)return;
  const b=lv(S.xp.Slayer);S.xp.Slayer+=e.xp*3*(1+X.cb('txp'));if(lv(S.xp.Slayer)>b)say('Slayer reaches level '+lv(S.xp.Slayer)+'.');
  k.left--;
  if(k.left<=0){S.str++;petRoll('p_Slayer',400);const p=Math.round((3+e.zone*2)*(S.str%10==0?3:S.str%5==0?2:1)*(1+X.cb('pts'))),ac=Math.round(e.a*k.n*.5);S.pt+=p;S.a+=ac;say('Task complete! +'+p+' slayer points, +'+ac+' acorns (streak '+S.str+').');S.task=null}
}
export function taskAct(a:string){
  if(a=='new'&&!S.task)newTask();
  else if(a=='reroll'&&S.task&&S.pt>=10){S.pt-=10;newTask()}
  else if(a=='fight'&&S.task){const e=E.find(q=>q.id==S.task.id)!;S.zone=e.zone;S.ehp=null;S.cur={k:'c',id:e.id};S.p=0}
}
export function slBuy(k:string){const c=({keen:60,fort:100} as Record<string,number>)[k];if(!S.su[k]&&S.pt>=c){S.pt-=c;S.su[k]=1;say('Unlocked '+(k=='keen'?'Keen Instinct':'Hunter’s Fortune')+'.')}}
export function slayerView(){
  const x=S.xp.Slayer,l=lv(x),lo=need(l-1),pc=Math.min(100,(x-lo)/(need(l)-lo)*100),t=S.task,e=t&&E.find(q=>q.id==t.id);
  let h='<p class="sub">Warden Thistle posts hunts on the Burrow Board. Points: <b>'+S.pt+'</b> · streak '+S.str+' (bonus points on every 5th and 10th task). Party members fighting beside you help clear tasks.</p>';
  if(t)h+='<div class="row"><span>Defeat '+t.left+' more '+e.n+'<small>'+ZN[e.zone][0]+' · '+e.type+' · weak to '+weak(e.type)+'. On task: +10% damage, +10% rare drops, Slayer xp.</small></span><button class="btn" data-task="fight">Fight</button></div><p><button class="btn" data-task="reroll"'+(S.pt<10?' disabled':'')+'>Reroll (10 pts)</button></p>';
  else h+='<p><button class="btn" data-task="new">Get a task</button></p><p class="mu">Tasks come from zones you can fight. Harder zones need a higher Slayer level.</p>';
  h+='<h2>Rewards</h2>'+[['keen','Keen Instinct','+15% damage against your task',60],['fort','Hunter’s Fortune','+25% rare drops on task',100]].map(r=>'<div class="row"><span>'+r[1]+'<small>'+r[2]+'</small></span>'+(S.su[r[0]]?'<span class="good">Owned</span>':'<button class="btn" data-slbuy="'+r[0]+'"'+(S.pt<r[3]?' disabled':'')+'>'+r[3]+' pts</button>')+'</div>').join('');
  return h+X.sgView();
}
CS.push('Cooking');
export const DISH:Record<string,Dish>={},DN={G:['Turnip mash','Oat porridge','Pumpkin pie','Honeyroot glaze','Frostbeet borscht','Sunmelon tart','Stargourd soup','Deepyam hash','Wyrmpepper stew','Eclipse fig preserve'],F:['Berry tart','Mushroom pie','Truffle pasty','Moonroot soup','Frostcap broth','Sunpetal salad','Starbloom cake','Deepbloom torte','Wyrmcap roast','Eclipse lotus feast'],I:['Fried minnows','Baked trout','Pike pie','Eel stew','Carp supper','Moonfish feast','Glassfin platter','Cavefin chowder','Drakescale grill','Voidfin tasting'],H:['Beetle crisps','Cricket skewers','Garlic snails','Frog legs','Newt stew','Skink roast','Moth-wing pastry','Root beetle bake','Ember moth skewers','Dusk spider pie']},DSK={F:'Foraging',I:'Fishing',H:'Hunting',G:'Farming'},DM={F:.9,I:1,H:1.1,G:1.05},HEAL=[15,28,50,80,125,190,280,420,600,850];
export const CROPS=[['turnips','turnip seeds'],['oats','oat seeds'],['pumpkins','pumpkin seeds'],['honeyroot','honeyroot cuttings'],['frostbeets','frostbeet seeds'],['sunmelons','sunmelon seeds'],['stargourds','stargourd seeds'],['deepyams','deepyam cuttings'],['wyrmpeppers','wyrmpepper seeds'],['eclipse figs','eclipse fig cuttings']];
export const CROPSECS=[300,600,1200,2400,3600,7200,10800,16200,21600,28800];// grow time per tier, capped at the 8 hour offline window
export function initDish(){['F','I','H','G'].forEach(c=>(DN as any)[c].forEach((n:string,i:number)=>{const heal=Math.round(HEAL[i]*(DM as any)[c]);DISH['d'+c+i]={n,raw:c=='G'?CROPS[i][0]:GN[(DSK as any)[c]][i][1],q:c=='F'||c=='G'?3:2,side:c=='F'?null:GN.Foraging[i][1],lv:GL[i],gate:i>6?i-6:0,heal,xp:GX[i]*2};FOOD[n]=heal;V[n]=Math.round(GV[i]*3.5)}))}
export const burn=(d:any)=>Math.max(0,.4-(lv(S.xp.Cooking)-d.lv)*.02)*(1-Math.min(.9,X.cb('burn','Cooking')));
export const dishNeeds=(d:any)=>{const nd:Record<string,any>={};nd[d.raw]=d.q;if(d.side)nd[d.side]=1;return nd};
export function cookDone(id:string,mk?:any){
  const d=DISH[id];
  if(!gateOk(d.gate)||!useMats(dishNeeds(d),'Cooking')){if(mk){S.mt[mk]={k:'idle'};say(H[mk].n+' ran out of ingredients for '+d.n+'.')}else{S.cur=null;say('Out of ingredients for '+d.n+'.')}return}
  const b=lv(S.xp.Cooking),burnt=Math.random()<burn(d);
  if(burnt){if(!mk&&Math.random()<.2)say('You burn the '+d.n.toLowerCase()+'.');return}
  S.inv[d.n]=(S.inv[d.n]||0)+(mk?X.famCut(mk,1):1);skPet('Cooking');
  if(mk){X.mxp(mk,d.xp*.6);X.ldx(d.xp*.5);return}
  S.xp.Cooking+=d.xp*(SP[S.sp!]=='Cooking'?1.15:1)*(b>=99?1.1:1)*(1+X.cb('xp','Cooking'));
  const a=lv(S.xp.Cooking);if(a>b)say('Cooking reaches level '+a+'.'+Object.keys(DISH).filter(k=>DISH[k].lv==a).map(k=>' Unlocked: '+DISH[k].n+'.').join(''));
}
export function buy(k:string){const t=S.gear[k],c=(k=='arm'?[100,400,1000]:[80,300,900])[t];if(t<3&&S.a>=c){S.a-=c;S.gear[k]++;say('Equipped '+(k=='arm'?AR[t]:W[k][t])+'.')}}
export const need=(l:number)=>XT[Math.min(l+1,120)];
export const GL=[1,15,30,45,60,75,90,100,110,120],GX=[6,18,36,60,96,144,210,360,570,900],GV=[1,3,8,15,30,55,100,175,350,750];
export const GN:Record<string,string[][]>={Foraging:[['Pick berries','berries'],['Dig up mushrooms','mushrooms'],['Sniff out truffles','truffles'],['Gather moonroot','moonroot'],['Find frostcaps','frostcaps'],['Pluck sunpetals','sunpetals'],['Reach for starbloom','starbloom'],['Cut deepbloom','deepbloom'],['Harvest wyrmcap','wyrmcap'],['Pluck eclipse lotus','eclipse lotus']],Woodcutting:[['Gather twigs','twigs'],['Gnaw birch logs','birch logs'],['Fell an oak limb','oak limbs'],['Cut willow boughs','willow boughs'],['Fell maple staves','maple staves'],['Hew yew limbs','yew limbs'],['Claim elderwood','elderwood'],['Fell ironroot','ironroot'],['Claim wyrmwood','wyrmwood'],['Hew duskoak','duskoak']],Fishing:[['Catch minnows','minnows'],['Spear trout','trout'],['Hook a pike','pike'],['Trap eels','eels'],['Net silver carp','silver carp'],['Lure moonfish','moonfish'],['Land a glassfin','glassfin'],['Hook cavefin','cavefin'],['Land a drakescale','drakescale'],['Spear voidfin','voidfin']],Mining:[['Collect pebbles','pebbles'],['Chip flint','flint'],['Pry out amber','amber'],['Dig silver','silver'],['Cut moonstone','moonstone'],['Free a garnet','garnets'],['Mine starstone','starstone'],['Cut deepcrystal','deep crystal'],['Mine wyrmiron','wyrmiron'],['Quarry eclipsite','eclipsite']],Hunting:[['Snare beetles','beetles'],['Trap crickets','crickets'],['Gather snails','snails'],['Catch frogs','frogs'],['Net newts','newts'],['Snare skinks','sand skinks'],['Lure moon moths','moon moths'],['Snare rootbeetles','root beetles'],['Net ember moths','ember moths'],['Trap dusk spiders','dusk spiders']]};
export const A:any[]=[];Object.keys(GN).forEach(sk=>GN[sk].forEach((g:string[],i:number)=>{A.push({id:sk.slice(0,2)+i,sk,n:g[0],lv:GL[i],t:i>6?[9,11,14][i-7]:3+i*.5,xp:GX[i],item:g[1],gate:i>6?i-6:0});V[g[1]]=GV[i]}));
export const TN=['Flint','Bramble','Moonsteel','Amberforged','Elderglass'],TC=[0,150,800,4000,20000],TL=[1,10,30,50,75],TM=[1,.9,.8,.7,.6],TK={Foraging:'basket',Woodcutting:'axe',Fishing:'rod',Mining:'pick',Hunting:'snare'};
export const tt=(a:any)=>a.t*TM[S.tool[a.sk]]*Math.max(.3,1-X.cb('spd',a.sk));
export function unlockText(sk:string,n:number){const u=A.filter(a=>a.sk==sk&&a.lv==n&&!a.gate).map(a=>a.item);TL.forEach((l,i)=>{if(l==n&&i>0)u.push(TN[i]+' '+(TK as any)[sk])});return u.length?' Unlocked: '+u.join(', ')+'.':''}
export function buyTool(sk:string){const t=S.tool[sk]+1;if(t<5&&lv(S.xp[sk])>=TL[t]&&S.a>=TC[t]){S.a-=TC[t];S.tool[sk]=t;say('Equipped '+TN[t]+' '+(TK as any)[sk]+'.')}}
export function toolRow(k:string){const t=S.tool[k],n=t+1;return '<div class="row"><span>'+TN[t]+' '+(TK as any)[k]+'<small>Bonus yield '+Math.round(lv(S.xp[k])*.4)+'% · '+(t<4?'Next: '+TN[n]+' (level '+TL[n]+', '+TM[n]+'× time)':'Best tool')+'</small></span>'+(t<4?'<button class="btn" data-tool="'+k+'"'+(lv(S.xp[k])<TL[n]||S.a<TC[n]?' disabled':'')+'>'+TC[n]+'</button>':'')+'</div>'}
export let tab='skills',who='you',skill:any=null;
export const power=()=>Math.floor(SK.concat(CS).reduce((s,k)=>s+lv(S.xp[k]),0)/2)+X.fighters().reduce((s,k)=>s+hp(k),0);
export const cl=(k:string)=>lv(S.cx[k]||0);
export const hp=(k:string)=>H[k].p+(cl(k)-1)*(k==S.lead?2:1);
export const LD=()=>lv(S.xp.Leadership);
export const slots=()=>LT.filter(l=>l<=LD()).length;
export const bspd=()=>(.25+.0075*LD())*(1+X.cb('mspd'));
export const mspd=(k:string)=>bspd()*(1+.01*(cl(k)-1));
export const asg=(k:string)=>S.mt[k]||{k:'war'};

export function set_who(v:any){who=v}
export function set_skill(v:any){skill=v}
export function set_tab(v:any){tab=v}
Object.defineProperties(X,{slots:{get:()=>slots,configurable:true},GN:{get:()=>GN,configurable:true},useMats:{get:()=>useMats,configurable:true},cl:{get:()=>cl,configurable:true},asg:{get:()=>asg,configurable:true},GL:{get:()=>GL,configurable:true},A:{get:()=>A,configurable:true},CSK:{get:()=>CSK,configurable:true},onTask:{get:()=>onTask,configurable:true},slayKill:{get:()=>slayKill,configurable:true}});