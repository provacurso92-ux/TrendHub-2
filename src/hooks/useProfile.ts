import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useProfile(username: string) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', username],
    queryFn: async () => {
      if (!profile) return { posts: 0, followers: 0, following: 0 };

      const [postsResult, followersResult, followingResult] = await Promise.all([
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', (profile as any).id),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', (profile as any).id),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', (profile as any).id),
      ]);

      return {
        posts: postsResult.count || 0,
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
      };
    },
    enabled: !!profile,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates as any)
        .eq('username', username);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar perfil');
    },
  });

  return {
    profile,
    stats: stats || { posts: 0, followers: 0, following: 0 },
    isLoading,
    updateProfile,
  };
}

export function useFollow(userId: string) {
  const queryClient = useQueryClient();

  const { data: isFollowing, isLoading } = useQuery({
    queryKey: ['follow', userId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: userId }] as any);

        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['follow', userId] });
      await queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast.success(isFollowing ? 'Deixou de seguir' : 'Seguindo!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao seguir/deixar de seguir');
    },
  });

  return { isFollowing: !!isFollowing, isLoading, toggleFollow };
}
