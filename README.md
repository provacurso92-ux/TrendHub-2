# TrendHub - Rede Social de Trends e Comunidades

Uma rede social moderna focada em trends, conteúdo curto, microcomunidades e desafios criativos.

## 🚀 Tecnologias

- **React 19** com TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Supabase** - Backend (Auth, Database, Storage, Realtime)
- **shadcn/ui** - Componentes UI
- **React Router DOM** - Roteamento
- **TanStack Query** - Gerenciamento de estado e cache
- **React Hook Form + Zod** - Formulários e validação
- **Lucide React** - Ícones

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)

## 🔧 Instalação

1. Clone o repositório e instale as dependências:

```bash
npm install
```

2. Configure o Supabase:

   - Crie um projeto no [Supabase](https://supabase.com)
   - Execute o script `supabase-setup.sql` no SQL Editor do Supabase
   - Este script criará todas as tabelas, índices, triggers, RLS policies e storage buckets

3. Configure as variáveis de ambiente:

   - Copie `.env.example` para `.env`
   - Preencha com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis
│   ├── ui/          # Componentes shadcn/ui
│   ├── Layout.tsx   # Layout principal
│   └── ProtectedRoute.tsx
├── contexts/        # Context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── hooks/          # Custom hooks
│   └── usePosts.ts
├── lib/            # Configurações e utilitários
│   ├── supabase.ts
│   └── utils.ts
├── pages/          # Páginas da aplicação
│   ├── Auth.tsx
│   ├── Feed.tsx
│   ├── Profile.tsx
│   ├── Communities.tsx
│   ├── Challenges.tsx
│   ├── Messages.tsx
│   └── Search.tsx
├── types/          # Definições TypeScript
│   ├── index.ts
│   └── database.ts
└── App.tsx         # Componente raiz
```

## ✨ Funcionalidades

### Implementadas

- ✅ Autenticação completa (cadastro, login, logout, recuperação de senha)
- ✅ Sistema de temas (claro/escuro) com persistência
- ✅ Feed de posts
- ✅ Criação de posts
- ✅ Perfil de usuário
- ✅ Comunidades
- ✅ Desafios
- ✅ Sistema de mensagens (interface)
- ✅ Busca
- ✅ Layout responsivo

### Banco de Dados

O projeto inclui um schema completo do Supabase com:

- Tabelas: profiles, posts, communities, challenges, messages, notifications, etc.
- Índices otimizados para queries frequentes
- Triggers para atualização automática de timestamps
- Row Level Security (RLS) em todas as tabelas
- Storage buckets configurados com policies
- Relacionamentos e constraints apropriados

### Próximas Implementações

- Chat em tempo real com Supabase Realtime
- Sistema de notificações em tempo real
- Upload de imagens para posts e perfil
- Curtidas e favoritos funcionais
- Sistema de comentários
- Seguir/Deixar de seguir usuários
- Funcionalidade completa de comunidades e desafios

## 🎨 Tema e Design

A aplicação possui:

- Paleta de cores personalizada (violet/purple gradient)
- Tema claro e escuro
- Componentes shadcn/ui customizados
- Animações e transições suaves
- Design responsivo para mobile e desktop

## 🔒 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas de acesso granulares
- Autenticação segura via Supabase Auth
- Validação de dados no frontend e backend

## 📦 Build

Para criar uma build de produção:

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

## 🚀 Deploy

O projeto está configurado para deploy na Vercel ou qualquer plataforma que suporte aplicações React/Vite.

## 📝 Licença

Este projeto é um exemplo educacional.
