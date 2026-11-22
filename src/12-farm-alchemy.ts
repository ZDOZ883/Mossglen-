import { FXSRC, GATHERED, S, TASKS, TICKS, say } from './00-state';
import { X } from './registry';
import { CS, GL, SK, V, cb, ldx, lv, mxp, skPet, useMats } from './01-species-pets';
import { KEEPX, gateOk } from './02-gear-data';
import { H } from './01-species-pets';
import { assign } from './08-party-state';
import { CROPS, CROPSECS, GV, GX, mspd } from './07-gear-ui';
import { isOn, refreshFx } from './11-engine';
// Farming and Alchemy. Both plug into the engine through the hook tables in 00-state, so no other system needed a special case.
// Farming: timed plots. Seeds come from Foraging, mulch from Woodcutting, crops go to Cooking and Alchemy.
// Alchemy: brews potions from Foraging herbs plus Farming crops; drinking one starts a timed buff through the normal effects system.
CS.push('Farming', 'Alchemy');

const fmt = (s: number) => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? h + 'h ' + m + 'm' : m ? m + 'm' + (s < 600 ? ' ' + (s % 60) + 's' : '') : s + 's'; };

// ---------- farming
CROPS.forEach((c, i) => { V[c[0]] = Math.max(1, Math.round(GV[i] * .6)); V[c[1]] = 1; KEEPX[c[1]] = 'seed'; });
export const PLOT_LV = [1, 1, 20, 40, 65, 90];
export const plotsOpen = () => PLOT_LV.filter(l => l <= lv(S.xp.Farming)).length;
export const cropGate = (i: number) => (i > 6 ? i - 6 : 0);
export const cropOk = (i: number) => lv(S.xp.Farming) >= GL[i] && gateOk(cropGate(i));
export const cropXp = (i: number) => Math.round(CROPSECS[i] * (1 + i * 1.6));
export const growMs = (i: number, mulch: boolean) => Math.round(CROPSECS[i] * 1000 * Math.max(.3, 1 - cb('spd', 'Farming')) * (mulch ? .75 : 1));
// Party members can tend the farm: each one adds a share of your speed to every growing plot, up to double speed.
export const farmhands = () => Object.keys(S.hired).filter(k => S.mt[k] && S.mt[k].k == 'm');
export const tendRate = () => Math.min(1, farmhands().reduce((s, k) => s + mspd(k) * .4, 0) * (S.hired.dormouse ? 1.5 : 1));
TASKS.m = { sk: 'Farming', dur: () => 30, done: () => {}, name: () => 'Tending the farm', valid: () => true, mname: () => 'Tending the farm', mdur: (k: string) => 30 / mspd(k), mact: (k: string) => { mxp(k, 8); ldx(4); } };
export const plots = () => { const a: any[] = S.farm = S.farm || []; while (a.length < PLOT_LV.length) a.push(null); return a; };

