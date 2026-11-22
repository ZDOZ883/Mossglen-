# Mossglen

A woodland idle game. Single-file HTML output, written in TypeScript.

## Layout
- `src/NN-*.ts`   game source as ES modules by area (data, combat, UI, engine, boot); each imports only earlier modules
- `src/registry.ts` typed forward references: names a module needs from a module that loads later (see below)
- `src/main.ts`   entry point; also a test-only hook (`__MG_TEST`) so tests can read and set any name
- `src/index.html` page shell and CSS
- `scripts/build.js` transpiles TS (esbuild) and inlines it -> `mossglen.html`
- `tests/`        harness + 55 tests (data integrity, grips, expeditions, saves, rendering, balance, performance)

## Commands
- `npm ci`            install
- `npm run build`     produce `mossglen.html`
- `npm run typecheck` tsc, no emit
- `npm test`          build + run tests (Node built-in runner)
- `npm run check`     typecheck + tests (what CI runs)

Type checking runs with `noImplicitAny` on (explicit `any` remains in places; see `src/00-types.ts` for the shared shapes).

Balance guards in `tests/game.test.js` are intentional bounds; if you retune on purpose, update them.
Tests load the built HTML into a sandbox with a seeded RNG, so runs are deterministic.

Note: the save key stays `hollowbrook1` so existing saves keep working after the rename.

## Saves
Saves carry a version (`S.v`). `ensureDefaults()` in `src/14-migrate.ts` fills missing fields; for changes that are not idempotent, add an entry to `MIGRATIONS` with the next version. Tests cover old, current and newer-than-known saves.

## Module rules
Modules may import only from earlier-numbered modules, so load order is safe. When code in an early file must call something defined later, it goes through `X.name` (the registry), which the defining module fills in at load. Adding a new forward call means adding the name to `registry.ts`; typecheck will tell you.
