// Gear screen. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
function gearView(){
  const tabs=[['eq','Equipment'],['shop','Shop'],['lo','Loadout'],['capes','Capes']];
  let h='<div class="chips" style="margin-top:12px">'+tabs.map(t=>'<button class="'+(gtab==t[0]?'on':'')+'" data-gt="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>';
  if(gtab=='eq'){
    const bs=bonusSummary();
    h+='<div class="arena" style="margin-top:0"><div class="nm"><span>Armor blocks '+Math.round(armor()*100)+'% of damage</span></div><p class="mu" style="margin:4px 0 0">'+(bs?'Accessory bonuses: '+bs+'.':'Rings, necklaces and cloaks add bonuses. Tap a slot to change it.')+'</p></div>';
    h+='<div class="gslots">'+['Melee','Ranged','Magic','head','neck','cape','body','legs','off','trinket','ring1','ring2'].map(tileHtml).join('')+'</div>';
    h+=gsel?pickerHtml(gsel):'<p class="sub" style="margin-top:12px">Tap any slot to see everything you own for it. Pick a grip: a two-hander hits harder, a one-hander can carry a shield (less damage taken, more armor) or an off-hand weapon (an extra strike). Gear comes in three grades per tier: <b>Plain</b> from the shop, <b>Crafted</b> by the production skills, and <b>Heirloom</b> from rare drops, bosses and raids.</p>';
  }else if(gtab=='shop'){
    const fn:any[]=[['Melee',t=>'w0'+t],['Ranged',t=>'w1'+t],['Magic',t=>'w2'+t],['body',t=>'b'+t],['head',t=>'h'+t],['legs',t=>'g'+t],['ring',t=>'r0_'+t],['neck',t=>'n0_'+t],['cloak',t=>'c0_'+t],['off',t=>'y'+t]],have=b=>S.own[b]||S.own[b+'d']||S.own[b+'s'];let sh='';
    fn.forEach(f=>{for(let t=0;t<2;t++){const b=f[1](t),id=b+'s';if(!have(b)){const it=IT[id];sh+='<div class="row"><span class="ri">'+icon(iconOf(it),30)+'</span><span style="flex:1">'+it.n+'<small>'+istat(it)+' · needs '+reqText(it)+'</small></span><button class="btn" data-shop="'+id+'"'+(S.a<price(it)?' disabled':'')+'>🌰 '+price(it).toLocaleString()+'</button></div>';break}}});
    h+='<p class="sub">The shop sells Plain starter gear for the first two tiers. Everything better is crafted or found.</p>'+(sh||'<p class="mu">You own everything the shop sells.</p>');
  }else if(gtab=='lo'){h+=loadoutView()}
  else h+=capesView();
  return h;
}
const CR=['Smithing','Fletching','Enchanting','Tailoring'];CS.push(...CR,'Slayer','Leadership');
const CSK=id=>id[0]=='y'?'Smithing':id[0]=='g'?'Fletching':id[0]=='r'?'Smithing':id[0]=='n'?'Enchanting':id[0]=='c'?'Tailoring':id[0]=='b'?'Smithing':id[0]=='h'?'Tailoring':id[1]=='0'?'Smithing':id[1]=='1'?'Fletching':'Enchanting';
function recipe(id){
  const it=IT[id],t=it.tier,i=Math.max(0,t-1),m={},s=CSK(id),g=k=>GN[k][i][1],add=(k,q)=>m[k]=(m[k]||0)+q;
  if(s=='Smithing'){add(g('Mining'),id[0]=='b'?10+3*t:5+2*t);add(g('Woodcutting'),2+t);if(id[0]=='b')add(g('Hunting'),2+t)}
  else if(s=='Fletching'){add(g('Woodcutting'),6+2*t);add(g('Foraging'),2+t)}
  else if(s=='Enchanting'){add(g('Foraging'),5+2*t);add(g('Mining'),2+t)}
  else{add(g('Foraging'),4+t);add(g('Hunting'),2+t)}
  if(t>=1)add(ZN[t-1][4],2+t);
  if(it.cmb||it.kind=='2h')Object.keys(m).forEach(k=>m[k]=Math.ceil(m[k]*1.4));
  if(t>=8){Object.keys(m).forEach(k=>m[k]=Math.ceil(m[k]*2.5));const mq=t>=9?2:1;m[RF[s][t-8]]=(id[0]=='b'?12:8)*mq;m[ZN[t][6]]=(id[0]=='b'?3:2)*mq}
  return m;
}
function useMats(r,sk){if(!Object.keys(r).every(k=>(S.inv[k]||0)>=r[k]))return false;if(sk&&Math.random()<cb('save',sk))return true;Object.keys(r).forEach(k=>S.inv[k]-=r[k]);return true}
function craftDone(id,mk?:any){
  const it=IT[id],r=recipe(id),sk=CSK(id),x=it.tier>=8?[4300,7800,14000][it.tier-8]:Math.round(25*Math.pow(1.7,it.tier));
  if(it.tier>=8&&!gateOk(it.tier-7)){if(mk)S.mt[mk]={k:'idle'};else S.cur=null;return}
  if(!useMats(r,sk)){if(mk){S.mt[mk]={k:'idle'};say(H[mk].n+' ran out of materials for '+it.n+'.')}else{S.cur=null;say('Out of materials for '+it.n+'.')}return}
  skPet(sk);
  if(mk){mxp(mk,x*.6);ldx(x*.5)}else{const b=lv(S.xp[sk]);S.xp[sk]+=x*(1+cb('xp',sk));if(lv(S.xp[sk])>b)say(sk+' reaches level '+lv(S.xp[sk])+'.')}
  if(!S.own[id]){S.own[id]=1;say((mk?H[mk].n+' crafted ':'Crafted ')+it.n+'.');autoEq(id)}else S.a+=Math.round(GP[it.tier]*.15);
}
const onTask=e=>!!S.task&&S.task.id==e.id;
function newTask(){
  const sl=lv(S.xp.Slayer),cl=CL(),zm=ZN.reduce((m,z,i)=>zoneOpen(i)?i:m,0);
  const c=E.filter(e=>!e.boss&&e.zone>=zm-2&&zoneOpen(e.zone)&&!e.inst&&Math.floor(ZN[e.zone][1]*.5)<=sl);
  const e=c[Math.floor(Math.random()*c.length)],n=20+Math.floor(Math.random()*21);
  S.task={id:e.id,n,left:n};say('New task: defeat '+n+' × '+e.n+'.');
}
function slayKill(e){
  const k=S.task;if(!k||k.id!=e.id)return;
  const b=lv(S.xp.Slayer);S.xp.Slayer+=e.xp*3*(1+cb('txp'));if(lv(S.xp.Slayer)>b)say('Slayer reaches level '+lv(S.xp.Slayer)+'.');
  k.left--;
  if(k.left<=0){S.str++;petRoll('p_Slayer',400);const p=Math.round((3+e.zone*2)*(S.str%10==0?3:S.str%5==0?2:1)*(1+cb('pts'))),ac=Math.round(e.a*k.n*.5);S.pt+=p;S.a+=ac;say('Task complete! +'+p+' slayer points, +'+ac+' acorns (streak '+S.str+').');S.task=null}
}
function taskAct(a){
  if(a=='new'&&!S.task)newTask();
  else if(a=='reroll'&&S.task&&S.pt>=10){S.pt-=10;newTask()}
  else if(a=='fight'&&S.task){const e=E.find(q=>q.id==S.task.id);S.zone=e.zone;S.ehp=null;S.cur={k:'c',id:e.id};S.p=0}
}
function slBuy(k){const c={keen:60,fort:100}[k];if(!S.su[k]&&S.pt>=c){S.pt-=c;S.su[k]=1;say('Unlocked '+(k=='keen'?'Keen Instinct':'Hunter’s Fortune')+'.')}}
function slayerView(){
  const x=S.xp.Slayer,l=lv(x),lo=need(l-1),pc=Math.min(100,(x-lo)/(need(l)-lo)*100),t=S.task,e=t&&E.find(q=>q.id==t.id);
  let h='<p class="sub">Warden Thistle posts hunts on the Burrow Board. Points: <b>'+S.pt+'</b> · streak '+S.str+' (bonus points on every 5th and 10th task). Party members fighting beside you help clear tasks.</p>';
  if(t)h+='<div class="row"><span>Defeat '+t.left+' more '+e.n+'<small>'+ZN[e.zone][0]+' · '+e.type+' · weak to '+weak(e.type)+'. On task: +10% damage, +10% rare drops, Slayer xp.</small></span><button class="btn" data-task="fight">Fight</button></div><p><button class="btn" data-task="reroll"'+(S.pt<10?' disabled':'')+'>Reroll (10 pts)</button></p>';
  else h+='<p><button class="btn" data-task="new">Get a task</button></p><p class="mu">Tasks come from zones you can fight. Harder zones need a higher Slayer level.</p>';
  h+='<h2>Rewards</h2>'+[['keen','Keen Instinct','+15% damage against your task',60],['fort','Hunter’s Fortune','+25% rare drops on task',100]].map(r=>'<div class="row"><span>'+r[1]+'<small>'+r[2]+'</small></span>'+(S.su[r[0]]?'<span class="good">Owned</span>':'<button class="btn" data-slbuy="'+r[0]+'"'+(S.pt<r[3]?' disabled':'')+'>'+r[3]+' pts</button>')+'</div>').join('');
  return h+sgView();
}
CS.push('Cooking');
const DISH={},DN={F:['Berry tart','Mushroom pie','Truffle pasty','Moonroot soup','Frostcap broth','Sunpetal salad','Starbloom cake','Deepbloom torte','Wyrmcap roast','Eclipse lotus feast'],I:['Fried minnows','Baked trout','Pike pie','Eel stew','Carp supper','Moonfish feast','Glassfin platter','Cavefin chowder','Drakescale grill','Voidfin tasting'],H:['Beetle crisps','Cricket skewers','Garlic snails','Frog legs','Newt stew','Skink roast','Moth-wing pastry','Root beetle bake','Ember moth skewers','Dusk spider pie']},DSK={F:'Foraging',I:'Fishing',H:'Hunting'},DM={F:.9,I:1,H:1.1},HEAL=[15,28,50,80,125,190,280,420,600,850];
function initDish(){['F','I','H'].forEach(c=>DN[c].forEach((n,i)=>{const heal=Math.round(HEAL[i]*DM[c]);DISH['d'+c+i]={n,raw:GN[DSK[c]][i][1],q:c=='F'?3:2,side:c=='F'?null:GN.Foraging[i][1],lv:GL[i],gate:i>6?i-6:0,heal,xp:GX[i]*2};FOOD[n]=heal;V[n]=Math.round(GV[i]*3.5)}))}
const burn=d=>Math.max(0,.4-(lv(S.xp.Cooking)-d.lv)*.02)*(1-Math.min(.9,cb('burn','Cooking')));
const dishNeeds=d=>{const nd={};nd[d.raw]=d.q;if(d.side)nd[d.side]=1;return nd};
function cookDone(id,mk?:any){
  const d=DISH[id];
  if(!gateOk(d.gate)||!useMats(dishNeeds(d),'Cooking')){if(mk){S.mt[mk]={k:'idle'};say(H[mk].n+' ran out of ingredients for '+d.n+'.')}else{S.cur=null;say('Out of ingredients for '+d.n+'.')}return}
  const b=lv(S.xp.Cooking),burnt=Math.random()<burn(d);
  if(burnt){if(!mk&&Math.random()<.2)say('You burn the '+d.n.toLowerCase()+'.');return}
  S.inv[d.n]=(S.inv[d.n]||0)+(mk?famCut(mk,1):1);skPet('Cooking');
  if(mk){mxp(mk,d.xp*.6);ldx(d.xp*.5);return}
  S.xp.Cooking+=d.xp*(SP[S.sp]=='Cooking'?1.15:1)*(b>=99?1.1:1)*(1+cb('xp','Cooking'));
  const a=lv(S.xp.Cooking);if(a>b)say('Cooking reaches level '+a+'.'+Object.keys(DISH).filter(k=>DISH[k].lv==a).map(k=>' Unlocked: '+DISH[k].n+'.').join(''));
}
function buy(k){const t=S.gear[k],c=(k=='arm'?[100,400,1000]:[80,300,900])[t];if(t<3&&S.a>=c){S.a-=c;S.gear[k]++;say('Equipped '+(k=='arm'?AR[t]:W[k][t])+'.')}}
const need=l=>XT[Math.min(l+1,120)];
const GL=[1,15,30,45,60,75,90,100,110,120],GX=[6,18,36,60,96,144,210,360,570,900],GV=[1,3,8,15,30,55,100,175,350,750];
const GN={Foraging:[['Pick berries','berries'],['Dig up mushrooms','mushrooms'],['Sniff out truffles','truffles'],['Gather moonroot','moonroot'],['Find frostcaps','frostcaps'],['Pluck sunpetals','sunpetals'],['Reach for starbloom','starbloom'],['Cut deepbloom','deepbloom'],['Harvest wyrmcap','wyrmcap'],['Pluck eclipse lotus','eclipse lotus']],Woodcutting:[['Gather twigs','twigs'],['Gnaw birch logs','birch logs'],['Fell an oak limb','oak limbs'],['Cut willow boughs','willow boughs'],['Fell maple staves','maple staves'],['Hew yew limbs','yew limbs'],['Claim elderwood','elderwood'],['Fell ironroot','ironroot'],['Claim wyrmwood','wyrmwood'],['Hew duskoak','duskoak']],Fishing:[['Catch minnows','minnows'],['Spear trout','trout'],['Hook a pike','pike'],['Trap eels','eels'],['Net silver carp','silver carp'],['Lure moonfish','moonfish'],['Land a glassfin','glassfin'],['Hook cavefin','cavefin'],['Land a drakescale','drakescale'],['Spear voidfin','voidfin']],Mining:[['Collect pebbles','pebbles'],['Chip flint','flint'],['Pry out amber','amber'],['Dig silver','silver'],['Cut moonstone','moonstone'],['Free a garnet','garnets'],['Mine starstone','starstone'],['Cut deepcrystal','deep crystal'],['Mine wyrmiron','wyrmiron'],['Quarry eclipsite','eclipsite']],Hunting:[['Snare beetles','beetles'],['Trap crickets','crickets'],['Gather snails','snails'],['Catch frogs','frogs'],['Net newts','newts'],['Snare skinks','sand skinks'],['Lure moon moths','moon moths'],['Snare rootbeetles','root beetles'],['Net ember moths','ember moths'],['Trap dusk spiders','dusk spiders']]};
const A=[];Object.keys(GN).forEach(sk=>GN[sk].forEach((g,i)=>{A.push({id:sk.slice(0,2)+i,sk,n:g[0],lv:GL[i],t:i>6?[9,11,14][i-7]:3+i*.5,xp:GX[i],item:g[1],gate:i>6?i-6:0});V[g[1]]=GV[i]}));
const TN=['Flint','Bramble','Moonsteel','Amberforged','Elderglass'],TC=[0,150,800,4000,20000],TL=[1,10,30,50,75],TM=[1,.9,.8,.7,.6],TK={Foraging:'basket',Woodcutting:'axe',Fishing:'rod',Mining:'pick',Hunting:'snare'};
const tt=a=>a.t*TM[S.tool[a.sk]]*Math.max(.3,1-cb('spd',a.sk));
function unlockText(sk,n){const u=A.filter(a=>a.sk==sk&&a.lv==n&&!a.gate).map(a=>a.item);TL.forEach((l,i)=>{if(l==n&&i>0)u.push(TN[i]+' '+TK[sk])});return u.length?' Unlocked: '+u.join(', ')+'.':''}
function buyTool(sk){const t=S.tool[sk]+1;if(t<5&&lv(S.xp[sk])>=TL[t]&&S.a>=TC[t]){S.a-=TC[t];S.tool[sk]=t;say('Equipped '+TN[t]+' '+TK[sk]+'.')}}
function toolRow(k){const t=S.tool[k],n=t+1;return '<div class="row"><span>'+TN[t]+' '+TK[k]+'<small>Bonus yield '+Math.round(lv(S.xp[k])*.4)+'% · '+(t<4?'Next: '+TN[n]+' (level '+TL[n]+', '+TM[n]+'× time)':'Best tool')+'</small></span>'+(t<4?'<button class="btn" data-tool="'+k+'"'+(lv(S.xp[k])<TL[n]||S.a<TC[n]?' disabled':'')+'>'+TC[n]+'</button>':'')+'</div>'}
let S:SaveState=null,tab='skills',who='you',skill=null;
try{S=JSON.parse(localStorage.getItem('hollowbrook1'))}catch(e){}
if(!S)S={sp:null,xp:{Foraging:0,Woodcutting:0,Fishing:0,Mining:0},inv:{},a:0,cur:null,p:0,hired:{},t:Date.now(),log:[]} as unknown as SaveState;
S.tier=S.tier||{};S.best=S.best||{};S.cx=S.cx||{};S.lead=S.lead||null;S.style=S.style||'Melee';S.gear=S.gear||{Melee:0,Ranged:0,Magic:0,arm:0};if(S.xp.Attack==null&&(S.xp.Melee||S.xp.Ranged||S.xp.Magic)){const b0=Math.max(S.xp.Melee||0,S.xp.Ranged||0,S.xp.Magic||0);S.xp.Attack=S.xp.Strength=S.xp.Defense=b0}
CS.forEach(k=>S.xp[k]=S.xp[k]||(k=='Vitality'?XT[10]:0));S.tool=S.tool||{Foraging:0,Woodcutting:0,Fishing:0,Mining:0};if(S.cur&&S.cur.k=='s'&&!A.find(a=>a.id==S.cur.id))S.cur=null;
if(S.cur&&S.cur.k=='c'&&!E.find(e=>e.id==S.cur.id))S.cur=null;
if(!S.own){if(S.gear){const rf=(g,c)=>c.slice(0,g).reduce((a,b)=>a+b,0);S.a+=['Melee','Ranged','Magic'].reduce((s,k)=>s+rf(S.gear[k]||0,[80,300,900]),0)+rf(S.gear.arm||0,[100,400,1000]);delete S.gear}S.own={w00:1,w10:1,w20:1};S.eq={Melee:'w00',Ranged:'w10',Magic:'w20',body:null,head:null,trinket:null}}
S.kc=S.kc||{};S.pity=S.pity||{};S.col=S.col||{};S.zone=S.zone||0;S.stance=S.stance||'bal';S.pt=S.pt||0;S.str=S.str||0;S.su=S.su||{};S.task=S.task||null;if(S.cur&&S.cur.k=='f'&&!IT[S.cur.id])S.cur=null;
initDish();SK.forEach(k=>S.xp[k]=S.xp[k]||0);S.tool.Hunting=S.tool.Hunting||0;if(S.cur&&S.cur.k=='k'&&!DISH[S.cur.id])S.cur=null;if(S.hp==null)S.hp=30+lv(S.xp.Vitality)*10;
const save=()=>{try{localStorage.setItem('hollowbrook1',JSON.stringify(S))}catch(e){}};
const say=(m)=>{S.log.unshift(m);S.log=S.log.slice(0,12)};
const power=()=>Math.floor(SK.concat(CS).reduce((s,k)=>s+lv(S.xp[k]),0)/2)+fighters().reduce((s,k)=>s+hp(k),0);
const cl=k=>lv(S.cx[k]||0);
const hp=k=>H[k].p+(cl(k)-1)*(k==S.lead?2:1);
const LD=()=>lv(S.xp.Leadership);
const slots=()=>LT.filter(l=>l<=LD()).length;
const bspd=()=>(.25+.0075*LD())*(1+cb('mspd'));
const mspd=k=>bspd()*(1+.01*(cl(k)-1));
const asg=k=>S.mt[k]||{k:'war'};
