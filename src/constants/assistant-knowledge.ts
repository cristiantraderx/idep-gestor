export interface KnowledgeEntry {
  keywords: string[];
  title: string;
  message: string;
  link?: string;
  category: "modulo" | "tutorial" | "dica" | "admin" | "geral";
}

const KB: KnowledgeEntry[] = [
  // ============================================================
  // CAPACIDADES DO ASSISTENTE
  // ============================================================
  {
    keywords: ["assistente", "ajudar", "pode fazer", "pode", "pode ajudar", "sabe fazer", "fazer", "faz", "habilidades", "capacidades", "funções", "funcionalidades", "recursos", "o que você faz", "o que você pode fazer", "como funciona", "para que serve", "chat", "bot", "inteligência artificial", "ia", "deepseek", "openai", "assistente virtual", "assistente idep", "como usar", "como funciona o assistente"],
    title: "🤖 Capacidades do Assistente Virtual",
    message:
      "Olá! Sou o **Assistente Virtual do IDEP-Gestor**! 🚀\n\n" +
      "Posso ajudar você de várias formas:\n\n" +
      "📖 **Tirar Dúvidas** — Pergunte sobre qualquer módulo do sistema!\n" +
      "   • \"Como cadastrar um aluno?\"\n" +
      "   • \"O que é o módulo financeiro?\"\n" +
      "   • \"Quais os atalhos do teclado?\"\n\n" +
      "🧭 **Navegar no Sistema** — Posso te levar para qualquer página!\n" +
      "   • \"Me leve para o financeiro\"\n" +
      "   • \"Abrir relatórios\"\n" +
      "   • \"Onde fica a biblioteca?\"\n\n" +
      "⚡ **Executar Ações** — Posso criar, editar e consultar dados!\n" +
      "   • \"Quantos alunos estão cadastrados?\"\n" +
      "   • \"Crie um novo curso técnico\"\n" +
      "   • \"Mostre as despesas deste mês\"\n\n" +
      "💡 **Dar Dicas** — Atalhos, produtividade e boas práticas!\n" +
      "   • \"Dicas de produtividade\"\n" +
      "   • \"Atalhos do teclado\"\n" +
      "   • \"Como ser mais eficiente\"\n\n" +
      "📊 **Gerar Relatórios** — Análises e estatísticas do sistema!\n" +
      "   • \"Relatório de alunos\"\n" +
      "   • \"Estatísticas do sistema\"\n" +
      "   • \"Exportar dados\"\n\n" +
      "🎤 **Comandos de Voz** — Use **Ctrl+Shift+V** para falar comigo!\n\n" +
      ("🔮 **Modo IA** — Ative o 🧠 no cabeçalho do chat para respostas\n" +
      "   ainda mais inteligentes usando DeepSeek ou OpenAI!\n\n") +
      "**💬 Como posso ajudá-lo hoje?**",
    category: "geral",
  },
  // ============================================================
  // VISÃO GERAL DO SISTEMA
  // ============================================================
  {
    keywords: ["sobre", "idep", "gestor", "sistema", "plataforma", "o que é"],
    title: "🏢 Sobre o IDEP-Gestor",
    message:
      "O **IDEP-Gestor** é o Sistema Integrado de Gestão Institucional do **Instituto de Desenvolvimento Profissional do Estado de Rondônia (IDEP)**.\n\n" +
      "🎯 **Propósito:** Centralizar e facilitar a gestão administrativa, acadêmica e financeira da instituição em uma única plataforma moderna e intuitiva.\n\n" +
      "⚙️ **Tecnologias:** React + TypeScript + Vite + Supabase + Tailwind CSS + Framer Motion\n\n" +
      "📊 **Módulos principais:**\n" +
      "• 📚 Acadêmico (Alunos, Turmas, Biblioteca)\n" +
      "• 💰 Gestão (Financeiro, RH, Almoxarifado)\n" +
      "• 🏛️ Administração (Usuários, Perfis, Permissões)\n" +
      "• 📋 Serviços (Secretaria, TI, Ouvidoria, Patrimônio)\n" +
      "• 📈 BI & Relatórios (Dashboard, Gráficos, Exportação)\n\n" +
      "**Versão:** Enterprise 1.0",
    category: "geral",
  },
  {
    keywords: ["navegação", "menu", "sidebar", "como usar", "interface", "layout"],
    title: "🧭 Navegação no Sistema",
    message:
      "A navegação é feita através do **menu lateral (sidebar)** à esquerda.\n\n" +
      "📌 **Dicas de navegação:**\n" +
      "• Clique nos itens do menu para expandir/colapsar seções\n" +
      "• Use **Ctrl+K** para abrir a busca global rápida\n" +
      "• O menu recolhe automaticamente em telas menores\n" +
      "• Ícones coloridos indicam diferentes módulos\n\n" +
      "📱 **Responsivo:** O sistema se adapta a tablets e celulares automaticamente.\n\n" +
      "💡 **Dica:** Passe o mouse sobre os ícones do menu recolhido para ver os nomes das seções.",
    category: "dica",
  },
  {
    keywords: ["atalhos", "teclado", "shortcuts", "hotkeys", "ctrl", "k"],
    title: "⌨️ Atalhos de Teclado",
    message:
      "Domine o sistema com esses atalhos:\n\n" +
      "🔍 **Ctrl+K** → Busca Global\n" +
      "🆕 **Ctrl+N** → Novo Registro (na página atual)\n" +
      "💬 **Ctrl+Espaço** → Abrir Assistente\n" +
      "🏠 **Alt+Home** → Ir para Dashboard\n" +
      "🔙 **Alt+Seta Esquerda** → Voltar\n" +
      "🔜 **Alt+Seta Direita** → Avançar\n\n" +
      "Mais atalhos em breve nas configurações do sistema!",
    category: "dica",
  },
  // ============================================================
  // MÓDULO ACADÊMICO
  // ============================================================
  {
    keywords: ["aluno", "alunos", "cadastrar", "matricular", "matrícula"],
    title: "🎓 Cadastro de Alunos",
    message:
      "Para **cadastrar um novo aluno**:\n\n" +
      "1️⃣ Navegue até **Acadêmico > Alunos**\n" +
      "2️⃣ Clique no botão **+ Novo Aluno**\n" +
      "3️⃣ Preencha os dados obrigatórios:\n" +
      "   • Nome completo\n" +
      "   • CPF\n" +
      "   • Data de nascimento\n" +
      "   • Unidade de ensino\n" +
      "4️⃣ Campos adicionais: telefone, email, endereço, etc.\n" +
      "5️⃣ Clique em **Salvar**\n\n" +
      "📌 O sistema valida CPF automaticamente e verifica duplicidades.\n" +
      "📌 É possível anexar documentos digitalizados na ficha do aluno.",
    link: "/alunos",
    category: "tutorial",
  },
  {
    keywords: ["turma", "turmas", "calendário", "calendario", "aula", "disciplina"],
    title: "📅 Gerenciamento de Turmas",
    message:
      "O módulo de **Turmas** permite organizar as turmas e seus calendários:\n\n" +
      "**Funcionalidades:**\n" +
      "• 📋 Cadastro de turmas com professor, disciplina e horários\n" +
      "• 📆 Calendário interativo com eventos da turma\n" +
      "• 👥 Listagem de alunos matriculados por turma\n" +
      "• 📊 Acompanhamento de frequência e notas\n\n" +
      "**Dica:** Use o calendário visual para arrastar e agendar eventos!",
    link: "/turmas",
    category: "modulo",
  },
  {
    keywords: ["biblioteca", "acervo", "livro", "livros", "emprestimo", "empréstimo"],
    title: "📚 Biblioteca",
    message:
      "O módulo da **Biblioteca** gerencia todo o acervo e empréstimos:\n\n" +
      "📖 **Acervo:** Cadastre livros com ISBN, autor, editora, ano e quantidade\n" +
      "🔄 **Empréstimos:** Controle de retirada e devolução com prazos\n" +
      "🔖 **Reservas:** Alunos podem reservar livros emprestados\n\n" +
      "📌 **Regras de empréstimo:**\n" +
      "• Prazo padrão: 14 dias\n" +
      "• Renovação: até 2 vezes (se não houver reserva)\n" +
      "• Multa por atraso: configurável por unidade\n\n" +
      "⚠️ **Alerta:** O sistema notifica automaticamente sobre devoluções atrasadas!",
    link: "/biblioteca/acervo",
    category: "modulo",
  },
  // ============================================================
  // MÓDULO GESTÃO
  // ============================================================
  {
    keywords: ["financeiro", "receita", "despesa", "fluxo", "caixa", "contas", "pagar", "receber"],
    title: "💰 Módulo Financeiro",
    message:
      "O **Financeiro** oferece controle completo das finanças:\n\n" +
      "📊 **Dashboard Financeiro:**\n" +
      "• Visão geral de receitas vs despesas\n" +
      "• Gráficos de pizza por categoria\n" +
      "• Saldo atual e projeções\n\n" +
      "📥 **Receitas:** Cadastre entradas por categoria (matrículas, convênios, etc.)\n" +
      "📤 **Despesas:** Controle gastos com categorização\n" +
      "💳 **Fluxo de Caixa:** Acompanhe o fluxo mensal com previsões\n\n" +
      "📌 **Dica:** Use categorias personalizadas para organizar melhor seus dados financeiros!",
    link: "/financeiro/dashboard",
    category: "modulo",
  },
  {
    keywords: ["rh", "recursos humanos", "servidor", "servidores", "professor", "professores", "contrato", "ferias", "férias"],
    title: "👥 Recursos Humanos",
    message:
      "O módulo de **RH** gerencia todo o quadro de funcionários:\n\n" +
      "👤 **Servidores:** Cadastro completo com dados funcionais\n" +
      "👨‍🏫 **Professores:** Gestão específica com titulação e regime\n" +
      "📄 **Contratos:** Controle de contratos ativos e vencimentos\n" +
      "🏖️ **Férias:** Solicitação e aprovação de períodos de férias\n\n" +
      "📌 **Funcionalidades:**\n" +
      "• Status ativo/inativo para servidores\n" +
      "• Controle de carga horária\n" +
      "• Histórico de férias por servidor\n" +
      "• Filtros por unidade e regime de trabalho",
    link: "/rh/servidores",
    category: "modulo",
  },
  {
    keywords: ["almoxarifado", "estoque", "item", "material", "entrada", "saída", "inventário"],
    title: "📦 Almoxarifado",
    message:
      "Controle de **estoque e materiais**:\n\n" +
      "📥 **Entradas:** Registre a chegada de novos materiais\n" +
      "📤 **Saídas:** Controle a distribuição de materiais\n" +
      "📊 **Inventário:** Visualize o saldo atual de todos os itens\n\n" +
      "📌 **Boas práticas:**\n" +
      "• Mantenha os itens categorizados (expediente, limpeza, informática, etc.)\n" +
      "• Use o campo de observações para registrar dados da nota fiscal\n" +
      "• O inventário atualiza automaticamente com entradas e saídas",
    link: "/almoxarifado/entradas",
    category: "modulo",
  },
  // ============================================================
  // MÓDULO AGENDA
  // ============================================================
  {
    keywords: ["agenda", "evento", "eventos", "reunião", "reuniao", "palestra", "laboratório", "laboratorio", "laboratorios", "sala", "salas", "reserva", "calendário", "calendario", "agendamento", "formatura", "aula inaugural", "aula_inaugural", "oficina", "evento institucional", "confirmado", "realizado"],
    title: "📅 Módulo Agenda",
    message:
      "O módulo de **Agenda** gerencia a programação institucional:\n\n" +
      "🎪 **Eventos:**\n" +
      "• Cadastro de eventos com título, descrição e tipo\n" +
      "• Tipos: reunião, evento institucional, aula inaugural, formatura, palestra, oficina\n" +
      "• Definição de data/hora início e fim, local, responsável e público-alvo\n" +
      "• Cores personalizadas para identificação visual\n" +
      "• Status: agendado → confirmado → realizado / cancelado\n" +
      "• Visualização em **lista** ou **calendário mensal** interativo\n" +
      "• Destaque do dia atual no calendário\n\n" +
      "🧪 **Laboratórios:**\n" +
      "• Agendamento e gestão de laboratórios\n" +
      "• Controle de disponibilidade por data e horário\n\n" +
      "🚪 **Salas:**\n" +
      "• Reserva de salas institucionais\n" +
      "• Evita conflitos de horário entre reservas\n\n" +
      "📌 **Dica:** Use a visualização mensal para ter uma visão panorâmica de todos os eventos do mês!",
    link: "/agenda/eventos",
    category: "modulo",
  },
  // ============================================================
  // ADMINISTRAÇÃO
  // ============================================================
  {
    keywords: ["usuário", "usuarios", "criar", "cadastrar", "senha", "login", "acesso"],
    title: "🔐 Gestão de Usuários",
    message:
      "Para **criar um novo usuário** no sistema:\n\n" +
      "1️⃣ Acesse **Administração > Usuários**\n" +
      "2️⃣ Clique em **+ Novo Usuário**\n" +
      "3️⃣ Preencha:\n" +
      "   • Nome completo e email\n" +
      "   • CPF (opcional)\n" +
      "   • Perfil de acesso (Admin, Gestor, Usuário, etc.)\n" +
      "   • Unidade de vínculo\n" +
      "4️⃣ Defina uma senha temporária\n" +
      "5️⃣ Clique em **Salvar**\n\n" +
      "📌 **Dica:** Vincule o usuário ao perfil correto para garantir as permissões adequadas.\n" +
      "📌 Usuários podem redefinir a própria senha no perfil.",
    link: "/admin/usuarios",
    category: "tutorial",
  },
  {
    keywords: ["perfil", "perfis", "permissoes", "permissões", "acesso", "roles", "papeis"],
    title: "🛡️ Perfis e Permissões",
    message:
      "O sistema possui um **controle de acesso baseado em perfis (RBAC)**:\n\n" +
      "**Perfis disponíveis:**\n" +
      "• 👑 **Administrador Total** — Acesso completo a tudo\n" +
      "• 📊 **Gestor** — Acesso a gestão e relatórios\n" +
      "• 👨‍🏫 **Professor** — Acesso acadêmico\n" +
      "• 👤 **Usuário Padrão** — Acesso básico\n\n" +
      "**Gerenciamento:**\n" +
      "• Crie perfis personalizados em **Administração > Perfis**\n" +
      "• Defina permissões específicas por módulo\n" +
      "• Cada perfil pode ter permissões de: visualizar, criar, editar e excluir\n\n" +
      "⚠️ Apenas Administradores podem gerenciar perfis e permissões!",
    link: "/admin/perfis",
    category: "admin",
  },
  // ============================================================
  // MÓDULO COMPRAS
  // ============================================================
  {
    keywords: ["compras", "cotação", "cotacoes", "cotar", "licitação", "licitações", "licitacao", "licitar", "solicitação de compra", "solicitacoes_compra", "solicitar", "fornecedor", "fornecedores", "orçamento", "orçar", "pregao", "pregão", "concorrência", "convite", "tomada de preços", "dispensa", "inexigibilidade", "aquisição"],
    title: "🛒 Módulo de Compras",
    message:
      "O módulo de **Compras** gerencia todo o processo de aquisições:\n\n" +
      "📋 **Solicitações de Compra:**\n" +
      "• Cadastro de solicitações com solicitante, descrição e justificativa\n" +
      "• Prioridades: baixa, média, alta e urgente\n" +
      "• Status: rascunho → enviada → em análise → aprovada / rejeitada\n" +
      "• Vinculação com a unidade solicitante\n\n" +
      "📑 **Cotações:**\n" +
      "• Registro de cotações de fornecedores\n" +
      "• Dados: fornecedor, CNPJ, descrição dos itens, valor total\n" +
      "• Datas: cotação e validade\n" +
      "• Status: solicitada → recebida → aprovada / rejeitada / cancelada\n" +
      "• Prazo de entrega e observações\n\n" +
      "⚖️ **Licitações:**\n" +
      "• Gestão completa de processos licitatórios\n" +
      "• Modalidades: convite, tomada de preços, concorrência, pregão, dispensa e inexigibilidade\n" +
      "• Número do processo, objeto, valor estimado\n" +
      "• Datas de publicação e abertura\n" +
      "• Status: planejada → publicada → em andamento → adjudicada / homologada / cancelada\n\n" +
      "📌 **Dica:** Todas as compras são vinculadas a unidades, facilitando a prestação de contas!",
    link: "/compras/solicitacoes",
    category: "modulo",
  },
  // ============================================================
  // MÓDULO PATRIMÔNIO
  // ============================================================
  {
    keywords: ["patrimônio", "patrimonio", "bem", "bens", "tombo", "movimentação", "manutenção"],
    title: "🏛️ Módulo Patrimônio",
    message:
      "Gerencie todos os **bens patrimoniais** da instituição:\n\n" +
      "📋 **Bens:** Cadastre bens com:\n" +
      "• Número de tombo único\n" +
      "• Categoria (móveis, equipamentos, veículos, imóveis, informática)\n" +
      "• Estado de conservação (novo, bom, regular, ruim, inservível)\n" +
      "• Valor de aquisição e datas\n" +
      "• Localização e responsável\n\n" +
      "🔄 **Movimentações:** Registre:\n" +
      "• Transferências entre setores\n" +
      "• Empréstimos e devoluções\n" +
      "• Baixas patrimoniais\n\n" +
      "🔧 **Manutenções:** Solicite e acompanhe:\n" +
      "• Manutenções preventivas, corretivas e urgentes\n" +
      "• Status: solicitada → em andamento → concluída\n" +
      "• Controle de custos",
    link: "/patrimonio/bens",
    category: "modulo",
  },
  // ============================================================
  // MÓDULO CURSOS
  // ============================================================
  {
    keywords: ["curso", "cursos", "disciplina", "disciplinas", "matriz curricular", "matriz-curricular", "grade curricular", "acadêmico", "academico", "técnico", "graduação", "pós-graduação", "extensão", "mestrado", "presencial", "ead", "hibrido", "semestral", "anual", "modular", "carga horária", "ementa"],
    title: "🎓 Módulo de Cursos",
    message:
      "O módulo de **Cursos** estrutura toda a oferta acadêmica:\n\n" +
      "📘 **Cursos:**\n" +
      "• Cadastro completo com nome, código e descrição\n" +
      "• Tipos: técnico, graduação, pós-graduação, extensão e mestrado\n" +
      "• Modalidades: presencial, EAD e híbrido\n" +
      "• Regime: semestral, anual e modular\n" +
      "• Carga horária total e duração estimada\n" +
      "• Coordenação e unidade de vínculo\n" +
      "• Ativação/desativação de cursos\n\n" +
      "📚 **Disciplinas:**\n" +
      "• Cadastro de disciplinas com nome, código e ementa\n" +
      "• Carga horária teórica e prática\n" +
      "• Semestre de oferta\n" +
      "• Vinculação a cursos específicos\n\n" +
      "📐 **Matriz Curricular:**\n" +
      "• Associa disciplinas aos cursos de forma estruturada\n" +
      "• Define em qual semestre/período cada disciplina é ofertada\n" +
      "• Permite visualizar a grade completa do curso\n\n" +
      "📌 **Dica:** A matriz curricular é essencial para organizar a progressão dos alunos ao longo do curso!",
    link: "/cursos",
    category: "modulo",
  },
  // ============================================================
  // MÓDULO TI
  // ============================================================
  {
    keywords: ["ti", "chamado", "chamados", "suporte", "equipamento", "informática"],
    title: "💻 Módulo de TI",
    message:
      "O módulo de **TI** gerencia:\n\n" +
      "🖥️ **Equipamentos:** Cadastro de equipamentos de informática\n" +
      "🔧 **Chamados:** Abertura e acompanhamento de chamados de suporte\n" +
      "📄 **Licenças:** Controle de licenças de software\n\n" +
      "📌 **Abrir um chamado:**\n" +
      "1️⃣ Acesse **Serviços > TI > Chamados**\n" +
      "2️⃣ Clique em **+ Novo Chamado**\n" +
      "3️⃣ Descreva o problema\n" +
      "4️⃣ Acompanhe o status pela lista de chamados",
    link: "/ti/chamados",
    category: "modulo",
  },
  // ============================================================
  // MÓDULO PROJETOS
  // ============================================================
  {
    keywords: ["projeto", "projetos", "programa", "programas", "editais", "edital", "convênio", "convenio", "termo de execução", "coordenador", "financiamento", "ensino", "pesquisa", "extensão", "desenvolvimento institucional", "parceria", "resultados", "planejado", "em andamento", "concluído", "suspenso", "cancelado", "orçamento"],
    title: "📋 Módulo de Projetos",
    message:
      "O módulo de **Projetos** gerencia iniciativas e programas institucionais:\n\n" +
      "📌 **Cadastro de Projetos:**\n" +
      "• Código único de identificação\n" +
      "• Nome, descrição e objetivos\n" +
      "• Tipos: ensino, pesquisa, extensão e desenvolvimento institucional\n" +
      "• Datas de início e fim\n" +
      "• Coordenador responsável\n" +
      "• Valor do orçamento previsto\n\n" +
      "📊 **Acompanhamento:**\n" +
      "• Status: planejado → em andamento → concluído / suspenso / cancelado\n" +
      "• Parcerias e instituições envolvidas\n" +
      "• Resultados esperados e alcançados\n" +
      "• Relatórios parciais e finais\n" +
      "• Vinculação com unidades e equipe envolvida\n\n" +
      "📌 **Dica:** Use o campo de observações para registrar marcos importantes e entregas do projeto!",
    link: "/projetos",
    category: "modulo",
  },
  // ============================================================
  // OUVIDORIA
  // ============================================================
  {
    keywords: ["ouvidoria", "sugestão", "sugestões", "reclamação", "manifestação", "relatório"],
    title: "📢 Ouvidoria",
    message:
      "A **Ouvidoria** permite o registro de manifestações:\n\n" +
      "📝 **Sugestões:** Envie ideias para melhoria da instituição\n" +
      "📊 **Relatórios:** Acompanhe o status das manifestações\n\n" +
      "**Tipos de manifestação:**\n" +
      "• 👍 Elogio\n" +
      "• 💡 Sugestão\n" +
      "• ⚠️ Reclamação\n" +
      "• ❓ Solicitação\n\n" +
      "📌 Todas as manifestações recebem um protocolo de acompanhamento.",
    link: "/ouvidoria/sugestoes",
    category: "modulo",
  },
  // ============================================================
  // SECRETARIA
  // ============================================================
  {
    keywords: ["secretaria", "certidão", "certidoes", "declaração", "declaracoes", "documento"],
    title: "📑 Secretaria",
    message:
      "A **Secretaria** emite documentos oficiais:\n\n" +
      "📜 **Certidões:** Emissão de certidões acadêmicas\n" +
      "📋 **Declarações:** Geração de declarações diversas\n\n" +
      "📌 Os documentos são gerados automaticamente com os dados do sistema.",
    link: "/secretaria/certidoes",
    category: "modulo",
  },
  // ============================================================
  // BI E RELATÓRIOS
  // ============================================================
  {
    keywords: ["bi", "relatório", "relatorios", "dashboard", "gráfico", "indicador", "kpi"],
    title: "📊 BI e Relatórios",
    message:
      "O módulo de **BI** oferece:\n\n" +
      "📈 **Dashboard Principal:** Visão geral com indicadores-chave (KPIs)\n" +
      "📊 **Relatórios:** Relatórios detalhados por módulo\n\n" +
      "**Indicadores disponíveis:**\n" +
      "• Total de alunos ativos\n" +
      "• Professores em atividade\n" +
      "• Turmas em andamento\n" +
      "• Receitas vs Despesas\n" +
      "• Itens em estoque\n\n" +
      "📌 Os dados são atualizados em tempo real!",
    link: "/dashboard",
    category: "modulo",
  },
  // ============================================================
  // DICAS GERAIS
  // ============================================================
  {
    keywords: ["ajuda", "suporte", "contato", "socorro", "problema", "erro", "bug"],
    title: "🆘 Precisa de Ajuda?",
    message:
      "Se você está com dificuldades:\n\n" +
      "1️⃣ **Pesquise aqui mesmo!** — Pergunte sobre o módulo desejado\n" +
      "2️⃣ **Busca Rápida (Ctrl+K)** — Encontre páginas e funcionalidades\n" +
      "3️⃣ **Navegue pelos menus** — Explore as funcionalidades disponíveis\n\n" +
      "📌 **Dica:** Tente perguntar com palavras-chave específicas!\n" +
      "Exemplos:\n" +
      "• \"Como cadastrar um aluno?\"\n" +
      "• \"Onde fica o financeiro?\"\n" +
      "• \"Gerenciar permissões\"\n" +
      "• \"Relatórios disponíveis\"\n\n" +
      "💬 Estou aqui para ajudar!",
    category: "geral",
  },
  {
    keywords: ["dica", "dicas", "otimização", "performance", "melhor prática", "produtividade"],
    title: "💡 Dicas de Produtividade",
    message:
      "🎯 **Maximize sua produtividade no IDEP-Gestor:**\n\n" +
      "🔍 **Busca Global (Ctrl+K)** — Acesse qualquer página em segundos\n" +
      "💬 **Assistente Virtual (Ctrl+Espaço)** — Tire dúvidas sem sair da página\n" +
      "📱 **Responsivo** — Acesse de qualquer dispositivo\n" +
      "🌙 **Tema Escuro** — Ative nas configurações para mais conforto\n" +
      "📋 **Navegação por Atalhos** — Use o menu recolhido para mais espaço\n\n" +
      "💪 **Lembre-se:** Quanto mais você usar, mais rápido será!",
    category: "dica",
  },
  {
    keywords: ["tema", "escuro", "claro", "dark", "light", "modo", "aparência"],
    title: "🎨 Temas do Sistema",
    message:
      "O IDEP-Gestor suporta **tema claro e escuro**!\n\n" +
      "🌙 **Tema Escuro:** Ideal para ambientes com pouca luz\n" +
      "☀️ **Tema Claro:** Melhor para ambientes bem iluminados\n\n" +
      "📌 **Como alternar:**\n" +
      "• Clique no ícone de **sol/lua** no topo da página\n" +
      "• A preferência é salva automaticamente\n\n" +
      "💡 O tema escuro reduz o cansaço visual em uso prolongado!",
    category: "dica",
  },
  {
    keywords: ["mobile", "celular", "tablet", "responsivo", "app", "aplicativo"],
    title: "📱 Acesso Mobile",
    message:
      "O sistema é **totalmente responsivo** e funciona em:\n\n" +
      "📱 **Celulares:** Navegação adaptada para telas pequenas\n" +
      "📟 **Tablets:** Layout otimizado para tela média\n" +
      "💻 **Desktop:** Experiência completa\n\n" +
      "📌 **Dicas para mobile:**\n" +
      "• Use o menu hamburguer para navegar\n" +
      "• O assistente está sempre disponível\n" +
      "• A busca global funciona normalmente\n\n" +
      "Não é necessário instalar nenhum app — use o navegador!",
    category: "dica",
  },
];

