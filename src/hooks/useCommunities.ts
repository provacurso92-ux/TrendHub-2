import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useCommunities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: communities, isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!creator_id(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createCommunity = useMutation({
    mutationFn: async (newCommunity: {
      name: string;
      description: string;
      category: string;
      rules?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('communities')
        .insert([{ ...newCommunity, creator_id: user.id }] as any)
        .select()
        .single();

      if (error) throw error;

      // Automatically join as admin
      await supabase
        .from('community_members')
        .insert([{ community_id: data.id, user_id: user.id, role: 'admin' }] as any);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Comunidade criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar comunidade');
    },
  });

  const updateCommunity = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: any;
    }) => {
      const { error } = await supabase
        .from('communities')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Comunidade atualizada!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar comunidade');
    },
  });

  const deleteCommunity = useMutation({
    mutationFn: async (id: string) => {
      console.log('1. Iniciando delete:', id);
      console.log('2. User atual:', (await supabase.auth.getUser()).data.user?.id);

      const { error: e1, data: d1 } = await supabase
        .from('community_posts')
        .delete()
        .eq('community_id', id)
        .select();
      console.log('3. community_posts:', { error: e1, data: d1 });

      const { error: e2, data: d2 } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', id)
        .select();
      console.log('4. community_members:', { error: e2, data: d2 });

      const { error: e3, data: d3 } = await supabase
        .from('communities')
        .delete()
        .eq('id', id)
        .select();
      console.log('5. communities:', { error: e3, data: d3 });

      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Comunidade excluída!');
    },
    onError: (error: any) => {
      console.log('ERRO FINAL:', JSON.stringify(error));
      toast.error(error.message || 'Erro ao excluir comunidade');
    },
  });

  return {
    communities: communities || [],
    isLoading,
    createCommunity,
    updateCommunity,
    deleteCommunity,
  };
}

export function useCommunityMembersCount(communityId: string) {
  const { data: count } = useQuery({
    queryKey: ['community-members-count', communityId],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!communityId,
  });

  return count || 0;
}

export function useCommunityMembership(communityId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: membership, isLoading } = useQuery({
    queryKey: ['community-membership', communityId],
    queryFn: async () => {
      if (!communityId || !profile?.id) return null;

      const { data, error } = await supabase
        .from('community_members')
        .select('id, role')
        .eq('community_id', communityId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!communityId && !!profile?.id,
    retry: false,
  });

  const isMember = !!membership;
  const isAdmin = membership?.role === 'admin';

  const joinCommunity = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('community_members')
        .insert([{ community_id: communityId, user_id: profile.id, role: 'member' }] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-membership', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      toast.success('Você entrou na comunidade!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao entrar na comunidade');
    },
  });

  const leaveCommunity = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-membership', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      toast.success('Você saiu da comunidade');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao sair da comunidade');
    },
  });

  return { isMember, isAdmin, isLoading, joinCommunity, leaveCommunity };
}

export function useCommunityPosts(communityId: string | null) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: posts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['community-posts', communityId],
    queryFn: async () => {
      if (!communityId) return [];

      const { data, error } = await supabase
        .from('community_posts')
        .select(`*, author:profiles!author_id(*)`)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!communityId,
    retry: false,
  });

  useEffect(() => {
    if (!communityId) return;

    const channelName = `community-posts-${communityId}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // ignore
      }
    };
  }, [communityId, queryClient]);

  const createPost = useMutation({
    retry: false,
    mutationFn: async (newPost: { content: string; mediaUrl?: string; mediaType?: string }) => {
      if (!communityId) throw new Error('No community selected');

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error('Not authenticated');

      const payload: any = {
        community_id: communityId,
        author_id: authData.user.id,
        content: newPost.content,
        media_url: newPost.mediaUrl || null,
        media_type: newPost.mediaType || null,
      };

      console.log('Payload do post:', payload);

      const { data, error } = await supabase
        .from('community_posts')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado:', error, { payload });
        throw error;
      }
      return data;
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData(['community-posts', communityId], (old: any) => [newPost, ...(old ?? [])]);
      toast.success('Post criado na comunidade!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar post');
    },
  });

  return {
    posts: posts || [],
    isLoading,
    error,
    createPost,
  };
}

export function useCommunityPostActions() {
  const queryClient = useQueryClient();

  const updatePost = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing, error: fetchErr } = await supabase
        .from('community_posts')
        .select('author_id')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;
      if (existing.author_id !== user.id) throw new Error('Forbidden');

      const { error } = await supabase
        .from('community_posts')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'], exact: false });
      toast.success('Publicação da comunidade atualizada!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar publicação da comunidade');
    },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: existing, error: fetchErr } = await supabase
        .from('community_posts')
        .select('author_id')
        .eq('id', postId)
        .single();

      if (fetchErr) throw fetchErr;
      if (existing.author_id !== user.id) throw new Error('Forbidden');

      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'], exact: false });
      toast.success('Publicação da comunidade excluída!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir publicação da comunidade');
    },
  });

  return {
    updatePost,
    deletePost,
  };
}
