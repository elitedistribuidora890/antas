/* ═══════════════════════════════════════════════
   SACOLA — Achei Fácil
   Fluxo de pedido no estilo dos apps de delivery:
   toca no item → escolhe quantidade/observação → "Adicionar"
   → barra "Ver sacola" → revisa, escolhe entrega/retirada e pagamento
   → o pedido vai pronto para o WhatsApp da loja.
   A sacola fica salva no aparelho e guarda itens de uma loja por vez.
═══════════════════════════════════════════════ */

(function () {
  const KEY_SACOLA = 'antas_sacola';
  const KEY_CLIENTE = 'antas_cliente';

  const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m, t, ms) => window.showToast ? window.showToast(m, t, ms) : alert(m);

  function ler(key, padrao) {
    try { return JSON.parse(localStorage.getItem(key)) || padrao; } catch (e) { return padrao; }
  }
  function gravar(key, valor) {
    try { localStorage.setItem(key, JSON.stringify(valor)); } catch (e) {}
  }

  let sacola = ler(KEY_SACOLA, null);   // { loja: {...}, itens: [{ id, nome, preco, foto, qtd, obs }] }
  const cliente = ler(KEY_CLIENTE, { nome: '', endereco: '', referencia: '', pagamento: '', modo: 'entrega' });

  // Observação e troco do pedido atual (não ficam salvos entre pedidos)
  const rascunho = { obs: '', troco: '' };
  window.guardarRascunho = (campo, valor) => { rascunho[campo] = valor; };

  // ─── Conta obrigatória para pedir ───
  // Sem login, abre o cadastro/entrada e, depois que a pessoa entrar,
  // continua de onde parou (o index chama window._acaoAposLogin).
  function exigirLogin(acao, msg) {
    if (window.currentUser) return true;
    window._acaoAposLogin = acao;
    toast(msg || 'Crie sua conta ou entre para fazer o pedido', 'info', 4000);
    if (window.openModal) window.openModal('auth-modal');
    return false;
  }

  // Salva o pedido no Firebase (coleção "pedidos") para contar no painel admin.
  // Não segura o envio: o WhatsApp abre na hora e o registro vai em segundo plano.
  function registrarPedido(dados) {
    try {
      const u = window.currentUser;
      if (!u || !window.DB || !window.FB?.addDoc) return;
      const { collection, addDoc, serverTimestamp } = window.FB;
      addDoc(collection(window.DB, 'pedidos'), {
        ...dados,
        clienteUid: u.uid,
        clienteEmail: u.email || '',
        clienteConta: u.displayName || '',
        status: 'enviado',
        criadoEm: serverTimestamp ? serverTimestamp() : new Date(),
      }).catch(e => console.warn('Não foi possível registrar o pedido:', e));
    } catch (e) { console.warn('Não foi possível registrar o pedido:', e); }
  }

  const totalItens = () => (sacola?.itens || []).reduce((a, i) => a + i.qtd, 0);
  const subtotal = () => (sacola?.itens || []).reduce((a, i) => a + i.qtd * i.preco, 0);

  function salvar() {
    if (sacola && !sacola.itens.length) sacola = null;
    gravar(KEY_SACOLA, sacola);
    window.updateCartBar();
  }

  // Dados da loja que a sacola precisa (fica salvo junto)
  function resumoLoja(c) {
    return {
      id: c.id, nome: c.name || c.nome || '', logo: c.logo || '', categoria: c.category || c.categoria || '',
      whatsapp: c.whatsapp || '',
      fazEntrega: c.fazEntrega !== false, aceitaRetirada: c.aceitaRetirada !== false,
      taxaEntrega: typeof c.taxaEntrega === 'number' ? c.taxaEntrega : null,
      pedidoMinimo: typeof c.pedidoMinimo === 'number' ? c.pedidoMinimo : null,
      tempoEntrega: c.tempoEntrega || '',
    };
  }

  // Serviços (salão, clínica, advogado…) não vão para a sacola: viram pedido de orçamento
  function ehServico(loja) {
    const cfg = window.getCategoryContent ? window.getCategoryContent(loja.categoria) : null;
    return cfg?.tipo === 'servicos';
  }

  // ─── Folha do item ───
  let itemAtual = null, qtdAtual = 1;

  window.openItemSheet = function (item) {
    const company = window._currentCompany;
    if (!company) return;
    const loja = resumoLoja(company);
    const servico = ehServico(loja);
    const preco = Number(item.preco) || 0;
    itemAtual = { ...item, preco, loja, servico };
    qtdAtual = 1;

    document.getElementById('item-sheet-body').innerHTML = `
      ${item.foto
        ? `<div class="is-photo"><img src="${esc(item.foto)}" alt=""></div>`
        : `<div class="is-photo is-photo--empty"><i class="ti ti-${servico ? 'briefcase' : 'tools-kitchen-2'}"></i></div>`}
      <div class="is-info">
        <h3 class="is-name">${esc(item.nome)}</h3>
        ${item.desc ? `<p class="is-desc">${esc(item.desc)}</p>` : ''}
        <p class="is-price">${preco > 0 ? (servico ? `<small>a partir de</small> ${brl(preco)}` : brl(preco)) : esc(item.precoFmt || (servico ? 'Sob consulta' : 'Preço a combinar'))}</p>
        <p class="is-store"><i class="ti ti-building-store"></i> ${esc(loja.nome)}</p>
      </div>
      <label class="is-obs">
        <span>${servico ? 'Conte o que você precisa' : 'Alguma observação?'} <small id="is-obs-count">0/140</small></span>
        <textarea id="is-obs" maxlength="140" rows="2" placeholder="${servico ? 'Ex: melhor dia e horário, detalhes do serviço…' : 'Ex: sem cebola, ponto da carne, troco…'}"
          oninput="document.getElementById('is-obs-count').textContent=this.value.length+'/140'"></textarea>
      </label>
      <div class="is-bar">
        ${servico
          ? `<button class="is-add is-add--wa" onclick="solicitarServico()"><i class="ti ti-brand-whatsapp"></i> Solicitar orçamento</button>`
          : `<div class="qty">
               <button onclick="mudarQtdItem(-1)" aria-label="Diminuir"><i class="ti ti-minus"></i></button>
               <span id="is-qtd">1</span>
               <button onclick="mudarQtdItem(1)" aria-label="Aumentar"><i class="ti ti-plus"></i></button>
             </div>
             <button class="is-add" onclick="adicionarItem()"><span>Adicionar</span><strong id="is-total">${preco > 0 ? brl(preco) : ''}</strong></button>`}
      </div>`;
    openModal('item-sheet');
  };
  // Nome antigo, usado na busca e nos cartões
  window.openPurchaseModal = window.openItemSheet;

  window.mudarQtdItem = function (d) {
    qtdAtual = Math.max(1, Math.min(99, qtdAtual + d));
    document.getElementById('is-qtd').textContent = qtdAtual;
    const t = document.getElementById('is-total');
    if (t && itemAtual.preco > 0) t.textContent = brl(itemAtual.preco * qtdAtual);
  };

  window.adicionarItem = function () {
    const it = itemAtual;
    const obs = document.getElementById('is-obs').value.trim();

    // Uma loja por vez, como nos apps de delivery
    if (sacola && sacola.loja.id !== it.loja.id) {
      if (!confirm(`Sua sacola tem itens de ${sacola.loja.nome}. Quer limpar a sacola e adicionar este item de ${it.loja.nome}?`)) return;
      sacola = null;
    }
    if (!sacola) sacola = { loja: it.loja, itens: [] };
    sacola.loja = it.loja; // dados mais recentes da loja

    // Mesmo item com a mesma observação soma a quantidade
    const id = it.id || it.nome;
    const igual = sacola.itens.find(i => i.id === id && i.obs === obs);
    if (igual) igual.qtd = Math.min(99, igual.qtd + qtdAtual);
    else sacola.itens.push({ id, nome: it.nome, preco: it.preco, foto: it.foto || '', qtd: qtdAtual, obs });

    salvar();
    closeModal('item-sheet');
    toast(`${qtdAtual}× ${it.nome} na sacola`, 'success', 2200);
  };

  window.solicitarServico = function () {
    const it = itemAtual;
    const obs = document.getElementById('is-obs').value.trim();
    if (!exigirLogin(null, 'Crie sua conta ou entre para pedir orçamento')) return;
    const msg = `Olá! Vi no *Achei Fácil* e gostaria de um orçamento:\n\n`
      + `*Serviço:* ${it.nome}${it.preco > 0 ? ` (a partir de ${brl(it.preco)})` : ''}\n`
      + (obs ? `*Detalhes:* ${obs}\n` : '');
    closeModal('item-sheet');
    if (enviarWhatsApp(it.loja, msg)) {
      registrarPedido({
        tipo: 'orcamento', lojaId: it.loja.id || '', lojaNome: it.loja.nome || '', lojaCategoria: it.loja.categoria || '',
        itens: [{ nome: it.nome, qtd: 1, preco: it.preco || 0, obs }], qtdItens: 1,
        subtotal: it.preco || 0, taxaEntrega: 0, total: it.preco || 0,
      });
    }
  };

  // ─── Barra "Ver sacola" ───
  window.updateCartBar = function () {
    const bar = document.getElementById('cart-bar');
    if (!bar) return;
    const page = document.body.dataset.page || 'home';
    const n = totalItens();
    const mostrar = n > 0 && page !== 'sacola';
    bar.classList.toggle('hidden', !mostrar);
    document.body.classList.toggle('has-cart-bar', mostrar);
    if (!mostrar) return;
    const naLoja = page === 'company' && window._currentCompany?.id === sacola.loja.id;
    bar.innerHTML = `
      <button class="cart-bar-btn" onclick="abrirSacola()">
        <span class="cart-bar-count">${n}</span>
        <span class="cart-bar-text">
          <strong>Ver sacola</strong>
          ${naLoja ? '' : `<small>${esc(sacola.loja.nome)}</small>`}
        </span>
        <span class="cart-bar-total">${brl(subtotal())}</span>
      </button>`;
  };

  // ─── Tela da sacola ───
  window.abrirSacola = function () {
    if (!sacola) return toast('Sua sacola está vazia', 'info');
    window._sacolaVoltar = document.body.dataset.page || 'home';
    renderSacola();
    showPage('sacola');
  };

  window.voltarDaSacola = function () {
    const volta = window._sacolaVoltar;
    if (volta === 'company' && window._currentCompany) showPage('company');
    else showPage(volta && volta !== 'sacola' ? volta : 'home');
  };

  window.adicionarMaisItens = function () {
    const c = (window.getCompanyById && window.getCompanyById(sacola?.loja.id)) || window._currentCompany;
    if (c && c.id === sacola?.loja.id && window.openCompany) window.openCompany(c);
    else window.voltarDaSacola();
  };

  window.mudarQtdSacola = function (idx, d) {
    const it = sacola?.itens[idx];
    if (!it) return;
    it.qtd += d;
    if (it.qtd <= 0) sacola.itens.splice(idx, 1);
    salvar();
    if (!sacola) { showPage(window._sacolaVoltar === 'company' ? 'company' : 'home'); toast('Sacola vazia', 'info'); return; }
    renderSacola();
  };

  window.limparSacola = function () {
    if (!confirm('Tirar todos os itens da sacola?')) return;
    sacola = null;
    salvar();
    window.voltarDaSacola();
  };

  window.setModoEntrega = function (modo) {
    cliente.modo = modo;
    gravar(KEY_CLIENTE, cliente);
    renderSacola();
  };
  window.setPagamento = function (p) {
    cliente.pagamento = p;
    gravar(KEY_CLIENTE, cliente);
    renderSacola();
  };
  // Guarda o que a pessoa digita para a próxima compra
  window.guardarCliente = function (campo, valor) {
    cliente[campo] = valor;
    gravar(KEY_CLIENTE, cliente);
  };

  function taxaAtual() {
    if (cliente.modo !== 'entrega') return 0;
    return sacola.loja.taxaEntrega; // null = a combinar
  }

  function renderSacola() {
    const el = document.getElementById('sacola-body');
    if (!el || !sacola) return;
    const loja = sacola.loja;
    // Garante um modo que a loja aceita
    if (cliente.modo === 'entrega' && !loja.fazEntrega && loja.aceitaRetirada) cliente.modo = 'retirada';
    if (cliente.modo === 'retirada' && !loja.aceitaRetirada && loja.fazEntrega) cliente.modo = 'entrega';
    if (!cliente.nome && window.currentUser) cliente.nome = window.currentUser.displayName || '';

    const sub = subtotal();
    const taxa = taxaAtual();
    const total = sub + (taxa || 0);
    const faltaMinimo = loja.pedidoMinimo && sub < loja.pedidoMinimo ? loja.pedidoMinimo - sub : 0;
    const empresa = window.getCompanyById ? window.getCompanyById(loja.id) : null;
    const fechada = empresa && window.isOpenNow ? window.isOpenNow(empresa.horarios) === false : false;
    const PAGAMENTOS = [
      { id: 'Pix', icon: 'qrcode' },
      { id: 'Dinheiro', icon: 'cash' },
      { id: 'Cartão na entrega', icon: 'credit-card' },
    ];

    el.innerHTML = `
      <div class="sc-store">
        <div class="sc-store-logo">${loja.logo ? `<img src="${esc(loja.logo)}" alt="">` : `<span>${esc(window.initialOf ? initialOf(loja.nome) : loja.nome[0])}</span>`}</div>
        <div class="sc-store-info">
          <strong>${esc(loja.nome)}</strong>
          ${loja.tempoEntrega ? `<small><i class="ti ti-clock"></i> ${esc(loja.tempoEntrega)}</small>` : ''}
        </div>
        <button class="sc-link" onclick="adicionarMaisItens()">Adicionar mais</button>
      </div>
      ${fechada ? `<p class="sc-warn sc-warn--top"><i class="ti ti-clock-pause"></i> A loja está fechada agora. Você pode enviar, mas ela só vai responder quando abrir.</p>` : ''}

      <section class="sc-card">
        <h3>Itens</h3>
        ${sacola.itens.map((it, idx) => `
          <div class="sc-item">
            ${it.foto ? `<img class="sc-item-img" src="${esc(it.foto)}" alt="">` : ''}
            <div class="sc-item-info">
              <p class="sc-item-name">${esc(it.nome)}</p>
              ${it.obs ? `<p class="sc-item-obs">${esc(it.obs)}</p>` : ''}
              <p class="sc-item-price">${it.preco > 0 ? brl(it.preco * it.qtd) : 'A combinar'}</p>
            </div>
            <div class="qty qty--sm">
              <button onclick="mudarQtdSacola(${idx},-1)" aria-label="Diminuir"><i class="ti ti-${it.qtd === 1 ? 'trash' : 'minus'}"></i></button>
              <span>${it.qtd}</span>
              <button onclick="mudarQtdSacola(${idx},1)" aria-label="Aumentar"><i class="ti ti-plus"></i></button>
            </div>
          </div>`).join('')}
      </section>

      <section class="sc-card">
        <h3>Como você quer receber?</h3>
        <div class="sc-seg">
          ${loja.fazEntrega ? `<button class="${cliente.modo === 'entrega' ? 'active' : ''}" onclick="setModoEntrega('entrega')"><i class="ti ti-motorbike"></i> Entrega</button>` : ''}
          ${loja.aceitaRetirada ? `<button class="${cliente.modo === 'retirada' ? 'active' : ''}" onclick="setModoEntrega('retirada')"><i class="ti ti-building-store"></i> Retirar no local</button>` : ''}
        </div>
        <label class="sc-field"><span>Seu nome</span>
          <input id="sc-nome" type="text" maxlength="60" value="${esc(cliente.nome)}" placeholder="Como a loja deve te chamar" oninput="guardarCliente('nome',this.value)"></label>
        ${cliente.modo === 'entrega' ? `
          <label class="sc-field"><span>Endereço de entrega</span>
            <input id="sc-endereco" type="text" maxlength="120" value="${esc(cliente.endereco)}" placeholder="Rua, número e bairro" oninput="guardarCliente('endereco',this.value)"></label>
          <label class="sc-field"><span>Ponto de referência <small>(opcional)</small></span>
            <input type="text" maxlength="80" value="${esc(cliente.referencia)}" placeholder="Ex: perto da praça" oninput="guardarCliente('referencia',this.value)"></label>`
          : `<p class="sc-hint"><i class="ti ti-info-circle"></i> Você busca o pedido na loja. A loja confirma quando estiver pronto.</p>`}
      </section>

      <section class="sc-card">
        <h3>Pagamento <small>na entrega ou retirada</small></h3>
        <div class="sc-pay">
          ${PAGAMENTOS.map(p => `<button class="${cliente.pagamento === p.id ? 'active' : ''}" onclick="setPagamento('${p.id}')"><i class="ti ti-${p.icon}"></i>${p.id}</button>`).join('')}
        </div>
        ${cliente.pagamento === 'Dinheiro' ? `
          <label class="sc-field"><span>Troco para quanto? <small>(opcional)</small></span>
            <input id="sc-troco" type="number" min="0" step="1" inputmode="decimal" placeholder="Ex: 50" value="${esc(rascunho.troco)}" oninput="guardarRascunho('troco',this.value)"></label>` : ''}
        <label class="sc-field"><span>Observação do pedido <small>(opcional)</small></span>
          <textarea id="sc-obs" rows="2" maxlength="200" placeholder="Ex: tocar a campainha, sem talheres…" oninput="guardarRascunho('obs',this.value)">${esc(rascunho.obs)}</textarea></label>
      </section>

      <section class="sc-card sc-summary">
        <div><span>Subtotal</span><span>${brl(sub)}</span></div>
        ${cliente.modo === 'entrega' ? `<div><span>Taxa de entrega</span><span>${taxa === null ? 'A combinar' : taxa === 0 ? '<b class="sc-free">Grátis</b>' : brl(taxa)}</span></div>` : ''}
        <div class="sc-total"><span>Total</span><span>${brl(total)}${taxa === null ? ' <small>+ entrega</small>' : ''}</span></div>
        ${faltaMinimo ? `<p class="sc-warn"><i class="ti ti-alert-circle"></i> Pedido mínimo de ${brl(loja.pedidoMinimo)}. Faltam ${brl(faltaMinimo)}.</p>` : ''}
      </section>
      <div id="sc-preview"></div>`;

    const logado = !!window.currentUser;
    document.getElementById('sacola-footer').innerHTML = `
      ${logado ? '' : `<p class="sc-login-hint"><i class="ti ti-user-check"></i> Para fazer o pedido, entre na sua conta. É rapidinho e só precisa fazer uma vez.</p>`}
      <button class="sc-send" onclick="enviarPedido()" ${faltaMinimo ? 'disabled' : ''}>
        <i class="ti ti-${logado ? 'brand-whatsapp' : 'login-2'}"></i>
        <span>${logado ? 'Enviar pedido' : 'Entrar e fazer pedido'}</span>
        <strong>${brl(total)}</strong>
      </button>`;
  }

  // Atualiza a sacola aberta quando a pessoa entra/sai da conta
  window.sacolaAuthMudou = function () {
    if (document.body.dataset.page === 'sacola' && sacola) renderSacola();
  };

  window.enviarPedido = function () {
    if (!sacola) return;
    if (!exigirLogin(() => {
      if (!sacola) return;
      if (document.body.dataset.page !== 'sacola') window.abrirSacola(); else renderSacola();
      toast('Pronto! Agora toque em "Enviar pedido" 👇', 'success', 4000);
    })) return;
    const loja = sacola.loja;
    const nome = document.getElementById('sc-nome').value.trim();
    const endereco = document.getElementById('sc-endereco')?.value.trim() || '';
    const troco = document.getElementById('sc-troco')?.value || '';
    const obs = document.getElementById('sc-obs').value.trim();

    if (!nome) { document.getElementById('sc-nome').focus(); return toast('Informe seu nome', 'error'); }
    if (cliente.modo === 'entrega' && !endereco) { document.getElementById('sc-endereco').focus(); return toast('Informe o endereço de entrega', 'error'); }
    if (!cliente.pagamento) return toast('Escolha a forma de pagamento', 'error');

    const sub = subtotal();
    const taxa = taxaAtual();
    const linhas = sacola.itens.map(i =>
      `${i.qtd}x ${i.nome} — ${i.preco > 0 ? brl(i.preco * i.qtd) : 'a combinar'}` + (i.obs ? `\n   _Obs: ${i.obs}_` : '')).join('\n');

    const msg = `🛍️ *Novo pedido — Achei Fácil*\n`
      + `*Loja:* ${loja.nome}\n\n`
      + `*Itens*\n${linhas}\n\n`
      + `Subtotal: ${brl(sub)}\n`
      + (cliente.modo === 'entrega' ? `Entrega: ${taxa === null ? 'a combinar' : taxa === 0 ? 'grátis' : brl(taxa)}\n` : '')
      + `*Total: ${brl(sub + (taxa || 0))}*${taxa === null ? ' + entrega' : ''}\n\n`
      + `*Cliente:* ${nome}\n`
      + (cliente.modo === 'entrega'
          ? `*Entregar em:* ${endereco}${cliente.referencia ? ` (ref.: ${cliente.referencia})` : ''}\n`
          : `*Retirada no local*\n`)
      + `*Pagamento:* ${cliente.pagamento}${cliente.pagamento === 'Dinheiro' && troco ? ` (troco para ${brl(troco)})` : ''}\n`
      + (obs ? `*Obs:* ${obs}\n` : '');

    if (enviarWhatsApp(loja, msg, true)) {
      registrarPedido({
        tipo: 'pedido', lojaId: loja.id || '', lojaNome: loja.nome || '', lojaCategoria: loja.categoria || '',
        itens: sacola.itens.map(i => ({ nome: i.nome, qtd: i.qtd, preco: i.preco || 0, obs: i.obs || '' })),
        qtdItens: totalItens(), subtotal: sub, taxaEntrega: taxa, total: sub + (taxa || 0),
        modo: cliente.modo, pagamento: cliente.pagamento, clienteNome: nome,
        endereco: cliente.modo === 'entrega' ? endereco : '', observacao: obs,
      });
      rascunho.obs = rascunho.troco = '';
      sacola = null;
      salvar();
      voltarDaSacola();
      toast('Pedido enviado! Confirme no WhatsApp da loja 🎉', 'success', 5000);
    }
  };

  // Abre o WhatsApp da loja. Sem número (ex.: lojas de teste), mostra como o pedido chegaria.
  function enviarWhatsApp(loja, msg, naSacola) {
    const num = (loja.whatsapp || '').replace(/\D/g, '');
    if (!num) {
      const alvo = naSacola ? document.getElementById('sc-preview') : null;
      if (alvo) {
        alvo.innerHTML = `<section class="sc-card sc-preview">
          <h3><i class="ti ti-eye"></i> Esta loja ainda não tem WhatsApp</h3>
          <p class="sc-hint">O pedido não foi enviado. É assim que ele chegaria para a loja:</p>
          <pre>${esc(msg)}</pre></section>`;
        alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        alert('Esta loja ainda não tem WhatsApp cadastrado. A mensagem seria:\n\n' + msg.replace(/\*/g, ''));
      }
      return false;
    }
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
    return true;
  }

  document.addEventListener('DOMContentLoaded', window.updateCartBar);
  window.updateCartBar();
})();
