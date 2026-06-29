# 🚀 Guia de Setup Rápido - TrendHub

## Passo 1: Instalação

```bash
npm install
```

## Passo 2: Configurar Supabase

### 2.1 Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta (ou faça login)
3. Clique em "New Project"
4. Preencha:
   - Nome do projeto: TrendHub
   - Database Password: escolha uma senha forte
   - Region: escolha a mais próxima
5. Aguarde a criação (1-2 minutos)

### 2.2 Executar SQL de Setup

1. No dashboard do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **New Query**
3. Copie TODO o conteúdo do arquivo `supabase-setup.sql`
4. Cole no editor SQL
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a execução completa (pode levar alguns segundos)

✅ Se aparecer "Success. No rows returned", está tudo certo!

### 2.3 Obter Credenciais

1. No dashboard, vá em **Settings** → **API**
2. Copie:
   - **Project URL** (em "Configuration")
   - **anon/public** key (em "Project API keys")

## Passo 3: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example`:

```bash
cp .env.example .env
```

2. Abra o arquivo `.env` e cole suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
```

## Passo 4: Iniciar Aplicação

```bash
npm run dev
```

A aplicação estará disponível em: `http://localhost:5173`

## Passo 5: Criar Primeira Conta

1. Acesse `http://localhost:5173`
2. Você será redirecionado para `/auth`
3. Clique em "Não tem conta? Cadastre-se"
4. Preencha:
   - Nome completo
   - Username (único)
   - Email
   - Senha
5. Clique em "Criar conta"
6. Verifique seu email (Supabase enviará um link de confirmação)
7. Após confirmar, faça login

## ✅ Verificação

Se tudo estiver correto:

- ✅ Você consegue criar uma conta
- ✅ Você consegue fazer login
- ✅ Você é redirecionado para o Feed
- ✅ Você vê o header com navegação
- ✅ Você pode alternar entre tema claro/escuro
- ✅ Você pode criar um post

## 🔧 Troubleshooting

### Erro: "Missing Supabase environment variables"

- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se as variáveis estão preenchidas corretamente
- Reinicie o servidor de desenvolvimento

### Erro ao criar conta: "Invalid username"

- O username deve ter entre 3 e 30 caracteres
- Use apenas letras, números e underscore

### Erro: "Could not connect to database"

- Verifique se executou o script SQL completo
- Verifique se o projeto Supabase está ativo
- Verifique a URL do Supabase no `.env`

### Posts não aparecem

- Verifique se executou todo o script SQL
- Verifique as RLS policies no Supabase (Settings → Policies)
- Abra o console do navegador (F12) e veja se há erros

## 📚 Próximos Passos

Após configurar, você pode:

1. Criar posts no Feed
2. Explorar seu perfil
3. Ver as páginas de Comunidades e Desafios
4. Testar o sistema de mensagens
5. Usar a busca

## 🎨 Recursos Implementados

- ✅ Autenticação completa
- ✅ Feed de posts
- ✅ Perfil de usuário
- ✅ Tema claro/escuro
- ✅ Layout responsivo
- ✅ Navegação completa

## 📞 Suporte

Se encontrar problemas:

1. Verifique o console do navegador (F12)
2. Verifique os logs do terminal
3. Revise este guia passo a passo
4. Certifique-se de que o SQL foi executado completamente

---

**Divirta-se explorando o TrendHub!** 🔥
