# Extratores de dados

Scripts em Node (sem dependências npm) que geram os JSONs de `dados/` a partir das fontes originais. **Não são
necessários para usar o aplicativo**: os JSONs já estão no repositório. Servem para refazer ou atualizar um catálogo.

| Script | Fonte | Requer | Saída |
|---|---|---|---|
| `extrair-fs595.mjs` | site <https://ams-std-595-color.com/> | rede | `dados/fs595-cores.json` |
| `extrair-ral.mjs` | 9 páginas de <https://www.ralcolorchart.com/ral-classic/> | rede | `dados/ral-cores.json` |
| `extrair-vallejo.mjs "arquivo.pdf"` | *Catalogue 2026* (PDF) | poppler | `dados/vallejo-cores.json` |
| `extrair-mrcolor.mjs "arquivo.pdf"` | *Mr.Hobby Catalogue 2024-2025* (PDF) | poppler | `dados/mrcolor-cores.json` |
| `extrair-ak.mjs "arquivo.pdf"` | catálogo AK Real Colors (PDF) | poppler | `dados/ak-cores.json` |
| `extrair-ammo.mjs "arquivo.pdf"` | *AMMO Catalogue 2024* (PDF) | poppler | `dados/ammo-cores.json` |
| `extrair-humbrol.mjs` | imagens do site <https://uk.humbrol.com/catalogue> | rede, ffmpeg | `dados/humbrol-cores.json` |
| `extrair-scale75.mjs` | site oficial <https://scale75.com> (11 coleções) | rede (Node puro; usa `png.mjs`) | `dados/scale75-cores.json`, `scale75-medidas.json`, `scale75-conferir.md` |
| `extrair-tomcolors.mjs` | loja oficial <https://www.tomcolors.com.br> (20 páginas de categoria) | rede, ffmpeg | `dados/tomcolors-cores.json`, `tomcolors-medidas.json`, `tomcolors-conferir.md` |
| `extrair-talento.py` | catálogo de modelismo em PDF da Talento (V23-4), mais `talento-nomes.json` | Python com pdfplumber, Pillow e `pdftoppm` (poppler) | `dados/talento-cores.json` |
| `extrair-phoenix.mjs` | site da loja <https://phoenix-special-colors.com.br/products> | rede (Node puro) | `dados/phoenix-cores.json` |

"poppler" são os programas `pdftohtml` e `pdftoppm`; `ffmpeg` decodifica as imagens da Humbrol. Todos precisam estar no `PATH`.

## Como cada um funciona

- **PDFs (Vallejo, Mr. Hobby, AK, AMMO):** o texto posicionado (`pdftohtml -xml`) dá a posição do código de cada cor;
  a página é renderizada (`pdftoppm`) e a cor é a **mediana dos pixels** de uma caixa dentro da amostra impressa, num
  ponto fixo em relação ao código. Amostras com muita variação interna (degradês, metálicos) recebem `degrade: true`.
  Cada script confere a própria saída (contagens, códigos únicos) e imprime avisos.
- **Sites (FS 595, RAL):** a cor já está no HTML (`background-color`), então basta ler. O RAL confere a contagem de
  cada página com a que o site informa.
- **Humbrol:** a lista de produtos é carregada por JavaScript e foi coletada no navegador (150 produtos, 13 páginas);
  está em `humbrol-lista.json` (SKU, rótulo e caminho da imagem). O script baixa cada imagem (uma por vez, com pausa) e
  tira a mediana de uma caixa dentro do respingo de tinta.
- **Scale75:** a loja é Shopify, e cada coleção tem um JSON público (`/en/collections/<coleção>/products.json`) com SKU,
  nome e imagens. A foto da **amostra** é um traço de pincel em PNG com fundo transparente, e o script a procura entre
  todas as imagens do produto (a posição varia). O canal alfa isola a tinta; recua-se 4 px das bordas e a cor é a
  **mediana do terço esquerdo do traço**, onde a tinta está mais carregada (para a direita ela vai esmaecendo, como num
  pincel). As imagens ficam num cache em disco, com ritmo lento e espera maior se o CDN responder 403/429.
  Casos especiais: imagens sem transparência (Artist) são separadas do fundo por diferença de cor; amostras
  semitransparentes recebem `aprox: "diluida"`; a **Drop & Paint** e a **Scalecolor Games** não têm amostra, então a cor é
  lida do líquido na foto do frasco (faixa de 88% a 96% da altura) e recebe `aprox: "frasco"` — na calibração contra o
  traço, esse método erra em mediana ΔE 6 a 8, sem viés, o que serve para consulta e não para calcular misturas. O script
  também grava `scale75-medidas.json` (cor da esquerda, do centro e da direita, e avisos por tinta) e
  `scale75-conferir.md`, a lista curta de tintas para conferir à mão no site (amostra diluída, traço minúsculo, foto
  trocada ou sem amostra utilizável). Como não há mais lista coletada no navegador, rodar de novo basta
  `node ferramentas/extrair-scale75.mjs`.
