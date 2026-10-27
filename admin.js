/* ═══════════════════════════════════════════════
   GUIA CITY — ADMIN.JS
   Lógica completa do painel administrativo
═══════════════════════════════════════════════ */
'use strict';

// ─── HELPERS ───────────────────────────────────

const fb = () => window._fb;
const db = () => window._fb.db;

function toast(msg, type = 'info', ms = 3500) {
  const el = document.getElementById('admin-toast');
  el.textContent = msg;
  el.className = `admin-toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => el.classList.add('hidden'), ms);
}

function fmtDate(val) {
  if (!val) return '—';
  if (val?.toDate) val = val.toDate();
  if (!(val instanceof Date)) val = new Date(val);
  return val.toLocaleDateString('pt-BR');
}

function badge(status) {
  const map = { ativa:'badge-ativa', pendente:'badge-pendente', inativa:'badge-inativa',
                ativo:'badge-ativo', expirado:'badge-expirado' };
  return `<span class="badge ${map[status] || 'badge-pendente'}">${status}</span>`;
}

function setLoading(textId, loadId, loading) {
  document.getElementById(textId).classList.toggle('hidden', loading);
  document.getElementById(loadId).classList.toggle('hidden', !loading);
}

function confirm(msg, cb) {
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-ok').onclick = () => { closeAllModals(); cb(); };
  openModal('confirm-dialog');
}

// ─── AUTH ──────────────────────────────────────
window.showLogin = function(err) {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
  if (err) {
    const el = document.getElementById('login-error');
    el.textContent = err; el.classList.remove('hidden');
  }
};
window.navTo = function(page) {
  document.querySelectorAll('.page').forEach(p =>
    p.classList.remove('active')
  );

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  document.querySelectorAll('.nav-item, .admin-tab[data-page]').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  // No celular, fecha o menu lateral depois de escolher e volta ao topo
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  window.scrollTo({ top: 0, behavior: 'instant' });

  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) {
    breadcrumb.textContent = PAGE_LABELS?.[page] || page;
  }

  // CHAMA O FIREBASE
  if (window.PAGE_LOADERS && window.PAGE_LOADERS[page]) {
    window.PAGE_LOADERS[page]();
  }

  console.log('Página aberta:', page);
};
window.showPanel = function() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');

  const u = window._currentUser;
  if (u) {
    document.getElementById('sidebar-name').textContent =
      u.displayName || u.email?.split('@')[0] || 'Admin';

    document.getElementById('sidebar-avatar').textContent =
      (u.displayName || u.email || 'A')[0].toUpperCase();
  }

  if (typeof window.navTo === 'function') {
    window.navTo('dashboard');
  } else {
    console.error('Função navTo não carregou. Verifique erro acima no admin.js.');
  }

  startClock();
};

document.getElementById('btn-login')?.addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  if (!email || !pass) { toast('Preencha e-mail e senha.', 'error'); return; }
  setLoading('btn-login-text','btn-login-loading', true);
  try {
  const { auth, signInWithEmailAndPassword } = fb();

  const cred = await signInWithEmailAndPassword(
    auth,
    email,
    pass
  );

  console.log("LOGIN OK");
  console.log("UID:", cred.user.uid);

} catch (e) {

  console.error("ERRO COMPLETO:", e);

  alert(
    "Código: " + e.code +
    "\nMensagem: " + e.message
  );

  document.getElementById('login-error').textContent =
    e.code || 'Erro desconhecido';

  document.getElementById('login-error').classList.remove('hidden');

  setLoading('btn-login-text','btn-login-loading', false);
}
});

document.getElementById('login-password')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

window.doLogout = async function() {
  try {
    await window._fb.signOut(window._fb.auth);
  } catch (e) {
    console.error('Erro ao sair:', e);
    alert('Erro ao sair do painel.');
  }
};

// ─── NAVIGATION ────────────────────────────────
const PAGE_LABELS = {
  dashboard:'Início', empresas:'Empresas', aprovacoes:'Aprovações Pendentes',
  noticias:'Notícias', eventos:'Eventos', utilidades:'Utilidades Públicas',
  categorias:'Categorias', cupons:'Cupons', patrocinados:'Patrocinados',
  usuarios:'Usuários', configuracoes:'Configurações',
  'promocoes-admin':'Promoções da Cidade', 'classificados-admin':'Classificados',
  'config-ia':'Configurações da IA', 'config-firebase':'Configurações do Firebase',
  estatisticas:'Acessos do Site', pedidos:'Pedidos'
};
window.PAGE_LOADERS = {
  dashboard: () => loadDashboard(),
  estatisticas: () => loadEstatisticas(),
  pedidos: () => loadPedidos(),
  empresas: () => loadEmpresas(),
  aprovacoes: () => loadAprovacoes(),
  noticias: () => loadNoticias(),
  eventos: () => loadEventos(),
  utilidades: () => loadUtilidades(),
  categorias: () => loadCategorias(),
  cupons: () => loadCupons(),
  patrocinados: () => loadPatrocinados(),
  usuarios: () => loadUsuarios(),
  configuracoes: () => loadConfiguracoes(),

  'promocoes-admin': () => window.loadPromocoesAdmin?.(),
  'classificados-admin': () => window.loadClassificadosAdmin?.(),
  'config-ia': () => window.loadIAConfig?.(),
  'config-firebase': () => window.loadFirebaseConfig?.()
};

window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
  }
};

// ─── CLOCK ─────────────────────────────────────
function startClock() {
  const el = document.getElementById('topbar-time');
  const tick = () => { el.textContent = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}); };
  tick(); setInterval(tick, 10000);
}

// ─── MODALS ────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
window.closeAllModals = function() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

// ─── IMAGE PREVIEW ─────────────────────────────
window.previewImage = function(inputId, imgId, textId) {
  const f = document.getElementById(inputId).files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    const img = document.getElementById(imgId);
    img.src = e.target.result; img.classList.remove('hidden');
    document.getElementById(textId).classList.add('hidden');
  };
  r.readAsDataURL(f);
};

async function uploadFile(fileInputId, path) {
  const file = document.getElementById(fileInputId).files[0];
  if (!file) return null;
  const { storage, ref, uploadBytes, getDownloadURL } = fb();
  const r = ref(storage, path + '/' + Date.now() + '_' + file.name);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

// ══════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════
async function loadDashboard() {
  const { collection, getDocs, query, where, orderBy, limit } = fb();
  try {
    const [emp, not, evt, usr] = await Promise.all([
      getDocs(query(collection(db(), 'empresas'), where('status','==','ativa'))),
      getDocs(collection(db(), 'noticias')),
      getDocs(collection(db(), 'eventos')),
      getDocs(collection(db(), 'usuarios'))
    ]);
    document.getElementById('stat-empresas').textContent = emp.size;
    document.getElementById('stat-noticias').textContent = not.size;
    document.getElementById('stat-eventos').textContent = evt.size;
    document.getElementById('stat-usuarios').textContent = usr.size;

    // Visualizações e cliques no WhatsApp: o app soma direto em cada empresa (views / whatsappClicks)
    const soma = campo => emp.docs.reduce((t, d) => t + (Number(d.data()[campo]) || 0), 0);
    document.getElementById('stat-visualizacoes').textContent = soma('views').toLocaleString('pt-BR');
    document.getElementById('stat-whatsapp').textContent = soma('whatsappClicks').toLocaleString('pt-BR');

    // Total de pedidos feitos pelo app (coleção pedidos)
    try {
      const { getCountFromServer } = fb();
      const c = await getCountFromServer(collection(db(), 'pedidos'));
      document.getElementById('stat-pedidos').textContent = c.data().count.toLocaleString('pt-BR');
    } catch (e) {
      console.warn('Pedidos: sem permissão de leitura ou coleção ainda vazia.', e);
      document.getElementById('stat-pedidos').textContent = '0';
    }

    // Pending badge
   const pendDocs = await getDocs(query(collection(db(), 'solicitacoes_empresas'), where('status','==','pendente')));

const badgePendentes = document.getElementById('badge-pendentes');
badgePendentes.textContent = pendDocs.size || '';
document.getElementById('tab-dot-aprovacoes')?.classList.toggle('show', pendDocs.size > 0);

document.getElementById('notif-dot').classList.toggle('show', pendDocs.size > 0);

    // Recent empresas
    const recEmp = await getDocs(query(collection(db(), 'empresas'), orderBy('criadoEm','desc'), limit(5)));
    const tbody = document.getElementById('tbody-recent-empresas');
    tbody.innerHTML = recEmp.empty ? '<tr><td colspan="3" class="loading-row">Nenhuma empresa.</td></tr>' :
      recEmp.docs.map(d => {
        const e = d.data();
        return `<tr><td>${e.nome||'—'}</td><td>${e.categoria||'—'}</td><td>${badge(e.status||'pendente')}</td></tr>`;
      }).join('');

    // Pending table
    const tbodyP = document.getElementById('tbody-pendentes');
    tbodyP.innerHTML = pendDocs.empty ? '<tr><td colspan="3" class="loading-row">Nenhuma pendência.</td></tr>' :
      pendDocs.docs.map(d => {
        const e = d.data();
        return `<tr>
          <td>${e.nome||'—'}</td>
          <td>${fmtDate(e.criadoEm)}</td>
          <td><button class="btn-primary btn-sm" onclick="navTo('aprovacoes')">Ver</button></td>
        </tr>`;
      }).join('');

    renderCharts(emp.docs);
  } catch(e) { console.error(e); toast('Erro ao carregar dashboard.','error'); }
}

let chartViews, chartCats;
// Paleta usada nos gráficos do admin
const CHART_COLORS = ['#1E4FD1','#0F9D6B','#F59E0B','#EC4899','#7C3AED','#0EA5E9','#EF4444','#14B8A6','#F97316','#64748B'];
const chartGrid = { color: 'rgba(16,24,40,.06)' };
const chartTicks = { color: '#6B7287', font: { size: 11 } };

async function renderCharts(empDocs) {
  const { collection, getDocs, query, where, orderBy, Timestamp } = fb();

  // Acessos reais dos últimos 7 dias (coleção acessos_site)
  const ctx1 = document.getElementById('chart-views');
  if (ctx1) {
    const inicio = new Date(); inicio.setHours(0,0,0,0); inicio.setDate(inicio.getDate() - 6);
    const dias = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dias.push(diaKey(d)); }
    const cont = Object.fromEntries(dias.map(k => [k, 0]));
    try {
      const snap = await getDocs(query(collection(db(), 'acessos_site'), where('ts', '>=', Timestamp.fromDate(inicio)), orderBy('ts', 'asc')));
      snap.docs.forEach(d => { const dt = d.data().ts?.toDate?.(); if (dt && cont[diaKey(dt)] !== undefined) cont[diaKey(dt)]++; });
    } catch (e) { console.error('Acessos (dashboard):', e); }
    if (chartViews) chartViews.destroy();
    chartViews = new Chart(ctx1, {
      type: 'bar',
      data: { labels: dias.map(diaCurto), datasets: [{ label: 'Acessos', data: dias.map(k => cont[k]), backgroundColor: '#1E4FD1', borderRadius: 6, maxBarThickness: 36 }] },
      options: { responsive: true, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: chartTicks }, y: { beginAtZero: true, grid: chartGrid, ticks: { ...chartTicks, precision: 0 } } } }
    });
  }

  // Empresas por categoria: barras horizontais (cabe qualquer número de categorias)
  const catMap = {};
  empDocs.forEach(d => { const c = d.data().categoria || 'Outros'; catMap[c] = (catMap[c]||0)+1; });
  const top = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const ctx2 = document.getElementById('chart-cats');
  if (!ctx2) return;
  if (chartCats) chartCats.destroy();
  chartCats = new Chart(ctx2, {
    type: 'bar',
    data: { labels: top.map(t => t[0]), datasets: [{ data: top.map(t => t[1]), backgroundColor: top.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]), borderRadius: 6, maxBarThickness: 18 }] },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, grid: chartGrid, ticks: { ...chartTicks, precision: 0 } }, y: { grid: { display: false }, ticks: chartTicks } } }
  });
}

// ══════════════════════════════════════════════════
// ESTATÍSTICAS DE ACESSO
// ══════════════════════════════════════════════════
let chartAcessosHoras, chartAcessosDias;
let _acessosCache = null;        // todos os acessos (baixados uma vez; "Atualizar" baixa de novo)
let _acessosPeriodo = 30;        // dias; 0 = desde o primeiro acesso

// Data local no formato aaaa-mm-dd (chave de agrupamento por dia)
function diaKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const diaData = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const diaCurto = k => diaData(k).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

async function loadEstatisticas(forcar) {
  const { collection, getDocs, query, orderBy } = fb();
  try {
    if (!_acessosCache || forcar) {
      document.getElementById('tbody-acessos-dias').innerHTML = '<tr><td colspan="5" class="loading-row">Carregando...</td></tr>';
      const snap = await getDocs(query(collection(db(), 'acessos_site'), orderBy('ts', 'asc')));
      _acessosCache = snap.docs.map(d => {
        const a = d.data();
        return { dt: a.ts?.toDate ? a.ts.toDate() : null, pagina: a.pagina, dispositivo: a.dispositivo, referencia: a.referencia };
      }).filter(a => a.dt);
    }
    renderEstatisticas();
  } catch (e) {
    console.error(e);
    toast('Erro ao carregar estatísticas de acesso: ' + (e.code || e.message), 'error');
  }
}
window.loadEstatisticas = loadEstatisticas;

window.setPeriodoAcessos = function (dias) {
  _acessosPeriodo = dias;
  document.querySelectorAll('#acessos-periodo button').forEach(b => b.classList.toggle('active', Number(b.dataset.dias) === dias));
  renderEstatisticas();
};

function renderEstatisticas() {
  const todos = _acessosCache || [];
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const primeiro = todos[0]?.dt ? new Date(todos[0].dt) : new Date(hoje);
  primeiro.setHours(0,0,0,0);
  const inicio = _acessosPeriodo ? new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (_acessosPeriodo - 1)) : primeiro;
  const lista = todos.filter(a => a.dt >= inicio);

  // Todos os dias do período, inclusive os sem acesso
  const dias = [];
  for (let d = new Date(inicio); d <= hoje; d.setDate(d.getDate() + 1)) dias.push(diaKey(d));
  const porDia = Object.fromEntries(dias.map(k => [k, { total: 0, mobile: 0, desktop: 0 }]));
  const porHora = new Array(24).fill(0);
  let mobile = 0;
  lista.forEach(a => {
    const k = diaKey(a.dt);
    if (!porDia[k]) return;
    porDia[k].total++;
    porDia[k][a.dispositivo === 'mobile' ? 'mobile' : 'desktop']++;
    porHora[a.dt.getHours()]++;
    if (a.dispositivo === 'mobile') mobile++;
  });

  const total = lista.length;
  const melhor = dias.reduce((m, k) => porDia[k].total > porDia[m].total ? k : m, dias[0]);
  const pico = porHora.indexOf(Math.max(...porHora));
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('stat-acessos-total', todos.length.toLocaleString('pt-BR'));
  set('stat-acessos-periodo', total.toLocaleString('pt-BR'));
  set('stat-acessos-media', dias.length ? (total / dias.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0');
  set('stat-acessos-melhor', melhor && porDia[melhor].total ? `${porDia[melhor].total} · ${diaCurto(melhor)}` : '—');
  set('stat-acessos-hoje', (porDia[diaKey(hoje)]?.total || 0).toLocaleString('pt-BR'));
  set('stat-acessos-hora-pico', total ? `${String(pico).padStart(2,'0')}h` : '—');
  set('stat-acessos-mobile', total ? Math.round(mobile / total * 100) + '%' : '—');
  set('acessos-periodo-label', _acessosPeriodo ? `Últimos ${_acessosPeriodo} dias` : `Desde ${primeiro.toLocaleDateString('pt-BR')}`);

  renderChartsAcessos(dias, porDia, porHora);

  // Tabela: um dia por linha, do mais recente para o mais antigo
  const max = Math.max(1, ...dias.map(k => porDia[k].total));
  document.getElementById('tbody-acessos-dias').innerHTML = dias.slice().reverse().map(k => {
    const d = porDia[k];
    return `<tr class="${d.total ? '' : 'is-zero'}">
      <td><strong>${diaData(k).toLocaleDateString('pt-BR')}</strong></td>
      <td>${SEMANA[diaData(k).getDay()]}</td>
      <td class="num">${d.total}</td>
      <td class="num">${d.mobile} / ${d.desktop}</td>
      <td class="bar-cell"><span class="day-bar" style="width:${Math.round(d.total / max * 100)}%"></span></td>
    </tr>`;
  }).join('');

  // Últimos acessos
  const recentes = todos.slice(-20).reverse();
  document.getElementById('tbody-acessos-recentes').innerHTML = recentes.length ? recentes.map(a => `<tr>
      <td>${a.dt.toLocaleDateString('pt-BR')}</td>
      <td>${a.dt.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
      <td>${a.pagina || '/'}</td>
      <td>${a.dispositivo === 'mobile' ? '📱 Celular' : '💻 Computador'}</td>
      <td>${a.referencia && a.referencia !== 'direto' ? a.referencia : 'Acesso direto'}</td>
    </tr>`).join('') : '<tr><td colspan="5" class="loading-row">Nenhum acesso registrado ainda.</td></tr>';
}

function renderChartsAcessos(dias, porDia, porHora) {
  const c1 = document.getElementById('chart-acessos-dias');
  if (c1) {
    if (chartAcessosDias) chartAcessosDias.destroy();
    chartAcessosDias = new Chart(c1, {
      type: 'bar',
      data: { labels: dias.map(diaCurto), datasets: [{ label: 'Acessos', data: dias.map(k => porDia[k].total), backgroundColor: '#1E4FD1', borderRadius: 4, maxBarThickness: 28 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { ...chartTicks, autoSkip: true, maxTicksLimit: 12, maxRotation: 0 } },
                  y: { beginAtZero: true, grid: chartGrid, ticks: { ...chartTicks, precision: 0 } } } }
    });
  }
  const c2 = document.getElementById('chart-acessos-horas');
  if (c2) {
    if (chartAcessosHoras) chartAcessosHoras.destroy();
    chartAcessosHoras = new Chart(c2, {
      type: 'bar',
      data: { labels: porHora.map((_, h) => `${h}h`), datasets: [{ label: 'Acessos', data: porHora, backgroundColor: '#0F9D6B', borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { ...chartTicks, autoSkip: true, maxTicksLimit: 12, maxRotation: 0 } },
                  y: { beginAtZero: true, grid: chartGrid, ticks: { ...chartTicks, precision: 0 } } } }
    });
  }
}

// ══════════════════════════════════════════════════
// EMPRESAS
// ══════════════════════════════════════════════════
let _empresas = [];
async function loadEmpresas() {
  const { collection, getDocs, orderBy, query } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'empresas'), orderBy('nome')));
    _empresas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderEmpresas(_empresas);
    populateCatFilter();
  } catch(e) { console.error(e); toast('Erro ao carregar empresas.','error'); }
}

function renderEmpresas(list) {
  const tbody = document.getElementById('tbody-empresas');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><span>🏢</span>Nenhuma empresa.</td></tr>'; return; }
  tbody.innerHTML = list.map(e => `
    <tr>
      <td>${e.logoUrl ? `<img src="${e.logoUrl}" class="table-logo" />` : `<div class="table-logo-placeholder">🏢</div>`}</td>
      <td><strong>${e.nome||'—'}</strong></td>
      <td>${e.categoria||'—'}</td>
      <td>${e.telefone||'—'}</td>
      <td>${badge(e.status||'pendente')}</td>
      <td>
        <div style="font-size:12px;color:#6B7280">${e.ownerUid ? '🔗 Vinculado' : '<span style=\"color:#D89B2E\">⚠️ Sem acesso</span>'}</div>
        <div style="font-size:11px;color:#9CA3AF;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.ownerEmail || ''}</div>
      </td>
      <td><div class="actions-cell">
        <button class="btn-ghost btn-sm" title="Vincular e-mail de acesso" onclick="openVincularModal('${e.id}','${(e.nome||'').replace(/'/g,'')}','${e.ownerEmail||''}')">🔗</button>
        <button class="btn-ghost btn-sm" onclick="editEmpresa('${e.id}')">✏️</button>
        <button class="btn-danger btn-sm" onclick="deleteEmpresaConfirm('${e.id}','${e.nome}')">🗑️</button>
      </div></td>
    </tr>
  `).join('');
}

window.filterEmpresas = function() {
  const nome   = document.getElementById('filter-empresa-nome').value.toLowerCase();
  const status = document.getElementById('filter-empresa-status').value;
  const cat    = document.getElementById('filter-empresa-cat').value;
  const filtered = _empresas.filter(e =>
    (!nome   || (e.nome||'').toLowerCase().includes(nome)) &&
    (!status || e.status === status) &&
    (!cat    || e.categoria === cat)
  );
  renderEmpresas(filtered);
};

function populateCatFilter() {
  const cats = [...new Set(_empresas.map(e => e.categoria).filter(Boolean))];
  const sel = document.getElementById('filter-empresa-cat');
  sel.innerHTML = '<option value="">Todas as categorias</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

window.openEmpresaModal = function(e = null) {
  // Reset
  ['empresa-id','empresa-nome','empresa-descricao','empresa-endereco',
   'empresa-telefone','empresa-whatsapp','empresa-instagram','empresa-lat','empresa-lng'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('empresa-status').value = 'ativa';
  document.getElementById('preview-logo').classList.add('hidden');
  document.getElementById('preview-capa').classList.add('hidden');
  document.getElementById('upload-logo-text').classList.remove('hidden');
  document.getElementById('upload-capa-text').classList.remove('hidden');
  document.getElementById('modal-empresa-title').textContent = 'Nova Empresa';
  // Load categories into select
  loadCatsSelect('empresa-categoria');
  openModal('modal-empresa');
};

window.editEmpresa = function(id) {
  const e = _empresas.find(x => x.id === id);
  if (!e) return;
  document.getElementById('empresa-id').value = e.id;
  document.getElementById('empresa-nome').value = e.nome || '';
  document.getElementById('empresa-descricao').value = e.descricao || '';
  document.getElementById('empresa-endereco').value = e.endereco || '';
  document.getElementById('empresa-telefone').value = e.telefone || '';
  document.getElementById('empresa-whatsapp').value = e.whatsapp || '';
  document.getElementById('empresa-instagram').value = e.instagram || '';
  document.getElementById('empresa-lat').value = e.lat || '';
  document.getElementById('empresa-lng').value = e.lng || '';
  document.getElementById('empresa-status').value = e.status || 'ativa';

  if (e.logoUrl) {
    const img = document.getElementById('preview-logo');
    img.src = e.logoUrl; img.classList.remove('hidden');
    document.getElementById('upload-logo-text').classList.add('hidden');
  }
  document.getElementById('modal-empresa-title').textContent = 'Editar Empresa';
  loadCatsSelect('empresa-categoria', e.categoria);
  openModal('modal-empresa');
};

window.saveEmpresa = async function() {
  const nome = document.getElementById('empresa-nome').value.trim();
  if (!nome) { toast('Nome é obrigatório.','error'); return; }
  setLoading('save-empresa-text','save-empresa-loading', true);
  try {
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = fb();
    let logoUrl = _empresas.find(e => e.id === document.getElementById('empresa-id').value)?.logoUrl || '';
    let capaUrl = _empresas.find(e => e.id === document.getElementById('empresa-id').value)?.capaUrl || '';
    const newLogo = await uploadFile('file-logo', 'empresas/logos');
    const newCapa = await uploadFile('file-capa', 'empresas/capas');
    if (newLogo) logoUrl = newLogo;
    if (newCapa) capaUrl = newCapa;

    const data = {
      nome, logoUrl, capaUrl,
      categoria: document.getElementById('empresa-categoria').value,
      descricao: document.getElementById('empresa-descricao').value,
      endereco: document.getElementById('empresa-endereco').value,
      telefone: document.getElementById('empresa-telefone').value,
      whatsapp: document.getElementById('empresa-whatsapp').value,
      instagram: document.getElementById('empresa-instagram').value,
      lat: parseFloat(document.getElementById('empresa-lat').value) || null,
      lng: parseFloat(document.getElementById('empresa-lng').value) || null,
      status: document.getElementById('empresa-status').value,
      atualizadoEm: serverTimestamp()
    };

    const id = document.getElementById('empresa-id').value;
    if (id) {
      await updateDoc(doc(db(), 'empresas', id), data);
      toast('Empresa atualizada!','success');
    } else {
      data.criadoEm = serverTimestamp();
      await addDoc(collection(db(), 'empresas'), data);
      toast('Empresa criada!','success');
    }
    closeAllModals();
    loadEmpresas();
  } catch(e) { console.error(e); toast('Erro ao salvar empresa.','error'); }
  finally { setLoading('save-empresa-text','save-empresa-loading', false); }
};

window.deleteEmpresaConfirm = function(id, nome) {
  confirm(`Excluir a empresa "${nome}"?`, () => deleteEmpresa(id));
};
async function deleteEmpresa(id) {
  const { doc, deleteDoc } = fb();
  try { await deleteDoc(doc(db(), 'empresas', id)); toast('Empresa excluída.','success'); loadEmpresas(); }
  catch(e) { toast('Erro ao excluir.','error'); }
}

// ══════════════════════════════════════════════════
async function loadAprovacoes() {
  const { collection, getDocs, query, where } = fb();
  const list = document.getElementById('aprovacoes-list');
  list.innerHTML = '<div class="loading-row">Carregando...</div>';

  try {
    const snap = await getDocs(query(
      collection(db(), 'solicitacoes_empresas'),
      where('status', '==', 'pendente')
    ));

    const docs = snap.docs.sort((a, b) => {
      const da = a.data().criadoEm?.toDate?.() || new Date(0);
      const dbb = b.data().criadoEm?.toDate?.() || new Date(0);
      return dbb - da;
    });

    if (!docs.length) {
      list.innerHTML = '<div class="empty-state"><span>✅</span>Nenhuma solicitação pendente.</div>';
      return;
    }

    list.innerHTML = docs.map(d => {
      const e = d.data();
      const id = d.id;

      // Format WhatsApp number for link (remove non-digits, add Brazil code if needed)
      const wpRaw = (e.whatsapp || '').replace(/\D/g, '');
      const wpLink = wpRaw ? `https://wa.me/55${wpRaw}` : '';

      // User info block (shown if available)
      const userBlock = (e.usuarioNome || e.usuarioEmail || e.usuarioWhatsapp) ? `
        <div class="aprovacao-user-block">
          <div class="aprovacao-user-title">👤 Dados do Solicitante</div>
          <div class="aprovacao-fields aprovacao-fields-user">
            ${e.usuarioNome    ? `<div class="aprovacao-field"><strong>Nome</strong>${e.usuarioNome}</div>` : ''}
            ${e.usuarioEmail   ? `<div class="aprovacao-field"><strong>E-mail</strong>${e.usuarioEmail}</div>` : ''}
            ${e.usuarioWhatsapp ? `<div class="aprovacao-field"><strong>WhatsApp</strong>${e.usuarioWhatsapp}</div>` : ''}
          </div>
          ${e.usuarioWhatsapp ? (() => {
            const uwRaw = e.usuarioWhatsapp.replace(/\D/g, '');
            const msg = encodeURIComponent(`Olá ${e.usuarioNome || ''}! Recebemos sua solicitação para divulgar "${e.nome || 'seu negócio'}" no Achei Fácil.`);
            return `<a href="https://wa.me/55${uwRaw}?text=${msg}" target="_blank" class="btn-whatsapp-user">
              <svg viewBox="0 0 24 24" width="15" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.534 5.857L0 24l6.334-1.508A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.383l-.36-.214-3.762.896.952-3.663-.234-.376A9.793 9.793 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
              Falar com Solicitante
            </a>`;
          })() : ''}
        </div>` : '';

      return `
        <div class="aprovacao-card">
          <div class="aprovacao-header">
            <h4>${e.nome || 'Sem nome'}</h4>
            <span class="badge badge-pendente">Pendente</span>
          </div>

          <div class="aprovacao-section-title">🏢 Dados da Empresa</div>
          <div class="aprovacao-fields">
            <div class="aprovacao-field"><strong>Categoria</strong>${e.categoria || '—'}</div>
            <div class="aprovacao-field"><strong>Responsável</strong>${e.responsavel || e.dono || '—'}</div>
            <div class="aprovacao-field"><strong>Telefone</strong>${e.telefone || '—'}</div>
            <div class="aprovacao-field aprovacao-field-wp">
              <strong>WhatsApp</strong>
              <span>${e.whatsapp || '—'}</span>
              ${wpLink ? `<a href="${wpLink}?text=${encodeURIComponent(`Olá! Somos do Achei Fácil e gostaríamos de confirmar seu cadastro de "${e.nome}".`)}" target="_blank" class="btn-whatsapp-inline">
                <svg viewBox="0 0 24 24" width="13" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.124 1.534 5.857L0 24l6.334-1.508A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.383l-.36-.214-3.762.896.952-3.663-.234-.376A9.793 9.793 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                WhatsApp
              </a>` : ''}
            </div>
            <div class="aprovacao-field"><strong>Endereço</strong>${e.endereco || '—'}</div>
            <div class="aprovacao-field"><strong>Instagram</strong>${e.instagram ? `@${e.instagram.replace('@','')}` : '—'}</div>
            <div class="aprovacao-field"><strong>Enviado em</strong>${fmtDate(e.criadoEm)}</div>
          </div>

          ${e.descricao ? `<p style="font-size:13px;color:var(--text-muted);margin:.5rem 0 1rem;padding:.75rem;background:var(--bg-card);border-radius:8px;border-left:3px solid var(--primary)">${e.descricao}</p>` : ''}

          ${userBlock}

          <div class="aprovacao-actions">
            <button class="btn-primary btn-sm" onclick="aprovarEmpresa('${id}')">✅ Aprovar</button>
            <button class="btn-danger btn-sm" onclick="rejeitarEmpresa('${id}')">✕ Rejeitar</button>
          </div>
        </div>
      `;
    }).join('');

  } catch(e) {
    console.error(e);
    list.innerHTML = '<div class="loading-row">Erro ao carregar.</div>';
  }
}

