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
const oc = catalogos.occre;
const por = Object.fromEntries(oc.map((p) => [p.code, p]));

test('OcCre: as 23 tintas da tabela de referências, com nomes em inglês', () => {
  assert.equal(catalogName('occre'), 'OcCre');
  assert.equal(oc.length, 23);
  assert.equal(new Set(oc.map((p) => p.code)).size, 23);
  for (const p of oc) assert.match(p.hex, /^#[0-9a-f]{6}$/, p.code);
  assert.equal(por['19395'].name, 'White');
  assert.equal(por['19412'].name, 'Light Grey (Grey-1)');
  assert.equal(por['19424'].name, 'Royal Blue');
  // acabamentos da tabela não são tintas: betume, primer, verniz e tingidores ficam de fora
  for (const c of ['19417', '19418', '19419', '19420', '19421', '19422', '19423']) assert.ok(!por[c], c);
});

test('OcCre: cores das amostras e metálicas', () => {
  assert.equal(por['19395'].hex, '#ffffff');
  assert.equal(por['19402'].hex, '#e02130');
  assert.deepEqual(contarPorTipo(oc, 'occre'), { matte: 20, metallic: 3 });
  assert.deepEqual(acabamentoDe('occre', por['19402']), { tipo: 'matte', inferido: false });
  for (const c of ['19408', '19409', '19410']) assert.deepEqual(acabamentoDe('occre', por[c]), { tipo: 'metallic', inferido: false });
});

test('OcCre: conjunto de mistura com as 20 tintas não metálicas', () => {
  const s = buildSets(catalogos).get('occre');
  assert.equal(s.quimica, 'acrilica');
  assert.equal(s.paints.length, 20);
  assert.ok(!s.porCodigo.has('19408'));
});
