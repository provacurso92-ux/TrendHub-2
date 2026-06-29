import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useComments(postId: string) {
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!postId,
  });

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      try {
        const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
        const { data: commenter } = await supabase.from('profiles').select('username,full_name').eq('id', user.id).single();
        if (post && post.user_id && commenter) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'comment',
            content: `${commenter.full_name || commenter.username} comentou na sua publicação`,
            reference_id: postId,
            read: false,
          } as any);
        }
      } catch (err) {
        console.error('Could not create comment notification', err);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments-count', postId] });
      toast.success('Comentário adicionado!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao comentar');
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['comments-count', postId] });
      toast.success('Comentário removido!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao remover comentário');
    },
  });

  return {
    comments: comments || [],
    isLoading,
    createComment,
    deleteComment,
  };
}

export function useCommentsCount(postId: string) {
  const { data: count } = useQuery({
    queryKey: ['comments-count', postId],
    queryFn: async () => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return count || 0;
    },
  });

  return count || 0;
}
