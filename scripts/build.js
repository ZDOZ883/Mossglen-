// Bundle src/main.ts (esbuild, no tree-shaking so tests can reach every name) and inline into src/index.html -> mossglen.html
const fs = require('fs'), path = require('path'), esbuild = require('esbuild');
const root = path.join(__dirname, '..');
const r = esbuild.buildSync({
  entryPoints: [path.join(root, 'src/main.ts')], bundle: true, format: 'iife', target: 'es2022',
  treeShaking: false, write: false, tsconfig: path.join(root, 'tsconfig.json'),
});
const js = r.outputFiles[0].text;
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8').replace('/*__GAME__*/', () => js);
fs.writeFileSync(path.join(root, 'mossglen.html'), html);
console.log('built mossglen.html', html.length, 'bytes');
