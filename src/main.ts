// Entry point: loads the registry, then every module in order (each imports only earlier modules).
import './registry';
import * as M00 from './00-state';
import * as M01 from './01-species-pets';
import * as M02 from './02-gear-data';
import * as M03 from './03-world-expeditions';
import * as M04 from './04-loadout';
import * as M05 from './05-combat';
import * as M06 from './06-icons';
import * as M07 from './07-gear-ui';
import * as M08 from './08-party-state';
import * as M09 from './09-seasons-burrow';
import * as M10 from './10-achievements-log';
import * as M11 from './11-engine';
import * as M12 from './12-views';
import * as M13 from './13-migrate';
import * as M14 from './14-boot';

// Test hook: when a harness sets __MG_TEST it can read and (through set_* or registry setters) write any top-level name.
if ((globalThis as any).__MG_TEST) {
  const NS: any[] = [M00, M01, M02, M03, M04, M05, M06, M07, M08, M09, M10, M11, M12, M13, M14];
  (globalThis as any).__mg = new Proxy({}, {
    has: (_t, k) => typeof k === 'string' && NS.some(n => k in n),
    get: (_t, k) => { for (const n of NS) if (k in n) return n[k as string]; },
    set: (_t, k, v) => { for (const n of NS) { const s = n['set_' + String(k)]; if (s) { s(v); return true; } } throw new Error('no setter for ' + String(k)); },
  });
}
