/**
 * Service worker: deixa o app instalável e funcionando sem rede depois da primeira visita.
 *
 * - Na instalação, guarda todos os arquivos do app (lista abaixo; o teste `tests/pwa.test.js` confere se ela está completa).
 * - Depois, responde do cache e atualiza o cache em segundo plano ("stale-while-revalidate"): uma versão nova do app
 *   aparece na abertura seguinte à publicação. Para forçar a troca de tudo de uma vez, mude `VERSAO`.
 * - Só mexe em pedidos GET da própria origem; o resto (por exemplo, as páginas em `catalogos/`) segue pela rede.
 */

const VERSAO = 'misturador-v1.0.6';

const ARQUIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/color/convert.js',
  'js/color/deltaE.js',
  'js/color/mixing.js',
  'js/color/nearest.js',
  'js/color/optimize.js',
  'js/color/spectral.js',
  'js/color/suggest.js',
  'js/data/acabamento.js',
  'js/data/catalogs.js',
  'js/data/equivalences.js',
  'js/data/sets.js',
  'js/i18n/en.js',
  'js/i18n/index.js',
  'js/i18n/pt-BR.js',
  'js/main.js',
  'js/state/backup.js',
  'js/state/store.js',
  'js/state/tenho.js',
  'js/ui/about.js',
  'js/ui/catalogo.js',
  'js/ui/dom.js',
  'js/ui/equivalents.js',
  'js/ui/help.js',
  'js/ui/ingredients.js',
  'js/ui/picker.js',
  'js/ui/recipes.js',
  'js/ui/result.js',
  'js/ui/settings.js',
  'js/ui/suggestions.js',
  'js/ui/targets.js',
  'dados/acrilex-cores-oficial.json',
  'dados/acrilex-linhas-cores.json',
  'dados/ak-cores.json',
  'dados/ammo-cores.json',
  'dados/artesania-cores.json',
  'dados/fs595-cores.json',
  'dados/humbrol-cores.json',
  'dados/mrcolor-cores.json',
  'dados/occre-cores.json',
  'dados/phoenix-cores.json',
  'dados/ral-cores.json',
  'dados/revell-cores-oficial.json',
  'dados/scale75-cores.json',
  'dados/talento-cores.json',
  'dados/tamiya-cores-oficial.json',
  'dados/tomcolors-cores.json',
  'dados/vallejo-cores.json',
  'icones/icone.svg',
  'icones/icone-192.png',
  'icones/icone-512.png',
  'icones/icone-maskable-512.png',
  'icones/apple-touch-icon.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // páginas de catálogo da marca (grandes e só para consulta online) não entram no cache do app
  if (url.pathname.includes('/catalogos/')) return;
  evento.respondWith(
    caches.open(VERSAO).then(async (cache) => {
      const guardado = await cache.match(req, { ignoreSearch: true });
      const rede = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (guardado) {
        evento.waitUntil(rede);
        return guardado;
      }
      return (await rede) || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
    })
  );
});
