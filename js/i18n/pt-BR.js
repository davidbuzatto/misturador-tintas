/**
 * Textos da interface em português do Brasil (idioma padrão).
 * Marcadores como `{n}` são substituídos por `t()`. Chaves terminadas em `.html` ou usadas em
 * `data-i18n-html` podem conter marcação simples (<b>, <a>), escrita só aqui.
 */
export default {
  // ---- aplicativo ----
  'app.title': 'Misturador de Tintas',
  'app.subtitle':
    'Calcule misturas de tinta para plastimodelismo: escolha a linha de tintas que você tem, a cor que quer alcançar ' +
    '(de qualquer catálogo, inclusive FS 595 e RAL) e veja a receita. A tinta é tratada como <b>pigmento</b> ' +
    '(modelo espectral de Kubelka-Munk), não como média de RGB.',
  'app.error':
    'Não foi possível iniciar o aplicativo: {erro}. Se você abriu o arquivo direto do disco (file://), sirva a pasta por HTTP (veja o README).',
  'a11y.skip': 'Ir para o conteúdo',
  'lang.label': 'Idioma',
  'reset.button': 'Restaurar configurações',
  'reset.title': 'Apaga as receitas salvas, as tintas marcadas como “tenho” e as preferências guardadas neste navegador, e volta ao estado inicial',
  'reset.confirm': 'Isso apaga as receitas salvas, as tintas marcadas como “tenho” e as preferências guardadas neste navegador, e o app volta ao estado inicial. Para guardar suas receitas e tintas antes, use “exportar backup”. Continuar?',
  'cat.button': 'Catálogo completo',
  'cat.button.title': 'Consulta todas as tintas de cada marca, inclusive metálicas e transparentes (só para ver a cor; nada é alterado)',
  'cat.title': 'Catálogo completo de tintas',
  'cat.help': 'Só para consulta. As cores são aproximações de tela: metálicas, transparentes e efeitos aparecem com a cor de base, sem o brilho real. O acabamento marcado como “estimado” foi deduzido do nome ou do código, e não informado pelo catálogo.',
  'cat.tabs': 'Marca',
  'cat.lines': 'Linha',
  'cat.finish': 'Acabamento',
  'cat.search': 'buscar por código ou nome…',
  'cat.count': '{n} de {total} tintas',
  'cat.empty': 'Nenhuma tinta com estes filtros.',
  'cat.estimated': '(estimado)',
  'cat.det.hint': 'Clique numa tinta para ver os detalhes e as parecidas em outras marcas.',
  'cat.det.finish': 'acabamento',
  'cat.det.similar': 'Parecidas em outras marcas (clique para ir até a tinta)',
  'cat.det.similar.same': 'Parecidas em outras marcas, do mesmo tipo de acabamento (clique para ir até a tinta)',
  'fin.matte': 'Fosca',
  'fin.satin': 'Acetinada',
  'fin.gloss': 'Brilhante',
  'fin.metallic': 'Metálica',
  'fin.clear': 'Transparente',
  'fin.special': 'Efeito',
  'fin.unknown': 'não informado',
  'common.all': 'Todas',
  'common.noName': 'Sem nome',
  'common.close': 'fechar',
  'common.approx': 'amostra em degradê/metálica: cor aproximada',

  // ---- "Como funciona" ----
  'help.title': 'Como usar, passo a passo',
  'help.intro': 'Vamos reproduzir, como exemplo, a cor <b>Tamiya XF-18 (Medium Blue)</b> misturando tintas. Siga os passos ou use o botão no fim da lista para ver tudo acontecer.',
  'help.step1': '<b>Escolha a linha de tintas que você tem</b> no card 1 (por exemplo, <b>Acrilex Fosca</b>, que já vem selecionada). Cada receita usa uma linha só.',
  'help.step2': 'No card 2, abra a aba <b>Tamiya</b>, deixe a linha <b>Acrílica</b> e digite <b>XF-18</b> na busca. Clique na cor <i>Medium Blue</i>: ela vira a cor-alvo e aparece como “alvo” no card 3.',
  'help.step3': 'No card 3, clique em <b>sugerir mistura automática</b>. O app lista receitas de 1 a 3 tintas, da mais próxima do alvo (menor ΔE) para a mais distante. Receitas com ΔE abaixo de 1 (diferença imperceptível) contam como equivalentes, e entre elas vem primeiro a que usa menos tintas. Abaixo de ΔE 2 só dá para notar a diferença com as cores lado a lado.',
  'help.step4': 'Clique em <b>usar</b> na receita que preferir: as tintas e as proporções entram no card 1, e a amostra “mistura” mostra a cor calculada ao lado do alvo.',
  'help.step5': 'Se quiser, ajuste: arraste os controles de quantidade, mude a <b>força</b> de uma tinta ou defina o <b>total</b> em ml para saber quanto usar de cada tinta.',
  'help.step6': 'Não tem as tintas certas? No card 4, veja as <b>tintas prontas mais parecidas</b> em outras marcas (o selo AMMO ou AK indica equivalência declarada pelo fabricante).',
  'help.step7': 'Misture de verdade, clique em <b>salvar receita</b> e, no card 5, registre a <b>cor obtida</b>: o app mostra o erro real do modelo e ajuda a calibrar.',
  'help.tip': 'Dica: na janela de tintas, marque as que você tem (botão direito, toque longo ou tecla T; ou filtre pela busca e use “marcar as visíveis”) e ative “só as que tenho” para a sugestão usar apenas elas.',
  'help.try': 'Fazer o exemplo para mim',
  'help.try.confirm': 'O exemplo substitui a cor-alvo e a mistura atuais (as receitas salvas não são afetadas). Continuar?',
  'help.try.done': 'Pronto: a cor-alvo agora é a Tamiya XF-18. Veja as receitas sugeridas no card 3 e clique em “usar” numa delas (passo 4).',
  'help.local':
    'Tudo roda no seu navegador e nada é enviado a servidor algum. Receitas e preferências ficam no armazenamento local do navegador: use “exportar backup” (receitas e tintas “tenho”) para levá-las para outro lugar ou “Restaurar configurações” (no topo da página) para apagá-las.',
  'help.limits':
    'As cores dos catálogos são aproximações para tela, e tinta metálica, translúcida ou fluorescente não é bem representada. Trate o resultado como ponto de partida e teste sempre antes de pintar.',

  // ---- cards ----
  'card.mix': '1 · Mistura',
  'card.target': '2 · Cor-alvo',
  'card.result': '3 · Resultado',
  'card.equiv': '4 · Equivalentes em outras marcas',
  'card.recipes': '5 · Receitas salvas',

  // ---- 1 · Mistura ----
  'mix.help': 'Escolha a linha de tintas que você tem. Cada receita usa uma linha só, porque tintas de químicas diferentes não se misturam na bancada.',
  'mix.set.label': 'tintas',
  'mix.set.title': 'Linha de tintas usada como ingrediente nesta receita. Cada receita usa uma linha só: tintas de químicas diferentes não se misturam na bancada.',
  'mix.set.info': '{n} tintas · {quimica}',
  'mix.set.hidden': ' · {n} ocultas (metálicas, translúcidas ou de cor aproximada)',
  'mix.set.confirm': 'Trocar a linha de tintas limpa a mistura atual. Continuar?',
  'chem.acrilica': 'acrílica',
  'chem.lacquer': 'lacquer',
  'chem.esmalte': 'esmalte',
  'chem.oleo': 'óleo',
  'chem.poliester': 'poliéster',
  'approx.tag': '≈ aprox.',
  'approx.frasco': 'cor aproximada: a marca não publica amostra desta tinta, e a cor foi lida do líquido na foto do frasco',
  'approx.estimada': 'cor estimada: esta tinta só é vendida dentro de um conjunto, sem foto de amostra aplicada, e a cor foi calculada a partir de uma poça de tinta e de tintas parecidas',
  'approx.foto': 'cor aproximada: lida da cabeça pintada na foto do produto (tinta seca, sob a iluminação da foto)',
  'approx.diluida': 'cor aproximada: a amostra da marca é diluída (semitransparente) e pode estar mais clara que a tinta real',
  'set.acrilex': 'Fosca',
  'set.tamiya-acrilica': 'Acrílica',
  'set.humbrol': 'Acrílica',
  'set.phoenix-poliester': 'Poliéster',
  'line.Acrylic': 'Acrílica',
  'mix.empty': 'Nenhuma tinta ainda. Clique em “adicionar tinta”.',
  'mix.add': '+ adicionar tinta',
  'mix.norm': 'normalizar 100%',
  'mix.norm.title': 'Escala as quantidades para somarem 100%',
  'mix.clear': 'limpar',
  'mix.total': 'total',
  'mix.total.title': 'Volume total da mistura, usado só para converter as porcentagens em ml',
  'mix.sum': 'soma das quantidades: {n}',
  'mix.sum.hint': ' (as proporções valem sobre a soma; “normalizar 100%” ajusta os números)',
  'ing.qty.title': 'quantidade relativa',
  'ing.qty.aria': 'quantidade de {nome}',
  'ing.strength.title': 'força de tingimento',
  'ing.strength.aria': 'força de tingimento de {nome}',
  'ing.strength': 'força',
  'ing.remove': 'remover',
  'mix.model.summary': 'Modelo de mistura e força de tingimento',
  'mix.model.label': 'modelo',
  'mix.model.help':
    'A coluna “força” de cada tinta multiplica sua participação: use &gt;1 para pigmentos fortes (preto, azul, magenta) e &lt;1 para os fracos. Ajuste até a mistura calculada bater com o que você vê na bancada. O modelo padrão trata a tinta como pigmento; os outros existem para comparação.',
  'model.km': 'Pigmento (Kubelka-Munk, espalhamento estimado)',
  'model.kmeq': 'Pigmento (Kubelka-Munk, espalhamento igual)',
  'model.lin': 'RGB linear (luz)',
  'model.srgb': 'RGB direto (média de hex)',
  'model.km.short': 'Pigmento · KM (espalh. estimado)',
  'model.kmeq.short': 'Pigmento · KM (espalh. igual)',
  'model.lin.short': 'RGB linear',
  'model.srgb.short': 'RGB direto',

  // ---- 2 · Cor-alvo ----
  'target.help':
    'Escolha a cor que você quer reproduzir, em qualquer catálogo; “Livre” permite escolher qualquer cor. Digite para filtrar por código ou nome. Pelo teclado, use Tab para navegar e Enter para escolher.',
  'target.search': 'buscar código ou nome…',
  'target.showFinish': 'mostrar acabamento',
  'tab.free': 'Livre',
  'target.free.color': 'cor livre',
  'target.free.hex': 'cor livre em hexadecimal',
  'target.free.label': 'Cor livre',

  // ---- 3 · Resultado ----
  'result.target': 'alvo',
  'result.mix': 'mistura',
  'result.de': 'ΔE {x}',
  'de.0': 'imperceptível',
  'de.1': 'só lado a lado',
  'de.2': 'muito parecida',
  'de.3': 'parecida',
  'de.4': 'diferente',
  'de.5': 'bem diferente',
  'result.save': 'salvar receita',
  'result.suggest': 'sugerir mistura automática',
  'result.upto': 'até',
  'result.paints': 'tintas',
  'result.onlyOwn': 'só as que tenho',
  'result.col.model': 'modelo',
  'result.col.color': 'cor',
  'result.col.de': 'ΔE00',
  'result.scale':
    'ΔE00 &lt; 1: imperceptível · 1–2: só lado a lado · 2–5: parecida · &gt;5: diferente. A diferença entre “pigmento” e “RGB” é justamente o erro de misturar em RGB.',
  'result.warn':
    'Aviso: tinta acrílica úmida costuma secar um pouco mais escura; o acabamento muda a percepção; e as cores dos catálogos são aproximadas. Trate o resultado como ponto de partida e registre a cor real obtida nas receitas salvas.',
  'sug.calc': 'calculando…',
  'sug.none': 'Nenhuma tinta marcada como “tenho”. Marque no seletor (botão direito) ou desligue o filtro.',
  'sug.count.um': '{n} tinta',
  'sug.count.outros': '{n} tintas',
  'sug.line': '{contagem} · ΔE {x} ({texto})',
  'sug.use': 'usar',

  // ---- 4 · Equivalentes ----
  'eq.from': 'a partir da',
  'eq.from.target': 'cor-alvo',
  'eq.from.mix': 'mistura calculada',
  'eq.hint': 'menor ΔE00 = mais parecida · clique numa cor para usá-la como alvo',
  'eq.help':
    'O número é o ΔE00 (diferença de cor percebida). O selo AMMO ou AK indica que o próprio fabricante declara a equivalência; vale conferir o ΔE ao lado, porque os catálogos usam amostras de origens diferentes.',
  'eq.empty': 'Adicione tintas à mistura para ver os equivalentes da mistura calculada.',
  'eq.tip': '{code} {nome} {hex} · ΔE00 {de} ({texto})',
  'eq.tip.official': 'equivalência indicada no catálogo {fontes}',
  'eq.tip.click': 'clique para usar como cor-alvo',
  'eq.and': ' e ',

  // ---- 5 · Receitas ----
  'rec.help':
    'Depois de misturar de verdade, registre a “cor obtida”: o app mostra o erro real do modelo, que ajuda a calibrar a “força” das tintas. O backup guarda também as tintas que você marcou como “tenho”.',
  'rec.empty':
    'Nenhuma receita salva. Monte uma mistura e clique em “salvar receita”. Depois de misturar de verdade, registre a cor obtida para ver o erro real do modelo.',
  'rec.default': 'Receita',
  'rec.target': 'alvo',
  'rec.calc': 'calculada',
  'rec.obtained': 'obtida',
  'rec.de.calc': 'ΔE calculado {x}',
  'rec.de.real': 'ΔE real {x}',
  'rec.err': 'erro do modelo {x}',
  'rec.got': 'cor obtida',
  'rec.note': 'anotação',
  'rec.load': 'carregar',
  'rec.delete': 'excluir',
  'rec.prompt': 'Nome da receita:',
  'rec.needMix': 'Adicione tintas à mistura primeiro.',
  'rec.badFile': 'Arquivo inválido.',
  'rec.export': 'exportar backup',
  'rec.import': 'importar backup',
  'rec.export.title': 'Baixa um arquivo JSON com as suas receitas e as tintas marcadas como “tenho”',
  'rec.import.title': 'Lê um arquivo de backup e soma o conteúdo ao que você já tem, sem substituir nem duplicar. Também aceita arquivos antigos, só com receitas',
  'bk.exported': 'Backup baixado — receitas: {receitas}; tintas marcadas: {tintas}.',
  'bk.done': 'Importado — receitas novas: {receitas}; tintas marcadas novas: {tintas}; linhas de tintas: {linhas}.',
  'bk.nothing': 'Nada novo neste arquivo: tudo já estava aqui.',
  'bk.ignored': '({n} itens ignorados: formato ou tintas não reconhecidos.)',

  // ---- seletor de tintas (janela) ----
  'picker.title': 'Escolha uma tinta {linha}',
  'picker.search': 'buscar…',
  'picker.markAll': 'marcar as {n} visíveis',
  'picker.unmarkAll': 'desmarcar as {n} visíveis',
  'picker.unmarkConfirm': 'Desmarcar {n} tintas como “tenho”?',
  'picker.ownCount': '{n} de {total} marcadas como “tenho”',
  'picker.help':
    'Clique (ou Enter) para adicionar. Botão direito, toque longo ou a tecla T marcam “tenho esta tinta” (borda verde). Para marcar várias de uma vez, filtre com a busca e use “marcar as visíveis”.',

  // ---- sobre ----
  'about.title': 'Sobre',
  'about.credits':
    'Ideia e direção: <a href="https://davidbuzatto.com.br/" target="_blank" rel="noopener">Prof. Dr. David Buzatto</a>. ' +
    'Desenvolvimento: <a href="https://claude.com/claude-code" target="_blank" rel="noopener">Claude</a> (Anthropic), assistente de IA, sob a direção do autor. ' +
    'Catálogo Scale75: proposto por <a href="https://github.com/mardden" target="_blank" rel="noopener">Marden</a>, que reuniu a primeira versão dos dados a partir do Scalemates; ' +
    'os dados atuais foram refeitos a partir do site oficial da Scale75 e ajustados pelo autor.',
  'about.license':
    'O código é distribuído sob a <a href="https://github.com/davidbuzatto/misturador-tintas/blob/HEAD/LICENSE" target="_blank" rel="noopener">licença MIT</a> ' +
    '(<a href="https://github.com/davidbuzatto/misturador-tintas" target="_blank" rel="noopener">repositório</a>).',
  'about.data':
    'As cores são aproximações obtidas de catálogos e sites dos fabricantes, sem vínculo, patrocínio ou aprovação deles. Nomes e marcas ' +
    'pertencem aos seus titulares. Os valores servem como ponto de partida: confira sempre com a tinta real, e lembre que impressão, tela e ' +
    'acabamento alteram a aparência.',
  'about.refs.title': 'Para saber mais',
  'about.refs.intro': 'A teoria e os algoritmos por trás do cálculo:',
  'ref.km': 'Teoria de Kubelka-Munk: como a luz se espalha e é absorvida numa camada de tinta (Wikipédia, em inglês)',
  'ref.subtractive': 'Mistura subtrativa de cores: por que misturar tintas não é o mesmo que misturar luzes (Wikipédia, em inglês)',
  'ref.mixbox': 'Mixbox: mistura realista de pigmentos para pintura digital, de Sochorová e Jamriška (2021), baseada em Kubelka-Munk',
  'ref.jakob': 'Jakob e Hanika (2019): espaço de funções de baixa dimensão para obter espectros a partir de cores RGB. A reflectância suave de 3 coeficientes usada aqui segue essa ideia',
  'ref.wyman': 'Wyman, Sloan e Shirley (2013): aproximações analíticas simples das funções de casamento de cor CIE XYZ',
  'ref.illuminant': 'Iluminantes-padrão da CIE, incluindo o D65 usado nos cálculos (Wikipédia, em inglês)',
  'ref.srgb': 'sRGB: o espaço de cor das telas e a curva de gama (Wikipédia, em inglês)',
  'ref.cielab': 'Espaço de cor CIELAB (L*a*b*), em que as diferenças de cor são medidas (Wikipédia, em inglês)',
  'ref.de00': 'Sharma, Wu e Dalal (2005): fórmula de diferença de cor CIEDE2000 (ΔE00), notas de implementação e dados de teste',
  'ref.nm': 'Método de Nelder-Mead: otimização sem derivadas, usada para ajustar o espectro de cada tinta (Wikipédia, em inglês)',
};
