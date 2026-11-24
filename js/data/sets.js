/**
 * @module data/sets
 * Linhas de tintas que podem ser usadas como ingredientes de uma receita.
 *
 * Cada receita usa **uma linha só** (um "conjunto"): tintas de químicas diferentes (acrílica, lacquer,
 * esmalte) não se misturam na bancada, e misturar marcas viraria uma lista enorme de opções.
 *
 * Um conjunto é o catálogo (ou uma linha dele) menos as tintas que o modelo de mistura não representa:
 * metálicas, perolizadas, translúcidas e fluorescentes. Para a sugestão automática, cada conjunto tem
 * "âncoras": as tintas mais próximas de branco, preto e das primárias, que entram sempre nas combinações
 * testadas.
 */

import { fitHex } from '../color/spectral.js';
import { nearest } from '../color/nearest.js';

/** Conjunto usado quando nada (ou algo desconhecido) foi escolhido. */
export const DEFAULT_SET = 'acrilex';

/**
 * Definição dos conjuntos. `marca`/`rotulo` aparecem no seletor; `quimica` é uma chave de texto
 * ("acrilica", "lacquer", "esmalte", "oleo"); `tab`/`line` apontam para o catálogo (e a linha dentro dele).
 * `anchors` fixa as âncoras (códigos); sem ela, são escolhidas automaticamente.
 */
export const INGREDIENT_SETS = [
  { id: 'acrilex', marca: 'Acrilex', rotulo: 'Matte', quimica: 'acrilica', tab: 'acrilex', anchors: ['519', '520', '505', '559', '555', '549', '504', '503'] },
  { id: 'tamiya-acrilica', marca: 'Tamiya', rotulo: 'Acrylic', quimica: 'acrilica', tab: 'tamiya', line: 'Acrylic' },
  { id: 'tamiya-lacquer', marca: 'Tamiya', rotulo: 'Lacquer', quimica: 'lacquer', tab: 'tamiya', line: 'Lacquer' },
  { id: 'revell-aqua', marca: 'Revell', rotulo: 'Aqua Color', quimica: 'acrilica', tab: 'revell', line: 'Aqua Color' },
  { id: 'revell-email', marca: 'Revell', rotulo: 'Email Color', quimica: 'esmalte', tab: 'revell', line: 'Email Color' },
  { id: 'vallejo-model-color', marca: 'Vallejo', rotulo: 'Model Color', quimica: 'acrilica', tab: 'vallejo', line: 'Model Color' },
  { id: 'vallejo-model-air', marca: 'Vallejo', rotulo: 'Model Air', quimica: 'acrilica', tab: 'vallejo', line: 'Model Air' },
  { id: 'vallejo-game-color', marca: 'Vallejo', rotulo: 'Game Color', quimica: 'acrilica', tab: 'vallejo', line: 'Game Color' },
  { id: 'vallejo-game-air', marca: 'Vallejo', rotulo: 'Game Air', quimica: 'acrilica', tab: 'vallejo', line: 'Game Air' },
  { id: 'vallejo-mecha-color', marca: 'Vallejo', rotulo: 'Mecha Color', quimica: 'acrilica', tab: 'vallejo', line: 'Mecha Color' },
  { id: 'mrhobby-mr-color', marca: 'Mr. Hobby', rotulo: 'Mr. Color', quimica: 'lacquer', tab: 'mrhobby', line: 'Mr. Color' },
  { id: 'mrhobby-aqueous', marca: 'Mr. Hobby', rotulo: 'Aqueous Hobby Color', quimica: 'acrilica', tab: 'mrhobby', line: 'Aqueous Hobby Color' },
  { id: 'mrhobby-acrysion', marca: 'Mr. Hobby', rotulo: 'Acrysion', quimica: 'acrilica', tab: 'mrhobby', line: 'Acrysion' },
  { id: 'humbrol', marca: 'Humbrol', rotulo: 'Acrylic', quimica: 'acrilica', tab: 'humbrol' },
  { id: 'ak', marca: 'AK', rotulo: 'Real Colors', quimica: 'lacquer', tab: 'ak' },
  { id: 'ammo-acrylic', marca: 'AMMO', rotulo: 'Acrylic Colors', quimica: 'acrilica', tab: 'ammo', line: 'Acrylic Colors' },
  { id: 'ammo-atom', marca: 'AMMO', rotulo: 'ATOM', quimica: 'acrilica', tab: 'ammo', line: 'ATOM' },
  { id: 'scale75-scalecolor', marca: 'Scale75', rotulo: 'Scalecolor', quimica: 'acrilica', tab: 'scale75', line: 'Scalecolor' },
  { id: 'scale75-fantasy', marca: 'Scale75', rotulo: 'Fantasy & Games', quimica: 'acrilica', tab: 'scale75', line: 'Fantasy & Games' },
  { id: 'scale75-warfront', marca: 'Scale75', rotulo: 'Warfront', quimica: 'acrilica', tab: 'scale75', line: 'Warfront' },
  { id: 'scale75-artist', marca: 'Scale75', rotulo: 'Scalecolor Artist', quimica: 'acrilica', tab: 'scale75', line: 'Scalecolor Artist' },
  { id: 'scale75-flow', marca: 'Scale75', rotulo: 'Flow', quimica: 'oleo', tab: 'scale75', line: 'Flow' },
  { id: 'tomcolors-acrylic', marca: 'Tom Colors', rotulo: 'Acrylic Colors', quimica: 'acrilica', tab: 'tomcolors', line: 'Acrylic Colors' },
  { id: 'tomcolors-up', marca: 'Tom Colors', rotulo: 'UP', quimica: 'acrilica', tab: 'tomcolors', line: 'UP' },
];

