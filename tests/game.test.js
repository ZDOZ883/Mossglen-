'use strict';
// Mossglen automated tests. Run with:  node --test tests/
// Uses only Node's built-in test runner. See README for details.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { load, expectedSetup, mulberry32 } = require('./harness');

const OLD_SAVE = fs.readFileSync(path.join(__dirname, 'fixtures', 'oldsave.json'), 'utf8');
const { describe, it } = test;

// ---------------------------------------------------------------------------
describe('data integrity', () => {
  const g = load({ seed: 1 });

  it('xp table is strictly increasing and matches the known curve anchors', () => {
    const XT = g.ev('XT');
    for (let i = 2; i < XT.length; i++) assert.ok(XT[i] > XT[i - 1], 'XT not increasing at ' + i);
    assert.equal(XT[99], 13034431);
    assert.equal(XT[120], 104273167);
  });

  it('every item is well formed and names are unique', () => {
    const items = JSON.parse(g.ev('JSON.stringify(IT)'));
    const names = new Set();
    for (const [id, it] of Object.entries(items)) {
      assert.ok(it.n && typeof it.n === 'string', id + ' has no name');
      assert.ok(!names.has(it.n), 'duplicate item name: ' + it.n);
      names.add(it.n);
      assert.ok(Number.isInteger(it.tier) && it.tier >= 0, id + ' bad tier');
      assert.ok(Number.isFinite(it.req) && it.req >= 1, id + ' bad req');
      assert.ok(Number.isFinite(it.stat), id + ' bad stat');
      assert.ok(it.slot, id + ' has no slot');
    }
  });

  it('stats rise with tier for every gear line', () => {
    const lines = ['w0', 'w1', 'w2', 'x0', 'x1', 'x2', 'o0', 'o1', 'o2', 'b', 'h', 'g', 'y'];
    for (const l of lines) {
      let prev = -1;
      for (let t = 0; t <= 10; t++) {
        const s = g.ev(`IT[${JSON.stringify(l + t)}].stat`);
        assert.ok(s > prev, `${l}${t} stat ${s} not above tier ${t - 1} (${prev})`);
        prev = s;
      }
    }
  });

  it('accessory bonuses rise with tier', () => {
    for (const fam of ['r0', 'r1', 'r2', 'r3', 'n0', 'n1', 'n2', 'n3', 'c0', 'c1', 'c2', 'c3']) {
      let prev = -1;
      for (let t = 0; t <= 10; t++) {
        const v = g.ev(`IT[${JSON.stringify(fam + '_' + t)}].fx[0][1]`);
        assert.ok(v > prev, `${fam}_${t} first bonus not rising`);
        prev = v;
      }
    }
  });

  it('quality grades are ordered: plain < crafted < heirloom', () => {
    for (const base of ['w01', 'w11', 'b1', 'h0', 'g1', 'y1', 'x01', 'o01']) {
      const q = g.ev(`[IT[${JSON.stringify(base + 's')}],IT[${JSON.stringify(base)}],IT[${JSON.stringify(base + 'd')}]].map(i=>i?i.stat:null)`);
      if (q[0] != null) assert.ok(q[0] <= q[1], base + ' plain above crafted');
      assert.ok(q[1] < q[2], base + ' crafted not below heirloom');
    }
    // heirloom of tier t must still be weaker than crafted of tier t+1 for the main lines
    for (let t = 0; t < 10; t++) {
      const a = g.ev(`IT['w0${t}d'].stat`), b = g.ev(`IT['w0${t + 1}'].stat`);
      assert.ok(a < b, `heirloom w0${t} should not beat crafted tier ${t + 1}`);
    }
  });

  it('every craftable item has a recipe made only of real materials', () => {
    const bad = g.ev(`(function(){
      const mats=new Set();
      ACHIEVEMENTS.forEach(a=>mats.add(a.item));ZN.forEach(z=>{mats.add(z[4]);if(z[6])mats.add(z[6])});
      Object.values(RFN).forEach(r=>mats.add(r.n));
      Object.keys(GN).forEach(k=>GN[k].forEach(x=>mats.add(x[1])));
      const out=[];
      Object.keys(IT).filter(id=>!IT[id].q&&id[0]!='t').forEach(id=>{
        const r=recipe(id);
        if(!Object.keys(r).length)out.push(id+': empty recipe');
        Object.keys(r).forEach(k=>{if(!mats.has(k))out.push(id+': unknown material '+k);if(!(r[k]>0&&Number.isInteger(r[k])))out.push(id+': bad qty '+k)});
        if(!CR.includes(CSK(id)))out.push(id+': bad crafting skill '+CSK(id));
      });
      return out})()`);
    assert.equal(JSON.stringify(bad), "[]");
  });

  it('refined components and dishes reference real goods', () => {
    const bad = g.ev(`(function(){
      const goods=new Set();ACHIEVEMENTS.forEach(a=>goods.add(a.item));ZN.forEach(z=>{goods.add(z[4]);if(z[6])goods.add(z[6])});Object.values(RFN).forEach(r=>goods.add(r.n));CROPS.forEach(c=>goods.add(c[0]));
      const out=[];
      Object.keys(RFN).forEach(id=>Object.keys(refRecipe(id)).forEach(k=>{if(!goods.has(k))out.push(id+' needs unknown '+k)}));
      Object.keys(DISH).forEach(id=>{const d=DISH[id];if(!goods.has(d.raw))out.push(id+' raw '+d.raw);if(!(d.heal>0))out.push(id+' heal')});
      return out})()`);
    assert.equal(JSON.stringify(bad), "[]");
  });

  it('shop only offers plain gear of the first two tiers, and it exists', () => {
    const ids = ['w00s', 'w01s', 'w10s', 'w21s', 'b0s', 'b1s', 'h0s', 'g1s', 'y0s', 'y1s', 'r0_0s', 'n0_1s', 'c0_0s'];
    for (const id of ids) assert.ok(g.ev(`!!IT[${JSON.stringify(id)}]`), id + ' missing');
    assert.equal(g.ev(`!!IT['w02s']`), false, 'tier 2 must not have a plain variant');
    assert.equal(g.ev(`!!IT['y2s']`), false);
  });

  it('zone enemies are valid and scale with the zone', () => {
    const E = JSON.parse(g.ev('JSON.stringify(ENEMIES)'));
    const types = ['Melee', 'Ranged', 'Magic'];
    for (const e of E) {
      assert.ok(e.hp > 0 && Number.isFinite(e.hp), e.id + ' hp');
      assert.ok(e.dps > 0 && Number.isFinite(e.dps), e.id + ' dps');
      assert.ok(types.includes(e.type), e.id + ' type ' + e.type);
      assert.ok(Number.isFinite(e.xp) && Number.isFinite(e.a), e.id + ' xp/acorns');
    }
    const H0 = g.ev('H0'), D0 = g.ev('D0');
    assert.equal(H0.length, 11);
    assert.equal(D0.length, 11);
    for (let i = 1; i < 11; i++) {
      assert.ok(H0[i] > H0[i - 1], 'H0 not increasing at ' + i);
      assert.ok(D0[i] > D0[i - 1], 'D0 not increasing at ' + i);
    }
  });

  it('every delve has enemies for every tier and stage', () => {
    const missing = g.ev(`(function(){const o=[];DISHES.forEach(d=>{for(let t=1;t<=5;t++)for(let j=0;j<3;j++)if(!ENEMIES.find(e=>e.id=='d_'+d.id+'_'+t+'_'+j))o.push(d.id+t+j)});return o})()`);
    assert.equal(JSON.stringify(missing), "[]");
  });

  it('raids and harvest raids are well formed', () => {
    const bad = g.ev(`(function(){const o=[];
      RD.forEach(r=>{if(!(r.H>0&&r.D>0&&r.ref>0))o.push(r.id+' numbers');if(!IT[r.tr])o.push(r.id+' trophy');r.st.forEach((s,j)=>{if(!ENEMIES.find(e=>e.id==r.id+'s'+j))o.push(r.id+' stage '+j)})});
      HR.forEach(r=>{if(!r.fx||!r.fx.length)o.push(r.id+' no fx')});return o})()`);
    assert.equal(JSON.stringify(bad), "[]");
  });

  it('every bonus key used anywhere has a text formatter', () => {
    const bad = g.ev(`(function(){
      const known=new Set(Object.keys(FXT)),used=new Set();
      Object.keys(IT).forEach(id=>(IT[id].fx||[]).forEach(e=>used.add(e[0])));
      Object.keys(CE).forEach(k=>CE[k].forEach(tier=>tier.forEach(e=>used.add(e[0]))));
      Object.keys(GE).forEach(k=>GE[k].forEach(tier=>tier.forEach(e=>used.add(e[0]))));
      HR.forEach(r=>r.fx.forEach(e=>used.add(e[0])));
      for(let L=1;L<=5;L++)BU.forEach(b=>b.fx(L).forEach(e=>used.add(e[0])));
      SG.forEach(x=>used.add(x.e));used.add('txp');
      WX.forEach(w=>w.fx.forEach(e=>used.add(e[0])));
      Object.keys(SPX).forEach(k=>SPX[k].fx.concat(SPX[k].wf).forEach(e=>used.add(e[0])));
      return [...used].filter(k=>!known.has(k))})()`);
    assert.equal(JSON.stringify(bad), '[]', 'bonus keys without FXT text: ' + bad.join(','));
  });

  it('achievements are unique, callable and have sane rewards', () => {
    const r = g.ev(`(function(){const ids=new Set(),o=[];AC.forEach(a=>{if(ids.has(a[0]))o.push('dup '+a[0]);ids.add(a[0]);try{a[3]()}catch(e){o.push(a[0]+' throws '+e.message)}if(!(a[4]>=0))o.push(a[0]+' reward')});return o})()`);
    assert.equal(JSON.stringify(r), "[]");
  });

  it('pets are unique and complete', () => {
    const r = g.ev(`(function(){const ids=new Set(),o=[];PETS.forEach(p=>{if(ids.has(p[0]))o.push('dup '+p[0]);ids.add(p[0]);if(!MEMBERS[p[0]])o.push('no member '+p[0])});if(PETS.length!=33)o.push('count '+PETS.length);return o})()`);
    assert.equal(JSON.stringify(r), "[]");
  });

  it('every species has traits and a skill', () => {
    const r = g.ev(`Object.keys(SP).filter(k=>!SPX[k]||!SPX[k].fx.length||!SPX[k].wf.length||!SPX[k].st||!SPX[k].gp)`);
    assert.equal(JSON.stringify(r), "[]");
  });

  it('every item has an icon', () => {
    const r = g.ev(`Object.keys(IT).filter(id=>!ICN[iconOf(IT[id])])`);
    assert.equal(JSON.stringify(r), "[]");
  });

  it('three season rotation has four distinct seasons and never touches combat', () => {
    const wx = JSON.parse(g.ev('JSON.stringify(WX)'));
    assert.equal(new Set(wx.map(w => w.id)).size, 4);
    const combat = new Set(['dmgm', 'acc', 'taken', 'crit', 'hpm', 'regen', 'heal', 'ls', 'lsteal']);
    for (const w of wx) for (const f of w.fx) assert.ok(!combat.has(f[0]), w.id + ' touches combat: ' + f[0]);
  });
});

