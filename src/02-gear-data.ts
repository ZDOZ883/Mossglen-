import { S, say } from './00-state';
import { X } from './registry';
import { BD, CRS, D, FOOD, GN, H, IT, REQ, SL, V, WA, cb, ldx, lv, mxp, skPet, useMats } from './01-species-pets';
// Gear: slots, grips, grades, items. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
// ---------- expanded gear: legs, necklaces, rings, cloaks
export const PRE=['Twig','Hide','Moss','Moonsteel','Amber','Frostglass','Sunforged','Starbound','Deepwood','Wyrmscale','Eclipse'];
export const GM=[1,1.5,2,2.6,3.2,4,4.8,5.8,7,8.5,10];
export const LGD=[3,6,11,17,25,35,46,59,74,96,124];
export const LGN=['Bark Leggings','Hide Greaves','Mossweave Leggings','Moonsteel Greaves','Amber Greaves','Frostglass Greaves','Sunforged Greaves','Starbound Greaves','Deepwood Greaves','Wyrmscale Greaves','Eclipse Greaves'];
export const AF:Record<string,any>={
ring:[{n:'Band of Might',rs:'Strength',fx:[['dmgm',.006,null],['acc',.003,null]]},{n:'Band of Warding',rs:'Defense',fx:[['taken',.008,null],['hpm',.01,null]]},{n:'Band of the Harvest',rs:'gath',fx:[['spd',.008,'G'],['yld',.006,'G']]},{n:'Band of Craft',rs:'prod',fx:[['spd',.008,'P'],['save',.006,'P']]}],
neck:[{n:'Pendant of Vigor',rs:'Vitality',fx:[['hpm',.015,null],['regen',.015,null]]},{n:'Pendant of Fortune',rs:'Attack',fx:[['drop',.02,null],['sell',.015,null]]},{n:'Pendant of Lore',rs:'Defense',fx:[['xpm',.012,null],['xp',.012,'A']]},{n:'Pendant of the Hunt',rs:'Attack',fx:[['crit',.006,null],['acc',.004,null]]}],
cloak:[{n:'Cloak of the Warrior',rs:'Strength',fx:[['dmgm',.008,null],['crit',.005,null]]},{n:'Cloak of the Warden',rs:'Defense',fx:[['taken',.01,null],['hpm',.01,null]]},{n:'Cloak of the Forager',rs:'gath',fx:[['spd',.01,'G'],['xp',.01,'G'],['yld',.004,'G']]},{n:'Cloak of the Artisan',rs:'prod',fx:[['spd',.01,'P'],['xp',.01,'P'],['save',.006,'P'],['burn',.01,'Cooking']]}]};
export const ACCL:Record<string,string>={ring:'r',neck:'n',cloak:'c'};
for(let t=0;t<11;t++){
  IT['g'+t]={n:LGN[t],slot:'legs',tier:t,stat:LGD[t],req:REQ[t]};
  Object.keys(AF).forEach(sl=>AF[sl].forEach((f:any,i:number)=>{IT[ACCL[sl]+i+'_'+t]={n:PRE[t]+' '+f.n,slot:sl,tier:t,stat:0,req:REQ[t],rs:f.rs,cmb:['Strength','Defense','Vitality','Attack'].includes(f.rs),fam:i,fx:f.fx.map((e:Enemy)=>[e[0],Math.round(e[1]*GM[t]*10000)/10000,e[2]])}}));
}
// weapon grips: two-handers, off-hand weapons (dual wield) and shields
export const N2=['Greataxe','Warbow','Great Staff'],NO=['Dirk','Hand Crossbow','Spell Tome'];
for(let t=0;t<11;t++){
  SL.forEach((sl,i)=>{
    IT['x'+i+t]={n:PRE[t]+' '+N2[i],slot:sl,tier:t,stat:WA[t],req:REQ[t],kind:'2h'};
    IT['o'+i+t]={n:PRE[t]+' '+NO[i],slot:'off',tier:t,stat:Math.round(WA[t]*.7),req:REQ[t],kind:'off',st:sl,rs:'Attack'};
  });
  IT['y'+t]={n:PRE[t]+' Shield',slot:'off',tier:t,stat:Math.round(BD[t]*.45),req:REQ[t],kind:'shield',rs:'Defense'};
}
// quality grades: Plain (shop, tiers 0-1) < crafted < Heirloom (zone, boss and raid drops)
(function(){Object.keys(IT).slice().forEach(id=>{const b=IT[id];if(b.slot=='trinket')return;
  const mk=(sfx:any,pre:string,m:number)=>{const o=Object.assign({},b);o.n=pre+' '+b.n;o.q=sfx;o.base=id;o.stat=Math.round(b.stat*m);if(b.fx)o.fx=b.fx.map(e=>[e[0],Math.round(e[1]*m*10000)/10000,e[2]]);IT[id+sfx]=o};
  if(b.tier<=1)mk('s','Plain',.75);mk('d','Heirloom',1.25)})})();
