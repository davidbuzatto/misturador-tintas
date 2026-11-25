import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCatalogs, catalogLines } from '../js/data/catalogs.js';
import { buildSets } from '../js/data/sets.js';
import { acabamentoDe } from '../js/data/acabamento.js';
import { setLang } from '../js/i18n/index.js';
import { dicaAprox, eAprox } from '../js/ui/dom.js';

const ler = (f) => JSON.parse(fs.readFileSync(new URL(`../dados/${f}`, import.meta.url), 'utf8'));
const dados = ler('scale75-cores.json');
const catalogos = buildCatalogs({
  ac: ler('acrilex-cores-oficial.json'), tm: ler('tamiya-cores-oficial.json'), rv: ler('revell-cores-oficial.json'),
  fs: ler('fs595-cores.json'), vl: ler('vallejo-cores.json'), mr: ler('mrcolor-cores.json'), hb: ler('humbrol-cores.json'),
  ral: ler('ral-cores.json'), ak: ler('ak-cores.json'), am: ler('ammo-cores.json'), sc: dados, tc: ler('tomcolors-cores.json'), px: ler('phoenix-cores.json'), tl: ler('talento-cores.json'),
});
const sc = catalogos.scale75;
const por = Object.fromEntries(sc.map((p) => [p.code, p]));

test('Scale75: registros completos, códigos únicos e as nove linhas do site oficial', () => {
  assert.equal(sc.length, 549);
  assert.equal(new Set(sc.map((p) => p.code)).size, sc.length, 'códigos repetidos');
  for (const p of sc) {
    assert.match(p.hex, /^#[0-9a-f]{6}$/, `hex de ${p.code}`);
    assert.ok(p.name, `nome de ${p.code}`);
  }
  const linhas = {};
  sc.forEach((p) => (linhas[p.line] = (linhas[p.line] || 0) + 1));
  assert.deepEqual(linhas, {
    Scalecolor: 103, 'Fantasy & Games': 48, Warfront: 64, 'Instant Colors': 46, 'FX Fluor': 6,
    'Scalecolor Artist': 84, 'Drop & Paint': 128, 'Scalecolor Games': 46, Flow: 24,
  });
  assert.equal(catalogLines(sc).length, 9);
});

test('Scale75: séries de efeito e cores aproximadas', () => {
  const series = new Set(sc.map((p) => p.series).filter(Boolean));
  assert.deepEqual([...series].sort(), ['Fluo', 'Ink', 'Inktense', "Metal n' Alchemy"]);
  assert.equal(sc.filter((p) => p.series === "Metal n' Alchemy").length, 24);
  assert.equal(sc.filter((p) => p.series === 'Inktense').length, 16);
  // nada além de 'frasco' e 'diluida' em `aprox`; Drop & Paint e Scalecolor Games só têm o frasco
  assert.ok(sc.every((p) => !p.aprox || ['frasco', 'diluida'].includes(p.aprox)));
  for (const linha of ['Drop & Paint', 'Scalecolor Games']) {
    assert.ok(sc.filter((p) => p.line === linha).every((p) => p.aprox === 'frasco'), linha);
  }
  assert.equal(sc.filter((p) => p.aprox === 'frasco').length, 174);
  // as amostras diluídas e as tintas sem amostra nas linhas que têm traço foram conferidas no site
  // (ferramentas/scale75-correcoes.json): só restam aproximadas as duas linhas que só têm o frasco
  assert.equal(sc.filter((p) => p.aprox === 'diluida').length, 0);
  assert.ok(sc.filter((p) => p.aprox).every((p) => ['Drop & Paint', 'Scalecolor Games'].includes(p.line)));
});

test('Scale75: correções conferidas no site valem sobre a cor medida', () => {
  const correcoes = JSON.parse(fs.readFileSync(new URL('../ferramentas/scale75-correcoes.json', import.meta.url), 'utf8'));
  assert.ok(Object.keys(correcoes).length >= 24);
  for (const [code, c] of Object.entries(correcoes)) {
    assert.ok(por[code], `${code} não existe`);
    assert.equal(por[code].hex, c.hex, code);
    assert.ok(!por[code].aprox, `${code} conferida, mas ainda aproximada`);
  }
});

test('Scale75: cores conhecidas (branco claro, preto escuro)', () => {
  const luz = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
  assert.ok(luz(por['SC-01'].hex) > 650, 'SC-01 White deveria ser claro');
  assert.ok(luz(por['SC-00'].hex) < 120, 'SC-00 Black deveria ser escuro');
  assert.equal(por['SC-35'].name, 'Deep Red');
  assert.equal(por['SFL-04'].name, 'Cobalt Blue Light (Hue)'); // nome misto normalizado
});

test('Scale75: linhas de ingredientes (aproximadas, metálicas e tintas-nanquim ficam de fora)', () => {
  const sets = buildSets(catalogos);
  const esperado = { 'scale75-scalecolor': 63, 'scale75-fantasy': 48, 'scale75-warfront': 64, 'scale75-artist': 66, 'scale75-flow': 24 };
  for (const [id, n] of Object.entries(esperado)) {
    const s = sets.get(id);
    assert.equal(s.id, id);
    assert.equal(s.paints.length, n, id);
    assert.ok(s.paints.every((p) => !p.aprox && !p.series), `${id}: tinta aproximada ou de efeito`);
  }
  assert.equal(sets.get('scale75-flow').quimica, 'oleo');
  // Drop & Paint, Scalecolor Games, Instant Colors e FX Fluor não são linhas de ingredientes
  assert.equal(sets.list.filter((s) => s.tab === 'scale75').length, 5);
});

test('Scale75: acabamento normalizado', () => {
  const tipo = (code) => acabamentoDe('scale75', por[code]).tipo;
  assert.equal(tipo('SC-00'), 'matte');
  assert.equal(tipo('SC-63'), 'metallic'); // Black Metal (Metal n' Alchemy)
  assert.equal(tipo('SC-75'), 'metallic'); // Citrine Alchemy
  assert.equal(tipo('SC-80'), 'special'); // Inktense Wood
  assert.equal(tipo('SFX-04'), 'special'); // FX Fluor
  assert.equal(tipo('SFG-19'), 'satin');
  assert.equal(tipo('SDP-117'), 'metallic'); // White Gold (Drop & Paint)
});

test('indicação de cor aproximada: eAprox e dicaAprox cobrem frasco, diluída e degradê', () => {
  setLang('pt-BR');
  assert.equal(eAprox({}), false);
  assert.equal(dicaAprox({}), '');
  for (const p of [{ aprox: 'frasco' }, { aprox: 'diluida' }, { degrade: true }]) {
    assert.equal(eAprox(p), true);
    assert.ok(dicaAprox(p).length > 10, JSON.stringify(p));
  }
  assert.notEqual(dicaAprox({ aprox: 'frasco' }), dicaAprox({ aprox: 'diluida' }));
});
