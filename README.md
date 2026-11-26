# Misturador de Tintas

**Português** · [English](README.en.md)

Aplicativo web para **plastimodelismo**: você escolhe a linha de tintas que tem (Acrilex, Tamiya, Vallejo, Mr. Hobby,
Humbrol, AK, AMMO, Scale75, Tom Colors, Phoenix, Talento, Artesanía Latina, OcCre…), a cor que quer alcançar (de qualquer um de 16 catálogos, inclusive FS 595 e RAL) e o app calcula a
mistura. A tinta é tratada como **pigmento** (modelo espectral de Kubelka-Munk), não como uma média de RGB, e é isso que
faz a previsão chegar perto do que acontece na bancada. JavaScript puro, módulos ES, **sem build e sem dependências**.

## O que faz

- **Mistura e compara:** monte uma receita com quantidades e "força" de cada tinta; veja a cor calculada, o ΔE00
  (diferença de cor percebida) até o alvo e quatro modelos de mistura lado a lado (pigmento × RGB).
- **Sugere receitas:** a busca automática encontra misturas de 1 a 4 tintas que se aproximam do alvo, opcionalmente só com
  as tintas que você tem.
- **Cor-alvo de qualquer catálogo:** mais de 5.000 cores em 16 catálogos, ou uma cor livre (a opção "mostrar acabamento" exibe fosca, brilhante, metálica etc. nas amostras).
- **Equivalentes em outras marcas:** para o alvo (ou para a mistura calculada), as tintas mais parecidas em cada marca
  (por ΔE00) e, quando o fabricante declara a equivalência, um selo **AMMO** ou **AK**.
- **Catálogo completo (só consulta):** botão no topo da página que abre todas as tintas de cada marca, inclusive as metálicas,
  transparentes e de efeito que não entram nas misturas. Filtros por marca, linha, acabamento e busca; ao clicar numa tinta,
  detalhes e as parecidas em outras marcas (para uma metálica, comparam-se só metálicas). Não altera nada no app.
- **Receitas salvas:** guarde receitas, registre a cor realmente obtida para medir o erro do modelo. O **backup** (JSON) guarda receitas e as tintas que você tem, e a importação soma ao que já existe, sem duplicar.
- **Português e inglês**, tema claro/escuro automático, uso por teclado e em tela de celular.

## Como usar

No topo da página há o guia **"Como usar, passo a passo"**, com um exemplo completo (reproduzir a Tamiya XF-18) e o botão **"Fazer o exemplo para mim"**, que executa os primeiros passos na tela. Em resumo:

1. Em **1 · Mistura**, escolha a marca e a linha das tintas que você tem (cada receita usa uma linha só) e adicione
   tintas com "adicionar tinta".
2. Em **2 · Cor-alvo**, escolha a cor que quer reproduzir (abas por marca; "Livre" aceita qualquer cor).
3. Em **3 · Resultado**, veja a cor calculada e o ΔE. Use "sugerir mistura automática" para o app procurar a receita.
4. Em **4 · Equivalentes**, veja as tintas mais parecidas em outras marcas.
5. Salve a receita e, depois de misturar de verdade, registre a "cor obtida".

Na primeira visita o app abre limpo (sem mistura nem receitas, com a Tamiya X-2 White como cor-alvo) e o guia começa fechado. Os dados ficam só no seu navegador (nada é enviado a servidor algum); o botão **"Restaurar configurações"**, no topo, apaga receitas, "tenho" e preferências e volta ao estado inicial. Atalhos: nos seletores de cor, **Enter** escolhe;
na janela de tintas, a tecla **T** marca "tenho esta tinta" (também botão direito ou toque longo), **marcar as visíveis** marca de uma vez as tintas filtradas pela busca e **Esc** fecha.

## Instalar no celular ou no computador

