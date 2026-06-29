import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FollowItem {
  following_id: string;
  profiles: { id: string; username: string; avatar_url?: string | null } | null;
}

export function SharePostModal({ postId, children, onShared }: { postId: string; children: React.ReactNode; onShared?: () => void }) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      if (!profile) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('following_id, profiles!following_id(id, username, avatar_url)')
          .eq('follower_id', profile.id);
        if (error) throw error;
        setFollows((data as FollowItem[]) || []);
      } catch (err) {
        console.error('Erro buscando seguidores:', err);
        toast.error('Não foi possível carregar perfis');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, profile]);

  const filtered = follows.filter((f) => f.profiles && f.profiles.username.toLowerCase().includes(query.toLowerCase()));

  const handleSend = async (toId: string) => {
    if (!user) {
      toast.error('Faça login para compartilhar');
      return;
    }

    try {
      const { data: existing, error: checkError } = await supabase
        .from('post_shares')
        .select('id')
        .eq('post_id', postId)
        .eq('shared_by', user.id)
        .eq('shared_to', toId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast.info('Você já compartilhou este post com essa pessoa');
        setOpen(false);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('content')
        .eq('id', postId)
        .maybeSingle();

      if (postError) throw postError;

      const { error: shareError } = await supabase.from('post_shares').insert({ post_id: postId, shared_by: user.id, shared_to: toId });
      if (shareError) throw shareError;

      const { data: existingConversation, error: conversationCheckError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_one_id.eq.${user.id},participant_two_id.eq.${toId}),and(participant_one_id.eq.${toId},participant_two_id.eq.${user.id})`)
        .maybeSingle();

      if (conversationCheckError) throw conversationCheckError;

      let conversationId = existingConversation?.id;

      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({ participant_one_id: user.id, participant_two_id: toId })
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConv?.id;
      }

      const contentPreview = (postData?.content || 'uma publicação').trim();
      const previewText = contentPreview.length > 140 ? `${contentPreview.slice(0, 137)}...` : contentPreview;

      const { error: messageError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `📎 Post compartilhado: ${previewText}`,
        post_id: postId,
      });

      if (messageError) throw messageError;

      onShared?.();
      toast.success('Post compartilhado no chat!');
      setOpen(false);
    } catch (err: any) {
      console.error('Erro compartilhando post:', err);
      const msg = err?.message || 'Erro ao compartilhar';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Compartilhar publicação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input placeholder="Buscar pessoas que você segue" value={query} onChange={(e) => setQuery(e.target.value)} />

          <div className="max-h-60 overflow-y-auto space-y-2">
            {loading ? (
              <p className="text-center text-sm text-gray-500">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-500">Nenhum perfil encontrado</p>
            ) : (
              filtered.map((f) => (
                <div key={f.following_id} className="flex items-center justify-between gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {f.profiles?.avatar_url ? (
                        <AvatarImage src={f.profiles.avatar_url} />
                      ) : (
                        <AvatarFallback className="bg-violet-600 text-white">{f.profiles?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{f.profiles?.full_name || f.profiles?.username}</div>
                      <div className="text-sm text-gray-500">@{f.profiles?.username}</div>
                    </div>
                  </div>
                  <div>
                    <Button onClick={() => handleSend(f.profiles!.id)}>Enviar</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SharePostModal;
