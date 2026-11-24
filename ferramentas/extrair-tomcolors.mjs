/**
 * Extrai as cores das tintas acrílicas Tom Colors e grava `dados/tomcolors-cores.json`.
 *
 * Fonte: a loja oficial https://www.tomcolors.com.br (plataforma Tray). Os produtos estão espalhados em várias
 * categorias (e um mesmo produto pode aparecer em mais de uma); o script lê as páginas listadas em `CATEGORIAS`
 * (com paginação `?pg=N`), junta os produtos pelo id e fica só com as TINTAS (endereço em `/tintas-acrilicas/`).
 * Sets, vernizes, máscaras e outros produtos correlatos são ignorados.
 *
 * As linhas seguem o prefixo do código: `TC-nnnn` (Acrylic Colors) e `TCUP-nn` (UP, ultra-pigmentada).
 *
 * Cada produto tem uma imagem 1080×1080 com a amostra, em três layouts:
 *   A) fundo branco, frasco à esquerda e um TRAÇO de pincel chapado à direita (a maioria);
 *   B) fundo de foto escura (série RLM), com uma MANCHA redonda de tinta;
 *   D) imagem-modelo da linha UP: fundo branco, logo "UP" dourado e um CÍRCULO de cor chapada à direita;
 *   C) foto de uma cabeça pintada (Skin Tones), SEM amostra: a cor tem de ser informada à mão.
 * Cada anúncio tem várias fotos (a da lista é só a primeira): o script lê a página do produto, mede todas e usa a
 * imagem-modelo (D ou A, depois B). Só sem nenhuma delas recorre à cabeça pintada (Skin Tones) ou ao frasco (UP).
 * As Skin Tones (layout C) só têm a foto de uma cabeça pintada: a cor vem de uma caixa na testa e é aproximada
 * (`aprox: "foto"`).
 * A linha UP (ultra-pigmentada, `/tintas-up-ultra-pigmentada/`, códigos TCUP-nn) tem a imagem-modelo com o círculo (D).
 * A cor é a mediana dos pixels do interior da amostra (a do traço é o maior componente não branco, recuado das
 * bordas). Brancos sobre fundo branco não aparecem na imagem e também vão para a conferência manual.
 *
 * Correções manuais: `ferramentas/tomcolors-correcoes.json`, { "TC-0001": { "hex": "#fafafa", "nota": "…" } }.
 * Valem sobre a cor medida e também criam a cor das tintas sem amostra.
 *
 * Requer o `ffmpeg` no PATH (decodifica o JPEG).
 * Uso:  node ferramentas/extrair-tomcolors.mjs [--saida a.json] [--medidas m.json] [--relatorio r.md] [--cache pasta]
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hex2lab } from '../js/color/convert.js';

const SITE = 'https://www.tomcolors.com.br';
const N = 360; // lado da imagem decodificada
const RECUO = 3; // px de recuo das bordas do traço

/**
 * Páginas de categoria da loja. Servem só para encontrar os produtos (o mesmo produto aparece em várias): a linha
 * vem do prefixo do código (TC = Acrylic Colors, TCUP = UP), não da categoria.
 */
const CATEGORIAS = [
  ['tintas-acrilicas/cores-de-pele-skin-tones', 'Tons de pele'],
  ['pele', 'Tons de pele'],
  ['tintas-acrilicas/tintas-para-uniforme-e-pele', 'Figuras'],
  ['aviacaoww2', 'Aviação WWII'],
  ['aviacao-japonesa', 'Aviação WWII'],
  ['aviacaomodernaacrilica', 'Aviação moderna'],
  ['aviacaoacrilico', 'Aviação moderna'],
  ['navalacrilico', 'Naval'],
  ['acriliconaval', 'Naval'],
  ['militariaacrilica', 'Militaria'],
  ['acrilicomilitaria', 'Militaria'],
  ['fsacrilico', 'FS'],
  ['figuras', 'Figuras'],
  ['diorama', 'Diorama'],
  ['basicas', 'Básicas'],
  ['up', 'UP'],
  ['sets-de-pintura/sets-automotivos', ''],
  ['sets-de-pintura/sets-de-aviacao', ''],
  ['sets-de-pintura/sets-de-militaria', ''],
  ['sets-de-pintura/sets-tinta-acrilica/sets-acrilicos-para-figuras-impressao-3d-e-dioramas', ''],
];