O app é instalável (PWA) e, depois da primeira visita, funciona sem internet (útil na bancada). No Chrome ou Edge, use
"Instalar app" no menu (ou o ícone de instalar na barra de endereço); no Android, "Adicionar à tela inicial"; no iPhone
(Safari), Compartilhar → "Adicionar à Tela de Início". As receitas e as tintas marcadas ficam no armazenamento do
navegador daquele aparelho, então use "exportar backup" para levá-las de um aparelho a outro. Uma versão nova do app
aparece na abertura seguinte à publicação.

## Como executar

Módulos ES e `fetch` não funcionam abrindo o `index.html` direto do disco (`file://`). Sirva a pasta por HTTP:

```bash
node tools/servidor.mjs        # http://localhost:8080/  (porta opcional: node tools/servidor.mjs 3000)
```

Qualquer servidor estático serve (por exemplo, a extensão Live Server do VS Code). Testes: `npm test` (Node 22 ou superior,
sem dependências). O site é publicado com GitHub Pages por `.github/workflows/pages.yml`, que roda os testes antes.

## Catálogos e origem das cores

Todas as cores são **aproximações de tela**, extraídas de catálogos em PDF, de sites dos fabricantes ou de imagens de
produtos. Metálicos, translúcidos e fluorescentes são os que mais se afastam; eles aparecem com borda tracejada quando
a amostra original é um degradê. As tintas marcadas **≈ aprox.** têm cor aproximada (degradê, lida do frasco ou de uma
amostra diluída): servem para consulta, mas não entram como ingredientes das misturas.

