# 🔧 Guia de Solução de Problemas - TrendHub

## ⚠️ Avisos do Console que PODEM SER IGNORADOS

Estes são warnings do navegador sobre o iframe de preview e NÃO afetam a aplicação:

```
Unrecognized feature: 'vr'
Unrecognized feature: 'ambient-light-sensor'
Unrecognized feature: 'battery'
An iframe which has both allow-scripts and allow-same-origin...
```

**Solução:** Ignorar. São do ambiente de preview, não da sua aplicação.

---

## 🎨 PROBLEMA: Tema não está alternando

### Sintomas:
- Clico no botão de Lua/Sol
- Nada acontece
- Tema não muda

### Solução:

1. **Verifique o localStorage:**
```javascript
// Abra o console (F12) e digite:
localStorage.getItem('theme')
```

2. **Limpe o cache:**
```javascript
localStorage.clear()
window.location.reload()
```

3. **Teste manual:**
```javascript
// No console:
document.documentElement.classList.add('dark')
// Deve ficar escuro

document.documentElement.classList.remove('dark')
// Deve ficar claro
```

### Se ainda não funcionar:

**Causa:** Tailwind CSS 4 pode não estar processando `dark:` corretamente

**Verificação rápida:**
1. Inspecione um elemento (F12)
2. Adicione manualmente a classe `dark` no `<html>`
3. Se mudar, o Tailwind funciona
4. Se não mudar, precisa recompilar

**Solução:**
```bash
# Pare o servidor
Ctrl+C

# Limpe o cache do Vite
rm -rf node_modules/.vite

# Reinicie
npm run dev
```

---

## ❤️ PROBLEMA: Curtidas não estão salvando (erro 406)

### Sintomas:
```
Failed to load resource: the server responded with a status of 406
```

### Causa:
O Supabase não consegue retornar dados no formato esperado

### Solução Implementada:
✅ Hook `useLike` já corrigido com `.maybeSingle()`

### Se ainda der erro 406:

**1. Verifique a tabela no Supabase:**
```sql
-- No Supabase SQL Editor, execute:
SELECT * FROM likes LIMIT 10;
```

Se der erro "relation does not exist":
```sql
-- Criar tabela
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);
```

**2. Verifique RLS:**
```sql
-- Habilitar RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Permitir leitura
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT USING (true);

-- Permitir inserir
DROP POLICY IF EXISTS "Users can like posts" ON likes;
CREATE POLICY "Users can like posts"
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir deletar
DROP POLICY IF EXISTS "Users can unlike posts" ON likes;
CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE USING (auth.uid() = user_id);
```

**3. Teste manual:**
```sql
-- Pegar seu user_id
SELECT id FROM auth.users LIMIT 1;

-- Pegar um post_id
SELECT id FROM posts LIMIT 1;

-- Tentar inserir
INSERT INTO likes (user_id, post_id)
VALUES ('seu-user-id', 'algum-post-id');

-- Se funcionar, o problema é no frontend
-- Se der erro, o problema é no banco
```

---

## 📝 PROBLEMA: Área de criar posts está estranha

### Sintomas:
- Textarea sem borda
- Layout quebrado
- Difícil de ver onde digitar

### Solução:
✅ Já corrigido! Textarea agora tem borda e altura adequada.

### Se ainda estiver estranho:

**Recarregue a aplicação:**
```bash
# Ctrl+C para parar
npm run dev
# Aguarde compilar
# F5 no navegador
```

---

## 🗄️ PROBLEMA: Dados não estão salvando

### Checklist:

**1. Usuário está autenticado?**
```javascript
// No console:
const { data } = await supabase.auth.getUser()
console.log(data.user) // Deve mostrar seu usuário
```

**2. Tabela existe?**
```sql
-- No Supabase SQL Editor:
SELECT * FROM posts LIMIT 1;
SELECT * FROM communities LIMIT 1;
SELECT * FROM likes LIMIT 1;
```

**3. RLS está configurado?**
```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

**4. Permissões corretas?**
```sql
-- Testar insert direto
INSERT INTO posts (user_id, content)
VALUES (auth.uid(), 'Teste');