function plant(i: number): boolean {
  const a = plots(), n = plotsOpen(), c = CROPS[i];
  if (!cropOk(i) || (S.inv[c[1]] || 0) < 1) return false;
  const slot = a.findIndex((p, j) => j < n && !p);
  if (slot < 0) return false;
  S.inv[c[1]]--; a[slot] = { c: i, ready: Date.now() + growMs(i, false), mulch: false };
  return true;
}
function harvest(n: number) {
  const a = plots(), p = a[n]; if (!p || Date.now() < p.ready) return;
  const c = CROPS[p.c], before = lv(S.xp.Farming);
  const q = 3 + Math.floor(Math.random() * 3) + (Math.random() < before * .004 + cb('yld', 'Farming') ? 2 : 0);
  S.inv[c[0]] = (S.inv[c[0]] || 0) + q;
  S.inv[c[1]] = (S.inv[c[1]] || 0) + 1 + (Math.random() < .5 ? 1 : 0);
  S.xp.Farming += cropXp(p.c) * (before >= 99 ? 1.1 : 1) * (1 + cb('xp', 'Farming'));
  a[n] = null; skPet('Farming');
  const after = lv(S.xp.Farming);
  if (after > before) say('Farming reaches level ' + after + '.' + (after == PLOT_LV.find(l => l == after) ? ' A new plot opens.' : '') + CROPS.map((x, i) => GL[i] == after ? ' Unlocked: ' + x[0] + '.' : '').join(''));
}
export function farmAct(arg: string) {
  const [k, v] = arg.split(':'), a = plots();
  if (k == 'plant') { if (!plant(+v)) say('No free plot or no seeds for that.'); }
  else if (k == 'all') { let n = 0; while (plant(+v)) n++; if (!n) say('No free plot or no seeds for that.'); }
  else if (k == 'harvest') harvest(+v);
  else if (k == 'harvestall') a.forEach((p, j) => { if (p) harvest(j); });
  else if (k == 'tend') assign(v, 'm', 'f');
  else if (k == 'mulch') { const p = a[+v]; if (p && !p.mulch && (S.inv.twigs || 0) >= 3 && Date.now() < p.ready) { S.inv.twigs -= 3; p.mulch = true; p.ready = Date.now() + Math.round((p.ready - Date.now()) * .75); } }
}
// Foraging turns up seeds: the higher your level, the better the seeds you can find.
GATHERED.push((a: any) => {
  if (a.sk != 'Foraging' || Math.random() >= .04) return;
  const ok = CROPS.map((_, i) => i).filter(i => GL[i] <= lv(S.xp.Foraging) && !cropGate(i)), top = ok.length - 1;
  const i = ok[Math.max(0, top - Math.floor(Math.random() * 3))], c = CROPS[i];
  S.inv[c[1]] = (S.inv[c[1]] || 0) + 1; say('You find ' + c[1] + ' among the roots.');
});

export function farmPage() {
  const l = lv(S.xp.Farming), np = plotsOpen(), now = Date.now(), a = plots();
  const ready = a.some((p, j) => j < np && p && now >= p.ready);
  let h = '<p class="sub">Plant a seed, wait, harvest. Crops feed Cooking and Alchemy. Seeds turn up while you forage, every harvest returns a few, and twigs make mulch that cuts the wait by a quarter.</p>';
  h += a.map((p, j) => {
    if (j >= np) return j == np ? '<div class="row" style="opacity:.55"><span>Plot ' + (j + 1) + '<small>Opens at Farming level ' + PLOT_LV[j] + '</small></span></div>' : '';
    if (!p) return '<div class="row"><span>Plot ' + (j + 1) + '<small>Empty</small></span></div>';
    const done = now >= p.ready, c = CROPS[p.c];
    return '<div class="row"><span>Plot ' + (j + 1) + ' · ' + c[0] + (p.mulch ? ' · mulched' : '') + '<small>' + (done ? '<b class="good">Ready to harvest</b>' : 'Ready in <b data-fr="' + p.ready + '" data-pend="1">' + fmt((p.ready - now) / 1000) + '</b>') + '</small></span>' +
      (done ? '<button class="btn" data-farm="harvest:' + j + '">Harvest</button>' : (!p.mulch && (S.inv.twigs || 0) >= 3 ? '<button class="btn" data-farm="mulch:' + j + '">Mulch · 3 twigs</button>' : '')) + '</div>';
  }).join('');
  if (ready) h += '<p><button class="btn" data-farm="harvestall:0">Harvest everything that is ready</button></p>';
  const hs = Object.keys(S.hired);
  if (hs.length) h += '<h2>Farmhands' + (tendRate() ? ' · crops grow ' + Math.round(tendRate() * 100) + '% faster' : '') + '</h2>' + hs.map(k => { const on = S.mt[k] && S.mt[k].k == 'm'; return '<div class="row"><span>' + H[k].n + '<small>' + (on ? 'Tending the farm · adds ' + Math.round(mspd(k) * 40) + '% growth speed' : 'Busy elsewhere or resting') + '</small></span><button class="btn" data-farm="tend:' + k + '">' + (on ? 'Stop' : 'Tend') + '</button></div>'; }).join('');
  h += '<h2>Seeds</h2>' + CROPS.map((c, i) => {
    if (l < GL[Math.max(0, i - 1)]) return '';
    const sd = S.inv[c[1]] || 0, ok = cropOk(i), free = a.some((p, j) => j < np && !p);
    return '<div class="row"><span>' + c[0] + '<small>' + (ok ? 'Grows in ' + fmt(growMs(i, false) / 1000) + ' · ' + cropXp(i).toLocaleString() + ' xp · ' + c[1] + ' ' + sd + ' · in pack ' + (S.inv[c[0]] || 0) : (l >= GL[i] ? 'Needs the ' + ['', 'Rootgate', 'Wyrmgate', 'Eclipse Gate'][cropGate(i)] : 'Level ' + GL[i])) + '</small></span>' +
      (ok ? '<button class="btn" data-farm="plant:' + i + '"' + (sd && free ? '' : ' disabled') + '>Plant</button><button class="btn" data-farm="all:' + i + '"' + (sd && free ? '' : ' disabled') + '>All</button>' : '') + '</div>';
  }).join('');
  return h;
}