export const qrank=(it:Item)=>it.q=='s'?0:it.q=='d'?2:1;
export const rsLv=(rs:string)=>rs=='gath'?Math.max(...GSK.map(k=>lv(S.xp[k]))):rs=='prod'?Math.max(...PSK.map(k=>lv(S.xp[k]))):lv(S.xp[rs]);
export const skey=(k:string)=>k.replace(/\d$/,'');
export function itFx(it:Item){const o:any[]=[];(it.fx||[]).forEach((e:any)=>{const sc=e[2];if(sc==null)o.push({k:e[0],v:e[1],sk:null});else{const L=sc=='G'?GSK:sc=='P'?CRS.concat('Cooking'):sc=='A'?GSK.concat(CRS,'Cooking'):[sc];L.forEach(sk=>o.push({k:e[0],v:e[1],sk}))}});return o}
export function gearFx(){const o:any[]=[];['neck','ring1','ring2'].forEach(k=>{const id=S.eq&&S.eq[k];if(id&&IT[id])o.push(...itFx(IT[id]))});return o}
export let GSIG='';
export function gearSync(){if(!S||!S.eq)return;const g=[S.eq.neck,S.eq.ring1,S.eq.ring2,S.cape].join('|');if(g!==GSIG){GSIG=g;X.refreshFx()}}
export const scopeTxt=(it:Item)=>{const e=(it.fx||[])[0];if(!e||e[2]==null)return '';return ({G:' (gathering)',P:' (crafting and cooking)',A:''} as any)[e[2]]||''};
export const accScore=(it:Item,kind:string,sk?:string)=>{let v=0;itFx(it).forEach(e=>{const w=X.CW[kind][e.k];if(!w)return;let m=1;if(e.sk){if(sk){if(e.sk!=sk)return}else m=.2}v+=w*e.v*m});return v};

