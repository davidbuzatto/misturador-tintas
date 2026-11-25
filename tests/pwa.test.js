import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const raiz = new URL('..', import.meta.url);
const ler = (f) => fs.readFileSync(new URL(f, raiz), 'utf8');
const sw = ler('sw.js');
const listados = [...sw.match(/const ARQUIVOS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

/** Todos os arquivos de uma pasta (relativos à raiz do projeto, com `/`). */
function arquivos(pasta) {
  return fs.readdirSync(new URL(pasta + '/', raiz), { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.relative(fileRoot(), path.join(e.parentPath, e.name)).split(path.sep).join('/'));
}
const fileRoot = () => new URL('.', raiz).pathname.replace(/^\/([A-Za-z]:)/, '$1').replace(/%20/g, ' ');

test('service worker: a lista de arquivos cobre o app inteiro e todos existem', () => {
  const catalogs = ler('js/data/catalogs.js');
  const dados = [...catalogs.matchAll(/loadJson\('([^']+)'\)/g)].map((m) => 'dados/' + m[1]);
  const esperados = ['index.html', 'manifest.webmanifest', 'css/styles.css', ...arquivos('js'), ...dados, ...arquivos('icones')];
  for (const f of esperados) assert.ok(listados.includes(f), `${f} falta na lista do sw.js`);
  for (const f of listados) if (f !== './') assert.ok(fs.existsSync(new URL(f, raiz)), `${f} está na lista mas não existe`);
});

test('manifest: instalável (nome, início, modo, ícones 192 e 512 que existem)', () => {
  const m = JSON.parse(ler('manifest.webmanifest'));
  assert.ok(m.name && m.short_name);
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './');
  const tam = m.icons.map((i) => i.sizes);
  assert.ok(tam.includes('192x192') && tam.includes('512x512'));
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(fs.existsSync(new URL(i.src, raiz)), i.src);
});

test('index.html liga o manifesto, o ícone do iOS e registra o service worker', () => {
  const h = ler('index.html');
  assert.match(h, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(h, /rel="apple-touch-icon"/);
  assert.match(h, /serviceWorker\.register\('sw\.js'\)/);
});

test('workflow de publicação copia os arquivos do app instalável', () => {
  const w = ler('.github/workflows/pages.yml');
  for (const f of ['manifest.webmanifest', 'sw.js', 'icones']) assert.ok(w.includes(f), `${f} não é copiado para o site`);
});