import { processQuery } from "./nlp-engine";

// ============================================================
// Feedback storage key
// ============================================================
const FEEDBACK_KEY = "idep-assistant-feedback-ratings";

interface StoredFeedback {
  kbIndex: number;
  vote: "up" | "down";
}

function loadFeedbackRatings(): StoredFeedback[] {
  try {
    const stored = localStorage.getItem(FEEDBACK_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

/**
 * Calcula score de feedback para cada entrada da KB
 * Returns um mapa de kbIndex -> peso (ex: up=1.2, down=0.7, none=1.0)
 */
function getFeedbackWeights(): Map<number, number> {
  const weights = new Map<number, number>();
  const ratings = loadFeedbackRatings();
  
  // Conta votos por entrada
  const upCount = new Map<number, number>();
  const downCount = new Map<number, number>();
  
  for (const r of ratings) {
    if (r.vote === "up") {
      upCount.set(r.kbIndex, (upCount.get(r.kbIndex) || 0) + 1);
    } else {
      downCount.set(r.kbIndex, (downCount.get(r.kbIndex) || 0) + 1);
    }
  }
  
  // Calcula peso: mais ups = maior peso, mais downs = menor peso
  const allIndices = new Set([...upCount.keys(), ...downCount.keys()]);
  for (const idx of allIndices) {
    const ups = upCount.get(idx) || 0;
    const downs = downCount.get(idx) || 0;
    const total = ups + downs;
    if (total === 0) {
      weights.set(idx, 1.0);
    } else {
      // Fórmula: peso varia de 0.5 (só down) a 1.5 (só up)
      const ratio = ups / total;
      // Votos suficientes? >=3 votos, usa peso completo
      if (total >= 3) {
        weights.set(idx, 0.5 + ratio);
      } else {
        // Poucos votos, peso mais conservador
        weights.set(idx, 0.8 + ratio * 0.4);
      }
    }
  }
  
  return weights;
}

// ============================================================
// Search function - finds relevant knowledge entries
// with feedback-based prioritization
// ============================================================
interface ScoredEntry {
  entry: KnowledgeEntry;
  score: number;
  kbIndex: number;
}

export function searchKnowledge(query: string): KnowledgeEntry[] {
  return searchKnowledgeWithFeedback(query).map((s) => s.entry);
}

/**
 * Busca conhecimento retornando também o índice da KB e score
 */
export function searchKnowledgeWithFeedback(query: string): ScoredEntry[] {
  // Carrega feedback weights
  const feedbackWeights = getFeedbackWeights();
  
  // Usa NLP para expandir a consulta
  const nlp = processQuery(query);
  const searchQueries = [nlp.expanded, query, nlp.stemmed.join(" ")];

  let bestResults: ScoredEntry[] = [];

  for (const searchQuery of searchQueries) {
    // Ignora palavras de 1 caractere para evitar falsos positivos (ex: "o" casa com "aluno", "projeto", etc.)
    const words = searchQuery.toLowerCase().split(/\s+/).filter(Boolean).filter((w) => w.length > 1);

    const scored: ScoredEntry[] = KB.map((entry, index) => {
      let score = 0;
      const allKeywords = entry.keywords.map((k) => k.toLowerCase());

      for (const word of words) {
        for (const keyword of allKeywords) {
          if (keyword === word) {
            score += 3;
          } else if (keyword.includes(word)) {
            score += 2;
          } else if (word.includes(keyword)) {
            score += 1;
          }
        }

        if (entry.title.toLowerCase().includes(word)) score += 1.5;
        if (entry.message.toLowerCase().includes(word)) score += 0.5;
      }

      // Aplica peso do feedback (multiplica score)
      const weight = feedbackWeights.get(index);
      if (weight !== undefined) {
        score = Math.round(score * weight);
      }

      return { entry, score, kbIndex: index };
    });

    const results = scored.filter((s) => s.score > 0);
    if (results.length > bestResults.length) {
      bestResults = results;
    }

    if (bestResults.length > 0) break;
  }

  return bestResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ============================================================
// Action response function - triggers specific actions
// ============================================================
const actionMap: Record<string, string[]> = {
  cadastrar_aluno: ["cadastrar aluno", "novo aluno", "matricular"],
  gerenciar_permissoes: ["permissão", "perfil", "acesso", "role"],
  criar_usuario: ["criar usuário", "novo usuário", "cadastrar usuário"],
  ajuda_sistema: ["dica", "ajuda", "socorro", "produtividade"],
  modulo_financeiro: ["financeiro", "receita", "despesa", "fluxo de caixa"],
  banco_dados: ["banco de dados", "estrutura", "supabase", "tabela"],
  modulo_patrimonio: ["patrimônio", "bem", "tombo", "movimentação"],
  modulo_rh: ["rh", "servidor", "professor", "funcionário", "contrato"],
  modulo_biblioteca: ["biblioteca", "livro", "acervo", "empréstimo"],
  modulo_almoxarifado: ["almoxarifado", "estoque", "material", "entrada", "saída"],
};

export function getActionResponse(action: string): { title: string; message: string; link?: string } | null {
  const keywords = actionMap[action];
  if (!keywords) return null;

  for (const kw of keywords) {
    const results = searchKnowledge(kw);
    if (results.length > 0) {
      const r = results[0] as NonNullable<typeof results[0]>;
      return { title: r.title, message: r.message, link: r.link };
    }
  }

  return null;
}

/**
 * Versão do getActionResponse que também retorna o kbIndex para feedback
 */
export function getActionResponseWithFeedback(action: string): { title: string; message: string; link?: string; kbIndex: number } | null {
  const keywords = actionMap[action];
  if (!keywords) return null;

  for (const kw of keywords) {
    const results = searchKnowledgeWithFeedback(kw);
    if (results.length > 0) {
      const r = results[0] as NonNullable<typeof results[0]>;
      return { title: r.entry.title, message: r.entry.message, link: r.entry.link, kbIndex: r.kbIndex };
    }
  }

  return null;
}

export default KB;
