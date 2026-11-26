#!/usr/bin/env python3
"""
Extrai as cores das tintas acrílicas avulsas da OcCre (20 ml) e grava `dados/occre-cores.json`.

Fontes:
  - a loja oficial (https://occre.com/en/collections/pintura), lida pelo `products.json` da coleção (Shopify);
  - a tabela de referências da OcCre (tintas × modelos), que separa as tintas dos acabamentos.

Quais produtos entram: as 23 tintas da tabela, todas vendidas avulsas em 20 ml (`TINTAS`, abaixo). Ficam de fora os
acabamentos da tabela (Betún de Judea 19417, Imprimación/primer 19418, Barniz satinado 19419 e os tintes Sapelli, Nogal,
Pino e Roble 19420–19423), os kits ("Paint Pack"), a massa, a cola e os pincéis.

Cor: a primeira imagem de cada tinta tem uma amostra num círculo (canto superior esquerdo, imagem de 1500×1500). Nas tintas
comuns o círculo é chapado (cor digital escolhida pela marca); a cor é a mediana do disco central. Ouro, Cobre e Prata
têm um círculo em degradê (brilho metálico) e ficam como metálicas, só para consulta.

Uso:  python ferramentas/extrair-occre.py [--produtos products.json] [--saida dados/occre-cores.json]
Requer: Pillow (com suporte a WebP) e acesso à internet.
"""
import argparse
import io
import json
import statistics
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

LOJA = 'https://occre.com/en/collections/pintura/products.json?limit=250'

# referência (20 ml) -> nome em inglês (o da loja; entre parênteses, o do rótulo quando é diferente)
TINTAS = {
    '19395': 'White', '19396': 'Black', '19397': 'Bone', '19398': 'Ochre', '19399': 'Yellow', '19400': 'Dark Brown',
    '19401': 'Orange', '19402': 'Red', '19403': 'Light Blue', '19404': 'Medium Blue', '19405': 'Dark Blue',
    '19406': 'Light Green', '19407': 'Dark Green', '19408': 'Gold', '19409': 'Copper', '19410': 'Silver',
    '19411': 'Dark Red', '19412': 'Light Grey (Grey-1)', '19413': 'Medium Grey (Grey-2)', '19414': 'Dark Grey (Grey-3)',
    '19415': 'Light Ochre', '19416': 'Olive Green', '19424': 'Royal Blue',
}
METALICAS = {'19408', '19409', '19410'}
CENTRO, RAIO = (485, 360), 90  # disco central da amostra, em pixels da imagem de 1500×1500


def baixar(url, tentativas=5):
    """Baixa uma URL; a loja limita pedidos seguidos (HTTP 429), então espera e tenta de novo."""
    for i in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == tentativas - 1:
                raise
            time.sleep(10 * (i + 1))


def cor_do_circulo(img):
    cx, cy = CENTRO
    px = [img.getpixel((x, y)) for x in range(cx - RAIO, cx + RAIO) for y in range(cy - RAIO, cy + RAIO)
          if (x - cx) ** 2 + (y - cy) ** 2 < RAIO ** 2]
    med = tuple(int(statistics.median(p[i] for p in px)) for i in range(3))
    desvio = sum(statistics.pstdev(p[i] for p in px) for i in range(3)) / 3
    return med, desvio


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--saida', default='dados/occre-cores.json')
    ap.add_argument('--produtos', help='products.json da coleção já baixado (em vez de pedir à loja)')
    a = ap.parse_args()
    bruto = Path(a.produtos).read_bytes() if a.produtos else baixar(LOJA)
    produtos = json.loads(bruto)['products']
    por_ref = {p['variants'][0]['sku']: p for p in produtos}
    faltam = [r for r in TINTAS if r not in por_ref]
    if faltam:
        raise SystemExit(f'tintas da tabela sem produto na loja: {faltam}')
    saida = []
    for ref, nome in sorted(TINTAS.items()):
        p = por_ref[ref]
        img = Image.open(io.BytesIO(baixar(p['images'][0]['src']))).convert('RGB')
        if img.size != (1500, 1500):
            raise SystemExit(f'{ref}: imagem com tamanho inesperado {img.size}, conferir a posição do círculo')
        rgb, desvio = cor_do_circulo(img)
        metal = ref in METALICAS
        if not metal and desvio > 2:
            raise SystemExit(f'{ref}: o círculo não é chapado (desvio {desvio:.1f}), conferir à mão')
        item = {'code': ref, 'name': nome, 'hex': '#%02x%02x%02x' % rgb}
        # a loja não informa o acabamento; as tintas comuns são foscas (tinta para modelismo naval, como a Artesanía Latina)
        item['finish'] = 'Metallic' if metal else 'Matte'
        saida.append(item)
        print(ref, nome, item['hex'])
    Path(a.saida).write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding='utf-8')
    print(len(saida), 'cores ->', a.saida)


if __name__ == '__main__':
    main()
