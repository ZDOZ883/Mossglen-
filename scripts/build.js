// Transpile src/*.ts (concatenated in filename order) and inline into src/index.html -> mossglen.html
const fs = require('fs'), path = require('path'), esbuild = require('esbuild');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'src');
const ts = fs.readdirSync(dir).filter(f => f.endsWith('.ts')).sort()
  .map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const js = esbuild.transformSync(ts, { loader: 'ts', target: 'es2022' }).code;
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8').replace('/*__GAME__*/', () => js);
fs.writeFileSync(path.join(root, 'mossglen.html'), html);
console.log('built mossglen.html', html.length, 'bytes');
