const API_URL = "http://localhost:8080";

let usuarioLogado  = null;
let _estoqueCache  = [];
let _filtroCateg   = null;
let _buscaTimer    = null;
let _modoEscuro    = localStorage.getItem('theme') === 'dark';

const token = localStorage.getItem("token");
const role  = localStorage.getItem("role") || "ATENDENTE";

if (!token) { window.location.href = "index.html"; }
else {
  fetch(`${API_URL}/home/me`, { headers: { "Authorization": "Bearer " + token } })
    .then(r => {
      if (!r.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "index.html";
        return null;
      }
      return r.json();
    })
    .then(u => {
      if (!u) return;
      usuarioLogado = u;
      atualizarUI(u);
      aplicarPermissoes();
    })
    .catch(e => console.error("Erro auth:", e));
}

if (_modoEscuro) document.documentElement.setAttribute('data-theme', 'dark');

function atualizarUI(u) {
  const ini = (u.nome || '?').charAt(0).toUpperCase();
  document.getElementById('header-avatar').textContent  = ini;
  document.getElementById('header-nome').textContent    = u.nome || 'Usuário';
  document.getElementById('dropdown-nome').textContent  = u.nome || 'Usuário';
  document.getElementById('dropdown-cargo').textContent = (u.cargo || '') + ' • Pharma Plus';
  document.getElementById('perfil-ava').textContent     = ini;
  document.getElementById('perfil-nome').textContent    = u.nome || 'Usuário';
  document.getElementById('perfil-cargo').textContent   = (u.cargo || '') + ' • Pharma Plus';
  document.getElementById('perfil-input-nome').value    = u.nome  || '';
  document.getElementById('perfil-input-email').value   = u.email || '';
  document.getElementById('perfil-input-cargo').value   = u.cargo || '';
  const roleBadge = document.getElementById('role-badge');
  if (roleBadge) {
    const roleMap = { FARMACEUTICO: '💊 Farmacêutico', ATENDENTE: '👤 Atendente' };
    roleBadge.textContent = roleMap[u.role] || u.role || '';
  }
}

function aplicarPermissoes() {
  const r = usuarioLogado?.role || role;
  if (r === 'ATENDENTE') {
    document.querySelectorAll('.admin-only, .farmaceutico-only').forEach(el => el.style.display = 'none');
  }
}

function toggleTema() {
  _modoEscuro = !_modoEscuro;
  document.documentElement.setAttribute('data-theme', _modoEscuro ? 'dark' : 'light');
  localStorage.setItem('theme', _modoEscuro ? 'dark' : 'light');
  const btn = document.getElementById('btn-tema');
  if (btn) btn.textContent = _modoEscuro ? '☀️' : '🌙';
}

function logout() { localStorage.removeItem("token"); localStorage.removeItem("role"); window.location.href = "index.html"; }

function toast(mensagem, tipo = 'success', duracao = 3000) {
  const container = document.getElementById('toast-container') || criarToastContainer();
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  const icones = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  t.innerHTML = `<span class="toast-icon">${icones[tipo] || '✓'}</span><span class="toast-msg">${mensagem}</span>`;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, duracao);
}

function criarToastContainer() {
  const c = document.createElement('div');
  c.id = 'toast-container';
  document.body.appendChild(c);
  return c;
}

function toggleDropdown() { document.getElementById('user-dropdown').classList.toggle('open'); }
function fecharDropdown()  { document.getElementById('user-dropdown').classList.remove('open'); }
document.addEventListener('click', e => {
  const w = document.getElementById('user-menu-wrap');
  if (w && !w.contains(e.target)) fecharDropdown();
});

function abrirSidePanel(tipo) {
  fecharDropdown();
  document.getElementById('side-overlay').classList.add('open');
  ['perfil', 'solic'].forEach(t => document.getElementById('side-' + t).classList.remove('open'));
  document.getElementById('side-' + tipo).classList.add('open');
}
function fecharSidePanel() {
  document.getElementById('side-overlay').classList.remove('open');
  ['perfil', 'solic'].forEach(t => document.getElementById('side-' + t).classList.remove('open'));
}

function openTab(nome) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + nome).classList.add('active');
  document.getElementById('tab-'   + nome).classList.add('active');
  if (nome === 'dashboard') renderDashboard();
}

async function renderDashboard() {
  try {
    const [dashRes, pedidosRes] = await Promise.all([
      fetch(`${API_URL}/estoque/dashboard`, { headers: { 'Authorization': 'Bearer ' + token } }),
      fetch(`${API_URL}/pedidos`,           { headers: { 'Authorization': 'Bearer ' + token } })
    ]);

    if (!dashRes.ok || !pedidosRes.ok) {
      console.error('Erro ao carregar dashboard: resposta não-ok do servidor.');
      return;
    }

    const dash    = await dashRes.json();
    const pedidos = await pedidosRes.json();

    document.getElementById('dash-total').textContent    = dash.total    || 0;
    document.getElementById('dash-baixo').textContent    = (dash.baixo   || 0) + (dash.zerados || 0);
    document.getElementById('dash-vencendo').textContent = (dash.vencendo || []).length;
    document.getElementById('dash-pedidos').textContent  = Array.isArray(pedidos) ? pedidos.filter(p => p.situacao === 'Pendente').length : 0;

    const vEl = document.getElementById('dash-lista-vencendo');
    if (vEl) {
      const lista = dash.vencendo || [];
      vEl.innerHTML = lista.length === 0
        ? `<p style="color:var(--gray-400);font-size:13px;padding:16px 0">Nenhum medicamento vencendo em 30 dias ✓</p>`
        : lista.map(m => {
            const cor = m.diasRestantes < 0 ? 'pill-red' : m.diasRestantes <= 7 ? 'pill-red' : 'pill-amber';
            const txt = m.diasRestantes < 0 ? 'Vencido' : `${m.diasRestantes}d`;
            return `<div class="dash-item">
              <span class="dash-item-nome">${m.nome}</span>
              <span class="pill ${cor}" style="font-size:11px">${txt}</span>
            </div>`;
          }).join('');
    }

    const bEl = document.getElementById('dash-lista-baixo');
    if (bEl) {
      const lista = dash.estoquesBaixos || [];
      bEl.innerHTML = lista.length === 0
        ? `<p style="color:var(--gray-400);font-size:13px;padding:16px 0">Estoque em bom nível ✓</p>`
        : lista.map(m => `<div class="dash-item">
            <span class="dash-item-nome">${m.nome}</span>
            <span class="pill ${m.quantidade === 0 ? 'pill-red' : 'pill-amber'}" style="font-size:11px">${m.quantidade} cx</span>
          </div>`).join('');
    }

    const mEl = document.getElementById('dash-lista-mov');
    if (mEl) {
      const movs = dash.ultimasMovimentacoes || [];
      mEl.innerHTML = movs.length === 0
        ? `<p style="color:var(--gray-400);font-size:13px;padding:16px 0">Nenhuma movimentação ainda.</p>`
        : movs.slice(0, 8).map(m => {
            const icone = m.tipo === 'ENTRADA' ? '↑' : m.tipo === 'SAIDA' ? '↓' : m.tipo === 'STATUS' ? '⟳' : '~';
            const cor   = m.tipo === 'ENTRADA' ? 'var(--green-main)' : m.tipo === 'SAIDA' ? 'var(--red-main)' : 'var(--blue-main)';
            const dt    = new Date(m.dataHora).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
            return `<div class="dash-mov-item">
              <span class="dash-mov-icone" style="color:${cor}">${icone}</span>
              <div class="dash-mov-info">
                <span class="dash-mov-nome">${m.nomeMedicamento}</span>
                <span class="dash-mov-detalhe">${m.responsavel} · ${dt}</span>
              </div>
              ${m.tipo !== 'STATUS'
                ? `<span class="dash-mov-qtd" style="color:${cor}">${m.tipo === 'ENTRADA' ? '+' : '-'}${Math.abs(m.quantidadeDepois - m.quantidadeAntes)}</span>`
                : `<span class="dash-mov-qtd" style="color:${cor}">status</span>`}
            </div>`;
          }).join('');
    }

    renderGraficoCategoria(dash.porCategoria || {});

  } catch (e) {
    console.error('Erro dashboard:', e);
  }
}

