// Smart loadout optimizer. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
// ---------- loadouts
const CW:Record<string,Record<string,number>>={combat:{dmgm:3,acc:2,crit:1.5,taken:3,hpm:2,regen:.6,heal:.6,lsteal:2,ls:.4,xpm:.8,drop:.6,tdmg:1.5,tdrop:.5},gather:{yld:3,xp:2,spd:3,sell:.4,mspd:.8},craft:{save:3,xp:2,spd:3,burn:2,sell:.3,mspd:.8}};
function capeScore(id:string,kind:string,sk:string){
  const s0=S.cape;S.cape=id;const fx=capeFx();S.cape=s0;let v=0;
  fx.forEach((e:any)=>{const w=CW[kind][e.k];if(!w)return;let m=1;if(e.sk&&e.sk!='*'){if(sk){if(e.sk!=sk)return}else m=.2}v+=w*e.v*m});
  return v}
function bestCape(kind:string,sk:string){
  const c=['G:Max'].concat(Object.keys(GRP).filter(g=>g!='Max').map(g=>'G:'+g),Object.keys(CE),Object.keys(S.own).filter(i=>IT[i]&&IT[i].slot=='cloak'&&canEq(IT[i])).map(i=>'I:'+i)).filter(capeOk);
  let b:any=null,bs=0;c.forEach(id=>{const v=capeScore(id,kind,sk);if(v>bs+1e-9){bs=v;b=id}});return b}
