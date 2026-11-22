import { gameState, TASKS, say } from './00-state';
import { X } from './registry';
import { FM, MEMBERS, IT, SL, XS, adv, cb, cl, fighters, fw, lv, maxhp, onTask, pk, pm, spAff } from './01-species-pets';
import { ENEMIES, GSK, PSK, RFN, accScore, elv, gearSync } from './02-gear-data';
import { enr } from './03-world-expeditions';
// Smart loadout optimizer. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
// ---------- loadouts
export const CW:Record<string,Record<string,number>>={combat:{dmgm:3,acc:2,crit:1.5,taken:3,hpm:2,regen:.6,heal:.6,lsteal:2,ls:.4,xpm:.8,drop:.6,tdmg:1.5,tdrop:.5},gather:{yld:3,xp:2,spd:3,sell:.4,mspd:.8},craft:{save:3,xp:2,spd:3,burn:2,sell:.3,mspd:.8}};
export function capeScore(id:string,kind:string,sk?:string){
  const s0=gameState.cape;gameState.cape=id;const fx=X.capeFx();gameState.cape=s0;let v=0;
  fx.forEach((e:Effect)=>{const w=CW[kind][e.k];if(!w)return;let m=1;if(e.sk&&e.sk!='*'){if(sk){if(e.sk!=sk)return}else m=.2}v+=w*e.v*m});
  return v}
export function bestCape(kind:string,sk?:string){
  const c=['G:Max'].concat(Object.keys(X.GRP).filter(g=>g!='Max').map(g=>'G:'+g),Object.keys(X.CE),Object.keys(gameState.own).filter(i=>IT[i]&&IT[i].slot=='cloak'&&X.canEq(IT[i])).map(i=>'I:'+i)).filter(X.capeOk);
  let b:any=null,bs=0;c.forEach(id=>{const v=capeScore(id,kind,sk);if(v>bs+1e-9){bs=v;b=id}});return b}