/** Siglas que ficam em maiúsculas nos nomes. */
const SIGLAS = new Set(['RLM', 'FS', 'RAL', 'ANA', 'AMT', 'RAF', 'USAF', 'USN', 'DKM', 'NATO', 'VVS', 'IJA', 'IJN', 'BS', 'US', 'WW2', 'TC', 'MIG', 'UP', 'IJA', 'USA', 'GI']);

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const mediana = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

// ---- argumentos ----
const args = process.argv.slice(2);
const opcao = (nome, padrao) => (args.includes(nome) ? args[args.indexOf(nome) + 1] : padrao);
const SAIDA = opcao('--saida', fileURLToPath(new URL('../dados/tomcolors-cores.json', import.meta.url)));
const MEDIDAS = opcao('--medidas', fileURLToPath(new URL('./tomcolors-medidas.json', import.meta.url)));
const RELATORIO = opcao('--relatorio', fileURLToPath(new URL('./tomcolors-conferir.md', import.meta.url)));
const CACHE = opcao('--cache', join(tmpdir(), 'tomcolors-imagens'));
const CORRECOES_ARQ = fileURLToPath(new URL('./tomcolors-correcoes.json', import.meta.url));
mkdirSync(CACHE, { recursive: true });
const correcoes = existsSync(CORRECOES_ARQ) ? JSON.parse(readFileSync(CORRECOES_ARQ, 'utf8')) : {};

// ---- rede ----
async function baixar(url, tipo) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (extrator de cores; misturador-tintas)' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      return tipo === 'html' ? new TextDecoder('windows-1252').decode(buf) : buf;
    } catch (e) {
      if (tentativa === 5) throw new Error(`${url}: ${e.message}`);
      await espera(1500 * tentativa * tentativa);
    }
  }
}

/** Lê todas as páginas de uma categoria; devolve os produtos da lista principal (sem os carrosséis de destaque). */
async function lerCategoria(caminho) {
  const produtos = new Map();
  for (let pg = 1; pg <= 30; pg++) {
    const html = await baixar(`${SITE}/${caminho}${pg > 1 ? `?pg=${pg}` : ''}`, 'html');
    const ini = html.indexOf('class="showcase-catalog');
    const fim = html.indexOf('class="catalog-footer');
    const regiao = ini >= 0 ? html.slice(ini, fim > ini ? fim : undefined) : '';
    const cartoes = regiao.split('<div class="product nb">').slice(1);
    let novos = 0;
    for (const c of cartoes) {
      const href = c.match(/<a href="([^"]+)" class="space-image[^"]*">/)?.[1];
      if (!href) continue;
      const id = href; // o endereço é único por produto (nem todo cartão traz o id numérico)
      if (!produtos.has(id)) {
        novos++;
        produtos.set(id, {
          id,
          href,
          nome: c.match(/<div class="product-name">([^<]*)</)?.[1]?.trim() || '',
          // a imagem da lista é uma miniatura com prefixo de tamanho; sem o prefixo, é a original
          imagem: c.match(/data-src="([^"]+)"/)?.[1]?.replace(/\/img_prod\/(\d+)\/\d+_/, '/img_prod/$1/'),
        });
      }
    }
    if (!novos) break; // a página não trouxe nada novo: acabou
    await espera(250);
  }
  return produtos;
}

