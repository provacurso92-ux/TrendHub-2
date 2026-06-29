-- Creates table to store shared posts
CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shared_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, shared_by, shared_to)
);

ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário pode compartilhar"
  ON post_shares FOR INSERT
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Usuário vê seus compartilhamentos"
  ON post_shares FOR SELECT
  USING (shared_by = auth.uid() OR shared_to = auth.uid());
