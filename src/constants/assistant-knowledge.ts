// ============================================================
// IDEP-Gestor · Knowledge Base do Assistente Virtual
// Enciclopédia completa do sistema para respostas inteligentes
// ============================================================

export interface KnowledgeEntry {
  keywords: string[];
  title: string;
  message: string;
  link?: string;
  category: "modulo" | "tutorial" | "dica" | "admin" | "geral";
}

const KB: KnowledgeEntry[] = [
  // ============================================================
  // SISTEMA - GERAL
  // ============================================================
  {
    keywords: ["sistema", "sobre", "idep", "gestor", "o que é", "plataforma"],
    title: "🏫 Sobre o IDEP-Gestor",
    message:
      "O **IDEP-Gestor** é um sistema de gestão institucional completo desenvolvido para o **Instituto de Desenvolvimento Profissional do Estado de Rondônia (IDEP)**. Ele integra todos os processos administrativos, acadêmicos e financeiros da instituição em uma única plataforma.\n\n**Tecnologias:** React + TypeScript + Vite, TailwindCSS, Supabase (Auth + Banco de Dados + Realtime), React Router, TanStack Query, Framer Motion.\n\n**Versão:** Enterprise v1.0\n**Desenvolvido por:** Cristian Marques",
    category: "geral",
  },
  {
    keywords: ["navegar", "navegação", "menu", "sidebar", "lateral", "como usar"],
    title: "🧭 Navegação no Sistema",
    message:
      "A navegação principal é feita pelo **menu lateral (sidebar)** localizado à esquerda. Ele está organizado em seções:\n\n**Principal:** Dashboard\n**Acadêmico:** Alunos, Cursos, Turmas, Secretaria\n**Gestão:** RH, Financeiro, Compras, Almoxarifado, Patrimônio\n**Serviços:** Biblioteca, Agenda, TI, Ouvidoria\n**Inteligência:** Relatórios, BI, Projetos\n**Administração:** Usuários, Perfis, Permissões\n**Sistema:** Auditoria, Configurações\n\n💡 **Dica:** Você pode recolher o sidebar clicando no ícone de menu no topo, ou usar a versão mobile com o botão hambúrguer.",
    category: "dica",
  },
  {
    keywords: ["atalho", "teclado", "shortcut", "ctrl+k", "busca rápida"],
    title: "⌨️ Atalhos de Teclado",
    message:
      "O sistema possui atalhos para agilizar seu trabalho:\n\n**Ctrl+K** — Abre a busca rápida (pesquise em todos os módulos)\n**Esc** — Fecha modais e diálogos\n**Enter** — Envia formulários e mensagens no chat\n\n💡 Mais atalhos serão adicionados em futuras atualizações.",
    category: "dica",
  },
  {
    keywords: ["tema", "dark", "light", "modo", "claro", "escuro", "noturno"],
    title: "🎨 Temas do Sistema",
    message:
      "O IDEP-Gestor suporta dois temas:\n\n**🌞 Modo Claro** — Ideal para ambientes bem iluminados\n**🌙 Modo Escuro** — Reduz o cansaço visual, ótimo para uso noturno\n\nPara alternar, clique no ícone de 🌙/☀️ no canto superior direito do header. Sua preferência fica salva automaticamente.",
    category: "dica",
  },
  {
    keywords: ["tela cheia", "fullscreen", "maximizar", "f11"],
    title: "🖥️ Modo Tela Cheia",
    message:
      "Você pode usar o sistema em **tela cheia** para aproveitar melhor o espaço:\n\nClique no ícone **⛶** (Maximize2) no header para ativar o modo tela cheia.\nOu use a tecla **F11** do seu navegador.\n\nIsso é especialmente útil no Dashboard e em relatórios.",
    category: "dica",
  },
  {
    keywords: ["assistente", "bot", "chat", "ajuda", "virtual", "robô", "robozinho"],
    title: "🤖 Sobre o Assistente Virtual",
    message:
      "Eu sou o **Assistente Virtual do IDEP-Gestor**! 🎉\n\n**O que eu posso fazer:**\n✅ Explicar como usar qualquer módulo do sistema\n✅ Dar dicas e tutoriais passo a passo\n✅ Explicar a estrutura do banco de dados\n✅ Ajudar com administração de usuários e permissões\n✅ Sugerir boas práticas\n✅ Tirar dúvidas sobre funcionalidades\n\n**Como me usar:**\n• Clique no robô 🦾 para abrir o chat\n• Escolha uma das ações rápidas\n• Ou digite sua pergunta diretamente\n• Me arraste para qualquer lugar da tela!\n\n💬 **Pergunte-me qualquer coisa sobre o sistema!**",
    category: "geral",
  },
  {
    keywords: ["notificações", "notificação", "notificacao", "sino", "alerta", "bell"],
    title: "🔔 Central de Notificações",
    message:
      "O sistema possui um **sistema de notificações em tempo real**!\n\n**Funcionalidades:**\n• 🔴 Badge com número de notificações não lidas\n• 📋 Dropdown rápido no header\n• 🔄 Atualização em tempo real via Supabase Realtime\n• 🏠 Central de Notificações completa em /notificacoes\n\n**Tipos de notificação:**\n📌 Informativo — ✅ Sucesso — ⚠️ Aviso — ❌ Erro — ⚙️ Sistema\n\n💡 Você pode marcar como lida, marcar todas como lidas ou excluir notificações.",
    link: "/notificacoes",
    category: "modulo",
  },

  // ============================================================
  // DASHBOARD
  // ============================================================
  {
    keywords: ["dashboard", "kpi", "indicador", "métrica", "home", "início", "inicio", "principal"],
    title: "📊 Dashboard Executivo",
    message:
      "O **Dashboard** é a tela inicial do sistema, onde você encontra uma visão executiva completa:\n\n**Indicadores (KPIs):**\n• 👥 Total de Alunos — 1.247\n• 👨‍🏫 Professores Ativos — 89\n• 📚 Cursos Ativos — 24\n• 💰 Receita Mensal — R$ 1.2M\n\n**Funcionalidades:**\n• Cards com variação percentual vs. mês anterior\n• Seletor de unidades (Sede, Filiais)\n• Badge de status do sistema (Online)\n• Atividades recentes\n• Estatísticas rápidas (frequência, salas, contratos, etc.)\n\n💡 **Dica:** Use o seletor de unidades para filtrar dados por filial!",
    link: "/dashboard",
    category: "modulo",
  },

  // ============================================================
  // ALUNOS
  // ============================================================
  {
    keywords: [
      "aluno", "alunos", "cadastrar", "cadastro", "estudante", "discente",
      "matricular", "matrícula", "matricula", "nota", "frequência", "frequencia",
      "histórico", "historico", "transferir", "transferência", "cpf",
    ],
    title: "📋 Módulo de Alunos",
    message:
      "O módulo de **Alunos** permite a gestão completa do corpo discente.\n\n**📍 Onde encontrar:** Menu lateral → Acadêmico → Alunos\n\n**Funcionalidades implementadas:**\n✅ Lista completa com busca por nome, CPF ou email\n✅ Filtros: Todos / Ativos / Inativos\n✅ Cadastro completo (dados pessoais, contato, endereço, filiação)\n✅ Edição de dados\n✅ Exclusão com confirmação\n✅ Modal de detalhes com matrículas do aluno\n✅ Matrículas em cursos/turmas\n\n**📋 Tutorial - Cadastrar Aluno:**\n1. Vá em Alunos e clique em \"Novo Aluno\"\n2. Preencha nome completo, CPF, RG, data de nascimento\n3. Adicione contatos (email, celular)\n4. Informe endereço, cidade e estado\n5. Preencha filiação (nome dos pais)\n6. Selecione a unidade\n7. Clique em \"Cadastrar aluno\"\n\n**📋 Tutorial - Matricular Aluno:**\n1. Vá em Alunos > Matrículas\n2. Clique em \"Nova Matrícula\"\n3. Selecione o aluno, curso e turma\n4. Informe a data da matrícula e forma de ingresso\n5. Clique em \"Realizar matrícula\"\n\n💡 **Dica:** O CPF e o email do aluno podem ser usados para busca rápida na lista!",
    link: "/alunos",
    category: "modulo",
  },

  // ============================================================
  // CURSOS
  // ============================================================
  {
    keywords: [
      "curso", "cursos", "disciplina", "disciplinas", "matriz", "curricular",
      "matrizes", "certificado", "diploma", "grade", "horária", "ementa",
      "técnico", "tecnico", "graduação", "extensão", "extensao",
    ],
    title: "📚 Módulo de Cursos",
    message:
      "O módulo de **Cursos** gerencia cursos técnicos, disciplinas e matrizes curriculares.\n\n**📍 Onde encontrar:** Menu lateral → Acadêmico → Cursos\n\n**Funcionalidades previstas:**\n⏳ Cadastro de cursos (técnico, graduação, extensão, qualificação)\n⏳ Matrizes curriculares\n⏳ Disciplinas e ementas\n⏳ Certificados e diplomas\n⏳ Grade horária\n\n**Status:** Em desenvolvimento 🚧\n\n💡 **Dica:** Enquanto o módulo não fica pronto, os dados podem ser cadastrados via administração do banco de dados.",
    link: "/cursos",
    category: "modulo",
  },

  // ============================================================
  // TURMAS
  // ============================================================
  {
    keywords: ["turma", "turmas", "calendário", "calendario", "diário", "diario", "professor", "alocar"],
    title: "🏫 Módulo de Turmas",
    message:
      "O módulo de **Turmas** organiza as turmas, alocação de professores e calendário.\n\n**📍 Onde encontrar:** Menu lateral → Acadêmico → Turmas\n\n**Funcionalidades previstas:**\n⏳ Cadastro de turmas\n⏳ Alocação de professores\n⏳ Calendário acadêmico\n⏳ Diário eletrônico\n⏳ Acompanhamento pedagógico\n\n**Status:** Em desenvolvimento 🚧",
    link: "/turmas",
    category: "modulo",
  },

  // ============================================================
  // SECRETARIA
  // ============================================================
  {
    keywords: ["secretaria", "protocolo", "declaração", "declaracao", "certidão", "certidao", "documento", "assinatura"],
    title: "📄 Secretaria Acadêmica",
    message:
      "O módulo de **Secretaria** gerencia protocolos, declarações e certidões.\n\n**📍 Onde encontrar:** Menu lateral → Acadêmico → Secretaria\n\n**Funcionalidades previstas:**\n⏳ Protocolo digital\n⏳ Declarações e certidões\n⏳ Históricos escolares\n⏳ Assinatura digital\n⏳ Automação de documentos\n\n**Status:** Em desenvolvimento 🚧",
    link: "/secretaria",
    category: "modulo",
  },

  // ============================================================
  // RECURSOS HUMANOS
  // ============================================================
  {
    keywords: ["rh", "recursos humanos", "servidor", "servidores", "professor", "professores", "contrato", "férias", "ferias", "licença", "treinamento"],
    title: "👥 Módulo de Recursos Humanos",
    message:
      "O módulo de **RH** gerencia servidores, professores, contratos e férias.\n\n**📍 Onde encontrar:** Menu lateral → Gestão → Recursos Humanos\n\n**Funcionalidades previstas:**\n⏳ Cadastro de servidores\n⏳ Professores e contratos\n⏳ Controle de férias e licenças\n⏳ Escalas de trabalho\n⏳ Treinamentos e avaliações\n\n**Status:** Planejado 📋",
    link: "/rh",
    category: "modulo",
  },

  // ============================================================
  // FINANCEIRO
  // ============================================================
  {
    keywords: ["financeiro", "receita", "despesa", "fluxo", "caixa", "empenho", "custo", "contrato", "pagamento"],
    title: "💰 Módulo Financeiro",
    message:
      "O módulo **Financeiro** controla receitas, despesas, empenhos e fluxo de caixa.\n\n**📍 Onde encontrar:** Menu lateral → Gestão → Financeiro\n\n**Funcionalidades previstas:**\n⏳ Dashboard financeiro\n⏳ Receitas e despesas\n⏳ Empenhos e contratos\n⏳ Fluxo de caixa\n⏳ Centros de custo\n⏳ Prestação de contas\n\n**Status:** Planejado 📋",
    link: "/financeiro",
    category: "modulo",
  },

  // ============================================================
  // COMPRAS
  // ============================================================
  {
    keywords: ["compra", "compras", "licitação", "licitacao", "cotação", "cotacao", "orçamento", "fornecedor"],
    title: "🛒 Módulo de Compras e Licitações",
    message:
      "O módulo de **Compras** gerencia solicitações, cotações e licitações.\n\n**📍 Onde encontrar:** Menu lateral → Gestão → Compras\n\n**Funcionalidades previstas:**\n⏳ Solicitações de compra\n⏳ Cotações e orçamentos\n⏳ Licitações\n⏳ Contratos\n⏳ Recebimento de materiais\n\n**Status:** Planejado 📋",
    link: "/compras",
    category: "modulo",
  },

  // ============================================================
  // ALMOXARIFADO
  // ============================================================
  {
    keywords: ["almoxarifado", "estoque", "entrada", "saída", "inventário", "inventario", "transferência", "código", "barras", "qrcode"],
    title: "📦 Módulo de Almoxarifado",
    message:
      "O módulo de **Almoxarifado** gerencia estoque e inventário.\n\n**📍 Onde encontrar:** Menu lateral → Gestão → Almoxarifado\n\n**Funcionalidades previstas:**\n⏳ Controle de estoque\n⏳ Entradas e saídas\n⏳ Inventário físico\n⏳ Estoque mínimo\n⏳ Transferências entre unidades\n⏳ Código de barras e QR Code\n\n**Status:** Planejado 📋",
    link: "/almoxarifado",
    category: "modulo",
  },

  // ============================================================
  // PATRIMÔNIO
  // ============================================================
  {
    keywords: ["patrimônio", "patrimonio", "tombamento", "bem", "bens", "movimentação", "manutenção", "depreciação", "baixa"],
    title: "🏢 Módulo de Patrimônio",
    message:
      "O módulo de **Patrimônio** gerencia tombamento e controle de bens.\n\n**📍 Onde encontrar:** Menu lateral → Gestão → Patrimônio\n\n**Funcionalidades previstas:**\n⏳ Tombamento de bens\n⏳ Movimentações\n⏳ Controle de manutenção\n⏳ Depreciação\n⏳ Baixa patrimonial\n⏳ Inventário físico\n\n**Status:** Planejado 📋",
    link: "/patrimonio",
    category: "modulo",
  },

  // ============================================================
  // BIBLIOTECA
  // ============================================================
  {
    keywords: ["biblioteca", "acervo", "livro", "empréstimo", "emprestimo", "reserva", "multa", "obra"],
    title: "📖 Módulo de Biblioteca",
    message:
      "O módulo de **Biblioteca** gerencia acervo, empréstimos e reservas.\n\n**📍 Onde encontrar:** Menu lateral → Serviços → Biblioteca\n\n**Funcionalidades previstas:**\n⏳ Cadastro de acervo\n⏳ Empréstimos e devoluções\n⏳ Renovações online\n⏳ Reservas\n⏳ Controle de multas\n⏳ QR Code para obras\n\n**Status:** Planejado 📋",
    link: "/biblioteca",
    category: "modulo",
  },

  // ============================================================
  // AGENDA
  // ============================================================
  {
    keywords: ["agenda", "evento", "reunião", "sala", "laboratório", "calendário", "reserva", "compartilhado"],
    title: "📅 Módulo de Agenda Institucional",
    message:
      "O módulo de **Agenda** gerencia eventos, reuniões e reservas.\n\n**📍 Onde encontrar:** Menu lateral → Serviços → Agenda\n\n**Funcionalidades previstas:**\n⏳ Eventos institucionais\n⏳ Reuniões agendadas\n⏳ Reserva de salas\n⏳ Reserva de laboratórios\n⏳ Calendário compartilhado\n\n**Status:** Planejado 📋",
    link: "/agenda",
    category: "modulo",
  },

  // ============================================================
  // TI
  // ============================================================
  {
    keywords: ["ti", "tecnologia", "informação", "chamado", "equipamento", "software", "licença", "suporte", "garantia"],
    title: "💻 Módulo de TI",
    message:
      "O módulo de **TI** gerencia chamados técnicos e equipamentos.\n\n**📍 Onde encontrar:** Menu lateral → Serviços → TI\n\n**Funcionalidades previstas:**\n⏳ Abertura de chamados\n⏳ Inventário de equipamentos\n⏳ Licenças de software\n⏳ Controle de garantias\n⏳ Base de conhecimento\n\n**Status:** Planejado 📋",
    link: "/ti",
    category: "modulo",
  },

  // ============================================================
  // OUVIDORIA
  // ============================================================
  {
    keywords: ["ouvidoria", "reclamação", "reclamacao", "sugestão", "sugestao", "denúncia", "denuncia", "elogio", "manifestação", "anonimato"],
    title: "🎤 Módulo de Ouvidoria",
    message:
      "O módulo de **Ouvidoria** é o canal de comunicação com a instituição.\n\n**📍 Onde encontrar:** Menu lateral → Serviços → Ouvidoria\n\n**Funcionalidades previstas:**\n⏳ Registro de manifestações\n⏳ Reclamações e denúncias\n⏳ Sugestões e elogios\n⏳ Acompanhamento de protocolos\n⏳ Relatórios gerenciais\n⏳ Anonimato garantido\n\n**Status:** Planejado 📋",
    link: "/ouvidoria",
    category: "modulo",
  },

  // ============================================================
  // ADMINISTRAÇÃO
  // ============================================================
  {
    keywords: [
      "admin", "administração", "administracao", "usuário", "usuario", "usuários",
      "perfil", "perfis", "permissão", "permissao", "permissões", "acesso",
      "criar usuário", "novo usuário", "papel", "roles", "rbac",
    ],
    title: "👑 Administração do Sistema",
    message:
      "O módulo de **Administração** gerencia usuários, perfis e permissões.\n\n**📍 Onde encontrar:** Menu lateral → Administração\n\n**🔹 Usuários (/admin/usuarios):**\n✅ Lista completa com busca por nome/email\n✅ Criar usuário (define email, perfil de acesso, unidade)\n✅ Editar dados e perfil\n✅ Ativar/Desativar conta\n✅ Excluir usuário\n\n**🔹 Perfis (/admin/perfis):**\n✅ Lista em cards com nível (0-5)\n✅ Criar perfil (nome, código, descrição, nível)\n✅ Editar perfil\n✅ Excluir (exceto perfis do sistema 🔒)\n\n**Níveis de acesso:**\n0 - Básico | 1 - Operacional | 2 - Supervisor\n3 - Gerencial | 4 - Estratégico | 5 - Administrador\n\n**🔹 Permissões (/admin/permissoes):**\n✅ Matriz completa por módulo e ação\n✅ Ações: Listar | Criar | Editar | Excluir\n✅ Toggle visual (verde ✅ / cinza ❌)\n✅ Salvamento automático no banco\n\n**📋 Tutorial - Criar Usuário:**\n1. Vá em Administração > Usuários\n2. Clique em \"Novo Usuário\"\n3. Preencha nome completo e email\n4. Selecione o perfil de acesso\n5. Escolha a unidade (opcional)\n6. Clique em \"Criar usuário\"\n7. ✅ O usuário receberá um email para definir a senha\n\n**📋 Tutorial - Configurar Permissões:**\n1. Vá em Administração > Permissões\n2. Selecione um perfil no dropdown\n3. Ative as ações desejadas para cada módulo\n4. Clique em \"Salvar Permissões\"\n\n**💡 Dica:** Perfis com nível mais alto (ex: admin_geral) têm acesso a tudo. Configure permissões granulares para perfis operacionais!",
    link: "/admin/usuarios",
    category: "admin",
  },

  // ============================================================
  // AUDITORIA
  // ============================================================
  {
    keywords: ["auditoria", "log", "logs", "histórico", "historico", "rastreamento", "ip", "sessão", "sessao", "lgpd", "conformidade"],
    title: "🛡️ Módulo de Auditoria",
    message:
      "O módulo de **Auditoria** registra todas as ações do sistema.\n\n**📍 Onde encontrar:** Menu lateral → Sistema → Auditoria\n\n**Funcionalidades previstas:**\n⏳ Logs completos de auditoria\n⏳ Histórico de alterações\n⏳ Rastreamento de IP\n⏳ Controle de sessões\n⏳ Relatórios de auditoria\n⏳ Conformidade LGPD\n\n**Status:** Planejado 📋\n\n💡 A auditoria é fundamental para conformidade com a LGPD e para rastrear alterações em dados sensíveis.",
    link: "/auditoria",
    category: "modulo",
  },

  // ============================================================
  // RELATÓRIOS
  // ============================================================
  {
    keywords: ["relatório", "relatorio", "relatórios", "pdf", "excel", "csv", "exportar", "exportação"],
    title: "📊 Módulo de Relatórios",
    message:
      "O módulo de **Relatórios** gerará documentos em PDF, Excel e CSV.\n\n**📍 Onde encontrar:** Menu lateral → Inteligência → Relatórios\n\n**Funcionalidades previstas:**\n⏳ Relatórios acadêmicos\n⏳ Relatórios financeiros\n⏳ Exportação PDF/Excel/CSV\n⏳ Agendamento de relatórios\n⏳ Dashboards personalizados\n⏳ Relatórios LGPD\n\n**Status:** Planejado 📋\n\n💡 **Dica:** Enquanto não disponível, use os filtros e buscas nas listas para extrair informações!",
    link: "/relatorios",
    category: "modulo",
  },

  // ============================================================
  // BANCO DE DADOS
  // ============================================================
  {
    keywords: [
      "banco", "dados", "database", "tabela", "tabelas", "estrutura",
      "schema", "supabase", "sql", "migration", "migração",
    ],
    title: "🗄️ Estrutura do Banco de Dados",
    message:
      "O IDEP-Gestor utiliza **Supabase** (PostgreSQL) como banco de dados.\n\n**Principais tabelas:**\n\n**Core:**\n• unidades — Escolas/Filiais\n• perfis — Papéis/RBAC (admin_geral, diretor, professor, etc.)\n• permissoes — Permissões granulares por módulo/ação\n• usuarios — Perfis estendidos ligados ao auth.users\n• auditoria — Log completo de ações\n• configuracoes — Configurações institucionais\n\n**Acadêmico:**\n• alunos, cursos, disciplinas, turmas\n• matriculas, notas, frequencia, historico_escolar\n\n**Gestão:**\n• professores, servidores, contratos\n• receitas, despesas, centros_custo\n• itens, bens_patrimoniais\n• solicitacoes_compra, cotacoes, licitacoes\n\n**Serviços:**\n• obras (acervo), emprestimos, reservas\n• chamados_ti, equipamentos_ti\n• manifestacoes (ouvidoria)\n• processos, tramitacoes\n\n**Sistema:**\n• notificacoes — Notificações em tempo real\n• sessoes — Controle de sessões\n\n💡 Todas as tabelas têm RLS (Row Level Security) ativado!",
    category: "geral",
  },
  {
    keywords: ["autenticação", "auth", "login", "logar", "entrar", "sair", "logout", "senha", "email"],
    title: "🔐 Autenticação e Login",
    message:
      "O sistema usa **Supabase Auth** para autenticação.\n\n**Login:**\n• Entre com email institucional e senha\n• Ou use **Login com GitHub** (OAuth)\n\n**Recuperação de senha:**\n1. Clique em \"Esqueceu a senha?\" na tela de login\n2. Digite seu email\n3. Verifique sua caixa de entrada\n4. Siga o link para redefinir a senha\n\n**Cadastro:**\n• Clique em \"Solicitar cadastro\" na tela de login\n• Preencha nome, email e senha\n• Confirme seu email\n\n🔒 Sua sessão fica salva mesmo fechando o navegador.",
    category: "geral",
  },
  {
    keywords: ["perfil", "avatar", "minha conta", "dados", "alterar", "editar perfil"],
    title: "👤 Perfil do Usuário",
    message:
      "Para acessar seu perfil, clique no seu avatar no canto superior direito.\n\n**Opções do menu:**\n• ⚙️ Configurações — Acessar configurações do sistema\n• 👤 Meu Perfil — Ver/editar dados pessoais\n• 🚪 Sair do Sistema — Encerrar a sessão\n\n💡 Futuramente você poderá alterar foto, senha e preferências diretamente pelo perfil!",
    category: "geral",
  },
  {
    keywords: ["responsivo", "mobile", "celular", "tablet", "adaptável", "ios", "android"],
    title: "📱 Sistema Responsivo",
    message:
      "O IDEP-Gestor é totalmente **responsivo** e funciona em:\n\n**💻 Desktop (1024px+)** — Experiência completa com sidebar fixo\n**📱 Tablet (768px+)** — Sidebar recolhível\n**📱 Mobile (menos de 768px)** — Sidebar em overlay\n\nNo mobile, use o ícone **☰** (hambúrguer) no header para abrir o menu.",
    category: "dica",
  },
  {
    keywords: ["boas práticas", "boas praticas", "recomendação", "dicas", "performance", "segurança"],
    title: "💡 Dicas e Boas Práticas",
    message:
      "**📌 Dicas importantes:**\n\n1️⃣ **Use Ctrl+K** para busca rápida em todos os módulos\n2️⃣ **Mantenha os dados atualizados** — Informações corretas geram relatórios precisos\n3️⃣ **Perfis de acesso** — Atribua o menor nível de privilégio necessário para cada função\n4️⃣ **Matrículas** — Sempre verifique a disponibilidade de vagas na turma antes de matricular\n5️⃣ **Notificações** — Fique de olho no sininho para alertas importantes\n6️⃣ **Auditoria** — Todas as alterações são registradas para conformidade LGPD\n7️⃣ **Unidades** — Use o seletor de unidades para filtrar dados por filial\n\n**⚠️ Evite:**\n❌ Compartilhar senhas\n❌ Deixar sessões abertas em computadores compartilhados\n❌ Cadastrar CPFs duplicados\n❌ Excluir registros sem antes verificar vínculos (matrículas, contratos)",
    category: "dica",
  },
  {
    keywords: [
      "problema", "erro", "erros", "bug", "não funciona", "nao funciona",
      "travou", "lento", "carregando", "404", "página", "encontrada",
    ],
    title: "🔧 Solução de Problemas",
    message:
      "**Problemas comuns e soluções:**\n\n**❌ Página não encontrada (404)**\n• Verifique se o link está correto\n• O módulo pode estar em desenvolvimento\n• Navegue pelo menu lateral para encontrar a página\n\n**❌ Erro de autenticação**\n• Tente fazer logout e login novamente\n• Verifique se o email foi confirmado\n• Use \"Esqueceu a senha?\" para redefinir\n\n**❌ Sistema lento**\n• Feche abas não utilizadas do navegador\n• Verifique sua conexão com a internet\n• Tente recarregar a página (F5)\n\n**❌ Dados não aparecem**\n• Verifique os filtros na página\n• Tente limpar a busca\n• Clique no ícone 🔄 para recarregar\n\n**❌ Permissão negada**\n• Seu perfil pode não ter acesso ao módulo\n• Solicite ao administrador as permissões necessárias\n\n💡 **Precisa de mais ajuda?** Entre em contato com o suporte técnico!",
    category: "dica",
  },
  {
    keywords: [
      "private", "route", "rota", "protegida", "protegido", "não autenticado",
      "nao autenticado", "redirecionar", "login page",
    ],
    title: "🔒 Rotas Protegidas",
    message:
      "O sistema possui **rotas protegidas** que exigem autenticação:\n\n**📍 Públicas (sem login):**\n• /auth/login — Tela de login\n• /auth/register — Cadastro\n• /auth/recover-password — Recuperar senha\n• /auth/update-password — Atualizar senha\n• /auth/callback — Callback OAuth\n\n**📍 Protegidas (requer login):**\n• /dashboard — Dashboard executivo\n• /alunos, /cursos, /turmas, etc. — Módulos\n• /admin/* — Administração\n• /notificacoes — Notificações\n• Todas as demais páginas\n\n💡 Se você tentar acessar uma rota protegida sem estar logado, será redirecionado automaticamente para o login!",
    category: "geral",
  },
];