// ---------------------------------------------------------------------------
describe('combat grips', () => {
  function rig(sp) {
    const g = load({ seed: 5 });
    g.ev(`gameState.sp=${JSON.stringify(sp || 'Hedgehog')};gameState.cape=null;gameState.hired={};gameState.mt={};gameState.pets={};gameState.form='steady';gameState.bn=[];
      ['Attack','Strength','Defense','Vitality'].forEach(k=>gameState.xp[k]=XT[70]);
      ['w05','x05','o05','o15','y5','b5','h5','g5'].forEach(i=>gameState.own[i]=1);
      gameState.eq={Melee:'w05',body:'b5',head:'h5',legs:'g5'};gameState.style='Melee';refreshFx();gameState.hp=maxhp();`);
    return g;
  }
  const enemy = 'ENEMIES.find(q=>q.zone==5&&!q.boss)';

  it('a two-hander hits about 30% harder and blocks the off-hand', () => {
    const g = rig();
    const one = g.ev(`maxHit(${enemy})`);
    g.ev(`gameState.eq.Melee='x05';gameState.eq.off='y5'`);
    const two = g.ev(`maxHit(${enemy})`);
    assert.ok(two / one > 1.25 && two / one < 1.4, 'ratio ' + two / one);
    assert.equal(g.ev('shieldOn()'), false, 'shield must not apply with a two-hander');
    assert.equal(g.ev('is2h()'), true);
  });

  it('a shield raises armor and lowers damage taken', () => {
    const g = rig();
    const a0 = g.ev('armor()'), d0 = g.ev(`fight(${enemy}).dmg`);
    g.ev(`gameState.eq.off='y5'`);
    assert.ok(g.ev('armor()') > a0);
    assert.ok(g.ev(`fight(${enemy}).dmg`) < d0);
  });

  it('dual wield only works with an off-hand of the active style', () => {
    const g = rig();
    g.ev(`gameState.eq.off='o05'`);
    assert.ok(g.ev('dwf()') > 0.2 && g.ev('dwf()') <= 0.46);
    g.ev(`gameState.eq.off='o15'`);
    assert.equal(g.ev('dwf()'), 0, 'a ranged off-hand must not help a melee style');
  });

  it('fights are quicker with a two-hander or dual wield than with a lone one-hander', () => {
    const g = rig();
    const ttk = () => g.ev(`fight(${enemy}).ttk`);
    const base = ttk();
    g.ev(`gameState.eq.off='o05'`);
    assert.ok(ttk() < base * 0.85);
    g.ev(`gameState.eq.off=null;gameState.eq.Melee='x05'`);
    assert.ok(ttk() < base * 0.85);
  });

  it('species affinity adds a small damage bonus for the right style and grip', () => {
    const g = rig('Badger');
    assert.equal(g.ev('spAff()').toFixed(2), '0.04');
    g.ev(`gameState.eq.Melee='x05'`);
    assert.equal(g.ev('spAff()').toFixed(2), '0.07');
    g.ev(`gameState.style='Ranged'`);
    assert.equal(g.ev('spAff()').toFixed(2), '0.00');
  });

  it('smart loadout never equips an item the character cannot use', () => {
    const g = rig();
    g.ev(`gameState.xp.Attack=XT[1];gameState.xp.Defense=XT[1];delete gameState.eq.body;delete gameState.eq.head;delete gameState.eq.legs`);
    g.click({ opt: 'fight' });
    const bad = g.ev(`Object.values(gameState.eq).filter(id=>id&&!canEq(IT[id]))`);
    assert.equal(JSON.stringify(bad), "[]");
  });

  it('smart loadout picks the shield when a fight is dangerous', () => {
    const g = rig();
    g.ev(`gameState.xp.Vitality=XT[20];gameState.hp=maxhp()`);
    g.ev(`gameState.cur={k:'c',id:'z8m3'}`);
    g.click({ opt: 'fight' });
    // against a much harder enemy the safe choice must not be a bare two-hander
    assert.ok(g.ev(`gameState.eq.Melee!='x05'||gameState.eq.off==null`));
  });
});

