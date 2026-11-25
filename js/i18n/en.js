/**
 * User interface texts in English. Same keys as `pt-BR.js` (a test checks that).
 * Placeholders such as `{n}` are replaced by `t()`. Texts used with `data-i18n-html` may contain simple markup.
 */
export default {
  // ---- application ----
  'app.title': 'Paint Mixer',
  'app.subtitle':
    'Compute paint mixes for scale modeling: pick the paint line you own, the color you want to match ' +
    '(from any catalog, including FS 595 and RAL) and get a recipe. Paint is treated as <b>pigment</b> ' +
    '(Kubelka-Munk spectral model), not as an RGB average.',
  'app.error':
    'The app could not start: {erro}. If you opened the file straight from disk (file://), serve the folder over HTTP (see the README).',
  'a11y.skip': 'Skip to content',
  'lang.label': 'Language',
  'reset.button': 'Reset settings',
  'reset.title': 'Deletes the saved recipes, the paints marked as owned and the preferences stored in this browser, and returns to the initial state',
  'reset.confirm': 'This deletes the saved recipes, the paints marked as owned and the preferences stored in this browser, and the app returns to its initial state. To keep your recipes and paints first, use “export backup”. Continue?',
  'cat.button': 'Full catalog',
  'cat.button.title': 'Browse every paint of each brand, including metallic and clear ones (just to see the color; nothing is changed)',
  'cat.title': 'Full paint catalog',
  'cat.help': 'Browsing only. Colors are on-screen approximations: metallics, clears and effects show their base color, without the real sheen. A finish marked “estimated” was deduced from the name or the code, not stated by the catalog.',
  'cat.tabs': 'Brand',
  'cat.lines': 'Line',
  'cat.finish': 'Finish',
  'cat.search': 'search by code or name…',
  'cat.count': '{n} of {total} paints',
  'cat.empty': 'No paint matches these filters.',
  'cat.estimated': '(estimated)',
  'cat.det.hint': 'Click a paint to see its details and the closest ones in other brands.',
  'cat.det.finish': 'finish',
  'cat.det.similar': 'Closest in other brands (click to go to the paint)',
  'cat.det.similar.same': 'Closest in other brands, same type of finish (click to go to the paint)',
  'fin.matte': 'Matte',
  'fin.satin': 'Satin',
  'fin.gloss': 'Gloss',
  'fin.metallic': 'Metallic',
  'fin.clear': 'Clear',
  'fin.special': 'Effect',
  'fin.unknown': 'not stated',
  'common.all': 'All',
  'common.noName': 'No name',
  'common.close': 'close',
  'common.approx': 'gradient/metallic swatch: approximate color',

  // ---- "How it works" ----
  'help.title': 'How to use it, step by step',
  'help.intro': 'As an example, let’s reproduce the color <b>Tamiya XF-18 (Medium Blue)</b> by mixing paints. Follow the steps, or use the button at the end of the list to watch it all happen.',
  'help.step1': '<b>Pick the paint line you own</b> in card 1 (for example, <b>Acrilex Matte</b>, which is already selected). Each recipe uses a single line.',
  'help.step2': 'In card 2, open the <b>Tamiya</b> tab, keep the <b>Acrylic</b> line and type <b>XF-18</b> in the search box. Click the <i>Medium Blue</i> color: it becomes the target and shows up as “target” in card 3.',
  'help.step3': 'In card 3, click <b>suggest an automatic mix</b>. The app lists recipes of 1 to 3 paints, from the closest to the target (lowest ΔE) to the farthest. Recipes with ΔE below 1 (imperceptible difference) count as equivalent, and among them the one using fewer paints comes first. Below ΔE 2 you can only notice the difference with the colors side by side.',
  'help.step4': 'Click <b>use</b> on the recipe you prefer: the paints and proportions go into card 1, and the “mix” swatch shows the computed color next to the target.',
  'help.step5': 'If you like, adjust it: drag the amount controls, change a paint’s <b>strength</b> or set the <b>total</b> in ml to know how much of each paint to use.',
  'help.step6': 'Don’t own the right paints? In card 4, see the <b>ready-made paints closest</b> to it in other brands (an AMMO or AK badge means the manufacturer declares the equivalence).',
  'help.step7': 'Mix it for real, click <b>save recipe</b> and, in card 5, record the <b>color obtained</b>: the app shows the real model error and helps you calibrate.',
  'help.tip': 'Tip: in the paint dialog, mark the ones you own (right-click, long press or the T key; or filter with the search box and use “mark the visible”) and turn on “only the ones I own” so the suggestion uses only those.',
  'help.try': 'Do the example for me',
  'help.try.confirm': 'The example replaces the current target color and mix (saved recipes are not affected). Continue?',
  'help.try.done': 'Done: the target color is now Tamiya XF-18. See the suggested recipes in card 3 and click “use” on one of them (step 4).',
  'help.local':
    'Everything runs in your browser and nothing is sent to any server. Recipes and preferences stay in the browser’s local storage: use “export backup” (recipes and owned paints) to take them elsewhere or “Reset settings” (at the top of the page) to delete them.',
  'help.limits':
    'Catalog colors are on-screen approximations, and metallic, translucent or fluorescent paints are not well represented. Treat the result as a starting point and always test before painting.',

  // ---- cards ----
  'card.mix': '1 · Mix',
  'card.target': '2 · Target color',
  'card.result': '3 · Result',
  'card.equiv': '4 · Equivalents in other brands',
  'card.recipes': '5 · Saved recipes',

  // ---- 1 · Mix ----
  'mix.help': 'Pick the paint line you own. Each recipe uses a single line, because paints with different chemistries do not mix on the bench.',
  'mix.set.label': 'paints',
  'mix.set.title': 'Paint line used as the ingredients of this recipe. Each recipe uses a single line: paints with different chemistries do not mix on the bench.',
  'mix.set.info': '{n} paints · {quimica}',
  'mix.set.hidden': ' · {n} hidden (metallic, translucent or approximate color)',
  'mix.set.confirm': 'Changing the paint line clears the current mix. Continue?',
  'chem.acrilica': 'acrylic',
  'chem.lacquer': 'lacquer',
  'chem.esmalte': 'enamel',
  'chem.oleo': 'oil',
  'chem.poliester': 'polyester',
  'approx.tag': '≈ approx.',
  'approx.frasco': 'approximate color: the brand publishes no swatch for this paint, so the color was read from the liquid in the bottle photo',
  'approx.estimada': 'estimated color: this paint is only sold inside a set, with no photo of an applied swatch, so the color was calculated from a paint puddle and similar paints',
  'approx.foto': 'approximate color: read from the painted head in the product photo (dry paint, under the photo’s lighting)',
  'approx.diluida': 'approximate color: the brand’s swatch is thin (semi-transparent) and may be lighter than the real paint',
  'set.acrilex': 'Matte',
  'set.tamiya-acrilica': 'Acrylic',
  'set.humbrol': 'Acrylic',
  'set.phoenix-poliester': 'Polyester',
  'line.Acrylic': 'Acrylic',
  'set.talento-acrylic': 'Acrylic Color + Arts + Game',
  'line.Artes': 'Arts',
  'line.Metallic Artes': 'Metallic Arts',
  'mix.empty': 'No paints yet. Click “add paint”.',
  'mix.add': '+ add paint',
  'mix.norm': 'normalize 100%',
  'mix.norm.title': 'Scales the amounts so they add up to 100%',
  'mix.clear': 'clear',
  'mix.total': 'total',
  'mix.total.title': 'Total volume of the mix, used only to convert percentages into ml',
  'mix.sum': 'sum of amounts: {n}',
  'mix.sum.hint': ' (proportions are relative to the sum; “normalize 100%” adjusts the numbers)',
  'ing.qty.title': 'relative amount',
  'ing.qty.aria': 'amount of {nome}',
  'ing.strength.title': 'tinting strength',
  'ing.strength.aria': 'tinting strength of {nome}',
  'ing.strength': 'strength',
  'ing.remove': 'remove',
  'mix.model.summary': 'Mixing model and tinting strength',
  'mix.model.label': 'model',
  'mix.model.help':
    'Each paint’s “strength” multiplies its share: use &gt;1 for strong pigments (black, blue, magenta) and &lt;1 for weak ones. Adjust until the computed mix matches what you see on the bench. The default model treats paint as pigment; the others are there for comparison.',
  'model.km': 'Pigment (Kubelka-Munk, estimated scattering)',
  'model.kmeq': 'Pigment (Kubelka-Munk, equal scattering)',
  'model.lin': 'Linear RGB (light)',
  'model.srgb': 'Direct RGB (hex average)',
  'model.km.short': 'Pigment · KM (est. scattering)',
  'model.kmeq.short': 'Pigment · KM (equal scattering)',
  'model.lin.short': 'Linear RGB',
  'model.srgb.short': 'Direct RGB',

  // ---- 2 · Target color ----
  'target.help':
    'Pick the color you want to reproduce, from any catalog; “Free” lets you choose any color. Type to filter by code or name. With the keyboard, use Tab to move around and Enter to choose.',
  'target.search': 'search code or name…',
  'target.showFinish': 'show finish',
  'tab.free': 'Free',
  'target.free.color': 'free color',
  'target.free.hex': 'free color in hexadecimal',
  'target.free.label': 'Free color',

  // ---- 3 · Result ----
  'result.target': 'target',
  'result.mix': 'mix',
  'result.de': 'ΔE {x}',
  'de.0': 'imperceptible',
  'de.1': 'only side by side',
  'de.2': 'very similar',
  'de.3': 'similar',
  'de.4': 'different',
  'de.5': 'very different',
  'result.save': 'save recipe',
  'result.suggest': 'suggest an automatic mix',
  'result.upto': 'up to',
  'result.paints': 'paints',
  'result.onlyOwn': 'only the ones I own',
  'result.col.model': 'model',
  'result.col.color': 'color',
  'result.col.de': 'ΔE00',
  'result.scale':
    'ΔE00 &lt; 1: imperceptible · 1–2: only side by side · 2–5: similar · &gt;5: different. The gap between “pigment” and “RGB” is exactly the error of mixing in RGB.',
  'result.warn':
    'Note: wet acrylic paint usually dries a little darker; the finish changes perception; and catalog colors are approximate. Treat the result as a starting point and record the real color you got in the saved recipes.',
  'sug.calc': 'computing…',
  'sug.none': 'No paint marked as “owned”. Mark some in the picker (right-click) or turn the filter off.',
  'sug.count.um': '{n} paint',
  'sug.count.outros': '{n} paints',
  'sug.line': '{contagem} · ΔE {x} ({texto})',
  'sug.use': 'use',

  // ---- 4 · Equivalents ----
  'eq.from': 'from the',
  'eq.from.target': 'target color',
  'eq.from.mix': 'computed mix',
  'eq.hint': 'lower ΔE00 = closer · click a color to use it as the target',
  'eq.help':
    'The number is ΔE00 (perceived color difference). The AMMO or AK badge means the manufacturer itself declares the equivalence; check the ΔE next to it, because catalogs use swatches from different sources.',
  'eq.empty': 'Add paints to the mix to see equivalents of the computed mix.',
  'eq.tip': '{code} {nome} {hex} · ΔE00 {de} ({texto})',
  'eq.tip.official': 'equivalence stated in the {fontes} catalog',
  'eq.tip.click': 'click to use as the target color',
  'eq.and': ' and ',

  // ---- 5 · Recipes ----
  'rec.help':
    'After really mixing, record the “color obtained”: the app shows the real model error, which helps calibrate each paint’s “strength”. The backup also keeps the paints you marked as owned.',
  'rec.empty':
    'No saved recipes. Build a mix and click “save recipe”. After really mixing, record the color you got to see the real model error.',
  'rec.default': 'Recipe',
  'rec.target': 'target',
  'rec.calc': 'computed',
  'rec.obtained': 'obtained',
  'rec.de.calc': 'computed ΔE {x}',
  'rec.de.real': 'real ΔE {x}',
  'rec.err': 'model error {x}',
  'rec.got': 'color obtained',
  'rec.note': 'note',
  'rec.load': 'load',
  'rec.delete': 'delete',
  'rec.prompt': 'Recipe name:',
  'rec.needMix': 'Add paints to the mix first.',
  'rec.badFile': 'Invalid file.',
  'rec.export': 'export backup',
  'rec.import': 'import backup',
  'rec.export.title': 'Downloads a JSON file with your recipes and the paints marked as owned',
  'rec.import.title': 'Reads a backup file and adds its content to what you already have, without replacing or duplicating. It also accepts old files with recipes only',
  'bk.exported': 'Backup downloaded — recipes: {receitas}; owned paints: {tintas}.',
  'bk.done': 'Imported — new recipes: {receitas}; new owned paints: {tintas}; paint lines: {linhas}.',
  'bk.nothing': 'Nothing new in this file: everything was already here.',
  'bk.ignored': '({n} items ignored: unrecognized format or paints.)',

  // ---- paint picker (dialog) ----
  'picker.title': 'Pick a paint from {linha}',
  'picker.search': 'search…',
  'picker.markAll': 'mark the {n} visible',
  'picker.unmarkAll': 'unmark the {n} visible',
  'picker.unmarkConfirm': 'Unmark {n} paints as owned?',
  'picker.ownCount': '{n} of {total} marked as owned',
  'picker.help':
    'Click (or Enter) to add. Right-click, long press or the T key marks “I own this paint” (green border). To mark many at once, filter with the search box and use “mark the visible”.',

  // ---- about ----
  'about.title': 'About',
  'about.credits':
    'Idea and direction: <a href="https://davidbuzatto.com.br/" target="_blank" rel="noopener">Prof. Dr. David Buzatto</a>. ' +
    'Development: <a href="https://claude.com/claude-code" target="_blank" rel="noopener">Claude</a> (Anthropic), an AI assistant, under the author’s direction. ' +
    'Scale75 catalog: proposed by <a href="https://github.com/mardden" target="_blank" rel="noopener">Marden</a>, who put together the first version of the data from Scalemates; ' +
    'the current data were rebuilt from Scale75’s official website and adjusted by the author.',
  'about.license':
    'The code is released under the <a href="https://github.com/davidbuzatto/misturador-tintas/blob/HEAD/LICENSE" target="_blank" rel="noopener">MIT license</a> ' +
    '(<a href="https://github.com/davidbuzatto/misturador-tintas" target="_blank" rel="noopener">repository</a>).',
  'about.data':
    'Colors are approximations taken from the manufacturers’ catalogs and websites, with no affiliation, sponsorship or endorsement from them. Names and ' +
    'trademarks belong to their owners. Values are a starting point: always check against the real paint, and remember that print, screen and ' +
    'finish change appearance.',
  'about.refs.title': 'Learn more',
  'about.refs.intro': 'The theory and algorithms behind the calculation:',
  'ref.km': 'Kubelka-Munk theory: how light scatters and is absorbed in a paint layer (Wikipedia)',
  'ref.subtractive': 'Subtractive color mixing: why mixing paints is not the same as mixing lights (Wikipedia)',
  'ref.mixbox': 'Mixbox: realistic pigment mixing for digital painting, by Sochorová and Jamriška (2021), based on Kubelka-Munk',
  'ref.jakob': 'Jakob and Hanika (2019): a low-dimensional function space for recovering spectra from RGB colors. The smooth 3-coefficient reflectance used here follows this idea',
  'ref.wyman': 'Wyman, Sloan and Shirley (2013): simple analytic approximations to the CIE XYZ color matching functions',
  'ref.illuminant': 'CIE standard illuminants, including the D65 used in the calculations (Wikipedia)',
  'ref.srgb': 'sRGB: the color space of displays and its gamma curve (Wikipedia)',
  'ref.cielab': 'The CIELAB (L*a*b*) color space, where color differences are measured (Wikipedia)',
  'ref.de00': 'Sharma, Wu and Dalal (2005): the CIEDE2000 color-difference formula (ΔE00), implementation notes and test data',
  'ref.nm': 'Nelder-Mead method: derivative-free optimization, used to fit each paint’s spectrum (Wikipedia)',
};