/** Decodifica a imagem para RGB 8 bits (N×N) com o ffmpeg. */
function decodificar(arquivo) {
  return execFileSync('ffmpeg', ['-v', 'error', '-i', arquivo, '-vf', `scale=${N}:${N}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 26 });
}
const px = (b, x, y) => [b[(y * N + x) * 3], b[(y * N + x) * 3 + 1], b[(y * N + x) * 3 + 2]];

/** Layout A (fundo branco: placa amarela do logo no canto superior esquerdo), B (foto escura) ou C (outra foto). */
function layout(b) {
  // A: a placa amarela do logo ocupa o canto superior esquerdo
  const r = [], g = [], bl = [];
  for (let y = Math.round(N * 0.05); y < Math.round(N * 0.18); y++) for (let x = Math.round(N * 0.05); x < Math.round(N * 0.3); x++) {
    const p = px(b, x, y); r.push(p[0]); g.push(p[1]); bl.push(p[2]);
  }
  const [mr, mg, mb] = [mediana(r), mediana(g), mediana(bl)];
  if (mr > 190 && mg > 150 && mg < 225 && mb < 120) return 'A';
  // B: borda direita escura
  let soma = 0, total = 0;
  for (let y = Math.round(N * 0.42); y < N; y++) for (let x = Math.round(N * 0.96); x < N; x++) { const p = px(b, x, y); soma += lum(...p); total++; }
  return soma / total < 95 ? 'B' : 'C';
}

/**
 * Skin Tones (layout C): não há amostra, só a foto de uma cabeça pintada com a tinta. A cor é a mediana de uma caixa na
 * testa/topo da cabeça (frações da imagem [x0, y0, x1, y1], conferidas à vista em cada foto). É a tinta SECA e sob a
 * iluminação da foto, então é só uma aproximação (`aprox: "foto"`); nas peças claras a foto tem dominante fria.
 * Validação: na RLM 61 (cor conferida no site) o erro foi ΔE 6,6.
 */
const CABECAS = {
  'TC-0036': [0.58, 0.25, 0.74, 0.33],
  'TC-0140': [0.45, 0.33, 0.58, 0.39],
  'TC-0194': [0.17, 0.3, 0.33, 0.38],
  'TC-0244': [0.15, 0.42, 0.32, 0.5],
  'TC-0248': [0.55, 0.4, 0.68, 0.46],
  'TC-0305': [0.52, 0.17, 0.7, 0.26],
  'TC-0306': [0.57, 0.18, 0.75, 0.27],
  'TC-0307': [0.5, 0.2, 0.68, 0.3],
  'TC-0308': [0.58, 0.2, 0.76, 0.3],
  'TC-0320': [0.52, 0.22, 0.7, 0.32],
};
function medirCabeca(b, [x0, y0, x1, y1]) {
  const r = [], g = [], bl = [];
  for (let y = Math.round(N * y0); y < Math.round(N * y1); y++) for (let x = Math.round(N * x0); x < Math.round(N * x1); x++) {
    const p = px(b, x, y); r.push(p[0]); g.push(p[1]); bl.push(p[2]);
  }
  return { ok: true, aprox: 'foto', ...resumo(r, g, bl) };
}

/** Layout A: maior componente conexo "não branco" na zona do traço, recuado das bordas. */
function medirTraco(b) {
  const x0 = Math.round(N * 0.42), x1 = Math.round(N * 0.99), y0 = Math.round(N * 0.40), y1 = Math.round(N * 0.77);
  const m = new Uint8Array(N * N);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const [r, g, bl] = px(b, x, y);
    if (255 - Math.min(r, g, bl) > 14) m[y * N + x] = 1;
  }
  const rot = new Int32Array(N * N);
  let melhor = { n: 0, id: 0 }, id = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (!m[y * N + x] || rot[y * N + x]) continue;
    id++;
    const pilha = [y * N + x];
    rot[y * N + x] = id;
    let n = 0;
    while (pilha.length) {
      const k = pilha.pop();
      n++;
      const kx = k % N, ky = (k / N) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = kx + dx, ny = ky + dy;
        if (nx < x0 || nx >= x1 || ny < y0 || ny >= y1) continue;
        const nk = ny * N + nx;
        if (m[nk] && !rot[nk]) { rot[nk] = id; pilha.push(nk); }
      }
    }
    if (n > melhor.n) melhor = { n, id };
  }
  if (melhor.n < 1500) return { ok: false, motivo: 'traço não encontrado (branco sobre fundo branco?)' };
  const r = [], g = [], bl = [];
  for (let y = y0 + RECUO; y < y1 - RECUO; y++) for (let x = x0 + RECUO; x < x1 - RECUO; x++) {
    if (rot[y * N + x] !== melhor.id) continue;
    let ok = true;
    for (let dy = -RECUO; dy <= RECUO && ok; dy += 3) for (let dx = -RECUO; dx <= RECUO; dx += 3) if (rot[(y + dy) * N + x + dx] !== melhor.id) { ok = false; break; }
    if (ok) { const p = px(b, x, y); r.push(p[0]); g.push(p[1]); bl.push(p[2]); }
  }
  if (r.length < 400) return { ok: false, motivo: `poucos pixels no traço (${r.length})` };
  return { ok: true, ...resumo(r, g, bl) };
}

/** Layout B: caixa no centro da mancha redonda (x 63–81%, y 68–86%). */
function medirMancha(b) {
  const r = [], g = [], bl = [];
  for (let y = Math.round(N * 0.68); y < Math.round(N * 0.86); y++) for (let x = Math.round(N * 0.63); x < Math.round(N * 0.81); x++) {
    const p = px(b, x, y); r.push(p[0]); g.push(p[1]); bl.push(p[2]);
  }
  const m = resumo(r, g, bl);
  // desvio alto: a caixa pegou o fundo (mancha em outro lugar); a cor não é confiável
  return m.desvio > 12 ? { ok: false, motivo: `mancha fora do lugar esperado (desvio ${m.desvio}); cor da caixa ${m.hex}` } : { ok: true, ...m };
}

/** Linha UP: só há foto do frasco; mede o líquido no ombro, acima do rótulo (x 43–63%, y 38,5–44%). */
function medirFrasco(b) {
  const r = [], g = [], bl = [];
  for (let y = Math.round(N * 0.385); y < Math.round(N * 0.44); y++) for (let x = Math.round(N * 0.43); x < Math.round(N * 0.63); x++) {
    const p = px(b, x, y); r.push(p[0]); g.push(p[1]); bl.push(p[2]);
  }
  return { ok: true, aprox: 'frasco', ...resumo(r, g, bl) };
}

/** Mediana por canal e desvio dos pixels. */
function resumo(r, g, bl) {
  const c = [mediana(r), mediana(g), mediana(bl)];
  const desvio = Math.sqrt(r.reduce((s, v) => s + (v - c[0]) ** 2, 0) / r.length);
  return { hex: hex(c), pixels: r.length, desvio: +desvio.toFixed(1) };
}

/** Separa o código TC-nnnn do nome do produto e normaliza o nome. */
function nomeECodigo(bruto) {
  const re = /\bTC(?:UP)?-\d{2,4}\b/i;
  const code = bruto.match(re)?.[0].toUpperCase() || '';
  let nome = bruto.replace(re, '').replace(/\(TOM DE PELE\)/i, '').replace(/\s+/g, ' ').trim();
  if (nome === nome.toUpperCase()) {
    nome = nome
      .split(' ')
      .map((p) => (SIGLAS.has(p) || /\d/.test(p) ? p : p.toLowerCase().replace(/(^|[-/(])(\p{L})/gu, (m, a, c) => a + c.toUpperCase())))
      .join(' ');
  }
  return { code, nome };
}

// ---- coleta ----
const porId = new Map();
for (const [caminho, linha] of CATEGORIAS) {
  const lista = await lerCategoria(caminho);
  console.log(`${caminho}: ${lista.size} produtos`);
  for (const [id, p] of lista) {
    const atual = porId.get(id) || { ...p, categorias: [], linha: '' };
    atual.categorias.push(caminho);
    if (!atual.linha && linha) atual.linha = linha;
    porId.set(id, atual);
  }
}
const todos = [...porId.values()];
const eUP = (p) => p.href.includes('/tintas-up-ultra-pigmentada/') && /^TCUP-\d+/i.test(p.nome);
const eTinta = (p) => p.href.includes('/tintas-acrilicas/') || eUP(p);
const tintas = todos.filter(eTinta);
const fora = todos.filter((p) => !eTinta(p));
console.log(`${todos.length} produtos únicos: ${tintas.length} tintas, ${fora.length} de outros tipos (ignorados)`);

// ---- fotos de cada anúncio ----
/**
 * Todas as fotos originais de um anúncio. A imagem da lista é só a primeira; a página do produto mostra as outras
 * (a imagem-modelo com a amostra pode ser qualquer uma delas). O nome do arquivo traz o id do produto, e a página
 * também mostra fotos de outros produtos, então só ficam as que têm o mesmo id.
 */
async function fotosDoAnuncio(p) {
  const fotos = new Map([[p.imagem.split('/').pop(), { url: p.imagem }]]);
  const idProd = p.imagem.match(/_(\d+)_\d+_[0-9a-f]{32}\.\w+$/)?.[1];
  let semPagina = false;
  if (idProd) {
    const html = await baixar(p.href, 'html');
    semPagina = /Produto n(?:ã|&atilde;)o encontrado/i.test(html); // a categoria lista o produto, mas a página do anúncio não abre
    for (const x of html.matchAll(/img_prod\/756841\/(?:\d+_)?([a-z0-9_]+_(\d+)_(\d+)_[0-9a-f]{32}\.(?:jpg|jpeg|png))/gi)) {
      if (x[2] === idProd && !fotos.has(x[1])) fotos.set(x[1], { url: `https://images.tcdn.com.br/img/img_prod/756841/${x[1]}`, indice: +x[3] });
    }
    await espera(200);
  }
  return { fotos: [...fotos.entries()].map(([arquivo, v]) => ({ arquivo, ...v })), semPagina };
}