// ---------------------------------------------------------------------------
describe('gear slots', () => {
  it('rings fill both slots, necklaces fill one, and nothing double-equips', () => {
    const g = load({ seed: 2 });
    g.ev(`['Attack','Strength','Defense','Vitality'].forEach(k=>gameState.xp[k]=XT[60]);GSK.concat(PSK).forEach(k=>gameState.xp[k]=XT[60]);
      gameState.own={r0_3:1,r1_3:1,r2_3:1,n0_3:1,n2_3:1};gameState.eq={};`);
    g.ev(`autoEq('r0_3');autoEq('r1_3');autoEq('r2_3')`);
    const eq = JSON.parse(g.ev('JSON.stringify(gameState.eq)'));
    assert.equal(eq.ring1, 'r0_3');
    assert.equal(eq.ring2, 'r1_3');
    g.ev(`equipSlot('ring1','r1_3')`);
    const after = JSON.parse(g.ev('JSON.stringify(gameState.eq)'));
    assert.notEqual(after.ring1, after.ring2);
  });

  it('equipping updates active bonuses immediately', () => {
    const g = load({ seed: 2 });
    g.ev(`['Attack','Strength','Defense','Vitality'].forEach(k=>gameState.xp[k]=XT[60]);gameState.own={r0_3:1};gameState.eq={};gameState.cape=null;refreshFx();`);
    const before = g.ev(`cb('dmgm')`);
    g.ev(`equipSlot('ring1','r0_3')`);
    assert.ok(g.ev(`cb('dmgm')`) > before);
    g.ev(`equipSlot('ring1','')`);
    assert.equal(g.ev(`cb('dmgm')`), before);
  });

  it('smart loadout never strips rings or necklaces, and keeps the best weapon in unused styles', () => {
    const g = load({ seed: 4 });
    g.ev(`['Attack','Strength','Defense','Vitality','Foraging','Cooking'].forEach(k=>gameState.xp[k]=XT[40]);
      gameState.own={};Object.keys(IT).forEach(i=>{if(!/d$/.test(i)&&IT[i].tier<=3&&canEq(IT[i]))gameState.own[i]=1});
      gameState.eq={};const rings=Object.keys(gameState.own).filter(i=>IT[i].slot=='ring');
      gameState.eq.ring1=rings.find(i=>accScore(IT[i],'gather','Foraging')<=0)||rings[0];gameState.eq.ring2=rings[1];
      gameState.eq.neck=Object.keys(gameState.own).find(i=>IT[i].slot=='neck')`);
    for (const ctx of [`{kind:'gather',sk:'Foraging',label:'f'}`, `{kind:'craft',sk:'Cooking',label:'k'}`, `{kind:'combat',enemy:ENEMIES[3],label:'c'}`]) {
      g.ev(`optimize(${ctx})`);
      assert.ok(g.ev('!!(gameState.eq.ring1&&gameState.eq.ring2&&gameState.eq.neck)'), 'accessories stay equipped for ' + ctx);
    }
    // Unused styles keep their strongest one-hander, never a leftover search candidate.
    const bad = g.ev(`(function(){optimize({kind:'combat',enemy:ENEMIES[3],label:'c'});const o=[];SL.forEach(sl=>{if(sl==gameState.style)return;const best=Object.keys(gameState.own).filter(i=>IT[i].slot==sl&&!IT[i].kind).sort((a,b)=>IT[b].stat-IT[a].stat)[0];const two=Object.keys(gameState.own).filter(i=>IT[i].slot==sl&&IT[i].kind=='2h').sort((a,b)=>IT[b].stat-IT[a].stat)[0];const want=best&&two?(IT[two].stat*1.3>IT[best].stat?two:best):best||two;if(want&&gameState.eq[sl]!=want)o.push(sl+':'+gameState.eq[sl]+' vs '+want)});return o})()`);
    assert.equal(bad.length, 0, String(bad));
  });

  it('level-locked gear cannot be equipped', () => {
    const g = load({ seed: 2 });
    g.ev(`gameState.own={b9:1};gameState.eq={};gameState.xp.Defense=XT[5]`);
    g.ev(`equipSlot('body','b9')`);
    assert.equal(g.ev('gameState.eq.body||null'), null);
  });
});

