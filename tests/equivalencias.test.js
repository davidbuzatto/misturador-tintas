/**
 * Testes da busca de cores mais próximas (ΔE00) e das equivalências declaradas pelo fabricante.
 * Roda com: node --test tests/*.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { buildCatalogs } from '../js/data/catalogs.js';
import { buildLinks, normasDe } from '../js/data/equivalences.js';
import { deToPaint, nearest } from '../js/color/nearest.js';

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
  px: ler('phoenix-cores.json'), tl: ler('talento-cores.json'), al: ler('acrilex-linhas-cores.json'), ar: ler('artesania-cores.json'), oc: ler('occre-cores.json'),
});

test('nearest: a própria cor é a mais próxima (ΔE 0) e a lista vem ordenada', () => {
  const p = catalogos.fs595[100];
  const [primeira, ...resto] = nearest(catalogos.fs595, p.hex, 4);
  assert.equal(primeira.de, 0);
  assert.equal(primeira.paint.hex, p.hex);
  assert.equal(resto.length, 3);
  for (let i = 1; i < resto.length; i++) assert.ok(resto[i].de >= resto[i - 1].de, 'fora de ordem');
  assert.ok(resto[0].de >= primeira.de);
});

test('nearest: excluir ignora a tinta de origem', () => {
  const p = catalogos.ral[10];
  const [melhor] = nearest(catalogos.ral, p.hex, 1, (q) => q === p);
  assert.notEqual(melhor.paint, p);
  assert.ok(melhor.de >= 0);
});

test('nearest: resultado confere com o cálculo direto de ΔE00', () => {
  const hex = '#6f7d3a';
  const [melhor] = nearest(catalogos.humbrol, hex, 1);
  const direto = Math.min(...catalogos.humbrol.map((p) => deToPaint(p, hex)));
  assert.equal(melhor.de, direto);
});

test('nearest: menos tintas que n devolve todas', () => {
  const pouco = catalogos.ral.slice(0, 2);
  assert.equal(nearest(pouco, '#ffffff', 5).length, 2);
});

test('equivalências declaradas pela AMMO: resolvidas e nos dois sentidos', () => {
  const links = buildLinks(catalogos);
  assert.ok(links.total > 800, `esperava ~1000 ligações, veio ${links.total}`);
  const de = (aba, codigo) => links.declaradasPara(aba, codigo).map((x) => `${x.aba}:${x.paint.code}`);

  // A.MIG-0046 Matt Black → Tamiya XF-1, Mr. Color C-33, Hobby Color H-12, Model Color 70.950, Model Air 71.057, ATOM-20163
  const matt = de('ammo', 'A.MIG-0046');
  for (const esperado of ['tamiya:XF-1', 'mrhobby:C33', 'mrhobby:H12', 'vallejo:70.950', 'vallejo:71.057', 'ammo:ATOM-20163']) {
    assert.ok(matt.includes(esperado), `faltou ${esperado} em ${matt.join(', ')}`);
  }
  // sentido inverso: de Tamiya XF-1 e de Mr. Color C33 chega-se à AMMO
  assert.ok(de('tamiya', 'XF-1').includes('ammo:A.MIG-0046'));
  assert.ok(de('mrhobby', 'C33').includes('ammo:A.MIG-0046'));
  assert.ok(de('vallejo', '70.950').includes('ammo:A.MIG-0046'));
  // quem não tem equivalência declarada devolve lista vazia
  assert.deepEqual(de('ral', '7016'), []);
});

test('equivalências declaradas: códigos com várias opções ("H-47 / H-460") são separados', () => {
  const links = buildLinks(catalogos);
  const rotbraun = links.declaradasPara('ammo', 'ATOM-20046').map((x) => `${x.aba}:${x.paint.code}`);
  assert.ok(rotbraun.includes('mrhobby:H47'), rotbraun.join(', '));
  assert.ok(rotbraun.includes('mrhobby:C41'));
});

test('normasDe: extrai RAL e FS e ignora outras normas', () => {
  assert.deepEqual(normasDe('FS34082-RAL 6003'), [{ aba: 'ral', codigo: '6003' }, { aba: 'fs595', codigo: '34082' }]);
  assert.deepEqual(normasDe('RAL 9005'), [{ aba: 'ral', codigo: '9005' }]);
  assert.deepEqual(normasDe('FS 36081'), [{ aba: 'fs595', codigo: '36081' }]);
  assert.deepEqual(normasDe('BS 381C/637'), []);
  assert.deepEqual(normasDe(''), []);
});

test('equivalências da AK: Tamiya, Mr. Hobby, Vallejo e norma RAL, com a fonte "AK"', () => {
  const links = buildLinks(catalogos);
  const rc804 = links.declaradasPara('ak', 'RC804');
  const por = Object.fromEntries(rc804.map((x) => [`${x.aba}:${x.paint.code}`, x.fontes]));
  for (const esperado of ['tamiya:XF-1', 'mrhobby:C33', 'mrhobby:H12', 'vallejo:71.057', 'ral:9005']) {
    assert.ok(por[esperado], `faltou ${esperado} em ${Object.keys(por).join(', ')}`);
    assert.ok(por[esperado].includes('AK'), `${esperado} deveria citar a AK`);
  }
  // sentido inverso e fontes combinadas: Tamiya XF-1 é citado pela AK (RC804) e pela AMMO (A.MIG-0046)
  const deXf1 = Object.fromEntries(links.declaradasPara('tamiya', 'XF-1').map((x) => [`${x.aba}:${x.paint.code}`, x.fontes]));
  assert.deepEqual(deXf1['ak:RC804'], ['AK']);
  assert.deepEqual(deXf1['ammo:A.MIG-0046'], ['AMMO']);
  // a norma liga cores de marcas diferentes ao mesmo RAL
  const doRal = links.declaradasPara('ral', '9005').map((x) => `${x.aba}:${x.paint.code}`);
  assert.ok(doRal.includes('ak:RC804'));
  assert.ok(doRal.some((c) => c.startsWith('ammo:')), 'a AMMO também cita RAL 9005');
});

test('equivalências da AK: dados extraídos do PDF', () => {
  const ak = Object.fromEntries(catalogos.ak.map((c) => [c.code, c]));
  assert.equal(ak.RC804.ref, 'RAL 9005');
  assert.equal(ak.RC804.equiv.tamiya, 'XF-1');
  assert.equal(ak.RC804.equiv.mrHobby, 'C33 / H12');
  assert.equal(ak.RC837.equiv.zeroPaints, 'ZP-1033'); // seção Civil (layout diferente)
  const comEquiv = catalogos.ak.filter((c) => c.equiv).length;
  assert.ok(comEquiv >= 160, `esperava ~167 cores com equivalência, veio ${comEquiv}`);
});
