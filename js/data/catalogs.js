/**
 * @module data/catalogs
 * Carrega os catálogos de tintas (`dados/*.json`) e os normaliza para o formato
 * usado pela aplicação.
 *
 * Formato normalizado de uma tinta de catálogo:
 *   { code: string, name: string, hex: "#rrggbb" }
 */

import { lineName, t } from '../i18n/index.js';

/**
 * @typedef {Object} CatalogPaint
 * @property {string} code  código/SKU da tinta.
 * @property {string} name  nome de exibição.
 * @property {string} hex   cor aproximada "#rrggbb".
 * @property {string} [line]    linha de produtos (ex.: "Model Color"); só em catálogos com várias linhas.
 * @property {string} [series]  série dentro da linha (ex.: "Wash"); vazio na série principal.
 * @property {string} [ref]  referência de norma citada pelo catálogo (ex.: "RAL 9005", "FS 36081").
 * @property {Object<string,string>} [equiv]  equivalências em outras marcas informadas pelo catálogo
 *           (ex.: `{tamiya: "XF-1", modelColor: "70.950"}`), quando existem.
 * @property {string} [finish]  acabamento (ex.: "Gloss", "Matte"), quando o catálogo informa.
 * @property {boolean} [degrade]  amostra em degradê/metálica: a cor é só uma aproximação.
 *  * @property {'frasco'|'diluida'|'foto'|'estimada'} [aprox]  cor aproximada por outro método: `frasco` (lida do líquido na foto do
 *           frasco), `diluida` (a amostra da marca é semitransparente), `foto` (lida de uma cabeça pintada na foto) ou
 *           `estimada` (calculada a partir de outras fontes). Essas tintas aparecem marcadas como aproximadas e não
 *           entram como ingredientes.
 * @property {import('../color/spectral.js').PaintFit} [fit]  ajuste espectral
 *           (presente apenas nas tintas do catálogo de ingredientes).
 */

/**
 * Catálogos disponíveis como cor-alvo, na ordem em que as abas aparecem.
 * `free` não é um catálogo: é a aba de cor livre (seletor de cor).
 */
export const TARGET_TABS = ['tamiya', 'revell', 'fs595', 'vallejo', 'mrhobby', 'humbrol', 'ral', 'ak', 'ammo', 'scale75', 'tomcolors', 'phoenix', 'talento', 'acrilex', 'free'];

/**
 * Abas de versões anteriores → aba equivalente atual (Tamiya e Revell já tiveram uma aba por
 * linha). Usado para restaurar a aba e a origem do alvo salvos no `localStorage`.
 */
const LEGACY_TABS = { tamiyaA: 'tamiya', tamiyaL: 'tamiya', revellA: 'revell', revellE: 'revell' };

/**
 * Garante que a aba salva exista: converte nomes antigos e, se desconhecida,
 * volta para a primeira aba.
 * @param {string} tab aba salva.
 * @returns {string} aba válida.
 */
export function normalizeTab(tab) {
  if (TARGET_TABS.includes(tab)) return tab;
  return LEGACY_TABS[tab] || TARGET_TABS[0];
}

/** Nome de exibição de cada catálogo (e da aba de cor livre). */
export const CATALOG_NAMES = {
  tamiya: 'Tamiya',
  revell: 'Revell',
  fs595: 'FS 595',
  vallejo: 'Vallejo',
  mrhobby: 'Mr. Hobby',
  humbrol: 'Humbrol',
  ral: 'RAL',
  ak: 'AK',
  ammo: 'AMMO',
  scale75: 'Scale75',
  tomcolors: 'Tom Colors',
  phoenix: 'Phoenix',
  talento: 'Talento',
  acrilex: 'Acrilex',
};


/** Pasta dos JSONs, relativa a este módulo (funciona em qualquer hospedagem). */
const DATA_DIR = new URL('../../dados/', import.meta.url);

