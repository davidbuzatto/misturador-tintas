/**
 * Extrai o catálogo de cores da Phoenix Special Colors e grava `dados/phoenix-cores.json`.
 *
 * Fonte: https://phoenix-special-colors.com.br/products. O site é um aplicativo React (Vite) e o catálogo inteiro
 * está embutido no JavaScript empacotado, como um arranjo de objetos `{id, name, color, category, standard}`;
 * não há imagens de tinta: a cor é o valor hexadecimal que a própria loja escolheu para cada tinta.
 * O script baixa a página, acha o arquivo `assets/index-*.js`, localiza o arranjo (pelo primeiro objeto, `id:1`) e lê
 * cada objeto sem executar o código da página.
 *
 * Toda cor é vendida em dois tipos, **Duco** (lacca automotiva) e **Poliéster**, em 30 ou 60 ml e nos acabamentos
 * fosco, acetinado e brilhante: o tipo é uma opção do produto, não da cor. Por isso o aplicativo cria duas linhas
 * de ingredientes (Duco e Poliéster) com as mesmas cores.
 *
 * O que entra: as tintas dos padrões Federal Standard, RLM, British Standard, RAL, ANA, IJA, IJN, Regia Aeronautica,
 * Soviet & Russian (AMT) e USN. Ficam de fora os pigmentos em pó ("Exclusivos Phoenix") e os sets/kits. Entradas
 * repetidas (mesmo nome e mesma cor) são unidas.
 *
 * Código e nome: o site mistura os dois ("11136 Carmine Vine Red", "RAL 1000 Grünbeige"). O código ganha o prefixo do
 * padrão ("FS 11136", "RAL 1000", "USN #5") para ser único no catálogo; onde o site não traz código (Regia
 * Aeronautica, IJN, parte da IJA, da USN e da AMT), o próprio nome faz o papel de código.
 *
 * Uso:  node ferramentas/extrair-phoenix.mjs [--saida arquivo.json] [--bundle caminho/do/index.js]
 *       (`--bundle` lê um arquivo local em vez de baixar do site)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = 'https://phoenix-special-colors.com.br';
const args = process.argv.slice(2);
const opcao = (nome, padrao) => (args.includes(nome) ? args[args.indexOf(nome) + 1] : padrao);
const SAIDA = opcao('--saida', fileURLToPath(new URL('../dados/phoenix-cores.json', import.meta.url)));
const BUNDLE = opcao('--bundle', '');

/** Padrões que viram linhas do catálogo, na ordem de exibição (a do filtro do site). */
const LINHAS = ['Federal Standard', 'RLM', 'British Standard', 'RAL', 'ANA', 'IJA', 'IJN', 'Regia Aeronautica', 'Soviet & Russian', 'USN'];
/** Entradas que não são tintas de cor. */
const FORA = new Set(['Exclusivos Phoenix', 'Sets & Kits']);