export const bestOwned=(slot:string)=>Object.keys(gameState.own).filter(i=>IT[i].slot==slot&&X.canEq(IT[i])).sort((a,b)=>IT[b].stat-IT[a].stat)[0];
export const trScore=(it:Item)=>{const e=it.eff||{};return (e.dmg||0)*100+(e.heal||0)*40+(e.drop||0)*30+(e.xp||0)*20+(e.gold||0)*10};
export function optimize(c:LoadCtx){
  const out:any[]=[];
  if(c.kind=='combat'){
    const e=c.enemy,s0=gameState.style,e0=Object.assign({},gameState.eq);
    const own=Object.keys(gameState.own).filter(i=>IT[i]&&X.canEq(IT[i])),by=(f:(i:string)=>boolean)=>own.filter(f).sort((a,b)=>IT[b].stat-IT[a].stat)[0]||null;
    const shield=by((i:string)=>IT[i].kind=='shield'),m0=maxhp();
    SL.forEach(sl=>{const w=by((i:string)=>IT[i].slot==sl&&!IT[i].kind)||by((i:string)=>IT[i].slot==sl&&IT[i].kind=='2h');if(w)gameState.eq[sl]=w});
    let bk:any=null,bc=null;
    SL.forEach(sl=>{
      const h1=by((i:string)=>IT[i].slot==sl&&!IT[i].kind),h2=by((i:string)=>IT[i].slot==sl&&IT[i].kind=='2h'),of=by((i:string)=>IT[i].kind=='off'&&IT[i].st==sl),cd=[];
      if(h1){cd.push([h1,shield]);if(of)cd.push([h1,of]);cd.push([h1,null])}
      if(h2)cd.push([h2,null]);
      cd.forEach(q=>{
        gameState.style=sl;gameState.eq[sl]=q[0];gameState.eq.off=q[1];
        let key;
        if(e){const f=X.fight(e);key=f.dmg<=m0*.55?[0,f.ttk]:[1,f.dmg]}
        else key=[0,-(IT[(q[0] as string)].stat*(IT[(q[0] as string)].kind=='2h'?1.3:1)+(q[1]&&(q[1] as any).kind=='shield'?IT[(q[0] as string)].stat*.4:q[1]?(q[1] as any).stat*.5:0))];
        if(!bk||key[0]<bk[0]||(key[0]==bk[0]&&key[1]<bk[1]-1e-9)){bk=key;bc=[sl,q[0],q[1]]}
      });
    });
    if(bc){gameState.style=bc[0];gameState.eq[bc[0]]=bc[1];gameState.eq.off=bc[2]}else{gameState.style=s0;gameState.eq.off=e0.off||null}
    ['Melee','Ranged','Magic','off'].forEach(k=>{if(gameState.eq[k]&&gameState.eq[k]!=e0[k])out.push(IT[gameState.eq[k]].n)});
    if(gameState.style!=s0)out.push(gameState.style+' style');
    ['body','head','legs'].forEach(k=>{const b=bestOwned(k);if(b&&gameState.eq[k]!=b){gameState.eq[k]=b;out.push(IT[b].n)}});
    const tr=Object.keys(gameState.own).filter(i=>IT[i].slot=='trinket'&&X.canEq(IT[i])).sort((a,b)=>trScore(IT[b])-trScore(IT[a]))[0];
    if(tr&&gameState.eq.trinket!=tr){gameState.eq.trinket=tr;out.push(IT[tr].n)}
  }
  ([['neck',['neck']],['ring',['ring1','ring2']]] as any[]).forEach(q=>{const pool=Object.keys(gameState.own).filter(i=>IT[i].slot==q[0]&&X.canEq(IT[i])).map((i):[string,number]=>[i,accScore(IT[i],c.kind,c.sk)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,q[1].length).map(x=>x[0]);q[1].forEach((k:string,j:any)=>{const w=pool[j]||null;if((gameState.eq[k]||null)!=w){gameState.eq[k]=w;if(w)out.push(IT[w].n)}})});
  gearSync();
  const cp=bestCape(c.kind,c.sk);
  if(cp&&cp!=gameState.cape){gameState.cape=cp;X.refreshFx();out.push(X.capeLabel(cp))}
  say(out.length?'Loadout for '+c.label+': '+out.join(', ')+'.':'Your loadout for '+c.label+' is already the best you own.');
}
export function ctxNow(){
  const c=gameState.cur;if(!c)return null;
  if(c.k=='c')return{kind:'combat',enemy:ENEMIES.find(e=>e.id==c.id),label:'combat'};
  if(c.k=='s'){const sk=X.A.find(a=>a.id==c.id).sk;return{kind:'gather',sk,label:sk}}
  const sk=TASKS[c.k]?TASKS[c.k].sk:c.k=='k'?'Cooking':c.k=='r'?RFN[c.id].sk:X.CSK(c.id);return{kind:'craft',sk,label:sk};
}
export function optNow(k:string){
  if(k=='fight'){const e=(gameState.cur&&gameState.cur.k=='c'&&ENEMIES.find(x=>x.id==gameState.cur.id))||(gameState.task&&ENEMIES.find(x=>x.id==gameState.task.id))||null;optimize({kind:'combat',enemy:e,label:e?e.n:'fighting'})}
  else if(GSK.includes(k))optimize({kind:'gather',sk:k,label:k});
  else if(PSK.includes(k))optimize({kind:'craft',sk:k,label:k});
}
export function autoLoad(){const c=ctxNow();if(c)optimize(c)}
export function loadoutSl(v:string){
  const [a,n]=v.split(':');
  if(a=='save'){gameState.lo[n]={eq:Object.assign({},gameState.eq),cape:gameState.cape,style:gameState.style,form:gameState.form,stance:gameState.stance};say('Saved loadout '+n+'.')}
  else{const l=gameState.lo[n];if(!l)return;Object.keys(l.eq).forEach(k=>{const id=l.eq[k];if(!id)gameState.eq[k]=null;else if(gameState.own[id]&&X.canEq(IT[id]))gameState.eq[k]=id});
    if(l.cape===null||X.capeOk(l.cape))gameState.cape=l.cape;gameState.style=l.style;if(FM[l.form]&&CL()>=FM[l.form].cl)gameState.form=l.form;if(XS[l.stance])gameState.stance=l.stance;X.refreshFx();gearSync();say('Loaded loadout '+n+'.')}
}
export function loadoutView(){
  let h='<h2>Loadout</h2><p class="sub">Smart loadout equips the best gear you own for a job: weapon and style against the current enemy, armor and trinket by stats, and the cape whose bonuses suit the work.</p>';
  h+='<div class="chips"><button class="'+(gameState.auto?'on':'')+'" data-auto="1">Auto-swap: '+(gameState.auto?'on':'off')+'</button></div><p class="mu">With auto-swap on, starting a fight, raid, harvest, gathering or crafting job re-equips for it.</p>';
  h+='<p class="mu" style="margin:6px 0 4px">Optimize now for:</p><div class="chips"><button data-opt="fight">Fight</button>'+GSK.concat(PSK).map(k=>'<button data-opt="'+k+'">'+k+'</button>').join('')+'</div>';
  h+=[1,2,3].map(n=>{const l=gameState.lo[n];return '<div class="row"><span>Saved loadout '+n+'<small>'+(l?l.style+' · '+(l.cape?X.capeLabel(l.cape):'no cape')+' · '+FM[l.form].n:'Empty')+'</small></span><span><button class="btn" data-ls="save:'+n+'">Save</button>'+(l?' <button class="btn" data-ls="load:'+n+'">Load</button>':'')+'</span></div>'}).join('');
  return h;
}

export const CL=()=>Math.floor((lv(gameState.xp.Attack)+lv(gameState.xp.Strength)+lv(gameState.xp.Defense)+lv(gameState.xp.Vitality))/4);
export const ef=(k:string)=>{const t=gameState.eq.trinket;return t&&IT[t].eff[k]||0};
export const RT=1.2;
export let hits:any[]=[],hitsStr:any=null;
export function hit(t:string){hits.unshift(t);if(hits.length>6)hits.pop()}
export const clampH=(x:number)=>Math.min(.95,Math.max(.1,x));
export const wst=()=>{const w=gameState.eq[gameState.style];return w?IT[w].stat:0};
export const mainIt=()=>gameState.eq[gameState.style]?IT[gameState.eq[gameState.style]]:null;
export const is2h=()=>{const m=mainIt();return !!m&&m.kind=='2h'};
export const offIt=()=>{const o=gameState.eq.off?IT[gameState.eq.off]:null;if(!o||is2h())return null;if(o.kind=='off'&&o.st!=gameState.style)return null;return o};
export const shieldOn=()=>{const o=offIt();return !!o&&o.kind=='shield'};
export const dwf=()=>{const o=offIt(),w=wst();return o&&o.kind=='off'&&w?Math.min(.46,.46*o.stat/w):0};
export const shT=()=>shieldOn()?.08:0;
export const maxHit=(e:Enemy)=>Math.max(1,Math.floor((1+lv(gameState.xp.Strength)*1+wst()*3.2)*3*(1+FM![gameState.form].dmg)*(is2h()?1.3:1)*(1+spAff())*(1+.25*adv(gameState.style,e.type))*(1+pk('dmg'))*(1+ef('dmg'))*(1+cb('dmgm'))*(onTask(e)?1.1+(gameState.su.keen?.15:0)+cb('tdmg'):1)));
export const eDef=(e:Enemy)=>elv(e)*.9+5+(e.boss?10:0);
export const eAtk=(e:Enemy)=>elv(e)*.8+5+(e.boss?10:0);
export const mdmg=(k:string,e:Enemy)=>{const c=cl(k);return fw(k)*c*(1.5+c/60)*(MEMBERS[k].pet?1.25:1)*(1+.25*adv(MEMBERS[k].st,e.type))};
export const memDpr=(e:Enemy)=>fighters().reduce((q,k)=>q+mdmg(k,e),0)*pm()*.9;
export const emax=(e:Enemy)=>Math.max(1,Math.round(e.dps*3*enr(e)));
export const hitP=(e:Enemy)=>{const A=(lv(gameState.xp.Attack)+8)*(1+wst()/45),D=eDef(e);return clampH(1.5*A/(A+D)+(dwf()>0?.03:0)+cb('acc')+pk('acc'))};
export const eHitP=(e:Enemy)=>{const A=eAtk(e),D=lv(gameState.xp.Defense)+8;return clampH(1.5*A/(A+D))};
export function armor(){const d=['body','head','legs'].reduce((s,k)=>s+(gameState.eq[k]?IT[gameState.eq[k]].stat:0),0)+(shieldOn()?offIt()!.stat:0);return d/(d+103)}

export function set_hits(v:any){hits=v}
export function set_hitsStr(v:any){hitsStr=v}
Object.defineProperties(X,{is2h:{get:()=>is2h,configurable:true},dwf:{get:()=>dwf,configurable:true},shieldOn:{get:()=>shieldOn,configurable:true},ef:{get:()=>ef,configurable:true},CW:{get:()=>CW,configurable:true},CL:{get:()=>CL,configurable:true},mdmg:{get:()=>mdmg,configurable:true},hits:{get:()=>hits,set:(v:any)=>{hits=v},configurable:true}});