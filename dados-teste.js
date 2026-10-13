/* ═══════════════════════════════════════════════
   DADOS DE TESTE — Antas Digital
   Cria empresas de todas as categorias, com cardápio ou catálogo,
   promoções e notícias, para ver o app funcionando.
   Tudo leva "teste: true" e "[TESTE]" no nome, e o botão
   "Apagar dados de teste" remove só o que foi criado aqui.
   Usa o login do admin que está no painel (admin.html).
═══════════════════════════════════════════════ */

(function () {
  const foto = (id, w = 800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format&fit=crop`;
  const TAG = '[TESTE] ';
  const AVISO = 'Empresa fictícia criada para teste do Antas Digital. Não é um estabelecimento real.';
  const AVISO_ITEM = 'Item de teste. ';

  // Fotos conferidas (Unsplash)
  const F = {
    burger: '1568901346375-23c9450c58cd', pizza: '1513104890138-7c749659a591', pizzaFatia: '1565299624946-b28f40a0ae38',
    pratos: '1504674900247-0877df9cc836', salada: '1546069901-ba9599a7e63c', bowl: '1540189549336-e6e99c3679fe',
    espeto: '1555939594-58d7cb561ad1', restaurante: '1517248135467-4c7edcad34c4', salao: '1560066984-138dadb4c035',
    cabelo: '1522337360788-8b13dee7a37e', recepcao: '1519494026892-80bbd2d6fd0d', solda: '1504328345606-18bbc8c9d7d1',
    eletronica: '1581092918056-0c4c3acd3789', cozinha: '1556909114-f6e7ad7d3136', lojaRoupa: '1441986300917-64674bd600d8',
    arara: '1489987707025-afc232f7ea0f', liquidacao: '1607082349566-187342175e2f', margherita: '1574071318508-1cdbab80d002',
    donuts: '1551024601-bec78aea704b', picanha: '1600891964092-4316c288032e', eletricista: '1621905251189-08b45d6a269e',
    celular: '1610945265064-0e34e5519bbf', celular2: '1512499617640-c74ae3a79d37', cosmeticos: '1631729371254-42c2892f0e6e',
    arroz: '1586201375761-83865001e31c', fone: '1585771724684-38269d6639fd', lavanderia: '1604335399105-a0c585fd81a1',
    notebook: '1576091160550-2173dba999ef', barbearia: '1600948836101-f9ffda59d250', ferramentasCabelo: '1527799820374-dcf8d9d4a388',
    vitrine: '1588776814546-1ffcf47267a5', melancia: '1595475207225-428b62bda831',
  };

  // Horários (o app mostra só "Aberto agora" ou "Fechado agora")
  const semana = (abre, fecha, sabado = true, domingo = false) => {
    const d = (aberto) => ({ aberto, abertura: abre, fechamento: fecha });
    return { segunda: d(true), terca: d(true), quarta: d(true), quinta: d(true), sexta: d(true), sabado: d(sabado), domingo: d(domingo) };
  };
  const COMERCIAL = semana('08:00', '18:00');
  const TODO_DIA = semana('07:00', '22:00', true, true);

  // Item: tipo (grupo), nome, descrição, valor (0 = sob consulta), foto e extras
  const i = (tipo, nome, descricao, valor = 0, fotoId = '', extra = {}) => ({ tipo, nome, descricao, valor, foto: fotoId, ...extra });
  const GRATIS = { gratuito: true };
  const ESGOTADO = { status: 'indisponivel' };

  // ─── Empresas por categoria ───
  const EMPRESAS = [
    // ── Alimentação ──
    { nome: 'Restaurante Sabor da Terra', categoria: 'Alimentação', descricao: 'Comida caseira, pratos regionais e lanches.',
      logo: F.pratos, capa: F.restaurante, horarios: semana('10:00', '22:00', true, true), sponsored: true,
      entrega: { taxaEntrega: 5, pedidoMinimo: 15, tempoEntrega: '30–45 min' }, itens: [
        i('Pratos', 'Picanha com fritas', 'Picanha grelhada, batata frita, arroz e vinagrete. Serve 2.', 69.9, F.picanha),
        i('Pratos', 'Espetinho misto', 'Carne, frango e linguiça com farofa e vinagrete.', 18, F.espeto),
        i('Pratos', 'Salada da casa', 'Folhas, tomate, cenoura, ovo e molho da casa.', 22, F.salada),
        i('Pratos', 'Bowl fit de frango', 'Frango grelhado, grão-de-bico, legumes e folhas.', 28, F.bowl),
        i('Lanches', 'X-burguer artesanal', 'Pão brioche, hambúrguer 150g, queijo, alface e tomate.', 24, F.burger),
        i('Bebidas', 'Suco natural 500ml', 'Laranja, maracujá, acerola ou cajá.', 8),
        i('Bebidas', 'Refrigerante lata', 'Coca-Cola, Guaraná ou Fanta.', 6),
        i('Sobremesas', 'Donuts recheados', 'Unidade. Chocolate, doce de leite ou morango.', 9, F.donuts),
        i('Sobremesas', 'Pudim de leite', 'Fatia do pudim da casa.', 7, '', ESGOTADO),
      ] },
    { nome: 'Pizzaria Forno a Lenha', categoria: 'Alimentação', descricao: 'Pizzas assadas no forno a lenha, entrega na cidade.',
      logo: F.margherita, capa: F.pizza, horarios: semana('18:00', '23:30', true, true),
      entrega: { taxaEntrega: 6, pedidoMinimo: 30, tempoEntrega: '40–60 min' }, itens: [
        i('Pizzas', 'Pizza Margherita (grande)', 'Molho de tomate, mussarela, tomate e manjericão. 8 fatias.', 45, F.margherita),
        i('Pizzas', 'Pizza Calabresa (grande)', 'Calabresa, cebola, mussarela e orégano. 8 fatias.', 42, F.pizzaFatia),
        i('Pizzas', 'Pizza Portuguesa (grande)', 'Presunto, ovo, cebola, azeitona e mussarela.', 48),
        i('Pizzas', 'Pizza Frango com Catupiry', 'Frango desfiado, catupiry e milho.', 46),
        i('Bebidas', 'Refrigerante 2 litros', 'Coca-Cola ou Guaraná.', 13),
      ] },
    { nome: 'Açaí da Praça', categoria: 'Alimentação', descricao: 'Açaí no copo e na tigela, com adicionais à vontade.',
      horarios: semana('13:00', '22:00', true, true),
      entrega: { taxaEntrega: 3, tempoEntrega: '20–30 min' }, itens: [
        i('Açaí', 'Açaí 300ml', 'Com 2 adicionais à escolha.', 12),
        i('Açaí', 'Açaí 500ml', 'Com 3 adicionais à escolha.', 17),
        i('Açaí', 'Açaí 700ml', 'Com 4 adicionais à escolha.', 22),
        i('Adicionais', 'Leite Ninho', 'Porção extra.', 3),
        i('Adicionais', 'Morango', 'Porção extra.', 4),
        i('Bebidas', 'Suco de melancia', 'Copo de 400ml, feito na hora.', 7, F.melancia),
      ] },
    { nome: 'Padaria Pão Quente', categoria: 'Alimentação', descricao: 'Pão quentinho de manhã e de tarde, bolos e salgados.',
      horarios: semana('05:30', '20:00', true, true),
      entrega: { taxaEntrega: 0, pedidoMinimo: 10, tempoEntrega: '15–25 min' }, itens: [
        i('Pães', 'Pão francês (kg)', 'Saindo às 6h e às 16h.', 16),
        i('Pães', 'Pão de queijo (6 un.)', 'Assado na hora.', 9),
        i('Bolos', 'Bolo de milho (fatia)', 'Receita da casa.', 5),
        i('Bolos', 'Bolo de chocolate (inteiro)', 'Serve 12 pessoas. Encomende com 1 dia.', 45),
        i('Salgados', 'Coxinha de frango', 'Unidade.', 5),
        i('Bebidas', 'Café com leite', 'Copo de 300ml.', 4),
      ] },

    // ── Beleza e Estética ──
    { nome: 'Studio Bella', categoria: 'Beleza e Estética', descricao: 'Salão de beleza: cabelo, unhas, sobrancelha e maquiagem.',
      logo: F.cosmeticos, capa: F.salao, horarios: COMERCIAL, itens: [
        i('Cabelo', 'Corte feminino', 'Lavagem, corte e finalização. Cerca de 1 hora.', 50, F.cabelo),
        i('Cabelo', 'Escova modeladora', 'Para cabelos curtos e médios.', 35),
        i('Cabelo', 'Progressiva', 'Valor para cabelo médio. Orçamento na avaliação.', 150),
        i('Unhas e sobrancelha', 'Manicure e pedicure', 'Mãos e pés, esmaltação simples.', 45),
        i('Unhas e sobrancelha', 'Design de sobrancelha', 'Com pinça ou linha. Henna à parte.', 25),
        i('Maquiagem', 'Maquiagem para festa', 'Inclui cílios postiços.', 80),
      ] },
    { nome: 'Barbearia Navalha', categoria: 'Beleza e Estética', descricao: 'Corte masculino, barba e sobrancelha.',
      logo: F.ferramentasCabelo, capa: F.barbearia, horarios: semana('09:00', '20:00'), itens: [
        i('Cortes', 'Corte masculino', 'Máquina e tesoura, com lavagem.', 30, F.barbearia),
        i('Cortes', 'Corte infantil', 'Até 10 anos.', 25),
        i('Barba', 'Barba com toalha quente', 'Navalha e hidratação.', 20),
        i('Barba', 'Corte + barba', 'Combo completo.', 45),
        i('Outros', 'Pigmentação', 'Cabelo ou barba.', 25),
      ] },

    // ── Consertos e Reparos ──
    { nome: 'Zé Eletricista', categoria: 'Consertos e Reparos', descricao: 'Instalações e reparos elétricos residenciais e comerciais.',
      logo: F.eletricista, capa: F.eletricista, horarios: COMERCIAL, itens: [
        i('Elétrica', 'Instalação de chuveiro', 'Com troca de resistência, se precisar.', 60),
        i('Elétrica', 'Troca de tomada ou interruptor', 'Por ponto.', 25),
        i('Elétrica', 'Montagem de quadro de luz', 'Orçamento no local.', 0),
        i('Elétrica', 'Instalação de ventilador de teto', 'Com suporte.', 70),
      ] },
    { nome: 'Refrigeração Polar', categoria: 'Consertos e Reparos', descricao: 'Ar-condicionado, geladeira e freezer.',
      horarios: COMERCIAL, itens: [
        i('Ar-condicionado', 'Limpeza de split', 'Higienização completa.', 120),
        i('Ar-condicionado', 'Instalação de split até 12.000 BTUs', 'Até 3 metros de tubulação.', 350),
        i('Geladeira', 'Conserto de geladeira', 'Visita e diagnóstico no local.', 0),
        i('Geladeira', 'Recarga de gás', 'Geladeira ou freezer.', 180),
      ] },
    { nome: 'Oficina do Carlos', categoria: 'Consertos e Reparos', descricao: 'Mecânica geral para carros e motos.',
      horarios: semana('07:30', '17:30'), itens: [
        i('Carros', 'Troca de óleo', 'Mão de obra. Óleo à parte.', 40),
        i('Carros', 'Alinhamento e balanceamento', 'As 4 rodas.', 90),
        i('Carros', 'Revisão completa', 'Orçamento após avaliação.', 0),
        i('Motos', 'Revisão de moto', 'Até 160 cilindradas.', 80),
      ] },

    // ── Lojas ──
    { nome: 'Moda Antas', categoria: 'Lojas', descricao: 'Roupas masculinas, femininas e infantis.',
      logo: F.arara, capa: F.lojaRoupa, horarios: COMERCIAL, itens: [
        i('Roupas', 'Camiseta básica algodão', 'Do P ao GG, várias cores.', 39.9, F.arara),
        i('Roupas', 'Calça jeans', 'Masculina e feminina.', 119.9),
        i('Roupas', 'Vestido floral', 'Tecido leve, do P ao G.', 89.9),
        i('Infantil', 'Conjunto infantil', 'Do 2 ao 10 anos.', 59.9),
      ] },
    { nome: 'Calçados Passo Certo', categoria: 'Lojas', descricao: 'Tênis, sandálias e sapatos para toda a família.',
      horarios: COMERCIAL, itens: [
        i('Calçados', 'Tênis casual', 'Do 34 ao 44.', 159.9),
        i('Calçados', 'Sandália feminina', 'Do 33 ao 39.', 69.9),
        i('Calçados', 'Chinelo', 'Vários modelos.', 29.9),
        i('Calçados', 'Sapato social masculino', 'Couro, do 38 ao 44.', 189.9),
      ] },
    { nome: 'Utilidades da Casa', categoria: 'Lojas', descricao: 'Tudo para cozinha, limpeza e organização.',
      capa: F.cozinha, horarios: COMERCIAL, itens: [
        i('Cozinha', 'Jogo de panelas 5 peças', 'Antiaderente.', 149.9, F.cozinha),
        i('Cozinha', 'Garrafa térmica 1L', 'Vários cores.', 39.9),
        i('Limpeza', 'Kit vassoura + rodo + pá', 'Cabo de alumínio.', 34.9),
        i('Organização', 'Caixa organizadora 20L', 'Com tampa.', 24.9),
      ] },

    // ── Material de Construção ──
    { nome: 'Casa do Construtor', categoria: 'Material de Construção', descricao: 'Material de construção, ferramentas e serviços.',
      capa: F.solda, horarios: semana('07:00', '17:30'), itens: [
        i('Materiais', 'Cimento 50kg', 'Saco de cimento CP II.', 38),
        i('Materiais', 'Tijolo 8 furos (milheiro)', 'Mil unidades, entrega a combinar.', 890),
        i('Materiais', 'Tinta acrílica 18 litros', 'Branco neve, acabamento fosco.', 279),
        i('Serviços', 'Instalação elétrica', 'Eletricista para tomadas, chuveiro e quadro de luz.', 0, F.eletricista),
      ] },
    { nome: 'Depósito Bom Preço', categoria: 'Material de Construção', descricao: 'Areia, brita, blocos e ferragens com entrega.',
      horarios: semana('07:00', '17:00'), itens: [
        i('Agregados', 'Areia lavada (m³)', 'Entrega na cidade.', 120),
        i('Agregados', 'Brita 1 (m³)', 'Entrega na cidade.', 150),
        i('Blocos', 'Bloco de concreto 14x19x39', 'Unidade.', 3.5),
        i('Ferragens', 'Vergalhão 3/8 (barra 12m)', 'Aço CA-50.', 42),
      ] },

    // ── Saúde ──
    { nome: 'Clínica Vida', categoria: 'Saúde', descricao: 'Consultas, exames e atendimento com hora marcada.',
      capa: F.recepcao, horarios: semana('07:00', '17:00', false), itens: [
        i('Consultas', 'Consulta com clínico geral', 'Retorno em até 30 dias.', 150),
        i('Consultas', 'Consulta com nutricionista', 'Avaliação e plano alimentar.', 120),
        i('Exames', 'Hemograma completo', 'Coleta das 7h às 9h. Resultado em 24 horas.', 35),
        i('Exames', 'Eletrocardiograma', 'Com laudo do cardiologista.', 0),
      ] },
    { nome: 'Farmácia Saúde Já', categoria: 'Saúde', descricao: 'Medicamentos, higiene e perfumaria. Entrega rápida.',
      logo: F.cosmeticos, horarios: TODO_DIA, itens: [
        i('Medicamentos', 'Dipirona 500mg (10 comp.)', 'Genérico.', 6.5),
        i('Higiene', 'Fralda infantil (pacote)', 'Tamanhos P ao XG.', 49.9),
        i('Perfumaria', 'Protetor solar FPS 50', '200ml.', 39.9, F.cosmeticos),
        i('Serviços', 'Aferição de pressão', 'Na hora, sem agendamento.', 0, '', GRATIS),
      ] },
    { nome: 'Odonto Sorriso', categoria: 'Saúde', descricao: 'Clínica odontológica para adultos e crianças.',
      horarios: semana('08:00', '18:00', false), itens: [
        i('Tratamentos', 'Avaliação odontológica', 'Primeira consulta.', 0, '', GRATIS),
        i('Tratamentos', 'Limpeza', 'Profilaxia e aplicação de flúor.', 100),
        i('Tratamentos', 'Restauração', 'Por dente.', 120),
        i('Estética', 'Clareamento dental', 'Caseiro, com moldeira.', 600),
      ] },

    // ── Transporte ──
    { nome: 'Táxi Antas', categoria: 'Transporte', descricao: 'Corridas na cidade e viagens para a região.',
      horarios: TODO_DIA, itens: [
        i('Corridas', 'Corrida no centro', 'Até 3 km.', 15),
        i('Viagens', 'Antas → Paulo Afonso', 'Carro com ar, até 4 pessoas.', 250),
        i('Viagens', 'Antas → Ribeira do Pombal', 'Carro com ar, até 4 pessoas.', 180),
      ] },
    { nome: 'Mudanças Rápidas', categoria: 'Transporte', descricao: 'Fretes e mudanças com caminhão baú.',
      horarios: COMERCIAL, itens: [
        i('Fretes', 'Frete pequeno na cidade', 'Até 3 volumes.', 60),
        i('Mudanças', 'Mudança completa', 'Com ajudantes. Orçamento no local.', 0),
        i('Mudanças', 'Mudança intermunicipal', 'Por km rodado.', 0),
      ] },
    { nome: 'Moto Entrega Já', categoria: 'Transporte', descricao: 'Entregas de moto na cidade.',
      horarios: semana('08:00', '22:00', true, true), itens: [
        i('Entregas', 'Entrega no centro', 'Documentos e pacotes pequenos.', 7),
        i('Entregas', 'Entrega nos bairros', 'Até 5 km.', 10),
        i('Entregas', 'Pagamento de contas', 'Levamos e trazemos o comprovante.', 12),
      ] },

    // ── Aniversário ──
    { nome: 'Doces da Cris', categoria: 'Aniversário', descricao: 'Bolos personalizados, docinhos e salgados para festa.',
      logo: F.donuts, horarios: COMERCIAL, itens: [
        i('Bolos', 'Bolo personalizado (kg)', 'Massa e recheio à escolha. Encomenda com 3 dias.', 70, F.donuts),
        i('Doces', 'Docinhos (cento)', 'Brigadeiro, beijinho e cajuzinho.', 90),
        i('Salgados', 'Salgadinhos fritos (cento)', 'Coxinha, bolinha de queijo e risole.', 70),
        i('Kits', 'Kit festa 20 pessoas', 'Bolo 2kg, 100 doces e 100 salgados.', 280),
      ] },
    { nome: 'Festa Kids Decorações', categoria: 'Aniversário', descricao: 'Decoração temática e aluguel de brinquedos.',
      horarios: COMERCIAL, itens: [
        i('Decoração', 'Decoração simples', 'Painel, mesa e arco de balões.', 250),
        i('Decoração', 'Decoração completa', 'Tema à escolha, com montagem.', 550),
        i('Brinquedos', 'Aluguel de pula-pula', 'Diária, com monitor.', 150),
        i('Brinquedos', 'Cama elástica', 'Diária.', 120, '', ESGOTADO),
      ] },

    // ── Presentes ──
    { nome: 'Cantinho dos Presentes', categoria: 'Presentes', descricao: 'Cestas, canecas personalizadas e lembranças.',
      horarios: COMERCIAL, itens: [
        i('Cestas', 'Cesta de café da manhã', 'Com entrega no endereço.', 120),
        i('Personalizados', 'Caneca personalizada', 'Com foto ou frase.', 35),
        i('Flores', 'Buquê de rosas', '12 rosas vermelhas.', 90),
        i('Kits', 'Kit perfume + hidratante', 'Feminino ou masculino.', 79.9, F.cosmeticos),
      ] },

    // ── Empregos ──
    { nome: 'Agência Emprega Antas', categoria: 'Empregos', descricao: 'Vagas de emprego na região e ajuda com currículo.',
      horarios: semana('08:00', '17:00', false), itens: [
        i('Vagas', 'Atendente de loja', 'Ensino médio completo. Salário a combinar.', 0),
        i('Vagas', 'Auxiliar de pedreiro', 'Experiência de 6 meses.', 0),
        i('Vagas', 'Entregador com moto', 'CNH A e moto própria.', 0),
        i('Serviços', 'Elaboração de currículo', 'Pronto no mesmo dia.', 20),
      ] },

    // ── Grupos ──
    { nome: 'Grupo de Caminhada Antas', categoria: 'Grupos', descricao: 'Caminhadas em grupo para todas as idades.',
      horarios: semana('05:30', '07:00', true, true), itens: [
        i('Encontros', 'Caminhada da manhã', 'Segunda a sexta, 5h30, saída da praça.', 0, '', GRATIS),
        i('Encontros', 'Trilha de domingo', 'Uma vez por mês.', 0, '', GRATIS),
      ] },
    { nome: 'Associação de Artesãos', categoria: 'Grupos', descricao: 'Artesanato feito por moradores da região.',
      horarios: COMERCIAL, itens: [
        i('Artesanato', 'Bolsa de palha', 'Feita à mão.', 60),
        i('Artesanato', 'Tapete de crochê', 'Vários tamanhos.', 45),
        i('Oficinas', 'Oficina de crochê', 'Sábados, 14h.', 0, '', GRATIS),
      ] },

    // ── Tecnologia e Informática ──
    { nome: 'TecCell Assistência', categoria: 'Tecnologia e Informática', descricao: 'Celulares, acessórios e conserto de aparelhos.',
      logo: F.celular, capa: F.eletronica, horarios: semana('08:30', '18:00'), itens: [
        i('Aparelhos', 'Smartphone 128GB', 'Tela de 6,5", câmera tripla. Garantia de 1 ano.', 1299, F.celular),
        i('Aparelhos', 'Notebook para estudo', '8GB de RAM, SSD 256GB.', 2490, F.notebook),
        i('Acessórios', 'Fone de ouvido bluetooth', 'Bateria de até 20 horas.', 89, F.fone),
        i('Conserto', 'Troca de tela de celular', 'Orçamento na hora, conforme o modelo.', 0),
        i('Conserto', 'Formatação de computador', 'Backup dos arquivos e instalação de programas.', 80),
      ] },
    { nome: 'Antas Net Internet', categoria: 'Tecnologia e Informática', descricao: 'Internet por fibra óptica na cidade e zona rural.',
      capa: F.notebook, horarios: COMERCIAL, itens: [
        i('Planos', 'Fibra 100 Mega', 'Wi-Fi incluso.', 79.9),
        i('Planos', 'Fibra 300 Mega', 'Wi-Fi incluso.', 99.9),
        i('Planos', 'Fibra 500 Mega', 'Wi-Fi 6 incluso.', 129.9),
        i('Serviços', 'Instalação', 'Grátis na fidelidade de 12 meses.', 0, '', GRATIS),
      ] },

    // ── Influenciadores ──
    { nome: 'Vivi Antas Digital', categoria: 'Influenciadores', descricao: 'Divulgação de comércios locais no Instagram.',
      logo: F.celular2, horarios: COMERCIAL, itens: [
        i('Divulgação', 'Stories (3 sequências)', 'Com link para o seu perfil.', 50, F.celular2),
        i('Divulgação', 'Post no feed', 'Foto e legenda.', 80),
        i('Divulgação', 'Reels', 'Vídeo de até 60 segundos.', 120),
        i('Pacotes', 'Pacote mensal', '4 reels e 8 stories.', 450),
      ] },

    // ── Artistas ──
    { nome: 'Forró Pé de Serra Antas', categoria: 'Artistas', descricao: 'Trio de forró para festas, casamentos e eventos.',
      horarios: COMERCIAL, itens: [
        i('Shows', 'Show de 2 horas', 'Trio com som próprio.', 800),
        i('Shows', 'Show de 4 horas', 'Trio com som próprio.', 1400),
        i('Shows', 'Voz e violão', 'Para jantares e aniversários.', 400),
      ] },
    { nome: 'Ateliê Arte Viva', categoria: 'Artistas', descricao: 'Pinturas, murais e quadros sob encomenda.',
      horarios: COMERCIAL, itens: [
        i('Quadros', 'Quadro personalizado 40x60', 'Tinta acrílica sobre tela.', 250),
        i('Murais', 'Mural em parede', 'Valor por m². Orçamento no local.', 0),
        i('Aulas', 'Aula de pintura', 'Pacote de 4 aulas.', 160),
      ] },

    // ── Pet Shop ──
    { nome: 'Pet Amigo', categoria: 'Pet Shop', descricao: 'Banho, tosa, rações e acessórios.',
      horarios: COMERCIAL, itens: [
        i('Banho e tosa', 'Banho porte pequeno', 'Com secagem e perfume.', 35),
        i('Banho e tosa', 'Banho e tosa porte médio', 'Tosa higiênica ou na máquina.', 60),
        i('Rações', 'Ração para cães 15kg', 'Adulto, sabor carne.', 159.9),
        i('Acessórios', 'Coleira com guia', 'Tamanhos P, M e G.', 29.9),
      ] },
    { nome: 'Clínica Veterinária Patas', categoria: 'Pet Shop', descricao: 'Atendimento veterinário para cães e gatos.',
      horarios: semana('08:00', '18:00'), itens: [
        i('Consultas', 'Consulta veterinária', 'Cães e gatos.', 100),
        i('Vacinas', 'Vacina V10', 'Dose.', 90),
        i('Vacinas', 'Vacina antirrábica', 'Dose.', 60),
        i('Cirurgias', 'Castração de gato', 'Com anestesia e retorno.', 300),
      ] },

    // ── Educação ──
    { nome: 'Inglês Speak Up', categoria: 'Educação', descricao: 'Curso de inglês para crianças, jovens e adultos.',
      horarios: semana('08:00', '21:00'), itens: [
        i('Cursos', 'Inglês em turma (mensal)', '2 aulas por semana.', 150),
        i('Cursos', 'Aula particular', 'Hora-aula.', 60),
        i('Cursos', 'Aula experimental', 'Agende pelo WhatsApp.', 0, '', GRATIS),
      ] },
    { nome: 'Reforço Escolar Aprender', categoria: 'Educação', descricao: 'Reforço escolar e preparatório para o ENEM.',
      horarios: semana('07:30', '18:00', false), itens: [
        i('Reforço', 'Reforço do fundamental (mensal)', '3 vezes por semana.', 120),
        i('Preparatório', 'Preparatório ENEM (mensal)', 'Aulas e simulados.', 180),
      ] },
    { nome: 'Autoescola Volante', categoria: 'Educação', descricao: 'Primeira habilitação, adição e reciclagem.',
      horarios: COMERCIAL, itens: [
        i('Habilitação', 'CNH categoria A', 'Moto. Taxas do Detran à parte.', 1200),
        i('Habilitação', 'CNH categoria B', 'Carro. Taxas do Detran à parte.', 1800),
        i('Habilitação', 'CNH A + B', 'Pacote completo.', 2700),
      ] },

    // ── Imóveis ──
    { nome: 'Imobiliária Antas Lar', categoria: 'Imóveis', descricao: 'Compra, venda e aluguel de imóveis em Antas.',
      horarios: COMERCIAL, itens: [
        i('Venda', 'Casa 3 quartos no centro', '1 suíte, garagem para 2 carros.', 280000),
        i('Venda', 'Terreno 10x20', 'Escriturado, rua calçada.', 45000),
        i('Aluguel', 'Casa 2 quartos', 'Aluguel mensal.', 700),
        i('Aluguel', 'Ponto comercial', 'Rua principal, 40 m².', 1200),
      ] },

    // ── Esporte e Lazer ──
    { nome: 'Academia Força Total', categoria: 'Esporte e Lazer', descricao: 'Musculação, funcional e aulas em grupo.',
      horarios: semana('05:00', '22:00'), itens: [
        i('Planos', 'Musculação (mensal)', 'Livre, todos os horários.', 89.9),
        i('Planos', 'Funcional (mensal)', '3 aulas por semana.', 79.9),
        i('Serviços', 'Avaliação física', 'Com bioimpedância.', 50),
      ] },
    { nome: 'Arena Society Antas', categoria: 'Esporte e Lazer', descricao: 'Campo society com grama sintética e iluminação.',
      horarios: semana('16:00', '23:00', true, true), itens: [
        i('Quadra', 'Aluguel do campo (1 hora)', 'Com coletes e bola.', 120),
        i('Escolinha', 'Escolinha de futebol (mensal)', 'De 6 a 15 anos.', 70),
      ] },

    // ── Eventos e Festas ──
    { nome: 'Buffet Sabor & Festa', categoria: 'Eventos e Festas', descricao: 'Buffet para casamentos, aniversários e formaturas.',
      capa: F.pratos, horarios: COMERCIAL, itens: [
        i('Buffet', 'Buffet 50 pessoas', 'Entrada, prato principal e sobremesa.', 2500, F.pratos),
        i('Buffet', 'Buffet 100 pessoas', 'Entrada, prato principal e sobremesa.', 4500),
        i('Serviços', 'Garçom', 'Por evento de até 5 horas.', 150),
      ] },
    { nome: 'Som e Luz Eventos', categoria: 'Eventos e Festas', descricao: 'Som, iluminação e DJ para festas.',
      horarios: COMERCIAL, itens: [
        i('Som', 'Som para 100 pessoas', 'Com técnico.', 600),
        i('Luz', 'Iluminação de pista', 'Moving head e laser.', 400),
        i('DJ', 'DJ (4 horas)', 'Repertório a combinar.', 700),
      ] },

    // ── Contabilidade e Finanças ──
    { nome: 'Contabilidade Exata', categoria: 'Contabilidade e Finanças', descricao: 'Contabilidade para MEI, pequenas empresas e pessoa física.',
      horarios: semana('08:00', '17:00', false), itens: [
        i('Empresas', 'Abertura de MEI', 'Com orientação inicial.', 100),
        i('Empresas', 'Contabilidade mensal', 'Microempresa no Simples.', 350),
        i('Pessoa física', 'Declaração de Imposto de Renda', 'Simples ou completa.', 150),
      ] },

    // ── Advocacia e Jurídico ──
    { nome: 'Silva & Souza Advocacia', categoria: 'Advocacia e Jurídico', descricao: 'Direito previdenciário, trabalhista e de família.',
      horarios: semana('08:00', '17:00', false), itens: [
        i('Consultas', 'Consulta jurídica', 'Primeira conversa sobre o seu caso.', 0, '', GRATIS),
        i('Previdenciário', 'Aposentadoria pelo INSS', 'Honorários conforme o caso.', 0),
        i('Trabalhista', 'Ação trabalhista', 'Honorários conforme o caso.', 0),
        i('Família', 'Divórcio consensual', 'Em cartório, quando possível.', 0),
      ] },

    // ── Religião e Igrejas ──
    { nome: 'Comunidade Luz da Vida', categoria: 'Religião e Igrejas', descricao: 'Comunidade de fé aberta a todos.',
      horarios: semana('19:00', '21:00', true, true), itens: [
        i('Celebrações', 'Celebração de domingo', 'Domingo, 9h e 19h.', 0, '', GRATIS),
        i('Grupos', 'Grupo de oração', 'Quarta-feira, 19h30.', 0, '', GRATIS),
        i('Ação social', 'Distribuição de cestas', 'Primeiro sábado do mês.', 0, '', GRATIS),
      ] },
  ];

  // Promoções que aparecem na home (ligadas às empresas pelo nome)
  const PROMOCOES = [
    { empresa: 'Restaurante Sabor da Terra', titulo: 'X-burguer + refri', descricao: 'Combo de segunda a quinta.', valOriginal: 30, valPromo: 24, foto: F.burger },
    { empresa: 'Pizzaria Forno a Lenha', titulo: '2 pizzas grandes', descricao: 'Sabores tradicionais, só no sábado.', valOriginal: 90, valPromo: 75, foto: F.pizzaFatia },
    { empresa: 'Moda Antas', titulo: 'Camisetas em promoção', descricao: 'Leve 3 e pague 2.', valOriginal: 119.7, valPromo: 79.8, foto: F.liquidacao },
    { empresa: 'TecCell Assistência', titulo: 'Fone bluetooth', descricao: 'Enquanto durar o estoque.', valOriginal: 89, valPromo: 69, foto: F.fone },
    { empresa: 'Barbearia Navalha', titulo: 'Corte + barba', descricao: 'Terça e quarta.', valOriginal: 45, valPromo: 35, foto: F.barbearia },
    { empresa: 'Academia Força Total', titulo: 'Matrícula grátis', descricao: 'No plano de musculação.', valOriginal: 139.9, valPromo: 89.9 },
  ];

  // Notícias reais de outubro de 2026, resumidas, com a fonte no texto
  const NOTICIAS = [
    { titulo: 'Bahia teve 80% de comparecimento no 1º turno das eleições', categoria: 'Política',
      texto: 'No primeiro turno das Eleições Gerais, em 4 de outubro, cerca de 9 milhões de eleitores baianos foram às urnas, o equivalente a 80,03% do eleitorado apto. O segundo turno está marcado para 25 de outubro.\n\nFonte: TRE-BA (tre-ba.jus.br)' },
    { titulo: 'Quem faltou no 1º turno pode votar no 2º turno, em 25 de outubro', categoria: 'Política',
      texto: 'Segundo levantamento divulgado na imprensa baiana, cerca de 2,2 milhões de eleitores da Bahia não votaram no primeiro turno. A ausência não impede ninguém de votar no segundo turno; a falta pode ser justificada ou paga depois, em multa.\n\nFonte: Panorama da Bahia (panoramadabahia.com.br)' },
    { titulo: 'Bahia elege mais mulheres para a Assembleia e a Câmara', categoria: 'Política',
      texto: 'O número de mulheres eleitas pela Bahia cresceu em 2026: dez deputadas estaduais para a Assembleia Legislativa e seis deputadas federais para a Câmara dos Deputados.\n\nFonte: CN1 (cn1.com.br)' },
    { titulo: 'Bahia perde para o Palmeiras por 1 a 0 pelo Brasileirão', categoria: 'Esporte',
      texto: 'Em jogo da 29ª rodada, no dia 8 de outubro, o Bahia foi derrotado pelo Palmeiras por 1 a 0, com gol de Flaco López.\n\nFonte: Gazeta Esportiva (gazetaesportiva.com)' },
  ];

  const COLECOES = ['catalogo', 'promocoes', 'noticias', 'empresas'];

  function setStatus(msg) {
    const el = document.getElementById('teste-status');
    if (el) el.textContent = msg;
  }
  function setBusy(busy) {
    document.querySelectorAll('.teste-btn').forEach(b => { b.disabled = busy; });
  }

  async function contarTeste() {
    const { db, collection, getDocs, query, where } = window._fb;
    const totais = {};
    for (const c of COLECOES) {
      const snap = await getDocs(query(collection(db, c), where('teste', '==', true)));
      totais[c] = snap.size;
    }
    return totais;
  }

  window.atualizarResumoTeste = async function () {
    try {
      const t = await contarTeste();
      const total = Object.values(t).reduce((a, b) => a + b, 0);
      setStatus(total
        ? `No banco agora: ${t.empresas} empresas, ${t.catalogo} itens de cardápio/catálogo, ${t.promocoes} promoções e ${t.noticias} notícias de teste.`
        : `Nenhum dado de teste no banco. O botão cria ${EMPRESAS.length} empresas em ${new Set(EMPRESAS.map(e => e.categoria)).size} categorias.`);
    } catch (e) {
      console.error(e);
      setStatus('Não foi possível ler o banco: ' + (e.code || e.message));
    }
  };

  window.criarDadosTeste = async function () {
    const { db, auth, collection, addDoc, serverTimestamp, Timestamp } = window._fb;
    // As regras do Firestore só aceitam item/promoção com ownerUid = quem está logado,
    // então o admin vira o "dono" das empresas de teste.
    const uid = auth.currentUser?.uid;
    if (!uid) { toast('Faça login no painel antes.', 'error'); return; }

    setBusy(true);
    const erros = [];
    try {
      // Começa do zero para não duplicar
      setStatus('Removendo dados de teste anteriores...');
      await apagarTudo();

      const ids = {};
      let n = 0;
      for (let k = 0; k < EMPRESAS.length; k++) {
        const e = EMPRESAS[k];
        setStatus(`Criando ${k + 1} de ${EMPRESAS.length}: ${e.nome}...`);
        const descricao = `${e.descricao} ${AVISO}`;
        const capa = e.capa ? foto(e.capa) : '';
        const ref = await addDoc(collection(db, 'empresas'), {
          name: TAG + e.nome, nome: TAG + e.nome,
          categoria: e.categoria, category: e.categoria,
          descricao, description: descricao,
          endereco: 'Endereço de teste, Antas - BA', bairro: 'Centro',
          telefone: '', whatsapp: '', instagram: '',
          logo: e.logo ? foto(e.logo, 300) : '', cover: capa, fotos: capa ? [capa] : [],
          horarios: e.horarios || COMERCIAL,
          ...(e.entrega || {}),
          sponsored: !!e.sponsored, patrocinada: !!e.sponsored,
          status: 'ativa', views: 0, rating: 0, totalRatings: 0,
          ownerUid: uid,
          teste: true, criadoEm: serverTimestamp(),
        });
        ids[e.nome] = ref.id;

        // Itens com horários diferentes para manter a ordem do cardápio
        const base = Date.now();
        const res = await Promise.allSettled(e.itens.map((it, idx) => addDoc(collection(db, 'catalogo'), {
          empresaId: ref.id, empresaNome: TAG + e.nome, ownerUid: uid,
          nome: TAG + it.nome,
          descricao: AVISO_ITEM + it.descricao,
          tipo: it.tipo,
          valor: it.valor || 0,
          gratuito: !!it.gratuito,
          status: it.status || 'disponivel',
          fotoUrl: it.foto ? foto(it.foto, 400) : '',
          teste: true,
          createdAt: Timestamp.fromMillis(base - idx * 1000),
        })));
        res.forEach(r => r.status === 'fulfilled' ? n++ : erros.push(`item de ${e.nome}: ${r.reason?.code || r.reason}`));
      }

      setStatus('Criando promoções e notícias...');
      const validade = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
      const resP = await Promise.allSettled(PROMOCOES.map(p => addDoc(collection(db, 'promocoes'), {
        titulo: TAG + p.titulo, descricao: AVISO_ITEM + p.descricao,
        valOriginal: p.valOriginal, valPromo: p.valPromo, validade,
        status: 'ativa', foto: p.foto ? foto(p.foto, 300) : '',
        empresaId: ids[p.empresa] || '', empresaNome: TAG + p.empresa, ownerUid: uid,
        teste: true, createdAt: serverTimestamp(),
      })));
      resP.forEach(r => r.status === 'rejected' && erros.push(`promoção: ${r.reason?.code || r.reason}`));
      const resN = await Promise.allSettled(NOTICIAS.map(nt => addDoc(collection(db, 'noticias'), {
        titulo: TAG + nt.titulo, categoria: nt.categoria,
        autor: 'Antas Digital (teste)', texto: nt.texto, imagemUrl: '',
        teste: true, criadoEm: serverTimestamp(),
      })));
      resN.forEach(r => r.status === 'rejected' && erros.push(`notícia: ${r.reason?.code || r.reason}`));

      if (erros.length) {
        console.error('Dados de teste — falhas:', erros);
        toast(`Criado com ${erros.length} falha(s). Veja o aviso na tela.`, 'warning', 8000);
      } else {
        toast(`Pronto: ${EMPRESAS.length} empresas e ${n} itens de teste.`, 'success', 6000);
      }
    } catch (e) {
      console.error(e);
      erros.push(e.code || e.message);
      toast('Erro ao criar dados de teste: ' + (e.code || e.message), 'error', 8000);
    }
    setBusy(false);
    await window.atualizarResumoTeste();
    if (erros.length) setStatus(document.getElementById('teste-status').textContent + ` Falhas (${erros.length}): ${[...new Set(erros)].slice(0, 3).join(' · ')}`);
  };

  async function apagarTudo() {
    const { db, collection, getDocs, query, where, deleteDoc } = window._fb;
    let total = 0;
    for (const c of COLECOES) {
      const snap = await getDocs(query(collection(db, c), where('teste', '==', true)));
      // Em blocos de 20 para não sobrecarregar
      for (let k = 0; k < snap.docs.length; k += 20) {
        await Promise.all(snap.docs.slice(k, k + 20).map(d => deleteDoc(d.ref)));
      }
      total += snap.size;
    }
    return total;
  }

  // O admin.js troca o confirm() do navegador por um diálogo próprio: confirm(mensagem, aoConfirmar)
  window.apagarDadosTeste = function () {
    confirm('Apagar todos os dados de teste?', apagarConfirmado);
  };
  async function apagarConfirmado() {
    setBusy(true);
    try {
      setStatus('Apagando...');
      const total = await apagarTudo();
      toast(`${total} registros de teste apagados.`, 'success');
    } catch (e) {
      console.error(e);
      toast('Erro ao apagar: ' + (e.code || e.message), 'error', 6000);
    }
    setBusy(false);
    window.atualizarResumoTeste();
  }

  // Entra na lista de telas do admin (atualiza o resumo ao abrir)
  if (typeof PAGE_LABELS !== 'undefined') PAGE_LABELS['dados-teste'] = 'Dados de teste';
  window.PAGE_LOADERS = window.PAGE_LOADERS || {};
  window.PAGE_LOADERS['dados-teste'] = window.atualizarResumoTeste;
})();
