import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function usePosts(options?: { tag?: string; userId?: string; search?: string }) {
  const queryClient = useQueryClient();
  const { tag, userId, search } = options || {};

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts', tag || userId || search || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profile:profiles(*)
        `);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (tag) {
        const clean = tag.replace('#', '');
        query = query.ilike('content', `%#${clean}%`);
      }

      if (search) {
        query = query.ilike('content', `%${search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const createPost = useMutation({
    mutationFn: async (newPost: { content: string; image_url?: string; video_url?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({ ...newPost, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar post');
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // verify ownership
      const { data: existing, error: fetchErr } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', id)
        .single();
      if (fetchErr) throw fetchErr;
      if (existing.user_id !== user.id) throw new Error('Forbidden');

      const { error } = await supabase
        .from('posts')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Publicação atualizada!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar publicação');
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // verify ownership
      const { data: existing, error: fetchErr } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();
      if (fetchErr) throw fetchErr;
      if (existing.user_id !== user.id) throw new Error('Forbidden');

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post excluído!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir post');
    },
  });

  // Realtime subscriptions: invalidate posts when likes/comments/posts change
  useEffect(() => {
    const channels: any[] = [];

    // Use unique channel names per hook instance to avoid adding callbacks after subscribe
    const postsChannelName = `posts-${Math.random().toString(36).slice(2)}`;
    const postsChannel = supabase
      .channel(postsChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      })
      .subscribe();
    channels.push(postsChannel);

    const likesChannelName = `likes-${Math.random().toString(36).slice(2)}`;
    const likesChannel = supabase
      .channel(likesChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['likes-count'] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      })
      .subscribe();
    channels.push(likesChannel);

    const commentsChannelName = `comments-${Math.random().toString(36).slice(2)}`;
    const commentsChannel = supabase
      .channel(commentsChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['comments-count'] });
        queryClient.invalidateQueries({ queryKey: ['comments'] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      })
      .subscribe();
    channels.push(commentsChannel);

    return () => {
      channels.forEach((c) => c.unsubscribe());
    };
  }, [queryClient]);

  return {
    posts: posts || [],
    isLoading,
    error,
    createPost,
    updatePost,
    deletePost,
  };
}

export function useLike(postId: string) {
  const queryClient = useQueryClient();

  const { data: isLiked } = useQuery({
    queryKey: ['like', postId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      // Se não encontrou (erro PGRST116), retorna false
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking like:', error);
      }

      return !!data;
    },
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id } as any);

        if (insertError) throw insertError;

        try {
          // notify post owner
          const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();
          const { data: liker } = await supabase.from('profiles').select('username,full_name').eq('id', user.id).single();
          if (post && post.user_id && liker) {
            await supabase.from('notifications').insert({
              user_id: post.user_id,
              actor_id: user.id,
              type: 'like',
              content: `${liker.full_name || liker.username} curtiu sua publicação`,
              reference_id: postId,
              read: false,
            } as any);
          }
        } catch (err) {
          console.error('Could not create like notification', err);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['like', postId] });
      queryClient.invalidateQueries({ queryKey: ['likes-count', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return { isLiked, toggleLike };
}

export function useLikesCount(postId: string) {
  const { data: count } = useQuery({
    queryKey: ['likes-count', postId],
    queryFn: async () => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      return count || 0;
    },
  });

  return count || 0;
}

export function usePostsByUser(userId: string) {
  return usePosts({ userId });
}