window.aprovarEmpresa = async function(solId) {
  const { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } = fb();

  try {
    const snap = await getDoc(doc(db(), 'solicitacoes_empresas', solId));
    if (!snap.exists()) return;

    const s = snap.data();

    const data = {
      ...s,
      status: 'ativa',

      ownerUid: s.usuarioId || null,
      usuarioId: s.usuarioId || null,

      criadoEm: serverTimestamp(),
      aprovadoEm: serverTimestamp()
    };

    await addDoc(collection(db(), 'empresas'), data);

    await updateDoc(doc(db(), 'solicitacoes_empresas', solId), {
      status: 'aprovada',
      aprovadoEm: serverTimestamp()
    });

    toast('Empresa aprovada e painel liberado!', 'success');
    loadAprovacoes();

  } catch(e) {
    console.error(e);
    toast('Erro ao aprovar empresa.', 'error');
  }
};

window.rejeitarEmpresa = async function(solId) {
  const { doc, updateDoc } = fb();
  confirm('Rejeitar esta solicitação?', async () => {
    try {
      await updateDoc(doc(db(), 'solicitacoes_empresas', solId), { status: 'rejeitada' });
      toast('Solicitação rejeitada.','warning'); loadAprovacoes();
    } catch(e) { toast('Erro ao rejeitar.','error'); }
  });
};

