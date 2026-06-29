# 🧪 Guia de Testes - TrendHub

## Pré-requisitos

1. ✅ Banco de dados configurado (SQL executado)
2. ✅ `.env` com credenciais corretas
3. ✅ Aplicação rodando (`npm run dev`)

---

## 📝 ROTEIRO DE TESTES

### 1. Autenticação ✅

#### Teste de Cadastro

1. Acesse `/auth`
2. Clique em "Não tem conta? Cadastre-se"
3. Preencha:
   - Nome: Seu Nome
   - Username: seuusername (sem espaços)
   - Email: seu@email.com
   - Senha: mínimo 6 caracteres
4. Clique em "Criar conta"
5. ✅ **Esperado:** Toast de sucesso + mensagem para verificar email

#### Teste de Login

1. Na tela `/auth`
2. Digite email e senha
3. Clique em "Entrar"
4. ✅ **Esperado:** Redirecionamento para o Feed

#### Teste de Recuperação de Senha

1. Na tela `/auth`
2. Clique em "Esqueceu sua senha?"
3. Digite seu email
4. Clique em "Enviar Email de Recuperação"
5. ✅ **Esperado:**
   - Toast de sucesso
   - Ícone verde de confirmação
   - Mensagem "Email Enviado!"
   - Botão para voltar ao login

---

### 2. Tema Claro/Escuro ✅

1. No header, clique no ícone de lua/sol
2. ✅ **Esperado:**
   - Troca instantânea de tema
   - TODAS as cores mudam (header, cards, inputs, textos)
   - Inputs continuam legíveis
3. Recarregue a página (F5)
4. ✅ **Esperado:** Tema permanece o mesmo

**Verificar em:**

- ✅ Página de login
- ✅ Feed
- ✅ Comunidades
- ✅ Chat
- ✅ Perfil
- ✅ Todos os modals

---

### 3. Feed de Posts ✅

#### Criar Post

1. No Feed, digite algo no campo "O que está acontecendo?"
2. Clique em "Publicar"
3. ✅ **Esperado:**
   - Toast "Post criado com sucesso!"
   - Post aparece no topo do feed
   - Campo de texto limpa
   - Texto do post VISÍVEL no tema escuro

#### Visualizar Posts

1. Observe os posts no feed
2. ✅ **Esperado:**
   - Avatar do autor
   - Nome do autor
   - Username
   - Tempo relativo (ex: "5min", "1h")
   - Conteúdo do post LEGÍVEL
   - Botões de interação (curtir, comentar, etc)

---

### 4. Comunidades ✅

#### Criar Comunidade

1. Vá para `/communities`
2. Clique em "Criar Comunidade"
3. Preencha:
   - Nome: Nome da Comunidade
   - Categoria: escolha uma
   - Descrição: mínimo 10 caracteres
   - Regras: (opcional)
4. Clique em "Criar Comunidade"
5. ✅ **Esperado:**
   - Modal fecha
   - Toast "Comunidade criada com sucesso!"
   - Comunidade aparece na listagem
   - Botão mostra "Sair" (você é membro automaticamente)

#### Entrar/Sair de Comunidade

1. Encontre uma comunidade
2. Clique em "Participar"
3. ✅ **Esperado:**
   - Toast "Você entrou na comunidade!"
   - Botão muda para "Sair"
4. Clique em "Sair"
5. ✅ **Esperado:**
   - Toast "Você saiu da comunidade"
   - Botão volta para "Participar"

---

### 5. Chat em Tempo Real ✅

**IMPORTANTE:** Para testar, você precisa de 2 usuários. Pode usar:

- 2 navegadores diferentes (Chrome + Firefox)
- 1 navegador normal + 1 anônimo
- 2 dispositivos diferentes

#### Setup

1. **Navegador 1:** Login com usuário A
2. **Navegador 2:** Login com usuário B

#### Criar Conversa (Método Manual)

Como ainda não temos interface para iniciar conversa, você precisará criar no Supabase:

1. Acesse seu projeto Supabase
2. Vá em **Table Editor** → `conversations`
3. Clique em **Insert row**
4. Preencha:
   - `participant_one_id`: ID do usuário A (copie da tabela profiles)
   - `participant_two_id`: ID do usuário B
5. Salve

#### Testar Mensagens

1. **Ambos navegadores:** Acesse `/messages`
2. ✅ **Esperado:** Conversa aparece na lista
3. **Navegador 1:** Selecione a conversa
4. **Navegador 1:** Digite "Olá!" e envie
5. ✅ **Esperado:**
   - Mensagem aparece instantaneamente no Nav 1
   - Mensagem aparece à direita (azul/roxo)
6. **Navegador 2:** Verifique a conversa
7. ✅ **Esperado:**
   - Mensagem aparece automaticamente (SEM REFRESH!)
   - Mensagem aparece à esquerda (cinza)
8. **Navegador 2:** Responda "Oi!"
9. ✅ **Esperado:**
   - Ambos navegadores mostram a nova mensagem
   - Scroll automático para última mensagem
   - Tempo correto (ex: "agora", "1min")

---

### 6. Perfil ✅

