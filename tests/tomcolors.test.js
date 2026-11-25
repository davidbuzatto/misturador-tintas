import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCatalogs, catalogLines } from '../js/data/catalogs.js';
import { buildSets } from '../js/data/sets.js';

const ler = (f) => JSON.parse(fs.readFileSync(new URL(`../dados/${f}`, import.meta.url), 'utf8'));
const dados = ler('tomcolors-cores.json');
const catalogos = buildCatalogs({
  ac: ler('acrilex-cores-oficial.json'), tm: ler('tamiya-cores-oficial.json'), rv: ler('revell-cores-oficial.json'),
  fs: ler('fs595-cores.json'), vl: ler('vallejo-cores.json'), mr: ler('mrcolor-cores.json'), hb: ler('humbrol-cores.json'),
  ral: ler('ral-cores.json'), ak: ler('ak-cores.json'), am: ler('ammo-cores.json'), sc: ler('scale75-cores.json'), tc: dados, px: ler('phoenix-cores.json'), tl: ler('talento-cores.json'), al: ler('acrilex-linhas-cores.json'),
});
const tc = catalogos.tomcolors;
const por = Object.fromEntries(tc.map((p) => [p.code, p]));

test('Tom Colors: registros completos, códigos únicos e linhas pelo prefixo do código', () => {
  // 174 tintas na loja (154 Acrylic Colors e 20 UP) mais 5 UP vendidas só no conjunto (tomcolors-extras.json)
  assert.equal(tc.length, 179, `veio ${tc.length}`);
  assert.equal(new Set(tc.map((p) => p.code)).size, tc.length, 'códigos repetidos');
  for (const p of tc) {
    assert.match(p.hex, /^#[0-9a-f]{6}$/, `hex de ${p.code}`);
    assert.ok(p.name, `nome de ${p.code}`);
    assert.equal(p.line, p.code.startsWith('TCUP-') ? 'UP' : 'Acrylic Colors', `linha de ${p.code}`);
    assert.match(p.code, /^TC(UP)?-\d{2,4}$/);
  }
  assert.deepEqual(catalogLines(tc), ['Acrylic Colors', 'UP']);
  assert.equal(tc.filter((p) => p.line === 'UP').length, 25);
});

test('Tom Colors: a UP tem imagem-modelo (círculo) e a linha TC tem amostra real; só Skin Tones sem modelo são aproximadas', () => {
  const conferidas = new Set(Object.keys(JSON.parse(fs.readFileSync(new URL('../ferramentas/tomcolors-correcoes.json', import.meta.url), 'utf8'))));
  // 3 das 5 vendidas só no conjunto (escuras e frias) têm a cor estimada; as outras 22 vêm de amostra
  assert.deepEqual(tc.filter((p) => p.line === 'UP' && p.aprox).map((p) => p.code).sort(), ['TCUP-13', 'TCUP-14', 'TCUP-20']);
  assert.ok(tc.filter((p) => p.aprox === 'estimada').length === 3);
  // as Skin Tones sem amostra têm a cor lida da cabeça pintada na foto (aproximada) até serem conferidas
  assert.ok(tc.filter((p) => p.line === 'Acrylic Colors' && !conferidas.has(p.code)).every((p) => !p.aprox || p.aprox === 'foto'));
  assert.ok(tc.filter((p) => p.line === 'Acrylic Colors' && conferidas.has(p.code)).every((p) => !p.aprox));
});

test('Tom Colors: UP completa (25) com a tinta aplicada no cartão; só 3 UP estimadas e 6 Skin Tones aproximadas pela foto', () => {
  const soma = (hex) => [1, 3, 5].reduce((s, i) => s + parseInt(hex.slice(i, i + 2), 16), 0);
  // Azul Oceano: tinta aplicada no cartão é um azul vivo (a poça e o círculo do anúncio são navy quase preto)
  const [r19, g19, b19] = [1, 3, 5].map((i) => parseInt(por['TCUP-19'].hex.slice(i, i + 2), 16));
  assert.ok(b19 > 120 && r19 < 40 && g19 < 90, `Azul Oceano: ${por['TCUP-19'].hex}`);
  assert.equal(por['TCUP-22'].hex, '#000000');
  // as 5 que a loja só vende no conjunto entram pelo arquivo de extras, com o nome lido do rótulo
  const extras = JSON.parse(fs.readFileSync(new URL('../ferramentas/tomcolors-extras.json', import.meta.url), 'utf8'));
  assert.deepEqual(extras.map((e) => e.code).sort(), ['TCUP-09', 'TCUP-10', 'TCUP-13', 'TCUP-14', 'TCUP-20']);
  for (const e of extras) assert.equal(por[e.code].hex, e.hex, e.code);
  assert.equal(por['TCUP-09'].name, 'Gorro de Saci');
  assert.equal(por['TCUP-14'].name, 'Escama do Boitatá');
  assert.equal(por['TCUP-16'].hex, '#ffffff');
  const fotos = tc.filter((p) => p.aprox === 'foto').map((p) => p.code).sort();
  for (const c of fotos) assert.ok(['TC-0140', 'TC-0194', 'TC-0244', 'TC-0248', 'TC-0305', 'TC-0307'].includes(c), `${c} só tem foto de cabeça?`);
  assert.ok(fotos.length <= 6);
  // as Skin Tones Deep, Shadow e Base têm a imagem-modelo com traço entre as fotos do anúncio
  for (const c of ['TC-0320', 'TC-0308', 'TC-0306']) assert.ok(!por[c].aprox, c);
});

test('Tom Colors: correções conferidas no site valem sobre a cor medida', () => {
  const correcoes = JSON.parse(fs.readFileSync(new URL('../ferramentas/tomcolors-correcoes.json', import.meta.url), 'utf8'));
  for (const [code, c] of Object.entries(correcoes)) {
    assert.ok(por[code], `${code} não existe`);
    assert.equal(por[code].hex, c.hex, code);
  }
});

test('Tom Colors: cores conhecidas (amarelo do RLM 04, preto escuro, nomes normalizados)', () => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(por['TC-0300'].hex.slice(i, i + 2), 16)); // RLM 04
  assert.ok(r > 240 && g > 150 && b < 60, `RLM 04 deveria ser amarelo: ${por['TC-0300'].hex}`);
  assert.equal(por['TC-0300'].name, 'RLM 04');
  assert.equal(por['TC-0042'].name, 'FS 36375');
  assert.ok(!tc.some((p) => /TC-?\d/i.test(p.name)), 'o código TC não deve ficar no nome');
});

