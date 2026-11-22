const {load}=require(require('path').join(__dirname,'..','tests','harness.js'));
const seeds=+process.argv[2]||6, steps=+process.argv[3]||1200;
const TABS=['skills','combat','gear','party','delve','burrow','log','pack'];
const bad=/undefined|NaN|\[object|Infinity|>null</;
const problems=[];let totalClicks=0,renders=0;
function sane(g){return g.ev(`(function(){const o=[];const chk=(n,v)=>{if(typeof v!='number'||!Number.isFinite(v))o.push(n+'='+v)};
 chk('a',gameState.a);chk('hp',gameState.hp);
 Object.keys(gameState.xp).forEach(k=>{chk('xp.'+k,gameState.xp[k]);if(gameState.xp[k]<0)o.push('xp<0 '+k);if(gameState.xp[k]>2e8+1)o.push('xp over cap '+k)});
 Object.keys(gameState.inv).forEach(k=>{if(!(gameState.inv[k]>=0)||!Number.isFinite(gameState.inv[k]))o.push('inv.'+k+'='+gameState.inv[k])});
 Object.keys(gameState.cx||{}).forEach(k=>chk('cx.'+k,gameState.cx[k]));
 if(gameState.hp>maxhp()+1)o.push('hp>max');if(gameState.hp<0)o.push('hp<0');
 Object.keys(gameState.hired).forEach(k=>{if(!MEMBERS[k])o.push('unknown member '+k);if(gameState.bench[k])o.push('both hired and bench '+k)});
 if(Object.keys(gameState.hired).length>slots())o.push('party over slots '+Object.keys(gameState.hired).length+'/'+slots());
 Object.keys(gameState.bench).forEach(k=>{const t=gameState.mt[k];if(!t||(t.k!='idle'&&t.k!='bar'&&t.k!='exp'))o.push('bench task '+k+' '+JSON.stringify(t))});
 Object.keys(gameState.hired).forEach(k=>{if(!validTask(gameState.mt[k]))o.push('invalid task '+k+' '+JSON.stringify(gameState.mt[k]))});
 if(gameState.lead&&!gameState.hired[gameState.lead]&&Object.keys(gameState.hired).length)o.push('lead not in party '+gameState.lead);
 Object.keys(gameState.eq||{}).forEach(k=>{const id=gameState.eq[k];if(id&&!IT[id])o.push('eq '+k+' unknown '+id);if(id&&!gameState.own[id])o.push('eq '+k+' not owned '+id)});
 chk('ehpOk',gameState.ehp==null?0:gameState.ehp);
 return o})()`)}
function pairs(html){const out=[];const re=/data-([a-z]+)="([^"]*)"/g;let m;while((m=re.exec(html)))out.push([m[1],m[2]]);return out}
const SKIP=new Set(['reset','fold','logsub','back','tab','sp']);
const species=load({seed:1}).ev('Object.keys(SP)');
for(let s=1;s<=seeds;s++){
  const sp=species[(s-1)%species.length];
  const g=load({seed:100+s,awaySec:0});
  let seed=s*7919;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  g.click({sp});
  const log=[];const fail=(where,what)=>{problems.push(`seed ${s} (${sp}) step ${log.length} ${where}: ${what}\n   last: ${log.slice(-4).join(' | ')}`)};
  for(let i=0;i<steps;i++){
    try{
      const r=rnd();
      if(r<.45){ // click a real button from a real screen
        const tab=TABS[Math.floor(rnd()*TABS.length)];
        const html=g.view(tab);renders++;
        const t=html.replace(/<[^>]+>/g,' ');if(bad.test(t)){const m=t.match(bad);fail('render '+tab,'"'+t.slice(Math.max(0,m.index-50),m.index+50).replace(/\s+/g,' ')+'"');}
        const ps=pairs(html).filter(p=>!SKIP.has(p[0]));
        if(ps.length){const p=ps[Math.floor(rnd()*ps.length)];log.push(p[0]+'='+p[1]);g.click({[p[0]]:p[1]});totalClicks++}
      }else if(r<.62){const dt=[5,30,120,600,3600][Math.floor(rnd()*5)];log.push('tick '+dt);g.ev(`tick(${dt},true)`)}
      else if(r<.70){const dt=1+Math.floor(rnd()*20);log.push('livetick '+dt);for(let k=0;k<dt;k++)g.ev('tick(1,false)')}
      else if(r<.78){ // progression boosts so late content gets exercised
        const lv=[10,30,50,70,90,110][Math.floor(rnd()*6)];log.push('boost '+lv);
        g.ev(`gameState.a=(gameState.a||0)+${Math.floor(rnd()*3e6)};['Attack','Strength','Ranged','Magic','Defense','Vitality','Leadership','Slayer'].forEach(k=>{gameState.xp[k]=Math.max(gameState.xp[k]||0,XT[${lv}])});GATHER_SKILLS.forEach(k=>{gameState.xp[k]=Math.max(gameState.xp[k]||0,XT[${Math.max(1,lv-10)}])});Object.keys(gameState.hired).forEach(k=>gameState.cx[k]=Math.max(gameState.cx[k]||0,XT[${Math.max(1,lv-5)}]));const r=Math.random();for(const k of Object.keys(IT)){if(Math.random()<.04&&IT[k].q!='s')gameState.own[k]=1}`);
      }else if(r<.85){log.push('optimize');g.click({opt:['fight','Mining','Foraging','Cooking'][Math.floor(rnd()*4)]})}
      else if(r<.92){ // save and reload round trip
        log.push('save/load');const snap=g.ev('JSON.stringify(gameState)');g.ev('save()');
        const g2=load({seed:900+i,save:JSON.parse(snap),awaySec:Math.floor(rnd()*7200)});const b=sane(g2);if(b.length)fail('after reload',JSON.stringify(b).slice(0,300));
      }else{log.push('bigaway');g.ev(`tick(${Math.floor(rnd()*28800)},true)`)}
      if(i%10==0){const b=sane(g);if(b.length){fail('invariants',JSON.stringify(b).slice(0,400));break}}
    }catch(e){fail('exception',String(e&&e.stack||e).split('\n').slice(0,3).join(' / '));break}
  }
  const b=sane(g);if(b.length)fail('final',JSON.stringify(b).slice(0,300));
  console.log('seed',s,sp,'done');
}
console.log('clicks',totalClicks,'renders',renders);
console.log(problems.length?problems.join('\n'):'NO PROBLEMS');
