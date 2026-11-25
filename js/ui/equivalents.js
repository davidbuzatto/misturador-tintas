/**
 * @module ui/equivalents
 * Seção "4 · Equivalentes em outras marcas": para a cor-alvo (ou para a mistura calculada),
 * mostra em cada catálogo as tintas mais parecidas (menor ΔE00) e, quando o fabricante declara
 * uma equivalência (hoje, as tabelas de conversão da AMMO), marca a linha com um selo.
 */

import { TARGET_TABS, catalogName, displayName, targetOf } from '../data/catalogs.js';
import { lineName, t } from '../i18n/index.js';
import { buildLinks } from '../data/equivalences.js';
import { deToPaint, nearest } from '../color/nearest.js';
import { acabamentoDe } from '../data/acabamento.js';
import { $, ativavel, deText, dicaAprox, eAprox, esc } from './dom.js';

/** Quantas tintas parecidas mostrar por catálogo. */
const POR_CATALOGO = 3;

/** Catálogos consultados (todas as abas de alvo, exceto a de cor livre). */
const ABAS = TARGET_TABS.filter((t) => t !== 'free');

/**
 * Classe de cor para um ΔE00: abaixo de 2 é praticamente igual, até 5 é parecida.
 * @param {number} de
 * @returns {'ok'|'mid'|'bad'}
 */
const classeDe = (de) => (de < 2 ? 'ok' : de < 5 ? 'mid' : 'bad');

/**
 * @param {import('../main.js').AppContext} ctx contexto da aplicação.
 */
export function createEquivalents(ctx) {
  const { state, save, catalogs } = ctx;
  const links = buildLinks(catalogs);
  let agendado = false;

  /**
   * Cor de partida: a cor-alvo, ou a mistura calculada se escolhida (e se houver mistura).
   * @returns {{hex: string, ref: {tab: string, code: string}|null}|null}
   */
  function partida() {
    if (state.eqFrom === 'mix') {
      const hex = ctx.ui.result.currentMix(state.model);
      return hex ? { hex, ref: null } : null;
    }
    return { hex: state.target.hex, ref: state.target.ref || null };
  }

  /**
   * Cria a linha de uma tinta candidata.
   * @param {string} aba catálogo da tinta.
   * @param {object} paint tinta.
   * @param {number} de ΔE00 até a cor de partida.
   * @param {string[]} fontes fabricantes que declaram a equivalência (vazio = só ΔE).
   */
  function linha(aba, paint, de, fontes) {
    const oficial = fontes.length > 0;
    const selo = fontes.join(' · ');
    const el = document.createElement('div');
    el.className = 'eqrow';
    const sub = paint.code + (paint.line ? ` · ${lineName(paint.line)}` : '') + (paint.series ? ` · ${paint.series}` : '');
    el.title = t('eq.tip', { code: paint.code, nome: displayName(paint), hex: paint.hex, de: de.toFixed(1), texto: deText(de) }) +
      (eAprox(paint) ? ` · ${dicaAprox(paint)}` : '') +
      (oficial ? ` · ${t('eq.tip.official', { fontes: fontes.join(t('eq.and')) })}` : '') +
      ` — ${t('eq.tip.click')}`;
    el.innerHTML =
      `<span class="sw${acabamentoDe(aba, paint).tipo === 'metallic' ? ' met' : ''}${eAprox(paint) ? ' deg' : ''}" style="background-color:${paint.hex}"></span>` +
      `<span class="eqtxt">${esc(displayName(paint))}<b>${esc(sub)}</b></span>` +
      (eAprox(paint) ? `<span class="aprox" title="${esc(dicaAprox(paint))}">≈</span>` : '') +
      (oficial ? `<span class="badge">${esc(selo)}</span>` : '') +
      `<span class="eqde ${classeDe(de)}">${de.toFixed(1)}</span>`;
    ativavel(el, () => {
      state.target = targetOf(aba, paint);
      save();
      ctx.ui.result.render();
    });
    return el;
  }

  /** Redesenha os cartões de equivalência. */
  function render() {
    agendado = false;
    const grade = $('eqGrid');
    grade.innerHTML = '';
    const o = partida();
    const info = $('eqInfo');
    if (!o) {
      info.textContent = '';
      grade.innerHTML = `<p class="muted">${esc(t('eq.empty'))}</p>`;
      return;
    }
    info.innerHTML = `<span class="chip" style="background:${o.hex}"></span> ${o.hex}`;

    for (const aba of ABAS) {
      const excluir = o.ref && o.ref.tab === aba ? (p) => p.code === o.ref.code : () => false;
      const itens = nearest(catalogs[aba], o.hex, POR_CATALOGO, excluir).map(({ paint, de }) => ({ paint, de, fontes: [] }));
      // equivalências declaradas pelo fabricante: marca as já listadas e acrescenta as demais
      if (o.ref) {
        for (const d of links.declaradasPara(o.ref.tab, o.ref.code).filter((x) => x.aba === aba)) {
          const ja = itens.find((i) => i.paint === d.paint);
          if (ja) ja.fontes = d.fontes;
          else itens.push({ paint: d.paint, de: deToPaint(d.paint, o.hex), fontes: d.fontes });
        }
      }
      const card = document.createElement('div');
      card.className = 'eq';
      const titulo = document.createElement('div');
      titulo.className = 'eqh';
      titulo.textContent = catalogName(aba);
      card.appendChild(titulo);
      itens.forEach((i) => card.appendChild(linha(aba, i.paint, i.de, i.fontes)));
      grade.appendChild(card);
    }
  }

  /** Agenda um redesenho (várias chamadas seguidas, como ao arrastar um controle, viram uma só). */
  function schedule() {
    if (agendado) return;
    agendado = true;
    // setTimeout (e não requestAnimationFrame): continua rodando com a aba em segundo plano
    setTimeout(render, 16);
  }

  /** Liga o seletor de origem. */
  function bind() {
    $('eqFrom').value = state.eqFrom;
    $('eqFrom').onchange = function () {
      state.eqFrom = this.value;
      save();
      render();
    };
  }

  return { render, schedule, bind, refresh: render };
}