/** Imagem-modelo da linha UP (layout D): fundo branco, logo "UP" dourado no canto e um círculo de cor à direita. */
function ehModeloUP(b) {
  let brancos = 0, total = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < Math.round(N * 0.012) + 1; x++) {
    const [r, g, bl] = px(b, x, y);
    total++;
    if (r > 235 && g > 235 && bl > 235) brancos++;
  }
  if (brancos / total < 0.75) return false; // as fotos de frasco têm a borda esquerda cinza
  let dourado = 0, n = 0;
  for (let y = Math.round(N * 0.02); y < Math.round(N * 0.2); y++) for (let x = Math.round(N * 0.02); x < Math.round(N * 0.3); x++) {
    const [r, g, bl] = px(b, x, y);
    n++;
    if (r > 150 && g > 100 && g < 210 && bl < 90 && r - bl > 90) dourado++;
  }
  // o logo "UP" é o mesmo em todas as imagens-modelo (≈0,34 de pixels dourados); a placa do modelo A dá ≈0,48
  return dourado / n > 0.3 && dourado / n < 0.4;
}

/** Layout D: caixa no centro do círculo (x 54–68%, y 43–57%); desvio alto = a caixa não caiu no círculo. */
function medirCirculo(b) {
  const r = [], g = [], bl = [];
  for (let y = Math.round(N * 0.43); y < Math.round(N * 0.57); y++) for (let x = Math.round(N * 0.54); x < Math.round(N * 0.68); x++) {
    const p = px(b, x, y); r.push(p[0]); g.push(p[1]); bl.push(p[2]);
  }
  const m = resumo(r, g, bl);
  return m.desvio > 9 ? { ok: false, motivo: `círculo fora do lugar esperado (desvio ${m.desvio}); cor da caixa ${m.hex}` } : { ok: true, ...m };
}

