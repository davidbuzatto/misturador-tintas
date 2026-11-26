import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCatalogs } from '../js/data/catalogs.js';
import { acabamentoDe, contarPorTipo, filtrarCatalogo, ACABAMENTOS } from '../js/data/acabamento.js';

const r = (f) => JSON.parse(fs.readFileSync(new URL(`../dados/${f}`, import.meta.url), 'utf8'));
const c = buildCatalogs({
  ac: r('acrilex-cores-oficial.json'), tm: r('tamiya-cores-oficial.json'), rv: r('revell-cores-oficial.json'),
  fs: r('fs595-cores.json'), vl: r('vallejo-cores.json'), mr: r('mrcolor-cores.json'), hb: r('humbrol-cores.json'),
  ral: r('ral-cores.json'), ak: r('ak-cores.json'), am: r('ammo-cores.json'), sc: r('scale75-cores.json'), tc: r('tomcolors-cores.json'), px: r('phoenix-cores.json'), tl: r('talento-cores.json'), al: r('acrilex-linhas-cores.json'), ar: r('artesania-cores.json'), oc: r('occre-cores.json'),
});
const tipo = (aba, code) => acabamentoDe(aba, c[aba].find((p) => p.code === code)).tipo;

test('Tamiya: metálicas, transparentes e prefixo X-/XF-', () => {
  assert.equal(tipo('tamiya', 'XF-16'), 'metallic'); // Flat Aluminium
  assert.equal(tipo('tamiya', 'X-11'), 'metallic');
  assert.equal(tipo('tamiya', 'X-23'), 'clear');
  assert.equal(tipo('tamiya', 'X-2'), 'gloss');
  assert.equal(tipo('tamiya', 'XF-1'), 'matte');
});

test('cores comuns com palavra de metal não viram metálicas', () => {
  assert.notEqual(tipo('ak', 'RC931'), 'metallic'); // Bronze Green
  assert.notEqual(tipo('ak', 'RC979'), 'metallic'); // Steel Grey
  assert.equal(tipo('ak', 'RC820'), 'metallic'); // Aluminium
  assert.equal(tipo('humbrol', '56'), 'metallic');
  assert.equal(tipo('humbrol', '75'), 'matte'); // Bronze Green
});

test('FS 595 e RAL usam só o acabamento informado, nunca o nome', () => {
  assert.equal(c.ral.some((p) => acabamentoDe('ral', p).tipo), false);
  assert.ok(c.fs595.every((p) => ['gloss', 'satin', 'matte'].includes(acabamentoDe('fs595', p).tipo)));
});

test('Vallejo: linhas metálicas e séries de efeito', () => {
  const liquid = c.vallejo.filter((p) => p.line === 'Liquid Metal');
  assert.ok(liquid.length && liquid.every((p) => acabamentoDe('vallejo', p).tipo === 'metallic'));
  assert.ok(c.vallejo.some((p) => p.series === 'Wash' && acabamentoDe('vallejo', p).tipo === 'special'));
});

test('toda tinta tem acabamento válido ou nulo', () => {
  for (const [aba, lista] of Object.entries(c)) {
    for (const p of lista) {
      const { tipo: k } = acabamentoDe(aba, p);
      assert.ok(k === null || ACABAMENTOS.includes(k), `${aba} ${p.code}`);
    }
  }
});

test('filtrarCatalogo e contarPorTipo', () => {
  const metais = filtrarCatalogo(c.tamiya, 'tamiya', { tipo: 'metallic' });
  assert.ok(metais.length > 20);
  assert.equal(contarPorTipo(c.tamiya, 'tamiya').metallic, metais.length);
  assert.deepEqual(filtrarCatalogo(c.tamiya, 'tamiya', { q: 'x-11' }).map((p) => p.code), ['X-11']);
  assert.ok(filtrarCatalogo(c.vallejo, 'vallejo', { linha: 'Model Air' }).every((p) => p.line === 'Model Air'));
  assert.equal(filtrarCatalogo(c.tamiya, 'tamiya').length, c.tamiya.length);
});

test('Acrilex: todas as 95 cores são fosca, declarada pelo catálogo (não inferida)', () => {
  const fosca = c.acrilex.filter((p) => p.line === 'Fosca');
  assert.equal(fosca.length, 95);
  for (const p of fosca) assert.deepEqual(acabamentoDe('acrilex', p), { tipo: 'matte', inferido: false }, p.code);
  assert.deepEqual(contarPorTipo(fosca, 'acrilex'), { matte: 95 });
});

test('Revell: o acabamento informado pelo catálogo chega a todas as cores', () => {
  assert.equal(c.revell.length, 171);
  assert.ok(c.revell.every((p) => p.finish), 'cor sem acabamento');
  assert.deepEqual(contarPorTipo(c.revell, 'revell'), { gloss: 26, matte: 86, satin: 35, metallic: 14, clear: 10 }); // Silk = acetinado; os "Clear" (nome) viram transparente mesmo declarados Gloss/Matte
  assert.deepEqual(acabamentoDe('revell', c.revell.find((p) => p.code === '36104')), { tipo: 'gloss', inferido: false });
});