function renderGraficoCategoria(porCategoria) {
  const el = document.getElementById('dash-grafico-categ');
  if (!el) return;
  const total = Object.values(porCategoria).reduce((a, b) => a + b, 0);
  if (total === 0) { el.innerHTML = ''; return; }

  const cores = { 'Genérico': 'var(--blue-main)', 'Original': 'var(--amber-main)' };
  el.innerHTML = Object.entries(porCategoria).map(([cat, qtd]) => {
    const pct = Math.round((qtd / total) * 100);
    const cor = cores[cat] || 'var(--green-main)';
    return `<div class="dash-bar-row">
      <span class="dash-bar-label">${cat}</span>
      <div class="dash-bar-track">
        <div class="dash-bar-fill" style="width:${pct}%;background:${cor}"></div>
      </div>
      <span class="dash-bar-val">${qtd}</span>
    </div>`;
  }).join('');
}

async function renderEstoque() {
  const tbody = document.getElementById('corpo-estoque');
  tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span style="font-size:28px">⏳</span><p style="margin-top:8px">Carregando estoque...</p></div></td></tr>`;
  try {
    const res = await fetch(`${API_URL}/estoque/listar`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _estoqueCache = await res.json();
    _filtroCateg  = null;
    renderTabelaEstoque();
    renderStatsEstoque();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span>⚠️</span><p>Erro ao carregar estoque.</p></div></td></tr>`;
  }
}

function renderTabelaEstoque() {
  const tbody = document.getElementById('corpo-estoque');
  const termo = (document.getElementById('search-estoque')?.value || '').toLowerCase();
  let lista = _filtroCateg ? _estoqueCache.filter(m => (m.categoria || '').toLowerCase() === _filtroCateg.toLowerCase()) : _estoqueCache;
  if (termo) lista = lista.filter(m => m.nome.toLowerCase().includes(termo) || (m.categoria || '').toLowerCase().includes(termo));

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span style="font-size:40px">📦</span><p style="margin-top:8px">${_filtroCateg ? 'Nenhum medicamento desta categoria.' : 'Nenhum medicamento cadastrado.'}</p></div></td></tr>`;
    return;
  }

  const hoje  = new Date();
  const r     = usuarioLogado?.role || role;
  const podeEditar = r === 'FARMACEUTICO';

  tbody.innerHTML = lista.map(m => {
    const qtd   = m.quantidade;
    const qPill = qtd === 0 ? `<span class="pill pill-red">✕ Zerado</span>` : qtd <= 5 ? `<span class="pill pill-amber">⚠ Baixo</span>` : `<span class="pill pill-green">✓ OK</span>`;

    const nomeSafe = m.nome.replace(/'/g, "\\'");

    const sPill = m.status === 'Disponível'
      ? `<span class="pill pill-green ${podeEditar ? 'pill-clicavel' : ''}" ${podeEditar ? `onclick="editarStatus(${m.id},'${m.status}')"` : ''} title="${podeEditar ? 'Clique para alterar' : ''}">✓ Disponível</span>`
      : `<span class="pill pill-red ${podeEditar ? 'pill-clicavel' : ''}" ${podeEditar ? `onclick="editarStatus(${m.id},'${m.status}')"` : ''} title="${podeEditar ? 'Clique para alterar' : ''}">✕ ${m.status || 'Indisponível'}</span>`;

    let validadeHtml = formatarData(m.validade);
    if (m.validade) {
      const diff = Math.ceil((new Date(m.validade) - hoje) / 86400000);
      if (diff <= 0)       validadeHtml = `<span class="validade-alerta vencido">${formatarData(m.validade)} 🔴</span>`;
      else if (diff <= 30) validadeHtml = `<span class="validade-alerta vencendo">${formatarData(m.validade)} ⚠️</span>`;
    }

    const controleQtd = podeEditar
      ? `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <button class="qty-btn" onclick="alterarQtd(${m.id},-1,this)">−</button>
          <span id="qtd-${m.id}" style="font-weight:600;min-width:24px;text-align:center">${qtd}</span>
          <button class="qty-btn" onclick="alterarQtd(${m.id},+1,this)">+</button>
          <span id="pill-${m.id}">${qPill}</span>
          <button class="btn btn-outline" style="padding:4px 10px;font-size:11px;margin-left:2px"
            onclick="abrirModalEntrada(${m.id},'${nomeSafe}')">📥 Entrada</button>
        </div>`
      : `<span id="qtd-${m.id}" style="font-weight:600">${qtd}</span> <span id="pill-${m.id}">${qPill}</span>`;

    return `<tr>
      <td><strong>${m.nome}</strong></td>
      <td><span class="pill ${m.categoria === 'Genérico' ? 'pill-blue' : 'pill-amber'}">${m.categoria || '—'}</span></td>
      <td>${controleQtd}</td>
      <td>${validadeHtml}</td>
      <td><span style="font-family:'DM Mono',monospace;font-size:13px">${m.prateleira || '—'}</span></td>
      <td>${sPill}</td>
      ${podeEditar ? `<td><button class="btn btn-red" style="padding:5px 10px;font-size:11px" onclick="removerMedicamento(${m.id},'${nomeSafe}')">🗑</button></td>` : '<td></td>'}
    </tr>`;
  }).join('');
}

function renderStatsEstoque() {
  document.getElementById('stat-total').textContent = _estoqueCache.length;
  document.getElementById('stat-baixo').textContent = _estoqueCache.filter(m => m.quantidade <= 5).length;
  const gen  = _estoqueCache.filter(m => (m.categoria || '').toLowerCase() === 'genérico').length;
  const orig = _estoqueCache.filter(m => (m.categoria || '').toLowerCase() === 'original').length;
  const el   = document.getElementById('stat-categorias');
  if (el) el.innerHTML = `
    <span class="categ-pill ${_filtroCateg === 'Genérico' ? 'active' : ''}" onclick="filtrarCategoria('Genérico')">💊 Genérico <strong>${gen}</strong></span>
    <span class="categ-pill ${_filtroCateg === 'Original' ? 'active' : ''}" onclick="filtrarCategoria('Original')">🔒 Original <strong>${orig}</strong></span>
    ${_filtroCateg ? `<span class="categ-pill limpar" onclick="filtrarCategoria(null)">✕ Limpar</span>` : ''}`;

  const vencendo = _estoqueCache.filter(m => {
    if (!m.validade) return false;
    const diff = Math.ceil((new Date(m.validade) - new Date()) / 86400000);
    return diff <= 30;
  }).length;
  const alertBadge = document.getElementById('alert-badge');
  if (alertBadge) {
    alertBadge.textContent = vencendo;
    alertBadge.style.display = vencendo > 0 ? 'flex' : 'none';
  }
}

function filtrarCategoria(cat) { _filtroCateg = cat; renderTabelaEstoque(); renderStatsEstoque(); }

async function alterarQtd(id, delta, btn) {
  const spanQtd  = document.getElementById('qtd-' + id);
  const spanPill = document.getElementById('pill-' + id);
  if (!spanQtd) return;
  const atual = parseInt(spanQtd.textContent) || 0;
  const nova  = Math.max(0, atual + delta);
  if (nova === atual) return;
  btn.disabled = true; btn.style.opacity = "0.6";
  try {
    const res  = await fetch(`${API_URL}/estoque/editar/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ quantidade: nova })
    });
    const data = await res.json();
    if (data.sucesso) {
      const item = _estoqueCache.find(m => m.id === id);
      if (item) item.quantidade = nova;
      spanQtd.textContent = nova;
      spanPill.innerHTML = nova === 0 ? `<span class="pill pill-red">✕ Zerado</span>` : nova <= 5 ? `<span class="pill pill-amber">⚠ Baixo</span>` : `<span class="pill pill-green">✓ OK</span>`;
      document.getElementById('stat-baixo').textContent = _estoqueCache.filter(m => m.quantidade <= 5).length;
      spanQtd.style.transition = 'all 0.3s';
      spanQtd.style.color = delta > 0 ? 'var(--green-main)' : 'var(--red-main)';
      spanQtd.style.transform = 'scale(1.35)';
      setTimeout(() => { spanQtd.style.color = ''; spanQtd.style.transform = ''; }, 400);
      toast(`Quantidade atualizada: ${atual} → ${nova}`, 'success');
    } else { toast(data.mensagem || "Erro ao salvar", 'error'); }
  } catch (e) { toast("Erro de conexão", 'error'); }
  finally { btn.disabled = false; btn.style.opacity = "1"; }
}