test('Tom Colors: uma linha de ingredientes, só com as cores medidas em amostra real', () => {
  const sets = buildSets(catalogos);
  const s = sets.get('tomcolors-acrylic');
  assert.equal(s.id, 'tomcolors-acrylic');
  assert.equal(s.quimica, 'acrilica');
  assert.equal(s.paints.length, tc.filter((p) => p.line === 'Acrylic Colors' && !p.aprox).length);
  assert.ok(s.paints.every((p) => !p.aprox && p.line === 'Acrylic Colors'));
  assert.equal(sets.list.filter((x) => x.tab === 'tomcolors').length, 3);
  // a UP (ultra-pigmentada) é uma linha à parte, só com as cores de círculo oficial (nenhuma aproximada)
  const up = sets.get('tomcolors-up');
  assert.equal(up.id, 'tomcolors-up');
  assert.equal(up.paints.length, tc.filter((p) => p.line === 'UP' && !p.aprox).length);
  assert.equal(up.paints.length, 22); // as 3 estimadas ficam de fora das misturas
  // conjunto combinado: Acrylic Colors + UP na mesma receita
  const junto = sets.get('tomcolors-acrylic-up');
  assert.equal(junto.id, 'tomcolors-acrylic-up');
  assert.equal(junto.paints.length, s.paints.length + up.paints.length);
  assert.ok(junto.porCodigo.has('TC-0001') && junto.porCodigo.has('TCUP-06'));
});