// ══════════════════════════════════════════════════
// NOTÍCIAS
// ══════════════════════════════════════════════════
let _noticias = [];
async function loadNoticias() {
  const { collection, getDocs, query, orderBy } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'noticias'), orderBy('criadoEm','desc')));
    _noticias = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tbody = document.getElementById('tbody-noticias');
    tbody.innerHTML = _noticias.length ? _noticias.map(n => `
      <tr>
        <td>${n.imagemUrl ? `<img src="${n.imagemUrl}" class="table-thumb" />` : '📰'}</td>
        <td><strong>${n.titulo||'—'}</strong></td>
        <td>${n.categoria||'Geral'}</td>
        <td>${n.autor||'—'}</td>
        <td>${fmtDate(n.criadoEm)}</td>
        <td><div class="actions-cell">
          <button class="btn-ghost btn-sm" onclick="editNoticia('${n.id}')">✏️</button>
          <button class="btn-danger btn-sm" onclick="deleteNoticia('${n.id}')">🗑️</button>
        </div></td>
      </tr>
    `).join('') : '<tr><td colspan="6" class="loading-row">Nenhuma notícia.</td></tr>';
  } catch(e) { toast('Erro ao carregar notícias.','error'); }
}

window.openNoticiaModal = function() {
  ['noticia-id','noticia-titulo','noticia-autor','noticia-texto'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('preview-noticia-img').classList.add('hidden');
  document.getElementById('upload-noticia-text').classList.remove('hidden');
  document.getElementById('modal-noticia-title').textContent = 'Nova Notícia';
  openModal('modal-noticia');
};
window.editNoticia = function(id) {
  const n = _noticias.find(x => x.id === id); if (!n) return;
  document.getElementById('noticia-id').value = n.id;
  document.getElementById('noticia-titulo').value = n.titulo || '';
  document.getElementById('noticia-autor').value = n.autor || '';
  document.getElementById('noticia-texto').value = n.texto || '';
  document.getElementById('noticia-categoria').value = n.categoria || 'Geral';
  if (n.imagemUrl) {
    const img = document.getElementById('preview-noticia-img');
    img.src = n.imagemUrl; img.classList.remove('hidden');
    document.getElementById('upload-noticia-text').classList.add('hidden');
  }
  document.getElementById('modal-noticia-title').textContent = 'Editar Notícia';
  openModal('modal-noticia');
};
window.saveNoticia = async function() {
  const titulo = document.getElementById('noticia-titulo').value.trim();
  if (!titulo) { toast('Título obrigatório.','error'); return; }
  const { collection, doc, addDoc, updateDoc, serverTimestamp } = fb();
  try {
    let imagemUrl = _noticias.find(n => n.id === document.getElementById('noticia-id').value)?.imagemUrl || '';
    const newImg = await uploadFile('file-noticia-img', 'noticias');
    if (newImg) imagemUrl = newImg;
    const data = {
      titulo, imagemUrl,
      categoria: document.getElementById('noticia-categoria').value,
      autor: document.getElementById('noticia-autor').value,
      texto: document.getElementById('noticia-texto').value,
      atualizadoEm: serverTimestamp()
    };
    const id = document.getElementById('noticia-id').value;
    if (id) { await updateDoc(doc(db(), 'noticias', id), data); toast('Notícia atualizada!','success'); }
    else { data.criadoEm = serverTimestamp(); await addDoc(collection(db(), 'noticias'), data); toast('Notícia publicada!','success'); }
    closeAllModals(); loadNoticias();
  } catch(e) { toast('Erro ao salvar.','error'); }
};
window.deleteNoticia = function(id) {
  const { doc, deleteDoc } = fb();
  confirm('Excluir esta notícia?', async () => {
    try { await deleteDoc(doc(db(), 'noticias', id)); toast('Notícia excluída.','success'); loadNoticias(); }
    catch(e) { toast('Erro.','error'); }
  });
};

// ══════════════════════════════════════════════════
// EVENTOS
// ══════════════════════════════════════════════════
let _eventos = [];
async function loadEventos() {
  const { collection, getDocs, query, orderBy } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'eventos'), orderBy('data','asc')));
    _eventos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tbody = document.getElementById('tbody-eventos');
    tbody.innerHTML = _eventos.length ? _eventos.map(e => `
      <tr>
        <td>${e.imagemUrl ? `<img src="${e.imagemUrl}" class="table-thumb" />` : '🎉'}</td>
        <td><strong>${e.nome||'—'}</strong></td>
        <td>${e.local||'—'}</td>
        <td>${e.data||'—'}</td>
        <td>${e.horario||'—'}</td>
        <td><div class="actions-cell">
          <button class="btn-ghost btn-sm" onclick="editEvento('${e.id}')">✏️</button>
          <button class="btn-danger btn-sm" onclick="deleteEvento('${e.id}')">🗑️</button>
        </div></td>
      </tr>
    `).join('') : '<tr><td colspan="6" class="loading-row">Nenhum evento.</td></tr>';
  } catch(e) { toast('Erro ao carregar eventos.','error'); }
}

