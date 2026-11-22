'use strict';
// Loads mossglen.html into a sandboxed VM with browser stubs so tests can poke at the game's internals.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = process.env.MOSSGLEN_HTML || path.join(__dirname, '..', 'mossglen.html');

function extractScript() {
  const html = fs.readFileSync(HTML, 'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('No <script> block found in ' + HTML);
  return m[1];
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a fresh game instance.
 * opts.save    : JSON string placed in localStorage before the game boots (or null for a new game)
 * opts.seed    : seed for a deterministic Math.random (default 1)
 * opts.awaySec : pretend the player was away this long at boot (default: real clock)
 */
function load(opts = {}) {
  const store = {};
  if (opts.save) store['hollowbrook1'] = opts.save;
  const els = {};
  const getEl = id => els[id] || (els[id] = { style: {}, textContent: '', innerHTML: '' });
  const handlers = {};
  const ctx = {
    console,
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    document: {
      getElementById: getEl,
      addEventListener: (t, f) => { handlers[t] = f; },
      querySelector: () => null,
      documentElement: { dataset: {}, setAttribute() {} },
    },
    setInterval: () => 0,
    clearInterval() {},
    setTimeout: () => 0,
    location: {},
    confirm: () => true,
    alert() {},
    Date, Math: Object.create(Math), JSON, Object, Array, Number, String, Set, Map, Promise,
  };
  ctx.Math.random = mulberry32(opts.seed == null ? 1 : opts.seed);
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  let src = extractScript();
  if (opts.awaySec != null) {
    src = src.replace(/(?:const|var|let)\s+away\s*=\s*Math\.min\(Date\.now\(\)\s*-\s*gameState\.t\s*,[^;]*\);/, 'var away=' + Math.min(opts.awaySec, 8 * 3600) * 1000 + ';');
    if (!/var away=\d/.test(src)) throw new Error('harness: could not patch offline-away line');
  }
  ctx.__MG_TEST = true;
  vm.runInContext(src, ctx, { filename: 'mossglen.html.js' });
  // Run code with every game name in scope (reads are live; assignments go through set_* functions).
  const runIn = vm.runInContext('(function(__c){ with(__mg){ return eval(__c); } })', ctx);

  const g = {
    ctx, store, els,
    /** Evaluate an expression or statements inside the game's scope. */
    ev: code => runIn(code),
    /** Simulate a click on a button carrying the given data attributes. */
    click(ds) { handlers.click({ target: { closest: () => ({ dataset: ds }) } }); },
    /** The HTML currently rendered into #app. */
    html: () => getEl('app').innerHTML || '',
    /** Render a tab (and optionally a skill page) and return its HTML. */
    view(tab, skill) {
      runIn(`tab=${JSON.stringify(tab)};skill=${skill ? JSON.stringify(skill) : 'null'};render()`);
      return getEl('app').innerHTML || '';
    },
    reseed(n) { ctx.Math.random = mulberry32(n); },
  };
  return g;
}

/** A character set up the way the balance solver models an "expected" player for a zone. */
function expectedSetup(g, zoneIdx, opts = {}) {
  const tier = opts.tier != null ? opts.tier : zoneIdx;
  const members = opts.members != null ? opts.members : (zoneIdx < 2 ? 0 : Math.min(5, Math.floor(zoneIdx / 2)));
  g.ev(`(function(){
    const i=${zoneIdx},gt=${tier},nm=${members};
    const L=Math.min(120,ZN[i][1]+5),ml=Math.round(L*.75);
    gameState.cape=null;gameState.form='steady';gameState.bn=[];gameState.cur=null;gameState.ehid=null;gameState.own={};
    ['Attack','Strength','Ranged','Magic','Defense','Vitality'].forEach(k=>gameState.xp[k]=XT[Math.max(1,L)]);
    gameState.eq={Melee:'w0'+gt,Ranged:'w1'+gt,Magic:'w2'+gt,body:gt>0?'b'+gt:null,head:gt>0?'h'+gt:null,legs:gt>0?'g'+gt:null,off:gt>0?'y'+gt:null,trinket:null};
    if(gt>1){const a=gt-1;gameState.eq.ring1='r0_'+a;gameState.eq.ring2='r1_'+a;gameState.eq.neck='n0_'+a;gameState.cape='I:c1_'+a;gameState.own['c1_'+a]=1}
    gameState.hired={};gameState.mt={};gameState.pets={};
    ['mole','hare','owl','otter','badger','fox'].slice(0,nm).forEach(k=>{gameState.hired[k]=1;gameState.mt[k]={k:'war'};gameState.cx[k]=XT[Math.max(1,ml)]});
    refreshFx();gearSync();gameState.hp=maxhp();
  })()`);
}

module.exports = { load, expectedSetup, HTML, mulberry32 };
