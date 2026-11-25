/**
 * Validação dos arquivos de dados em `dados/`: formato dos registros, hex
 * válido e códigos únicos. Roda com: node --test tests/*.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ler = (arquivo) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../dados/${arquivo}`, import.meta.url)), 'utf8'));
const HEX = /^#[0-9a-f]{6}$/;

test('FS 595: registros completos, hex válido e códigos únicos', () => {
  const cores = ler('fs595-cores.json');
  assert.ok(cores.length >= 600, `esperava ~650 cores, veio ${cores.length}`);
  for (const c of cores) {
    assert.match(c.code, /^\d{5}$/, `código ${c.code}`);
    assert.match(c.hex, HEX, `hex de ${c.code}`);
    assert.ok(['Gloss', 'Semi-gloss', 'Flat'].includes(c.finish), `acabamento de ${c.code}: ${c.finish}`);
    assert.equal(typeof c.name, 'string');
  }
  const codigos = cores.map((c) => c.code);
  assert.equal(new Set(codigos).size, codigos.length, 'códigos repetidos');
});

test('FS 595: o 1º dígito do código é coerente com o acabamento', () => {
  const porDigito = { 1: 'Gloss', 2: 'Semi-gloss', 3: 'Flat' };
  for (const c of ler('fs595-cores.json')) {
    assert.equal(c.finish, porDigito[c.code[0]], `${c.code} (${c.finish})`);
  }
});

test('catálogos existentes: hex válido', () => {
  for (const arquivo of ['acrilex-cores-oficial.json', 'tamiya-cores-oficial.json', 'revell-cores-oficial.json']) {
    for (const c of ler(arquivo)) if (c.hex) assert.match(c.hex, HEX, `${arquivo} ${c.code || c.sku}`);
  }
});

test('buildCatalogs: catálogos antigos inalterados e Tamiya dividido sem perda', async () => {
  const { buildCatalogs, catalogLines, normalizeTab } = await import('../js/data/catalogs.js');
  const golden = JSON.parse(readFileSync(fileURLToPath(new URL('./golden.json', import.meta.url)), 'utf8')).CATALOGS;
  const cat = buildCatalogs({
    ac: ler('acrilex-cores-oficial.json'),
    tm: ler('tamiya-cores-oficial.json'),
    rv: ler('revell-cores-oficial.json'),
    fs: ler('fs595-cores.json'),
    vl: [],
    mr: [],
    hb: [],
    ral: [],
    ak: [],
    am: [],
  });
  const semLinha = (lista) => lista.map(({ line, ...resto }) => resto);
  assert.deepEqual(cat.acrilex, golden.acrilex);
  // Revell: um catálogo com duas linhas == os dois catálogos originais (Aqua primeiro)
  assert.deepEqual(semLinha(cat.revell), [...golden.revellA, ...golden.revellE]);
  assert.deepEqual(catalogLines(cat.revell), ['Aqua Color', 'Email Color']);
  assert.equal(cat.revell.filter((p) => p.line === 'Aqua Color').length, golden.revellA.length);
  assert.equal(cat.revell.filter((p) => p.line === 'Email Color').length, golden.revellE.length);
  // Tamiya: duas linhas, sem perda em relação ao catálogo único original
  assert.deepEqual(catalogLines(cat.tamiya), ['Acrylic', 'Lacquer']);
  const acrilica = cat.tamiya.filter((p) => p.line === 'Acrylic');
  const lacquer = cat.tamiya.filter((p) => p.line === 'Lacquer');
  assert.equal(lacquer.length, 79);
  assert.equal(acrilica.length, 102);
  assert.ok(lacquer.every((p) => p.code.startsWith('LP-')));
  assert.ok(acrilica.every((p) => /^XF?-/.test(p.code)));
  const porCodigo = (a, b) => a.code.localeCompare(b.code);
  assert.deepEqual(semLinha(cat.tamiya).sort(porCodigo), [...golden.tamiya].sort(porCodigo));
  // migração das abas salvas por versões anteriores (uma aba por linha → uma aba por marca)
  assert.equal(normalizeTab('tamiya'), 'tamiya');
  assert.equal(normalizeTab('tamiyaA'), 'tamiya');
  assert.equal(normalizeTab('tamiyaL'), 'tamiya');
  assert.equal(normalizeTab('revellE'), 'revell');
  assert.equal(normalizeTab('revell'), 'revell');
  assert.equal(normalizeTab('inexistente'), 'tamiya');
});

test('Vallejo: registros completos, códigos únicos e linhas esperadas', () => {
  const cores = ler('vallejo-cores.json');
  const codigos = cores.map((c) => c.code);
  assert.equal(new Set(codigos).size, codigos.length, 'códigos repetidos');
  for (const c of cores) {
    assert.match(c.code, /^\d{2}\.\d{3}$/, c.code);
    assert.match(c.hex, HEX, `hex de ${c.code}`);
    assert.ok(c.name, `nome de ${c.code}`);
    assert.ok(c.line, `linha de ${c.code}`);
  }
  const porLinha = {};
  cores.forEach((c) => { porLinha[c.line] = (porLinha[c.line] || 0) + 1; });
  // Model Color tem 204 cores numeradas no catálogo impresso (1 a 204)
  assert.equal(porLinha['Model Color'], 204);
  for (const l of ['Model Air', 'Game Color', 'Xpress Color', 'Game Air', 'True Metallic Metal', 'Mecha Color', 'Premium Color']) {
    assert.ok(porLinha[l] > 0, `linha ${l} vazia`);
  }
  // amostras chapadas (sem degradê) como White e Black são exatas
  const white = cores.find((c) => c.code === '70.951');
  assert.equal(white.hex, '#ffffff');
  assert.ok(!white.degrade);
  assert.ok(cores.find((c) => c.code === '70.997').degrade, 'Silver (metálico) deve ser degradê');
});

test('buildCatalogs inclui Vallejo e catalogLines lista as linhas', async () => {
  const { buildCatalogs, catalogLines } = await import('../js/data/catalogs.js');
  const cat = buildCatalogs({
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
  assert.equal(cat.vallejo.length, ler('vallejo-cores.json').length);
  assert.deepEqual(catalogLines(cat.vallejo).slice(0, 2), ['Model Color', 'Liquid Metal']);
  assert.deepEqual(catalogLines(cat.fs595), []); // catálogos sem linhas
});

test('Mr. Hobby: registros completos, códigos únicos e contagens por linha', () => {
  const cores = ler('mrcolor-cores.json');
  const codigos = cores.map((c) => c.code);
  assert.equal(new Set(codigos).size, codigos.length, 'códigos repetidos');
  const porLinha = {};
  for (const c of cores) {
    assert.match(c.hex, HEX, `hex de ${c.code}`);
    assert.ok(c.name && c.name !== c.code, `nome de ${c.code}`);
    assert.doesNotMatch(c.name, /&#|&amp;/, `entidade HTML em ${c.code}`);
    porLinha[c.line] = (porLinha[c.line] || 0) + 1;
    // o prefixo do código acompanha a linha
    if (c.line === 'Aqueous Hobby Color') assert.match(c.code, /^H\d+$/);
    if (c.line === 'Acrysion') assert.match(c.code, /^N\d+$/);
  }
  assert.equal(porLinha['Aqueous Hobby Color'], 156);
  assert.equal(porLinha['Acrysion'], 90);
  assert.ok(porLinha['Mr. Color'] > 150);
  // cores básicas iguais nas três linhas (H1/N1/C1 = branco; H2/N2/C2 = preto)
  const por = Object.fromEntries(cores.map((c) => [c.code, c]));
  for (const p of ['C', 'H', 'N']) {
    assert.equal(por[p + '1'].hex, '#ffffff', p + '1');
    assert.equal(por[p + '2'].hex, '#231f20', p + '2');
  }
});

test('Humbrol: registros completos, códigos únicos e cores conhecidas', () => {
  const cores = ler('humbrol-cores.json');
  assert.ok(cores.length >= 140, `esperava ~147 cores, veio ${cores.length}`);
  const codigos = cores.map((c) => c.code);
  assert.equal(new Set(codigos).size, codigos.length, 'códigos repetidos');
  for (const c of cores) {
    assert.match(c.code, /^[0-9]+$/, c.code);
    assert.match(c.hex, HEX, `hex de ${c.code}`);
    assert.ok(c.name, `nome de ${c.code}`);
    assert.ok(!/varnish/i.test(c.name), `verniz não é cor: ${c.code}`);
  }
  const por = Object.fromEntries(cores.map((c) => [c.code, c]));
  assert.equal(por['33'].hex, '#000000'); // Black Matt
  assert.equal(por['34'].hex, '#ffffff'); // White Matt
  assert.equal(por['22'].hex, '#ffffff'); // White Gloss
});

test('RAL Classic: registros completos, códigos únicos e cores conhecidas', () => {
  const cores = ler('ral-cores.json');
  assert.ok(cores.length >= 213, `RAL Classic tem pelo menos 213 cores, veio ${cores.length}`);
  const codigos = cores.map((c) => c.code);
  assert.equal(new Set(codigos).size, codigos.length, 'códigos repetidos');
  for (const c of cores) {
    assert.match(c.code, /^[1-9]\d{3}$/, c.code);
    assert.match(c.hex, HEX, `hex de ${c.code}`);
    assert.ok(c.name, `nome de ${c.code}`);
  }
  const por = Object.fromEntries(cores.map((c) => [c.code, c]));
  assert.equal(por['9005'].name, 'Jet black');
  assert.equal(por['7016'].name, 'Anthracite grey');
  assert.equal(por['6005'].name, 'Moss green');
});

test('AK Real Colors: registros completos, seções e cores conhecidas', () => {
  const cores = ler('ak-cores.json');
  const codigos = cores.map((c) => c.code);
  assert.equal(new Set(codigos).size, codigos.length, 'códigos repetidos');
  const porSerie = {};
  for (const c of cores) {
    assert.match(c.code, /^RC\d{3}$/, c.code);
    assert.match(c.hex, HEX, `hex de ${c.code}`);
    assert.ok(c.name, `nome de ${c.code}`);
    assert.doesNotMatch(c.name, /varnish/i, `verniz não é cor: ${c.code}`);
    porSerie[c.series] = (porSerie[c.series] || 0) + 1;
  }
  // catálogo: Standard RC801-826 (menos 3 vernizes), Civil RC827-850, Military RC851-980
  assert.deepEqual(porSerie, { Standard: 23, Civil: 24, Military: 130 });
  const por = Object.fromEntries(cores.map((c) => [c.code, c]));
  assert.equal(por.RC806.hex, '#ffffff'); // Flat White
  assert.match(por.RC810.name, /RAL 3000/);
});

test('AMMO: registros completos, linhas esperadas e equivalências', () => {
  const cores = ler('ammo-cores.json');
  const codigos = cores.map((c) => c.code);
  assert.equal(new Set(codigos).size, codigos.length, 'códigos repetidos');
  const porLinha = {};
  for (const c of cores) {
    assert.match(c.hex, HEX, `hex de ${c.code}`);
    assert.ok(c.name, `nome de ${c.code}`);
    assert.ok(!Object.keys(c).some((k) => k.startsWith('_')), 'campos de depuração no JSON');
    porLinha[c.line] = (porLinha[c.line] || 0) + 1;
  }
  assert.deepEqual(porLinha, { 'Acrylic Colors': 236, ATOM: 181 });
  const por = Object.fromEntries(cores.map((c) => [c.code, c]));
  assert.equal(por['A.MIG-0047'].hex, '#ffffff'); // Satin White
  assert.equal(por['A.MIG-0046'].hex, '#231f20'); // Matt Black
  assert.equal(por['A.MIG-0046'].equiv.tamiya, 'XF-1');
  assert.equal(por['A.MIG-0046'].equiv.mrColor, 'C-33');
  assert.equal(por['A.MIG-0001'].equiv.atom, 'ATOM-20067');
});
