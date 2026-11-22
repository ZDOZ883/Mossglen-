// Core shapes shared by every file. Kept deliberately small; extend as code is tightened.
type Style = 'Melee' | 'Ranged' | 'Magic';
interface Item {
  n: string; slot: string; tier: number; stat: number; req: number;
  kind?: '2h' | 'off' | 'shield'; st?: string; rs?: string; cmb?: boolean; fam?: number;
  q?: 's' | 'd' | 'u'; fx?: [string, number, any?][]; [k: string]: any;
}
interface Enemy {
  id: string; n: string; zone: number; type: string; hp: number; dps: number;
  xp: number; a: number; lvl?: number; raid?: string; dv?: string; tier?: number; stage?: number;
  [k: string]: any;
}
interface Task { k: 'idle' | 'war' | 'bar' | 'exp' | string; id?: string; p?: number; [k: string]: any }
interface Expedition {
  id: string; tier: number; leader: string; mem: string[]; boon: string | null;
  p: number; dur: number; odds: number; prev: Record<string, Task>; par?: number;
}
interface SaveState {
  sp: string | null; a: number; hp: number; xp: Record<string, number>; inv: Record<string, number>;
  own: Record<string, number>; eq: Record<string, string | null | undefined | any>; cur: any; hired: Record<string, number>; st?: { t: number; earn: number; spend: number }; rep?: any; tut?: number; fmode?: string; fpick?: string | null; eat?: number; sic?: string | null; mh?: Record<string, number>; down?: Record<string, number>; og?: Record<string, number>; ofocus?: string | null; mk: Record<string, number>; hrr?: number; bench: Record<string, number>;
  mt: Record<string, Task>; cx: Record<string, number>; ex: Expedition | null; t: number;
  [k: string]: any;
}
interface Member {
  n: string; c: number; p: number; st: string; role: string; d: string;
  pk: Record<string, number>; pet?: boolean; spec?: boolean; [k: string]: any;
}
interface Formation { n: string; cl: number; d: string; dmg?: number; taken?: number; regen?: number; [k: string]: any }
type Zone = [string, number, string[], string[], string, number?, string?];
interface Delve { id: string; n: string; cl: number; party: number; mlv: number; zb: number; gate: number; st?: any; [k: string]: any }
interface Raid { id: string; n: string; cl: number; party: number; mlv: number; lvl: number; H: number; D: number; ref: number; gate?: number; core?: any; tr: string; st: any[]; [k: string]: any }
interface Harvest { id: string; n: string; gate?: number; tier: number; q?: any; fx: any[]; [k: string]: any }
type Ach = [string, string, string, () => boolean, number];
interface Dish { n: string; raw: string; q: number; side: string | null; lv: number; gate?: number; heal: number; xp: number }
interface LoadCtx { kind: string; sk?: string; label?: string; e?: Enemy | null; [k: string]: any }
type Effect = { k: string; v: number; sk?: string | null };

// An effect as written in the data tables: [key, value, optional skill list or 'P' for production]; and as applied: one entry per skill.
type FxDef = [string, number, (string[] | string | null)?];
interface FxEntry { k: string; v: number; sk: string | null | undefined }
