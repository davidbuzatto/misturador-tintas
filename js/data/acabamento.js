/**
 * @module data/acabamento
 * Acabamento normalizado das tintas, para o catálogo de consulta.
 *
 * Cada catálogo descreve o acabamento do seu jeito (ou nem descreve). Aqui tudo vira uma destas categorias:
 * `matte`, `satin`, `gloss`, `metallic` (inclui perolados), `clear` (transparentes) e `special`
 * (fluorescentes, candy, washes, tintas e efeitos). Quando nada permite saber, o resultado é `null`.
 *
 * Ordem de decisão: (1) o nome diz "metálica"/"transparente"/"fluorescente"; (2) linha/série da Vallejo ou da Scale75;
 * (3) o acabamento informado pelo catálogo; (4) o prefixo do código Tamiya (X- brilhante, XF- fosco).
 * As etapas 1, 2 e 4 são **inferências**: `inferido` fica `true` para que a interface avise.
 * Função pura, sem DOM.
 */

/** Categorias, na ordem em que os filtros aparecem. */
export const ACABAMENTOS = ['matte', 'satin', 'gloss', 'metallic', 'clear', 'special'];

/** Nomes que indicam metal. */
const NOME_METAL = /\b(metal(lic)?|alumin(i)?um|duralumin|chrome|steel|silver|gold|copper|bronze|brass|titanium|iron|nickel|magnesium)\b/i;
/** Nomes que contêm uma palavra de metal mas são cores comuns (verde bronze, cinza aço, cromato de zinco, amarelo cromo, ferrugem…). */
const NOME_NAO_METAL = /\b(zinc[\s-]*chromate|chrome yellow|bronze green|steel gr[ae]y|silver gr[ae]y|gold yellow|rust|washable)\b/i;
/** Nomes de tintas transparentes. */
const NOME_TRANSPARENTE = /\b(clear|smoke)\b/i;
/** Nomes de tintas fluorescentes. */
const NOME_ESPECIAL = /\b(fluo(rescent)?|neon|candy)\b/i;

/** Acabamentos informados pelos catálogos → categoria. */
const DECLARADO = {
  gloss: 'gloss',
  'semi-gloss': 'satin',
  'semi-matte': 'matte', // Artesanía Latina: "semi-matte", mais perto do fosco que do acetinado
  satin: 'satin',
  silk: 'satin',
  matt: 'matte',
  matte: 'matte',
  'matte 75%': 'matte',
  flat: 'matte',
  metallic: 'metallic',
  pearl: 'metallic',
  iridescent: 'metallic',
  fluo: 'special',
  clear: 'clear',
};

/** Séries da Vallejo e da Scale75 → categoria (as linhas Liquid Metal e True Metallic são tratadas à parte). */
const SERIE_EFEITO = [
  [/metallic|alchemy/i, 'metallic'],
  [/fluo|intense/i, 'special'],
  [/candy|wash|ink|shade|special fx|weathering/i, 'special'],
];

/** Categoria já calculada de cada tinta (as tintas não mudam durante a sessão). */
const cache = new WeakMap();

/**
 * Acabamento normalizado de uma tinta.
 * @param {string} aba catálogo da tinta (`tamiya`, `vallejo`…).
 * @param {import('./catalogs.js').CatalogPaint} p tinta.
 * @returns {{tipo: string|null, inferido: boolean}} categoria e se ela foi inferida (nome, série ou código)
 *          em vez de informada pelo catálogo.
 */
export function acabamentoDe(aba, p) {
  let r = cache.get(p);
  if (!r) {
    r = calcular(aba, p);
    cache.set(p, r);
  }
  return r;
}

/** Cálculo de {@link acabamentoDe}, sem cache. */
function calcular(aba, p) {
  const declarado = p.finish ? DECLARADO[p.finish.toLowerCase()] || null : null;
  // FS 595 e RAL são cartelas de cor de norma (nomes como "Steel Blue" ou "Gold" não indicam tinta metálica)
  if (aba === 'fs595' || aba === 'ral') return { tipo: declarado, inferido: false };
  const nome = p.name || '';

  if (NOME_METAL.test(nome) && !NOME_NAO_METAL.test(nome)) return { tipo: 'metallic', inferido: declarado !== 'metallic' };
  if (NOME_TRANSPARENTE.test(nome)) return { tipo: 'clear', inferido: declarado !== 'clear' };
  if (NOME_ESPECIAL.test(nome)) return { tipo: 'special', inferido: true };

  if (aba === 'vallejo' || aba === 'scale75') {
    if (/^(liquid metal|true metallic)/i.test(p.line || '')) return { tipo: 'metallic', inferido: true };
    for (const [re, tipo] of SERIE_EFEITO) if (re.test(p.series || '')) return { tipo, inferido: true };
  }

  if (declarado) return { tipo: declarado, inferido: false };

  if (aba === 'tamiya') {
    if (/^XF-/.test(p.code)) return { tipo: 'matte', inferido: true };
    if (/^X-/.test(p.code)) return { tipo: 'gloss', inferido: true };
  }
  return { tipo: null, inferido: false };
}

/**
 * Filtra as tintas de um catálogo por linha, acabamento e texto (código ou nome).
 * @param {import('./catalogs.js').CatalogPaint[]} paints tintas do catálogo.
 * @param {string} aba catálogo (para calcular o acabamento).
 * @param {{linha?: string, tipo?: string, q?: string}} filtros `linha` e `tipo` aceitam `'*'` (todos).
 * @returns {import('./catalogs.js').CatalogPaint[]}
 */
export function filtrarCatalogo(paints, aba, { linha = '*', tipo = '*', q = '' } = {}) {
  const busca = q.trim().toLowerCase();
  return paints.filter((p) => {
    if (linha !== '*' && p.line !== linha) return false;
    if (tipo !== '*' && acabamentoDe(aba, p).tipo !== tipo) return false;
    return !busca || `${p.code} ${p.name || ''}`.toLowerCase().includes(busca);
  });
}

/**
 * Quantas tintas há de cada acabamento (as sem acabamento definido não entram na contagem).
 * @param {import('./catalogs.js').CatalogPaint[]} paints tintas.
 * @param {string} aba catálogo.
 * @returns {Object<string, number>}
 */
export function contarPorTipo(paints, aba) {
  const n = {};
  for (const p of paints) {
    const { tipo } = acabamentoDe(aba, p);
    if (tipo) n[tipo] = (n[tipo] || 0) + 1;
  }
  return n;
}