// ---- imagens e medição ----
const resultado = [];
let i = 0;
for (const p of tintas) {
  const { code, nome } = nomeECodigo(p.nome);
  const { fotos, semPagina } = await fotosDoAnuncio(p);
  let melhor = null; // { prioridade, layout, foto, medida }
  const analisadas = [];
  for (const ft of fotos) {
    const arquivo = join(CACHE, `${ft.arquivo.replace(/[^A-Za-z0-9]+/g, '_').slice(-120)}.jpg`);
    if (!existsSync(arquivo)) {
      writeFileSync(arquivo, await baixar(ft.url, 'bin'));
      await espera(150);
    }
    const b = decodificar(arquivo);
    const lay = ehModeloUP(b) ? 'D' : layout(b);
    const m = lay === 'A' ? medirTraco(b) : lay === 'B' ? medirMancha(b) : lay === 'D' ? medirCirculo(b) : { ok: false, motivo: 'sem amostra na imagem (foto)' };
    analisadas.push({ arquivo: ft.arquivo, layout: lay, ok: m.ok });
    // preferência: círculo (UP) e traço (A) são amostras chapadas; a mancha (B) vem depois
    const prioridade = { D: 3, A: 3, B: 2 }[lay] || 0;
    if (m.ok && (!melhor || prioridade > melhor.prioridade)) melhor = { prioridade, layout: lay, foto: ft, medida: m, arquivo };
  }
  let lay = melhor?.layout;
  let m = melhor?.medida;
  let foto = melhor?.foto;
  if (!m) {
    // sem imagem-modelo: último recurso, só com a imagem da lista (cabeça pintada ou frasco)
    const principal = fotos[0];
    const b = decodificar(join(CACHE, `${principal.arquivo.replace(/[^A-Za-z0-9]+/g, '_').slice(-120)}.jpg`));
    lay = analisadas[0].layout;
    foto = principal;
    m = CABECAS[code] ? medirCabeca(b, CABECAS[code]) : eUP(p) ? medirFrasco(b) : { ok: false, motivo: 'sem amostra utilizável nas fotos do anúncio' };
  }
  resultado.push({ ...p, code, nome, linha: eUP(p) ? 'UP' : 'Acrylic Colors', layout: lay, medida: m, foto: foto.url, nFotos: fotos.length, semPagina, imagem: foto.url });
  if (++i % 40 === 0) console.log(`  ${i}/${tintas.length} anúncios`);
}

