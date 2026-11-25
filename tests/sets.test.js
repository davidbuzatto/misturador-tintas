/**
 * Testes das linhas de tintas usadas como ingredientes (js/data/sets.js).
 * Roda com: node --test tests/*.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { buildCatalogs } from '../js/data/catalogs.js';
import { DEFAULT_SET, INGREDIENT_SETS, buildSets, misturavel } from '../js/data/sets.js';
import { mixHex } from '../js/color/mixing.js';
import { hex2lab } from '../js/color/convert.js';

const ler = (arquivo) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../dados/${arquivo}`, import.meta.url)), 'utf8'));

const catalogos = buildCatalogs({
  ac: ler('acrilex-cores-oficial.json'),
  tm: ler('tamiya-cores-oficial.json'),
  rv: ler('revell-cores-oficial.json'),
  fs: ler('fs595-cores.json'),
  vl: ler('vallejo-cores.json'),
  mr: ler('mrcolor-cores.json'),
  hb: ler('humbrol-cores.json'),
  ral: ler('ral-cores.json'),
  ak: ler('ak-cores.json'),
  am: ler('ammo-cores.json'),
  sc: ler('scale75-cores.json'),
  tc: ler('tomcolors-cores.json'),
  px: ler('phoenix-cores.json'),
});
const sets = buildSets(catalogos);

test('linhas de ingredientes: ids únicos, padrão existe e cada uma tem tintas', () => {
  const ids = INGREDIENT_SETS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos');
  assert.ok(ids.includes(DEFAULT_SET));
  for (const s of sets.list) {
    assert.ok(catalogos[s.tab], `catálogo ${s.tab} não existe (${s.id})`);
    assert.ok(s.paints.length >= 20, `${s.id} tem poucas tintas: ${s.paints.length}`);
    assert.ok(['acrilica', 'lacquer', 'esmalte', 'oleo', 'poliester'].includes(s.quimica), `${s.id}: química ${s.quimica}`);
    assert.ok(s.anchors.size >= 4, `${s.id}: poucas âncoras`);
    for (const a of s.anchors) assert.ok(s.porCodigo.has(a), `${s.id}: âncora ${a} fora da linha`);
  }
});

test('Acrilex: nenhuma tinta é descartada e as âncoras são as fixas de antes', () => {
  const acrilex = sets.get('acrilex');
  assert.equal(acrilex.paints.length, catalogos.acrilex.length);
  assert.equal(acrilex.excluidas, 0);
  assert.deepEqual([...acrilex.anchors], ['519', '520', '505', '559', '555', '549', '504', '503']);
});

test('tintas metálicas, translúcidas e em degradê ficam de fora', () => {
  const mc = sets.get('vallejo-model-color');
  // Model Color: 204 cores, 10 delas são da série "Metallic"
  assert.equal(mc.paints.length + mc.excluidas, catalogos.vallejo.filter((p) => p.line === 'Model Color').length);
  assert.ok(mc.excluidas >= 10, `esperava as metálicas ocultas, veio ${mc.excluidas}`);
  assert.ok(mc.paints.every(misturavel));
  assert.ok(!mc.paints.some((p) => p.series === 'Metallic'));
  assert.ok(!mc.paints.some((p) => p.degrade));
  // Humbrol: "Metallic" no acabamento
  assert.ok(!sets.get('humbrol').paints.some((p) => p.finish === 'Metallic'));
  // casos diretos
  assert.equal(misturavel({ name: 'Clear Red', hex: '#ff0000' }), false);
  assert.equal(misturavel({ name: 'Silver (Metallic)', hex: '#cccccc' }), false);
  assert.equal(misturavel({ name: 'Gunship Grey', hex: '#666666' }), true);
  assert.equal(misturavel({ name: 'X', hex: '#666666', degrade: true }), false);
});

test('âncoras automáticas: há um branco e um preto em cada linha', () => {
  for (const s of sets.list) {
    const luz = [...s.anchors].map((c) => hex2lab(s.porCodigo.get(c).hex)[0]);
    assert.ok(Math.max(...luz) > 85, `${s.id}: sem âncora clara (${Math.max(...luz).toFixed(0)})`);
    assert.ok(Math.min(...luz) < 30, `${s.id}: sem âncora escura (${Math.min(...luz).toFixed(0)})`);
  }
});

test('prepare/paint: ajusta o espectro e a mistura de duas tintas de qualquer linha é válida', () => {
  for (const s of sets.list) {
    const pronto = sets.prepare(s.id);
    assert.ok(pronto.paints.every((p) => p.fit), `${s.id}: tinta sem ajuste espectral`);
    const [a, b] = [pronto.paints[0], pronto.paints.at(-1)];
    const hex = mixHex([{ p: sets.paint(s.id, a.code).fit, w: 1 }, { p: sets.paint(s.id, b.code).fit, w: 1 }], 'km');
    assert.match(hex, /^#[0-9a-f]{6}$/, `${s.id}: mistura inválida`);
  }
  assert.equal(sets.paint('acrilex', 'inexistente'), undefined);
  assert.equal(sets.get('id-desconhecido').id, DEFAULT_SET);
});
