# Paint Mixer

[Português](README.md) · **English**

A web app for **scale modeling**: pick the paint line you own (Acrilex, Tamiya, Vallejo, Mr. Hobby, Humbrol, AK,
AMMO, Scale75, Tom Colors…), the color you want to match (from any of 12 catalogs, including FS 595 and RAL) and the app computes the mix.
Paint is treated as **pigment** (Kubelka-Munk spectral model), not as an RGB average, which is what makes the prediction
land close to what happens on the bench. Plain JavaScript, ES modules, **no build step and no dependencies**.

The interface is available in Brazilian Portuguese and English (switch it at the top right).

## What it does

- **Mixes and compares:** build a recipe with an amount and a "strength" per paint; see the computed color, the ΔE00
  (perceived color difference) to the target, and four mixing models side by side (pigment vs. RGB).
- **Suggests recipes:** the automatic search finds mixes of 1 to 4 paints that approach the target, optionally using only
  the paints you own.
- **Target color from any catalog:** more than 4,100 colors in 12 catalogs, or a free color (the "show finish" option labels swatches as matte, gloss, metallic, etc.).
- **Equivalents in other brands:** for the target (or for the computed mix), the closest paints in each brand (by ΔE00)
  and, when the manufacturer declares the equivalence, an **AMMO** or **AK** badge.
- **Full catalog (browse only):** a button at the top of the page opens every paint of each brand, including the metallic,
  clear and effect paints that are left out of mixes. Filters by brand, line, finish and search; clicking a paint shows
  its details and the closest ones in other brands (for a metallic, only metallics are compared). It changes nothing in the app.
- **Saved recipes:** keep recipes, record the color you actually got to measure the model error. The **backup** (JSON) keeps recipes and the paints you own, and importing adds to what you already have, without duplicating.
- Light/dark theme, keyboard use and phone-sized screens.

## How to use

At the top of the page there is a **"How to use it, step by step"** guide, with a complete example (reproducing Tamiya XF-18) and a **"Do the example for me"** button that performs the first steps on screen. In short:

1. In **1 · Mix**, choose the brand and line of the paints you own (each recipe uses a single line) and add paints with
   "add paint".
2. In **2 · Target color**, choose the color to reproduce (one tab per brand; "Free" accepts any color).
3. In **3 · Result**, see the computed color and the ΔE. Use "suggest an automatic mix" to let the app look for a recipe.
4. In **4 · Equivalents**, see the closest paints in other brands.
5. Save the recipe and, after really mixing, record the "color obtained".

On the first visit the app opens clean (no mix or recipes, with Tamiya X-2 White as the target color) and the guide starts closed. Data stays in your browser (nothing is sent to any server); the **"Reset settings"** button at the top deletes recipes, "owned" paints and preferences and returns to the initial state. Shortcuts: in the color pickers, **Enter** chooses; in the
paint dialog, the **T** key marks "I own this paint" (also right-click or long press), **mark the visible** marks every paint filtered by the search box at once, and **Esc** closes.

## Running it

ES modules and `fetch` do not work when `index.html` is opened straight from disk (`file://`). Serve the folder over HTTP:

```bash
node tools/servidor.mjs        # http://localhost:8080/  (optional port: node tools/servidor.mjs 3000)
```

Any static server works (for example, the VS Code Live Server extension). Tests: `npm test` (Node 22 or later, no
dependencies). The site is published with GitHub Pages by `.github/workflows/pages.yml`, which runs the tests first.

## Catalogs and where the colors come from

All colors are **on-screen approximations**, extracted from PDF catalogs, manufacturer websites or product images.
Metallic, translucent and fluorescent paints are the ones that stray the most; swatches that are gradients in the
original show a dashed border. Paints marked **≈ approx.** have an approximate color (gradient, read from the bottle
photo or from a thin swatch): they are fine for browsing but are not used as mixing ingredients.

