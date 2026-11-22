// Hand-drawn SVG icons. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
// ---------- hand-drawn fantasy icons (32x32, line art)
const ICN:Record<string,string>={
sword:'<path class="f" d="M23 5H27V9L13 23L9 19Z"/><path d="M7 17L15 25"/><path d="M10 22L5.5 26.5"/><circle cx="4.5" cy="27.5" r="1.6" class="f"/>',
axe:'<path d="M6 27L23 10"/><path class="f" d="M17 4Q29 5 28 17Q22 15 14 11Z"/><path d="M5 28l2-2"/>',
dagger:'<path class="f" d="M22 6L26 10L16 20L12 16Z"/><path d="M9 14L18 23"/><path d="M12 19L7 24"/><circle cx="6" cy="25" r="1.5" class="f"/>',
shortbow:'<path d="M11 5Q25 16 11 27"/><path d="M11 5V27"/><path d="M5 16H21"/><path d="M21 16l-3-2.2M21 16l-3 2.2"/>',
longbow:'<path d="M9 3Q29 16 9 29"/><path d="M9 3V29"/><path d="M4 16H25"/><path d="M25 16l-3.5-2.6M25 16l-3.5 2.6"/><path d="M4 16l-1.5-2M4 16l-1.5 2"/>',
crossbow:'<path d="M5 17H25"/><path d="M5 17l-1 4h5"/><path d="M19 7Q27 17 19 27"/><path d="M19 7V27"/><path d="M12 17V13l3 4"/>',
wand:'<path d="M6 26L21 11"/><path class="f" d="M24 4l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/><path d="M5 27l1.5-1.5"/>',
staff:'<path d="M8 29L21 14"/><circle cx="24" cy="9" r="4.5"/><circle cx="24" cy="9" r="1.6" class="f"/><path d="M19 4l1 2M29 14l-2-1M28 3l-2 2"/>',
tome:'<path class="f" d="M8 5H23Q25 5 25 7V24H10Q8 24 8 22Z"/><path d="M8 22Q8 27 11 27H25"/><path d="M12 5V24"/><path d="M18.5 10l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"/>',
helm:'<path class="f" d="M6 19Q6 6 16 5Q26 6 26 19V25H20V19H12V25H6Z"/><path d="M16 5V12"/><path d="M11 15H21"/><path d="M13 3.5Q16 1 19 3.5"/>',
chest:'<circle cx="7.5" cy="10" r="3.8" class="f"/><circle cx="24.5" cy="10" r="3.8" class="f"/><path class="f" d="M10.5 8H21.5L23 18Q22 25 16 28Q10 25 9 18Z"/><path d="M16 11V27"/><path d="M12 16Q16 19.5 20 16"/>',
legs:'<path class="f" d="M7 4H25V8.5H7Z"/><path class="f" d="M8 8.5H15.2L14.2 28H9.2Z"/><path class="f" d="M16.8 8.5H24L22.8 28H17.8Z"/><path d="M8.7 17.5H14.7M17.3 17.5H23.3"/><path d="M9.2 28L7.5 29.5M22.8 28L24.5 29.5"/>',
amulet:'<path d="M7 4Q16 22 25 4"/><path class="f" d="M16 18L21 23L16 29L11 23Z"/><path d="M16 21V26"/>',
ring:'<circle cx="16" cy="20" r="7.5"/><circle cx="16" cy="20" r="4.5"/><path class="f" d="M12.5 9.5L16 4.5L19.5 9.5L16 13Z"/>',
cape:'<path class="f" d="M11 4Q16 8 21 4L27 27Q16 22 5 27Z"/><circle cx="16" cy="9" r="1.8" class="f"/><path d="M13 14L10 24M19 14L22 24"/>',
shield:'<path class="f" d="M16 4L26 7V15Q26 23 16 28Q6 23 6 15V7Z"/><circle cx="16" cy="14" r="3.5"/><path d="M16 7V10.5M16 17.5V25"/>',
charm:'<path class="f" d="M16 5L24 12L16 28L8 12Z"/><path d="M8 12H24"/><path d="M16 5V28"/><path d="M13 5Q16 1 19 5"/>',
leaf:'<path class="f" d="M7 26Q5 10 25 6Q28 23 12 27Z"/><path d="M8 25L21 12"/>',
swords:'<path d="M6 6L22 22M26 6L10 22"/><path d="M18 26L26 18M14 26L6 18"/><path d="M22 22L26 26M10 22L6 26"/>',
paw:'<ellipse cx="16" cy="21" rx="6.5" ry="5.5" class="f"/><circle cx="7.5" cy="14" r="2.4" class="f"/><circle cx="12.5" cy="8.5" r="2.4" class="f"/><circle cx="19.5" cy="8.5" r="2.4" class="f"/><circle cx="24.5" cy="14" r="2.4" class="f"/>',
lantern:'<path d="M12.5 6Q16 1.5 19.5 6"/><path d="M10.5 8H21.5"/><path class="f" d="M12 8V23H20V8Z"/><path d="M16 11Q19.5 15 16 19Q12.5 15 16 11"/><path d="M9.5 26H22.5"/>',
burrow:'<path class="f" d="M3 27Q3 7 16 7Q29 7 29 27Z"/><path d="M12 27V19Q12 14 16 14Q20 14 20 19V27"/><path d="M8 11Q10 9 12 8.5"/>',
satchel:'<path class="f" d="M7 12H25V27H7Z"/><path d="M7 12Q16 21 25 12"/><path d="M12 12V8Q16 3 20 8V12"/><circle cx="16" cy="19" r="1.4"/>'};
const icon=(n:string,z?:number)=>'<svg class="ico" viewBox="0 0 32 32" width="'+(z||34)+'" height="'+(z||34)+'" aria-hidden="true">'+(ICN[n]||'')+'</svg>';
function iconOf(it:Item){
  if(!it)return 'shield';
  const sl=it.slot;
  if(sl=='Melee')return it.kind=='2h'?'axe':'sword';
  if(sl=='Ranged')return it.kind=='2h'?'longbow':'shortbow';
  if(sl=='Magic')return it.kind=='2h'?'staff':'wand';
  if(sl=='off')return it.kind=='shield'?'shield':it.st=='Melee'?'dagger':it.st=='Ranged'?'crossbow':'tome';
  return {head:'helm',body:'chest',legs:'legs',neck:'amulet',ring:'ring',cloak:'cape',trinket:'charm'}[sl]||'charm';
}
const SLIC:Record<string,string>={Melee:'sword',Ranged:'shortbow',Magic:'wand',head:'helm',body:'chest',legs:'legs',neck:'amulet',ring1:'ring',ring2:'ring',trinket:'charm',off:'shield',cape:'cape'};
let gtab='eq',gsel:any=null;
const SLI:Record<string,string[]>={off:['🛡️','Off-hand'],Melee:['🗡️','Melee'],Ranged:['🏹','Ranged'],Magic:['🪄','Magic'],head:['⛑️','Helm'],body:['🦺','Chest'],legs:['👖','Legs'],neck:['📿','Necklace'],ring1:['💍','Ring'],ring2:['💍','Ring'],trinket:['🔮','Trinket'],cape:['🧣','Cape']};
const grade=(it:Item)=>it.slot=='trinket'?['u','Unique']:it.q=='d'?['d','Heirloom']:it.q=='s'?['s','Plain']:['c','Crafted'];
function equipSlot(k:string,id:string){
  if(!id){S.eq[k]=null}
  else{if(!S.own[id]||!IT[id]||!canEq(IT[id]))return;
    if(k=='ring1'&&S.eq.ring2==id)S.eq.ring2=S.eq.ring1||null;
    if(k=='ring2'&&S.eq.ring1==id)S.eq.ring1=S.eq.ring2||null;
    S.eq[k]=id}
  gearSync();
}
function tileHtml(k:string){
  const lab=SLI[k][1],w3=false;let ic;
  if(k=='cape'){const c=S.cape;ic=icon('cape');return '<button class="gt'+(w3?' w3':'')+(c?' q-c':' empty')+'" data-gt="capes"><span class="ic">'+ic+'</span><span class="sl">'+lab+'</span><span class="nm">'+(c?capeLabel(c):'None')+'</span><span class="st">'+(c?'Tap to change':'Skill capes and cloaks')+'</span></button>'}
  const id=S.eq[k],it=id?IT[id]:null,g=it?grade(it):null;ic=icon(it?iconOf(it):SLIC[k]);
  return '<button class="gt'+(w3?' w3':'')+(it?' q-'+g[0]:' empty')+(gsel==k?' sel':'')+'" data-gs="'+k+'"><span class="ic">'+ic+'</span><span class="sl">'+lab+(SL.includes(k)&&S.style==k?' · style':'')+(it&&it.kind=='2h'?' · 2H':'')+'</span><span class="nm">'+(it?it.n:'Empty')+'</span>'+(it?'<span class="st">'+(k=='off'&&!offIt()?(is2h()?'Hands full (two-hander)':'Inactive: wrong style'):istat(it))+'</span><span class="badge '+g[0]+'">'+g[1]+'</span>':'<span class="st">Nothing equipped</span>')+'</button>';
}
function pickerHtml(k:string){
  const ot=k=='ring1'?S.eq.ring2:k=='ring2'?S.eq.ring1:null,cur=S.eq[k];
  const o=Object.keys(S.own).filter(i=>IT[i]&&IT[i].slot==skey(k)).sort((a,b)=>IT[b].tier-IT[a].tier||qrank(IT[b])-qrank(IT[a])||(IT[a].fam||0)-(IT[b].fam||0));
  let h='<h2>'+SLI[k][1]+' · choose</h2>';
  if(!o.length)return h+'<p class="mu">You own nothing for this slot yet. Buy Plain gear in the shop, craft better, or find Heirlooms.</p>';
  h+=o.map(i=>{const it=IT[i],g=grade(it),ok=canEq(it),on=cur==i,mv=ot==i;
    return '<div class="row'+(on?' on':'')+'"><span class="ri">'+icon(iconOf(it),30)+'</span><span style="flex:1">'+it.n+' <span class="badge '+g[0]+'">'+g[1]+'</span><small>'+istat(it)+(ok?'':' · needs '+reqText(it))+(mv?' · in your other ring slot':'')+'</small></span>'+(on?'<button class="btn" data-eq="'+k+':">Remove</button>':ok?'<button class="btn" data-eq="'+k+':'+i+'">'+(mv?'Move here':'Equip')+'</button>':'<span class="mu">Locked</span>')+'</div>'}).join('');
  return h;
}
function bonusSummary(){
  const l:any[]=[];['neck','ring1','ring2'].forEach(k=>{const id=S.eq[k];if(id&&IT[id]&&IT[id].fx)IT[id].fx.forEach(e=>l.push([e[0],e[1]]))});
  if(S.cape){if(S.cape.indexOf('I:')==0){const it=IT[S.cape.slice(2)];if(it&&it.fx)it.fx.forEach(e=>l.push([e[0],e[1]]))}}
  return l.length?fxTxt(l):'';
}
