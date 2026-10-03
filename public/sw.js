// Service worker do Painel AMUT.
// Respostas da API nunca são guardadas em cache: contêm dados pessoais de pacientes.
const VERSAO_CACHE = 'amut-painel-v1';

const ARQUIVOS_BASE = [
  '/login.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/img/logo.png',
  '/assets/img/icons/icon-192.png',
  '/assets/img/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSAO_CACHE)
      .then((cache) => cache.addAll(ARQUIVOS_BASE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes.filter((nome) => nome !== VERSAO_CACHE).map((nome) => caches.delete(nome))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Rede primeiro, para que atualizações do sistema apareçam logo; cache só como reserva offline.
  event.respondWith(
    fetch(request)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(VERSAO_CACHE).then((cache) => cache.put(request, copia));
        }
        return resposta;
      })
      .catch(async () => {
        const emCache = await caches.match(request, { ignoreSearch: true });
        if (emCache) return emCache;
        if (request.mode === 'navigate') return caches.match('/offline.html');
        return Response.error();
      })
  );
});
