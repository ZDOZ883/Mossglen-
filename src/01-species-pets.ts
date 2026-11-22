import { S, say } from './00-state';
import { X } from './registry';
// Species traits and pets. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export const SK=['Foraging','Woodcutting','Fishing','Mining','Hunting'];
export let FXC:FxEntry[]=[];
export const V:Record<string,number>={berries:2,mushrooms:5,truffles:15,twigs:1,'birch logs':4,'oak limbs':12,minnows:2,trout:6,pike:18,pebbles:1,flint:5,amber:20,'Hollow Heart':40,'Badger Claw':120,'Crow Feather':300,pelts:8};
export const SP:Record<string,string>={Hedgehog:'Foraging',Beaver:'Woodcutting',Otter:'Fishing',Badger:'Mining',Fox:'Hunting',Mouse:'Cooking'};
// small species flavour: one perk, one drawback, one combat affinity (a style and a grip)
export const SPX:Record<string,any>={
Hedgehog:{t:'Prickly hide: 3% less damage taken.',fx:[['taken',.03,null]],w:'Hunting 4% slower.',wf:[['spd',-.04,['Hunting']]],st:'Melee',gp:'sh',gt:'shield'},
Beaver:{t:'Careful hands: 3% chance to save crafting materials.',fx:[['save',.03,'P']],w:'Foraging 4% slower.',wf:[['spd',-.04,['Foraging']]],st:'Ranged',gp:'2h',gt:'two-hander'},
Otter:{t:'Born to the water: 3% more double fish.',fx:[['yld',.03,['Fishing']]],w:'Mining 4% slower.',wf:[['spd',-.04,['Mining']]],st:'Ranged',gp:'dw',gt:'dual wield'},
Badger:{t:'Stout: 3% more max health.',fx:[['hpm',.03,null]],w:'Fishing 4% slower.',wf:[['spd',-.04,['Fishing']]],st:'Melee',gp:'2h',gt:'two-hander'},
Fox:{t:'Sharp eyes: 3% more rare drops.',fx:[['drop',.03,null]],w:'Woodcutting 4% slower.',wf:[['spd',-.04,['Woodcutting']]],st:'Magic',gp:'dw',gt:'dual wield'},
Mouse:{t:'Light fingers: 5% less burning when cooking.',fx:[['burn',.05,['Cooking']]],w:'Mining 4% slower.',wf:[['spd',-.04,['Mining']]],st:'Magic',gp:'sh',gt:'shield'}};
export const spTxt=(n:any)=>{const x=SPX[n];return x.t+' '+x.w+' '+x.st+' style +4% damage, and +3% more with a '+x.gt+'.'};
export function spFx(){const o:any[]=[];const x=SPX[(S&&S.sp)!];if(!x)return o;x.fx.concat(x.wf).forEach((e:FxDef)=>{const L:(string|null)[]=e[2]==null?[null]:e[2]=='P'?['Smithing','Fletching','Enchanting','Tailoring']:([] as string[]).concat(e[2]);L.forEach(sk=>o.push({k:e[0],v:e[1],sk}))});return o}
export const spAff=()=>{const x=SPX[S.sp!];if(!x)return 0;let v=S.style==x.st?.04:0;const gp=X.is2h()?'2h':X.dwf()>0?'dw':X.shieldOn()?'sh':'';if(gp&&gp==x.gp)v+=.03;return v};
export const LT=[1,10,25,40,55,70,85,100,115];
export const H:Record<string,Member>={mole:{n:'Mole Sapper',c:100,p:6,st:'Melee',role:'Tank',pk:{dmg:.03,taken:.06},d:'Tunnels past traps and soaks up hits.'},hare:{n:'Hare Courier',c:400,p:3,st:'Ranged',role:'Striker',pk:{dmg:.08,speed:.15},d:'Quick paws. Expeditions return sooner.'},owl:{n:'Owl Scout',c:1500,p:2,st:'Magic',role:'Scout',pk:{dmg:.05,loot:.25},d:'Spots hidden stashes. Expeditions bring back more.'},otter:{n:'Otter Medic',c:5000,p:4,st:'Magic',role:'Healer',pk:{dmg:.02,heal:.02,succ:5},d:'Patches you up after every kill.'},badger:{n:'Badger Warden',c:15000,p:8,st:'Melee',role:'Tank',pk:{dmg:.04,taken:.1,succ:3},d:'Holds the line against anything.'},fox:{n:'Fox Skirmisher',c:40000,p:6,st:'Ranged',role:'Striker',pk:{dmg:.12},d:'Strikes hard from the flank.'},
// Specialists: weaker in a fight (see fw), but each brings something the rest of the party cannot.
dormouse:{n:'Dormouse Gardener',c:120000,p:3,st:'Magic',role:'Specialist',spec:true,pk:{dmg:.04,heal:.02},d:'Green fingers. While she is in your party, farmhands grow crops 50% faster.'},shrew:{n:'Shrew Brewer',c:400000,p:3,st:'Magic',role:'Specialist',spec:true,pk:{dmg:.05,taken:.03},d:'Steady hands. Potions last 20% longer while she is in your party.'},magpie:{n:'Magpie Quartermaster',c:1200000,p:4,st:'Ranged',role:'Specialist',spec:true,pk:{dmg:.05,loot:.3,succ:6},d:'Hoards everything. Party members hand 8% more of their work back to you.'}};
export const HK=Object.keys(H);HK.forEach((k,i)=>H[k].lt=LT[i]);
// ---------- pets: extremely rare miniature party members
export const SPN:Record<string,any[]>={Foraging:['Truffle Pup','Melee',{dmg:.05,taken:.05}],Woodcutting:['Splinter the Beaver','Melee',{dmg:.06,taken:.05}],Fishing:['Tiny Heron','Ranged',{dmg:.06,speed:.1}],Mining:['Pebble Mole','Melee',{dmg:.04,taken:.07}],Hunting:['Snare Weasel','Ranged',{dmg:.07,loot:.15}],Cooking:['Soup Sprite','Magic',{heal:.03,taken:.05}],Smithing:['Ember Hedgehog','Melee',{dmg:.06,taken:.06}],Fletching:['Feather Wren','Ranged',{dmg:.08,speed:.1}],Enchanting:['Glimmer Moth','Magic',{dmg:.07,loot:.2}],Tailoring:['Thread Spider','Magic',{taken:.08,heal:.01}],Farming:['Sprout the Vole','Melee',{taken:.06,heal:.01}],Alchemy:['Cauldron Newt','Magic',{dmg:.07,heal:.02}],Attack:['Quillpoint the Duelist','Melee',{dmg:.06,acc:.05}],Strength:['Brawny Vole','Melee',{dmg:.12}],Defense:['Shieldback Beetle','Melee',{taken:.12}],Vitality:['Hardy Dormouse','Magic',{heal:.03,hp:.08}],Slayer:['Thistle Cub','Melee',{dmg:.09,taken:.04}],Leadership:['Little Warden','Melee',{dmg:.04,succ:6,speed:.1}]};
export const ZPN=['Gnawtooth Kit','Thornjaw Pup','Bog Matron Tadpole','Stormwing Chick','Wyrmling Hatchling','Winter Warden Cub','Sandwyrm Pup','Raven Queen Fledgling','Rotting Sprout','Ashmaw Whelp','Hollow Sun Wisp'],ZPT=['Melee','Melee','Magic','Ranged','Melee','Magic','Melee','Ranged','Ranged','Melee','Magic'];
export const RPN=['Brindlemaw Cub','Bramblethorn Seedling','Vaerath Hatchling','Eclipse Sovereign Mote'];
export const PETS:any[][]=[];
Object.keys(SPN).forEach(sk=>{const q=SPN[sk];PETS.push(['p_'+sk,q[0],q[1],q[2],(['Attack','Strength','Defense','Vitality'].includes(sk)?'A tiny champion of '+sk+'. Its specialty is boosted while it fights beside you.':'A miniature of '+sk+' itself. Works its own skill 30% faster with a better yield, and fights a little harder than most.'),sk,6])});
ZPN.forEach((n,i)=>{const t=ZPT[i];PETS.push(['p_z'+i,n,t,t=='Melee'?{dmg:.04+.006*i,taken:.06+.008*i}:t=='Ranged'?{dmg:.07+.009*i,speed:.1}:{dmg:.05+.007*i,heal:.01+.002*i},'A tiny, loyal copy of a zone boss.',null,6+2*i])});
RPN.forEach((n,j)=>PETS.push(['p_r'+j,n,'Melee',{dmg:.12+.02*j,taken:.1,heal:.02},'A raid boss, shrunk to pocket size.',null,20+6*j]));
PETS.forEach(q=>{H[q[0]]={n:q[1],c:0,p:q[6],st:q[2],role:'Pet',pk:q[3],d:q[4],lt:0,pet:true,sk:q[5]}});
export const pbs=(k:string,sk:string)=>H[k]&&H[k].pet&&H[k].sk&&H[k].sk==sk?1.3:1;
export const nsl=()=>Object.keys(S.hired).length;
export function gainPet(id:string){
  if(S.pets[id]||!H[id])return;
  S.pets[id]=1;S.cx[id]=XT[10];
  if(nsl()<X.slots()){S.hired[id]=1;S.mt[id]={k:'war'};if(!S.lead)S.lead=id;say('★ Extremely rare! '+H[id].n+' has joined your party.')}
  else say('★ Extremely rare! You found '+H[id].n+'. Your party is full, so it waits at home. Swap it in from the Party tab.');
}
export const PB:Record<string,number>={Attack:40000,Strength:40000,Defense:40000,Vitality:40000,Foraging:150000,Woodcutting:160000,Fishing:130000,Mining:250000,Hunting:100000,Cooking:110000,Smithing:90000,Fletching:80000,Enchanting:90000,Tailoring:85000,Farming:95000,Alchemy:90000};
export function skPet(sk:string){if(typeof sk!='string')return;let r=PB[sk]-25*lv(S.xp[sk]);if(S.xp[sk]>=2e8)r/=15;petRoll('p_'+sk,r)}
export function petRoll(id:string,rate:number){if(S.pets[id])return;if(Math.random()*rate<1+Math.max(0,cb('drop'))+X.ef('drop'))gainPet(id)}

