/**
 * Testes dos auxiliares de interface que não dependem de um navegador (usam um elemento falso).
 * Roda com: node --test tests/*.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { ativavel, deText, esc } from '../js/ui/dom.js';
import { setLang } from '../js/i18n/index.js';

/** Elemento mínimo que guarda os ouvintes de evento e os atributos. */
function elementoFalso() {
  const ouvintes = {};
  const atributos = {};
  return {
    tabIndex: -1,
    ouvintes,
    atributos,
    setAttribute: (k, v) => { atributos[k] = v; },
    addEventListener: (tipo, fn) => { (ouvintes[tipo] ||= []).push(fn); },
    dispara(tipo, evento = {}) {
      (ouvintes[tipo] || []).forEach((fn) => fn({ preventDefault() {}, ...evento }));
    },
  };
}

test('ativavel: o elemento vira botão e responde ao clique do mouse', () => {
  const el = elementoFalso();
  let cliques = 0;
  ativavel(el, () => cliques++);
  assert.equal(el.tabIndex, 0, 'precisa ser focável por Tab');
  assert.equal(el.atributos.role, 'button');
  assert.ok(el.ouvintes.click?.length === 1, 'sem ouvinte de clique (o mouse deixaria de funcionar)');
  el.dispara('click');
  assert.equal(cliques, 1);
});

test('ativavel: Enter e Espaço ativam; outras teclas não; T aciona a ação alternativa', () => {
  const el = elementoFalso();
  let principal = 0;
  let alternativa = 0;
  ativavel(el, () => principal++, () => alternativa++);
  el.dispara('keydown', { key: 'Enter' });
  el.dispara('keydown', { key: ' ' });
  assert.equal(principal, 2);
  el.dispara('keydown', { key: 'a' });
  el.dispara('keydown', { key: 'Tab' });
  assert.equal(principal, 2);
  assert.equal(alternativa, 0);
  el.dispara('keydown', { key: 't' });
  el.dispara('keydown', { key: 'T' });
  assert.equal(alternativa, 2);
  assert.equal(principal, 2);
});

test('ativavel: sem ação alternativa a tecla T não faz nada', () => {
  const el = elementoFalso();
  let n = 0;
  ativavel(el, () => n++);
  el.dispara('keydown', { key: 't' });
  assert.equal(n, 0);
});

test('esc escapa HTML e deText descreve o ΔE nos dois idiomas', () => {
  // escapa &, < e " (o > não precisa)
  assert.equal(esc('<a href="x">&'), '&lt;a href=&quot;x&quot;>&amp;');
  setLang('pt-BR');
  assert.equal(deText(0.5), 'imperceptível');
  assert.equal(deText(1.5), 'só lado a lado');
  assert.equal(deText(3), 'muito parecida');
  assert.equal(deText(4), 'parecida');
  assert.equal(deText(7), 'diferente');
  assert.equal(deText(20), 'bem diferente');
  setLang('en');
  assert.equal(deText(0.5), 'imperceptible');
  assert.equal(deText(20), 'very different');
  setLang('pt-BR');
});

test('guia passo a passo: o exemplo (Tamiya XF-18) existe nos dados e rende uma boa receita com a Acrilex', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { buildCatalogs } = await import('../js/data/catalogs.js');
  const { buildSets } = await import('../js/data/sets.js');
  const { suggest } = await import('../js/color/suggest.js');
  const { EXEMPLO } = await import('../js/ui/help.js');
  const ler = (f) => JSON.parse(readFileSync(fileURLToPath(new URL(`../dados/${f}`, import.meta.url)), 'utf8'));
  const cat = buildCatalogs({
    ac: ler('acrilex-cores-oficial.json'), tm: ler('tamiya-cores-oficial.json'), rv: ler('revell-cores-oficial.json'),
    fs: ler('fs595-cores.json'), vl: ler('vallejo-cores.json'), mr: ler('mrcolor-cores.json'), hb: ler('humbrol-cores.json'),
    ral: ler('ral-cores.json'), ak: ler('ak-cores.json'), am: ler('ammo-cores.json'), sc: ler('scale75-cores.json'), tc: ler('tomcolors-cores.json'), px: ler('phoenix-cores.json'), tl: ler('talento-cores.json'), al: ler('acrilex-linhas-cores.json'),
  });
  const alvo = cat[EXEMPLO.tab].find((p) => p.code === EXEMPLO.code);
  assert.ok(alvo, 'a cor do exemplo sumiu dos dados');
  assert.equal(alvo.name, 'Medium Blue');
  assert.equal(alvo.line, 'Acrylic'); // o texto do passo 2 manda deixar a linha "Acrílica"
  const set = buildSets(cat).prepare('acrilex'); // linha padrão do exemplo
  const P = set.paints.map((p) => ({ code: p.code, fit: p.fit, anchor: set.anchors.has(p.code) }));
  const receitas = suggest(P, alvo.hex, 3);
  assert.ok(receitas.length >= 2, 'o passo 3 promete receitas de várias tintas');
  assert.ok(receitas.some((r) => r.idx.length >= 2 && r.de < 2), 'esperava uma receita de 2+ tintas com ΔE < 2');
});