/** Lê e interpreta um JSON da pasta `dados/`. */
async function loadJson(file) {
  const res = await fetch(new URL(file, DATA_DIR));
  if (!res.ok) throw new Error(`Falha ao carregar ${file}: HTTP ${res.status}`);
  return res.json();
}

/**
 * Nome de exibição de uma tinta Revell: "<acabamento> <nome>" (ex.: "Matte Black"),
 * exceto transparentes que já trazem "Clear" no nome, com sufixo "(RAL xxxx)" quando existir.
 * @param {{sku:string,name:string,finish:string,ral?:string|null}} d registro bruto da Revell.
 * @returns {string}
 */
function revellLabel(d) {
  const n = d.name;
  let s =
    d.finish === 'Clear' && n.includes('lear') && !['101', '102'].includes(d.sku.slice(2))
      ? n
      : `${d.finish} ${n}`;
  if (d.ral) s += ` (RAL ${d.ral})`;
  return s;
}

/**
 * Monta os catálogos normalizados a partir dos JSONs brutos (função pura, sem rede).
 * @param {{ac: object[], tm: object[], rv: object[], fs: object[], vl: object[], mr: object[], hb: object[], ral: object[], ak: object[], am: object[], sc?: object[], tc?: object[], px?: object[], tl?: object[]}} raw conteúdo de
 *        `acrilex-cores-oficial`, `tamiya-cores-oficial`, `revell-cores-oficial`,
 *        `fs595-cores`, `vallejo-cores`, `mrcolor-cores`, `humbrol-cores`, `ral-cores`, `ak-cores`, `ammo-cores`, `scale75-cores`, `tomcolors-cores`, `phoenix-cores` e `talento-cores`.
 * @returns {Object<string, CatalogPaint[]>} catálogos por chave
 *          (`acrilex`, `tamiya`, `revell`, `fs595`, `vallejo`, `mrhobby`, `humbrol`, `ral`, `ak`, `ammo`, `scale75`, `tomcolors`, `phoenix`, `talento`).
 *          Os catálogos com várias linhas (`tamiya`, `revell`, `vallejo`, `mrhobby`, `ak`, `ammo`, `scale75`, `tomcolors`, `phoenix`, `talento`)
 *          marcam cada tinta com `line`.
 */