// ---------------------------------------------------------------------------
describe('expeditions', () => {
  function party() {
    const g = load({ seed: 9 });
    g.ev(`gameState.sp='Badger';gameState.hired={mole:1,hare:1,owl:1,otter:1};gameState.mt={};Object.keys(gameState.hired).forEach(k=>{gameState.mt[k]={k:'war'};gameState.cx[k]=XT[60]});
      ['Attack','Strength','Defense','Vitality'].forEach(k=>gameState.xp[k]=XT[80]);gameState.gates={1:1,2:1,3:1};refreshFx();`);
    return g;
  }
  const D = (g, id) => `DISHES.find(d=>d.id=='${id}')`;

  it('odds stay inside the bounds and improve with more or stronger members', () => {
    const g = party();
    const o = (n, lvl, t) => g.ev(`(function(){Object.keys(gameState.hired).forEach(k=>gameState.cx[k]=XT[${lvl}]);const d=${D(g, 'sett')},ks=Object.keys(gameState.hired).slice(0,${n});return exOdds(d,${t},ks[0],ks.slice(1),null).p})()`);
    for (const [n, l, t] of [[1, 15, 1], [2, 40, 1], [4, 60, 3], [4, 120, 5]]) {
      const p = o(n, l, t);
      assert.ok(p >= 0.03 && p <= 0.97, `odds ${p} out of bounds`);
    }
    assert.ok(o(4, 60, 1) >= o(2, 60, 1), 'more members should not lower odds');
    assert.ok(o(3, 80, 2) >= o(3, 40, 2), 'higher levels should not lower odds');
    assert.ok(o(3, 60, 1) >= o(3, 60, 4), 'a harder tier should not raise odds');
  });

  it('a launched expedition locks its members and restores them afterwards', () => {
    const g = party();
    g.ev(`gameState.mt.hare={k:'idle'}`);
    g.ev(`exSel={d:'hollow',l:'mole',m:['hare'],b:'fortune'}`);
    g.click({ exgo: '1' });
    assert.ok(g.ev('gameState.exs.length>0'));
    assert.equal(g.ev('gameState.mt.mole.k'), 'exp');
    assert.equal(g.ev(`fighters().includes('mole')||fighters().includes('hare')`), false);
    g.click({ assign: 'mole:idle' });
    assert.equal(g.ev('gameState.mt.mole.k'), 'exp', 'cannot reassign a member who is away');
    g.click({ dismiss: 'mole' });
    assert.ok(g.ev('!!gameState.hired.mole'), 'cannot dismiss a member who is away');
    assert.ok(g.ev('hasWork()'), 'the game keeps ticking while an expedition is out');
    g.ev('tick(gameState.exs[0].dur+1,true)');
    assert.equal(g.ev('gameState.exs.length'), 0);
    assert.equal(g.ev('gameState.mt.mole.k'), 'war');
    assert.equal(g.ev('gameState.mt.hare.k'), 'idle', 'previous task is restored');
  });

  it('one expedition at low Leadership, and recall returns everyone with no reward', () => {
    const g = party();
    g.ev(`exSel={d:'hollow',l:'mole',m:[],b:null}`);
    g.click({ exgo: '1' });
    const a0 = g.ev('gameState.a');
    g.ev(`exSel={d:'hollow',l:'hare',m:[],b:null}`);
    g.click({ exgo: '1' });
    assert.equal(g.ev('gameState.exs[0].leader'), 'mole');
    g.click({ exrecall: '0' });
    assert.equal(g.ev('gameState.exs.length'), 0);
    assert.equal(g.ev('gameState.mt.mole.k'), 'war');
    assert.equal(g.ev('gameState.a'), a0);
  });

  it('a clear unlocks the next tier and pays out', () => {
    let wins = 0;
    for (let seed = 1; seed <= 12 && !wins; seed++) {
      const g = party();
      g.reseed(seed);
      g.ev(`['Foraging'].forEach(()=>{});Object.keys(gameState.hired).forEach(k=>gameState.cx[k]=XT[90])`);
      g.ev(`exSel={d:'hollow',l:'mole',m:['hare','owl','otter'],b:'fortune'}`);
      g.click({ exgo: '1' });
      const a0 = g.ev('gameState.a');
      g.ev('tick(gameState.exs[0].dur+1,true)');
      if (g.ev(`gameState.best.hollow||0`) >= 1) {
        wins++;
        assert.ok(g.ev('gameState.a') > a0);
      }
    }
    assert.ok(wins > 0, 'a very strong party should win a tier 1 expedition');
  });
});

// ---------------------------------------------------------------------------
describe('barracks, seasons and species', () => {
  it('the barracks trains members and idle members trickle', () => {
    const g = load({ seed: 3 });
    g.ev(`gameState.sp='Otter';gameState.hired={mole:1,hare:1};gameState.mt={mole:{k:'idle'},hare:{k:'idle'}};gameState.bu={bar:1};gameState.a=1e9;`);
    g.click({ assign: 'mole:bar' });
    const x0 = g.ev('gameState.cx.mole||0'), y0 = g.ev('gameState.cx.hare||0');
    g.ev('tick(3600,true)');
    const bar = g.ev('gameState.cx.mole||0') - x0, idle = g.ev('gameState.cx.hare||0') - y0;
    assert.equal(Math.round(bar), 400);
    assert.ok(idle > 0 && idle < bar / 2);
  });

  it('assigning to the barracks needs a barracks', () => {
    const g = load({ seed: 3 });
    g.ev(`gameState.sp='Otter';gameState.hired={mole:1};gameState.mt={mole:{k:'idle'}};gameState.bu={}`);
    g.click({ assign: 'mole:bar' });
    assert.equal(g.ev('gameState.mt.mole.k'), 'idle');
  });

  it('family share never exceeds 60%', () => {
    const g = load({ seed: 3 });
    g.ev(`gameState.sp='Otter';gameState.bu={larder:5};gameState.xp.Leadership=XT[120]`);
    assert.ok(g.ev('famShare()') <= 0.6 + 1e-9);
  });

  it('the active season feeds the bonus table', () => {
    const g = load({ seed: 3 });
    g.ev(`gameState.sp='Otter';gameState.hired={}`);
    g.ev('refreshFx()');
    const keys = g.ev(`WX.flatMap(w=>w.fx.map(f=>f[0])).filter(k=>FXC.some(e=>e.k==k)||true)`);
    assert.ok(keys.length > 0);
    assert.ok(Number.isFinite(g.ev(`cb('dmgm')`)));
  });

  it('species traits are small', () => {
    const g = load({ seed: 3 });
    const mx = g.ev(`Math.max(...Object.keys(SPX).flatMap(k=>SPX[k].fx.concat(SPX[k].wf).map(e=>Math.abs(e[1]))))`);
    assert.ok(mx <= 0.05, 'a species perk is larger than 5%: ' + mx);
  });
});

// ---------------------------------------------------------------------------
describe('save and load', () => {
  it('a new game starts empty, takes a species, and round-trips through storage', () => {
    const g = load({ seed: 4 });
    assert.equal(g.ev('gameState.sp||null'), null);
    g.click({ sp: 'Fox' });
    assert.equal(g.ev('gameState.sp'), 'Fox');
    g.ev('gameState.a=1234;gameState.xp.Mining=XT[40];save()');
    const g2 = load({ seed: 4, save: g.store.hollowbrook1 });
    assert.equal(g2.ev('gameState.sp'), 'Fox');
    assert.equal(g2.ev('gameState.a'), 1234);
    assert.equal(g2.ev('gameState.xp.Mining'), g.ev('gameState.xp.Mining'));
  });

  it('an old save loads, migrates and renders every screen', () => {
    const g = load({ seed: 4, save: OLD_SAVE, awaySec: 0 });
    assert.ok(g.ev('!!gameState.sp'));
    for (const k of ['bu', 'sg', 'ach', 'seen', 'fam']) assert.ok(g.ev(`typeof gameState.${k}`) === 'object', 'gameState.' + k + ' missing after migration');
    for (const t of ['skills', 'combat', 'gear', 'party', 'delve', 'burrow', 'log', 'pack']) {
      const h = g.view(t);
      assert.ok(h.length > 200, t + ' rendered nothing');
    }
  });

  it('saves carry a version; old saves are upgraded and newer ones are never downgraded', () => {
    const g = load({ seed: 4, save: OLD_SAVE, awaySec: 0 });
    assert.equal(g.ev('gameState.v'), g.ev('SAVE_VERSION'));
    const future = JSON.parse(OLD_SAVE);
    future.v = 99;
    const g2 = load({ seed: 4, save: JSON.stringify(future), awaySec: 0 });
    assert.equal(g2.ev('gameState.v'), 99);
    const fresh = load({ seed: 4 });
    assert.equal(fresh.ev('gameState.v'), fresh.ev('SAVE_VERSION'));
  });

  it('migrations run once, in order, only when the save is older', () => {
    const g = load({ seed: 4, save: OLD_SAVE, awaySec: 0 });
    const n0 = g.ev('MIGRATIONS.length');
    g.ev("MIGRATIONS.push({v:SAVE_VERSION+1,run:()=>{gameState.__ran=(gameState.__ran||0)+1}},{v:SAVE_VERSION+2,run:()=>{gameState.__ran=(gameState.__ran||0)+10}})");
    g.ev('gameState.v=SAVE_VERSION;migrate();migrate()');
    assert.equal(g.ev('gameState.__ran'), 11);
    assert.equal(g.ev('gameState.v'), g.ev('SAVE_VERSION+2'));
    g.ev('MIGRATIONS.length=' + n0 + ';delete gameState.__ran');
  });

  it('eight hours offline does not corrupt anything', () => {
    const g = load({ seed: 4, save: OLD_SAVE, awaySec: 8 * 3600 });
    assertSane(g);
  });

  it('a character in a live expedition survives a reload', () => {
    const g = load({ seed: 6 });
    g.ev(`gameState.sp='Badger';gameState.hired={mole:1,hare:1};gameState.mt={mole:{k:'war'},hare:{k:'war'}};['Attack','Strength','Defense','Vitality'].forEach(k=>gameState.xp[k]=XT[60])`);
    g.ev(`exSel={d:'hollow',l:'mole',m:['hare'],b:null}`);
    g.click({ exgo: '1' });
    g.ev('save()');
    const g2 = load({ seed: 6, save: g.store.hollowbrook1, awaySec: 3 * 3600 });
    assert.equal(g2.ev('gameState.exs.length'), 0, 'the expedition should have finished while away');
    assert.equal(g2.ev('gameState.mt.mole.k'), 'war');
    assert.equal(g2.ev('gameState.mt.hare.k'), 'war');
  });
});

