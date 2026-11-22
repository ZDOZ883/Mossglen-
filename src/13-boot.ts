// Input handling, boot and timers. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
document.addEventListener('click',e=>{
  const t=(e.target as HTMLElement).closest('button');if(!t)return;const d=t.dataset;
  if(d.sp){S.sp=d.sp;refreshFx();say('A '+d.sp.toLowerCase()+' steps out of the burrow. The valley is quiet.')}
  else if(d.tab){if(tab==d.tab&&d.tab=='skills')skill=null;tab=d.tab}
  else if(d.skill)skill=d.skill;
  else if(d.cmd)S.cmd=!S.cmd;
  else if('cape' in d){S.cape=d.cape||null;refreshFx()}
  else if(d.back)skill=null;
  else if(d.who)who=d.who;
  else if(d.assign){const [k,a]=d.assign.split(':');assign(k,a)}
  else if(d.dismiss){const k=d.dismiss;if(asg(k).k=='exp'){say(H[k].n+' is away on an expedition.');}else{delete S.hired[k];delete S.mt[k];if(S.lead==k)S.lead=Object.keys(S.hired)[0]||null;if(who==k)who='you';say(H[k].n+' leaves the party.')}}
  else if(d.form){if(FM[d.form]&&CL()>=FM[d.form].cl)S.form=d.form}
  else if(d.do){const [k,id]=d.do.split(':');if(who!='you'&&S.hired[who]&&'skfr'.includes(k))assign(who,k,id);else{if(k=='c'&&!(S.cur&&S.cur.k=='c'&&S.cur.id==id)){S.ehp=null;hits=[]}S.cur={k,id};S.p=0}}
  else if(d.style)S.style=d.style;
  else if(d.tool)buyTool(d.tool);
  else if(d.stance)S.stance=d.stance;
  else if(d.zone)S.zone=+d.zone;
  else if(d.eqc)cycle(d.eqc);
  else if(d.gt)gtab=d.gt;
  else if(d.gs)gsel=gsel==d.gs?null:d.gs;
  else if(d.eq!==undefined){const q=d.eq.split(':');equipSlot(q[0],q[1])}
  else if(d.shop)shopBuy(d.shop);
  else if(d.task)taskAct(d.task);
  else if(d.slbuy)slBuy(d.slbuy);
  else if(d.sellone){const k=d.sellone;S.a+=Math.round(S.inv[k]*V[k]*(1+cb('sell')));delete S.inv[k]}
  else if(d.buy)buy(d.buy);
  else if(d.tier){const [i,t]=d.tier.split(':');S.tier[i]=+t;if(S.cur&&S.cur.k=='d'&&S.cur.id==i)S.p=0}
  else if(d.lead)S.lead=d.lead;
  else if(d.exd)exSel={d:exSel.d==d.exd?null:d.exd,l:null,m:[],b:null};
  else if(d.exl){exSel.l=exSel.l==d.exl?null:d.exl;exSel.m=exSel.m.filter((k:string)=>k!=d.exl)}
  else if(d.exm){exSel.m=exSel.m.includes(d.exm)?exSel.m.filter((k:string)=>k!=d.exm):exSel.m.concat(d.exm)}
  else if(d.exb)exSel.b=exSel.b==d.exb?null:d.exb;
  else if(d.exgo)exStart();
  else if(d.exrecall)exRecall();
  else if(d.bu)buUp(d.bu);
  else if(d.sgbuy)sgBuy(d.sgbuy);
  else if(d.cf){const q=d.cf.split(':');if(q[0]=='g'){CF.g[skill]=q[1];CF.f[skill]='all'}else CF.f[skill]=q[1]=='all'?'all':+q[1]}
  else if(d.gate)openGate(+d.gate);
  else if(d.raid)startRaid(d.raid);
  else if(d.hraid)startHR(d.hraid);
  else if('auto' in d){S.auto=!S.auto;S.autoSet=true}
  else if(d.opt)optNow(d.opt);
  else if(d.ls)loadoutSl(d.ls);
  else if(d.stop){S.cur=null;S.ehp=null}
  else if(d.hire){const h=H[d.hire];if(!S.hired[d.hire]&&nsl()<slots()&&(h.pet?!!S.pets[d.hire]:S.a>=h.c&&LD()>=h.lt)){S.a-=h.c;S.hired[d.hire]=1;S.mt[d.hire]={k:'war'};if(!S.lead)S.lead=d.hire;say(h.n+' joins your party.')}}
  else if(d.sell){let g=0;for(const k in S.inv){if(KEEP(k))continue;g+=S.inv[k]*V[k];delete S.inv[k]}g=Math.round(g*(1+cb('sell')));S.a+=g;say('Sold your pack for '+g+' acorns.')}
  else if(d.reset){if(confirm('Erase your progress?')){try{localStorage.removeItem('hollowbrook1')}catch(x){}location.reload();return}}
  else return;
  if(S.auto&&(d.raid||d.hraid||d.task=='fight'||(d.do&&!(who!='you'&&S.hired[who]&&'skfr'.includes(d.do.split(':')[0]))))){if(d.hraid)optimize({kind:'gather',label:'the harvest'});else autoLoad()}
  save();render();
});
S.mt=S.mt||{};S.ct=S.ct||{};S.cg=S.cg||{};S.cape=S.cape||null;S.gates=S.gates||{};S.rc=S.rc||{};S.hrc=S.hrc||{};S.hr=S.hr||null;S.lo=S.lo||{};S.pets=S.pets||{};S.fam=S.fam||{};S.bu=S.bu||{};S.ex=S.ex||null;if(S.cur&&S.cur.k=='c'&&String(S.cur.id).indexOf('d_')==0){S.cur=null;S.ehp=null}Object.keys(S.mt).forEach(k=>{if(S.mt[k]&&S.mt[k].k=='exp'&&!S.ex)S.mt[k]={k:'war'}});S.sg=S.sg||{};if(!S.mig19&&S.own&&S.eq){S.mig19=1;const b=S.eq.body;if(b&&IT[b]){S.own['g'+IT[b].tier]=1;if(!S.eq.legs)S.eq.legs='g'+IT[b].tier}}S.ach=S.ach||{};S.seen=S.seen||{};if(S.cur&&S.cur.k=='d')S.cur=null;if(!S.autoSet)S.auto=true;S.rr=S.rr||0;clampXp();refreshFx();
if(!S.form){S.form=S.stance=='agg'?'fury':S.stance=='def'?'bulwark':'steady';if(S.stance=='agg'||S.stance=='def')S.stance='bal'}
if(S.stance=='ldr'){S.stance='bal';S.cmd=true}
if(!XS[S.stance])S.stance='bal';
S.cmd=!!S.cmd;
if(S.ehp===undefined||!(S.cur&&S.cur.k=='c'))S.ehp=null;
{const np=Object.keys(S.hired).filter(k=>!H[k].pet).length;if(np>slots())S.xp.Leadership=XT[LT[Math.min(np,LT.length)-1]];const ps=Object.keys(S.hired).filter(k=>H[k].pet);while(Object.keys(S.hired).length>slots()&&ps.length){const k=ps.pop();delete S.hired[k!];delete S.mt[k!]}}
Object.keys(S.mt).forEach(k=>{if(!S.hired[k])delete S.mt[k];else if(!validTask(S.mt[k]))S.mt[k]={k:'idle'}});
const away=Math.min(Date.now()-S.t,8*3600e3);
if(S.sp&&(S.cur||hasWork())&&away>20000){const a0=S.a;tick(away/1000,true);say('You were away '+Math.round(away/60000)+' min. Your work carried on.')}
S.t=Date.now();
let last=Date.now(),sv=0;
setInterval(()=>{
  const n=Date.now(),dt=(n-last)/1000;last=n;S.t=n;
  if(S.sp&&(S.cur||hasWork())){const lg=S.log[0],a=S.a,k=Object.keys(S.inv).length;tick(dt,false);if(S.log[0]!==lg||S.a!==a)render();}
  bars();
  if(++sv%25==0)save();
},200);
render();