export const D=[
{id:'hollow',n:'The Hollow Oak',req:12,t:30,a:[15,30],tr:'Hollow Heart',type:'Magic'},
{id:'sett',n:'The Old Sett',req:30,t:60,a:[50,100],tr:'Badger Claw',type:'Melee'},
{id:'roost',n:'The Crow’s Roost',req:70,t:120,a:[150,280],tr:'Crow Feather',type:'Ranged'},
{id:'root',n:'The Rootgate Descent',req:600,t:150,a:[700,1200],tr:'Root Relic',type:'Ranged',gate:1},
{id:'wyrmc',n:'The Wyrm’s Cellar',req:1000,t:200,a:[2000,3500],tr:'Wyrm Relic',type:'Melee',gate:2},
{id:'vault',n:'The Eclipse Vault',req:1500,t:260,a:[5500,9500],tr:'Eclipse Relic',type:'Magic',gate:3}] as unknown as Delve[];
export const XT=[0,0];(()=>{let p=0;for(let x=1;x<127;x++){p+=Math.floor(x+300*Math.pow(2,x/7));XT[x+1]=Math.floor(p/4)}})();
export const lv=(x:number)=>{let a=1,b=120;while(a<b){const m=(a+b+1)>>1;if(x>=XT[m])a=m;else b=m-1}return a};
export const CS=['Attack','Strength','Defense','Vitality'];
export const BEATS:Record<string,string>={Melee:'Ranged',Ranged:'Magic',Magic:'Melee'};
export const adv=(a:string,b:string)=>BEATS[a]==b?1:BEATS[b]==a?-1:0;
export const weak=(t:string)=>Object.keys(BEATS).find(k=>BEATS[k]==t);
export const W:Record<string,string[]>={Melee:['Flint Claws','Briar Spear','Amber Cleaver'],Ranged:['Twig Bow','Birch Longbow','Amber Crossbow'],Magic:['Hazel Wand','Mooncap Staff','Amber Scepter']};
export const AR=['Bark Vest','Mossweave Coat','Amber Mail'];
export const maxhp=()=>Math.round((30+lv(S.xp.Vitality)*10)*(1+cb('hpm')+pk('hp')));
export const SL=['Melee','Ranged','Magic'];
export const XS:Record<string,any[]>={bal:['Balanced',2,2,2,2,.3,'Shares xp evenly between Attack, Strength and Defense, with a little for Leadership when members fight beside you.'],acc:['Accurate',6,0,0,2,0,'Trains Attack: you land more of your hits.'],agg:['Aggressive',0,6,0,2,0,'Trains Strength: your hits land harder.'],def:['Defensive',0,0,6,2,0,'Trains Defense: enemies land fewer hits on you.']};
export const FM:Record<string,any>={steady:{n:'Steady',cl:1,d:'No bonuses or penalties.'},fury:{n:'Fury',cl:10,dmg:.2,taken:.25,d:'+20% damage, +25% damage taken.'},bulwark:{n:'Bulwark',cl:20,dmg:-.1,taken:-.2,d:'−10% damage, −20% damage taken.'},mender:{n:'Mender',cl:35,dmg:-.05,regen:1,d:'−5% damage, double regeneration between fights.'},fortune:{n:'Fortune',cl:50,dmg:-.1,drop:.15,gold:.1,d:'−10% damage, +15% rare drops, +10% acorns.'},warband:{n:'Warband',cl:65,dmg:-.1,party:1.5,d:'−10% damage. Perks of members fighting beside you are 1.5× stronger.'}};
Object.keys(FM).forEach(k=>FM[k]=Object.assign({dmg:0,taken:0,regen:0,drop:0,gold:0,party:1},FM[k]));
export const FOOD:Record<string,number>={berries:8,mushrooms:12,trout:25,pike:40,eels:65,'silver carp':100,moonfish:150,glassfin:220};
export const REQ=[1,5,15,30,45,60,75,90,100,110,120],GP=[20,150,600,2400,8000,25000,80000,250000,600000,1800000,5000000],WA=[3,8,16,28,45,70,100,140,190,260,340],BD=[4,8,14,22,32,44,58,74,92,120,155],HD=[2,4,8,12,18,26,34,44,56,74,96];
export const WNM=[['Twig Club','Flint Claws','Briar Spear','Moonsteel Blade','Amber Cleaver','Frostglass Halberd','Sunforged Sword','Starbound Greatblade','Deepwood Cleaver','Wyrmfang Blade','Eclipse Reaver'],['Twig Sling','Hazel Bow','Birch Longbow','Moonsteel Crossbow','Amber Arbalest','Frostglass Longbow','Sunforged Shortbow','Starbound Railbow','Deepwood Longbow','Wyrmscale Shortbow','Eclipse Windbow'],['Hazel Wand','Mooncap Staff','Rowan Wand','Moonsteel Scepter','Amber Scepter','Frostglass Orb','Sunforged Rod','Starbound Staff','Deepwood Staff','Wyrmheart Rod','Eclipse Scepter']];
export const BYN=['Bark Vest','Hide Jerkin','Mossweave Coat','Moonsteel Mail','Amber Plate','Frostglass Cuirass','Sunforged Plate','Starbound Mail','Deepwood Mail','Wyrmscale Plate','Eclipse Aegis'],HDN=['Leaf Cap','Hide Hood','Moss Cowl','Moonsteel Helm','Amber Helm','Frostglass Crown','Sunforged Helm','Starbound Crown','Deepwood Crown','Wyrmscale Helm','Eclipse Diadem'];
export const IT:Record<string,Item>={};
for(let t=0;t<11;t++){SL.forEach((s,i)=>IT['w'+i+t]={n:WNM[i][t],slot:s,tier:t,stat:WA[t],req:REQ[t]});IT['b'+t]={n:BYN[t],slot:'body',tier:t,stat:BD[t],req:REQ[t]};IT['h'+t]={n:HDN[t],slot:'head',tier:t,stat:HD[t],req:REQ[t]}}
export const TR=[['Acorn Charm',{gold:.1}],['Thornjaw’s Tooth',{dmg:.05}],['Healer’s Bell',{heal:.5}],['Clover Ring',{drop:.25}],['Scholar’s Quill',{xp:.08}],['Frostfang Totem',{dmg:.08}],['Sunglass Charm',{gold:.25,drop:.1}],['Starcrown',{dmg:.1,xp:.1,drop:.1}],['Rootheart Idol',{dmg:.12,gold:.2},100],['Wyrmtooth Pendant',{dmg:.15,heal:.4},110],['Eclipse Sigil',{dmg:.18,xp:.15,drop:.15},120],['Warren Matriarch’s Crest',{dmg:.2,heal:.3},85],['Thornspire Banner',{dmg:.22,drop:.2},100],['Gloamwyrm Eye',{dmg:.25,heal:.5},110],['Citadel Crown of Dusk',{dmg:.3,xp:.2,drop:.2,heal:.4,gold:.3},118]];;
TR.forEach((t:any,i)=>IT['t'+i]={n:t[0],slot:'trinket',tier:i,eff:t[1],req:t[2]||1,stat:0});