window.openEventoModal = function() {
  ['evento-id','evento-nome','evento-local','evento-data','evento-horario','evento-descricao'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('preview-evento-img').classList.add('hidden');
  document.getElementById('upload-evento-text').classList.remove('hidden');
  document.getElementById('modal-evento-title').textContent = 'Novo Evento';
  openModal('modal-evento');
};
window.editEvento = function(id) {
  const e = _eventos.find(x => x.id === id); if (!e) return;
  document.getElementById('evento-id').value = e.id;
  document.getElementById('evento-nome').value = e.nome || '';
  document.getElementById('evento-local').value = e.local || '';
  document.getElementById('evento-data').value = e.data || '';
  document.getElementById('evento-horario').value = e.horario || '';
  document.getElementById('evento-descricao').value = e.descricao || '';
  if (e.imagemUrl) {
    const img = document.getElementById('preview-evento-img');
    img.src = e.imagemUrl; img.classList.remove('hidden');
    document.getElementById('upload-evento-text').classList.add('hidden');
  }
  document.getElementById('modal-evento-title').textContent = 'Editar Evento';
  openModal('modal-evento');
};
window.saveEvento = async function() {
  const nome = document.getElementById('evento-nome').value.trim();
  if (!nome) { toast('Nome obrigatório.','error'); return; }
  const { collection, doc, addDoc, updateDoc, serverTimestamp } = fb();
  try {
    let imagemUrl = _eventos.find(e => e.id === document.getElementById('evento-id').value)?.imagemUrl || '';
    const newImg = await uploadFile('file-evento-img', 'eventos');
    if (newImg) imagemUrl = newImg;
    const data = {
      nome, imagemUrl,
      local: document.getElementById('evento-local').value,
      data: document.getElementById('evento-data').value,
      horario: document.getElementById('evento-horario').value,
      descricao: document.getElementById('evento-descricao').value,
      atualizadoEm: serverTimestamp()
    };
    const id = document.getElementById('evento-id').value;
    if (id) { await updateDoc(doc(db(), 'eventos', id), data); toast('Evento atualizado!','success'); }
    else { data.criadoEm = serverTimestamp(); await addDoc(collection(db(), 'eventos'), data); toast('Evento criado!','success'); }
    closeAllModals(); loadEventos();
  } catch(e) { toast('Erro ao salvar.','error'); }
};
window.deleteEvento = function(id) {
  const { doc, deleteDoc } = fb();
  confirm('Excluir este evento?', async () => {
    try { await deleteDoc(doc(db(), 'eventos', id)); toast('Evento excluído.','success'); loadEventos(); }
    catch(e) { toast('Erro.','error'); }
  });
};

// UTILIDADES PÚBLICAS
// ══════════════════════════════════════════════════
let _utilidades = [];
async function loadUtilidades() {
  const { collection, getDocs, query, orderBy } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'utilidades'), orderBy('nome')));
    _utilidades = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tbody = document.getElementById('tbody-utilidades');
    tbody.innerHTML = _utilidades.length ? _utilidades.map(u => `
      <tr>
        <td><strong>${u.nome||'—'}</strong></td>
        <td>${u.categoria||'—'}</td>
        <td>${u.telefone||'—'}</td>
        <td>${u.whatsapp||'—'}</td>
        <td>${u.endereco||'—'}</td>
        <td><div class="actions-cell">
          <button class="btn-ghost btn-sm" onclick="editUtilidade('${u.id}')">✏️</button>
          <button class="btn-danger btn-sm" onclick="deleteUtilidade('${u.id}')">🗑️</button>
        </div></td>
      </tr>
    `).join('') : '<tr><td colspan="6" class="loading-row">Nenhuma utilidade.</td></tr>';
  } catch(e) { toast('Erro ao carregar utilidades.','error'); }
}
window.openUtilidadeModal = function() {
  ['utilidade-id','utilidade-nome','utilidade-telefone','utilidade-whatsapp','utilidade-endereco'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('modal-utilidade-title').textContent = 'Nova Utilidade Pública';
  openModal('modal-utilidade');
};
window.editUtilidade = function(id) {
  const u = _utilidades.find(x => x.id === id); if (!u) return;
  document.getElementById('utilidade-id').value = u.id;
  document.getElementById('utilidade-nome').value = u.nome || '';
  document.getElementById('utilidade-telefone').value = u.telefone || '';
  document.getElementById('utilidade-whatsapp').value = u.whatsapp || '';
  document.getElementById('utilidade-endereco').value = u.endereco || '';
  document.getElementById('utilidade-categoria').value = u.categoria || 'Outros';
  document.getElementById('modal-utilidade-title').textContent = 'Editar Utilidade';
  openModal('modal-utilidade');
};
window.saveUtilidade = async function() {
  const nome = document.getElementById('utilidade-nome').value.trim();
  if (!nome) { toast('Nome obrigatório.','error'); return; }
  const { collection, doc, addDoc, updateDoc, serverTimestamp } = fb();
  try {
    const data = {
      nome,
      categoria: document.getElementById('utilidade-categoria').value,
      telefone: document.getElementById('utilidade-telefone').value,
      whatsapp: document.getElementById('utilidade-whatsapp').value,
      endereco: document.getElementById('utilidade-endereco').value,
      atualizadoEm: serverTimestamp()
    };
    const id = document.getElementById('utilidade-id').value;
    if (id) { await updateDoc(doc(db(), 'utilidades', id), data); toast('Atualizado!','success'); }
    else { data.criadoEm = serverTimestamp(); await addDoc(collection(db(), 'utilidades'), data); toast('Criado!','success'); }
    closeAllModals(); loadUtilidades();
  } catch(e) { toast('Erro.','error'); }
};
window.deleteUtilidade = function(id) {
  const { doc, deleteDoc } = fb();
  confirm('Excluir esta utilidade?', async () => {
    try { await deleteDoc(doc(db(), 'utilidades', id)); toast('Excluído.','success'); loadUtilidades(); }
    catch(e) { toast('Erro.','error'); }
  });
};

// ══════════════════════════════════════════════════
// CATEGORIAS
// ══════════════════════════════════════════════════

const DEFAULT_CATEGORIES = [
  { nome: 'Alimentação',           icone: '🍽️', cor: '#D89B2E' },
  { nome: 'Beleza e Estética',     icone: '💅', cor: '#EC4899' },
  { nome: 'Consertos e Reparos',   icone: '🔧', cor: '#6B7280' },
  { nome: 'Lojas',                 icone: '🛍️', cor: '#10B981' },
  { nome: 'Material de Construção',icone: '🏗️', cor: '#F97316' },
  { nome: 'Saúde',                 icone: '🏥', cor: '#EF4444' },
  { nome: 'Transporte',            icone: '🚗', cor: '#3B82F6' },
  { nome: 'Aniversário',           icone: '🎂', cor: '#8B5CF6' },
  { nome: 'Presentes',             icone: '🎁', cor: '#EF4444' },
  { nome: 'Empregos',              icone: '💼', cor: '#0EA5E9' },
  { nome: 'Grupos',                icone: '👥', cor: '#14B8A6' },
  { nome: 'Tecnologia e Informática', icone: '💻', cor: '#7C3AED' },
  { nome: 'Educação',              icone: '📚', cor: '#0891B2' },
  { nome: 'Imóveis',               icone: '🏠', cor: '#16A34A' },
  { nome: 'Pet Shop',              icone: '🐾', cor: '#D97706' },
  { nome: 'Esporte e Lazer',       icone: '⚽', cor: '#1E4FD1' },
  { nome: 'Contabilidade e Finanças', icone: '💰', cor: '#059669' },
  { nome: 'Advocacia e Jurídico',  icone: '⚖️', cor: '#7C3AED' },
  { nome: 'Religião e Igrejas',    icone: '⛪', cor: '#9CA3AF' },
  { nome: 'Eventos e Festas',      icone: '🎉', cor: '#D89B2E' },
];

let _categorias = [];
async function loadCategorias() {
  const { collection, getDocs, query, orderBy, addDoc, serverTimestamp } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'categorias'), orderBy('nome')));
    // If no categories exist, seed the defaults
    if (snap.empty) {
      toast('Populando categorias padrão...', 'info');
      for (const cat of DEFAULT_CATEGORIES) {
        await addDoc(collection(db(), 'categorias'), { ...cat, criadoEm: serverTimestamp() });
      }
      // Reload
      const snap2 = await getDocs(query(collection(db(), 'categorias'), orderBy('nome')));
      _categorias = snap2.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      _categorias = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    renderCategorias();
  } catch(e) { console.error(e); toast('Erro ao carregar categorias.','error'); }
}