function confirmarAcao({ titulo = 'Confirmar', icone = '❓', mensagem, sub = '', corBotao = 'var(--green-main)', textoBotao = 'Confirmar', onConfirm }) {
  document.getElementById('modal-confirm-titulo').textContent = titulo;
  document.getElementById('modal-confirm-icone').textContent  = icone;
  document.getElementById('modal-confirm-msg').textContent    = mensagem;
  document.getElementById('modal-confirm-sub').textContent    = sub || '';
  const btnOk = document.getElementById('modal-confirm-ok');
  btnOk.textContent   = textoBotao;
  btnOk.style.background = corBotao;
  const novoBtn = btnOk.cloneNode(true);
  btnOk.parentNode.replaceChild(novoBtn, btnOk);
  novoBtn.addEventListener('click', () => {
    fecharModal('modal-confirm');
    onConfirm();
  });
  document.getElementById('modal-confirm').classList.add('open');
}

async function editarStatus(id, statusAtual) {
  const opcoes = ['Disponível', 'Sem Estoque', 'Em Reposição'];
  let indice = opcoes.indexOf(statusAtual); if (indice === -1) indice = 0;
  const proximo = opcoes[(indice + 1) % opcoes.length];
  const icones  = { 'Disponível': '✅', 'Sem Estoque': '❌', 'Em Reposição': '🔄' };
  confirmarAcao({
    titulo:     'Alterar Status',
    icone:      icones[proximo] || '🔄',
    mensagem:   `Alterar o status para "${proximo}"?`,
    sub:        `Status atual: ${statusAtual}`,
    textoBotao: 'Alterar',
    onConfirm:  async () => {
      try {
        const res  = await fetch(`${API_URL}/estoque/editar/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ status: proximo })
        });
        const data = await res.json();
        if (data.sucesso) {
          const item = _estoqueCache.find(m => m.id === id);
          if (item) item.status = proximo;
          renderTabelaEstoque();
          toast(`Status → ${proximo}`, 'success');
        } else { toast(data.mensagem || "Erro ao alterar status", 'error'); }
      } catch (e) { toast("Erro de conexão", 'error'); }
    }
  });
}


function exportarCSV() {
  const header = 'Nome,Categoria,Quantidade,Validade,Prateleira,Status';
  const rows   = _estoqueCache.map(m =>
    `"${m.nome}","${m.categoria || ''}",${m.quantidade},"${formatarData(m.validade)}","${m.prateleira || ''}","${m.status || ''}"`
  );
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `estoque_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast('Exportação CSV concluída!', 'success');
}

async function renderPedidos() {
  const tbody = document.getElementById('corpo-pedidos');
  try {
    const res   = await fetch(`${API_URL}/pedidos`, { headers: { 'Authorization': 'Bearer ' + token } });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lista = await res.json();
    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span style="font-size:40px">🛒</span><p style="margin-top:8px">Nenhum pedido registrado.</p></div></td></tr>`;
      return;
    }
    const r = usuarioLogado?.role || role;
    const podeGerenciar = r === 'FARMACEUTICO';
    tbody.innerHTML = lista.map(p => {
      const pp = p.prioridade === 'Alta' ? `<span class="pill pill-red">🔴 Alta</span>` : p.prioridade === 'Média' ? `<span class="pill pill-amber">🟡 Média</span>` : `<span class="pill pill-green">🟢 Baixa</span>`;
      const sp = p.situacao === 'Pendente' ? `<span class="pill pill-amber">Pendente</span>` : p.situacao === 'Aprovado' ? `<span class="pill pill-green">Aprovado</span>` : p.situacao === 'Cancelado' ? `<span class="pill pill-red">Cancelado</span>` : p.situacao === 'Em Andamento' ? `<span class="pill pill-blue">Em Andamento</span>` : `<span class="pill pill-green">Concluído</span>`;
      const acoes = podeGerenciar
        ? `<td>
            <select onchange="atualizarSituacaoPedido(${p.id}, this.value, this)"
              style="font-size:12px;padding:4px 8px;border:1.5px solid var(--gray-200);border-radius:6px;font-family:'DM Sans',sans-serif;background:var(--white);color:var(--gray-800);cursor:pointer">
              <option value="Pendente"     ${p.situacao==='Pendente'     ?'selected':''}>Pendente</option>
              <option value="Em Andamento" ${p.situacao==='Em Andamento' ?'selected':''}>Em Andamento</option>
              <option value="Aprovado"     ${p.situacao==='Aprovado'     ?'selected':''}>Aprovado</option>
              <option value="Concluído"    ${p.situacao==='Concluído'    ?'selected':''}>Concluído</option>
              <option value="Cancelado"    ${p.situacao==='Cancelado'    ?'selected':''}>Cancelado</option>
            </select>
           </td>`
        : `<td>${sp}</td>`;

      return `<tr>
        <td><strong>${p.medicamento}</strong></td>
        <td>${p.motivo}</td>
        <td>${p.solicitante || '—'}</td>
        <td>${formatarData(p.data)}</td>
        <td>${pp}</td>
        ${acoes}
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span>⚠️</span><p>Erro ao carregar pedidos.</p></div></td></tr>`;
  }
}

async function atualizarSituacaoPedido(id, situacao, selectEl) {
  selectEl.disabled = true;
  try {
    const res  = await fetch(`${API_URL}/pedidos/${id}/situacao`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ situacao })
    });
    const data = await res.json();
    if (data.sucesso) {
      toast(`Situação → ${situacao}`, 'success');
    } else {
      toast(data.mensagem || 'Erro ao atualizar situação.', 'error');
      renderPedidos();
    }
  } catch (e) {
    toast('Erro de conexão.', 'error');
    renderPedidos();
  } finally {
    selectEl.disabled = false;
  }
}

function abrirModalPedido() {
  const sel = document.getElementById('pedido-medicamento-select');
  sel.innerHTML = `<option value="">Selecione o medicamento...</option>` +
    _estoqueCache.map(m => `<option value="${m.nome}">${m.nome} (${m.categoria || '—'})</option>`).join('');
  document.getElementById('modal-pedido').classList.add('open');
}

async function adicionarPedido() {
  const nome = document.getElementById('pedido-medicamento-select').value;
  const motivo = document.getElementById('pedido-motivo').value.trim();
  const prioridade = document.getElementById('pedido-prioridade').value;
  const btn = document.querySelector('#modal-pedido .btn-primary');
  if (!nome)   { toast('Selecione um medicamento.', 'warning'); return; }
  if (!motivo) { toast('Informe o motivo da falta.', 'warning'); return; }
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    const res  = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ medicamento: nome, motivo, solicitante: usuarioLogado?.nome || 'Usuário', prioridade })
    });
    const data = await res.json();
    if (!data.sucesso) { toast(data.mensagem || 'Erro ao salvar.', 'error'); return; }
    fecharModal('modal-pedido');
    document.getElementById('pedido-medicamento-select').value = '';
    document.getElementById('pedido-motivo').value = '';
    renderPedidos();
    toast('Pedido enviado com sucesso!', 'success');
  } catch (e) { toast('Não foi possível conectar ao servidor.', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Enviar Pedido'; }
}

function renderBuscar() { renderTabelaBuscar(''); }
function onDigitarBusca(v) { clearTimeout(_buscaTimer); _buscaTimer = setTimeout(() => renderTabelaBuscar(v.trim()), 200); }

function renderTabelaBuscar(termo) {
  const tbody = document.getElementById('corpo-buscar');
  let lista = _estoqueCache;
  if (termo) lista = lista.filter(m =>
    m.nome.toLowerCase().includes(termo.toLowerCase()) ||
    (m.categoria  || '').toLowerCase().includes(termo.toLowerCase()) ||
    (m.prateleira || '').toLowerCase().includes(termo.toLowerCase()));

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><span style="font-size:40px">🔍</span><p style="margin-top:8px">${termo ? `Nenhum resultado para "<strong>${termo}</strong>".` : 'Nenhum medicamento disponível.'}</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(m => `
    <tr style="cursor:pointer" onclick="abrirModalMed(${m.id})">
      <td><strong>${m.nome}</strong></td>
      <td><span class="pill ${m.categoria === 'Genérico' ? 'pill-blue' : 'pill-amber'}">${m.categoria || '—'}</span></td>
      <td>${m.quantidade} caixas</td>
      <td><span style="font-family:'DM Mono',monospace;font-size:13px">${m.prateleira || '—'}</span></td>
      <td>${formatarData(m.validade)}</td>
      <td><button class="btn btn-primary" style="padding:6px 14px;font-size:12px" onclick="event.stopImmediatePropagation(); solicitarReposicaoRapida('${m.nome.replace(/'/g, "\\'")}')">Solicitar Reposição</button></td>
    </tr>`).join('');
}

function solicitarReposicaoRapida(nome) {
  abrirModalPedido();
  setTimeout(() => { const sel = document.getElementById('pedido-medicamento-select'); if (sel) sel.value = nome; }, 100);
}

async function renderAdmin() {
  const tbody = document.getElementById('corpo-usuarios');
  if (!tbody) return;
  try {
    const res   = await fetch(`${API_URL}/usuarios/listar`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lista = await res.json();
    tbody.innerHTML = lista.map(u => {
      const roleLabel = u.role === 'FARMACEUTICO' ? '<span class="pill pill-green">Farmacêutico</span>' : '<span class="pill pill-blue">Atendente</span>';
      return `<tr>
        <td><strong>${u.nome || '—'}</strong></td>
        <td>${u.matricula}</td>
        <td>${u.email || '—'}</td>
        <td>${u.cargo || '—'}</td>
        <td>${roleLabel}</td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-outline" style="padding:5px 10px;font-size:12px"
            data-id="${u.id}"
            data-nome="${(u.nome || '').replace(/"/g, '&quot;')}"
            data-email="${(u.email || '').replace(/"/g, '&quot;')}"
            data-cargo="${(u.cargo || '').replace(/"/g, '&quot;')}"
            data-role="${u.role || 'ATENDENTE'}"
            onclick="editarUsuarioBtn(this)">Editar</button>
          ${u.role !== 'FARMACEUTICO' ? `<button class="btn btn-red" style="padding:5px 10px;font-size:12px"
            data-id="${u.id}"
            data-nome="${(u.nome || '').replace(/"/g, '&quot;')}"
            data-role="${u.role}"
            onclick="deletarUsuario(this.dataset.id, this.dataset.nome, this.dataset.role)">🗑</button>` : ''}
        </td>
      </tr>`;
    }).join('');
  } catch (e) { toast('Erro ao carregar usuários', 'error'); }
}

function editarUsuarioBtn(btn) {
  editarUsuario(
    btn.dataset.id,
    btn.dataset.nome,
    btn.dataset.email,
    btn.dataset.cargo,
    btn.dataset.role
  );
}

function abrirModalNovoUsuario() {
  document.getElementById('modal-usuario').classList.add('open');
  document.getElementById('form-usuario-id').value = '';
  document.getElementById('usuario-matricula').value = '';
  document.getElementById('usuario-nome').value = '';
  document.getElementById('usuario-email').value = '';
  document.getElementById('usuario-cargo').value = '';
  document.getElementById('usuario-role').value = 'ATENDENTE';
  document.getElementById('usuario-senha').value = '';
  document.getElementById('modal-usuario-titulo').textContent = 'Novo Usuário';
}

function editarUsuario(id, nome, email, cargo, role) {
  document.getElementById('modal-usuario').classList.add('open');
  document.getElementById('form-usuario-id').value = id;
  document.getElementById('usuario-nome').value  = nome;
  document.getElementById('usuario-email').value = email;
  document.getElementById('usuario-cargo').value = cargo;
  document.getElementById('usuario-role').value  = role;
  document.getElementById('usuario-senha').value = '';
  document.getElementById('modal-usuario-titulo').textContent = 'Editar Usuário';
}

async function salvarUsuario() {
  const id       = document.getElementById('form-usuario-id').value;
  const nome     = document.getElementById('usuario-nome').value.trim();
  const email    = document.getElementById('usuario-email').value.trim();
  const cargo    = document.getElementById('usuario-cargo').value.trim();
  const role     = document.getElementById('usuario-role').value;
  const senha    = document.getElementById('usuario-senha').value;
  const matricula = parseInt(document.getElementById('usuario-matricula')?.value);

  const btn = document.querySelector('#modal-usuario .btn-primary');
  btn.disabled = true; btn.textContent = 'Salvando...';

  try {
    let url, body;
    if (id) {
      url  = `${API_URL}/usuarios/atualizar/${id}`;
      body = { nome, email, cargo, role };
      if (senha) body.novaSenha = senha;
      const res  = await fetch(url, { method: 'PUT',  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.sucesso) { toast('Usuário atualizado!', 'success'); fecharModal('modal-usuario'); renderAdmin(); }
      else toast(data.mensagem, 'error');
    } else {
      url  = `${API_URL}/usuarios/cadastrar`;
      body = { matricula, nome, email, cargo, role, senha };
      const res  = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.sucesso) { toast('Usuário cadastrado!', 'success'); fecharModal('modal-usuario'); renderAdmin(); }
      else toast(data.mensagem, 'error');
    }
  } catch (e) { toast('Erro de conexão', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Salvar'; }
}

async function abrirModalMed(id) {
  const m = _estoqueCache.find(x => x.id === id);
  if (!m) return;

  document.getElementById('modal-med-nome').textContent = m.nome;
  document.getElementById('modal-cat').textContent      = m.categoria || '—';
  document.getElementById('modal-val').textContent      = formatarData(m.validade);
  document.getElementById('modal-qtd').textContent      = m.quantidade + ' caixas';
  document.getElementById('modal-prat').textContent     = m.prateleira || '—';
  document.getElementById('modal-ativo').textContent    = '⏳ buscando...';
  document.getElementById('modal-fab').textContent      = '⏳ buscando...';
  document.getElementById('modal-dos').textContent      = '⏳ buscando...';

  const cuEl = document.getElementById('modal-como-usar-content');
  cuEl.dataset.loaded = 'false';
  cuEl.dataset.med    = JSON.stringify({ nome: m.nome, categoria: m.categoria });
  cuEl.innerHTML = `<div class="empty-state" style="padding:30px 0"><span style="font-size:36px">💊</span><p style="margin-top:10px">Clique em <strong>Como Usar</strong> para carregar.</p></div>`;

  const bulaPanel = document.getElementById('modal-tab-panel-bula');
  bulaPanel.dataset.med      = m.nome;
  bulaPanel.dataset.carregou = 'false';
  const iframe = document.getElementById('bula-iframe');
  if (iframe) { iframe.src = ''; iframe.style.display = 'none'; }
  ['bula-loading','bula-error'].forEach(bid => { const el = document.getElementById(bid); if (el) el.style.display = 'none'; });
  const bulaInit = document.getElementById('bula-init');
  if (bulaInit) bulaInit.style.display = 'flex';

  const histEl = document.getElementById('modal-historico-content');
  if (histEl) { histEl.dataset.loaded = 'false'; histEl.dataset.id = m.id; histEl.innerHTML = `<div class="empty-state" style="padding:20px 0"><p>Clique em <strong>Histórico</strong> para carregar.</p></div>`; }

  mostrarAbaModal('info');
  document.getElementById('modal-med').classList.add('open');
  carregarDadosBula(m.nome);
}

async function carregarDadosBula(nome) {
  try {
    const res  = await fetch(`${API_URL}/bulario/buscar?nome=${encodeURIComponent(nome)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const item = data.content?.[0];
    if (item) {
      document.getElementById('modal-ativo').textContent = item.principioAtivo || item.descSubstancia || '—';
      document.getElementById('modal-fab').textContent   = item.nomEmpresa || item.empresa || '—';
      document.getElementById('modal-dos').textContent   = (item.concentracao ? item.concentracao + ' ' : '') + (item.formaFarmaceutica || item.descCategoria || '—');
    } else {
      ['modal-ativo','modal-fab','modal-dos'].forEach(bid => document.getElementById(bid).textContent = '—');
    }
  } catch (e) {
    ['modal-ativo','modal-fab','modal-dos'].forEach(bid => document.getElementById(bid).textContent = '—');
  }
}