// ---- dados, correções e relatório ----
const cores = [];
const medidas = [];
const conferir = [];
for (const r of resultado) {
  const acabamento = /acetinad/i.test(r.nome) ? 'Satin' : '';
  const base = { code: r.code, nome: r.nome, linha: r.linha, layout: r.layout, nFotos: r.nFotos, ...(r.semPagina ? { semPagina: true } : {}), categorias: r.categorias, pagina: r.href, imagem: r.imagem };
  const corr = correcoes[r.code];
  let cor = null;
  let origem = '';
  if (corr) { cor = corr.hex; origem = 'manual'; }
  else if (r.medida.ok) { cor = r.medida.hex; origem = 'medida'; }
  if (!cor) {
    medidas.push({ ...base, hex: null, motivo: r.medida.motivo });
    conferir.push({ ...base, motivo: `${r.medida.motivo}; informe a cor lendo a amostra no site` });
    continue;
  }
  if (!/^#[0-9a-f]{6}$/.test(cor)) throw new Error(`cor inválida em ${r.code}: ${cor}`);
  // claro demais: o branco some no fundo branco da imagem, então a leitura é incerta
  const lab = hex2lab(cor);
  if (!corr && lab[0] > 90 && Math.hypot(lab[1], lab[2]) < 12) conferir.push({ ...base, motivo: `cor quase branca (${cor}): sobre o fundo branco da imagem a leitura é incerta` });
  if (!corr && r.medida.aprox === 'foto') conferir.push({ ...base, motivo: `cor lida da cabeça pintada na foto (${cor}), tinta seca e sob a luz da foto: confira com a tinta e, se estiver diferente, informe a cor` });
  if (!corr && !r.medida.aprox && r.medida.desvio > 20) conferir.push({ ...base, motivo: `amostra irregular (desvio ${r.medida.desvio}); cor ${cor}` });
  cores.push({ code: r.code, name: r.nome, line: r.linha, ...(acabamento ? { finish: acabamento } : {}), hex: cor, ...(!corr && r.medida.aprox ? { aprox: r.medida.aprox } : {}) });
  medidas.push({ ...base, hex: cor, origem, ...(corr ? { medido: r.medida.hex || null, ...(corr.circulo ? { circulo: corr.circulo } : {}), ...(corr.poca ? { poca: corr.poca } : {}), ...(corr.cartao ? { cartao: corr.cartao } : {}), nota: corr.nota || '' } : { pixels: r.medida.pixels, desvio: r.medida.desvio }) });
}
// Tintas que a loja não vende separadas (só dentro do conjunto UP): a cor é amostrada à mão nas fotos do conjunto e
// fica em `tomcolors-extras.json` ([{code, name, line, hex, nota, pagina}]).
const EXTRAS_ARQ = fileURLToPath(new URL('./tomcolors-extras.json', import.meta.url));
const extras = existsSync(EXTRAS_ARQ) ? JSON.parse(readFileSync(EXTRAS_ARQ, 'utf8')) : [];
for (const e of extras) {
  if (cores.some((c) => c.code === e.code)) {
    console.warn(`extra ignorado: ${e.code} já existe na loja`);
    continue;
  }
  if (!/^#[0-9a-f]{6}$/.test(e.hex)) throw new Error(`cor inválida em ${e.code}: ${e.hex}`);
  cores.push({ code: e.code, name: e.name, line: e.line, hex: e.hex, ...(e.aprox ? { aprox: e.aprox } : {}) });
  medidas.push({ code: e.code, nome: e.name, linha: e.line, hex: e.hex, origem: 'extra (só no conjunto)', ...(e.aprox ? { aprox: e.aprox } : {}), ...(e.poca ? { poca: e.poca } : {}), nota: e.nota || '', pagina: e.pagina || '' });
}
const ordem = ['Acrylic Colors', 'UP'];
cores.sort((a, b) => ordem.indexOf(a.line) - ordem.indexOf(b.line) || a.code.localeCompare(b.code));

writeFileSync(SAIDA, JSON.stringify(cores, null, 1) + '\n', 'utf8');
writeFileSync(MEDIDAS, JSON.stringify(medidas, null, 1) + '\n', 'utf8');
const porLinha = {};
cores.forEach((c) => (porLinha[c.line] = (porLinha[c.line] || 0) + 1));
const md = [
  '# Tom Colors: tintas para conferir no site',
  '',
  `${cores.length} de ${tintas.length} tintas têm cor. **${new Set(conferir.map((c) => c.code)).size} precisam de uma olhada sua** (abaixo).`,
  '',
  '| Código | Nome | Linha | Layout | O que fazer | Página | Imagem |',
  '|---|---|---|---|---|---|---|',
  ...conferir.sort((a, b) => a.code.localeCompare(b.code)).map((c) => `| ${c.code} | ${c.nome} | ${c.linha} | ${c.layout} | ${c.motivo} | ${c.pagina} | ${c.imagem} |`),
  '',
  '## Anúncios cuja página não abre',
  '',
  `${resultado.filter((r) => r.semPagina).length} tintas aparecem na lista da categoria, mas a página do anúncio responde "Produto não encontrado"; para elas só existe a foto da lista (que já tem a amostra). Se o anúncio abrir no seu navegador e tiver outras fotos, avise: ${resultado.filter((r) => r.semPagina).map((r) => r.code).join(', ') || 'nenhuma'}.`,
  '',
  '## Fora do catálogo',
  '',
  `${fora.length} produtos que não são tintas (sets, vernizes, máscaras…): ${[...new Set(fora.map((p) => p.href.split('/').slice(3, -1).join('/')))].join(', ')}.`,
  '',
].join('\n');
writeFileSync(RELATORIO, md, 'utf8');
console.log(`gravado ${cores.length} cores em ${SAIDA}`);
console.log(porLinha);
console.log(`${new Set(conferir.map((c) => c.code)).size} tintas para conferir (${RELATORIO})`);
