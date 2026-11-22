// Skilling outfits: four pieces per skill (Cap, Vest, Gloves, Boots), three tiers (Novice, Adept, Master).
// Only the best piece of each slot matters, so each is stored as a tier number. Pieces give a little xp for their skill.
// Wearing all four gives a set perk at the tier of your weakest piece. Outfits are worn automatically for the skill you train,
// and they never touch combat gear. Pieces drop from zone bosses, expeditions and raids.
import { FXSRC, SKACT, gameState, say } from './00-state';
import { X } from './registry';

export const OUTFIT_SK = ['Foraging', 'Woodcutting', 'Fishing', 'Mining', 'Hunting', 'Farming', 'Cooking', 'Smithing', 'Fletching', 'Enchanting', 'Tailoring', 'Alchemy'];
export const OUT_GATHER = ['Foraging', 'Woodcutting', 'Fishing', 'Mining', 'Hunting', 'Farming'];
export const OUT_SLOTS = ['Cap', 'Vest', 'Gloves', 'Boots'];
export const OUT_TIERS = ['', 'Novice', 'Adept', 'Master'];
export const OUT_NOUN: Record<string, string> = { Foraging: 'Forager', Woodcutting: 'Woodcutter', Fishing: 'Angler', Mining: 'Miner', Hunting: 'Hunter', Farming: 'Farmer', Cooking: 'Cook', Smithing: 'Smith', Fletching: 'Fletcher', Enchanting: 'Enchanter', Tailoring: 'Tailor', Alchemy: 'Alchemist' };
export const OUT_XP = [0, .005, .01, .015];
export const OUT_DUP = [0, 150, 600, 2000];
export const OUT_SETNAME = ['', 'Steady Hands', 'Bountiful', 'Mastery'];

export const outName = (sk: string, slot: number, tier: number) => OUT_TIERS[tier] + ' ' + OUT_NOUN[sk] + '’s ' + OUT_SLOTS[slot];
export const outKey = (sk: string, slot: number) => sk + ':' + slot;
export const outOwned = () => gameState.og = gameState.og || {};
export const outTier = (sk: string, slot: number) => outOwned()[outKey(sk, slot)] || 0;
export const outPieces = (sk: string) => OUT_SLOTS.map((_, i) => outTier(sk, i));
// The set tier is that of the weakest piece, and only counts once all four slots are filled.
export const outSet = (sk: string) => Math.min(...outPieces(sk));
export const outXp = (sk: string) => outPieces(sk).reduce((s, t) => s + OUT_XP[t], 0);
// How many pieces could still be upgraded to this tier. Zero means a drop of that tier would be wasted.
export const outMissing = (tier: number) => OUTFIT_SK.reduce((s, sk) => s + OUT_SLOTS.filter((_, i) => outTier(sk, i) < tier).length, 0);
export const outLine = (tier: number, chance: string) => { const m = outMissing(tier), t = OUT_TIERS[tier] + ' skilling outfit piece: ' + chance + (m ? ' (' + m + ' pieces still to find)' : ''); return m ? t : '<s>' + t + '</s>'; };
export const outFound = () => OUTFIT_SK.reduce((s, sk) => s + outPieces(sk).filter(t => t > 0).length, 0);

// Set perks are cumulative in strength: each tier replaces the one below it.
export function outPerks(sk: string, tier: number): [string, number][] {
  if (tier <= 0) return [];
  const gather = OUT_GATHER.includes(sk), extra = gather ? 'yld' : 'save';
  const p: [string, number][] = tier == 1 ? [['spd', .03]] : tier == 2 ? [['spd', .03], [extra, .04]] : [['spd', .04], [extra, .06], ['xp', .03]];
  if (tier == 3 && sk == 'Cooking') p.push(['burn', .2]);
  return p;
}
export const PERK_TXT: Record<string, (v: number) => string> = {
  spd: v => '+' + Math.round(v * 100) + '% speed',
  yld: v => '+' + Math.round(v * 100) + '% chance of an extra find',
  save: v => '+' + Math.round(v * 100) + '% chance to save materials',
  xp: v => '+' + Math.round(v * 100) + '% xp',
  burn: v => Math.round(v * 100) + '% fewer burnt dishes',
};
export const outPerkTxt = (sk: string, tier: number) => outPerks(sk, tier).map(([k, v]) => PERK_TXT[k](v)).join(', ');

FXSRC.push(() => {
  const o: { k: string; v: number; sk: string }[] = [];
  OUTFIT_SK.forEach(sk => {
    const x = outXp(sk); if (x > 0) o.push({ k: 'xp', v: x, sk });
    outPerks(sk, outSet(sk)).forEach(([k, v]) => o.push({ k, v, sk }));
  });
  return o;
});

// Hand out one piece of at most this tier. Only pieces you are missing (or could upgrade) are picked, so there are no wasted rolls
// until you are done. "Favour" makes drops lean 60% toward one skill.
export function outfitGive(tier: number, only?: string): string | null {
  const c: [string, number][] = [];
  OUTFIT_SK.filter(sk => !only || sk == only).forEach(sk => OUT_SLOTS.forEach((_, i) => { if (outTier(sk, i) < tier) c.push([sk, i]); }));
  if (!c.length) { const v = OUT_DUP[tier]; gameState.a += v; say('You already have every ' + OUT_TIERS[tier] + ' outfit piece. This one was sold for ' + v + ' acorns.'); return null; }
  const fav = gameState.ofocus, fc = fav ? c.filter(q => q[0] == fav) : [];
  const pool = fc.length && Math.random() < .6 ? fc : c;
  const [sk, i] = pool[Math.floor(Math.random() * pool.length)];
  const was = outSet(sk);
  outOwned()[outKey(sk, i)] = tier;
  const now = outSet(sk);
  say('★ Found the ' + outName(sk, i, tier) + '.' + (now > was ? ' Your ' + sk + ' outfit now gives its ' + OUT_TIERS[now] + ' set bonus.' : ''));
  X.refreshFx();
  return outKey(sk, i);
}
// Training a skill can turn up its own Novice pieces (about 1 in 5,000 actions), like RuneScape's activity-based outfits.
export const OUT_ACT_RATE = 5000;
// Other sources: [chance, guaranteed after this many tries]. Boss kills, expedition wins (chance = base + step per tier), raid clears.
export const OUT_BOSS = [.04, 100], OUT_EXP = [.02, .01, 25], OUT_RAID = [.12, 12];
SKACT.push(sk => {
  if (!OUTFIT_SK.includes(sk) || Math.random() * OUT_ACT_RATE >= 1) return;
  if (OUT_SLOTS.some((_, i) => outTier(sk, i) < 1)) outfitGive(1, sk);
});
// A drop source: a base chance per attempt, plus a guarantee after this many attempts without a drop.
export function outfitRoll(key: string, tier: number, p: number, pity: number, mult?: number) {
  const g = gameState; g.pity[key] = (g.pity[key] || 0) + 1;
  if (Math.random() < p * (mult || 1) || g.pity[key] >= pity) { g.pity[key] = 0; outfitGive(tier); }
}
// Which tier each source gives.
export const outZoneTier = (z: number) => z <= 3 ? 1 : z <= 7 ? 2 : 3;
export const OUT_RAID_TIER = [2, 3, 3, 3];
export const outSeek = (sk: string | null) => { gameState.ofocus = sk; };