function renderCategorias() {
  const grid = document.getElementById('categorias-grid');
  grid.innerHTML = _categorias.length ? _categorias.map(c => `
    <div class="categoria-item" style="border-top:3px solid ${c.cor||'#1E4FD1'}">
      <div class="cat-icon">${c.icone||'🏷️'}</div>
      <div class="cat-name">${c.nome}</div>
      <div class="cat-cor-dot" style="width:14px;height:14px;border-radius:50%;background:${c.cor||'#1E4FD1'};margin:0 auto 8px;"></div>
      <div class="cat-actions">
        <button class="btn-ghost btn-sm btn-icon" onclick="editCategoria('${c.id}')">✏️</button>
        <button class="btn-danger btn-sm btn-icon" onclick="deleteCategoria('${c.id}')">🗑️</button>
      </div>
    </div>
  `).join('') : '<div class="empty-state"><span>🏷️</span>Nenhuma categoria.</div>';
}
async function loadCatsSelect(selectId, current = '') {
  const { collection, getDocs, query, orderBy } = fb();
  const sel = document.getElementById(selectId);
  try {
    const snap = await getDocs(query(collection(db(), 'categorias'), orderBy('nome')));
    sel.innerHTML = '<option value="">Selecionar</option>' +
      snap.docs.map(d => `<option value="${d.data().nome}" ${d.data().nome === current ? 'selected' : ''}>${d.data().icone||''} ${d.data().nome}</option>`).join('');
  } catch { sel.innerHTML = '<option value="">Selecionar</option>'; }
}
window.openCategoriaModal = function() {
  ['categoria-id','categoria-nome','categoria-icone'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('categoria-cor').value = '#1E4FD1';
  document.getElementById('cat-cor-hex').textContent = '#1E4FD1';
  document.getElementById('modal-categoria-title').textContent = 'Nova Categoria';
  // Show quick-pick
  const quickPick = document.getElementById('categoria-quick-pick');
  if (quickPick) {
    quickPick.innerHTML = DEFAULT_CATEGORIES.map(c =>
      `<button type="button" class="cat-quick-btn" onclick="pickDefaultCat('${c.nome}','${c.icone}','${c.cor}')" title="${c.nome}">${c.icone} <span>${c.nome}</span></button>`
    ).join('');
  }
  openModal('modal-categoria');
};
window.pickDefaultCat = function(nome, icone, cor) {
  document.getElementById('categoria-nome').value = nome;
  document.getElementById('categoria-icone').value = icone;
  document.getElementById('categoria-cor').value = cor;
  document.getElementById('cat-cor-hex').textContent = cor;
};
window.editCategoria = function(id) {
  const c = _categorias.find(x => x.id === id); if (!c) return;
  document.getElementById('categoria-id').value = c.id;
  document.getElementById('categoria-nome').value = c.nome || '';
  document.getElementById('categoria-icone').value = c.icone || '';
  document.getElementById('categoria-cor').value = c.cor || '#6366f1';
  document.getElementById('cat-cor-hex').textContent = c.cor || '#6366f1';
  document.getElementById('modal-categoria-title').textContent = 'Editar Categoria';
  openModal('modal-categoria');
};
document.getElementById('categoria-cor')?.addEventListener('input', function() {
  document.getElementById('cat-cor-hex').textContent = this.value;
});
window.saveCategoria = async function() {
  const nome = document.getElementById('categoria-nome').value.trim();
  if (!nome) { toast('Nome obrigatório.','error'); return; }
  const { collection, doc, addDoc, updateDoc, serverTimestamp } = fb();
  try {
    const data = { nome, icone: document.getElementById('categoria-icone').value, cor: document.getElementById('categoria-cor').value, atualizadoEm: serverTimestamp() };
    const id = document.getElementById('categoria-id').value;
    if (id) { await updateDoc(doc(db(), 'categorias', id), data); toast('Categoria atualizada!','success'); }
    else { data.criadoEm = serverTimestamp(); await addDoc(collection(db(), 'categorias'), data); toast('Categoria criada!','success'); }
    closeAllModals(); loadCategorias();
  } catch(e) { toast('Erro.','error'); }
};
window.deleteCategoria = function(id) {
  const { doc, deleteDoc } = fb();
  confirm('Excluir esta categoria?', async () => {
    try { await deleteDoc(doc(db(), 'categorias', id)); toast('Excluída.','success'); loadCategorias(); }
    catch(e) { toast('Erro.','error'); }
  });
};

// ══════════════════════════════════════════════════
// CUPONS
// ══════════════════════════════════════════════════
let _cupons = [];
async function loadCupons() {
  const { collection, getDocs, query, orderBy } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'cupons'), orderBy('criadoEm','desc')));
    _cupons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const today = new Date().toISOString().split('T')[0];
    const tbody = document.getElementById('tbody-cupons');
    tbody.innerHTML = _cupons.length ? _cupons.map(c => {
      const expired = c.validade && c.validade < today;
      return `<tr>
        <td><code style="font-family:var(--mono);color:var(--primary)">${c.codigo}</code></td>
        <td>${c.empresaNome||'Geral'}</td>
        <td><strong>${c.desconto}%</strong></td>
        <td>${c.validade||'—'}</td>
        <td>${badge(expired ? 'expirado' : 'ativo')}</td>
        <td><div class="actions-cell">
          <button class="btn-ghost btn-sm" onclick="editCupom('${c.id}')">✏️</button>
          <button class="btn-danger btn-sm" onclick="deleteCupom('${c.id}')">🗑️</button>
        </div></td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="loading-row">Nenhum cupom.</td></tr>';
  } catch(e) { toast('Erro ao carregar cupons.','error'); }
}
async function loadEmpresasSelect(selectId, current = '') {
  const { collection, getDocs, query, orderBy, where } = fb();
  const sel = document.getElementById(selectId);
  try {
    const snap = await getDocs(query(collection(db(), 'empresas'), where('status','==','ativa'), orderBy('nome')));
    sel.innerHTML = '<option value="">Selecionar empresa</option>' +
      snap.docs.map(d => `<option value="${d.id}" data-nome="${d.data().nome}" ${d.id === current ? 'selected' : ''}>${d.data().nome}</option>`).join('');
  } catch { sel.innerHTML = '<option value="">Selecionar empresa</option>'; }
}
window.openCupomModal = function() {
  ['cupom-id','cupom-codigo','cupom-desconto','cupom-validade','cupom-descricao'].forEach(id => { document.getElementById(id).value = ''; });
  loadEmpresasSelect('cupom-empresa');
  document.getElementById('modal-cupom-title').textContent = 'Novo Cupom';
  openModal('modal-cupom');
};
window.editCupom = function(id) {
  const c = _cupons.find(x => x.id === id); if (!c) return;
  document.getElementById('cupom-id').value = c.id;
  document.getElementById('cupom-codigo').value = c.codigo || '';
  document.getElementById('cupom-desconto').value = c.desconto || '';
  document.getElementById('cupom-validade').value = c.validade || '';
  document.getElementById('cupom-descricao').value = c.descricao || '';
  loadEmpresasSelect('cupom-empresa', c.empresaId);
  document.getElementById('modal-cupom-title').textContent = 'Editar Cupom';
  openModal('modal-cupom');
};
window.saveCupom = async function() {
  const codigo = document.getElementById('cupom-codigo').value.trim().toUpperCase();
  if (!codigo) { toast('Código obrigatório.','error'); return; }
  const { collection, doc, addDoc, updateDoc, serverTimestamp } = fb();
  try {
    const sel = document.getElementById('cupom-empresa');
    const opt = sel.options[sel.selectedIndex];
    const data = {
      codigo, desconto: parseInt(document.getElementById('cupom-desconto').value) || 0,
      validade: document.getElementById('cupom-validade').value,
      descricao: document.getElementById('cupom-descricao').value,
      empresaId: sel.value, empresaNome: opt?.dataset.nome || '',
      atualizadoEm: serverTimestamp()
    };
    const id = document.getElementById('cupom-id').value;
    if (id) { await updateDoc(doc(db(), 'cupons', id), data); toast('Cupom atualizado!','success'); }
    else { data.criadoEm = serverTimestamp(); await addDoc(collection(db(), 'cupons'), data); toast('Cupom criado!','success'); }
    closeAllModals(); loadCupons();
  } catch(e) { toast('Erro.','error'); }
};
window.deleteCupom = function(id) {
  const { doc, deleteDoc } = fb();
  confirm('Excluir este cupom?', async () => {
    try { await deleteDoc(doc(db(), 'cupons', id)); toast('Cupom excluído.','success'); loadCupons(); }
    catch(e) { toast('Erro.','error'); }
  });
};

// ══════════════════════════════════════════════════
// PATROCINADOS
// ══════════════════════════════════════════════════
let _patrocinados = [];
async function loadPatrocinados() {
  const { collection, getDocs, query, orderBy } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'patrocinados'), orderBy('inicio','desc')));
    _patrocinados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const today = new Date().toISOString().split('T')[0];
    const tbody = document.getElementById('tbody-patrocinados');
    tbody.innerHTML = _patrocinados.length ? _patrocinados.map(p => {
      const ativo = p.inicio <= today && p.fim >= today;
      return `<tr>
        <td><strong>${p.empresaNome||'—'}</strong></td>
        <td>${p.inicio||'—'}</td>
        <td>${p.fim||'—'}</td>
        <td>${badge(ativo ? 'ativo' : 'expirado')}</td>
        <td><div class="actions-cell">
          <button class="btn-danger btn-sm" onclick="deletePatrocinado('${p.id}')">🗑️</button>
        </div></td>
      </tr>`;
    }).join('') : '<tr><td colspan="5" class="loading-row">Nenhum patrocínio.</td></tr>';
  } catch(e) { toast('Erro.','error'); }
}
window.openPatrocinadoModal = function() {
  ['patrocinado-id','patrocinado-inicio','patrocinado-fim','patrocinado-valor'].forEach(id => { document.getElementById(id).value = ''; });
  loadEmpresasSelect('patrocinado-empresa');
  openModal('modal-patrocinado');
};
window.savePatrocinado = async function() {
  const sel = document.getElementById('patrocinado-empresa');
  const opt = sel.options[sel.selectedIndex];
  if (!sel.value) { toast('Selecione uma empresa.','error'); return; }
  const { collection, doc, addDoc, serverTimestamp } = fb();
  try {
    await addDoc(collection(db(), 'patrocinados'), {
      empresaId: sel.value, empresaNome: opt?.text || '',
      inicio: document.getElementById('patrocinado-inicio').value,
      fim: document.getElementById('patrocinado-fim').value,
      valor: parseFloat(document.getElementById('patrocinado-valor').value) || 0,
      criadoEm: serverTimestamp()
    });
    // Mark empresa as patrocinada
    const { updateDoc } = fb();
    await updateDoc(doc(db(), 'empresas', sel.value), { patrocinada: true, patrocinioFim: document.getElementById('patrocinado-fim').value });
    toast('Destaque ativado!','success'); closeAllModals(); loadPatrocinados();
  } catch(e) { toast('Erro.','error'); }
};
window.deletePatrocinado = function(id) {
  const { doc, deleteDoc } = fb();
  confirm('Remover patrocínio?', async () => {
    try { await deleteDoc(doc(db(), 'patrocinados', id)); toast('Removido.','success'); loadPatrocinados(); }
    catch(e) { toast('Erro.','error'); }
  });
};

// ══════════════════════════════════════════════════
// USUÁRIOS
// ══════════════════════════════════════════════════
async function loadUsuarios() {
  const { collection, getDocs, query, orderBy } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'usuarios'), orderBy('criadoEm','desc')));
    const tbody = document.getElementById('tbody-usuarios');
    tbody.innerHTML = snap.empty ? '<tr><td colspan="5" class="loading-row">Nenhum usuário.</td></tr>' :
      snap.docs.map(d => {
        const u = d.data();
        return `<tr>
          <td><strong>${u.nome||'—'}</strong></td>
          <td>${u.email||'—'}</td>
          <td><span class="badge badge-ativa">${u.perfil||'usuario'}</span></td>
          <td>${fmtDate(u.criadoEm)}</td>
          <td><button class="btn-danger btn-sm" onclick="toggleUserStatus('${d.id}','${u.status}')">
            ${u.status === 'bloqueado' ? '🔓 Desbloquear' : '🔒 Bloquear'}
          </button></td>
        </tr>`;
      }).join('');
  } catch(e) { toast('Erro ao carregar usuários.','error'); }
}
window.toggleUserStatus = async function(id, current) {
  const { doc, updateDoc } = fb();
  const newStatus = current === 'bloqueado' ? 'ativo' : 'bloqueado';
  try { await updateDoc(doc(db(), 'usuarios', id), { status: newStatus }); toast(`Usuário ${newStatus}.`,'success'); loadUsuarios(); }
  catch(e) { toast('Erro.','error'); }
};

// ══════════════════════════════════════════════════
// CONFIGURAÇÕES
// ══════════════════════════════════════════════════
async function loadConfiguracoes() {
  const { doc, getDoc } = fb();
  try {
    const snap = await getDoc(doc(db(), 'configuracoes', 'geral'));
    if (snap.exists()) {
      const c = snap.data();
      document.getElementById('cfg-nome').value = c.nome || '';
      document.getElementById('cfg-logo').value = c.logo || '';
      document.getElementById('cfg-cor').value = c.cor || '#6366f1';
      document.getElementById('cfg-cor-hex').textContent = c.cor || '#6366f1';
      document.getElementById('cfg-whatsapp').value = c.whatsapp || '';
      document.getElementById('cfg-instagram').value = c.instagram || '';
      document.getElementById('cfg-facebook').value = c.facebook || '';
      document.getElementById('cfg-banner').value = c.bannerUrl || '';
      document.getElementById('cfg-banner-texto').value = c.bannerTexto || '';
      document.getElementById('cfg-banner-link').value = c.bannerLink || '';
    }
  } catch(e) { toast('Erro ao carregar configurações.','error'); }
}
document.getElementById('cfg-cor')?.addEventListener('input', function() {
  document.getElementById('cfg-cor-hex').textContent = this.value;
});
window.saveConfiguracoes = async function() {
  const { doc, setDoc, serverTimestamp } = fb();
  try {
    await setDoc(doc(db(), 'configuracoes', 'geral'), {
      nome: document.getElementById('cfg-nome').value,
      logo: document.getElementById('cfg-logo').value,
      cor: document.getElementById('cfg-cor').value,
      whatsapp: document.getElementById('cfg-whatsapp').value,
      instagram: document.getElementById('cfg-instagram').value,
      facebook: document.getElementById('cfg-facebook').value,
      bannerUrl: document.getElementById('cfg-banner').value,
      bannerTexto: document.getElementById('cfg-banner-texto').value,
      bannerLink: document.getElementById('cfg-banner-link').value,
      atualizadoEm: serverTimestamp()
    });
    toast('Configurações salvas!','success');
  } catch(e) { toast('Erro ao salvar configurações.','error'); }
};

console.log('[Achei Fácil Admin] Panel loaded.');
/* ══════════════════════════════════════════
   ADMIN — PROMOÇÕES, CLASSIFICADOS, IA, FIREBASE
══════════════════════════════════════════ */

/* ─── PROMOÇÕES ADMIN ─── */
let _allPromocoes = [];
window.loadPromocoesAdmin = async function() {
  const { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'promocoes'), orderBy('createdAt', 'desc')));
    _allPromocoes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPromocoesAdmin(_allPromocoes);
  } catch(e) {
    document.getElementById('tb-promocoes-admin').innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">Nenhuma promoção encontrada.</td></tr>';
  }
};

function renderPromocoesAdmin(list) {
  const tb = document.getElementById('tb-promocoes-admin');
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">Nenhuma promoção cadastrada.</td></tr>';
    return;
  }
  tb.innerHTML = list.map(p => {
    const validade = p.validade ? new Date(p.validade+'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const badge = p.status === 'ativa'
      ? '<span style="color:#059669;font-weight:700">● Ativa</span>'
      : '<span style="color:#DC2626;font-weight:700">● Inativa</span>';
    const foto = p.foto ? `<img src="${p.foto}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:8px;">` : '';
    return `<tr>
      <td>${foto}${p.titulo}</td>
      <td>${p.empresaNome || '—'}</td>
      <td>R$ ${parseFloat(p.valOriginal||0).toFixed(2).replace('.',',')}</td>
      <td style="color:var(--primary);font-weight:700">R$ ${parseFloat(p.valPromo||0).toFixed(2).replace('.',',')}</td>
      <td>${validade}</td>
      <td>${badge}</td>
      <td>
        <button class="btn-ghost btn-sm" onclick="togglePromocaoStatus('${p.id}','${p.status}')">
          ${p.status === 'ativa' ? '⏸ Desativar' : '▶ Ativar'}
        </button>
        <button class="btn-danger btn-sm" onclick="deletePromocaoAdmin('${p.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

window.togglePromocaoStatus = async function(id, currentStatus) {
  const { doc, updateDoc } = fb();
  const newStatus = currentStatus === 'ativa' ? 'inativa' : 'ativa';
  try {
    await updateDoc(doc(db(), 'promocoes', id), { status: newStatus });
    toast(`Promoção ${newStatus === 'ativa' ? 'ativada' : 'desativada'}!`, 'success');
    loadPromocoesAdmin();
  } catch(e) { toast('Erro ao atualizar status', 'error'); }
};

window.deletePromocaoAdmin = async function(id) {
  if (!confirm('Excluir esta promoção?')) return;
  const { doc, deleteDoc } = fb();
  try {
    await deleteDoc(doc(db(), 'promocoes', id));
    toast('Promoção excluída', 'info');
    loadPromocoesAdmin();
  } catch(e) { toast('Erro ao excluir', 'error'); }
};

/* ─── CLASSIFICADOS ADMIN ─── */
let _allClassificados = [];
let _currentCatFilter = 'todos';

window.loadClassificadosAdmin = async function() {
  const { collection, getDocs, query, orderBy } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'classificados'), orderBy('createdAt', 'desc')));
    _allClassificados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderClassificadosAdmin(_allClassificados);
  } catch(e) {
    document.getElementById('tb-classificados-admin').innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">Nenhum classificado encontrado.</td></tr>';
  }
};

