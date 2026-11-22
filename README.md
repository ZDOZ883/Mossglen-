# Mossglen

A woodland idle game. Single-file HTML output, written in TypeScript.

## Layout
- `src/NN-*.ts`   game source split by area (data, combat, UI, engine, boot); concatenated in order
- `src/index.html` page shell and CSS
- `scripts/build.js` transpiles TS (esbuild) and inlines it -> `mossglen.html`
- `tests/`        harness + 55 tests (data integrity, grips, expeditions, saves, rendering, balance, performance)

## Commands
- `npm ci`            install
- `npm run build`     produce `mossglen.html`
- `npm run typecheck` tsc, no emit
- `npm test`          build + run tests (Node built-in runner)
- `npm run check`     typecheck + tests (what CI runs)

Balance guards in `tests/game.test.js` are intentional bounds; if you retune on purpose, update them.
Tests load the built HTML into a sandbox with a seeded RNG, so runs are deterministic.

Note: the save key stays `hollowbrook1` so existing saves keep working after the rename.