export function set_FXC(v:FxEntry[]){FXC=v}
// Shared helpers every module needs, kept here so they can be imported directly instead of going through the registry.
export function cb(k:string,sk?:string){let v=0;for(let i=0;i<FXC.length;i++){const e=FXC[i];if(e.k==k&&(e.sk==null||e.sk=='*'||e.sk==sk))v+=e.v}return v}
export const cl=(k:string)=>lv(S.cx[k]||0);
export const GL=[1,15,30,45,60,75,90,100,110,120];
export const fw=(k:string)=>H[k].spec?.4:1;// specialists fight at 40%, so a bigger party is wider rather than stronger
export const LD=()=>lv(S.xp.Leadership);
export const asg=(k:string)=>S.mt[k]||{k:'war'};
// Party helpers. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export const fighters=()=>Object.keys(S.hired).filter(k=>asg(k).k=='war');
export const pm=()=>(FM[S.form]||FM.steady).party+cb('pmult');
export const pk=(n:string)=>Math.min(({taken:.45,speed:.4} as any)[n]||99,fighters().reduce((s,k)=>s+(H[k].pk[n]||0)*fw(k)*(1+(cl(k)-1)*.02)*pm()*(H[k].pet?1.25:1),0));
export function mxp(k:string,x:number){const b=cl(k);S.cx[k]=(S.cx[k]||0)+x*(H[k].pet?1.5:1);if(cl(k)>b)say(H[k].n+' reaches level '+cl(k)+'.')}
export function ldx(x:number){const b=LD();S.xp.Leadership+=x;const a=LD();if(a>b){const u=HK.filter(k=>H[k].lt>b&&H[k].lt<=a).map(k=>H[k].n);say('Leadership reaches level '+a+'.'+(LT.some(l=>l>b&&l<=a)?' New party slot.':'')+(u.length?' Now available: '+u.join(', ')+'.':''))}}
export const onTask=(e:Enemy)=>!!S.task&&S.task.id==e.id;
export const T=(d:Delve)=>S.tier[d.id]||1;
export function useMats(r:any,sk:string){if(!Object.keys(r).every(k=>(S.inv[k]||0)>=r[k]))return false;if(sk&&Math.random()<cb('save',sk))return true;Object.keys(r).forEach(k=>S.inv[k]-=r[k]);return true}
// ---------- burrow home base
export const CRS=['Smithing','Fletching','Enchanting','Tailoring'];
export const GN:Record<string,string[][]>={Foraging:[['Pick berries','berries'],['Dig up mushrooms','mushrooms'],['Sniff out truffles','truffles'],['Gather moonroot','moonroot'],['Find frostcaps','frostcaps'],['Pluck sunpetals','sunpetals'],['Reach for starbloom','starbloom'],['Cut deepbloom','deepbloom'],['Harvest wyrmcap','wyrmcap'],['Pluck eclipse lotus','eclipse lotus']],Woodcutting:[['Gather twigs','twigs'],['Gnaw birch logs','birch logs'],['Fell an oak limb','oak limbs'],['Cut willow boughs','willow boughs'],['Fell maple staves','maple staves'],['Hew yew limbs','yew limbs'],['Claim elderwood','elderwood'],['Fell ironroot','ironroot'],['Claim wyrmwood','wyrmwood'],['Hew duskoak','duskoak']],Fishing:[['Catch minnows','minnows'],['Spear trout','trout'],['Hook a pike','pike'],['Trap eels','eels'],['Net silver carp','silver carp'],['Lure moonfish','moonfish'],['Land a glassfin','glassfin'],['Hook cavefin','cavefin'],['Land a drakescale','drakescale'],['Spear voidfin','voidfin']],Mining:[['Collect pebbles','pebbles'],['Chip flint','flint'],['Pry out amber','amber'],['Dig silver','silver'],['Cut moonstone','moonstone'],['Free a garnet','garnets'],['Mine starstone','starstone'],['Cut deepcrystal','deep crystal'],['Mine wyrmiron','wyrmiron'],['Quarry eclipsite','eclipsite']],Hunting:[['Snare beetles','beetles'],['Trap crickets','crickets'],['Gather snails','snails'],['Catch frogs','frogs'],['Net newts','newts'],['Snare skinks','sand skinks'],['Lure moon moths','moon moths'],['Snare rootbeetles','root beetles'],['Net ember moths','ember moths'],['Trap dusk spiders','dusk spiders']]};