export function buildCatalogs({ ac, tm, rv, fs, vl, mr, hb, ral, ak, am, sc = [], tc = [], px = [], tl = [] }) {
  // Tamiya: aditivos (sem cor) ficam de fora; linhas por base química (acrílica primeiro)
  const tamiya = (base, line) =>
    tm.filter((d) => d.hex && !d.aditivo && d.base === base).map((d) => ({ code: d.code, name: d.name, hex: d.hex, line }));
  const revell = (linha) =>
    rv.filter((d) => d.linha === linha).map((d) => ({ code: d.sku, name: revellLabel(d), hex: d.hex, line: linha, finish: d.finish }));
  return {
    // Acrilex: a cartela é toda da Tinta Acrílica Fosca (o catálogo não traz o acabamento por cor)
    acrilex: ac.map((d) => ({ code: d.code, name: d.name, hex: d.hex, finish: 'Matte' })),
    tamiya: [...tamiya('acrilica_mini', 'Acrylic') /* X- (brilhante) e XF- (fosco) */, ...tamiya('lacquer', 'Lacquer') /* LP- */],
    revell: [...revell('Aqua Color'), ...revell('Email Color')],
    // FS 595: o 1º dígito do código já indica o acabamento (1 gloss, 2 semi-gloss, 3 flat)
    fs595: fs.map((d) => ({ code: d.code, name: d.name || '', hex: d.hex, ...(d.finish ? { finish: d.finish } : {}) })),
    // Vallejo: várias linhas num só catálogo (a interface oferece um seletor de linha)
    vallejo: vl.map((d) => ({
      code: d.code,
      name: d.name,
      hex: d.hex,
      line: d.line,
      series: d.series,
      ...(d.degrade ? { degrade: true } : {}),
    })),
    // Mr. Hobby (Gunze): linhas Mr. Color, Aqueous Hobby Color e Acrysion num só catálogo
    mrhobby: mr.map((d) => ({
      code: d.code,
      name: d.name,
      hex: d.hex,
      line: d.line,
      series: d.series,
      ...(d.finish ? { finish: d.finish } : {}),
      ...(d.degrade ? { degrade: true } : {}),
    })),
    // Humbrol: tintas acrílicas (o código é o número do catálogo Humbrol)
    humbrol: hb.map((d) => ({
      code: d.code,
      name: d.name,
      hex: d.hex,
      ...(d.finish ? { finish: d.finish } : {}),
      ...(d.degrade ? { degrade: true } : {}),
    })),
    // RAL Classic: o código é o número RAL (ex.: "7016"); o nome é o oficial em inglês
    ral: ral.map((d) => ({ code: d.code, name: d.name, hex: d.hex })),
    // AK Real Colors (lacquer): as seções Standard, Civil e Military viram "linhas" na interface
    ak: ak.map((d) => ({
      code: d.code,
      name: d.name,
      hex: d.hex,
      line: d.series,
      ...(d.ref ? { ref: d.ref } : {}),
      ...(d.equiv ? { equiv: d.equiv } : {}),
      ...(d.degrade ? { degrade: true } : {}),
    })),
    // AMMO by Mig: linhas Acrylic Colors (A.MIG) e ATOM. A referência RAL/FS vai junto do nome, se ainda não estiver nele.
    ammo: am.map((d) => ({
      code: d.code,
      name: d.ref && !d.name.replace(/\s/g, '').toLowerCase().includes(d.ref.replace(/\s/g, '').toLowerCase()) ? `${d.name} (${d.ref})` : d.name,
      hex: d.hex,
      line: d.line,
      ...(d.ref ? { ref: d.ref } : {}),
      ...(d.equiv ? { equiv: d.equiv } : {}),
      ...(d.degrade ? { degrade: true } : {}),
    })),
    // Scale75 (site oficial): Scalecolor (com as séries Metal n' Alchemy e Inktense), Fantasy & Games, Warfront,
    // Instant Colors, FX Fluor, Scalecolor Artist, Flow (óleo), Drop & Paint e Scalecolor Games.
    // `aprox` marca as cores lidas do frasco ou de amostras diluídas.
    scale75: sc.map((d) => ({
      code: d.code,
      name: d.name,
      hex: d.hex,
      line: d.line,
      ...(d.series ? { series: d.series } : {}),
      ...(d.finish ? { finish: d.finish } : {}),
      ...(d.aprox ? { aprox: d.aprox } : {}),
    })),
    // Tom Colors (loja oficial): linhas pelo prefixo do código, TC = Acrylic Colors e TCUP = UP (ultra-pigmentada).
    // `aprox` marca as cores lidas de uma foto (a cabeça pintada das Skin Tones sem imagem-modelo).
    tomcolors: tc.map((d) => ({
      code: d.code,
      name: d.name,
      hex: d.hex,
      line: d.line,
      ...(d.finish ? { finish: d.finish } : {}),
      ...(d.aprox ? { aprox: d.aprox } : {}),
    })),
    // Phoenix Special Colors (tintas automotivas Duco e poliéster para modelismo): a linha é o padrão da cor (FS, RLM, RAL…).
    // As cores são valores digitais escolhidos pela própria loja, não medidas de tinta.
    phoenix: px.map((d) => ({
      code: d.code,
      name: d.name,
      hex: d.hex,
      line: d.line,
      ...(d.finish ? { finish: d.finish } : {}),
    })),
    // Talento (fabricante nacional, catálogo de modelismo em PDF): as linhas são Acrylic Color, Metallic, Game, Artes,
    // Metallic Artes, Clear e Speed. As cores são as amostras impressas no catálogo (CMYK convertido para RGB).
    talento: tl.map((d) => ({
      code: d.code,
      name: d.name,
      hex: d.hex,
      line: d.line,
      ...(d.finish ? { finish: d.finish } : {}),
    })),
  };
}