/** Séries (campo `series`) cujas tintas o modelo de mistura não representa. */
const SERIE_NAO_MISTURAVEL = /metal|wash|special fx|fluo|ink|pearl|candy|primer/i;
/** Nomes que indicam tinta metálica, translúcida ou fluorescente. */
const NOME_NAO_MISTURAVEL = /\bmetall?ic\b|metaliz|^clear\b|\btransparent|\bfluorescent\b|holographic/i;

/**
 * Indica se a tinta pode entrar nos cálculos. O modelo Kubelka-Munk descreve pigmentos opacos e foscos;
 * não vale para brilho metálico, pérola, translucidez ou fluorescência.
 * @param {import('./catalogs.js').CatalogPaint} p tinta do catálogo.
 * @returns {boolean}
 */
export function misturavel(p) {
  if (p.degrade) return false;
  if (p.aprox) return false; // cor aproximada (frasco ou amostra diluída): não serve de base para calcular misturas
  if (p.finish === 'Metallic' || p.finish === 'Pearl') return false;
  if (p.series && SERIE_NAO_MISTURAVEL.test(p.series)) return false;
  return !NOME_NAO_MISTURAVEL.test(p.name);
}

/** Cores de referência para escolher as âncoras automáticas (branco, preto e primárias). */
const REFERENCIAS_ANCORA = ['#ffffff', '#1e1e1b', '#f9b30b', '#f2f02d', '#d42428', '#c12e83', '#4172bc', '#5fbae4'];

/**
 * Códigos das tintas mais próximas das cores de referência (sem repetir).
 * @param {import('./catalogs.js').CatalogPaint[]} paints tintas do conjunto.
 * @returns {Set<string>}
 */
function ancorasAutomaticas(paints) {
  const codigos = new Set();
  for (const hex of REFERENCIAS_ANCORA) {
    const [melhor] = nearest(paints, hex, 1);
    if (melhor) codigos.add(melhor.paint.code);
  }
  return codigos;
}

/**
 * @typedef {Object} IngredientSet
 * @property {string} id
 * @property {string} marca
 * @property {string} rotulo
 * @property {string} quimica
 * @property {string} tab  catálogo de origem.
 * @property {import('./catalogs.js').CatalogPaint[]} paints  tintas utilizáveis.
 * @property {Map<string, import('./catalogs.js').CatalogPaint>} porCodigo
 * @property {Set<string>} anchors  códigos das tintas âncora.
 * @property {number} excluidas  quantas tintas do catálogo ficaram de fora (metálicas etc.).
 */

/**
 * Monta os conjuntos de ingredientes a partir dos catálogos.
 * @param {Object<string, import('./catalogs.js').CatalogPaint[]>} catalogs catálogos por aba.
 */
export function buildSets(catalogs) {
  /** @type {IngredientSet[]} */
  const list = INGREDIENT_SETS.map((def) => {
    const doCatalogo = (catalogs[def.tab] || []).filter((p) => !def.line || p.line === def.line);
    const paints = doCatalogo.filter(misturavel);
    return {
      ...def,
      paints,
      porCodigo: new Map(paints.map((p) => [p.code, p])),
      anchors: def.anchors ? new Set(def.anchors) : ancorasAutomaticas(paints),
      excluidas: doCatalogo.length - paints.length,
    };
  });
  const byId = new Map(list.map((s) => [s.id, s]));

  return {
    list,
    byId,
    /**
     * Conjunto pelo id (o padrão, se o id for desconhecido).
     * @param {string} id
     * @returns {IngredientSet}
     */
    get(id) {
      return byId.get(id) || byId.get(DEFAULT_SET);
    },
    /**
     * Garante que as tintas do conjunto tenham o ajuste espectral (`fit`) calculado. É barato
     * (~0,5 a 1,5 ms por tinta, com cache), então é feito ao escolher a linha.
     * @param {string} id
     * @returns {IngredientSet}
     */
    prepare(id) {
      const s = this.get(id);
      for (const p of s.paints) if (!p.fit) p.fit = fitHex(p.hex);
      return s;
    },
    /**
     * Tinta de um conjunto pelo código, com `fit` pronto (ou `undefined`).
     * @param {string} id id do conjunto.
     * @param {string} code código da tinta.
     */
    paint(id, code) {
      const p = this.get(id).porCodigo.get(code);
      if (p && !p.fit) p.fit = fitHex(p.hex);
      return p;
    },
  };
}
