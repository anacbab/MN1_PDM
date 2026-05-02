/**
 * ============================================================================
 * PWA E-COMMERCE - SCRIPT PRINCIPAL
 * ============================================================================
 * 
 * Aplicação Single Page Application (SPA) com PWA
 * Recursos: Navegação entre telas, requisições HTTP, cache offline, instalação
 * 
 * Padrão: Module Pattern + Event Driven Architecture
 */

// ============================================================================
// CONFIGURAÇÕES GERAIS
// ============================================================================

const CONFIG = {
  API_BASE: 'https://fakestoreapi.com',
  CACHE_TIMEOUT: 5000,
  CATEGORIES: {
    'electronics': ' Eletrônicos',
    'men\'s clothing': ' Vestuário Masculino',
    'women\'s clothing': ' Vestuário Feminino',
    'jewelery': ' Acessórios'
  }
};

// ============================================================================
// ESTADO DA APLICAÇÃO
// ============================================================================

const appState = {
  telaAtual: 'tela-home',
  telaAnterior: 'tela-home',
  carregando: false,
  instaladorApp: null
};

// ============================================================================
// GERENCIADOR DE CARRINHO
// ============================================================================

const Carrinho = {
  itens: [],
  
  /**
   * Inicializa o carrinho carregando dados do localStorage
   */
  inicializar: function() {
    const dadosSalvos = localStorage.getItem('carrinho');
    this.itens = dadosSalvos ? JSON.parse(dadosSalvos) : [];
    this.atualizarUI();
  },
  
  /**
   * Adiciona um produto ao carrinho
   * @param {Object} produto - Dados do produto (id, title, price, image)
   */
  adicionar: function(produto) {
    // Procura se o produto já existe no carrinho
    const produtoExistente = this.itens.find(item => item.id === produto.id);
    
    if (produtoExistente) {
      // Se existe, apenas incrementa a quantidade
      produtoExistente.quantidade++;
    } else {
      // Se não existe, adiciona novo item com quantidade 1
      this.itens.push({
        id: produto.id,
        title: produto.title,
        price: produto.price,
        image: produto.image,
        quantidade: 1
      });
    }
    
    this.salvar();
    this.atualizarUI();
    this.mostrarNotificacao('Produto adicionado ao carrinho! ');
  },
  
  /**
   * Remove um produto do carrinho
   * @param {number} id - ID do produto a remover
   */
  remover: function(id) {
    this.itens = this.itens.filter(item => item.id !== id);
    this.salvar();
    this.atualizarUI();
  },
  
  /**
   * Incrementa a quantidade de um produto
   * @param {number} id - ID do produto
   */
  incrementar: function(id) {
    const item = this.itens.find(item => item.id === id);
    if (item) {
      item.quantidade++;
      this.salvar();
      this.atualizarUI();
    }
  },
  
  /**
   * Decrementa a quantidade de um produto
   * @param {number} id - ID do produto
   */
  decrementar: function(id) {
    const item = this.itens.find(item => item.id === id);
    if (item) {
      item.quantidade--;
      if (item.quantidade <= 0) {
        this.remover(id);
      } else {
        this.salvar();
        this.atualizarUI();
      }
    }
  },
  
  /**
   * Calcula o total do carrinho
   */
  obterTotal: function() {
    return this.itens.reduce((total, item) => 
      total + (item.price * item.quantidade), 0
    );
  },
  
  /**
   * Obtém a quantidade total de itens
   */
  obterQuantidadeItens: function() {
    return this.itens.reduce((total, item) => total + item.quantidade, 0);
  },
  
  /**
   * Salva o carrinho no localStorage
   */
  salvar: function() {
    localStorage.setItem('carrinho', JSON.stringify(this.itens));
  },
  
  /**
   * Limpa o carrinho completamente
   */
  limpar: function() {
    this.itens = [];
    this.salvar();
    this.atualizarUI();
  },
  
  /**
   * Atualiza a interface do carrinho
   */
  atualizarUI: function() {
    // Atualiza contador na navbar
    const contador = document.getElementById('contadorCarrinho');
    const qtd = this.obterQuantidadeItens();
    
    if (qtd > 0) {
      contador.textContent = qtd;
      contador.style.display = 'inline-block';
    } else {
      contador.style.display = 'none';
    }
    
    // Atualiza total
    const totalElement = document.getElementById('totalCarrinho');
    if (totalElement) {
      totalElement.textContent = `R$ ${this.obterTotal().toFixed(2)}`;
    }
    
    // Renderiza itens na tela do carrinho
    this.renderizarItens();
  },
  
  /**
   * Renderiza os itens na tela do carrinho
   */
  renderizarItens: function() {
    const container = document.getElementById('itensCarrinho');
    const carrinhoVazio = document.getElementById('carrinhoVazio');
    const btnFinalizar = document.getElementById('btnFinalizarCompra');
    
    if (this.itens.length === 0) {
      container.innerHTML = '';
      carrinhoVazio.style.display = 'block';
      btnFinalizar.disabled = true;
      return;
    }
    
    carrinhoVazio.style.display = 'none';
    btnFinalizar.disabled = false;
    
    let html = '';
    this.itens.forEach(item => {
      const subtotal = (item.price * item.quantidade).toFixed(2);
      html += `
        <div class="card mb-3">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-2">
                <img src="${item.image}" class="img-fluid" alt="${item.title}" style="max-height: 80px; object-fit: contain;">
              </div>
              <div class="col-md-5">
                <h6>${item.title}</h6>
                <p class="mb-0 text-muted">R$ ${item.price.toFixed(2)}</p>
              </div>
              <div class="col-md-3">
                <div class="input-group input-group-sm">
                  <button class="btn btn-outline-secondary" onclick="Carrinho.decrementar(${item.id})">−</button>
                  <input type="text" class="form-control text-center" value="${item.quantidade}" readonly style="max-width: 50px;">
                  <button class="btn btn-outline-secondary" onclick="Carrinho.incrementar(${item.id})">+</button>
                </div>
              </div>
              <div class="col-md-2 text-end">
                <div class="mb-2">
                  <strong>R$ ${subtotal}</strong>
                </div>
                <button class="btn btn-sm btn-danger" onclick="Carrinho.remover(${item.id})">
                   Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  },
  
  /**
   * Mostra notificação toast
   * @param {string} mensagem - Texto da notificação
   */
  mostrarNotificacao: function(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-success position-fixed bottom-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
};

// ============================================================================
// GERENCIADOR DE NAVEGAÇÃO
// ============================================================================

const Navegacao = {
  /**
   * Troca entre telas da aplicação
   * @param {string} nomeTela - ID da tela a ser exibida
   */
  ir: function(nomeTela) {
    // Remove classe 'show' de todas as telas e adiciona 'collapse'
    const telas = document.querySelectorAll('.tela');
    telas.forEach(tela => {
      tela.classList.remove('show');
      tela.classList.add('collapse');
    });
    
    // Mostra a tela desejada
    const telaSelecionada = document.getElementById(nomeTela);
    if (telaSelecionada) {
      telaSelecionada.classList.remove('collapse');
      telaSelecionada.classList.add('show');
      
      // Atualiza estado
      appState.telaAnterior = appState.telaAtual;
      appState.telaAtual = nomeTela;
    }
  },

  /**
   * Volta para a tela anterior
   */
  voltar: function() {
    this.ir(appState.telaAnterior);
  }
};

// ============================================================================
// GERENCIADOR DE PRODUTOS
// ============================================================================

const Produtos = {
  /**
   * Carrega e exibe produtos de uma categoria
   * @param {string} categoria - Categoria de produtos (vazia = todos)
   */
  carregarPorCategoria: async function(categoria = '') {
    try {
      Produtos.mostrarCarregamento(true);
      
      // Constrói URL da API com encoding correto
      const url = categoria 
        ? `${CONFIG.API_BASE}/products/category/${encodeURIComponent(categoria)}`
        : `${CONFIG.API_BASE}/products`;
      
      // Requisição HTTP com tratamento de erro
      const { data: produtos } = await axios.get(url, {
        timeout: CONFIG.CACHE_TIMEOUT
      });
      
      // Renderiza produtos na tela
      Produtos.renderizarListaProdutos(produtos);
      Navegacao.ir('tela-home');
      
    } catch (erro) {
      Produtos.tratarErro('Erro ao carregar produtos', erro);
    } finally {
      Produtos.mostrarCarregamento(false);
    }
  },

  /**
   * Carrega detalhes de um produto específico
   * @param {number} id - ID do produto
   */
  abrirDetalhes: async function(id) {
    try {
      Produtos.mostrarCarregamento(true);
      Navegacao.ir('tela-produto');
      
      const { data: produto } = await axios.get(
        `${CONFIG.API_BASE}/products/${id}`,
        { timeout: CONFIG.CACHE_TIMEOUT }
      );
      
      Produtos.renderizarDetalhes(produto);
      
    } catch (erro) {
      Produtos.tratarErro('Erro ao carregar detalhes', erro);
    } finally {
      Produtos.mostrarCarregamento(false);
    }
  },

  /**
   * Renderiza a lista de produtos no DOM
   * @param {Array} produtos - Array com dados dos produtos
   */
  renderizarListaProdutos: function(produtos) {
    const telaHome = document.getElementById('tela-home');
    telaHome.innerHTML = '';
    
    if (produtos.length === 0) {
      telaHome.innerHTML = '<div class="col-12 text-center">Nenhum produto encontrado</div>';
      return;
    }
    
    produtos.forEach(produto => {
      const card = document.createElement('div');
      card.className = 'col';
      card.innerHTML = `
        <div class="card h-100 shadow-sm" onclick="Produtos.abrirDetalhes(${produto.id})">
          <img 
            src="${produto.image}" 
            class="card-img-top p-3" 
            style="height: 250px; object-fit: contain;"
            alt="${produto.title}"
          >
          <div class="card-body d-flex flex-column">
            <h6 class="card-title flex-grow-1">${produto.title}</h6>
            <span class="badge badge-preco mt-2">R$ ${produto.price.toFixed(2)}</span>
            <div class="mt-2">
              <small class="text-muted">⭐ ${produto.rating.rate} (${produto.rating.count})</small>
            </div>
          </div>
        </div>
      `;
      telaHome.appendChild(card);
    });
    
    telaHome.classList.remove('d-none');
  },

  /**
   * Renderiza os detalhes de um produto individual
   * @param {Object} produto - Dados do produto
   */
  renderizarDetalhes: function(produto) {
    const container = document.getElementById('detalhes-produto');
    
    container.innerHTML = `
      <div class="row g-4">
        <div class="col-md-4 text-center">
          <img 
            src="${produto.image}" 
            class="img-fluid rounded" 
            alt="${produto.title}"
            style="max-height: 400px; object-fit: contain;"
          >
        </div>
        <div class="col-md-8">
          <h2 class="mb-3">${produto.title}</h2>
          
          <div class="mb-3">
            <span class="badge bg-success p-2">
              ${CONFIG.CATEGORIES[produto.category] || produto.category}
            </span>
          </div>
          
          <div class="card mb-3">
            <div class="card-body">
              <h4 class="card-title text-danger">R$ ${produto.price.toFixed(2)}</h4>
              <p class="card-text">
                <strong>Avaliação:</strong> ⭐ ${produto.rating.rate}/5.0 
                <small class="text-muted">(${produto.rating.count} avaliações)</small>
              </p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-body">
              <h6 class="card-subtitle mb-2">Descrição</h6>
              <p class="card-text">${produto.description}</p>
            </div>
          </div>
          
          <button class="btn btn-primary btn-lg mt-4 w-100" id="btnAdicionarCarrinho">
            🛒 Adicionar ao Carrinho
          </button>
        </div>
      </div>
    `;
    
    // Adiciona event listener ao botão (após renderizar)
    setTimeout(() => {
      const btn = document.getElementById('btnAdicionarCarrinho');
      if (btn) {
        btn.addEventListener('click', () => {
          Carrinho.adicionar(produto);
        });
      }
    }, 0);
  },

  /**
   * Mostra/oculta indicador de carregamento
   * @param {boolean} ativo - True para mostrar, false para ocultar
   */
  mostrarCarregamento: function(ativo) {
    const loader = document.getElementById('loader');
    appState.carregando = ativo;
    
    if (ativo) {
      loader.classList.remove('d-none');
    } else {
      loader.classList.add('d-none');
    }
  },

  /**
   * Trata erros de requisição
   * @param {string} mensagem - Mensagem de erro personalizada
   * @param {Error} erro - Objeto de erro
   */
  tratarErro: function(mensagem, erro) {
    console.error(mensagem, erro);
    
    if (erro.response) {
      console.error('Status:', erro.response.status);
    } else if (erro.request) {
      console.warn('Sem resposta do servidor. Verifique sua conexão.');
    }
  }
};

// ============================================================================
// GERENCIADOR DE PWA (INSTALAÇÃO E SERVICE WORKER)
// ============================================================================

const PWA = {
  /**
   * Inicializa o Service Worker para funcionalidade offline
   */
  registrarServiceWorker: function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(registro => console.log('Service Worker registrado:', registro))
        .catch(erro => console.warn('Erro ao registrar SW:', erro));
    }
  },

  /**
   * Monitora o evento de instalação de app
   */
  monitorarInstalacao: function() {
    window.addEventListener('beforeinstallprompt', (evento) => {
      evento.preventDefault();
      appState.instaladorApp = evento;
      
      // Mostra botão de instalação
      const btnInstalar = document.getElementById('installAppBt');
      btnInstalar.classList.remove('d-none');
    });
  },

  /**
   * Instala a aplicação no dispositivo
   */
  instalar: function() {
    if (appState.instaladorApp) {
      appState.instaladorApp.prompt();
      appState.instaladorApp.userChoice.then(resultado => {
        if (resultado.outcome === 'accepted') {
          console.log('App instalado com sucesso!');
        }
        appState.instaladorApp = null;
      });
    }
  }
};

// ============================================================================
// INICIALIZAÇÃO DOS EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  
  // Navegação - Menu de categorias
  document.querySelectorAll('a[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const categoria = link.dataset.category;
      Produtos.carregarPorCategoria(categoria);
      
      // Fecha o menu no mobile
      const navbarCollapse = document.querySelector('.navbar-collapse');
      if (navbarCollapse.classList.contains('show')) {
        document.querySelector('.navbar-toggler').click();
      }
    });
  });
  
  // Navegação - Marca (voltar para todos)
  document.getElementById('navBrand').addEventListener('click', (e) => {
    e.preventDefault();
    Produtos.carregarPorCategoria();
  });
  
  // Navegação - Botão Carrinho
  document.getElementById('btnCarrinho').addEventListener('click', (e) => {
    e.preventDefault();
    Navegacao.ir('tela-carrinho');
  });
  
  // Navegação - Botão Contato
  document.getElementById('btnContato').addEventListener('click', (e) => {
    e.preventDefault();
    Navegacao.ir('tela-contato');
  });
  
  // Navegação - Botões Voltar
  document.getElementById('btnVoltar').addEventListener('click', () => {
    Navegacao.voltar();
  });
  
  document.getElementById('btnVoltarContato').addEventListener('click', () => {
    Navegacao.voltar();
  });
  
  // Navegação - Botão Voltar Carrinho
  document.getElementById('btnVoltarCarrinho').addEventListener('click', () => {
    Navegacao.voltar();
  });
  
  // Carrinho - Finalizar Compra
  document.getElementById('btnFinalizarCompra').addEventListener('click', () => {
    const total = Carrinho.obterTotal();
    alert(` Compra finalizada!\n\nTotal: R$ ${total.toFixed(2)}\n\nObrigado pela compra!`);
    Carrinho.limpar();
    Navegacao.ir('tela-home');
  });
  
  // PWA - Instalação
  document.getElementById('btnInstalar').addEventListener('click', (e) => {
    e.preventDefault();
    PWA.instalar();
  });
  
  // Inicializa PWA
  PWA.registrarServiceWorker();
  PWA.monitorarInstalacao();
  
  // Inicializa carrinho
  Carrinho.inicializar();
  
  // Carrega produtos iniciais
  Produtos.carregarPorCategoria();
  
  // Fecha navbar automaticamente em links
  document.querySelectorAll('.navbar-nav a').forEach(link => {
    link.addEventListener('click', () => {
      const navbarToggler = document.querySelector('.navbar-toggler');
      const navbarCollapse = document.querySelector('.navbar-collapse');
      
      if (navbarCollapse.classList.contains('show')) {
        navbarToggler.click();
      }
    });
  });
});