// ---------- alchemy
type Pot = { id: string; n: string; lv: number; gate: number; needs: Record<string, number>; fx: any[]; d: string; xp: number; v: number };
const POTDEF: [string, number, string, string, any[], string][] = [
  ['Quickroot Tonic', 0, 'berries', 'turnips', [['spd', .08, SK]], 'Gathering 8% faster.'],
  ['Stoneskin Draught', 1, 'mushrooms', 'oats', [['taken', .05, null]], '5% less damage taken.'],
  ['Fieldhand’s Brew', 2, 'truffles', 'pumpkins', [['yld', .06, SK.concat(['Farming'])]], '6% chance of a double yield when gathering or harvesting.'],
  ['Whetstone Elixir', 3, 'moonroot', 'honeyroot', [['dmgm', .05, null]], '5% more damage.'],
  ['Greenthumb Tonic', 4, 'frostcaps', 'frostbeets', [['spd', .2, ['Farming']], ['yld', .05, ['Foraging']]], 'Crops grow 20% faster; foraging 5% double yield.'],
  ['Hearthbroth Philter', 5, 'sunpetals', 'sunmelons', [['heal', .2, null], ['regen', .25, null]], '+20% food healing and faster recovery.'],
  ['Scholar’s Elixir', 6, 'starbloom', 'stargourds', [['xp', .06, null], ['xpm', .06, null]], '+6% xp in skills and combat.'],
  ['Stalker’s Draught', 7, 'deepbloom', 'deepyams', [['crit', .05, null], ['acc', .05, null]], '5% more crits and accuracy.'],
  ['Wyrmfire Tonic', 8, 'wyrmcap', 'wyrmpeppers', [['dmgm', .08, null], ['taken', .04, null]], '8% more damage, 4% less taken.'],
  ['Eclipse Elixir', 9, 'eclipse lotus', 'eclipse figs', [['xp', .08, null], ['drop', .1, null]], '+8% skill xp and +10% rare drops.'],
];
export const POTS: Pot[] = POTDEF.map(([n, i, herb, crop, fx, d]) => ({ id: 'p' + i, n, lv: GL[i], gate: cropGate(i), needs: { [herb]: 2, [crop]: 1 }, fx, d, xp: Math.round(GX[i] * 2.5), v: Math.round(GV[i] * 3) }));
export const POT: Record<string, Pot> = {}; POTS.forEach(p => { POT[p.id] = p; V[p.n] = p.v; KEEPX[p.n] = 'potion'; });
export const POTSECS = 1800, POTMAX = 3;
export const buffs = () => (S.buffs = S.buffs || {}) as Record<string, number>;
export const activeBuffs = () => { const now = Date.now(), b = buffs(); return Object.keys(b).filter(k => b[k] > now && POT[k]); };

function alchDone(c: any) {
  const p = POT[c.id], b = lv(S.xp.Alchemy);
  if (!gateOk(p.gate) || !useMats(p.needs, 'Alchemy')) { S.cur = null; say('Out of ingredients for ' + p.n + '.'); return; }
  S.inv[p.n] = (S.inv[p.n] || 0) + 1; skPet('Alchemy');
  S.xp.Alchemy += p.xp * (b >= 99 ? 1.1 : 1) * (1 + cb('xp', 'Alchemy'));
  const a = lv(S.xp.Alchemy);
  if (a > b) say('Alchemy reaches level ' + a + '.' + POTS.filter(q => q.lv == a).map(q => ' Unlocked: ' + q.n + '.').join(''));
}
TASKS.a = { sk: 'Alchemy', dur: () => 5 * Math.max(.3, 1 - cb('spd', 'Alchemy')), done: alchDone, name: (c: any) => 'Brewing ' + POT[c.id].n, valid: (c: any) => !!POT[c.id] };

