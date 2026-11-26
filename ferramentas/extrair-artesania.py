#!/usr/bin/env python3
"""
Extrai as cores das tintas acrílicas avulsas da Artesanía Latina (20 ml) e grava `dados/artesania-cores.json`.

Fonte: a loja oficial (https://artesanialatina.net/us/en/3001-acrylic-paints). A lista de tintas (referência, nome,
página e primeira imagem) está em `ferramentas/artesania-lista.json`; os kits e o diluente ficam de fora.

Método:
  1. a primeira imagem de cada produto mostra o frasco diante de uma faixa (o "A" da marca) pintada com a cor da tinta;
  2. fora da área do frasco, a cor da faixa é a moda dos pixels que não são fundo branco (a faixa é chapada: em todas
     as tintas comuns, 93% ou mais dos pixels da faixa ficam a poucos tons dessa cor);
  3. conferência com o frasco: a cor do líquido, logo abaixo do rótulo, quase sempre bate com a faixa;
  4. metálicas (Aluminium, Gold, Copper, Gun Metal Grey): a faixa é um degradê de brilho, então a cor vem do frasco;
  5. Pen Duick Green: a faixa (verde-água bem claro) não bate com o frasco nem com a foto real do frasco (2ª imagem,
     verde médio); a cor vem dessa foto e fica marcada como aproximada.

Uso:  python ferramentas/extrair-artesania.py [--saida dados/artesania-cores.json]
Requer: Pillow e acesso à internet (baixa as imagens da loja).
"""
import argparse
import collections
import io
import json
import statistics
import urllib.request
from pathlib import Path

from PIL import Image

METALICAS = {'27760', '27761', '27762', '27763'}
# tintas cuja faixa não serve: referência -> imagem (da própria loja) de onde a cor é lida, no frasco
# (a imagem tem fundo cinza-claro, então a região do líquido, abaixo do rótulo, vai fixa: x0, y0, x1, y1 em pixels)
FOTO_DO_FRASCO = {'27756': ('https://artesanialatina.net/us/6279-large_default/water-based-paint-pen-duick-green-20-ml.jpg', (350, 760, 520, 795))}


def baixar(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return Image.open(io.BytesIO(r.read())).convert('RGB')


def hexa(rgb):
    return '#%02x%02x%02x' % rgb


def mediana(px):
    return tuple(int(statistics.median(p[i] for p in px)) for i in range(3))


def cor_da_faixa(img):
    """Moda (em degraus de 6) dos pixels que não são fundo, fora da área do frasco; devolve a cor e quanto da faixa é chapada."""
    sm = img.resize((222, 250))
    px = [sm.getpixel((x, y)) for y in range(250) for x in range(222) if not (60 < x < 160 and y > 40)]
    faixa = [p for p in px if sum(255 - c for c in p) > 18]
    q = collections.Counter((p[0] // 6, p[1] // 6, p[2] // 6) for p in faixa).most_common(1)[0][0]
    c = [v * 6 + 3 for v in q]
    perto = [p for p in faixa if max(abs(p[i] - c[i]) for i in range(3)) <= 14]
    return mediana(perto), len(perto) / len(faixa)


def cor_do_frasco(img):
    """Mediana do líquido no frasco, logo abaixo do rótulo (o frasco fica no centro da imagem)."""
    w, h = img.size
    cx = w // 2
    col = [img.getpixel((cx, y)) for y in range(h)]
    fundo = max(y for y, p in enumerate(col) if sum(255 - c for c in p) > 30)
    reg = [img.getpixel((x, y)) for y in range(fundo - 45, fundo - 15) for x in range(cx - 44, cx + 46)]
    return mediana(reg)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lista', default=str(Path(__file__).with_name('artesania-lista.json')))
    ap.add_argument('--saida', default='dados/artesania-cores.json')
    a = ap.parse_args()
    saida = []
    for d in json.loads(Path(a.lista).read_text(encoding='utf-8')):
        img = baixar(d['img'])
        item = {'code': d['code'], 'name': d['name']}
        if d['code'] in METALICAS:
            item.update(hex=hexa(cor_do_frasco(img)), finish='Metallic')
        elif d['code'] in FOTO_DO_FRASCO:
            url, (x0, y0, x1, y1) = FOTO_DO_FRASCO[d['code']]
            foto = baixar(url)
            cor = mediana([foto.getpixel((x, y)) for y in range(y0, y1) for x in range(x0, x1)])
            item.update(hex=hexa(cor), finish='Semi-matte', aprox='faixa')
        else:
            cor, chapada = cor_da_faixa(img)
            if chapada < 0.9:
                raise SystemExit(f"{d['code']}: faixa pouco uniforme ({chapada:.0%}), conferir à mão")
            item.update(hex=hexa(cor), finish='Semi-matte')
        saida.append(item)
        print(item['code'], item['name'], item['hex'], item.get('aprox', ''))
    Path(a.saida).write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding='utf-8')
    print(len(saida), 'cores ->', a.saida)


if __name__ == '__main__':
    main()