/** Como separar "código nome" em cada padrão: expressão (grupo 1 = código, grupo 2 = nome) e prefixo do código. */
const REGRAS = {
  'Federal Standard': { re: /^(\d{5})\s+(.+)$/, prefixo: 'FS ' },
  RLM: { re: /^RLM (\d{2})\s+(.+)$/, prefixo: 'RLM ' },
  'British Standard': { re: /^BS 381C (\d{3})\s+(.+)$/, prefixo: 'BS 381C ' },
  RAL: { re: /^RAL (\d{4})\s+(.+)$/, prefixo: 'RAL ' },
  ANA: { re: /^ANA (\d{3})\s+(.+)$/, prefixo: 'ANA ' },
  IJA: { re: /^IJA (#\d+)\s+(.+)$/, prefixo: 'IJA ' },
  'Soviet & Russian': { re: /^((?:AMT|AE|A|ALG)-\d+\w*|3B|4BO)\s+(.+)$/, prefixo: '' },
  USN: { re: /^(#\d+|\d-[A-Z]{1,2}|\d{2}[A-Z])\s+(.+)$/, prefixo: 'USN ' },
};

/** Texto de um literal de string JavaScript ("..." ou '...') em `objeto`, para o campo `chave`. */
function texto(objeto, chave) {
  const m = objeto.match(new RegExp(chave + ':("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')'));
  if (!m) return null;
  const v = m[1];
  return v[0] === '"' ? JSON.parse(v) : v.slice(1, -1).replace(/\\'/g, "'");
}

/** Divide o arranjo em objetos de primeiro nível, respeitando aspas e chaves aninhadas. */
function objetosDoArranjo(trecho) {
  const objetos = [];
  let nivel = 0, aspas = null, esc = false, comeco = -1;
  for (let i = 0; i < trecho.length; i++) {
    const c = trecho[i];
    if (aspas) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === aspas) aspas = null;
      continue;
    }
    if (c === '"' || c === "'") { aspas = c; continue; }
    if (c === '{') { if (nivel === 0) comeco = i; nivel++; }
    else if (c === '}') { nivel--; if (nivel === 0) objetos.push(trecho.slice(comeco, i + 1)); }
  }
  return objetos;
}

// ---- 1. o JavaScript do site ----
let js;
if (BUNDLE) {
  js = readFileSync(BUNDLE, 'utf8');
} else {
  const pagina = await (await fetch(`${SITE}/products`, { headers: { 'user-agent': 'Mozilla/5.0 (extrator de cores; misturador-tintas)' } })).text();
  const arquivo = pagina.match(/<script[^>]+src="(\/assets\/index-[^"]+\.js)"/)?.[1];
  if (!arquivo) throw new Error('não achei o arquivo JavaScript do site (a estrutura da página mudou?)');
  js = await (await fetch(SITE + arquivo)).text();
  console.log(`bundle: ${arquivo} (${(js.length / 1e3).toFixed(0)} KB)`);
}

// ---- 2. o arranjo de produtos ----
const inicio = js.indexOf('[{id:1,name:');
if (inicio < 0) throw new Error('não achei o arranjo de produtos (a estrutura do site mudou?)');
const fim = js.indexOf('}]', inicio) + 2;
const brutos = objetosDoArranjo(js.slice(inicio + 1, fim - 1));
const todos = brutos.map((o) => ({ id: +o.match(/^\{id:(\d+)/)[1], name: texto(o, 'name'), color: (texto(o, 'color') || '').toLowerCase(), category: texto(o, 'category'), standard: texto(o, 'standard') }));
console.log(`${todos.length} entradas lidas`);

// ---- 3. filtro, código/nome e unicidade ----
const tintas = todos.filter((o) => !FORA.has(o.standard));
const desconhecidos = tintas.filter((o) => !LINHAS.includes(o.standard));
if (desconhecidos.length) console.warn('padrões novos ignorados:', [...new Set(desconhecidos.map((o) => o.standard))].join(', '));
const ordem = (o) => LINHAS.indexOf(o.standard);
const validas = tintas.filter((o) => ordem(o) >= 0 && /^#[0-9a-f]{6}$/.test(o.color)).sort((a, b) => ordem(a) - ordem(b) || a.id - b.id);

const vistos = new Set();
const cores = [];
let repetidas = 0;
for (const o of validas) {
  const chave = `${o.standard}|${o.name}|${o.color}`;
  if (vistos.has(chave)) { repetidas++; continue; }
  vistos.add(chave);
  const regra = REGRAS[o.standard];
  const m = regra && o.name.match(regra.re);
  let nome = m ? m[2] : o.name;
  // IJA e IJN repetem a sigla no nome ("IJN Ash Grey", "IJA/IJN Red Brown"): o prefixo fica só no código
  if (!m && (o.standard === 'IJA' || o.standard === 'IJN')) nome = o.name.replace(/^IJA\/IJN |^IJA |^IJN /, '');
  const cor = { code: m ? regra.prefixo + m[1] : o.name, name: nome, line: o.standard, hex: o.color, _numerado: !!m };
  if (o.category === 'Metallics') cor.finish = 'Metallic';
  else if (/\btransparent\b/i.test(o.name)) cor.finish = 'Clear';
  cores.push(cor);
}
// o mesmo número aparece com nomes diferentes (ex.: "36375 Medium Gray" e "36375 Light Ghost Grey"): o nome entra no código
const usos = {};
cores.forEach((c) => (usos[c.code] = (usos[c.code] || 0) + 1));
const colisoes = [];
for (const c of cores) {
  if (usos[c.code] > 1) {
    colisoes.push(c.code);
    c.code = `${c.code} ${c.name}`;
  }
  delete c._numerado;
}
const unicos = new Set(cores.map((c) => c.code));
if (unicos.size !== cores.length) throw new Error(`códigos repetidos: ${cores.length - unicos.size}`);

writeFileSync(SAIDA, JSON.stringify(cores, null, 1) + '\n', 'utf8');
const porLinha = {};
cores.forEach((c) => (porLinha[c.line] = (porLinha[c.line] || 0) + 1));
console.log(`gravado ${cores.length} cores em ${SAIDA}`);
console.log(porLinha);
console.log(`repetidas unidas: ${repetidas} | fora do catálogo: ${todos.length - tintas.length} (pigmentos e sets) | códigos em colisão resolvidos pelo nome: ${[...new Set(colisoes)].join(', ') || 'nenhum'}`);
console.log(`sem código separado (o nome é o código): ${cores.filter((c) => c.code === c.name).length}`);