const bestOwned=(slot:any)=>Object.keys(S.own).filter(i=>IT[i].slot==slot&&canEq(IT[i])).sort((a,b)=>IT[b].stat-IT[a].stat)[0];
const trScore=(it:Item)=>{const e=it.eff||{};return (e.dmg||0)*100+(e.heal||0)*40+(e.drop||0)*30+(e.xp||0)*20+(e.gold||0)*10};
function optimize(c:any){
  const out:any[]=[];
  if(c.kind=='combat'){
    const e=c.enemy,s0=S.style,e0=Object.assign({},S.eq);
    const own=Object.keys(S.own).filter(i=>IT[i]&&canEq(IT[i])),by=(f:any)=>own.filter(f).sort((a,b)=>IT[b].stat-IT[a].stat)[0]||null;
    const shield=by((i:any)=>IT[i].kind=='shield'),m0=maxhp();
    SL.forEach(sl=>{const w=by((i:any)=>IT[i].slot==sl&&!IT[i].kind)||by((i:any)=>IT[i].slot==sl&&IT[i].kind=='2h');if(w)S.eq[sl]=w});
    let bk:any=null,bc=null;
    SL.forEach(sl=>{
      const h1=by((i:any)=>IT[i].slot==sl&&!IT[i].kind),h2=by((i:any)=>IT[i].slot==sl&&IT[i].kind=='2h'),of=by((i:any)=>IT[i].kind=='off'&&IT[i].st==sl),cd=[];
      if(h1){cd.push([h1,shield]);if(of)cd.push([h1,of]);cd.push([h1,null])}
      if(h2)cd.push([h2,null]);
      cd.forEach(q=>{
        S.style=sl;S.eq[sl]=q[0];S.eq.off=q[1];
        let key;
        if(e){const f=fight(e);key=f.dmg<=m0*.55?[0,f.ttk]:[1,f.dmg]}
        else key=[0,-(IT[q[0]].stat*(IT[q[0]].kind=='2h'?1.3:1)+(q[1]&&(q[1] as any).kind=='shield'?IT[q[0]].stat*.4:q[1]?(q[1] as any).stat*.5:0))];
        if(!bk||key[0]<bk[0]||(key[0]==bk[0]&&key[1]<bk[1]-1e-9)){bk=key;bc=[sl,q[0],q[1]]}
      });
    });
    if(bc){S.style=bc[0];S.eq[bc[0]]=bc[1];S.eq.off=bc[2]}else{S.style=s0;S.eq.off=e0.off||null}
    ['Melee','Ranged','Magic','off'].forEach(k=>{if(S.eq[k]&&S.eq[k]!=e0[k])out.push(IT[S.eq[k]].n)});
    if(S.style!=s0)out.push(S.style+' style');
    ['body','head','legs'].forEach(k=>{const b=bestOwned(k);if(b&&S.eq[k]!=b){S.eq[k]=b;out.push(IT[b].n)}});
    const tr=Object.keys(S.own).filter(i=>IT[i].slot=='trinket'&&canEq(IT[i])).sort((a,b)=>trScore(IT[b])-trScore(IT[a]))[0];
    if(tr&&S.eq.trinket!=tr){S.eq.trinket=tr;out.push(IT[tr].n)}
  }
  ([['neck',['neck']],['ring',['ring1','ring2']]] as any[]).forEach(q=>{const pool=Object.keys(S.own).filter(i=>IT[i].slot==q[0]&&canEq(IT[i])).map((i):[string,number]=>[i,accScore(IT[i],c.kind,c.sk)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,q[1].length).map(x=>x[0]);q[1].forEach((k:string,j:any)=>{const w=pool[j]||null;if((S.eq[k]||null)!=w){S.eq[k]=w;if(w)out.push(IT[w].n)}})});
  gearSync();
  const cp=bestCape(c.kind,c.sk);
  if(cp&&cp!=S.cape){S.cape=cp;refreshFx();out.push(capeLabel(cp))}
  say(out.length?'Loadout for '+c.label+': '+out.join(', ')+'.':'Your loadout for '+c.label+' is already the best you own.');
}
function ctxNow(){
  const c=S.cur;if(!c)return null;
  if(c.k=='c')return{kind:'combat',enemy:E.find(e=>e.id==c.id),label:'combat'};
  if(c.k=='s'){const sk=A.find(a=>a.id==c.id).sk;return{kind:'gather',sk,label:sk}}
  const sk=c.k=='k'?'Cooking':c.k=='r'?RFN[c.id].sk:CSK(c.id);return{kind:'craft',sk,label:sk};
}
function optNow(k:string){
  if(k=='fight'){const e=(S.cur&&S.cur.k=='c'&&E.find(x=>x.id==S.cur.id))||(S.task&&E.find(x=>x.id==S.task.id))||null;optimize({kind:'combat',enemy:e,label:e?e.n:'fighting'})}
  else if(k=='delve')optimize({kind:'combat',label:'delving'});
  else if(GSK.includes(k))optimize({kind:'gather',sk:k,label:k});
  else if(PSK.includes(k))optimize({kind:'craft',sk:k,label:k});
}
function autoLoad(){const c=ctxNow();if(c)optimize(c)}
function loadoutSl(v:any){
  const [a,n]=v.split(':');
  if(a=='save'){S.lo[n]={eq:Object.assign({},S.eq),cape:S.cape,style:S.style,form:S.form,stance:S.stance};say('Saved loadout '+n+'.')}
  else{const l=S.lo[n];if(!l)return;Object.keys(l.eq).forEach(k=>{const id=l.eq[k];if(!id)S.eq[k]=null;else if(S.own[id]&&canEq(IT[id]))S.eq[k]=id});
    if(l.cape===null||capeOk(l.cape))S.cape=l.cape;S.style=l.style;if(FM[l.form]&&CL()>=FM[l.form].cl)S.form=l.form;if(XS[l.stance])S.stance=l.stance;refreshFx();gearSync();say('Loaded loadout '+n+'.')}
}
function loadoutView(){
  let h='<h2>Loadout</h2><p class="sub">Smart loadout equips the best gear you own for a job: weapon and style against the current enemy, armor and trinket by stats, and the cape whose bonuses suit the work.</p>';
  h+='<div class="chips"><button class="'+(S.auto?'on':'')+'" data-auto="1">Auto-swap: '+(S.auto?'on':'off')+'</button></div><p class="mu">With auto-swap on, starting a fight, delve, raid, harvest, gathering or crafting job re-equips for it.</p>';
  h+='<p class="mu" style="margin:6px 0 4px">Optimize now for:</p><div class="chips"><button data-opt="fight">Fight</button><button data-opt="delve">Delve</button>'+GSK.concat(PSK).map(k=>'<button data-opt="'+k+'">'+k+'</button>').join('')+'</div>';
  h+=[1,2,3].map(n=>{const l=S.lo[n];return '<div class="row"><span>Saved loadout '+n+'<small>'+(l?l.style+' · '+(l.cape?capeLabel(l.cape):'no cape')+' · '+FM[l.form].n:'Empty')+'</small></span><span><button class="btn" data-ls="save:'+n+'">Save</button>'+(l?' <button class="btn" data-ls="load:'+n+'">Load</button>':'')+'</span></div>'}).join('');
  return h;
}

const CL=()=>Math.floor((lv(S.xp.Attack)+lv(S.xp.Strength)+lv(S.xp.Defense)+lv(S.xp.Vitality))/4);
const ef=(k:string)=>{const t=S.eq.trinket;return t&&IT[t].eff[k]||0};
const RT=1.2;
let hits:any[]=[],hitsStr:any=null;
function hit(t:any){hits.unshift(t);if(hits.length>6)hits.pop()}
const clampH=(x:any)=>Math.min(.95,Math.max(.1,x));
const wst=()=>{const w=S.eq[S.style];return w?IT[w].stat:0};
const mainIt=()=>S.eq[S.style]?IT[S.eq[S.style]]:null;
const is2h=()=>{const m=mainIt();return !!m&&m.kind=='2h'};
const offIt=()=>{const o=S.eq.off?IT[S.eq.off]:null;if(!o||is2h())return null;if(o.kind=='off'&&o.st!=S.style)return null;return o};
const shieldOn=()=>{const o=offIt();return !!o&&o.kind=='shield'};
const dwf=()=>{const o=offIt(),w=wst();return o&&o.kind=='off'&&w?Math.min(.46,.46*o.stat/w):0};
const shT=()=>shieldOn()?.08:0;
const maxHit=(e:Enemy)=>Math.max(1,Math.floor((1+lv(S.xp.Strength)*1+wst()*3.2)*3*(1+FM[S.form].dmg)*(is2h()?1.3:1)*(1+spAff())*(1+.25*adv(S.style,e.type))*(1+pk('dmg'))*(1+ef('dmg'))*(1+cb('dmgm'))*(onTask(e)?1.1+(S.su.keen?.15:0)+cb('tdmg'):1)));
const eDef=(e:Enemy)=>elv(e)*.9+5+(e.boss?10:0);
const eAtk=(e:Enemy)=>elv(e)*.8+5+(e.boss?10:0);
const mdmg=(k:string,e:Enemy)=>{const c=cl(k);return c*(1.5+c/60)*(H[k].pet?1.25:1)*(1+.25*adv(H[k].st,e.type))};
const memDpr=(e:Enemy)=>fighters().reduce((q,k)=>q+mdmg(k,e),0)*pm()*.9;
const emax=(e:Enemy)=>Math.max(1,Math.round(e.dps*3*enr(e)));
const hitP=(e:Enemy)=>{const A=(lv(S.xp.Attack)+8)*(1+wst()/45),D=eDef(e);return clampH(1.5*A/(A+D)+(dwf()>0?.03:0)+cb('acc')+pk('acc'))};
const eHitP=(e:Enemy)=>{const A=eAtk(e),D=lv(S.xp.Defense)+8;return clampH(1.5*A/(A+D))};
function armor(){const d=['body','head','legs'].reduce((s,k)=>s+(S.eq[k]?IT[S.eq[k]].stat:0),0)+(shieldOn()?offIt().stat:0);return d/(d+103)}
