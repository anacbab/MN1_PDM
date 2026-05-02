/**
 * ============================================================================
 * SERVICE WORKER - PWA
 * ============================================================================
 * 
 * Responsável por:
 * - Interceptar requisições HTTP
 * - Gerenciar cache para funcionalidade offline
 * - Atualizar cache conforme a aplicação é usada
 * 
 * IMPORTANTE: Sempre incrementar a versão quando arquivos mudam
 * Isso força navegadores a atualizar o cache
 */

// ============================================================================
// CONFIGURAÇÃO DO CACHE
// ============================================================================

// Versão do cache - INCREMENTAR quando arquivos mudam
const CACHE_VERSION = 3;
const CACHE_NAME = `app-cache-v${CACHE_VERSION}`;

// Arquivos essenciais para funcionar offline
const CACHE_ARQUIVOS = [
  './',                    // Página raiz
  './index.html',          // HTML principal
  './script.js',           // JavaScript da app
  './manifest.json',       // Manifest da PWA
  './service-worker.js'    // Este arquivo
];

// ============================================================================
// EVENTO: INSTALL (Instalação do Service Worker)
// ============================================================================
/**
 * Executado quando o Service Worker é instalado
 * Cria o cache e pré-carrega os arquivos essenciais
 */
self.addEventListener('install', function(evento) {
  console.log('Service Worker: Instalando...');
  
  evento.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Service Worker: Adicionando arquivos ao cache');
      return cache.addAll(CACHE_ARQUIVOS);
    }).then(() => {
      // Força ativação imediata do novo SW
      return self.skipWaiting();
    })
  );
});

// ============================================================================
// EVENTO: ACTIVATE (Ativação do Service Worker)
// ============================================================================
/**
 * Executado quando o Service Worker é ativado
 * Remove caches antigos e assume o controle das páginas
 */
self.addEventListener('activate', function(evento) {
  console.log('Service Worker: Ativando...');
  
  evento.waitUntil(
    caches.keys().then(function(nomesCaches) {
      // Remove caches de versões antigas
      return Promise.all(
        nomesCaches.map(function(nome) {
          if (nome !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo -', nome);
            return caches.delete(nome);
          }
        })
      );
    }).then(() => {
      // Assume controle de todas as abas
      return self.clients.claim();
    })
  );
});

// ============================================================================
// EVENTO: FETCH (Interceptação de Requisições)
// ============================================================================
/**
 * Estratégia: Cache First, Network Fallback
 * - Primeiro tenta servir do cache
 * - Se não tiver, busca na rede
 * - Se falhar, retorna página offline (index.html)
 */
self.addEventListener('fetch', function(evento) {
  const requisicao = evento.request;
  
  // Ignora requisições de métodos não-GET
  if (requisicao.method !== 'GET') {
    return;
  }
  
  evento.respondWith(
    // Procura no cache primeiro
    caches.match(requisicao).then(function(respostaCached) {
      if (respostaCached) {
        console.log('Service Worker: Servindo do cache -', requisicao.url);
        return respostaCached;
      }
      
      // Se não estiver em cache, busca na rede
      return fetch(requisicao).then(function(respostaRede) {
        // Valida a resposta
        if (!respostaRede || respostaRede.status !== 200 || respostaRede.type === 'error') {
          return respostaRede;
        }
        
        // Clona a resposta para usar duas vezes
        const respostaClone = respostaRede.clone();
        
        // Adiciona à cache para próximas requisições
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(requisicao, respostaClone);
        });
        
        return respostaRede;
      }).catch(function() {
        // Se a rede falhar, retorna uma página offline
        console.warn('Service Worker: Falha na rede, retornando cache');
        return caches.match('./index.html');
      });
    })
  );
});