1. Clique no seu avatar (canto superior direito)
2. ✅ **Esperado:**
   - Redirecionamento para `/profile/seu-username`
   - Banner (gradiente roxo)
   - Avatar grande
   - Username
   - Botão "Editar Perfil"
   - Contadores (0 posts, 0 seguidores, 0 seguindo)

---

### 7. Busca ✅

1. Vá para `/search`
2. Digite algo no campo de busca
3. ✅ **Esperado:**
   - Interface de busca aparece
   - Resultados mockados (ainda não conectado ao banco)

---

### 8. Desafios ✅

1. Vá para `/challenges`
2. ✅ **Esperado:**
   - Botão "Criar Desafio"
   - Cards de desafios (mockados)
   - Interface funcional

---

## 🎨 VERIFICAÇÃO DE DARK MODE

### Checklist Visual

Verifique em AMBOS os temas:

#### Inputs e Formulários

- ✅ Texto digitado está VISÍVEL
- ✅ Placeholder está visível mas mais claro
- ✅ Borda do input contrasta com fundo
- ✅ Background do input contrasta

#### Cards

- ✅ Background do card contrasta com página
- ✅ Texto do card é legível
- ✅ Bordas visíveis

#### Botões

- ✅ Texto do botão legível
- ✅ Hover muda cor
- ✅ Disabled fica opaco

#### Navegação

- ✅ Header legível
- ✅ Links mudam cor no hover
- ✅ Mobile nav legível

---

## 🐛 VERIFICAÇÃO DE ERROS

### Console do Navegador

1. Pressione F12
2. Vá para aba "Console"
3. ✅ **Esperado:** Nenhum erro vermelho
4. ⚠️ **Aceitável:** Warnings de desenvolvimento do React

### Funcionalidades que NÃO DEVEM ter erro:

- ✅ Criar conta
- ✅ Fazer login
- ✅ Trocar tema
- ✅ Criar post
- ✅ Criar comunidade
- ✅ Entrar em comunidade
- ✅ Enviar mensagem no chat
- ✅ Navegar entre páginas

---

## 📱 TESTE RESPONSIVO

### Desktop (> 768px)

- ✅ Navegação horizontal no header
- ✅ Comunidades em grid 2 colunas
- ✅ Chat com barra lateral

### Mobile (< 768px)

- ✅ Navegação fixa no rodapé
- ✅ Comunidades em coluna única
- ✅ Chat responsivo

**Testar:**

1. Pressione F12
2. Clique no ícone de dispositivo (Ctrl+Shift+M)
3. Escolha "iPhone 12 Pro" ou "Responsive"
4. Navegue pela aplicação

---

## ✅ CHECKLIST DE SUCESSO

Marque conforme testa:

### Autenticação

- [ ] Cadastro funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Recuperação de senha funciona

### Tema

- [ ] Alterna entre claro/escuro
- [ ] Persiste ao recarregar
- [ ] Todos inputs legíveis em ambos temas
- [ ] Todas páginas funcionam em ambos temas

### Posts

- [ ] Criar post funciona
- [ ] Posts aparecem no feed
- [ ] Texto legível em dark mode
- [ ] Loading aparece

### Comunidades

- [ ] Listar comunidades
- [ ] Criar comunidade
- [ ] Entrar em comunidade
- [ ] Sair de comunidade
- [ ] Validações funcionam

### Chat

- [ ] Listar conversas
- [ ] Enviar mensagem
- [ ] Receber em tempo real
- [ ] Scroll automático
- [ ] Texto legível

### Navegação

- [ ] Todas rotas acessíveis
- [ ] Redirect funciona quando não logado
- [ ] Mobile nav funciona
- [ ] Links funcionam

---

## 🚨 PROBLEMAS CONHECIDOS

### Limitações Atuais:

1. **Criar Conversa:** Não há interface para iniciar chat com outro usuário (precisa criar manualmente no Supabase)
2. **Upload de Imagens:** Não implementado ainda
3. **Likes/Comentários:** Botões existem mas não funcionam
4. **Busca:** Interface pronta mas não busca no banco
5. **Desafios:** Interface pronta mas CRUD não implementado
6. **Editar Perfil:** Botão existe mas modal não implementado

### Não São Bugs:

- Contador sempre em "0" (features não implementadas)
- Botões de like/comentar não fazem nada
- Alguns dados mockados

---

## 📞 SUPORTE

Se encontrar problemas:

1. ✅ Verifique se o SQL foi executado completamente
2. ✅ Verifique se as credenciais no `.env` estão corretas
3. ✅ Limpe o cache do navegador (Ctrl+Shift+Del)
4. ✅ Reinicie o servidor de desenvolvimento
5. ✅ Verifique o console (F12) para erros

---

## 🎉 SUCESSO!

Se todos os testes passaram, sua aplicação está **100% funcional** e pronta para uso!

**Funcionalidades Validadas:**

✅ Autenticação completa  
✅ Dark mode perfeito  
✅ Posts funcionando  
✅ Comunidades CRUD completo  
✅ Chat em tempo real  
✅ Navegação fluida  
✅ UI/UX profissional  

**Próximo passo:** Implementar as funcionalidades pendentes (likes, comentários, upload, etc.)
