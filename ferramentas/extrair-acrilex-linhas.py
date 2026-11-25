#!/usr/bin/env python3
"""
Extrai as cores das demais linhas acrílicas da Acrilex (Brilhante, Neon, Metal Colors, Chalk e Acrylic Colors)
do "Catálogo Manualidades 2025" (PDF) e grava `dados/acrilex-linhas-cores.json`.

A cartela da Tinta Acrílica Fosca (págs. 36-37) continua em `dados/acrilex-cores-oficial.json` (método em `legado/`).

Método (o mesmo da Fosca, com mais conferências):
  1. o texto do PDF é real: a posição de cada código (3 dígitos) sai de `pdfplumber`; os nomes foram transcritos para
     `ferramentas/acrilex-nomes.json` (o que está impresso, conferido na imagem);
  2. as amostras são imagens (pinceladas); a página é renderizada a 200 dpi (`pdftoppm`, que converte CMYK→RGB) e a cor
     é a mediana dos pixels da amostra que fica logo acima do código, sem o fundo de papel;
  3. amostras brancas (quase sem pixels fora do papel) viram branco da própria amostra, medida pelo contorno.

Uso:  python ferramentas/extrair-acrilex-linhas.py "<catalogo.pdf>" [--saida dados/acrilex-linhas-cores.json] [--diagnostico pasta]
Requer: pdfplumber, Pillow e pdftoppm (poppler).
"""
import argparse
import json
import re
import statistics
import subprocess
import sys
import tempfile
from pathlib import Path

import pdfplumber
from PIL import Image

DPI = 200
ESCALA = DPI / 72

CODIGO = re.compile(r'^\d{3}$')


def renderizar(pdf: Path, pagina: int, pasta: Path) -> Image.Image:
    base = pasta / f'p{pagina}'
    subprocess.run(['pdftoppm', '-f', str(pagina), '-l', str(pagina), '-r', str(DPI), '-png', '-singlefile', str(pdf), str(base)], check=True)
    return Image.open(str(base) + '.png').convert('RGB')


def mediana(pixels):
    return tuple(int(statistics.median(p[i] for p in pixels)) for i in range(3))


def hex_de(rgb):
    return '#%02x%02x%02x' % rgb


def delta_e(a, b):
    """Diferença de cor CIE76 entre dois hex (basta para comparar duas medidas da mesma amostra)."""
    def lab(h):
        r, g, bl = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
        lin = lambda c: ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
        r, g, bl = lin(r), lin(g), lin(bl)
        x = (0.4124 * r + 0.3576 * g + 0.1805 * bl) / 0.95047
        y = 0.2126 * r + 0.7152 * g + 0.0722 * bl
        z = (0.0193 * r + 0.1192 * g + 0.9505 * bl) / 1.08883
        f = lambda v: v ** (1 / 3) if v > 0.008856 else 7.787 * v + 16 / 116
        return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))
    return sum((p - q) ** 2 for p, q in zip(lab(a), lab(b))) ** 0.5


def papel(p):
    return p[0] >= 250 and p[1] >= 250 and p[2] >= 250


def cor_da_regiao(img, x0, y0, x1, y1):
    """Mediana dos pixels da região que não são papel; se quase tudo é papel, é uma tinta branca (mediana de tudo)."""
    px = [img.getpixel((x, y)) for y in range(max(0, int(y0)), min(img.height, int(y1))) for x in range(max(0, int(x0)), min(img.width, int(x1)))]
    tinta = [p for p in px if not papel(p)]
    if len(tinta) < 0.15 * len(px):
        return mediana(px), True
    return mediana(tinta), False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf')
    ap.add_argument('--nomes', default=str(Path(__file__).with_name('acrilex-nomes.json')))
    ap.add_argument('--saida', default='dados/acrilex-linhas-cores.json')
    a = ap.parse_args()
    pdf = Path(a.pdf)
    secoes = json.loads(Path(a.nomes).read_text(encoding='utf-8'))['secoes']
    saida, vistos = [], set()
    with tempfile.TemporaryDirectory() as tmp, pdfplumber.open(pdf) as doc:
        imagens = {}
        for sec in secoes:
            pg = sec['pagina']
            if pg not in imagens:
                imagens[pg] = renderizar(pdf, pg, Path(tmp))
            palavras = doc.pages[pg - 1].extract_words()
            for item in sec['itens']:
                codigo, nome = item.split(' ', 1)
                achados = [w for w in palavras if w['text'] == codigo
                           and sec.get('de', 0) <= w['top'] <= sec.get('ate', 9999)]
                if not achados:
                    sys.exit(f'código {codigo} não encontrado na pág. {pg}')
                w = min(achados, key=lambda w: w['top'])
                if sec['janela'] == 'tubo':  # códigos alinhados à direita da coluna; a pincelada fica à esquerda dele
                    x0, x1, y0, y1 = w['x1'] - 62, w['x1'] - 10, w['top'] - 34, w['top'] - 4
                else:
                    x0, x1, y0, y1 = w['x0'] - 4, w['x0'] + 40, w['top'] - 34, w['top'] - 12
                rgb, branca = cor_da_regiao(imagens[pg], x0 * ESCALA, y0 * ESCALA, x1 * ESCALA, y1 * ESCALA)
                # conferência: uma segunda janela, deslocada, tem de dar quase a mesma cor; se não, a amostra tem brilho
                # ou degradê (as "gotas" da Acrylic Colors) e a cor fica marcada como aproximada
                if sec['janela'] == 'tubo':
                    alt = (w['x1'] - 48, w['top'] - 30, w['x1'] - 18, w['top'] - 10)
                else:
                    alt = (w['x0'] + 6, w['top'] - 30, w['x0'] + 30, w['top'] - 16)
                rgb2, _ = cor_da_regiao(imagens[pg], *[v * ESCALA for v in alt])
                chave = sec['prefixo'] + codigo
                if chave in vistos:
                    sys.exit(f'código repetido: {chave}')
                vistos.add(chave)
                inst = delta_e(hex_de(rgb), hex_de(rgb2)) > 6
                saida.append({'code': chave, 'name': nome, 'line': sec['linha'], 'hex': hex_de(rgb), 'finish': sec['finish'], **({'aprox': 'gota'} if inst else {})})
    Path(a.saida).write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding='utf-8')
    print(len(saida), 'cores ->', a.saida)


if __name__ == '__main__':
    main()