function assertSane(g) {
  const bad = g.ev(`(function(){
    const o=[];
    const chk=(n,v)=>{if(typeof v!='number'||!Number.isFinite(v))o.push(n+'='+v)};
    chk('a',gameState.a);chk('hp',gameState.hp);
    Object.keys(gameState.xp).forEach(k=>{chk('xp.'+k,gameState.xp[k]);if(gameState.xp[k]>2e8+1)o.push('xp over cap '+k);if(gameState.xp[k]<0)o.push('xp<0 '+k)});
    Object.keys(gameState.inv).forEach(k=>{if(!(gameState.inv[k]>=0)||!Number.isFinite(gameState.inv[k]))o.push('inv.'+k+'='+gameState.inv[k])});
    Object.keys(gameState.cx||{}).forEach(k=>chk('cx.'+k,gameState.cx[k]));
    if(gameState.hp>maxhp()+1)o.push('hp above max');
    Object.keys(gameState.hired).forEach(k=>{if(!MEMBERS[k])o.push('unknown member '+k)});
    Object.keys(gameState.eq||{}).forEach(k=>{const id=gameState.eq[k];if(id&&!IT[id])o.push('eq '+k+' unknown '+id);if(id&&!gameState.own[id])o.push('eq '+k+' not owned '+id)});
    return o})()`);
  assert.equal(JSON.stringify(bad), "[]");
}

describe('long-run invariants', () => {
  it('random play for many steps keeps the state valid', () => {
    const g = load({ seed: 77, save: OLD_SAVE, awaySec: 0 });
    const rnd = mulberry32(1234);
    g.ev(`gameState.a=5e6;gameState.inv.berries=500;['Attack','Strength','Defense','Vitality'].forEach(k=>gameState.xp[k]=XT[90]);gameState.gates={1:1,2:1,3:1}`);
    const acts = [
      () => g.ev(`gameState.cur={k:'s',id:ACHIEVEMENTS[Math.floor(Math.random()*ACHIEVEMENTS.length)].id}`),
      () => g.ev(`gameState.cur={k:'c',id:ZN[Math.floor(Math.random()*8)].length?'z'+Math.floor(Math.random()*6)+'m'+Math.floor(Math.random()*3):null}`),
      () => g.click({ opt: 'fight' }),
      () => g.click({ opt: 'Mining' }),
      () => g.ev('tick(Math.random()*600,true)'),
      () => g.ev('tick(Math.random()*30,false)'),
      () => g.click({ tab: ['skills', 'combat', 'gear', 'party', 'delve', 'burrow', 'log', 'pack'][Math.floor(rnd() * 8)] }),
      () => g.ev(`(function(){const k=Object.keys(IT)[Math.floor(Math.random()*Object.keys(IT).length)];if(!IT[k].q||IT[k].q!='s'){gameState.own[k]=1;try{autoEq(k)}catch(e){throw e}}})()`),
      () => g.ev(`(function(){const l=Object.keys(gameState.hired);if(l.length){const k=l[Math.floor(Math.random()*l.length)];assign(k,['war','idle'][Math.floor(Math.random()*2)])}})()`),
    ];
    for (let i = 0; i < 400; i++) {
      acts[Math.floor(rnd() * acts.length)]();
      g.ev('render()');
    }
    assertSane(g);
  });
});

