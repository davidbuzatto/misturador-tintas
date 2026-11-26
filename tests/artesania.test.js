import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCatalogs, catalogName } from '../js/data/catalogs.js';
import { buildSets } from '../js/data/sets.js';
import { acabamentoDe, contarPorTipo } from '../js/data/acabamento.js';

const ler = (f) => JSON.parse(fs.readFileSync(new URL(`../dados/${f}`, import.meta.url), 'utf8'));
const catalogos = buildCatalogs({
  ac: ler('acrilex-cores-oficial.json'), tm: ler('tamiya-cores-oficial.json'), rv: ler('revell-cores-oficial.json'),
  fs: ler('fs595-cores.json'), vl: ler('vallejo-cores.json'), mr: ler('mrcolor-cores.json'), hb: ler('humbrol-cores.json'),
  ral: ler('ral-cores.json'), ak: ler('ak-cores.json'), am: ler('ammo-cores.json'), sc: ler('scale75-cores.json'),
  tc: ler('tomcolors-cores.json'), px: ler('phoenix-cores.json'), tl: ler('talento-cores.json'), al: ler('acrilex-linhas-cores.json'),
  ar: ler('artesania-cores.json'), oc: ler('occre-cores.json'),
});
const ar = catalogos.artesania;
const por = Object.fromEntries(ar.map((p) => [p.code, p]));

test('Artesanía Latina: 43 tintas avulsas, referências da loja, hex válido', () => {
  assert.equal(catalogName('artesania'), 'Artesanía Latina');
  assert.equal(ar.length, 43);
  assert.equal(new Set(ar.map((p) => p.code)).size, 43);
  for (const p of ar) {
    assert.match(p.code, /^277\d\d$/, p.code);
    assert.match(p.hex, /^#[0-9a-f]{6}$/, p.code);
  }
  assert.equal(por['27702'].name, 'Off White');
  assert.equal(por['27705'].name, 'Grey RLM66');
  assert.ok(!por['27700'], 'o diluente não é tinta');
});

test('Artesanía Latina: cores da faixa (branco e preto nos extremos, vermelho e azul no lugar)', () => {
  const rgb = (c) => [1, 3, 5].map((i) => parseInt(por[c].hex.slice(i, i + 2), 16));
  assert.ok(rgb('27702').every((v) => v > 225)); // Off White
  assert.ok(rgb('27703').every((v) => v < 30)); // Off Black
  const [r, g, b] = rgb('27713'); // Vermilion
  assert.ok(r > 180 && g < 80 && b < 60);
  const [r2, , b2] = rgb('27720'); // Royal Blue
  assert.ok(b2 > 150 && r2 < 40);
});

test('Artesanía Latina: acabamento semifosco declarado e 4 metálicas', () => {
  assert.deepEqual(contarPorTipo(ar, 'artesania'), { matte: 39, metallic: 4 });
  assert.deepEqual(acabamentoDe('artesania', por['27733']), { tipo: 'matte', inferido: false }); // Chrome Yellow não é metálica
  for (const c of ['27760', '27761', '27762', '27763']) assert.equal(acabamentoDe('artesania', por[c]).tipo, 'metallic', c);
});

test('Artesanía Latina: nenhuma cor aproximada; Pen Duick Green fica com a cor da faixa (verde-água claro)', () => {
  assert.ok(ar.every((p) => !p.aprox));
  assert.equal(por['27756'].hex, '#aeded0');
});

test('Artesanía Latina: conjunto de mistura sem metálicas nem a aproximada', () => {
  const s = buildSets(catalogos).get('artesania');
  assert.equal(s.id, 'artesania');
  assert.equal(s.quimica, 'acrilica');
  assert.equal(s.paints.length, 43 - 4);
  for (const c of ['27760', '27763']) assert.ok(!s.porCodigo.has(c), c);
});
