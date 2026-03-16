const API_URL = "http://localhost:8080";

let usuarioLogado = null;

// Pega o token salvo no login
const token = localStorage.getItem("token");

// Se não tiver token, redireciona para login
if (!token) {
  window.location.href = "index.html";
} else {
  // Chama a API para pegar os dados do usuário logado
  fetch(`${API_URL}/home/me`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  })
      .then(response => {
        if (!response.ok) {
          // Token inválido ou expirado
          localStorage.removeItem("token");
          window.location.href = "index.html";
          throw new Error("Token inválido ou expirado");
        }
        return response.json();
      })
      .then(user => {
        usuarioLogado = user; // salva globalmente para uso em adicionarPedido/adicionarSolic
        atualizarUI(user);
      })
      .catch(error => {
        console.error("Erro ao buscar usuário logado:", error);
      });
}

/* Atualiza TODOS os pontos da UI que exibem dados do usuário */
function atualizarUI(usuario) {
  const { nome, cargo, email } = usuario;
  const inicial = nome.charAt(0).toUpperCase();

  // Header
  document.getElementById('header-avatar').textContent  = inicial;
  document.getElementById('header-nome').textContent    = nome;

  // Dropdown do usuário
  document.getElementById('dropdown-nome').textContent  = nome;
  document.getElementById('dropdown-cargo').textContent = cargo + ' • Pharma Plus';

  // Side panel de perfil — exibição
  document.getElementById('perfil-ava').textContent     = inicial;
  document.getElementById('perfil-nome').textContent    = nome;
  document.getElementById('perfil-cargo').textContent   = cargo + ' • Pharma Plus';

  // Side panel de perfil — inputs editáveis
  document.getElementById('perfil-input-nome').value   = nome;
  document.getElementById('perfil-input-email').value  = email;
  document.getElementById('perfil-input-cargo').value  = cargo;
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}


const medicamentos = [
  /*
    Exemplo de objeto que virá da API:
    {
      id: 1,
      nome: "Dipirona 500mg",
      ativo: "Metamizol",
      fabricante: "EMS",
      categoria: "Analgésico",
      quantidade: 120,
      validade: "2026-08-01",
      prateleira: "A3 - Fileira 2",
      dosagem: "500mg",
      statusEstoque: "OK"   // "OK" | "Baixo" | "Crítico"
    }
  */
];

const pedidos = [
  /*
    {
      id: 1,
      medicamento: "Amoxicilina 250mg",
      motivo: "Zerou o estoque",
      solicitante: "Ana Silva",
      data: "2025-06-10",
      prioridade: "Alta",
      situacao: "Pendente"  // "Pendente" | "Em andamento" | "Concluído"
    }
  */
];

const solicitacoes = [
  /*
    {
      id: 1,
      de: "Ana Silva",
      tipo: "duvida",
      mensagem: "Qual a dosagem correta de Amoxicilina para crianças?",
      data: "Hoje, 10:32",
      lida: false
    }
  */
];


function toggleDropdown() {
  document.getElementById('user-dropdown').classList.toggle('open');
}

function fecharDropdown() {
  document.getElementById('user-dropdown').classList.remove('open');
}

// Fecha o dropdown ao clicar fora
document.addEventListener('click', e => {
  const wrap = document.getElementById('user-menu-wrap');
  if (wrap && !wrap.contains(e.target)) fecharDropdown();
});


function abrirSidePanel(tipo) {
  fecharDropdown();
  document.getElementById('side-overlay').classList.add('open');
  document.getElementById('side-perfil').classList.remove('open');
  document.getElementById('side-solic').classList.remove('open');
  document.getElementById('side-' + tipo).classList.add('open');
}

function fecharSidePanel() {
  document.getElementById('side-overlay').classList.remove('open');
  document.getElementById('side-perfil').classList.remove('open');
  document.getElementById('side-solic').classList.remove('open');
}


function openTab(nome) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + nome).classList.add('active');
  document.getElementById('tab-' + nome).classList.add('active');
}