function mostrarAbaModal(aba) {
  document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.modal-tab-panel').forEach(p => p.style.display = 'none');
  document.getElementById('modal-tab-btn-'   + aba).classList.add('active');
  document.getElementById('modal-tab-panel-' + aba).style.display = 'block';

  if (aba === 'como-usar') {
    const el = document.getElementById('modal-como-usar-content');
    if (el.dataset.loaded !== 'true') { el.dataset.loaded = 'true'; carregarComoUsar(JSON.parse(el.dataset.med || '{}')); }
  }
  if (aba === 'bula') {
    const panel = document.getElementById('modal-tab-panel-bula');
    if (panel.dataset.carregou !== 'true') { panel.dataset.carregou = 'true'; carregarBulaPDF(); }
  }
  if (aba === 'historico') {
    const el = document.getElementById('modal-historico-content');
    if (el && el.dataset.loaded !== 'true') { el.dataset.loaded = 'true'; carregarHistorico(el.dataset.id); }
  }
}

async function carregarBulaPDF() {
  const nome    = document.getElementById('modal-tab-panel-bula').dataset.med || '';
  const iframe  = document.getElementById('bula-iframe');
  const loading = document.getElementById('bula-loading');
  const error   = document.getElementById('bula-error');
  const init    = document.getElementById('bula-init');

  if (init)    init.style.display    = 'none';
  if (loading) loading.style.display = 'flex';
  if (error)   error.style.display   = 'none';
  if (iframe)  iframe.style.display  = 'none';

  try {
    const res  = await fetch(`${API_URL}/bulario/bula-pdf-url?nome=${encodeURIComponent(nome)}`);
    const data = await res.json();

    if (data.sucesso && data.proxyUrl) {
      iframe.src     = API_URL + data.proxyUrl;
      iframe.onload  = () => { if (loading) loading.style.display = 'none'; iframe.style.display = 'block'; };
      iframe.onerror = () => { if (loading) loading.style.display = 'none'; mostrarErroBula(nome); };
    } else {
      if (loading) loading.style.display = 'none';
      mostrarErroBula(nome);
    }
  } catch (e) {
    if (loading) loading.style.display = 'none';
    mostrarErroBula(nome);
  }
}