| Catálogo | Cores | Linhas | Fonte |
|---|---:|---|---|
| Tamiya | 181 | Acrílica, Lacquer | imagens do site oficial (cor dominante da região central) |
| Revell | 171 | Aqua Color, Email Color | site oficial (mediana da esfera de cor) |
| FS 595 (AMS-STD-595) | 653 | — | <https://ams-std-595-color.com/> |
| Vallejo | 892 | Model Color, Model Air, Game Color, Game Air, Xpress, Mecha, True Metallic, Liquid Metal, Premium | *Catalogue 2026* (PDF) |
| Mr. Hobby (Gunze) | 443 | Mr. Color, Aqueous Hobby Color, Acrysion | *Catalogue 2024-2025* (PDF) |
| Humbrol | 147 | Acrílicas | imagens do site <https://uk.humbrol.com/catalogue> |
| RAL Classic | 216 | — | <https://www.ralcolorchart.com/ral-classic/> |
| AK | 177 | Standard, Civil, Military | catálogo Real Colors (PDF) |
| AMMO by Mig | 417 | Acrylic Colors, ATOM | *Catalogue 2024* (PDF) |
| Scale75 | 549 | Scalecolor (com Metal n' Alchemy e Inktense), Fantasy & Games, Warfront, Instant Colors, FX Fluor, Scalecolor Artist, Flow (óleo), Drop & Paint, Scalecolor Games | site oficial <https://scale75.com> (amostras de pincel; a Drop & Paint e a Scalecolor Games só têm a foto do frasco, e a cor é aproximada) |
| Tom Colors | 179 | Acrylic Colors (TC), UP (TCUP) | loja oficial <https://www.tomcolors.com.br> (amostras de pincel; na linha UP, a tinta aplicada no cartão nas fotos do anúncio; cinco cores UP vendidas só no conjunto têm poça de tinta ou estimativa; seis Skin Tones só têm fotos de uma cabeça pintada, então essas cores são aproximadas) |
| Phoenix | 597 | Federal Standard, RLM, British Standard, RAL, ANA, IJA, IJN, Regia Aeronautica, Soviet & Russian (AMT), USN | catálogo do site da loja <https://phoenix-special-colors.com.br> (tintas automotivas **Duco** e **poliéster**; as cores são valores digitais escolhidos pela loja, não medidas de tinta, e divergem um pouco das cartelas FS 595 e RAL) |
| Talento | 282 | Acrylic Color, Metallic, Game, Artes, Metallic Artes, Clear, Speed | catálogo de modelismo 2023/4 (PDF; as amostras são pinceladas vetoriais, e a cor é a que o PDF mostra, de CMYK convertido para RGB; os pigmentos em pó, os kits e os produtos de diorama não entram) |
| Artesanía Latina | 43 | Acrylic (semifosca; 4 metálicas) | loja oficial (a cor é a da faixa colorida da primeira foto de cada tinta; nas metálicas, a do frasco). Kits e diluente não entram |
| OcCre | 23 | Acrylic (fosca; 3 metálicas) | loja oficial, cruzada com a tabela de referências da marca (tintas × modelos): entram as 23 tintas da tabela, vendidas avulsas em 20 ml; betume, primer, verniz e tingidores são acabamentos e ficam de fora, como os kits. A cor é a da amostra digital (círculo) da primeira foto |
| Acrilex | 223 | Fosca (95), Brilhante, Chalk, Acrylic Colors, Metal Colors, Neon | Catálogo Manualidades 2025 (PDF): a Fosca vem das págs. 36–37; as outras linhas, das págs. 39, 41, 43, 45 e 92–93 (a cor é a das pinceladas, medida na página renderizada; nas gotas da Acrylic Colors, as de brilho forte ficam marcadas como aproximadas). A tinta para tecido, a relevo, a glitter e a PVA não entram. Metal Colors, Neon e as iridescentes ficam só para consulta |

Cada fonte tem seu método, descrito em [`ferramentas/README.md`](ferramentas/README.md) (scripts para refazer a extração) e
em [`legado/README.md`](legado/README.md) (método da Acrilex e material histórico).

## Como o cálculo funciona

- Cada cor (hex) vira uma **reflectância espectral suave** (sigmoide de polinômio, 3 coeficientes, ajustada por
  Nelder-Mead), usando as funções de casamento de cor de Wyman e o iluminante D65.
- A mistura usa **Kubelka-Munk**: K/S ponderado por quantidade × força × espalhamento estimado (`S = 0,05 + 0,95·Y^0,7`),
  com uma correção de resíduo para que a tinta pura volte exatamente ao hex do catálogo.
- A diferença entre cores é medida em **ΔE00 (CIEDE2000)**; a sugestão automática faz uma busca em grade de pesos e refina
  1% a 1%.
- A página lista as referências (Kubelka-Munk, CIEDE2000, CIELAB, sRGB, Wyman et al., Jakob e Hanika, Mixbox, Nelder-Mead)
  na seção **Sobre**.

### Linha de tintas dos ingredientes

Cada receita usa **uma linha só**: tintas de químicas diferentes (acrílica, lacquer, esmalte) não se misturam na bancada.
Metálicas, perolizadas, translúcidas e fluorescentes ficam ocultas como ingredientes, porque o modelo vale para pigmentos
opacos e foscos. "Tenho" é guardado por linha. A sugestão automática usa tintas âncora (branco, preto, primárias),
escolhidas por proximidade de cor em cada linha (na Acrilex são fixas); em linhas com mais de 120 tintas, a busca de pares
usa as 60 mais próximas do alvo, para responder em cerca de 1 s. A Phoenix vende toda cor em dois tipos, **Duco** (lacquer) e **poliéster**, então aparece como duas linhas de ingredientes com as mesmas cores. Na Talento, a Acrylic Color, a Artes e a Game (a mesma acrílica base água) formam uma linha só; metálicas, Clear, Speed e neon ficam só no catálogo de consulta.

### Equivalentes em outras marcas

O número ao lado de cada tinta é o ΔE00 (menor = mais parecida; verde abaixo de 2). O selo **AMMO**/**AK** mostra que o
**próprio fabricante** declara a equivalência: as tabelas de conversão desses dois catálogos foram lidas e ligadas às
tintas dos nossos catálogos nos dois sentidos (cerca de 1.500 ligações), incluindo as referências de norma citadas
(`RAL 9005`, `FS 36081`). O selo diz o que o fabricante afirma; o ΔE diz o quanto as cores de tela concordam, e os dois
podem divergir, porque os catálogos usam amostras de origens diferentes.

## Limitações

- Cores de catálogo são aproximações; **sempre teste** a mistura antes de pintar. Tinta acrílica úmida costuma secar um
  pouco mais escura, e o acabamento muda a percepção.
- O modelo não representa brilho metálico, pérola, translucidez nem fluorescência.
- O app não conhece diluição, espessura de camada nem a cor da base; "força" e a cor obtida nas receitas servem para
  calibrar.
- Os catálogos mudam com o tempo; os dados refletem as edições citadas na tabela.

## Desenvolvimento

```
index.html            marcação da página (textos com data-i18n)
css/styles.css        estilos (tema claro/escuro automático)
dados/*.json          catálogos de cores (fonte de dados do aplicativo)
js/
  main.js             ponto de entrada: idioma, dados, estado e módulos
  i18n/               textos em pt-BR e en (index.js: t(), applyStatic(), setLang())
  color/              motor de cor (puro, sem DOM; roda também no Node)
    convert.js  deltaE.js  optimize.js  spectral.js  mixing.js  suggest.js  nearest.js
  data/
    catalogs.js       carrega e normaliza os JSONs; abas, linhas, nomes
    sets.js           linhas de tintas que podem ser ingredientes (filtros e âncoras)
    equivalences.js   equivalências declaradas pelos fabricantes
  data/acabamento.js  acabamento normalizado (fosca, acetinada, brilhante, metálica, transparente, efeito) e filtros
  state/              store.js (estado e localStorage), backup.js (exportar/importar), tenho.js (marcação em lote)
  ui/                 um módulo por seção da tela (help.js: guia passo a passo e exemplo)
tests/                testes (node --test)
tools/servidor.mjs    servidor estático para desenvolvimento
ferramentas/          extratores de dados (Node)
legado/               material histórico (fora do app e do site)
catalogos/            páginas HTML estáticas antigas (Tamiya, Revell, Acrilex)
```

- **Testes:** `npm test`. Há testes de equivalência com o motor original (valores gravados em `tests/golden.json`, para
  garantir que refatorações não mudem o cálculo), dos dados de cada catálogo, das linhas de ingredientes, das
  equivalências e da internacionalização.
- **Acrescentar uma linha de ingredientes:** uma entrada em `INGREDIENT_SETS` (`js/data/sets.js`).
- **Acrescentar um catálogo de alvos:** um JSON em `dados/`, o mapeamento em `buildCatalogs` e a aba em `TARGET_TABS`
  (`js/data/catalogs.js`); marque cada tinta com `line` se o catálogo tiver linhas.
- **Textos e idiomas:** todos os textos ficam em `js/i18n/pt-BR.js` e `js/i18n/en.js` (um teste exige as mesmas chaves e
  marcadores nos dois). No HTML use `data-i18n`; no JavaScript, `t('chave', {variavel: valor})`. Para um novo idioma,
  crie o dicionário e registre-o em `js/i18n/index.js`.

## Créditos, licença e avisos

- **Ideia e direção:** [Prof. Dr. David Buzatto](https://davidbuzatto.com.br/).
- **Desenvolvimento:** [Claude](https://claude.com/claude-code) (Anthropic), assistente de IA, sob a direção do autor.
- **Catálogo Scale75:** proposto por [Marden](https://github.com/mardden), que reuniu a primeira versão dos dados a partir do
  Scalemates; os dados atuais foram refeitos a partir do site oficial da Scale75 e ajustados pelo autor.
- **Licença:** código sob [licença MIT](LICENSE). Os dados de cores são aproximações derivadas de catálogos e sites de
  terceiros, fornecidos para uso informativo, sem garantia e **sem vínculo, patrocínio ou aprovação** dos fabricantes;
  nomes e marcas pertencem aos seus titulares.
