// Core shapes shared by every file. Kept deliberately small; extend as code is tightened.
type Style = 'Melee' | 'Ranged' | 'Magic';
interface Item {
  n: string; slot: string; tier: number; stat: number; req: number;
  kind?: '2h' | 'off' | 'shield'; st?: string; rs?: string; cmb?: boolean; fam?: number;
  q?: 's' | 'd'; fx?: [string, number, any?][]; [k: string]: any;
}
interface Enemy {
  id: string; n: string; zone?: number; type: Style; hp: number; dps: number;
  xp: number; a: number; lvl?: number; raid?: string; dv?: string; tier?: number; stage?: number;
  [k: string]: any;
}
interface Task { k: 'idle' | 'war' | 'bar' | 'exp' | string; id?: string; p?: number; [k: string]: any }
interface Expedition {
  id: string; tier: number; leader: string; mem: string[]; boon: string | null;
  p: number; dur: number; odds: number; prev: Record<string, Task>;
}
interface SaveState {
  sp: string | null; a: number; hp: number; xp: Record<string, number>; inv: Record<string, number>;
  own: Record<string, number>; eq: Record<string, string | undefined>; cur: any; hired: Record<string, number>;
  mt: Record<string, Task>; cx: Record<string, number>; ex: Expedition | null; t: number;
  [k: string]: any;
}