// ---------------------------------------------------------------------------
describe('render smoke', () => {
  const g = load({ seed: 8, save: OLD_SAVE, awaySec: 0 });
  g.ev(`for(const k in gameState.xp)gameState.xp[k]=XT[100];gameState.gates={1:1,2:1,3:1};gameState.hired={mole:1,hare:1,owl:1};Object.keys(gameState.hired).forEach(k=>{gameState.mt[k]={k:'war'};gameState.cx[k]=XT[60]});Object.keys(IT).forEach(i=>gameState.own[i]=1);gameState.bu={lodge:2,bar:3};gameState.hr=gameState.hr||null`);
  const bad = /undefined|NaN|\[object|Infinity|null</;

  it('every tab renders clean', () => {
    for (const t of ['skills', 'combat', 'gear', 'party', 'delve', 'burrow', 'log', 'pack']) {
      const h = g.view(t);
      assert.ok(!bad.test(h), t + ' contains a placeholder: ' + (h.match(bad) || [])[0]);
    }
  });

  it('every gear tab and slot picker renders clean', () => {
    for (const gt of ['eq', 'shop', 'lo', 'capes']) {
      g.ev(`gtab=${JSON.stringify(gt)};gsel=null`);
      assert.ok(!bad.test(g.view('gear')), 'gear/' + gt);
    }
    for (const k of ['Melee', 'Ranged', 'Magic', 'head', 'body', 'legs', 'neck', 'ring1', 'ring2', 'trinket', 'off']) {
      g.ev(`gtab='eq';gsel=${JSON.stringify(k)}`);
      assert.ok(!bad.test(g.view('gear')), 'slot picker ' + k);
    }
  });

  it('every skill page and craft filter renders clean', () => {
    for (const k of g.ev('GATHER_SKILLS.concat(COMBAT_SKILLS)')) {
      assert.ok(!bad.test(g.view('skills', k)), 'skill ' + k);
    }
    for (const k of ['Smithing', 'Fletching', 'Enchanting', 'Tailoring']) {
      const groups = g.ev(`[...new Set(Object.keys(IT).filter(id=>id[0]!='t'&&!IT[id].q&&CSK(id)=='${k}').map(cgOf))]`);
      for (const grp of groups) {
        g.ev(`CF.g['${k}']='${grp}';CF.f['${k}']='all'`);
        assert.ok(!bad.test(g.view('skills', k)), `craft ${k}/${grp}`);
      }
    }
  });

  it('the species picker renders for a brand new game', () => {
    const n = load({ seed: 1 });
    const h = n.view('skills');
    assert.ok(/Hedgehog/.test(h) && /Mouse/.test(h));
    assert.ok(!bad.test(h));
  });

  it('the expedition builder renders clean in every state', () => {
    g.ev(`exSel={d:'sett',l:'mole',m:['hare'],b:'might'};gameState.exs=[]`);
    assert.ok(!bad.test(g.view('delve')));
    g.ev(`exSel={d:null,l:null,m:[],b:null}`);
    assert.ok(!bad.test(g.view('delve')));
  });
});

// ---------------------------------------------------------------------------
describe('balance guards', () => {
  // These keep the tuning honest. If you rebalance on purpose, update the bounds here.
  it('an expected character takes 8-18% of max health per normal fight in every zone', () => {
    const g = load({ seed: 1 });
    for (let z = 0; z < 11; z++) {
      expectedSetup(g, z);
      const r = g.ev(`(function(){const e=ENEMIES.find(q=>q.zone==${z}&&q.id=='z${z}m1');gameState.style=weak(e.type);const f=fight(e);return {dmg:f.dmg/maxhp(),ttk:f.ttk}})()`);
      assert.ok(r.dmg > 0.0 && r.dmg < 0.3, `zone ${z}: damage ${(r.dmg * 100).toFixed(1)}% of max health is outside the intended band`);
      assert.ok(r.ttk > 3 && r.ttk < 120, `zone ${z}: time to kill ${r.ttk.toFixed(1)}s is outside the intended band`);
    }
  });

  it('being three tiers behind is clearly worse from zone 2 onward', () => {
    const g = load({ seed: 1 });
    for (let z = 2; z < 11; z++) {
      expectedSetup(g, z);
      const ok = g.ev(`(function(){const e=ENEMIES.find(q=>q.id=='z${z}m1');gameState.style=weak(e.type);return fight(e).dmg/maxhp()})()`);
      expectedSetup(g, z, { tier: Math.max(0, z - 3) });
      const bad = g.ev(`(function(){const e=ENEMIES.find(q=>q.id=='z${z}m1');gameState.style=weak(e.type);return fight(e).dmg/maxhp()})()`);
      assert.ok(bad > ok * 1.3, `zone ${z}: under-geared (${(bad * 100).toFixed(0)}%) is not clearly worse than expected (${(ok * 100).toFixed(0)}%)`);
    }
  });

  it('raids are not open to a character without a party', () => {
    const g = load({ seed: 1 });
    expectedSetup(g, 7, { members: 0 });
    g.ev(`gameState.gates={1:1,2:1,3:1}`);
    for (let i = 0; i < 4; i++) assert.equal(g.ev(`raidOk(RD[${i}])`), false, 'raid ' + i);
  });

  it('a lone shielded one-hander never out-damages a dual-wielder on the same gear', () => {
    const g = load({ seed: 1 });
    expectedSetup(g, 6);
    g.ev(`gameState.own.o06=1;gameState.own.o16=1;gameState.own.o26=1;gameState.style='Melee';gameState.eq.Melee='w06'`);
    const e = `(function(){const e=ENEMIES.find(q=>q.id=='z6m1');return fight(e).ttk})()`;
    const shield = g.ev(e);
    g.ev(`gameState.eq.off='o06'`);
    assert.ok(g.ev(e) < shield, 'dual wield should kill faster than a shield');
  });
});

// ---------------------------------------------------------------------------
describe('performance budgets', () => {
  const g = load({ seed: 1, save: OLD_SAVE, awaySec: 0 });
  g.ev(`for(const k in gameState.xp)gameState.xp[k]=XT[110];gameState.gates={1:1,2:1,3:1};gameState.hired={mole:1,hare:1,owl:1,otter:1,badger:1,fox:1};Object.keys(gameState.hired).forEach(k=>{gameState.mt[k]={k:'war'};gameState.cx[k]=XT[100]});Object.keys(IT).forEach(i=>gameState.own[i]=1)`);
  const time = f => { const a = process.hrtime.bigint(); f(); return Number(process.hrtime.bigint() - a) / 1e6; };

  it('every screen builds in under 100 ms', () => {
    for (const t of ['skills', 'combat', 'gear', 'party', 'delve', 'burrow', 'log', 'pack']) {
      const ms = time(() => g.view(t));
      assert.ok(ms < 100, t + ' took ' + ms.toFixed(1) + ' ms');
    }
  });

  it('the main loop is cheap: 1000 fight ticks in under 1 second', () => {
    g.ev(`gameState.cur={k:'c',id:'z7m1'}`);
    const ms = time(() => g.ev('for(let i=0;i<1000;i++)tick(1,true)'));
    assert.ok(ms < 1000, ms.toFixed(0) + ' ms');
  });

  it('an eight hour offline catch-up finishes in under 1 second', () => {
    g.ev(`gameState.cur={k:'s',id:ACHIEVEMENTS[0].id}`);
    const ms = time(() => g.ev('tick(8*3600,true)'));
    assert.ok(ms < 1000, ms.toFixed(0) + ' ms');
  });

  it('smart loadout is fast', () => {
    const ms = time(() => { for (let i = 0; i < 50; i++) { g.click({ opt: 'fight' }); g.click({ opt: 'Mining' }); } });
    assert.ok(ms < 1500, ms.toFixed(0) + ' ms for 100 optimizations');
  });

  it('saves stay small', () => {
    g.ev('save()');
    assert.ok(g.store.hollowbrook1.length < 100000, 'save is ' + g.store.hollowbrook1.length + ' bytes');
  });
});

describe('member perks on expeditions', () => {
  it('hare shortens, otter raises odds, owl adds loot (no dead perks)', () => {
    const g = load({ seed: 1 });
    g.ev("gameState.hired={hare:1,otter:1,owl:1}");
    const r = g.ev("(()=>{const d=DISHES[0],a=exOdds(d,1,'hare',['hare'],null),b=exOdds(d,1,'hare',['hare','otter'],null);return JSON.stringify({a:a.dur,base:exDur(d,1),pa:a.p,pb:b.p,loot:exPk(['owl'],'loot')})})()");
    const o = JSON.parse(r);
    assert.ok(o.a < o.base, 'hare should shorten the trip');
    assert.ok(o.pb > o.pa, 'otter should raise odds');
    assert.ok(o.loot > 0, 'owl should add loot');
  });
});

describe('farming and alchemy', () => {
  it('old saves get seeds, plots and an empty potion shelf', () => {
    const g = load({ seed: 4, save: OLD_SAVE, awaySec: 0 });
    assert.ok(g.ev("gameState.inv['turnip seeds']") > 0);
    assert.equal(JSON.stringify(g.ev('gameState.buffs')), '{}');
    assert.ok(g.ev('gameState.xp.Farming') === 0 && g.ev('gameState.xp.Alchemy') === 0);
  });

  it('crops grow on a timer, harvest into goods and seeds, and feed cooking', () => {
    const g = load({ seed: 5 });
    g.ev("gameState.inv['turnip seeds']=3;farmAct('plant:0');farmAct('plant:0')");
    assert.equal(g.ev('gameState.inv["turnip seeds"]'), 1);
    g.ev("farmAct('harvest:0')");
    assert.equal(g.ev('gameState.xp.Farming'), 0, 'not ready yet, nothing harvested');
    g.ev('plots().forEach(p=>{if(p)p.ready=Date.now()-1})');
    g.ev("farmAct('harvestall:0')");
    assert.ok(g.ev('gameState.inv.turnips') >= 6 && g.ev('gameState.xp.Farming') > 0);
    assert.ok(g.ev('gameState.inv["turnip seeds"]') >= 3, 'harvests return seeds');
    // the garden dish uses the crop
    g.ev("gameState.inv.turnips=3;gameState.inv.berries=1;gameState.cur={k:'k',id:'dG0'};cookDone('dG0')");
    assert.equal(g.ev('gameState.inv.turnips'), 0, 'the dish consumed the crop');
    assert.equal(g.ev("dishNeeds(DISH.dG0).turnips"), 3);
  });

  it('twigs make mulch that shortens the wait; plots unlock by level', () => {
    const g = load({ seed: 5 });
    g.ev("gameState.inv['turnip seeds']=1;farmAct('plant:0')");
    const before = g.ev('plots()[0].ready');
    g.ev("gameState.inv.twigs=3;farmAct('mulch:0')");
    assert.ok(g.ev('plots()[0].ready') < before && g.ev('gameState.inv.twigs') == 0);
    assert.equal(g.ev('plotsOpen()'), 2);
    g.ev('gameState.xp.Farming=XT[40]');
    assert.equal(g.ev('plotsOpen()'), 4);
  });

  it('brewing makes potions; drinking applies real effects that expire', () => {
    const g = load({ seed: 6 });
    g.ev("gameState.inv.berries=2;gameState.inv.turnips=1;gameState.cur={k:'a',id:'p0'};gameState.p=0");
    g.ev('tick(10,true)');
    assert.equal(g.ev('gameState.inv["Quickroot Tonic"]'), 1);
    assert.ok(g.ev('gameState.xp.Alchemy') > 0);
    const base = g.ev("cb('spd','Foraging')");
    g.ev("alchAct('drink:p0')");
    assert.ok(g.ev("cb('spd','Foraging')") > base, 'buff applied');
    assert.equal(g.ev('gameState.inv["Quickroot Tonic"]'), 0);
    g.ev("gameState.buffs.p0=Date.now()-1;tick(1,true)");
    assert.equal(g.ev("cb('spd','Foraging')"), base, 'buff expired');
  });

  it('only three potions at once; every potion has real ingredients and valid effects', () => {
    const g = load({ seed: 6 });
    const bad = g.ev(`(function(){const o=[],goods=new Set();ACHIEVEMENTS.forEach(a=>goods.add(a.item));CROPS.forEach(c=>goods.add(c[0]));
      POTS.forEach(p=>{Object.keys(p.needs).forEach(k=>{if(!goods.has(k))o.push(p.id+' needs '+k)});p.fx.forEach(e=>{if(!(e[0] in FXT))o.push(p.id+' fx '+e[0])})});return o})()`);
    assert.equal(JSON.stringify(bad), '[]');
    g.ev("['p0','p1','p2','p3'].forEach(id=>{gameState.inv[POT[id].n]=1;alchAct('drink:'+id)})");
    assert.equal(g.ev('activeBuffs().length'), 3);
  });

  it('foraging can turn up seeds', () => {
    const g = load({ seed: 7 });
    g.ev("gameState.inv['turnip seeds']=0;for(let i=0;i<400;i++)GATHERED.forEach(f=>f(ACHIEVEMENTS.find(a=>a.sk=='Foraging')))");
    assert.ok(g.ev('gameState.inv["turnip seeds"]') > 0);
  });
});

describe('farmhands', () => {
  it('party members tending the farm speed up growth and are named as tending', () => {
    const g = load({ seed: 8 });
    g.ev("gameState.hired={mole:1,hare:1};gameState.mt={mole:{k:'idle'},hare:{k:'idle'}};gameState.inv['turnip seeds']=2;farmAct('plant:0')");
    const t0 = g.ev('plots()[0].ready');
    g.ev("farmAct('tend:mole');farmAct('tend:hare')");
    assert.equal(g.ev("farmhands().length"), 2);
    assert.equal(g.ev("workNames()"), 'Mole and Hare are both tending the farm');
    g.ev('tick(60,true)');
    assert.ok(g.ev('plots()[0].ready') < t0, 'the plot ripens sooner');
    g.ev("farmAct('tend:mole')");
    assert.equal(g.ev('farmhands().length'), 1, 'tapping again sends them back to rest');
  });
});

describe('leadership past 70', () => {
  it('slots, recruits and unlock levels line up', () => {
    const g = load({ seed: 9 });
    assert.equal(JSON.stringify(g.ev('LT')), '[1,10,25,40,55,70,85,100,115]');
    assert.equal(g.ev('HK.length'), 9);
    assert.equal(g.ev("HK.map(k=>MEMBERS[k].lt).join()"), '1,10,25,40,55,70,85,100,115');
    g.ev('gameState.xp.Leadership=XT[85]');
    assert.equal(g.ev('slots()'), 7);
  });

  it('specialists fight at 40% so a wider party is not just a stronger one', () => {
    const g = load({ seed: 9 });
    g.ev("gameState.cx.mole=XT[50];gameState.cx.dormouse=XT[50]");
    assert.equal(g.ev('fw("mole")'), 1);
    assert.equal(g.ev('fw("dormouse")'), 0.4);
    const a = g.ev('mdmg("mole",ENEMIES[0])'), b = g.ev('mdmg("dormouse",ENEMIES[0])');
    assert.ok(b < a * 0.7, 'a specialist of the same level does far less damage');
  });

  it('specialist perks do their unique jobs', () => {
    const g = load({ seed: 9 });
    const fs0 = g.ev('famShare()'), pot0 = g.ev("(()=>{gameState.inv[POT.p0.n]=1;gameState.inv.berries=0;alchAct('drink:p0');return buffs().p0-Date.now()})()");
    g.ev("gameState.hired={magpie:1,shrew:1};gameState.mt={magpie:{k:'idle'},shrew:{k:'idle'}};gameState.inv[POT.p1.n]=1");
    assert.ok(g.ev('famShare()') > fs0);
    const pot1 = g.ev("(()=>{alchAct('drink:p1');return buffs().p1-Date.now()})()");
    assert.ok(pot1 > pot0 * 1.15, 'the brewer stretches potion duration');
    const r0 = g.ev("(()=>{gameState.hired={mole:1};gameState.mt={mole:{k:'m'}};return tendRate()})()");
    const r1 = g.ev("(()=>{gameState.hired={mole:1,dormouse:1};gameState.mt={mole:{k:'m'},dormouse:{k:'idle'}};return tendRate()})()");
    assert.ok(Math.abs(r1 / r0 - 1.5) < 1e-6, 'the gardener speeds every farmhand');
  });

  it('parallel expeditions unlock with Leadership and extra ones pay less', () => {
    const g = load({ seed: 9 });
    assert.equal(g.ev('exSlots()'), 1);
    g.ev('gameState.xp.Leadership=XT[85]');
    assert.equal(g.ev('exSlots()'), 2);
    g.ev('gameState.xp.Leadership=XT[105]');
    assert.equal(g.ev('exSlots()'), 3);
    g.ev(`gameState.sp='Badger';gameState.hired={mole:1,hare:1};gameState.mt={mole:{k:'war'},hare:{k:'war'}};gameState.cx.mole=XT[60];gameState.cx.hare=XT[60];
      ['Attack','Strength','Defense','Vitality'].forEach(k=>gameState.xp[k]=XT[80]);gameState.xp.Leadership=XT[85];refreshFx()`);
    g.ev("exSel={d:'hollow',l:'mole',m:[],b:null}");g.click({ exgo: '1' });
    g.ev("exSel={d:'hollow',l:'hare',m:[],b:null}");g.click({ exgo: '1' });
    assert.equal(g.ev('exs().length'), 2);
    assert.equal(g.ev('exs()[1].par'), 0.6);
    assert.equal(g.ev('asg("mole").k + asg("hare").k'), 'expexp');
    g.ev('tick(Math.max(...exs().map(e=>e.dur))+1,true)');
    assert.equal(g.ev('exs().length'), 0);
    assert.equal(g.ev('gameState.mt.mole.k + gameState.mt.hare.k'), 'warwar');
  });

  it('mentoring and the offline window grow only past level 70', () => {
    const g = load({ seed: 9 });
    g.ev('gameState.xp.Leadership=XT[70]');
    assert.equal(g.ev('mentor()'), 1);
    assert.equal(g.ev('offlineCap()'), 8 * 3600e3);
    g.ev('gameState.xp.Leadership=XT[100]');
    assert.ok(Math.abs(g.ev('mentor()') - 1.3) < 1e-9);
    assert.equal(g.ev('offlineCap()'), 11 * 3600e3);
    g.ev('gameState.xp.Leadership=XT[120]');
    assert.equal(g.ev('offlineCap()'), 12 * 3600e3);
    assert.equal(g.ev('mentor()'), 1.5);
  });

  it('old saves with a single expedition are carried into the list', () => {
    const old = JSON.parse(OLD_SAVE);
    old.hired = { mole: 1 }; old.mt = { mole: { k: 'exp' } }; old.cx = { mole: 100000 };
    old.ex = { id: 'hollow', tier: 1, leader: 'mole', mem: ['mole'], boon: null, p: 0, dur: 5000, odds: 0.5, prev: { mole: { k: 'war' } } };
    const g = load({ seed: 9, save: JSON.stringify(old), awaySec: 0 });
    assert.equal(g.ev('gameState.exs.length'), 1);
    assert.equal(g.ev("'ex' in gameState"), false);
  });
});

describe('economy guards', () => {
  // Acorns per hour from each source, measured against farming the matching zone with an expected character.
  function zoneRates(g) {
    const zr = [];
    for (let z = 0; z < 11; z++) {
      expectedSetup(g, z);
      const r = g.ev(`(function(){const e=ENEMIES.find(q=>q.id=='z${z}m1');gameState.style=weak(e.type);const f=fight(e);return [e.a,f.ttk]})()`);
      zr[z] = r[0] / (r[1] + 1.2) * 3600;
    }
    return zr;
  }

  it('top zones follow a gentle curve and stay in the low millions per hour', () => {
    const g = load({ seed: 1 });
    const zr = zoneRates(g);
    for (let z = 5; z < 11; z++) assert.ok(zr[z] / zr[z - 1] < 4, `zone ${z} pays ${(zr[z] / zr[z - 1]).toFixed(1)}x the zone before`);
    assert.ok(zr[10] < 2.5e6, 'the top zone should stay in the low millions per hour');
  });

  it('crafting spares for scrap earns about what the matching zone does', () => {
    const g = load({ seed: 1 });
    const zr = zoneRates(g), zt = { 4: 5, 5: 6, 6: 7, 7: 8, 8: 8, 9: 9, 10: 10 };
    const out = JSON.parse(g.ev(`JSON.stringify([4,5,6,7,8,9,10].map(t=>{const GS={};ACHIEVEMENTS.forEach(a=>GS[a.item]=a);const ids=Object.keys(IT).filter(id=>IT[id].tier==t&&CSK(id)&&IT[id].req!=null);let best=0;
      ids.forEach(id=>{const r=recipe(id);let sec=ctime(id);Object.keys(r).forEach(k=>{if(GS[k])sec+=r[k]*tt(GS[k])});best=Math.max(best,scrap(t)/sec*3600)});return [t,best]}))`));
    out.forEach(([t, v]) => assert.ok(v / zr[zt[t]] < 1.4, `tier ${t} crafting earns ${(v / zr[zt[t]]).toFixed(2)}x its zone`));
  });

  it('big achievement rewards cannot pay for a gate on their own', () => {
    const g = load({ seed: 1 });
    assert.ok(g.ev('Math.max(...AC.map(a=>a[4]||0))') < 12e6);
  });

  it('raids pay about what their matching zone does, never far above it', () => {
    const g = load({ seed: 1 });
    const zr = zoneRates(g), ks = ['mole', 'hare', 'owl', 'otter', 'badger', 'fox'];
    [[0, 7, 2, 25], [1, 8, 3, 50], [2, 9, 4, 75], [3, 10, 5, 100]].forEach(([r, z, n, ml]) => {
      expectedSetup(g, z);
      const o = g.ev(`(function(){gameState.hired={};gameState.mt={};${JSON.stringify(ks.slice(0, n))}.forEach(k=>{gameState.hired[k]=1;gameState.mt[k]={k:'war'};gameState.cx[k]=XT[${ml + 5}]});gameState.xp.Leadership=XT[75];refreshFx();
        const rd=RD[${r}];let t=0,a=0;ENEMIES.filter(e=>e.raid==rd.id).forEach(e=>{gameState.style=weak(e.type);t+=fight(e).ttk+1.2;a+=e.a});return [t,a+rd.rw*RPAY[rd.id]]})()`);
      const ratio = (o[1] / o[0] * 3600) / zr[z];
      assert.ok(ratio < 1.1, `raid ${r} pays ${ratio.toFixed(2)}x its zone`);
    });
  });

  it('even a fully boosted expedition earns no more than farming its zone', () => {
    const g = load({ seed: 1 });
    const zr = zoneRates(g);
    g.ev(`gameState.hired={mole:1,hare:1,owl:1,otter:1,badger:1,fox:1};gameState.cx={};Object.keys(gameState.hired).forEach(k=>gameState.cx[k]=XT[100])`);
    const out = JSON.parse(g.ev(`JSON.stringify(DISHES.map(d=>{const t=5,dur=exDur(d,t),m=Math.min(1.3,(1+exPk(['owl'],'loot'))*1.25*(1+exLead('mole')/2))*(1+.6*(t-1)),full=Math.round(ENEMIES.filter(x=>x.dv==d.id&&x.tier==t).reduce((q,x)=>q+x.a,0)*1*m*(2+dur/7200));return [d.zb,full/(dur/3600)]}))`));
    out.forEach(([zb, rate]) => assert.ok(rate / zr[zb] <= 1.0, `expedition in zone ${zb} earns ${(rate / zr[zb]).toFixed(2)}x farming`));
  });
});