async function renderEstoque() {
  const tbody     = document.getElementById('corpo-estoque');
  const statTotal = document.getElementById('stat-total');
  const statBaixo = document.getElementById('stat-baixo');

  try {
    const res  = await fetch(`${API_URL}/estoque/listar`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const lista = await res.json();

    if (lista.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <p>Nenhum medicamento cadastrado ainda.</p>
            <p style="margin-top:6px;font-size:12px">Clique em + Adicionar Produto para começar.</p>
          </div>
        </td></tr>`;
      statTotal.textContent = '0';
      statBaixo.textContent = '0';
      return;
    }

    let baixo = 0;
    tbody.innerHTML = lista.map(m => {
      const statusPill = m.status === 'Disponível'
        ? `<span class="pill pill-green">✓ Disponível</span>`
        : `<span class="pill pill-amber">📦 Estoque</span>`;

      if (m.status !== 'Disponível') baixo++;

      return `
        <tr onclick="abrirModal(${m.id})" style="cursor:pointer">
          <td><strong>${m.nome}</strong></td>
          <td>${m.categoria}</td>
          <td>${m.quantidade}</td>
          <td>${formatarData(m.validade)}</td>
          <td><span style="font-family:'DM Mono',monospace;font-size:13px">${m.prateleira}</span></td>
          <td>${statusPill}</td>
        </tr>`;
    }).join('');

    statTotal.textContent = lista.length;
    statBaixo.textContent = baixo;

    // guarda lista globalmente para uso no modal
    window._medicamentos = lista;

  } catch (err) {
    console.error('Erro ao carregar estoque:', err);
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <p>Erro ao carregar estoque. Verifique o servidor.</p>
        </div>
      </td></tr>`;
  }
}


function renderPedidos() {
  const tbody = document.getElementById('corpo-pedidos');

  if (pedidos.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <p>Nenhum pedido registrado.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = pedidos.map(p => {
    const priorPill = p.prioridade === 'Alta'
      ? `<span class="pill pill-red">🔴 Alta</span>`
      : p.prioridade === 'Média'
        ? `<span class="pill pill-amber">🟡 Média</span>`
        : `<span class="pill pill-green">🟢 Baixa</span>`;

    const sitPill = p.situacao === 'Pendente'
      ? `<span class="pill pill-amber">Pendente</span>`
      : p.situacao === 'Em andamento'
        ? `<span class="pill pill-blue">Em andamento</span>`
        : `<span class="pill pill-green">Concluído</span>`;

    return `
      <tr>
        <td><strong>${p.medicamento}</strong></td>
        <td>${p.motivo}</td>
        <td>${p.solicitante}</td>
        <td>${formatarData(p.data)}</td>
        <td>${priorPill}</td>
        <td>${sitPill}</td>
      </tr>`;
  }).join('');
}


function renderBuscar() {
  const tbody = document.getElementById('corpo-buscar');

  if (medicamentos.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>Nenhum medicamento disponível para busca.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = medicamentos.map(m => `
    <tr onclick="abrirModal(${m.id})">
      <td><strong>${m.nome}</strong></td>
      <td>${m.ativo}</td>
      <td>${m.fabricante}</td>
      <td>${m.categoria}</td>
      <td><span style="font-family:'DM Mono',monospace;font-size:13px">${m.prateleira}</span></td>
      <td>${m.quantidade}</td>
    </tr>`).join('');
}


function renderSolicitacoes() {
  const lista          = document.getElementById('lista-solicitacoes');
  const badge          = document.getElementById('solic-badge');
  const badgeDropdown  = document.getElementById('solic-badge-dropdown');

  if (solicitacoes.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>Nenhuma solicitação no momento.</p>
      </div>`;
    badge.style.display = 'none';
    badgeDropdown.style.display = 'none';
    return;
  }

  const naoLidas = solicitacoes.filter(s => !s.lida).length;
  badge.textContent = naoLidas;
  badge.style.display = naoLidas > 0 ? 'flex' : 'none';
  badgeDropdown.textContent = naoLidas;
  badgeDropdown.style.display = naoLidas > 0 ? 'flex' : 'none';

  lista.innerHTML = solicitacoes.map(s => {
    const tipoLabel = s.tipo === 'horario' ? '📅 Agendamento'
      : s.tipo === 'duvida' ? '❓ Dúvida'
      : '💊 Farmacêutico → Atendente';

    return `
      <div class="solic-card">
        <div class="solic-ava ava-green">${s.de.charAt(0)}</div>
        <div class="solic-body">
          <div class="solic-name">${s.de}
            <span class="pill pill-blue" style="font-size:11px;margin-left:6px">${tipoLabel}</span>
          </div>
          <div class="solic-text">${s.mensagem}</div>
          <div class="solic-meta">🕐 ${s.data}</div>
        </div>
        <div class="solic-actions">
          <button class="btn btn-outline" style="padding:6px 12px">Responder</button>
        </div>
      </div>`;
  }).join('');
}



function abrirModal(id) {
  const lista = window._medicamentos || [];
  const m = lista.find(x => x.id === id);
  if (!m) return;

  document.getElementById('modal-med-nome').textContent = m.nome;
  document.getElementById('modal-ativo').textContent    = m.categoria;
  document.getElementById('modal-fab').textContent      = m.status;
  document.getElementById('modal-cat').textContent      = m.categoria;
  document.getElementById('modal-val').textContent      = formatarData(m.validade);
  document.getElementById('modal-qtd').textContent      = m.quantidade + ' caixas';
  document.getElementById('modal-dos').textContent      = m.status;
  document.getElementById('modal-prat').textContent     = m.prateleira;
  document.getElementById('modal-med').classList.add('open');
}


function abrirModalProduto() {
  document.getElementById('modal-produto').classList.add('open');
}

async function adicionarProduto() {
  const nome       = document.getElementById('produto-nome').value.trim();
  const categoria  = document.getElementById('produto-categoria').value;
  const quantidade = parseInt(document.getElementById('produto-quantidade').value);
  const validade   = document.getElementById('produto-validade').value;
  const prateleira = document.getElementById('produto-prateleira').value.trim();
  const status     = document.getElementById('produto-status').value;
  const msgEl      = document.getElementById('msg-produto');
  const btn        = document.querySelector('#modal-produto .btn-primary');

  if (!nome || !categoria || !quantidade || !validade || !prateleira) {
    msgEl.className   = 'msg error';
    msgEl.textContent = 'Preencha todos os campos obrigatórios.';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Salvando...';
  msgEl.className = 'msg';

  try {
    const res = await fetch(`${API_URL}/estoque/salvar`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ nome, categoria, quantidade, validade, prateleira, status })
    });

    const data = await res.json();

    if (!data.sucesso) {
      msgEl.className   = 'msg error';
      msgEl.textContent = data.mensagem || 'Erro ao salvar.';
      return;
    }

    msgEl.className   = 'msg success';
    msgEl.textContent = 'Medicamento salvo com sucesso!';

    // Limpa o formulário e atualiza a tabela
    setTimeout(() => {
      fecharModal('modal-produto');
      document.getElementById('produto-nome').value      = '';
      document.getElementById('produto-quantidade').value = '';
      document.getElementById('produto-validade').value   = '';
      document.getElementById('produto-prateleira').value = '';
      msgEl.className = 'msg';
      renderEstoque();
    }, 800);

  } catch (err) {
    console.error('Erro ao salvar produto:', err);
    msgEl.className   = 'msg error';
    msgEl.textContent = 'Não foi possível conectar ao servidor.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Salvar Medicamento';
  }
}

function fecharModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Fechar modais clicando no overlay
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});


function abrirModalPedido() {
  document.getElementById('modal-pedido').classList.add('open');
}

function adicionarPedido() {
  const nome      = document.getElementById('pedido-nome').value.trim();
  const motivo    = document.getElementById('pedido-motivo').value.trim();
  const prioridade = document.getElementById('pedido-prioridade').value;

  if (!nome || !motivo) {
    alert('Preencha o nome e o motivo.');
    return;
  }

  // Estrutura pronta para envio à API
  const novoPedido = {
    id:          pedidos.length + 1,
    medicamento: nome,
    motivo:      motivo,
    solicitante: usuarioLogado ? usuarioLogado.nome : 'Usuário',
    data:        new Date().toISOString().split('T')[0],
    prioridade:  prioridade,
    situacao:    'Pendente'
  };

  // TODO: await fetch('/api/pedidos', { method: 'POST', body: JSON.stringify(novoPedido) })
  pedidos.push(novoPedido);
  fecharModal('modal-pedido');
  renderPedidos();
  document.getElementById('pedido-nome').value   = '';
  document.getElementById('pedido-motivo').value = '';
}


function abrirModalSolic() {
  document.getElementById('modal-solic').classList.add('open');
}

function adicionarSolic() {
  const tipo = document.getElementById('solic-tipo').value;
  const msg  = document.getElementById('solic-msg').value.trim();

  if (!msg) {
    alert('Escreva uma mensagem.');
    return;
  }

  const nova = {
    id:       solicitacoes.length + 1,
    de:       usuarioLogado ? usuarioLogado.nome : 'Usuário',
    tipo:     tipo,
    mensagem: msg,
    data:     'Agora',
    lida:     false
  };

  // TODO: await fetch('/api/solicitacoes', { method: 'POST', body: JSON.stringify(nova) })
  solicitacoes.push(nova);
  fecharModal('modal-solic');
  renderSolicitacoes();
  document.getElementById('solic-msg').value = '';
}

function filtrarTabela(tabelaId, termo) {
  const linhas = document.querySelectorAll(`#${tabelaId} tbody tr`);
  linhas.forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(termo.toLowerCase())
      ? '' : 'none';
  });
}


/* ════════════════════════════════════════
   PERFIL — SALVAR
════════════════════════════════════════ */
function salvarPerfil() {
  const nome  = document.getElementById('perfil-input-nome').value.trim();
  const cargo = document.getElementById('perfil-input-cargo').value.trim();
  const email = document.getElementById('perfil-input-email').value.trim();

  if (!nome || !cargo) {
    alert('Nome e cargo são obrigatórios.');
    return;
  }

  // Atualiza o objeto central — todos os pontos da UI refletem automaticamente
  if (usuarioLogado) {
    usuarioLogado.nome  = nome;
    usuarioLogado.cargo = cargo;
    usuarioLogado.email = email;
    atualizarUI(usuarioLogado);
  }

  // TODO: await fetch('/api/perfil', { method: 'PUT', body: JSON.stringify({ nome, cargo, email }) })
  alert('Perfil atualizado com sucesso!');
}


function formatarData(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}


renderEstoque();
renderPedidos();
renderBuscar();
renderSolicitacoes();