test('ordenarSugestoes: abaixo de ΔE 1 vence a mais simples; acima, o menor ΔE (empate: menos tintas)', async () => {
  const { ordenarSugestoes, LIMITE_IMPERCEPTIVEL } = await import('../js/color/suggest.js');
  const s = (de, ...idx) => ({ idx, ws: idx.map(() => 1 / idx.length), de });
  const rotulo = (lista) => ordenarSugestoes(lista).map((r) => `${r.idx.length}@${r.de}`);
  assert.equal(LIMITE_IMPERCEPTIVEL, 1);

  // caso do exemplo da XF-18 (Acrilex): 1 tinta ΔE 7,44; 2 tintas ΔE 0,44; 3 tintas ΔE 0,15
  assert.deepEqual(rotulo([s(7.44, 0), s(0.44, 0, 1), s(0.15, 0, 1, 2)]), ['2@0.44', '3@0.15', '1@7.44']);

  // abaixo de 1: menos tintas primeiro, mesmo com ΔE maior (0,65 de 2 tintas antes de 0,07 de 4)
  assert.deepEqual(rotulo([s(0.07, 0, 1, 2, 3), s(0.65, 0, 1), s(0.17, 0, 1, 2), s(6.13, 0)]), ['2@0.65', '3@0.17', '4@0.07', '1@6.13']);
  // mesmo número de tintas e ambas imperceptíveis: menor ΔE
  assert.deepEqual(rotulo([s(0.6, 0, 1), s(0.2, 0, 1)]), ['2@0.2', '2@0.6']);
  // uma imperceptível de muitas tintas ainda vence qualquer uma com ΔE a partir de 1
  assert.deepEqual(rotulo([s(1, 0), s(0.99, 0, 1, 2, 3)]), ['4@0.99', '1@1']);

  // a partir de 1: menor ΔE primeiro, mesmo com mais tintas
  assert.deepEqual(rotulo([s(2.51, 0), s(2.4, 0, 1, 2)]), ['3@2.4', '1@2.51']);
  // empate nas duas casas (2,50 e 2,50): menos tintas primeiro, em qualquer ordem de entrada
  assert.deepEqual(rotulo([s(2.496, 0, 1, 2), s(2.504, 0, 1)]), ['2@2.504', '3@2.496']);
  assert.deepEqual(rotulo([s(2.504, 0, 1), s(2.496, 0, 1, 2)]), ['2@2.504', '3@2.496']);

  // não altera a lista recebida; lista vazia
  const entrada = [s(7.44, 0), s(0.44, 0, 1)];
  const copia = JSON.stringify(entrada);
  ordenarSugestoes(entrada);
  assert.equal(JSON.stringify(entrada), copia);
  assert.deepEqual(ordenarSugestoes([]), []);
});

test('primeira execução: sem mistura, sem receitas e com a Tamiya X-2 White como alvo', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { ALVO_PADRAO, alvoPadrao, buildCatalogs } = await import('../js/data/catalogs.js');
  const { createStore, STORAGE_KEY } = await import('../js/state/store.js');
  const ler = (f) => JSON.parse(readFileSync(fileURLToPath(new URL(`../dados/${f}`, import.meta.url)), 'utf8'));

  // no Node não há localStorage: o estado vem do padrão (o mesmo que o navegador usa com o armazenamento limpo)
  const { state, save } = createStore();
  assert.deepEqual(state.ing, [], 'a primeira execução não traz mistura pronta');
  assert.deepEqual(state.hist, [], 'nem receitas');
  assert.deepEqual(state.own, {});
  assert.equal(state.ingSet, 'acrilex');
  assert.equal(state.target, null, 'o alvo padrão é definido pelo main.js, com os catálogos já carregados');
  assert.ok(!('helpOpen' in state), 'o guia não guarda estado: abre sempre fechado');
  assert.doesNotThrow(() => save());
  assert.equal(typeof STORAGE_KEY, 'string');

  // alvo padrão: a X-2 é o branco da Tamiya (a X-1 é o preto)
  assert.deepEqual(ALVO_PADRAO, { tab: 'tamiya', code: 'X-2' });
  const cat = buildCatalogs({
    ac: ler('acrilex-cores-oficial.json'), tm: ler('tamiya-cores-oficial.json'), rv: ler('revell-cores-oficial.json'),
    fs: ler('fs595-cores.json'), vl: [], mr: [], hb: [], ral: [], ak: [], am: [],
  });
  const alvo = alvoPadrao(cat);
  assert.equal(alvo.hex, '#ffffff');
  assert.deepEqual(alvo.ref, { tab: 'tamiya', code: 'X-2' });
  assert.match(alvo.label, /X-2 White/);
  // se a tinta sumir dos dados, cai num branco livre (sem quebrar a abertura)
  assert.equal(alvoPadrao({ tamiya: [] }).hex, '#ffffff');
});

test('resetStorage: remove só a chave do app e não explode se o armazenamento falhar', async () => {
  const { resetStorage, STORAGE_KEY } = await import('../js/state/store.js');
  const removidas = [];
  assert.equal(resetStorage({ removeItem: (k) => removidas.push(k) }), true);
  assert.deepEqual(removidas, [STORAGE_KEY]);
  const quebrado = { removeItem() { throw new Error('bloqueado'); } };
  assert.equal(resetStorage(quebrado), false);
  assert.equal(resetStorage(undefined), false); // sem localStorage (Node): só devolve false
});