window.filterClassificados = function(cat, btn) {
  _currentCatFilter = cat;
  document.querySelectorAll('.admin-cat-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = cat === 'todos' ? _allClassificados : _allClassificados.filter(c => c.categoria === cat);
  renderClassificadosAdmin(filtered);
};

function renderClassificadosAdmin(list) {
  const tb = document.getElementById('tb-classificados-admin');
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">Nenhum anúncio encontrado.</td></tr>';
    return;
  }
  tb.innerHTML = list.map(c => {
    const badge = c.status === 'ativo'
      ? '<span style="color:#059669;font-weight:700">● Ativo</span>'
      : '<span style="color:#DC2626;font-weight:700">● Inativo</span>';
    const foto = c.fotos?.[0] ? `<img src="${c.fotos[0]}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:8px;">` : '';
    const data = c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('pt-BR') : '—';
    const valor = c.valor > 0 ? `R$ ${parseFloat(c.valor).toFixed(2).replace('.',',')}` : 'A combinar';
    return `<tr>
      <td>${foto}${c.titulo}</td>
      <td>${c.categoriaLabel || c.categoria}</td>
      <td>${valor}</td>
      <td>${c.whatsapp || '—'}</td>
      <td>${badge}</td>
      <td>${data}</td>
      <td>
        <button class="btn-ghost btn-sm" onclick="toggleClassificadoStatus('${c.id}','${c.status}')">
          ${c.status === 'ativo' ? '⏸ Suspender' : '▶ Reativar'}
        </button>
        <button class="btn-danger btn-sm" onclick="deleteClassificadoAdmin('${c.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

window.toggleClassificadoStatus = async function(id, currentStatus) {
  const { doc, updateDoc } = fb();
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
  try {
    await updateDoc(doc(db(), 'classificados', id), { status: newStatus });
    toast(`Classificado ${newStatus === 'ativo' ? 'reativado' : 'suspenso'}!`, 'success');
    loadClassificadosAdmin();
  } catch(e) { toast('Erro ao atualizar status', 'error'); }
};

window.deleteClassificadoAdmin = async function(id) {
  if (!confirm('Excluir este classificado?')) return;
  const { doc, deleteDoc } = fb();
  try {
    await deleteDoc(doc(db(), 'classificados', id));
    toast('Classificado excluído', 'info');
    loadClassificadosAdmin();
  } catch(e) { toast('Erro ao excluir', 'error'); }
};

/* ─── CONFIG IA ─── */
window.loadIAConfig = async function() {
  const { doc, getDoc } = fb();
  try {
    const snap = await getDoc(doc(db(), 'configuracoes', 'ia'));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById('ia-status').checked = d.ativo || false;
      document.getElementById('ia-status-label').textContent = d.ativo ? 'Ativada' : 'Desativada';
      document.getElementById('ia-provider').value = d.provider || 'groq';
      document.getElementById('ia-model').value = d.model || 'llama3-8b-8192';
      document.getElementById('ia-apikey').value = d.apiKey || '';
      document.getElementById('ia-prompt-base').value = d.promptBase || '';
    }
  } catch(e) { toast('Erro ao carregar config da IA', 'error'); }
};

document.getElementById && document.getElementById('ia-status')?.addEventListener('change', function() {
  document.getElementById('ia-status-label').textContent = this.checked ? 'Ativada' : 'Desativada';
});

window.toggleApiKey = function() {
  const input = document.getElementById('ia-apikey');
  input.type = input.type === 'password' ? 'text' : 'password';
};

window.saveIAConfig = async function() {
  const { doc, setDoc, serverTimestamp } = fb();
  const apiKey = document.getElementById('ia-apikey').value.trim();
  if (!apiKey) { toast('Informe a API Key da Groq', 'error'); return; }
  try {
    await setDoc(doc(db(), 'configuracoes', 'ia'), {
      ativo: document.getElementById('ia-status').checked,
      provider: document.getElementById('ia-provider').value,
      model: document.getElementById('ia-model').value,
      apiKey,  // stored only in Firestore, never sent to public frontend
      promptBase: document.getElementById('ia-prompt-base').value,
      atualizadoEm: serverTimestamp()
    });
    toast('Configurações da IA salvas! ✅', 'success');
  } catch(e) { toast('Erro ao salvar config da IA', 'error'); }
};

/* ─── CONFIG FIREBASE ─── */
window.loadFirebaseConfig = async function() {
  const { doc, getDoc } = fb();
  try {
    const snap = await getDoc(doc(db(), 'configuracoes', 'firebase'));
    if (snap.exists()) {
      const d = snap.data();
      ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'].forEach(k => {
        const el = document.getElementById('fb-' + k);
        if (el) el.value = d[k] || '';
      });
    }
  } catch(e) { toast('Erro ao carregar config do Firebase', 'error'); }
};
window.saveFirebaseConfig = async function() {
  const { doc, setDoc, serverTimestamp } = fb();

  const data = {
    apiKey: document.getElementById('fb-apiKey').value.trim(),
    authDomain: document.getElementById('fb-authDomain').value.trim(),
    projectId: document.getElementById('fb-projectId').value.trim(),
    storageBucket: document.getElementById('fb-storageBucket').value.trim(),
    messagingSenderId: document.getElementById('fb-messagingSenderId').value.trim(),
    appId: document.getElementById('fb-appId').value.trim(),
    measurementId: document.getElementById('fb-measurementId').value.trim(),
    atualizadoEm: serverTimestamp()
  };

  await setDoc(doc(db(), 'configuracoes', 'firebase'), data, { merge: true });

  toast('Configurações do Firebase salvas!', 'success');
};
window.saveFirebaseConfig = async function() {
  const { doc, setDoc, serverTimestamp } = fb();
  try {
    const data = {};
    ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'].forEach(k => {
      data[k] = document.getElementById('fb-' + k)?.value?.trim() || '';
    });
    data.atualizadoEm = serverTimestamp();
    await setDoc(doc(db(), 'configuracoes', 'firebase'), data);
    toast('Configurações do Firebase salvas! ✅', 'success');
  } catch(e) { toast('Erro ao salvar config do Firebase', 'error'); }
};

// Init ia-status toggle listener after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ia-status')?.addEventListener('change', function() {
    document.getElementById('ia-status-label').textContent = this.checked ? 'Ativada' : 'Desativada';
  });
});

// ─── VINCULAR ACESSO EMPRESA ───────────────────

window.openVincularModal = function(empresaId, empresaNome, currentEmail) {
  document.getElementById('vincular-empresa-id').value = empresaId;
  document.getElementById('vincular-empresa-nome').textContent = empresaNome;
  document.getElementById('vincular-email').value = currentEmail || '';
  document.getElementById('vincular-error').textContent = '';
  document.getElementById('vincular-error').style.display = 'none';
  openModal('modal-vincular');
};

window.salvarVincular = async function() {
  const { doc, updateDoc, collection, getDocs, query, where } = fb();
  const empresaId = document.getElementById('vincular-empresa-id').value;
  const email = document.getElementById('vincular-email').value.trim().toLowerCase();
  const errEl = document.getElementById('vincular-error');

  if (!email) { errEl.textContent = 'Informe o e-mail.'; errEl.style.display='block'; return; }

  const btn = document.getElementById('btn-vincular-salvar');
  btn.disabled = true; btn.textContent = '⏳ Buscando...';

  try {
    // Find user by email in /usuarios collection
    let uid = null;
    const usrSnap = await getDocs(query(collection(db(), 'usuarios'), where('email', '==', email)));
    if (!usrSnap.empty) {
      uid = usrSnap.docs[0].id;
    }

    // If not found in /usuarios, try /users
    if (!uid) {
      const usrSnap2 = await getDocs(query(collection(db(), 'users'), where('email', '==', email)));
      if (!usrSnap2.empty) uid = usrSnap2.docs[0].id;
    }

    if (!uid) {
      // Save email anyway so admin can see it, but warn no UID found
      await updateDoc(doc(db(), 'empresas', empresaId), { ownerEmail: email });
      errEl.style.color = '#D89B2E';
      errEl.textContent = '⚠️ E-mail salvo, mas usuário não encontrado no banco. Peça para ele se cadastrar no app primeiro.';
      errEl.style.display = 'block';
      loadEmpresas();
      btn.disabled = false; btn.textContent = 'Vincular';
      return;
    }

    await updateDoc(doc(db(), 'empresas', empresaId), {
      ownerUid: uid,
      ownerEmail: email,
    });

    toast('Acesso vinculado com sucesso! ✅', 'success');
    closeAllModals();
    loadEmpresas();
  } catch(e) {
    console.error(e);
    errEl.style.color = '#DC2626';
    errEl.textContent = 'Erro ao vincular. Tente novamente.';
    errEl.style.display = 'block';
  }
  btn.disabled = false; btn.textContent = 'Vincular';
};

window.removerVincular = async function() {
  const { doc, updateDoc } = fb();
  const empresaId = document.getElementById('vincular-empresa-id').value;
  if (!confirm('Remover o acesso desta empresa?')) return;
  try {
    await updateDoc(doc(db(), 'empresas', empresaId), { ownerUid: null, ownerEmail: '' });
    toast('Acesso removido.', 'info');
    closeAllModals();
    loadEmpresas();
  } catch(e) { toast('Erro ao remover acesso.', 'error'); }
};

// ─── AVALIAÇÕES ADMIN ──────────────────────────
window.PAGE_LOADERS['avaliacoes'] = () => loadAvaliacoesAdmin();
PAGE_LABELS['avaliacoes'] = 'Avaliações';

window.loadAvaliacoesAdmin = async function() {
  const container = document.getElementById('avaliacoes-list');
  if (!container) return;
  container.innerHTML = '<p style="color:#6B7280;padding:16px">Carregando avaliações...</p>';

  const { collection, getDocs, query, orderBy } = fb();
  try {
    const snap = await getDocs(query(collection(db(), 'ratings'), orderBy('createdAt', 'desc')));
    const ratings = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!ratings.length) {
      container.innerHTML = '<p style="color:#6B7280;padding:16px;text-align:center">Nenhuma avaliação encontrada.</p>';
      return;
    }

    // Group by company
    const byCompany = {};
    ratings.forEach(r => {
      if (!byCompany[r.companyId]) byCompany[r.companyId] = [];
      byCompany[r.companyId].push(r);
    });

    container.innerHTML = ratings.map(r => {
      const date = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('pt-BR') : '—';
      const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));
      return `<div style="display:flex;align-items:flex-start;gap:14px;padding:14px 16px;border-bottom:1px solid var(--border);flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
            <strong style="font-size:14px">${r.userName || 'Usuário'}</strong>
            <span style="color:#D89B2E;font-size:15px;letter-spacing:1px">${stars}</span>
            <span style="font-size:12px;color:#9CA3AF">${date}</span>
          </div>
          <p style="font-size:12px;color:#6B7280;margin:0 0 2px">Empresa ID: <code style="background:var(--bg3);color:var(--text-muted);padding:2px 6px;border-radius:4px;font-size:11px">${r.companyId || '—'}</code></p>
          ${r.comment ? `<p style="font-size:13px;color:var(--text);margin-top:6px;background:var(--bg3);padding:8px 12px;border-radius:8px;border-left:3px solid var(--border3)">${r.comment}</p>` : '<p style="font-size:12px;color:#9CA3AF;margin-top:4px;font-style:italic">Sem comentário</p>'}
        </div>
        <button onclick="deleteAvaliacao('${r.id}','${r.companyId}')"
          class="btn-danger btn-sm" style="flex-shrink:0">
          Apagar
        </button>
      </div>`;
    }).join('');

  } catch(e) {
    console.error(e);
    container.innerHTML = '<p style="color:#DC2626;padding:16px">Erro ao carregar avaliações. Verifique se o índice do Firestore está criado.</p>';
  }
};

window.deleteAvaliacao = async function(ratingId, companyId) {
  const { doc, deleteDoc, getDocs, query, collection, where, updateDoc } = fb();
  if (!window.confirm('Apagar esta avaliação?')) return;
  try {
    await deleteDoc(doc(db(), 'ratings', ratingId));

    // Recalculate company average after deletion
    if (companyId) {
      try {
        const snap = await getDocs(query(collection(db(), 'ratings'), where('companyId', '==', companyId)));
        const remaining = snap.docs.map(d => d.data().rating || 0);
        const newAvg = remaining.length ? remaining.reduce((s, r) => s + r, 0) / remaining.length : 0;
        await updateDoc(doc(db(), 'empresas', companyId), { rating: newAvg, totalRatings: remaining.length });
      } catch(e) { /* ignore recalc errors */ }
    }

    toast('Avaliação apagada!', 'success');
    loadAvaliacoesAdmin();
  } catch(e) {
    toast('Erro ao apagar avaliação', 'error');
    console.error(e);
  }
};

// ══════════════════════════════════════════════════
// PEDIDOS (coleção "pedidos", gravada pelo sacola.js)
// ══════════════════════════════════════════════════
let _pedidosCache = null;
let _pedidosDias = 30;

window.setPeriodoPedidos = function (dias) {
  _pedidosDias = dias;
  document.querySelectorAll('#pedidos-periodo button').forEach(b => b.classList.toggle('active', Number(b.dataset.dias) === dias));
  renderPedidos();
};

window.loadPedidos = async function (forcar) {
  const { collection, getDocs, query, orderBy, limit } = fb();
  if (_pedidosCache && !forcar) return renderPedidos();
  const tb = document.getElementById('tbody-pedidos');
  if (tb) tb.innerHTML = '<tr><td colspan="6" class="loading-row">Carregando...</td></tr>';
  try {
    const snap = await getDocs(query(collection(db(), 'pedidos'), orderBy('criadoEm', 'desc'), limit(2000)));
    _pedidosCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
    _pedidosCache = [];
    toast('Não foi possível ler os pedidos. Confira as regras do Firestore para a coleção "pedidos".', 'error', 6000);
  }
  renderPedidos();
};

function renderPedidos() {
  const lista = _pedidosCache || [];
  const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dataDe = p => p.criadoEm?.toDate ? p.criadoEm.toDate() : (p.criadoEm ? new Date(p.criadoEm) : null);

  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  let inicio = null;
  if (_pedidosDias === 1) inicio = inicioHoje;
  else if (_pedidosDias > 0) inicio = new Date(inicioHoje.getTime() - (_pedidosDias - 1) * 86400000);

  const periodo = lista.filter(p => { const d = dataDe(p); return !inicio || (d && d >= inicio); });
  const pedidos = periodo.filter(p => p.tipo !== 'orcamento');
  const orcamentos = periodo.filter(p => p.tipo === 'orcamento');
  const valor = pedidos.reduce((t, p) => t + (Number(p.total) || 0), 0);
  const clientes = new Set(periodo.map(p => p.clienteUid).filter(Boolean));
  const hoje = lista.filter(p => { const d = dataDe(p); return d && d >= inicioHoje; }).length;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('stat-ped-pedidos', pedidos.length.toLocaleString('pt-BR'));
  set('stat-ped-orcamentos', orcamentos.length.toLocaleString('pt-BR'));
  set('stat-ped-valor', brl(valor));
  set('stat-ped-ticket', pedidos.length ? brl(valor / pedidos.length) : '—');
  set('stat-ped-clientes', clientes.size.toLocaleString('pt-BR'));
  set('stat-ped-hoje', hoje.toLocaleString('pt-BR'));
  set('pedidos-periodo-label', _pedidosDias === 0 ? `${lista.length} registros no total` :
    `Desde ${inicio.toLocaleDateString('pt-BR')}`);

  // Por loja
  const porLoja = {};
  periodo.forEach(p => {
    const k = p.lojaNome || '—';
    porLoja[k] = porLoja[k] || { pedidos: 0, orcamentos: 0, valor: 0 };
    if (p.tipo === 'orcamento') porLoja[k].orcamentos++;
    else { porLoja[k].pedidos++; porLoja[k].valor += Number(p.total) || 0; }
  });
  const lojas = Object.entries(porLoja).sort((a, b) => (b[1].pedidos + b[1].orcamentos) - (a[1].pedidos + a[1].orcamentos));
  const tbL = document.getElementById('tbody-pedidos-lojas');
  if (tbL) tbL.innerHTML = lojas.length ? lojas.map(([nome, l]) =>
    `<tr><td>${esc(nome)}</td><td class="num">${l.pedidos}</td><td class="num">${l.orcamentos}</td><td class="num">${brl(l.valor)}</td></tr>`).join('')
    : '<tr><td colspan="4" class="loading-row">Nenhum pedido no período.</td></tr>';

  // Lista
  const tb = document.getElementById('tbody-pedidos');
  if (tb) tb.innerHTML = periodo.length ? periodo.slice(0, 300).map(p => {
    const d = dataDe(p);
    const quando = d ? `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '—';
    const itens = (p.itens || []).map(i => `${i.qtd}× ${esc(i.nome)}`).join(', ');
    const cliente = esc(p.clienteNome || p.clienteConta || p.clienteEmail || '—');
    return `<tr>
      <td>${quando}</td>
      <td>${cliente}${p.clienteEmail ? `<br><small style="color:#6B7287">${esc(p.clienteEmail)}</small>` : ''}</td>
      <td>${esc(p.lojaNome || '—')}</td>
      <td style="max-width:260px">${itens || '—'}</td>
      <td class="num">${p.total ? brl(p.total) : '—'}</td>
      <td>${p.tipo === 'orcamento' ? '<span class="badge badge-pendente">orçamento</span>' : `<span class="badge badge-ativa">${p.modo === 'retirada' ? 'retirada' : 'entrega'}</span>`}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="6" class="loading-row">Nenhum pedido no período.</td></tr>';
}
