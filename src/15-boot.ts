import { gameState, save, say, trackAcorns } from './00-state';
import { FM, MEMBERS, LD, asg, buyKit, joinParty, kitTier, known, maxhp, nsl } from './01-species-pets';
import { PRE } from './02-gear-data';
import { exRecall, exSel, exStart, openGate, set_exSel, startHR, startRaid } from './03-world-expeditions';
import { CL, autoLoad, loadoutSl, optNow, optimize, set_hits } from './04-loadout';
import { cycle, shopBuy } from './05-combat';
import { equipSlot, gsel, set_gsel, set_gtab } from './06-icons';
import { ACHIEVEMENTS, buy, buyTool, offlineCap, set_skill, set_tab, set_who, skill, slBuy, slots, tab, taskAct, who } from './07-gear-ui';
import { assign } from './08-party-state';
import { buUp, sgBuy } from './09-seasons-burrow';
import { bars, hasWork, refreshFx, tick } from './11-engine';
import { CF, packAct, render, set_logSub, set_saveMsg } from './13-views';
import { alchAct, farmAct } from './12-farm-alchemy';
// Input handling, boot and timers. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
document.addEventListener('click',e=>{
  const t=(e.target as HTMLElement).closest('button');if(!t)return;const d=t.dataset,a0=gameState.a;
  if(d.sp){gameState.sp=d.sp;if(!gameState.st||!gameState.st.t)gameState.tut=0;refreshFx();say('A '+d.sp.toLowerCase()+' steps out of the burrow. The valley is quiet.')}
  else if(d.tab){if(tab==d.tab&&d.tab=='skills')set_skill(null);set_tab(d.tab)}
  else if(d.skill)set_skill(d.skill);
  else if(d.cmd)gameState.cmd=!gameState.cmd;
  else if('cape' in d){gameState.cape=d.cape||null;refreshFx()}
  else if(d.back)set_skill(null);
  else if(d.farm)farmAct(d.farm);
  else if(d.alch)alchAct(d.alch);
  else if(d.logsub){set_logSub(d.logsub);render();return}
  else if(d.who)set_who(d.who);
  else if(d.assign){const [k,a]=d.assign.split(':');assign(k,a)}
  else if(d.dismiss){const k=d.dismiss;if(asg(k).k=='exp'){say(MEMBERS[k].n+' is away on an expedition.');}else if(gameState.hired[k]){delete gameState.hired[k];gameState.bench[k]=1;gameState.mt[k]={k:'idle'};if(gameState.lead==k)gameState.lead=Object.keys(gameState.hired)[0]||null;if(who==k)set_who('you');say(MEMBERS[k].n+' rests at home. They stay on your roster and can train in the barracks.')}}
  else if(d.repx){delete gameState.rep}
  else if(d.tut){if(d.tut=='replay'){gameState.tut=0;set_tab('skills')}else if(d.tut=='skip')delete gameState.tut;else{const n=(gameState.tut||0)+1;if(n>=6)delete gameState.tut;else gameState.tut=n}}
  else if(d.savex){
    const box=document.getElementById('savebox') as HTMLTextAreaElement|null,msg=(m:string)=>{set_saveMsg(m);const e=document.getElementById('savemsg');if(e)e.textContent=m};
    if(d.savex=='import'){const err=importSave(box?box.value:'');if(err){msg(err)}else{location.reload()}return}
    const code=exportSave();if(box){box.value=code;box.select()}
    if(d.savex=='copy'){try{navigator.clipboard.writeText(code);msg('Save code copied.')}catch(e){msg('Copy did not work here. Select the code and copy it by hand.')}}
    else if(d.savex=='download'){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code],{type:'text/plain'}));a.download='mossglen-save.txt';a.click();msg('Save file downloaded.')}catch(e){msg('Download did not work here. Copy the code instead.')}}
    else msg('Your save code is below. Keep it somewhere safe.');
    return;
  }
  else if(d.kit){const k=d.kit;if(buyKit(k))say(MEMBERS[k].n+' is outfitted with '+PRE[kitTier(k)]+' kit.')}
  else if(d.call){const [k,out]=d.call.split(':');if(gameState.bench[k]&&asg(k).k!='exp'&&!(out&&asg(out).k=='exp')){if(out&&gameState.hired[out]){delete gameState.hired[out];gameState.bench[out]=1;gameState.mt[out]={k:'idle'};if(gameState.lead==out)gameState.lead=null;if(who==out)set_who('you')}if(nsl()<slots()){delete gameState.bench[k];gameState.hired[k]=1;gameState.mt[k]={k:'war'};if(!gameState.lead)gameState.lead=k;say(MEMBERS[k].n+' joins the party'+(out?', taking '+MEMBERS[out].n+"'s place.":'.'))}}}
  else if(d.form){if(FM[d.form]&&CL()>=FM[d.form].cl)gameState.form=d.form}
  else if(d.do){const [k,id]=d.do.split(':');if(who!='you'&&gameState.hired[who]&&'skfr'.includes(k))assign(who,k,id);else{if(k=='c'&&!(gameState.cur&&gameState.cur.k=='c'&&gameState.cur.id==id)){gameState.ehp=null;set_hits([])}gameState.cur={k,id};gameState.p=0}}
  else if(d.style)gameState.style=d.style;
  else if(d.tool)buyTool(d.tool);
  else if(d.stance)gameState.stance=d.stance;
  else if(d.zone)gameState.zone=+d.zone;
  else if(d.eqc)cycle(d.eqc);
  else if(d.gt)set_gtab(d.gt);
  else if(d.ofocus!==undefined)gameState.ofocus=d.ofocus||null;
  else if(d.gs)set_gsel(gsel==d.gs?null:d.gs);
  else if(d.eq!==undefined){const q=d.eq.split(':');equipSlot(q[0],q[1])}
  else if(d.shop)shopBuy(d.shop);
  else if(d.task)taskAct(d.task);
  else if(d.slbuy)slBuy(d.slbuy);
  else if(d.pk){packAct(d.pk,d.pv)}
  else if(d.buy)buy(d.buy);
  else if(d.tier){const [i,t]=d.tier.split(':');gameState.tier[i]=+t}
  else if(d.lead)gameState.lead=d.lead;
  else if(d.sic){gameState.sic=gameState.sic==d.sic?null:d.sic;refreshFx()}
  else if(d.exd)set_exSel({d:exSel.d==d.exd?null:d.exd,l:null,m:[],b:null});
  else if(d.exl){exSel.l=exSel.l==d.exl?null:d.exl;exSel.m=exSel.m.filter((k:string)=>k!=d.exl)}
  else if(d.exm){exSel.m=exSel.m.includes(d.exm)?exSel.m.filter((k:string)=>k!=d.exm):exSel.m.concat(d.exm)}
  else if(d.exb)exSel.b=exSel.b==d.exb?null:d.exb;
  else if(d.exgo)exStart();
  else if(d.exrecall)exRecall(+d.exrecall);
  else if(d.bu)buUp(d.bu);
  else if(d.sgbuy)sgBuy(d.sgbuy);
  else if(d.cf){const q=d.cf.split(':');if(q[0]=='g'){CF.g[skill]=q[1];CF.f[skill]='all'}else CF.f[skill]=q[1]=='all'?'all':+q[1]}
  else if(d.gate)openGate(+d.gate);
  else if(d.raid)startRaid(d.raid);
  else if(d.hraid)startHR(d.hraid);
  else if('auto' in d){gameState.auto=!gameState.auto;gameState.autoSet=true}
  else if(d.opt)optNow(d.opt);
  else if(d.ls)loadoutSl(d.ls);
  else if(d.stop){gameState.cur=null;gameState.ehp=null}
  else if(d.hire){const h=MEMBERS[d.hire];if(!known(d.hire)&&(h.pet?!!gameState.pets[d.hire]:gameState.a>=h.c&&LD()>=h.lt)){if(!h.pet)gameState.a-=h.c;const inParty=joinParty(d.hire);say(h.n+(inParty?' joins your party.':' joins your roster and rests at home. Your party is full.'))}}
  else if(d.reset){if(typeof prompt=='function'&&prompt('This erases your character, party, gear and every skill, and cannot be undone. Type ERASE to confirm.')==='ERASE'){try{localStorage.removeItem('hollowbrook1')}catch(x){}location.reload();return}}
  else return;
  if(gameState.auto&&(d.raid||d.hraid||d.task=='fight'||(d.do&&!(who!='you'&&gameState.hired[who]&&'skfr'.includes(d.do.split(':')[0]))))){if(d.hraid)optimize({kind:'gather',label:'the harvest'});else autoLoad()}
  {const mh=maxhp();if(gameState.hp>mh)gameState.hp=mh}
  trackAcorns(a0);
  save();render();
});
import { OPEN } from './03-world-expeditions';
import { exportSave, importSave, migrate } from './14-migrate';
migrate();
export const away=Math.min(Date.now()-gameState.t,offlineCap());
if(gameState.sp&&(gameState.cur||hasWork())&&away>20000){
  const snap=()=>({a:gameState.a,xp:Object.assign({},gameState.xp),cx:Object.assign({},gameState.cx),inv:Object.values(gameState.inv).reduce((s:number,v:any)=>s+v,0),kc:Object.values(gameState.kc||{}).reduce((s:number,v:any)=>s+v,0),pets:Object.keys(gameState.pets).length,own:Object.keys(gameState.own).length,ex:Object.keys(gameState.rc||{}).length}),b0=snap();
  tick(away/1000,true);trackAcorns(b0.a);
  const b1=snap(),xp=Object.keys(b1.xp).map(k=>[k,Math.floor(b1.xp[k]-(b0.xp[k]||0))] as [string,number]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,4);
  gameState.rep={secs:Math.round(away/1000),a:Math.round(b1.a-b0.a),xp,items:Math.round(b1.inv-b0.inv),kills:b1.kc-b0.kc,pets:b1.pets-b0.pets,gear:b1.own-b0.own,member:Object.keys(b1.cx).reduce((s,k)=>s+Math.max(0,(b1.cx[k]||0)-(b0.cx[k]||0)),0)>0};
  say('You were away '+Math.round(away/60000)+' min. Your work carried on.');
}
gameState.t=Date.now();
export let last=Date.now(),sv=0;
// Re-render when the player's own gathering changes xp or the pack, so the skill page counters stay current.
const ownSig=()=>{const c=gameState.cur;if(!c||c.k!='s')return '';const a=ACHIEVEMENTS.find((x:any)=>x.id==c.id);return a?Math.floor(gameState.xp[a.sk])+':'+(gameState.inv[a.item]||0):''};
setInterval(()=>{
  const n=Date.now(),dt=(n-last)/1000;last=n;gameState.t=n;if(gameState.sp&&gameState.st)gameState.st.t+=Math.min(dt,60);
  if(gameState.sp&&(gameState.cur||hasWork())){const lg=gameState.log[0],a=gameState.a,sg=ownSig();tick(dt,false);trackAcorns(a);if(gameState.log[0]!==lg||gameState.a!==a||ownSig()!==sg)render();}
  bars();
  if(++sv%25==0)save();
},200);
render();

document.addEventListener('toggle',(e:Event)=>{const d=e.target as HTMLElement,id=d.dataset&&d.dataset.fold;if(id)OPEN[id]=(d as HTMLDetailsElement).open},true);
