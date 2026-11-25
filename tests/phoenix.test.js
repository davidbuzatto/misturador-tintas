import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCatalogs, catalogLines } from '../js/data/catalogs.js';
import { buildSets } from '../js/data/sets.js';
import { acabamentoDe } from '../js/data/acabamento.js';

const ler = (f) => JSON.parse(fs.readFileSync(new URL(`../dados/${f}`, import.meta.url), 'utf8'));
const dados = ler('phoenix-cores.json');
const catalogos = buildCatalogs({
  ac: ler('acrilex-cores-oficial.json'), tm: ler('tamiya-cores-oficial.json'), rv: ler('revell-cores-oficial.json'),
  fs: ler('fs595-cores.json'), vl: ler('vallejo-cores.json'), mr: ler('mrcolor-cores.json'), hb: ler('humbrol-cores.json'),
  ral: ler('ral-cores.json'), ak: ler('ak-cores.json'), am: ler('ammo-cores.json'), sc: ler('scale75-cores.json'),
  tc: ler('tomcolors-cores.json'), px: dados,
});
const px = catalogos.phoenix;
const por = Object.fromEntries(px.map((p) => [p.code, p]));

test('Phoenix: 597 cores, códigos únicos, hex válido e as 10 linhas (padrões) do site', () => {
  assert.equal(px.length, 597);
  assert.equal(new Set(px.map((p) => p.code)).size, px.length, 'códigos repetidos');
  for (const p of px) {
    assert.match(p.hex, /^#[0-9a-f]{6}$/, `hex de ${p.code}`);
    assert.ok(p.name && p.code, `código e nome de ${p.code}`);
  }
  assert.deepEqual(catalogLines(px), ['Federal Standard', 'RLM', 'British Standard', 'RAL', 'ANA', 'IJA', 'IJN', 'Regia Aeronautica', 'Soviet & Russian', 'USN']);
  const n = {};
  px.forEach((p) => (n[p.line] = (n[p.line] || 0) + 1));
  assert.deepEqual(n, { 'Federal Standard': 230, RLM: 31, 'British Standard': 26, RAL: 151, ANA: 39, IJA: 18, IJN: 15, 'Regia Aeronautica': 39, 'Soviet & Russian': 21, USN: 27 });
});

test('Phoenix: código e nome separados, com o padrão no código', () => {
  assert.equal(por['FS 11136'].name, 'Carmine Vine Red');
  assert.equal(por['RAL 1000'].name, 'Grünbeige');
  assert.equal(por['RLM 02'].name, 'Grau');
  assert.equal(por['BS 381C 102'].name, 'Light Blue');
  assert.equal(por['ANA 501'].name, 'True Blue');
  assert.equal(por['USN #5'].name, 'Navy Gray');
  assert.equal(por['IJN Ash Grey'].name, 'Ash Grey'); // a sigla fica só no código
  assert.equal(por['Azzurro 11'].name, 'Azzurro 11'); // sem código separado no site: o nome é o código
  // o mesmo número FS com nomes diferentes não colide
  assert.ok(por['FS 36375 Medium Gray'] && por['FS 36375 Light Ghost Grey']);
  assert.ok(!px.some((p) => /^\d{5} /.test(p.name)), 'o número FS não deve sobrar no nome');
});

test('Phoenix: não inclui pigmentos em pó nem sets, e as entradas repetidas do site foram unidas', () => {
  assert.ok(!px.some((p) => /set |kit|pigmento/i.test(p.name)));
  assert.ok(!px.some((p) => p.line === 'Exclusivos Phoenix' || p.line === 'Sets & Kits'));
});

test('Phoenix: metálicas e transparente ficam como tais e fora das misturas', () => {
  assert.equal(acabamentoDe('phoenix', por['RLM 01']).tipo, 'metallic');
  assert.equal(acabamentoDe('phoenix', por['RAL 9006']).tipo, 'metallic');
  assert.equal(acabamentoDe('phoenix', por['RLM 00']).tipo, 'clear');
  const sets = buildSets(catalogos);
  for (const id of ['phoenix-duco', 'phoenix-poliester']) {
    const s = sets.get(id);
    assert.equal(s.paints.length, 597 - 9, id); // 4 metálicas, 1 transparente e 4 fluorescentes
    for (const c of ['RLM 01', 'RAL 9006', 'RAL 9007', 'A-14f', 'RLM 00', 'FS 38901']) assert.ok(!s.porCodigo.has(c), `${id}: ${c} não deveria ser ingrediente`);
  }
});

test('Phoenix: duas linhas de ingredientes (Duco e poliéster) com as mesmas cores e químicas diferentes', () => {
  const sets = buildSets(catalogos);
  const duco = sets.get('phoenix-duco');
  const poli = sets.get('phoenix-poliester');
  assert.equal(duco.quimica, 'lacquer');
  assert.equal(poli.quimica, 'poliester');
  assert.deepEqual([...duco.porCodigo.keys()], [...poli.porCodigo.keys()]);
  assert.equal(sets.list.filter((s) => s.tab === 'phoenix').length, 2);
});

test('Phoenix: nenhuma cor é marcada como aproximada nem ganha equivalência declarada', () => {
  assert.ok(px.every((p) => !p.aprox && !p.ref && !p.equiv));
});