function mostrarErroBula(nome) {
  const error = document.getElementById('bula-error');
  if (!error) return;
  error.style.display = 'flex';
  error.innerHTML = `<span style="font-size:40px">📄</span><p style="margin-top:12px;font-size:14px;color:var(--gray-600);text-align:center">PDF não disponível diretamente.<br><a href="https://consultas.anvisa.gov.br/#/bulario/busca?nome=${encodeURIComponent(nome)}" target="_blank" class="btn btn-primary" style="display:inline-block;margin-top:16px;padding:10px 20px;text-decoration:none">📄 Abrir no Site da ANVISA</a></p>`;
}

async function carregarComoUsar(med) {
  const el = document.getElementById('modal-como-usar-content');
  el.innerHTML = `<div style="display:flex;align-items:center;gap:12px;padding:24px 0;color:var(--gray-400)"><span style="font-size:22px;display:inline-block;animation:spin 1s linear infinite">⏳</span><span>Gerando instruções com IA...</span></div>`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", max_tokens: 1200,
        system: `Você é farmacêutico especialista. Responda SOMENTE em JSON puro sem markdown.\nEstrutura: {"resumo":"2 frases","indicacoes":["..."],"posologia":"...","formaDeUso":"...","contraindicacoes":["..."],"avisos":["..."],"conservacao":"..."}`,
        messages: [{ role: "user", content: `Medicamento: ${med.nome}\nCategoria: ${med.categoria || 'não informada'}` }]
      })
    });
    const data = await res.json();
    const info = JSON.parse((data.content?.find(b => b.type === 'text')?.text || '').replace(/```json|```/g, '').trim());
    el.innerHTML = `
      <div class="comoUsar-resumo">${info.resumo || ''}</div>
      <div class="comoUsar-section"><div class="comoUsar-label">✅ Indicações</div><ul class="comoUsar-list">${(info.indicacoes||[]).map(i=>`<li>${i}</li>`).join('')}</ul></div>
      <div class="comoUsar-section"><div class="comoUsar-label">📋 Posologia</div><p class="comoUsar-text">${info.posologia||'—'}</p></div>
      <div class="comoUsar-section"><div class="comoUsar-label">💧 Forma de Uso</div><p class="comoUsar-text">${info.formaDeUso||'—'}</p></div>
      <div class="comoUsar-section"><div class="comoUsar-label">🚫 Contraindicações</div><ul class="comoUsar-list red">${(info.contraindicacoes||[]).map(i=>`<li>${i}</li>`).join('')}</ul></div>
      <div class="comoUsar-section"><div class="comoUsar-label">⚠️ Avisos</div><ul class="comoUsar-list amber">${(info.avisos||[]).map(i=>`<li>${i}</li>`).join('')}</ul></div>
      <div class="comoUsar-section"><div class="comoUsar-label">🌡️ Conservação</div><p class="comoUsar-text">${info.conservacao||'—'}</p></div>
      <p style="font-size:11px;color:var(--gray-400);margin-top:20px;padding-top:12px;border-top:1px solid var(--gray-200)">⚕️ Gerado por IA. Consulte sempre a bula oficial.</p>`;
  } catch (e) {
    el.innerHTML = `<div class="empty-state" style="padding:30px 0"><span>⚠️</span><p style="margin-top:8px">Não foi possível gerar instruções.<br><a href="https://www.google.com/search?q=como+usar+${encodeURIComponent(med.nome)}" target="_blank" style="color:var(--green-main)">🔍 Pesquisar manualmente</a></p></div>`;
  }
}

