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

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

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
  dashboard:'Dashboard', empresas:'Gerenciar Empresas', aprovacoes:'Aprovações Pendentes',
  noticias:'Notícias', eventos:'Eventos', utilidades:'Utilidades Públicas',
  categorias:'Categorias', cupons:'Cupons', patrocinados:'Patrocinados',
  usuarios:'Usuários', configuracoes:'Configurações',
  'promocoes-admin':'Promoções da Cidade', 'classificados-admin':'Classificados',
  'config-ia':'Configurações da IA', 'config-firebase':'Configurações do Firebase'
};
window.PAGE_LOADERS = {
  dashboard: () => loadDashboard(),
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

    // Visualizations & clicks (aggregated)
    const visDocs = await getDocs(collection(db(), 'visualizacoes'));
    const wpDocs  = await getDocs(collection(db(), 'cliques_whatsapp'));
    document.getElementById('stat-visualizacoes').textContent = visDocs.size;
    document.getElementById('stat-whatsapp').textContent = wpDocs.size;

    // Pending badge
   const pendDocs = await getDocs(query(collection(db(), 'solicitacoes_empresas'), where('status','==','pendente')));

const badgePendentes = document.getElementById('badge-pendentes');
badgePendentes.textContent = pendDocs.size || '';

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
function renderCharts(empDocs) {
  // Views Chart (fake 7-day data — replace with real aggregation)
  const ctx1 = document.getElementById('chart-views');
  if (!ctx1) return;
  if (chartViews) chartViews.destroy();
  const days = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  chartViews = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Visualizações',
        data: days.map(() => Math.floor(Math.random()*80+20)),
        borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.1)',
        tension: .4, fill: true, pointRadius: 4, pointBackgroundColor: '#6366f1'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8892a4' } },
        y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8892a4' } }
      }
    }
  });

  // Category donut
  const catMap = {};
  empDocs.forEach(d => { const c = d.data().categoria || 'Outros'; catMap[c] = (catMap[c]||0)+1; });
  const labels = Object.keys(catMap);
  const vals = labels.map(l => catMap[l]);
  const colors = ['#6366f1','#10b981','#f59e0b','#ec4899','#3b82f6','#8b5cf6'];
  const ctx2 = document.getElementById('chart-cats');
  if (chartCats) chartCats.destroy();
  chartCats = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels, datasets: [{ data: vals, backgroundColor: colors, borderWidth: 0 }]
    },
    options: {
      responsive: true, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { color: '#8892a4', padding: 8, font: { size: 11 } } } }
    }
  });
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
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><span>🏢</span>Nenhuma empresa.</td></tr>'; return; }
  tbody.innerHTML = list.map(e => `
    <tr>
      <td>${e.logoUrl ? `<img src="${e.logoUrl}" class="table-logo" />` : `<div class="table-logo-placeholder">🏢</div>`}</td>
      <td><strong>${e.nome||'—'}</strong></td>
      <td>${e.categoria||'—'}</td>
      <td>${e.telefone||'—'}</td>
      <td>${badge(e.status||'pendente')}</td>
      <td><div class="actions-cell">
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
            const msg = encodeURIComponent(`Olá ${e.usuarioNome || ''}! Recebemos sua solicitação para divulgar "${e.nome || 'seu negócio'}" no Antas Digital.`);
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
              ${wpLink ? `<a href="${wpLink}?text=${encodeURIComponent(`Olá! Somos do Antas Digital e gostaríamos de confirmar seu cadastro de "${e.nome}".`)}" target="_blank" class="btn-whatsapp-inline">
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
    const snap = await getDocs(query(collection(db(), 'utilidades_publicas'), orderBy('nome')));
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
    if (id) { await updateDoc(doc(db(), 'utilidades_publicas', id), data); toast('Atualizado!','success'); }
    else { data.criadoEm = serverTimestamp(); await addDoc(collection(db(), 'utilidades_publicas'), data); toast('Criado!','success'); }
    closeAllModals(); loadUtilidades();
  } catch(e) { toast('Erro.','error'); }
};
window.deleteUtilidade = function(id) {
  const { doc, deleteDoc } = fb();
  confirm('Excluir esta utilidade?', async () => {
    try { await deleteDoc(doc(db(), 'utilidades_publicas', id)); toast('Excluído.','success'); loadUtilidades(); }
    catch(e) { toast('Erro.','error'); }
  });
};

// ══════════════════════════════════════════════════
// CATEGORIAS
// ══════════════════════════════════════════════════

const DEFAULT_CATEGORIES = [
  { nome: 'Alimentação',           icone: '🍽️', cor: '#F59E0B' },
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
  { nome: 'Esporte e Lazer',       icone: '⚽', cor: '#2563EB' },
  { nome: 'Contabilidade e Finanças', icone: '💰', cor: '#059669' },
  { nome: 'Advocacia e Jurídico',  icone: '⚖️', cor: '#7C3AED' },
  { nome: 'Religião e Igrejas',    icone: '⛪', cor: '#9CA3AF' },
  { nome: 'Eventos e Festas',      icone: '🎉', cor: '#F59E0B' },
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
    <div class="categoria-item" style="border-top:3px solid ${c.cor||'#2563EB'}">
      <div class="cat-icon">${c.icone||'🏷️'}</div>
      <div class="cat-name">${c.nome}</div>
      <div class="cat-cor-dot" style="width:14px;height:14px;border-radius:50%;background:${c.cor||'#2563EB'};margin:0 auto 8px;"></div>
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
  document.getElementById('categoria-cor').value = '#2563EB';
  document.getElementById('cat-cor-hex').textContent = '#2563EB';
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
    const snap = await getDocs(query(collection(db(), 'empresas_patrocinadas'), orderBy('inicio','desc')));
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
    await addDoc(collection(db(), 'empresas_patrocinadas'), {
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
    try { await deleteDoc(doc(db(), 'empresas_patrocinadas', id)); toast('Removido.','success'); loadPatrocinados(); }
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

console.log('[Antas Digital Admin] Panel loaded.');
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