- **Tom Colors:** a loja é Tray (páginas em ISO-8859-1), e as páginas de categoria misturam a lista real com carrosséis
  de destaque; o script lê só a lista (`showcase-catalog`), segue a paginação (`?pg=N`) e junta os produtos pelo endereço,
  porque o mesmo produto aparece em várias categorias. Só entram tintas (`/tintas-acrilicas/` e a linha UP); sets,
  vernizes, diluentes e máscaras ficam de fora. As **linhas** vêm do prefixo do código: `TC-nnnn` (Acrylic Colors) e
  `TCUP-nn` (UP). **Cada anúncio tem várias fotos** (a da lista é só a primeira, e a imagem-modelo com a amostra pode ser
  qualquer uma): o script lê a página do produto, baixa todas as fotos com o id do produto, classifica cada uma e mede a
  melhor. Layouts: **A** (fundo branco, traço de pincel chapado: mediana do maior componente não branco, recuado das
  bordas), **B** (série RLM, mancha redonda sobre foto escura: caixa no centro da mancha), **D** (linha UP: fundo branco,
  logo "UP" dourado e um círculo de cor chapada: caixa no centro do círculo) e **C** (foto de cabeça pintada, sem amostra).
  Só quando um anúncio não tem imagem-modelo é que se recorre à cabeça pintada das Skin Tones (caixa na testa, `aprox:
  "foto"`, erro de ΔE 6,6 na validação com a RLM 61) ou, na UP, ao líquido no ombro do frasco (`aprox: "frasco"`, que não
  chega a ser usado hoje). **A cor final da linha UP é a tinta aplicada num cartão branco**, que aparece em fotos de cada anúncio (a poça sob o frasco é mais escura nas cores frias, e o círculo do anúncio, mais escuro ainda: nos verdes, azuis, roxos e marrons a diferença chega a ΔE 20 a 35). O script mede o maior componente "não branco" cercado de branco; onde a tinta encosta na luva ou é clara demais, a caixa foi marcada à mão. As três fontes de cada tinta ficam em `tomcolors-up-fontes.json` (círculo, poça amostrada à mão e cartão). Cinco cores da UP (TCUP-09, 10, 13, 14 e 20) só aparecem no conjunto e não têm foto de cartão; ficam em `tomcolors-extras.json`: os dois vermelhos usam a poça (as fontes concordam nos vermelhos) e as três escuras e frias têm a cor **estimada** por regressão em Lab (poça → cartão, aprendida nas outras 18; erro típico de ΔE 7 a 20) e `aprox: "estimada"`. Brancos sobre fundo branco e as imagens sem amostra vão para
  `tomcolors-conferir.md`; as cores conferidas à mão ficam em `tomcolors-correcoes.json` e valem sobre a medida (também
  criam a cor das tintas sem amostra). Como o JPEG é decodificado pelo `ffmpeg`, ele precisa estar no `PATH`.
- **Phoenix:** o site é um aplicativo React (Vite) e o catálogo inteiro está **embutido no JavaScript empacotado**
  (`assets/index-*.js`) como um arranjo de objetos `{id, name, color, category, standard}`. O script baixa a página, acha o
  arquivo, localiza o arranjo pelo primeiro objeto (`id:1`) e lê cada objeto sem executar o código. Não há imagens de
  tinta: a cor é o hexadecimal que a loja escolheu (diferença mediana de ΔE 4,1 para o nosso FS 595, até 13, e 2,5 para o
  RAL). Entram as 597 cores únicas dos 10 padrões; ficam de fora os pigmentos em pó e os sets. O **código** ganha o prefixo
  do padrão (`FS 11136`, `RAL 1000`, `USN #5`); onde o site não traz código (Regia Aeronautica, IJN…), o nome é o código;
  números FS repetidos com nomes diferentes entram no código. Toda cor existe em Duco e em poliéster (30 ou 60 ml, fosco,
  acetinado ou brilhante), por isso há duas linhas de ingredientes. Se o site mudar a estrutura, o script avisa que não
  achou o arquivo ou o arranjo.
- **Talento:** o PDF do catálogo tem as amostras como pinceladas vetoriais (curvas), mas **os textos são curvas também**,
  sem camada de texto. O script acha cada pincelada pelo tamanho e pelo número de pontos da curva, ordena por linha e
  coluna e lê a cor no miolo da amostra do PDF renderizado (o PDF está em CMYK; a renderização faz a conversão). Códigos e
  nomes foram digitados do catálogo em `talento-nomes.json`, na mesma ordem das amostras, e o script confere se a contagem
  bate. Duas pinceladas metálicas com textura são imagens e a do Branco das Artes só tem contorno; ambos os casos entram.
  Ficam de fora os pigmentos em pó, os kits (repetem cores já listadas) e os produtos de diorama. As metálicas das Artes
  repetem os números das de modelismo (400, 427), então o código ganha o prefixo "Artes "; as Clear não têm número, e o
  nome é o código. 163, 164 e 205 são as brilhantes (a nota "*acabamento brilhante" do catálogo); as neon das Artes viram
  acabamento `Fluo` e as Clear e Speed, `Clear`, e nenhuma dessas entra nas misturas.
- **Equivalências:** os scripts da AK (págs. 16–22) e da AMMO (págs. 97–105) também leem as tabelas de conversão e
  gravam `ref` (referência de norma) e `equiv` (equivalências em outras marcas).

## Limites

São aproximações de tela: amostras impressas ou fotografadas, cada fonte com sua calibração. Metálicos, translúcidos
e fluorescentes são os que mais se afastam. Os catálogos mudam; confira a edição antes de reextrair. A **Acrilex**,
a **Tamiya** e a **Revell** foram extraídas com métodos anteriores (veja [`../legado/README.md`](../legado/README.md)
e o README principal).
