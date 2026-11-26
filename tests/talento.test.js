import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCatalogs, catalogLines } from '../js/data/catalogs.js';
import { buildSets } from '../js/data/sets.js';
import { acabamentoDe } from '../js/data/acabamento.js';

const ler = (f) => JSON.parse(fs.readFileSync(new URL(`../dados/${f}`, import.meta.url), 'utf8'));
const catalogos = buildCatalogs({
  ac: ler('acrilex-cores-oficial.json'), tm: ler('tamiya-cores-oficial.json'), rv: ler('revell-cores-oficial.json'),
  fs: ler('fs595-cores.json'), vl: ler('vallejo-cores.json'), mr: ler('mrcolor-cores.json'), hb: ler('humbrol-cores.json'),
  ral: ler('ral-cores.json'), ak: ler('ak-cores.json'), am: ler('ammo-cores.json'), sc: ler('scale75-cores.json'),
  tc: ler('tomcolors-cores.json'), px: ler('phoenix-cores.json'), tl: ler('talento-cores.json'), al: ler('acrilex-linhas-cores.json'), ar: ler('artesania-cores.json'), oc: ler('occre-cores.json'),
});
const tl = catalogos.talento;
const por = Object.fromEntries(tl.map((p) => [p.code, p]));
const tipo = (code) => acabamentoDe('talento', por[code]).tipo;

test('Talento: 282 cores, códigos únicos, hex válido e as 7 linhas do catálogo', () => {
  assert.equal(tl.length, 282);
  assert.equal(new Set(tl.map((p) => p.code)).size, tl.length, 'códigos repetidos');
  for (const p of tl) {
    assert.match(p.hex, /^#[0-9a-f]{6}$/, `hex de ${p.code}`);
    assert.ok(p.name && p.code, `código e nome de ${p.code}`);
  }
  assert.deepEqual(catalogLines(tl), ['Acrylic Color', 'Metallic', 'Game', 'Artes', 'Metallic Artes', 'Clear', 'Speed']);
  const n = {};
  tl.forEach((p) => (n[p.line] = (n[p.line] || 0) + 1));
  assert.deepEqual(n, { 'Acrylic Color': 148, Metallic: 14, Game: 19, Artes: 71, 'Metallic Artes': 14, Clear: 7, Speed: 9 });
});

test('Talento: códigos e nomes como impressos no catálogo', () => {
  assert.equal(por['100'].name, 'Light Sand');
  assert.equal(por['133'].name, 'Schwarzgrau RLM66'); // a referência da marca fica no nome
  assert.equal(por['2015'].name, 'Orange Yellow «Joker»');
  assert.equal(por['C3005'].name, 'Az.Phthalo');
  assert.equal(por['Clear Smoke'].name, 'Clear Smoke'); // sem número no catálogo: o nome é o código
  // as metálicas das Artes repetem os números das de modelismo e ganham prefixo
  assert.equal(por['400'].name, 'Aluminium');
  assert.equal(por['Artes 400'].name, 'Branco');
  assert.equal(por['Artes 427'].name, 'Golden Green');
  assert.equal(por['427'].name, 'Cromo');
});

test('Talento: cores lidas das amostras do PDF', () => {
  assert.equal(por['163'].hex, '#ffffff'); // Gloss White
  assert.equal(por['1000'].hex, '#ffffff'); // Branco (pincelada só com contorno)
  assert.equal(por['C3008'].hex, '#000000');
  // 100 Light Sand: bege acinzentado, e 108 Dark Green RAF: verde bem escuro
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(por['100'].hex.slice(i, i + 2), 16));
  assert.ok(r > g && g > b && r > 150 && r < 200);
  assert.match(por['108'].hex, /^#[0-3]/);
});

test('Talento: acabamentos (fosco, brilhante, acetinado, metálico, transparente, neon)', () => {
  assert.equal(tipo('110'), 'matte');
  assert.equal(tipo('163'), 'gloss');
  assert.equal(tipo('164'), 'gloss');
  assert.equal(tipo('205'), 'gloss');
  assert.equal(tipo('2001'), 'satin');
  assert.equal(tipo('404'), 'metallic');
  assert.equal(tipo('Artes 412'), 'metallic');
  assert.equal(tipo('Clear Red'), 'clear');
  assert.equal(tipo('C3003'), 'clear');
  assert.equal(tipo('1041'), 'special'); // neon
  assert.equal(tipo('1048'), 'matte'); // Verde Cádmio não é neon
});

test('Talento: uma linha de ingredientes (Acrylic Color + Artes + Game) sem metálicas, transparentes nem neon', () => {
  const sets = buildSets(catalogos);
  const s = sets.get('talento-acrylic');
  assert.equal(sets.list.filter((x) => x.tab === 'talento').length, 1);
  assert.equal(s.quimica, 'acrilica');
  assert.equal(s.paints.length, 148 + 71 + 19 - 7); // as 7 neon das Artes ficam de fora
  assert.ok(s.paints.every((p) => ['Acrylic Color', 'Artes', 'Game'].includes(p.line)));
  for (const c of ['1041', '1047', '404', 'Clear Red', 'C3003']) assert.ok(!s.porCodigo.has(c), `${c} não deveria ser ingrediente`);
  for (const c of ['1000', '1001', '110', '1048', '2001']) assert.ok(s.porCodigo.has(c), `${c} deveria ser ingrediente`);
});

test('Talento: nenhuma cor é marcada como aproximada nem ganha equivalência declarada', () => {
  assert.ok(tl.every((p) => !p.aprox && !p.ref && !p.equiv));
});
