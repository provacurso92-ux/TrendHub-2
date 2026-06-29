-- Tabela de membros da comunidade
CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  role TEXT DEFAULT 'member',
  UNIQUE(community_id, user_id)
);

-- Tabela de posts da comunidade
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE community_members;
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;

-- Policies de community_members
CREATE POLICY IF NOT EXISTS "Ver membros da comunidade"
  ON community_members FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Entrar em comunidade"
  ON community_members FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Sair de comunidade"
  ON community_members FOR DELETE USING (user_id = auth.uid());

-- Policies de community_posts
CREATE POLICY IF NOT EXISTS "Membros veem posts da comunidade"
  ON community_posts FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Membros podem postar na comunidade"
  ON community_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND community_id IN (
      SELECT community_id FROM community_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Autor pode editar post"
  ON community_posts FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Autor pode deletar post"
  ON community_posts FOR DELETE USING (author_id = auth.uid());
