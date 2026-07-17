# 🏫 IDEP-Gestor · Enterprise

**Sistema de Gestão Institucional do Instituto de Desenvolvimento Profissional do Estado de Rondônia (IDEP)**

---

## 📋 Visão Geral

O **IDEP-Gestor** é uma plataforma completa de gestão educacional que integra todos os processos administrativos, acadêmicos e financeiros do IDEP. Construído com tecnologias modernas, oferece uma experiência de usuário fluida, responsiva e em tempo real.

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
| **Frontend** | React 18, TypeScript, Vite |
| **Estilização** | TailwindCSS, Class Variance Authority |
| **Roteamento** | React Router v6 |
| **Estado & Dados** | TanStack Query, Context API |
| **Animações** | Framer Motion |
| **Backend/Dados** | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| **UI Components** | Lucide React (ícones), Sonner (toasts) |
| **Utilidades** | clsx, tailwind-merge, date-fns |

---

## ✨ Funcionalidades

### ✅ Implementadas

| Funcionalidade | Status |
|---------------|--------|
| 🔐 **Autenticação** — Login, cadastro, OAuth GitHub, recuperação de senha | ✅ Completo |
| 🎨 **Tema Claro/Escuro** — Com persistência em localStorage | ✅ Completo |
| 📊 **Dashboard** — KPIs, métricas, atividades recentes | ✅ Completo |
| 📋 **Alunos CRUD** — Cadastro, edição, exclusão, busca, filtros | ✅ Completo |
| 📋 **Matrículas** — Gerenciamento completo com status | ✅ Completo |
| 👑 **Admin Usuários** — CRUD completo de usuários do sistema | ✅ Completo |
| 👑 **Admin Perfis** — CRUD de perfis de acesso com níveis | ✅ Completo |
| 👑 **Admin Permissões** — Matriz de permissões por módulo/ação | ✅ Completo |
| 🔔 **Notificações** — Sistema em tempo real com Supabase Realtime | ✅ Completo |
| 🤖 **Assistente Virtual** — Chatbot inteligente com drag-and-drop | ✅ Completo |
| 🎨 **Sidebar** — Navegação com submenus, collapse, scrollbar customizada | ✅ Completo |
| 📱 **Responsivo** — Layout adaptável (desktop, tablet, mobile) | ✅ Completo |

### 🔄 Em Desenvolvimento

| Módulo | Status |
|--------|--------|
| Cursos (disciplinas, matriz curricular) | 🚧 Em desenvolvimento |
| Turmas (calendário, diário eletrônico) | 🚧 Em desenvolvimento |
| Secretaria (protocolos, declarações) | 🚧 Em desenvolvimento |

### 📋 Planejados

| Módulo | Status |
|--------|--------|
| Recursos Humanos | 📋 Planejado |
| Financeiro | 📋 Planejado |
| Compras e Licitações | 📋 Planejado |
| Almoxarifado | 📋 Planejado |
| Patrimônio | 📋 Planejado |
| Biblioteca | 📋 Planejado |
| Agenda Institucional | 📋 Planejado |
| TI (Chamados) | 📋 Planejado |
| Ouvidoria | 📋 Planejado |
| Relatórios | 📋 Planejado |
| Business Intelligence | 📋 Planejado |
| Projetos | 📋 Planejado |
| Auditoria | 📋 Planejado |

---

## 🏗️ Arquitetura

### Frontend (React + Vite)

```
src/
├── components/        # Componentes reutilizáveis
│   ├── admin/         # Componentes administrativos
│   ├── auth/          # Componentes de autenticação
│   ├── notifications/ # Sistema de notificações
│   ├── ui/            # Componentes base (Button, Card, Dialog, etc.)
│   └── ...
├── constants/         # Constantes e configurações
│   ├── modules.ts     # Definição dos módulos do sistema
│   ├── navigation.ts  # Itens de navegação do sidebar
│   └── assistant-knowledge.ts  # Base de conhecimento do assistente
├── contexts/          # Contextos React (Auth, Theme, Notifications)
├── hooks/             # Hooks customizados (useSidebar)
├── integrations/      # Integrações (Supabase client, types)
├── layouts/           # Layouts (AuthLayout, SidebarLayout)
├── lib/               # Utilitários (cn, formatRelativeTime)
├── pages/             # Páginas do sistema
│   ├── admin/         # CRUD administrativo
│   ├── alunos/        # Módulo de alunos
│   ├── auth/          # Login, registro, recuperação
│   └── notifications/ # Central de notificações
├── providers/         # Providers (QueryClient, Toaster)
├── routes/            # Configuração de rotas
└── types/             # Tipos TypeScript
```

### Backend (Supabase)

O Supabase fornece:
- **Auth** — Autenticação com email/senha e OAuth (GitHub)
- **PostgreSQL** — Banco de dados relacional
- **Realtime** — Subscrições em tempo real para notificações
- **Storage** — Armazenamento de arquivos (avatars, documentos)
- **Row Level Security (RLS)** — Segurança em nível de linha

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
| `/alunos/historico` | Histórico |
| `/admin/usuarios` | Administração de Usuários |
| `/admin/perfis` | Perfis de Acesso |
| `/admin/permissoes` | Permissões |
| `/:module/*` | Demais módulos (placeholder) |

---

## 🛠️ Desenvolvimento

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase (gratuita)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/idep-gestor.git
cd idep-gestor

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Compila para produção |
| `npm run preview` | Visualiza build de produção |
| `npm run lint` | Verifica código com ESLint |
| `npx tsc --noEmit` | Verifica tipos TypeScript |

---

## 🤖 Assistente Virtual

O sistema possui um **assistente virtual inteligente** com as seguintes capacidades:

- 🧠 **Base de conhecimento** completa sobre todos os módulos
- 📖 **Tutoriais passo a passo** para tarefas comuns
- 💡 **Dicas e boas práticas** de uso do sistema
- 🔧 **Solução de problemas** comuns
- 🎯 **Ações rápidas** para perguntas frequentes
- 🖱️ **Arrastável** — Posicione onde preferir na tela
- 💬 **Respostas inteligentes** baseadas em keywords

---

## 👨‍💻 Autor

**Cristian Marques**  
Desenvolvedor do IDEP-Gestor Enterprise

---

## 📄 Licença

Sistema proprietário do Instituto de Desenvolvimento Profissional do Estado de Rondônia (IDEP).

---

> 💡 **Dica:** Pressione **Ctrl+K** para busca rápida ou clique no **robô** 🤖 no canto inferior direito para abrir o assistente virtual!
