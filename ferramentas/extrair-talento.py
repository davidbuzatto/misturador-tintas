#!/usr/bin/env python3
"""
Extrai as cores do catálogo de modelismo da Talento (PDF "CATALOGO MODELISMO V23-4") para `dados/talento-cores.json`.

No PDF, as amostras são pinceladas vetoriais (curvas com ~320 pontos) e os textos são curvas também, sem texto para
extrair. Por isso:
  - a posição de cada amostra vem das curvas (pdfplumber);
  - a cor é o valor visto no PDF renderizado (pdftoppm, do poppler), lido no miolo da pincelada. As cores do PDF estão
    em CMYK; a renderização faz a conversão para RGB como um leitor de PDF faria;
  - os códigos e nomes vêm de `talento-nomes.json`, digitados do catálogo, na ordem de leitura das amostras.

Uso:  python ferramentas/extrair-talento.py "CATALOGO MODELISMO V23-4.pdf" [--saida dados/talento-cores.json]
Requer: pdfplumber, Pillow e o pdftoppm (poppler) no PATH.
"""
import argparse
import json
import os
import re
import statistics
import subprocess
import sys
import tempfile

import pdfplumber
from PIL import Image

DPI = 200
AQUI = os.path.dirname(os.path.abspath(__file__))

# Ordem das amostras no PDF: (página, seção de talento-nomes.json ou None para ignorar, quantidade).
# Ignoradas: os pigmentos em pó (página 7), que não são tintas.
SEQUENCIA = [
    (3, 'Acrylic Color', 72),
    (4, 'Acrylic Color', 76),
    (5, 'Metallic', 14),
    (5, 'Game', 19),
    (6, 'Artes', 71),
    (7, 'Metallic Artes', 14),
    (7, None, 16),
    (7, 'Clear', 7),
    (8, 'Speed', 9),
]


def amostras_da_pagina(pagina):
    """Caixas (pt) das amostras de uma página: curvas de pincelada e as imagens de pincelada com textura."""
    caixas = []
    for c in pagina.curves:
        w, h = c['x1'] - c['x0'], c['bottom'] - c['top']
        if 44 <= w <= 70 and 24 <= h <= 42 and len(c['pts']) > 100:
            caixas.append((c['x0'], c['top'], c['x1'], c['bottom']))
    for im in pagina.images:
        w, h = im['x1'] - im['x0'], im['bottom'] - im['top']
        if 50 <= w <= 60 and 28 <= h <= 36:
            caixas.append((im['x0'], im['top'], im['x1'], im['bottom']))
    # tira repetidas (a mesma pincelada pode ter curva e imagem)
    unicas = []
    for b in sorted(caixas):
        if not any(abs(b[0] - u[0]) < 6 and abs(b[1] - u[1]) < 6 for u in unicas):
            unicas.append(b)
    # ordem de leitura: linhas (topo parecido) e, dentro delas, da esquerda para a direita
    unicas.sort(key=lambda b: b[1])
    linhas, atual = [], []
    for b in unicas:
        if atual and b[1] - atual[0][1] > 20:
            linhas.append(atual)
            atual = []
        atual.append(b)
    if atual:
        linhas.append(atual)
    return [b for linha in linhas for b in sorted(linha, key=lambda b: b[0])]


def cor_da_amostra(img, caixa, escala):
    """Cor do miolo da pincelada (mediana por canal), em hexadecimal."""
    x0, y0, x1, y1 = caixa
    w, h = x1 - x0, y1 - y0
    box = (int((x0 + w * 0.30) * escala), int((y0 + h * 0.35) * escala), int((x0 + w * 0.70) * escala), int((y0 + h * 0.65) * escala))
    px = list(img.crop(box).getdata())
    r, g, b = (int(statistics.median(c[i] for c in px)) for i in range(3))
    return '#%02x%02x%02x' % (r, g, b)


def principal():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('pdf', help='PDF do catálogo de modelismo da Talento')
    ap.add_argument('--saida', default=os.path.join(AQUI, '..', 'dados', 'talento-cores.json'))
    args = ap.parse_args()

    nomes = json.load(open(os.path.join(AQUI, 'talento-nomes.json'), encoding='utf8'))
    pdf = pdfplumber.open(args.pdf)
    escala = DPI / 72
    cores = []
    usadas = {}
    with tempfile.TemporaryDirectory() as tmp:
        for pg in sorted({p for p, _, _ in SEQUENCIA}):
            subprocess.run(['pdftoppm', '-r', str(DPI), '-f', str(pg), '-l', str(pg), '-png', args.pdf, os.path.join(tmp, 'p')], check=True)
        imagens = {}
        for pg in sorted({p for p, _, _ in SEQUENCIA}):
            arq = [f for f in os.listdir(tmp) if re.fullmatch(r'p-0*%d\.png' % pg, f)][0]
            imagens[pg] = Image.open(os.path.join(tmp, arq)).convert('RGB')

        caixas = {}
        for pg, secao, qtd in SEQUENCIA:
            if pg not in caixas:
                caixas[pg] = amostras_da_pagina(pdf.pages[pg - 1])
            if len(caixas[pg]) < qtd:
                sys.exit(f'página {pg}: esperava {qtd} amostras para "{secao}", restam {len(caixas[pg])}')
            lote, caixas[pg] = caixas[pg][:qtd], caixas[pg][qtd:]
            if secao is None:
                continue
            sec = nomes[secao]
            ini = usadas.get(secao, 0)
            itens = sec['itens'][ini:ini + qtd]
            if len(itens) != qtd:
                sys.exit(f'seção "{secao}": faltam nomes ({len(itens)} de {qtd})')
            usadas[secao] = ini + qtd
            for caixa, item in zip(lote, itens):
                m = re.match(r'^([A-Z]?\d+)\s+(.+)$', item)
                codigo, nome = (m.group(1), m.group(2)) if m else (item, item)
                acabamento = sec['finish']
                if secao == 'Acrylic Color' and re.search(r'\bgloss\b', item, re.I):
                    acabamento = 'Gloss'
                if secao == 'Artes' and re.search(r'neon', item, re.I):
                    acabamento = 'Fluo'
                cores.append({
                    'code': sec.get('prefixo', '') + codigo,
                    'name': nome,
                    'line': secao,
                    'hex': cor_da_amostra(imagens[pg], caixa, escala),
                    'finish': acabamento,
                })
    for pg, resto in caixas.items():
        if resto:
            print(f'aviso: página {pg} tem {len(resto)} amostras sem uso', file=sys.stderr)
    for secao, n in usadas.items():
        if n != len(nomes[secao]['itens']):
            sys.exit(f'seção "{secao}": {n} amostras para {len(nomes[secao]["itens"])} nomes')
    codigos = [c['code'] for c in cores]
    if len(set(codigos)) != len(codigos):
        sys.exit('códigos repetidos')
    os.makedirs(os.path.dirname(os.path.abspath(args.saida)), exist_ok=True)
    with open(args.saida, 'w', encoding='utf8', newline='\n') as f:
        f.write('[\n' + ',\n'.join('  ' + json.dumps(c, ensure_ascii=False) for c in cores) + '\n]\n')
    por_linha = {}
    for c in cores:
        por_linha[c['line']] = por_linha.get(c['line'], 0) + 1
    print(len(cores), 'cores:', por_linha)


if __name__ == '__main__':
    principal()
