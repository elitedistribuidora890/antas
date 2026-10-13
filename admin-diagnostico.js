/* ═══════════════════════════════════════════════
   DIAGNÓSTICO DO BANCO — Antas Digital (admin)
   1) Testa a leitura de cada coleção que o app e o painel usam
      e explica cada erro em português.
   2) Guarda os erros que acontecem enquanto o painel está aberto
      (permissão negada, índice faltando, falha de rede…).
   Só lê dados: não grava nem apaga nada.
═══════════════════════════════════════════════ */

(function () {
  // Coleções testadas: [nome que aparece, coleção, documento (quando a regra é por documento)]
  const CHECKS = [
    ['Empresas', 'empresas'],
    ['Cardápio e catálogo', 'catalogo'],
    ['Promoções', 'promocoes'],
    ['Notícias', 'noticias'],
    ['Eventos', 'eventos'],
    ['Categorias', 'categorias'],
    ['Avaliações', 'ratings'],
    ['Acessos do site', 'acessos_site'],
    ['Pedidos de cadastro', 'solicitacoes_empresas'],
    ['Usuários', 'usuarios'],
    ['Favoritos', 'favoritos'],
    ['Utilidades', 'utilidades'],
    ['Patrocinados', 'patrocinados'],
    ['Cupons', 'cupons'],
    ['Classificados', 'classificados'],
    ['Vagas', 'vagas'],
    ['Admins', 'admins'],
    ['Configurações gerais', 'configuracoes', 'geral'],
    ['Configurações da IA', 'configuracoes', 'ia'],
  ];

  const EXPLICA = {
    'permission-denied': 'As regras do Firestore bloqueiam esta leitura. Se alguma tela usa esta coleção, libere em Firebase → Firestore → Regras.',
    'failed-precondition': 'Falta um índice no Firestore. Abra o console do navegador: o erro traz um link que cria o índice.',
    'unavailable': 'Sem conexão com o Firebase no momento (internet ou instabilidade).',
    'unauthenticated': 'O login expirou. Saia e entre de novo no painel.',
    'resource-exhausted': 'Limite de uso do plano do Firebase atingido.',
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ─── Registro de erros da sessão ───
  const log = [];
  function registrar(origem, err) {
    const code = err?.code || '';
    const msg = (err?.message || String(err ?? '')).slice(0, 300);
    if (!code && !/firebase|firestore|permission|index/i.test(msg)) return; // só erros do banco
    log.unshift({ quando: new Date(), tela: document.querySelector('.nav-item.active .nav-label')?.textContent || '—', origem, code, msg });
    if (log.length > 50) log.pop();
    const badge = document.getElementById('badge-diagnostico');
    if (badge) badge.textContent = log.length;
    renderLog();
  }
  const errOriginal = console.error;
  console.error = function (...args) {
    args.forEach(a => (a instanceof Error || a?.code) && registrar('console', a));
    return errOriginal.apply(this, args);
  };
  window.addEventListener('unhandledrejection', e => registrar('promessa', e.reason));

  function renderLog() {
    const el = document.getElementById('diag-log');
    if (!el) return;
    el.innerHTML = log.length ? log.map(l => `
      <div class="diag-log-item">
        <span class="diag-log-time">${l.quando.toLocaleTimeString('pt-BR')}</span>
        <span class="diag-pill diag-pill--erro">${esc(l.code || 'erro')}</span>
        <span class="diag-log-tela">${esc(l.tela)}</span>
        <p>${esc(EXPLICA[l.code] || l.msg)}</p>
      </div>`).join('') : '<p class="empty-state" style="padding:1.5rem">Nenhum erro até agora.</p>';
  }

  // ─── Teste das coleções ───
  window.rodarDiagnostico = async function () {
    const { db, collection, doc, getDoc, getDocs, query, limit } = window._fb;
    const body = document.getElementById('diag-body');
    body.innerHTML = '<tr><td colspan="4" class="loading-row">Testando...</td></tr>';
    const linhas = await Promise.all(CHECKS.map(async ([nome, col, docId]) => {
      const t0 = performance.now();
      try {
        const vazio = docId
          ? !(await getDoc(doc(db, col, docId))).exists()
          : (await getDocs(query(collection(db, col), limit(1)))).empty;
        const ms = Math.round(performance.now() - t0);
        return { nome, col: docId ? `${col}/${docId}` : col, ok: true, vazio, ms };
      } catch (e) {
        return { nome, col: docId ? `${col}/${docId}` : col, ok: false, code: e.code || 'erro', msg: e.message };
      }
    }));

    const erros = linhas.filter(l => !l.ok).length;
    const vazias = linhas.filter(l => l.ok && l.vazio).length;
    document.getElementById('diag-resumo').innerHTML = `
      <div class="diag-box ${erros ? 'is-bad' : 'is-good'}"><strong>${erros}</strong><span>${erros === 1 ? 'coleção com erro' : 'coleções com erro'}</span></div>
      <div class="diag-box"><strong>${linhas.length - erros}</strong><span>funcionando</span></div>
      <div class="diag-box"><strong>${vazias}</strong><span>${vazias === 1 ? 'vazia' : 'vazias'}</span></div>`;

    body.innerHTML = linhas.map(l => `<tr>
      <td><strong>${esc(l.nome)}</strong></td>
      <td><code>${esc(l.col)}</code></td>
      <td>${l.ok
        ? `<span class="diag-pill diag-pill--ok">OK</span>${l.vazio ? ' <span class="diag-pill">vazia</span>' : ''}`
        : `<span class="diag-pill diag-pill--erro">${esc(l.code)}</span>`}</td>
      <td class="diag-msg">${l.ok ? (l.vazio ? 'Funciona, mas ainda não tem nenhum registro.' : `Funciona (${l.ms} ms).`) : esc(EXPLICA[l.code] || l.msg)}</td>
    </tr>`).join('');
  };

  if (typeof PAGE_LABELS !== 'undefined') PAGE_LABELS['diagnostico'] = 'Diagnóstico do banco';
  window.PAGE_LOADERS = window.PAGE_LOADERS || {};
  window.PAGE_LOADERS['diagnostico'] = () => { renderLog(); window.rodarDiagnostico(); };
})();