/**
 * Carrega os JSONs de `dados/` e monta todos os catálogos.
 * @returns {Promise<Object<string, CatalogPaint[]>>} catálogos por chave (ver {@link buildCatalogs}).
 */
export async function loadCatalogs() {
  const [ac, tm, rv, fs, vl, mr, hb, ral, ak, am, sc, tc, px, tl] = await Promise.all([
    // (a ordem segue a de `buildCatalogs`)
    loadJson('acrilex-cores-oficial.json'),
    loadJson('tamiya-cores-oficial.json'),
    loadJson('revell-cores-oficial.json'),
    loadJson('fs595-cores.json'),
    loadJson('vallejo-cores.json'),
    loadJson('mrcolor-cores.json'),
    loadJson('humbrol-cores.json'),
    loadJson('ral-cores.json'),
    loadJson('ak-cores.json'),
    loadJson('ammo-cores.json'),
    loadJson('scale75-cores.json'),
    loadJson('tomcolors-cores.json'),
    loadJson('phoenix-cores.json'),
    loadJson('talento-cores.json'),
  ]);
  return buildCatalogs({ ac, tm, rv, fs, vl, mr, hb, ral, ak, am, sc, tc, px, tl });
}

/**
 * Nome de exibição de um catálogo (marca) ou da aba de cor livre.
 * @param {string} tab chave da aba.
 * @returns {string}
 */
export function catalogName(tab) {
  return tab === 'free' ? t('tab.free') : CATALOG_NAMES[tab];
}

/**
 * Nome de uma tinta para exibição ("Sem nome" no idioma atual quando o catálogo não traz nome).
 * @param {CatalogPaint} paint tinta.
 * @returns {string}
 */
export function displayName(paint) {
  return paint.name || t('common.noName');
}

/**
 * Cor-alvo correspondente a uma tinta de catálogo. Guarda a origem (`ref`) para que as
 * equivalências declaradas pelo fabricante possam ser consultadas.
 * @param {string} tab aba/catálogo da tinta (ex.: "tamiya").
 * @param {CatalogPaint} paint tinta.
 * @returns {{hex: string, label: string, ref: {tab: string, code: string}}}
 */
export function targetOf(tab, paint) {
  const origem = catalogName(tab) + (paint.line ? ' ' + lineName(paint.line) : '');
  return { hex: paint.hex, label: `${origem} ${paint.code} ${displayName(paint)}`, ref: { tab, code: paint.code } };
}

/** Cor-alvo da primeira execução: Tamiya X-2 White (branco). */
export const ALVO_PADRAO = { tab: 'tamiya', code: 'X-2' };

/**
 * Cor-alvo inicial do app (primeira execução ou estado restaurado).
 * @param {Object<string, CatalogPaint[]>} catalogs catálogos por aba.
 * @returns {{hex: string, label: string, ref?: {tab: string, code: string}}}
 */
export function alvoPadrao(catalogs) {
  const paint = (catalogs[ALVO_PADRAO.tab] || []).find((p) => p.code === ALVO_PADRAO.code);
  // se a tinta um dia sair dos dados, cai num branco livre em vez de quebrar a abertura
  return paint ? targetOf(ALVO_PADRAO.tab, paint) : { hex: '#ffffff', label: t('target.free.label') };
}

/**
 * Linhas de produtos de um catálogo, na ordem em que aparecem (vazio se o
 * catálogo não se divide em linhas).
 * @param {CatalogPaint[]} paints tintas do catálogo.
 * @returns {string[]} nomes das linhas.
 */
export function catalogLines(paints) {
  return [...new Set(paints.map((p) => p.line).filter(Boolean))];
}
