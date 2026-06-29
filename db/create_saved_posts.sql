CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário salva posts"
  ON saved_posts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário vê seus salvos"
  ON saved_posts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuário remove seus salvos"
  ON saved_posts FOR DELETE
  USING (user_id = auth.uid());
