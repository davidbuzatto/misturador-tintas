/**
 * @module ui/targets
 * Seção "2 · Cor-alvo": abas de catálogos, seletor de linha (nos catálogos que
 * se dividem em linhas, como a Vallejo), busca, grade de cores e cor livre.
 */

import { TARGET_TABS, catalogLines, catalogName, displayName, targetOf } from '../data/catalogs.js';
import { acabamentoDe } from '../data/acabamento.js';
import { lineName, t } from '../i18n/index.js';
import { $, ativavel, dicaAprox, eAprox, esc } from './dom.js';

/** Valor de `state.lines[aba]` que significa "todas as linhas". */
const ALL_LINES = '*';

/**
 * @param {import('../main.js').AppContext} ctx contexto da aplicação.
 */
export function createTargets(ctx) {
  const { state, save, catalogs } = ctx;

  /**
   * Linha selecionada na aba atual: `null` se o catálogo não tem linhas,
   * `ALL_LINES` para todas, ou o nome da linha (padrão: a primeira).
   * @returns {string|null}
   */
  function currentLine() {
    if (state.tab === 'free') return null;
    const lines = catalogLines(catalogs[state.tab]);
    if (!lines.length) return null;
    const sel = state.lines[state.tab];
    return sel === ALL_LINES || lines.includes(sel) ? sel : lines[0];
  }

  /** Renderiza as abas de catálogo. */
  function renderTabs() {
    const t = $('tgtTabs');
    t.innerHTML = '';
    TARGET_TABS.forEach((k) => {
      const b = document.createElement('button');
      b.textContent = catalogName(k);
      b.setAttribute('aria-pressed', state.tab === k);
      b.onclick = () => {
        state.tab = k;
        save();
        renderTabs();
        renderLines();
        renderGrid();
      };
      t.appendChild(b);
    });
  }

  /** Renderiza o seletor de linha (oculto nos catálogos sem linhas). */
  function renderLines() {
    const box = $('tgtLines');
    box.innerHTML = '';
    const sel = currentLine();
    box.style.display = sel === null ? 'none' : '';
    if (sel === null) return;
    [[ALL_LINES, t('common.all')], ...catalogLines(catalogs[state.tab]).map((l) => [l, lineName(l)])].forEach(([valor, rotulo]) => {
      const b = document.createElement('button');
      b.textContent = rotulo;
      b.setAttribute('aria-pressed', sel === valor);
      b.onclick = () => {
        state.lines[state.tab] = valor;
        save();
        renderLines();
        renderGrid();
      };
      box.appendChild(b);
    });
  }

  /** Renderiza a grade de cores do catálogo selecionado (ou o seletor de cor livre). */
  function renderGrid() {
    const g = $('tgtGrid');
    g.innerHTML = '';
    $('freeBox').style.display = state.tab === 'free' ? '' : 'none';
    if (state.tab === 'free') {
      $('freeColor').value = state.free;
      $('freeHex').value = state.free;
      g.style.display = 'none';
      return;
    }
    g.style.display = '';
    const q = $('tgtSearch').value.trim().toLowerCase();
    const line = currentLine();
    catalogs[state.tab].forEach((p) => {
      if (line !== null && line !== ALL_LINES && p.line !== line) return;
      if (q && (p.code + ' ' + displayName(p)).toLowerCase().indexOf(q) < 0) return;
      const c = document.createElement('div');
      const escolhida = !!state.target.ref && state.target.ref.tab === state.tab && state.target.ref.code === p.code;
      const acab = acabamentoDe(state.tab, p);
      // o brilho metálico da amostra aparece sempre; a opção "mostrar acabamento" controla só a etiqueta de texto
      const { tipo, inferido } = state.showFinish ? acab : { tipo: null, inferido: false };
      c.className = 'cell' + (eAprox(p) ? ' deg' : '') + (escolhida ? ' sel' : '');
      c.setAttribute('aria-pressed', escolhida);
      c.title =
        `${p.code} ${displayName(p)} ${p.hex}` +
        (p.line ? ` · ${lineName(p.line)}${p.series ? ' / ' + p.series : ''}` : '') +
        (p.finish ? ` · ${p.finish}` : '') +
        (tipo ? ` · ${t(`fin.${tipo}`)}${inferido ? ' ' + t('cat.estimated') : ''}` : '') +
        (eAprox(p) ? ` · ${dicaAprox(p)}` : '');
      // "Todas as linhas": mostra a linha junto do código para distinguir
      const sub = p.code + (line === ALL_LINES && p.line ? ` · ${lineName(p.line)}` : '') + (p.series ? ` · ${p.series}` : '');
      c.innerHTML =
        `<span class="sw${acab.tipo === 'metallic' ? ' met' : ''}" style="background-color:${p.hex}"></span>` +
        `<span>${esc(displayName(p))}<b>${esc(sub)}</b>${tipo ? `<i class="tag">${esc(t(`fin.${tipo}`))}</i>` : ''}${eAprox(p) ? `<i class="tag">${esc(t('approx.tag'))}</i>` : ''}</span>`;
      ativavel(c, () => {
        state.target = targetOf(state.tab, p);
        save();
        ctx.ui.result.render();
        renderGrid(); // atualiza o destaque da cor escolhida
        $('resSec').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      g.appendChild(c);
    });
  }

  /**
   * Define a cor-alvo livre (ignora hex inválido).
   * @param {string} h cor "#rrggbb".
   */
  function setFree(h) {
    if (!/^#[0-9a-fA-F]{6}$/.test(h)) return;
    state.free = h.toLowerCase();
    state.target = { hex: state.free, label: t('target.free.label') };
    save();
    $('freeColor').value = state.free;
    $('freeHex').value = state.free;
    ctx.ui.result.render();
  }

  /** Liga os eventos da seção e faz a primeira renderização. */
  function bind() {
    $('freeColor').oninput = function () { setFree(this.value); };
    $('freeHex').onchange = function () { setFree(this.value.trim()); };
    $('tgtSearch').oninput = renderGrid;
    $('tgtFinish').checked = !!state.showFinish;
    $('tgtFinish').onchange = function () {
      state.showFinish = this.checked;
      save();
      renderGrid();
    };
    renderTabs();
    renderLines();
    renderGrid();
  }

  /** Redesenha tudo (usado ao trocar de idioma). */
  function refresh() {
    renderTabs();
    renderLines();
    renderGrid();
  }

  return { bind, refresh };
}
