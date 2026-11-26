import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCatalogs, catalogLines } from '../js/data/catalogs.js';
import { buildSets } from '../js/data/sets.js';
import { acabamentoDe, contarPorTipo } from '../js/data/acabamento.js';

const ler = (f) => JSON.parse(fs.readFileSync(new URL(`../dados/${f}`, import.meta.url), 'utf8'));
const catalogos = buildCatalogs({
  ac: ler('acrilex-cores-oficial.json'), tm: ler('tamiya-cores-oficial.json'), rv: ler('revell-cores-oficial.json'),
  fs: ler('fs595-cores.json'), vl: ler('vallejo-cores.json'), mr: ler('mrcolor-cores.json'), hb: ler('humbrol-cores.json'),
  ral: ler('ral-cores.json'), ak: ler('ak-cores.json'), am: ler('ammo-cores.json'), sc: ler('scale75-cores.json'),
  tc: ler('tomcolors-cores.json'), px: ler('phoenix-cores.json'), tl: ler('talento-cores.json'), al: ler('acrilex-linhas-cores.json'), ar: ler('artesania-cores.json'), oc: ler('occre-cores.json'),
});
const ac = catalogos.acrilex;
const por = Object.fromEntries(ac.map((p) => [p.code, p]));
const linha = (l) => ac.filter((p) => p.line === l);

test('Acrilex: 223 cores em 6 linhas, códigos únicos e hex válido', () => {
  assert.equal(ac.length, 95 + 128);
  assert.equal(new Set(ac.map((p) => p.code)).size, ac.length, 'códigos repetidos');
  for (const p of ac) assert.match(p.hex, /^#[0-9a-f]{6}$/, p.code);
  assert.deepEqual(catalogLines(ac), ['Fosca', 'Brilhante', 'Neon', 'Metal Colors', 'Chalk', 'Acrylic Colors']);
  assert.deepEqual(Object.fromEntries(catalogLines(ac).map((l) => [l, linha(l).length])), { Fosca: 95, Brilhante: 20, Neon: 6, 'Metal Colors': 18, Chalk: 30, 'Acrylic Colors': 54 });
});

test('Acrilex: a Fosca continua com os mesmos códigos (receitas salvas não quebram)', () => {
  assert.equal(por['519'].name, 'Branco');
  assert.equal(por['520'].name, 'Preto');
  assert.equal(por['519'].line, 'Fosca');
  // as outras linhas repetem números, então levam o nome da linha no código
  assert.equal(por['Brilhante 519'].name, 'Branco');
  assert.equal(por['Chalk 519'].name, 'Branco');
  assert.equal(por['Chalk 585'].name, 'Capuccino');
  assert.equal(por['Metal 533'].name, 'Prata');
  assert.equal(por['Neon 107'].name, 'Maravilha');
  assert.equal(por['Acrylic 346'].name, 'Alizarin Crimson');
  assert.equal(por['Acrylic 364'].name, 'Verde Inglês nº 5');
});

test('Acrilex: acabamentos declarados em cada linha', () => {
  const tipo = (l) => contarPorTipo(linha(l), 'acrilex');
  assert.deepEqual(tipo('Fosca'), { matte: 95 });
  assert.deepEqual(tipo('Brilhante'), { gloss: 20 });
  assert.deepEqual(tipo('Chalk'), { matte: 30 });
  assert.deepEqual(tipo('Neon'), { special: 6 });
  assert.deepEqual(tipo('Metal Colors'), { metallic: 18 });
  assert.deepEqual(tipo('Acrylic Colors'), { satin: 49, metallic: 5 });
  assert.equal(acabamentoDe('acrilex', por['Acrylic 386']).tipo, 'metallic'); // Prata Iridescente
});

test('Acrilex: cores lidas das amostras (claras e escuras no lugar certo)', () => {
  const luz = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).reduce((a, b) => a + b) / 3;
  assert.ok(luz(por['Brilhante 519'].hex) > 230);
  assert.ok(luz(por['Brilhante 520'].hex) < 40);
  assert.ok(luz(por['Chalk 417'].hex) > 230);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(por['Brilhante 507'].hex.slice(i, i + 2), 16)); // Vermelho Fogo
  assert.ok(r > 180 && g < 70 && b < 70);
});

test('Acrilex: gotas com brilho da Acrylic Colors ficam marcadas como aproximadas', () => {
  const aprox = ac.filter((p) => p.aprox);
  assert.deepEqual(aprox.map((p) => p.code).sort(), ['Acrylic 324', 'Acrylic 335', 'Acrylic 341', 'Acrylic 344']);
  assert.ok(aprox.every((p) => p.aprox === 'gota'));
});

test('Acrilex: conjuntos de mistura (Fosca, Brilhante, Chalk, Acrylic Colors e combinados)', () => {
  const sets = buildSets(catalogos);
  const n = (id) => sets.get(id).paints.length;
  assert.equal(n('acrilex'), 95);
  assert.equal(n('acrilex-brilhante'), 20);
  assert.equal(n('acrilex-chalk'), 30);
  assert.equal(n('acrilex-colors'), 54 - 5 - 4); // sem as iridescentes e as 4 aproximadas
  assert.equal(n('acrilex-fosca-brilhante'), 115);
  assert.equal(n('acrilex-fosca-brilhante-chalk'), 145);
  assert.ok(sets.get('acrilex-fosca-brilhante').porCodigo.has('519') && sets.get('acrilex-fosca-brilhante').porCodigo.has('Brilhante 519'));
  // Metal Colors e Neon nunca entram como ingredientes
  for (const s of sets.list.filter((x) => x.tab === 'acrilex')) {
    assert.ok(s.paints.every((p) => !['Metal Colors', 'Neon'].includes(p.line)), s.id);
  }
});
