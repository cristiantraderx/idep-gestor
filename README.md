# 🏫 IDEP-Gestor · Enterprise

**Sistema de Gestão Institucional do Instituto de Desenvolvimento Profissional do Estado de Rondônia (IDEP)**

[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)]()
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)]()
[![Supabase](https://img.shields.io/badge/Supabase-Local-3ECF8E?logo=supabase)]()

---

## 📋 Visão Geral

O **IDEP-Gestor** é uma plataforma completa de gestão educacional (ERP) que integra todos os processos administrativos, acadêmicos e financeiros do IDEP. Construído com tecnologias modernas, oferece uma experiência de usuário fluida, responsiva e em tempo real.

### 🎯 Objetivos

- Centralizar a gestão acadêmica (alunos, cursos, turmas, secretaria)
- Automatizar processos administrativos e financeiros
- Fornecer indicadores e relatórios para tomada de decisão
- Garantir segurança e conformidade com a LGPD
- Oferecer uma experiência moderna e intuitiva

---

## 🚀 Tecnologias

| Categoria | Tecnologia |
|-----------|-----------|
| **Frontend** | React 19, TypeScript 5.6, Vite 6 |
| **Estilização** | TailwindCSS 3.4, Class Variance Authority |
| **Roteamento** | React Router v6 (lazy loading) |
| **Estado & Dados** | TanStack Query 5, Context API |
| **Animações** | Framer Motion / Motion |
| **Backend/Dados** | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| **UI Components** | Radix UI, Lucide React (ícones), Sonner (toasts) |
| **Formulários** | React Hook Form + Zod |
| **Testes** | Vitest + Testing Library |
| **Gráficos** | Recharts |
| **Fontes** | Geist Sans |
| **Utilidades** | clsx, tailwind-merge, date-fns |

---

## ✨ Funcionalidades

### ✅ Implementadas

| Funcionalidade | Status |
|---------------|--------|
| 🔐 **Autenticação** — Login, cadastro, OAuth GitHub, recuperação de senha | ✅ Completo |
| 🎨 **Tema Claro/Escuro** — Com persistência em localStorage | ✅ Completo |
| 📊 **Dashboard Executivo** — KPIs, métricas, gráficos, atividades recentes | ✅ Completo |
| 🤖 **Assistente Virtual** — Chatbot inteligente com drag-and-drop e base de conhecimento | ✅ Completo |
| 🔔 **Notificações** — Sistema em tempo real com Supabase Realtime | ✅ Completo |
| 🔍 **Busca Global** — Atalho **Ctrl+K** para pesquisa em todo o sistema | ✅ Completo |
| 🎨 **Sidebar Inteligente** — Navegação com submenus, collapse, scrollbar customizada | ✅ Completo |
| 📱 **Responsivo** — Layout adaptável (desktop, tablet, mobile) | ✅ Completo |

### 📋 Módulos do Sistema

| Módulo | Rotas Implementadas | Status |
|--------|--------------------|--------|
| 👥 **Alunos** | Lista, Matrículas, Histórico | ✅ Completo |
| 🎓 **Cursos** | Lista, Disciplinas, Matriz Curricular | ✅ Completo |
| 🏫 **Turmas** | Lista, Calendário | ✅ Completo |
| 📄 **Secretaria** | Protocolos, Declarações, Certidões | ✅ Completo |
| 👑 **Admin** | Usuários, Perfis, Permissões (RBAC) | ✅ Completo |
| 👤 **Perfil** | Meu perfil | ✅ Completo |
| 💬 **Chat** | Chat/Comunicação interna | ✅ Completo |
| 💰 **Financeiro** | Dashboard, Receitas, Despesas, Fluxo de Caixa | ✅ Completo |
| 👥 **Recursos Humanos** | Servidores, Professores, Contratos, Férias | ✅ Completo |
| 🛒 **Compras** | Solicitações, Cotações, Licitações | ✅ Completo |
| 📦 **Almoxarifado** | Entradas, Saídas, Inventário | ✅ Completo |
| 🏢 **Patrimônio** | Bens Tombados, Movimentações, Manutenção | ✅ Completo |
| 📚 **Biblioteca** | Acervo, Empréstimos, Reservas | ✅ Completo |
| 📅 **Agenda** | Eventos, Salas, Laboratórios | ✅ Completo |
| 💻 **TI** | Chamados, Equipamentos, Licenças de Software | ✅ Completo |
| 🎤 **Ouvidoria** | Reclamações, Sugestões, Relatórios | ✅ Completo |
| 📊 **Relatórios** | Relatórios gerenciais | ✅ Completo |
| 📈 **BI** | Business Intelligence | ✅ Completo |
| 📋 **Projetos** | Gestão de Projetos | ✅ Completo |
| 🔍 **Auditoria** | Logs e auditoria do sistema | ✅ Completo |
| ⚙️ **Configurações** | Configurações do sistema | ✅ Completo |

---

## 🏗️ Arquitetura

### Frontend (React + Vite)

```
src/
├── app/                # (reservado)
├── components/         # Componentes reutilizáveis
│   ├── assistant/      # Assistente virtual
│   ├── auth/           # Proteção de rotas
│   ├── dashboard/      # Componentes de dashboard
│   ├── notifications/  # Sistema de notificações
│   ├── search/         # Busca global (Ctrl+K)
│   └── ui/             # Componentes base (Button, Card, Dialog, etc.)
├── constants/          # Constantes e configurações
│   ├── modules.ts      # Definição dos módulos do sistema
│   ├── navigation.ts   # Itens de navegação do sidebar
│   ├── perfis.ts       # Perfis de acesso (RBAC)
│   ├── assistant-knowledge.ts  # Base de conhecimento do assistente
│   ├── nlp-engine.ts   # Motor NLP do assistente
│   └── ...
├── contexts/           # Contextos React (Auth, Theme, Notifications)
├── data/               # Dados mock para desenvolvimento
├── features/           # Módulos de funcionalidades (escopo futuro)
├── hooks/              # Hooks customizados (useSidebar, useAI, useCrud)
├── integrations/       # Integrações (Supabase client, types)
├── layouts/            # Layouts (AuthLayout, SidebarLayout)
├── lib/                # Utilitários (cn, formatRelativeTime)
├── pages/              # Páginas do sistema
│   ├── admin/          # CRUD administrativo
│   ├── alunos/         # Módulo de alunos
│   ├── auth/           # Login, registro, recuperação
│   ├── biblioteca/     # Módulo de biblioteca
│   ├── compras/        # Módulo de compras
│   ├── cursos/         # Módulo de cursos
│   ├── financeiro/     # Módulo financeiro
│   ├── patrimonio/     # Módulo de patrimônio
│   ├── rh/             # Recursos humanos
│   ├── secretaria/     # Secretaria acadêmica
│   ├── ti/             # Tecnologia da informação
│   ├── turmas/         # Módulo de turmas
│   └── ...
├── providers/          # Providers (QueryClient, Toaster, AppProvider)
├── routes/             # Configuração de rotas (lazy loaded)
├── schemas/            # Schemas Zod (reservado)
├── services/           # Serviços (AI Service, Action Executor)
├── store/              # Estado global (reservado)
├── types/              # Tipos TypeScript
└── utils/              # Utilitários (reservado)
```

### Backend (Supabase)

O Supabase fornece:
- **Auth** — Autenticação com email/senha e OAuth (GitHub)
- **PostgreSQL** — Banco de dados relacional
- **Realtime** — Subscrições em tempo real para notificações
- **Storage** — Armazenamento de arquivos (avatars, documentos)
- **Row Level Security (RLS)** — Segurança em nível de linha
- **Migrations** — Controle de versão do banco (6 migrations)

### Estrutura do Banco

```
core/                  unidades, perfis, permissoes, usuarios
academico/             alunos, cursos, disciplinas, turmas, matriculas
gestao/                professores, servidores, contratos, receitas, despesas
servicos/              obras, emprestimos, chamados_ti, manifestacoes
sistema/               notificacoes, sessoes, auditoria, configuracoes
```

---

## 🔐 Perfis de Acesso (RBAC)

| Perfil | Código | Nível | Descrição |
|--------|--------|-------|-----------|
| 👑 Administrador Geral | `admin_geral` | 5 | Acesso total ao sistema |
| 🎯 Diretor | `diretor` | 4 | Gestão estratégica |
| 📋 Coordenador | `coordenador` | 4 | Coordenação acadêmica |
| 👁️ Supervisor | `supervisor` | 3 | Supervisão operacional |
| 📄 Secretaria | `secretaria` | 2 | Secretaria acadêmica |
| 👨‍🏫 Professor | `professor` | 2 | Docência |
| 👤 Aluno | `aluno` | 0 | Acesso ao próprio desempenho |
| 👥 RH | `rh` | 3 | Recursos humanos |
| 💰 Financeiro | `financeiro` | 3 | Gestão financeira |
| 🛒 Compras | `compras` | 2 | Compras e licitações |
| 📦 Almoxarifado | `almoxarifado` | 2 | Controle de estoque |
| 🏢 Patrimônio | `patrimonio` | 2 | Gestão patrimonial |
| 📚 Biblioteca | `biblioteca` | 2 | Gestão da biblioteca |
| 💻 TI | `ti` | 2 | Suporte técnico |
| 🎤 Ouvidoria | `ouvidoria` | 3 | Canal de comunicação |
| 🔍 Auditoria | `auditoria` | 4 | Auditoria do sistema |
| 👋 Visitante | `visitante` | 0 | Acesso mínimo |

---

## 🚦 Rotas do Sistema

### Públicas (sem autenticação)

| Rota | Página |
|------|--------|
| `/auth/login` | Login |
| `/auth/register` | Cadastro |
| `/auth/recover-password` | Recuperar senha |
| `/auth/update-password` | Atualizar senha |
| `/auth/callback` | Callback OAuth |

### Protegidas (requer login)

| Rota | Página |
|------|--------|
| `/dashboard` | Dashboard Executivo |
| `/notificacoes` | Central de Notificações |
| `/alunos` | Lista de Alunos |
| `/alunos/matriculas` | Matrículas |
| `/alunos/historico` | Histórico Escolar |
| `/cursos` | Lista de Cursos |
| `/cursos/disciplinas` | Disciplinas |
| `/cursos/matriz` | Matriz Curricular |
| `/turmas` | Lista de Turmas |
| `/turmas/calendario` | Calendário Acadêmico |
| `/secretaria/protocolos` | Protocolos |
| `/secretaria/declaracoes` | Declarações |
| `/secretaria/certidoes` | Certidões |
| `/rh/servidores` | Servidores |
| `/rh/professores` | Professores |
| `/rh/contratos` | Contratos |
| `/rh/ferias` | Férias |
| `/financeiro` | Dashboard Financeiro |
| `/financeiro/receitas` | Receitas |
| `/financeiro/despesas` | Despesas |
| `/financeiro/fluxo` | Fluxo de Caixa |
| `/compras/solicitacoes` | Solicitações de Compra |
| `/compras/cotacoes` | Cotações |
| `/compras/licitacoes` | Licitações |
| `/almoxarifado/entradas` | Entradas de Estoque |
| `/almoxarifado/saidas` | Saídas de Estoque |
| `/almoxarifado/inventario` | Inventário |
| `/patrimonio/bens` | Bens Tombados |
| `/patrimonio/movimentacoes` | Movimentações |
| `/patrimonio/manutencao` | Manutenção |
| `/biblioteca/acervo` | Acervo Bibliográfico |
| `/biblioteca/emprestimos` | Empréstimos |
| `/biblioteca/reservas` | Reservas |
| `/agenda/eventos` | Eventos |
| `/agenda/salas` | Salas |
| `/agenda/laboratorios` | Laboratórios |
| `/ti/chamados` | Chamados Técnicos |
| `/ti/equipamentos` | Equipamentos |
| `/ti/licencas` | Licenças de Software |
| `/ouvidoria/reclamacoes` | Reclamações |
| `/ouvidoria/sugestoes` | Sugestões |
| `/ouvidoria/relatorios` | Relatórios da Ouvidoria |
| `/relatorios` | Relatórios Gerenciais |
| `/bi` | Business Intelligence |
| `/projetos` | Gestão de Projetos |
| `/auditoria` | Auditoria do Sistema |
| `/configuracoes` | Configurações |
| `/admin/usuarios` | Administração de Usuários |
| `/admin/perfis` | Perfis de Acesso |
| `/admin/permissoes` | Permissões |
| `/chat` | Chat Interno |
| `/perfil` | Meu Perfil |

---

## 🛠️ Desenvolvimento

### Pré-requisitos

- **Node.js** 18+
- **npm** ou **pnpm**
- **Conta Supabase** (gratuita ou local via CLI)
- **(Opcional)** Supabase CLI para banco local

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/idep-gestor.git
cd idep-gestor

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_KEY=sua-service-key

# IA
VITE_DEEPSEEK_API_KEY=sk-...
VITE_OPENAI_API_KEY=sk-...
```

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento (Vite) |
| `npm run build` | Compila para produção (TypeScript + Vite) |
| `npm run preview` | Visualiza build de produção |
| `npm run lint` | Verifica código com ESLint |
| `npm run typecheck` | Verifica tipos TypeScript |
| `npm test` | Executa testes com Vitest |
| `npm run test:ui` | Testes com interface visual |
| `npm run test:coverage` | Testes com cobertura |

---

## 🤖 Assistente Virtual

O sistema possui um **assistente virtual inteligente** com as seguintes capacidades:

- 🧠 **Base de conhecimento** completa sobre todos os módulos
- 📖 **Tutoriais passo a passo** para tarefas comuns
- 💡 **Dicas e boas práticas** de uso do sistema
- 🔧 **Solução de problemas** comuns
- 🎯 **Ações rápidas** para perguntas frequentes
- 🖱️ **Arrastável** — Posicione onde preferir na tela
- 💬 **Respostas inteligentes** com processamento NLP
- 🔄 **Detecção de idioma** (Português, Inglês, Espanhol)

---

## 🚀 Deploy

O deploy é realizado automaticamente na **Vercel** a cada push na branch `master`.

[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel)]()

```bash
# Manual trigger
npx vercel --prod
```

---

## 📦 Estrutura do Projeto (Resumo)

```
├── src/                    # Código fonte
│   ├── components/         # Componentes reutilizáveis
│   ├── layouts/            # Layouts da aplicação
│   ├── pages/              # Páginas (20+ módulos)
│   ├── contexts/           # Contextos React
│   ├── constants/          # Configurações e constantes
│   ├── hooks/              # Hooks customizados
│   ├── integrations/       # Integrações externas
│   ├── providers/          # Providers
│   ├── services/           # Serviços
│   ├── routes/             # Rotas (lazy loaded)
│   └── types/              # Definições TypeScript
├── supabase/               # Configuração Supabase
│   ├── migrations/         # Migrations do banco (6 arquivos)
│   └── seed.sql           # Dados de seed
├── public/                 # Assets públicos
└── dist/                   # Build de produção
```

---

## 👨‍💻 Autor

**Cristian Marques**  
Desenvolvedor do IDEP-Gestor Enterprise

---

## 📄 Licença

Sistema proprietário do Instituto de Desenvolvimento Profissional do Estado de Rondônia (IDEP).  

---

> 💡 **Dica:** Pressione **Ctrl+K** para busca rápida ou clique no **robô** 🤖 no canto inferior direito para abrir o assistente virtual!