| Catalog | Colors | Lines | Source |
|---|---:|---|---|
| Tamiya | 181 | Acrylic, Lacquer | official website images (dominant color of the central region) |
| Revell | 171 | Aqua Color, Email Color | official website (median of the color sphere) |
| FS 595 (AMS-STD-595) | 653 | — | <https://ams-std-595-color.com/> |
| Vallejo | 892 | Model Color, Model Air, Game Color, Game Air, Xpress, Mecha, True Metallic, Liquid Metal, Premium | *Catalogue 2026* (PDF) |
| Mr. Hobby (Gunze) | 443 | Mr. Color, Aqueous Hobby Color, Acrysion | *Catalogue 2024-2025* (PDF) |
| Humbrol | 147 | Acrylics | images from <https://uk.humbrol.com/catalogue> |
| RAL Classic | 216 | — | <https://www.ralcolorchart.com/ral-classic/> |
| AK | 177 | Standard, Civil, Military | Real Colors catalog (PDF) |
| AMMO by Mig | 417 | Acrylic Colors, ATOM | *Catalogue 2024* (PDF) |
| Scale75 | 549 | Scalecolor (with Metal n' Alchemy and Inktense), Fantasy & Games, Warfront, Instant Colors, FX Fluor, Scalecolor Artist, Flow (oil), Drop & Paint, Scalecolor Games | official site <https://scale75.com> (brush swatches; Drop & Paint and Scalecolor Games only have the bottle photo, so their color is approximate) |
| Tom Colors | 179 | Acrylic Colors (TC), UP (TCUP) | official store <https://www.tomcolors.com.br> (brush swatches; for the UP line, the paint applied on a card in the ad photos; five UP colors sold only in the set have a paint puddle or an estimate; six Skin Tones only have photos of a painted head, so those colors are approximate) |
| Acrilex | 95 | Matte ("Fosca") | 2025 catalog (PDF, swatches on pp. 36–37) |

Each source has its own method, described in [`ferramentas/README.md`](ferramentas/README.md) (scripts to redo the
extraction, in Portuguese) and [`legado/README.md`](legado/README.md) (the Acrilex method and historical material).

## How the calculation works

- Each color (hex) becomes a **smooth spectral reflectance** (sigmoid of a polynomial, 3 coefficients, fitted with
  Nelder-Mead), using Wyman's color matching functions and the D65 illuminant.
- The mix uses **Kubelka-Munk**: K/S weighted by amount × strength × estimated scattering (`S = 0.05 + 0.95·Y^0.7`), with a
  residual correction so that a pure paint returns exactly to the catalog hex.
- Color difference is measured in **ΔE00 (CIEDE2000)**; the automatic suggestion does a grid search over weights and
  refines in 1% steps.
- The page lists the references (Kubelka-Munk, CIEDE2000, CIELAB, sRGB, Wyman et al., Jakob and Hanika, Mixbox,
  Nelder-Mead) in the **About** section.

### Ingredient paint line

Each recipe uses **a single line**: paints with different chemistries (acrylic, lacquer, enamel) do not mix on the bench.
Metallic, pearl, translucent and fluorescent paints are hidden as ingredients, because the model is valid for opaque,
matte pigments. "Owned" paints are stored per line. The automatic suggestion uses anchor paints (white, black, primaries),
chosen by color proximity in each line (fixed for Acrilex); in lines with more than 120 paints, the pair search uses the 60
closest to the target, so it answers in about 1 s.

### Equivalents in other brands

The number next to each paint is the ΔE00 (lower = closer; green below 2). The **AMMO**/**AK** badge shows that the
**manufacturer itself** declares the equivalence: the conversion tables of those two catalogs were read and linked to the
paints in our catalogs in both directions (about 1,500 links), including the standard references they cite (`RAL 9005`,
`FS 36081`). The badge says what the manufacturer claims; the ΔE says how well the on-screen colors agree, and the two can
differ, because catalogs use swatches from different sources.

## Limitations

- Catalog colors are approximations; **always test** the mix before painting. Wet acrylic usually dries a little darker,
  and the finish changes perception.
- The model does not represent metallic sheen, pearl, translucency or fluorescence.
- The app knows nothing about dilution, layer thickness or the base color; "strength" and the colors obtained in saved
  recipes are there for calibration.
- Catalogs change over time; the data reflects the editions listed in the table.

## Development

```
index.html            page markup (texts use data-i18n)
css/styles.css        styles (automatic light/dark theme)
dados/*.json          color catalogs (the app's data)
js/
  main.js             entry point: language, data, state and modules
  i18n/               pt-BR and en texts (index.js: t(), applyStatic(), setLang())
  color/              color engine (pure, no DOM; also runs in Node)
    convert.js  deltaE.js  optimize.js  spectral.js  mixing.js  suggest.js  nearest.js
  data/
    catalogs.js       loads and normalizes the JSONs; tabs, lines, names
    sets.js           paint lines that can be ingredients (filters and anchors)
    equivalences.js   equivalences declared by manufacturers
  data/acabamento.js  normalized finish (matte, satin, gloss, metallic, clear, effect) and filters
  state/              store.js (state and localStorage), backup.js (export/import), tenho.js (bulk marking)
  ui/                 one module per screen section (help.js: step-by-step guide and example)
tests/                tests (node --test)
tools/servidor.mjs    static server for development
ferramentas/          data extractors (Node)
legado/               historical material (outside the app and the site)
catalogos/            old static HTML pages (Tamiya, Revell, Acrilex)
```

- **Tests:** `npm test`. They include equivalence tests against the original engine (values recorded in
  `tests/golden.json`, to make sure refactoring does not change the calculation) and tests for each catalog's data, the
  ingredient lines, the equivalences and internationalization.
- **Adding an ingredient line:** one entry in `INGREDIENT_SETS` (`js/data/sets.js`).
- **Adding a target catalog:** a JSON in `dados/`, the mapping in `buildCatalogs` and the tab in `TARGET_TABS`
  (`js/data/catalogs.js`); tag each paint with `line` if the catalog has lines.
- **Texts and languages:** all texts live in `js/i18n/pt-BR.js` and `js/i18n/en.js` (a test requires the same keys and
  placeholders in both). In HTML use `data-i18n`; in JavaScript, `t('key', {variable: value})`. For a new language, create
  the dictionary and register it in `js/i18n/index.js`.

## Credits, license and notices

- **Idea and direction:** [Prof. Dr. David Buzatto](https://davidbuzatto.com.br/).
- **Development:** [Claude](https://claude.com/claude-code) (Anthropic), an AI assistant, under the author's direction.
- **Scale75 catalog:** proposed by [Marden](https://github.com/mardden), who put together the first version of the data from
  Scalemates; the current data were rebuilt from Scale75's official website and adjusted by the author.
- **License:** code under the [MIT license](LICENSE). The color data are approximations derived from third-party catalogs
  and websites, provided for informational use, without warranty and **without affiliation, sponsorship or endorsement**
  by the manufacturers; names and trademarks belong to their owners.