// ============================================================
// Search function
// ============================================================
export function searchKnowledge(query: string): KnowledgeEntry[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  const results: { entry: KnowledgeEntry; score: number }[] = [];

  for (const entry of KB) {
    let score = 0;

    // Check each keyword
    for (const keyword of entry.keywords) {
      if (lowerQuery.includes(keyword)) {
        score += 10;
      }
      if (keyword.includes(lowerQuery)) {
        score += 5;
      }
    }

    // Check in title and message content
    if (entry.title.toLowerCase().includes(lowerQuery)) {
      score += 8;
    }
    if (entry.message.toLowerCase().includes(lowerQuery)) {
      // Count occurrences for richer matching
      const matches = entry.message.toLowerCase().split(lowerQuery).length - 1;
      score += matches * 2;
    }

    if (score > 0) {
      results.push({ entry, score });
    }
  }

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 3).map((r) => r.entry);
}

// ============================================================
// Get a response for a specific action
// ============================================================
export function getActionResponse(
  action: string
): { title: string; message: string; link?: string } | null {
  const actionMap: Record<string, string[]> = {
    cadastrar_aluno: ["cadastrar", "aluno", "alunos"],
    gerenciar_permissoes: ["permissão", "permissao", "permissões", "permissoes"],
    criar_usuario: ["criar", "usuário", "usuario", "novo"],
    modulo_financeiro: ["financeiro", "receita", "despesa", "fluxo"],
    banco_dados: ["banco", "dados", "tabela", "estrutura", "database"],
    ajuda_sistema: ["ajuda", "sistema", "dúvida", "duvida", "problema"],
  };

  const keywords = actionMap[action];
  if (!keywords) return null;

  for (const kw of keywords) {
    const results = searchKnowledge(kw);
    if (results.length > 0) {
      const r = results[0];
      return { title: r.title, message: r.message, link: r.link };
    }
  }

  return null;
}

export default KB;