-- Se funcionar = problema no frontend
-- Se falhar = problema nas policies
```

---

## 🌐 PROBLEMA: Erro de CORS

### Sintomas:
```
Access to fetch has been blocked by CORS policy
```

### Causa:
URL do Supabase incorreta ou chave inválida

### Solução:

**1. Verifique o .env:**
```env
VITE_SUPABASE_URL=https://yunnczubsugyeegdxxsd.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

**2. Reinicie após mudar .env:**
```bash
# Ctrl+C
npm run dev
```

**3. Verifique se as variáveis estão sendo lidas:**
```javascript
// No console:
console.log(import.meta.env.VITE_SUPABASE_URL)
// Deve mostrar a URL, não undefined
```

---

## 🔄 PROBLEMA: Dados não atualizam após refresh

### Sintomas:
- Crio um post
- Recarrego a página
- Post sumiu

### Causa:
Dados não estão sendo salvos no Supabase

### Solução:

**1. Verifique o console do navegador:**
- F12 → Console
- Procure por erros em vermelho
- Copie e cole aqui para análise

**2. Verifique o Network:**
- F12 → Network
- Crie um post
- Veja se aparece request para `/rest/v1/posts`
- Status deve ser 201 (Created)
- Se for 401/403 = problema de auth/RLS
- Se for 400 = dados inválidos
- Se for 500 = erro no servidor

**3. Verifique direto no Supabase:**
- Vá em Table Editor
- Abra a tabela `posts`
- Veja se o post está lá
- Se estiver = problema no frontend ao buscar
- Se não estiver = problema ao salvar

---

## 🚨 SOLUÇÃO RÁPIDA GERAL

Se nada funciona:

```bash
# 1. Pare o servidor
Ctrl+C

# 2. Limpe tudo
rm -rf node_modules/.vite
rm -rf dist

# 3. Reinstale (se necessário)
npm install

# 4. Reinicie
npm run dev

# 5. Force reload no navegador
Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
```

---

## 📊 CHECKLIST DE FUNCIONALIDADES

Use este checklist para verificar o que está funcionando:

### Autenticação:
- [ ] Consigo criar conta
- [ ] Consigo fazer login
- [ ] Consigo fazer logout
- [ ] Sessão persiste ao recarregar

### Tema:
- [ ] Botão de tema alterna
- [ ] Todas as cores mudam
- [ ] Tema persiste ao recarregar

### Posts:
- [ ] Consigo criar post
- [ ] Post aparece no feed
- [ ] Post permanece após reload
- [ ] Consigo curtir
- [ ] Curtida aparece (coração vermelho)
- [ ] Contador de likes atualiza

### Comunidades:
- [ ] Consigo criar comunidade
- [ ] Comunidade aparece na lista
- [ ] Comunidade permanece após reload
- [ ] Consigo entrar/sair

### Chat:
- [ ] Vejo lista de conversas
- [ ] Consigo enviar mensagem
- [ ] Mensagem aparece
- [ ] Mensagem permanece após reload

---

## 🆘 AINDA COM PROBLEMAS?

**Informações para fornecer:**

1. **Screenshot do erro** (se houver)
2. **Mensagens do console** (F12 → Console)
3. **O que você tentou fazer** (passo a passo)
4. **O que aconteceu** vs **O que deveria acontecer**
5. **Navegador e versão** (Chrome 120, Firefox 121, etc)

**Logs importantes:**

```javascript
// Cole isso no console e envie o resultado:
console.log('Auth:', await supabase.auth.getUser())
console.log('Posts:', await supabase.from('posts').select('*').limit(5))
console.log('Env:', import.meta.env.VITE_SUPABASE_URL)
```

---

## ✅ TUDO FUNCIONANDO?

Se seguiu este guia e tudo está OK:
- ✅ Tema funciona
- ✅ Posts salvam
- ✅ Curtidas funcionam
- ✅ Sem erros críticos no console

**Próximos passos:**
1. Implementar upload de imagens
2. Finalizar sistema de comentários
3. Adicionar notificações em tempo real

**Divirta-se usando o TrendHub!** 🎉