FXSRC.push(() => {
  const o: any[] = [], b = buffs(), now = Date.now();
  Object.keys(b).forEach(id => { if (b[id] > now && POT[id]) POT[id].fx.forEach((e: any) => (e[2] == null ? [null] : e[2]).forEach((sk: string | null) => o.push({ k: e[0], v: e[1], sk }))); });
  return o;
});
TICKS.push((dt, quiet) => {
  const now = Date.now(), b = buffs(); let changed = false;
  Object.keys(b).forEach(id => { if (b[id] <= now) { delete b[id]; changed = true; if (!quiet && POT[id]) say('The ' + POT[id].n + ' wears off.'); } });
  if (changed) refreshFx();
  const r = tendRate(), dtm = dt * 1000 * r;
  if (r > 0) plots().forEach(p => { if (p && p.ready > now) p.ready -= dtm; });
  if (typeof document == 'undefined' || !document.querySelectorAll) return;
  let rerender = false;
  document.querySelectorAll('[data-fr]').forEach(el => { const left = (+(el as HTMLElement).dataset.fr! - now) / 1000; if (left <= 0) { if ((el as HTMLElement).dataset.pend) rerender = true; } else el.textContent = fmt(left); });
  if (rerender) X.render();
});
export function alchAct(arg: string) {
  const [k, id] = arg.split(':');
  if (k != 'drink') return;
  const p = POT[id], b = buffs();
  if (!p || (S.inv[p.n] || 0) < 1) return;
  if (!activeBuffs().includes(id) && activeBuffs().length >= POTMAX) { say('Your stomach can only take ' + POTMAX + ' potions at once.'); return; }
  S.inv[p.n]--; b[id] = Date.now() + Math.round(POTSECS * 1000 * (1 + cb('pot') + (S.hired.shrew ? .2 : 0)));
  refreshFx(); say('You drink the ' + p.n + '. ' + p.d);
}
export function potStatus() {
  const b = buffs(), now = Date.now(), act = activeBuffs();
  return act.length ? '<div class="mu" style="font-size:14px;margin-top:4px">Potions: ' + act.map(id => POT[id].n + ' <b data-fr="' + b[id] + '">' + fmt((b[id] - now) / 1000) + '</b>').join(' · ') + '</div>' : '';
}
export function alchPage() {
  const l = lv(S.xp.Alchemy);
  let h = '<p class="sub">Brew potions from foraged herbs and farmed crops. Drinking one gives a timed bonus (' + fmt(POTSECS * (1 + cb('pot'))) + ', up to ' + POTMAX + ' at once). The clock runs while you are away.</p>';
  const act = activeBuffs();
  if (act.length) h += '<div class="row" style="flex-direction:column;align-items:stretch"><span>Active<small>' + act.map(id => POT[id].n + ' · <b data-fr="' + buffs()[id] + '">' + fmt((buffs()[id] - Date.now()) / 1000) + '</b>').join('<br>') + '</small></span></div>';
  h += POTS.map(p => {
    if (l < (GL[Math.max(0, POTS.indexOf(p) - 1)])) return '';
    const ok = l >= p.lv && gateOk(p.gate), on = isOn('a', p.id);
    return '<button class="row' + (on ? ' on' : '') + '" data-do="a:' + p.id + '"' + (ok ? '' : ' disabled') + '><span>' + p.n + '<small>' + p.d + '</small><small>' + Object.keys(p.needs).map(k => k + ' ' + (S.inv[k] || 0) + '/' + p.needs[k]).join(', ') + ' · in pack ' + (S.inv[p.n] || 0) + '</small></span><small>' + (ok ? '' : (l >= p.lv ? 'Needs a gate' : 'Level ' + p.lv)) + '</small></button>';
  }).join('');
  const have = POTS.filter(p => (S.inv[p.n] || 0) > 0);
  h += '<h2>Potions in your pack</h2>' + (have.length ? have.map(p => '<div class="row"><span>' + p.n + '<small>' + p.d + '</small></span><b>×' + S.inv[p.n] + '</b><button class="btn" data-alch="drink:' + p.id + '">Drink</button></div>').join('') : '<p class="sub">None yet. Brew something above.</p>');
  return h;
}