async function carregarHistorico(medId) {
  const el = document.getElementById('modal-historico-content');
  el.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:20px 0;color:var(--gray-400)"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span><span>Carregando histórico...</span></div>`;
  try {
    const res  = await fetch(`${API_URL}/estoque/historico/${medId}`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lista = await res.json();
    if (lista.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:20px 0"><p>Nenhuma movimentação registrada ainda.</p></div>`;
      return;
    }
    el.innerHTML = `<div class="hist-lista">${lista.map(m => {
      const icone = m.tipo === 'ENTRADA' ? '↑' : m.tipo === 'SAIDA' ? '↓' : m.tipo === 'STATUS' ? '⟳' : '~';
      const cor   = m.tipo === 'ENTRADA' ? 'var(--green-main)' : m.tipo === 'SAIDA' ? 'var(--red-main)' : 'var(--blue-main)';
      const dt    = new Date(m.dataHora).toLocaleString('pt-BR');
      const delta = m.tipo !== 'STATUS' ? `${m.quantidadeAntes} → ${m.quantidadeDepois}` : `${m.statusAntes} → ${m.statusDepois}`;
      return `<div class="hist-item">
        <span class="hist-icone" style="color:${cor}">${icone}</span>
        <div class="hist-info">
          <span class="hist-tipo">${m.tipo}</span>
          <span class="hist-delta">${delta}</span>
          <span class="hist-resp">${m.responsavel} · ${dt}</span>
        </div>
      </div>`;
    }).join('')}</div>`;
  } catch (e) { el.innerHTML = `<p style="color:var(--red-main);padding:12px 0">Erro ao carregar histórico.</p>`; }
}

function abrirModalAddMed() {
  ['add-med-nome','add-med-prateleira'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('add-med-quantidade').value = '';
  document.getElementById('add-med-validade').value   = '';
  document.getElementById('add-med-categoria').value  = 'Original';
  document.getElementById('add-med-status').value     = 'Disponível';
  const msg = document.getElementById('add-med-msg');
  msg.style.display = 'none'; msg.textContent = '';
  document.getElementById('modal-add-med').classList.add('open');
  setTimeout(() => document.getElementById('add-med-nome').focus(), 100);
}

async function salvarNovoMedicamento() {
  const nome       = document.getElementById('add-med-nome').value.trim();
  const categoria  = document.getElementById('add-med-categoria').value;
  const qtdVal     = document.getElementById('add-med-quantidade').value.trim();
  const validade   = document.getElementById('add-med-validade').value;
  const prateleira = document.getElementById('add-med-prateleira').value.trim();
  const status     = document.getElementById('add-med-status').value;
  const msg        = document.getElementById('add-med-msg');
  const btn        = document.getElementById('btn-salvar-add-med');

  const mostrarErro = txt => {
    msg.style.cssText = 'display:block;padding:10px 14px;border-radius:8px;font-size:13px;background:var(--red-soft);color:var(--red-main)';
    msg.textContent = txt;
  };

  if (!nome)     { mostrarErro('Informe o nome do medicamento.'); return; }
  if (!qtdVal || isNaN(parseInt(qtdVal)) || parseInt(qtdVal) < 0) { mostrarErro('Informe uma quantidade válida.'); return; }
  if (!validade) { mostrarErro('Informe a data de validade.'); return; }

  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    const res = await fetch(`${API_URL}/estoque/adicionar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ nome, categoria, quantidade: parseInt(qtdVal), validade, prateleira, status })
    });
    const data = await res.json();
    if (data.sucesso) {
      fecharModal('modal-add-med');
      await renderEstoque();
      toast(`Medicamento "${nome}" adicionado ao estoque!`, 'success');
    } else {
      mostrarErro(data.mensagem || 'Erro ao salvar medicamento.');
    }
  } catch (e) {
    mostrarErro('Erro de conexão com o servidor.');
  } finally {
    btn.disabled = false; btn.textContent = 'Salvar Medicamento';
  }
}

function removerMedicamento(id, nome) {
  confirmarAcao({
    titulo:     'Remover Medicamento',
    icone:      '🗑️',
    mensagem:   `Remover "${nome}" do estoque?`,
    sub:        'Esta ação não pode ser desfeita.',
    corBotao:   'var(--red-main)',
    textoBotao: 'Remover',
    onConfirm:  async () => {
      try {
        const res  = await fetch(`${API_URL}/estoque/deletar/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.sucesso) {
          await renderEstoque();
          toast(`"${nome}" removido do estoque.`, 'success');
        } else { toast(data.mensagem || 'Erro ao remover.', 'error'); }
      } catch (e) { toast('Erro de conexão.', 'error'); }
    }
  });
}
function deletarUsuario(id, nome, role) {
  confirmarAcao({
    titulo:     'Remover Usuário',
    icone:      '👤',
    mensagem:   `Remover o usuário "${nome}"?`,
    sub:        'O acesso deste usuário será revogado permanentemente.',
    corBotao:   'var(--red-main)',
    textoBotao: 'Remover',
    onConfirm:  async () => {
      try {
        const res  = await fetch(`${API_URL}/usuarios/deletar/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.sucesso) { renderAdmin(); toast(`Usuário "${nome}" removido.`, 'success'); }
        else toast(data.mensagem || 'Erro ao remover usuário.', 'error');
      } catch (e) { toast('Erro de conexão.', 'error'); }
    }
  });
}

/* ── Fechar modais ── */
function fecharModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(o => { o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }); });
});


const SOLIC_KEY = 'pharmaplus_solicitacoes';
let _solicFiltro = 'recebidas'; //

function _carregarSolics() {
  try { return JSON.parse(localStorage.getItem(SOLIC_KEY) || '[]'); }
  catch(e) { return []; }
}

function _salvarSolics(lista) {
  localStorage.setItem(SOLIC_KEY, JSON.stringify(lista));
}

function _roleAtual() {
  return (usuarioLogado?.role || role || 'ATENDENTE').toUpperCase();
}

function _roleDestino(remetente) {
  return remetente === 'FARMACEUTICO' ? 'ATENDENTE' : 'FARMACEUTICO';
}

function abrirModalSolic() {
  document.getElementById('solic-msg').value  = '';
  document.getElementById('solic-data').value = '';
  const r = _roleAtual();
  const tipoSelect = document.getElementById('solic-tipo');
  if (r === 'FARMACEUTICO') {
    tipoSelect.innerHTML = `
      <option value="farmaceutico">💊 Tarefa para Atendente</option>
      <option value="aviso">📢 Aviso Geral</option>`;
  } else {
    tipoSelect.innerHTML = `
      <option value="horario">📅 Agendar Horário com Farmacêutico</option>
      <option value="duvida">❓ Tirar Dúvida</option>
      <option value="farmaceutico">💊 Solicitação ao Farmacêutico</option>`;
  }
  document.getElementById('modal-solic').classList.add('open');
}

function adicionarSolic() {
  const tipo = document.getElementById('solic-tipo').value;
  const msg  = document.getElementById('solic-msg').value.trim();
  const data = document.getElementById('solic-data').value;
  if (!msg) { toast('Escreva uma mensagem.', 'warning'); return; }

  const r = _roleAtual();
  const lista = _carregarSolics();
  lista.push({
    id:        Date.now(),
    de:        usuarioLogado?.nome || 'Usuário',
    roleRemetente: r,
    roleDestino:   _roleDestino(r),
    tipo,
    mensagem:  msg,
    dataHora:  data || new Date().toLocaleString('pt-BR'),
    lida:      false,
    resposta:  null,
    dataResposta: null,
    respondidoPor: null
  });
  _salvarSolics(lista);
  fecharModal('modal-solic');
  document.getElementById('solic-msg').value = '';
  renderSolicitacoes();
  toast('Solicitação enviada!', 'success');
}

function filtrarSolic(aba) {
  _solicFiltro = aba;
  const btnR = document.getElementById('solic-tab-recebidas');
  const btnE = document.getElementById('solic-tab-enviadas');
  if (btnR && btnE) {
    btnR.style.background = aba === 'recebidas' ? 'var(--green-main)' : 'var(--white)';
    btnR.style.color      = aba === 'recebidas' ? 'white' : 'var(--gray-600)';
    btnE.style.background = aba === 'enviadas'  ? 'var(--green-main)' : 'var(--white)';
    btnE.style.color      = aba === 'enviadas'  ? 'white' : 'var(--gray-600)';
  }
  renderSolicitacoes();
}

function renderSolicitacoes() {
  const lista    = document.getElementById('lista-solicitacoes');
  const badge    = document.getElementById('solic-badge');
  const badgeD   = document.getElementById('solic-badge-dropdown');
  const r        = _roleAtual();
  const todas    = _carregarSolics();

  const recebidas   = todas.filter(s => s.roleDestino === r);
  const naoLidas    = recebidas.filter(s => !s.lida).length;
  if (badge)  { badge.textContent  = naoLidas; badge.style.display  = naoLidas > 0 ? 'flex' : 'none'; }
  if (badgeD) { badgeD.textContent = naoLidas; badgeD.style.display = naoLidas > 0 ? 'flex' : 'none'; }

  const exibir = _solicFiltro === 'recebidas'
    ? recebidas
    : todas.filter(s => s.roleRemetente === r);

  if (!lista) return;

  if (!exibir.length) {
    lista.innerHTML = `<div class="empty-state">
      <span style="font-size:40px">💬</span>
      <p style="margin-top:8px">${_solicFiltro === 'recebidas' ? 'Nenhuma solicitação recebida.' : 'Nenhuma solicitação enviada.'}</p>
    </div>`;
    return;
  }

  const podeGerenciar = r === 'FARMACEUTICO';

  lista.innerHTML = [...exibir].reverse().map(s => {
    const labelMap = {
      horario:      '📅 Agendamento',
      duvida:       '❓ Dúvida',
      farmaceutico: '💊 Farmacêutico',
      aviso:        '📢 Aviso',
    };
    const label      = labelMap[s.tipo] || s.tipo;
    const isRecebida = _solicFiltro === 'recebidas';
    const ini        = (s.de || '?').charAt(0).toUpperCase();
    if (isRecebida && !s.lida) {
      const todas2 = _carregarSolics();
      const idx    = todas2.findIndex(x => x.id === s.id);
      if (idx !== -1) { todas2[idx].lida = true; _salvarSolics(todas2); }
    }

    const respostaHtml = s.resposta
      ? `<div style="margin-top:10px;background:var(--green-pale);border-left:3px solid var(--green-main);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:8px 12px">
           <div style="font-size:11px;font-weight:700;color:var(--green-main);margin-bottom:2px">✅ Resposta de ${s.respondidoPor || 'Farmacêutico'}</div>
           <div style="font-size:13px;color:var(--gray-800)">${s.resposta}</div>
           <div style="font-size:11px;color:var(--gray-400);margin-top:3px">${s.dataResposta || ''}</div>
         </div>`
      : '';

    const botoesAcao = isRecebida && podeGerenciar
      ? `<div style="display:flex;gap:6px;margin-top:10px">
           ${!s.resposta ? `<button class="btn btn-primary" style="padding:5px 12px;font-size:12px" onclick="abrirResponder(${s.id})">💬 Responder</button>` : ''}
           <button class="btn btn-red" style="padding:5px 10px;font-size:12px" onclick="excluirSolic(${s.id})">🗑 Excluir</button>
         </div>`
      : isRecebida
        ? ''
        : `<div style="margin-top:8px">
             <button class="btn btn-red" style="padding:5px 10px;font-size:12px" onclick="excluirSolic(${s.id})">🗑 Cancelar</button>
           </div>`;

    return `<div class="solic-card" style="flex-direction:column;gap:0;padding:14px 16px">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div class="solic-ava ava-green" style="flex-shrink:0">${ini}</div>
        <div style="flex:1;min-width:0">
          <div class="solic-name">${s.de}
            <span class="pill pill-blue" style="font-size:11px;margin-left:6px">${label}</span>
            ${!s.lida && isRecebida ? '<span class="pill pill-green" style="font-size:10px;margin-left:4px">● Novo</span>' : ''}
          </div>
          <div class="solic-text" style="margin-top:4px">${s.mensagem}</div>
          <div class="solic-meta">🕐 ${s.dataHora}</div>
        </div>
      </div>
      ${respostaHtml}
      ${botoesAcao}
    </div>`;
  }).join('');

  const novasNaoLidas = _carregarSolics().filter(s => s.roleDestino === r && !s.lida).length;
  if (badge)  { badge.textContent  = novasNaoLidas; badge.style.display  = novasNaoLidas > 0 ? 'flex' : 'none'; }
  if (badgeD) { badgeD.textContent = novasNaoLidas; badgeD.style.display = novasNaoLidas > 0 ? 'flex' : 'none'; }
}

function abrirResponder(id) {
  const todas = _carregarSolics();
  const s     = todas.find(x => x.id === id);
  if (!s) return;
  document.getElementById('responder-solic-id').value    = id;
  document.getElementById('responder-msg-original').textContent = s.mensagem;
  document.getElementById('responder-msg-meta').textContent     = `De: ${s.de} · ${s.dataHora}`;
  document.getElementById('responder-texto').value = '';
  document.getElementById('modal-responder-solic').classList.add('open');
}

function enviarResposta() {
  const id      = parseInt(document.getElementById('responder-solic-id').value);
  const texto   = document.getElementById('responder-texto').value.trim();
  if (!texto) { toast('Escreva uma resposta.', 'warning'); return; }

  const todas = _carregarSolics();
  const idx   = todas.findIndex(x => x.id === id);
  if (idx === -1) return;

  todas[idx].resposta      = texto;
  todas[idx].respondidoPor = usuarioLogado?.nome || 'Farmacêutico';
  todas[idx].dataResposta  = new Date().toLocaleString('pt-BR');
  _salvarSolics(todas);

  fecharModal('modal-responder-solic');
  renderSolicitacoes();
  toast('Resposta enviada!', 'success');
}

function excluirSolic(id) {
  confirmarAcao({
    titulo:     'Excluir Solicitação',
    icone:      '🗑️',
    mensagem:   'Excluir esta solicitação?',
    sub:        'Esta ação não pode ser desfeita.',
    corBotao:   'var(--red-main)',
    textoBotao: 'Excluir',
    onConfirm:  () => {
      const nova = _carregarSolics().filter(x => x.id !== id);
      _salvarSolics(nova);
      renderSolicitacoes();
      toast('Solicitação excluída.', 'success');
    }
  });
}
function salvarPerfil() {
  const nome = document.getElementById('perfil-input-nome').value.trim(), cargo = document.getElementById('perfil-input-cargo').value.trim(), email = document.getElementById('perfil-input-email').value.trim();
  if (!nome || !cargo) { toast('Nome e cargo são obrigatórios.', 'warning'); return; }
  if (usuarioLogado) { usuarioLogado.nome = nome; usuarioLogado.cargo = cargo; usuarioLogado.email = email; atualizarUI(usuarioLogado); }
  toast('Perfil atualizado!', 'success');
}
function formatarData(iso) {
  if (!iso) return '—';
  if (Array.isArray(iso)) {
    const [y, m, d] = iso;
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  }
  const [y, m, d] = String(iso).split('-');
  return `${d}/${m}/${y}`;
}

function filtrarTabela(tabelaId, termo) {
  document.querySelectorAll(`#${tabelaId} tbody tr`).forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(termo.toLowerCase()) ? '' : 'none';
  });
}
renderEstoque().then(() => {
  renderBuscar();
  renderDashboard();
});
renderPedidos();
renderSolicitacoes();

function abrirModalEntrada(id, nomeMed) {
  document.getElementById('entrada-med-nome').textContent = nomeMed;
  document.getElementById('entrada-med-id').value        = id;
  document.getElementById('entrada-quantidade').value    = '';
  document.getElementById('entrada-observacao').value    = '';
  const msg = document.getElementById('entrada-msg');
  msg.style.display = 'none';
  msg.textContent   = '';
  document.getElementById('modal-entrada').classList.add('open');
  setTimeout(() => document.getElementById('entrada-quantidade').focus(), 100);
}

async function confirmarEntrada() {
  const id         = document.getElementById('entrada-med-id').value;
  const qtdVal     = document.getElementById('entrada-quantidade').value.trim();
  const observacao = document.getElementById('entrada-observacao').value.trim();
  const btn        = document.getElementById('btn-confirmar-entrada');
  const msg        = document.getElementById('entrada-msg');

  const quantidade = parseInt(qtdVal);
  if (!qtdVal || isNaN(quantidade) || quantidade <= 0) {
    msg.style.cssText = 'display:block;padding:10px 14px;border-radius:8px;font-size:13px;background:var(--red-soft);color:var(--red-main)';
    msg.textContent   = 'Informe uma quantidade válida (maior que zero).';
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Registrando...';
  msg.style.display = 'none';

  try {
    const res = await fetch(`${API_URL}/estoque/entrada/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ quantidade, observacao: observacao || 'Entrada manual' })
    });

    const data = await res.json();

    if (data.sucesso) {
      fecharModal('modal-entrada');

      const item = _estoqueCache.find(m => m.id === parseInt(id));
      if (item) { item.quantidade = data.quantidadeAtual; item.status = data.statusAtual; }

      const spanQtd  = document.getElementById('qtd-'  + id);
      const spanPill = document.getElementById('pill-' + id);
      if (spanQtd)  spanQtd.textContent = data.quantidadeAtual;
      if (spanPill) {
        const q = data.quantidadeAtual;
        spanPill.innerHTML = q === 0
          ? `<span class="pill pill-red">✕ Zerado</span>`
          : q <= 5
            ? `<span class="pill pill-amber">⚠ Baixo</span>`
            : `<span class="pill pill-green">✓ OK</span>`;
      }

      renderStatsEstoque();
      toast(`Entrada registrada: +${quantidade} → ${data.quantidadeAtual} caixas`, 'success');
    } else {
      msg.style.cssText = 'display:block;padding:10px 14px;border-radius:8px;font-size:13px;background:var(--red-soft);color:var(--red-main)';
      msg.textContent   = data.mensagem || 'Erro ao registrar entrada.';
    }

  } catch (e) {
    msg.style.cssText = 'display:block;padding:10px 14px;border-radius:8px;font-size:13px;background:var(--red-soft);color:var(--red-main)';
    msg.textContent   = 'Erro de conexão com o servidor.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Confirmar Entrada';
  }
}