export const ZN:Zone[]=[
['Sunlit Meadow',1,['Magic','Melee','Ranged','Melee'],['Garden Slug','Thistle Shrew','Marsh Heron','Old Gnawtooth'],'meadow pelt'],
['Briarwood',10,['Ranged','Melee','Magic','Melee'],['Bramble Wasp','Hollow Stoat','Mist Adder','Thornjaw, Stoat-King'],'briar thorn'],
['Mossy Fen',20,['Magic','Melee','Ranged','Magic'],['Fen Toad Witch','Bog Rat Pack','Reed Archer Frog','The Bog Matron'],'fen scale'],
['Howling Cliffs',32,['Ranged','Melee','Magic','Ranged'],['Crag Hawk','Ridge Boar','Wind Sage Bat','Stormwing'],'cliff feather'],
['Amber Caverns',45,['Magic','Melee','Ranged','Melee'],['Crystal Newt','Rockjaw Lizard','Echo Bat','Deepdelve Wyrmling'],'cave crystal'],
['Frostwood',60,['Ranged','Melee','Magic','Magic'],['Frost Hare Archer','Rimefang Wolf','Snow Owl Mystic','The Winter Warden'],'frost fur'],
['Sunscorch Dunes',75,['Melee','Magic','Ranged','Melee'],['Dune Scorpion','Mirage Fox','Dust Raven','The Sandwyrm'],'dune glass'],
['Starfall Spire',90,['Magic','Ranged','Melee','Ranged'],['Star Wisp','Thunder Raven','Spire Guard Rat','The Raven Queen'],'star dust'],
['Deepwood Hollow',100,['Melee','Ranged','Magic','Ranged'],['Rootbound Brute','Gloom Archer','Hexroot Mystic','The Rotting Heart'],'deep root',1,'Deepwood Core'],
['Wyrmscale Ridge',110,['Magic','Melee','Ranged','Melee'],['Ember Drake','Scaleguard Hulk','Ridge Stalker','Ashmaw the Wyrm'],'wyrm scale',2,'Wyrm Core'],
['Eclipse Sanctum',120,['Ranged','Magic','Melee','Magic'],['Umbral Sentinel','Dusk Oracle','Eclipse Knight','The Hollow Sun'],'eclipse dust',3,'Eclipse Core']];
export const H0=[200,696,2111,4259,9500,16382,31542,47988,74866,109780,160075],D0=[3.83,6.83,12.5,19.17,28.83,43.83,64.17,91.83,137.83,181.9,332.7],MV=[4,10,22,45,90,170,300,520,900,1500,2600];
export const XK=[0.04444,0.02682,0.01895,0.01722,0.01368,0.01323,0.01078,0.01056,0.00997,0.00978,0.00937],AK=[0.00333,0.00134,0.00227,0.00459,0.0076,0.01628,0.02994,0.05279,0.0774,0.0861,0.0781];
export const E:Enemy[]=[];ZN.forEach((z,i)=>{[0,1,2,3].forEach(j=>{const hp=Math.round(H0[i]*[.8,1,1.25,6][j]);E.push({id:'z'+i+'m'+j,zone:i,n:z[3][j],type:z[2][j],hp,dps:D0[i]*[1.2,1,.8,1.5][j],xp:Math.round(hp*XK[i]),a:Math.round(hp*AK[i]),boss:j==3})})});
ZN.forEach((z,i)=>V[z[4]]=MV[i]);
export const gateOk=(n:any)=>!n||!!(S&&S.gates&&S.gates[n]);
export const zoneOpen=(i:number)=>X.CL()>=ZN[i][1]&&gateOk(ZN[i][5]);
export const dropTier=(z:any)=>z<=7?Math.min(7,z+1):z;
export const elv=(e:Enemy)=>e.lvl||ZN[e.zone][1];
ZN.forEach((z,i)=>{if(z[6])V[z[6]]=MV[i]*20});
D.forEach(d=>{if(V[d.tr]==null)V[d.tr]=Math.round(d.a[0]*.8)});
export const GSK=['Foraging','Woodcutting','Fishing','Mining','Hunting'],PSK=['Cooking','Smithing','Fletching','Enchanting','Tailoring'];
// refined components for tier 8-10 gear
export const RF:Record<string,string[]>={Smithing:['Deepmetal Ingot','Wyrm Ingot','Eclipse Ingot'],Fletching:['Deepwood Plank','Wyrmwood Plank','Eclipse Plank'],Enchanting:['Deep Essence','Wyrm Essence','Eclipse Essence'],Tailoring:['Deepweave','Wyrmweave','Eclipse Weave']};
export const RFN:Record<string,{n:string;sk:string;t:number;req:number}>={};Object.keys(RF).forEach(sk=>RF[sk].forEach((n:string,j:number)=>{const t=8+j;RFN['r'+sk[0]+t]={n,sk,t,req:REQ[t]};V[n]=[900,2400,6000][j]}));
export const ctime=(id:string)=>IT[id].tier>=8?[14,20,28][IT[id].tier-8]:4;
export function refRecipe(id:string){const f=RFN[id],q=6+2*(f.t-8),i=f.t-1,g=(k:string)=>GN[k][i][1],m={},add=(k:string,n:number)=>(m as any)[k]=((m as any)[k]||0)+n;
  if(f.sk=='Smithing'){add(g('Mining'),2*q);add(g('Woodcutting'),q)}
  else if(f.sk=='Fletching'){add(g('Woodcutting'),2*q);add(g('Foraging'),q)}
  else if(f.sk=='Enchanting'){add(g('Foraging'),2*q);add(g('Mining'),q)}
  else{add(g('Hunting'),2*q);add(g('Fishing'),q)}
  return m}
export function refineDone(id:string,mk?:any){
  const f=RFN[id];
  if(!gateOk(f.t-7)||lv(S.xp[f.sk])<f.req){if(mk)S.mt[mk]={k:'idle'};else S.cur=null;return}
  if(!useMats(refRecipe(id),f.sk)){if(mk){S.mt[mk]={k:'idle'};say(H[mk].n+' ran out of materials for '+f.n+'.')}else{S.cur=null;say('Out of materials for '+f.n+'.')}return}
  S.inv[f.n]=(S.inv[f.n]||0)+(mk?X.famCut(mk,1):1);skPet(f.sk);
  const x=[1800,3200,5600][f.t-8];
  if(mk){mxp(mk,x*.6);ldx(x*.5)}else{const b=lv(S.xp[f.sk]);S.xp[f.sk]+=x*(1+cb('xp',f.sk));if(lv(S.xp[f.sk])>b)say(f.sk+' reaches level '+lv(S.xp[f.sk])+'.')}
}
// protected items
export const KP:Record<string,number>={};ZN.forEach(z=>{if(z[6])KP[z[6]]=1});Object.keys(RFN).forEach(id=>KP[RFN[id].n]=1);D.forEach(d=>KP[d.tr]=1);
export const KEEPX:Record<string,string>={};// seeds and potions: kept out of Sell-all, label shown in the pack
export const KEEP=(k:string)=>!!FOOD[k]||!!KP[k]||!!KEEPX[k];

