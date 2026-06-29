import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, TrendingUp, Hash, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CommunityCard } from '@/components/CommunityCard';

export function Search() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trends' | 'users' | 'communities'>('trends');
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: trendingTopics } = useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(200);

      const map: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        const matches = (p.content || '').match(/#(\w+)/g);
        if (matches) {
          matches.forEach((m: string) => {
            map[m] = (map[m] || 0) + 1;
          });
        }
      });

      const arr = Object.keys(map).map((k) => ({ name: k, posts: `${map[k]}` }));
      arr.sort((a, b) => Number(b.posts) - Number(a.posts));
      return arr.slice(0, 20);
    },
  });

  const { data: suggestedUsers = [], refetch: refetchUsers } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .neq('id', user.id)
        .limit(20);

      if (usersError) throw usersError;

      const userIds = (usersData || []).map((profile: any) => profile.id);

      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const { data: followerCountsData, error: followerCountsError } = userIds.length > 0
        ? await supabase
            .from('follows')
            .select('following_id')
            .in('following_id', userIds)
        : { data: [], error: null };

      if (followingError) throw followingError;
      if (followerCountsError) throw followerCountsError;

      const followingIds = new Set((followingData || []).map((item: any) => item.following_id));
      const followerCounts = (followerCountsData || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.following_id] = (acc[item.following_id] || 0) + 1;
        return acc;
      }, {});

      return (usersData || []).map((profile: any) => ({
        ...profile,
        isFollowing: followingIds.has(profile.id),
        followerCount: followerCounts[profile.id] || 0,
      }));
    },
    enabled: !!user?.id,
  });

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return suggestedUsers;

    const term = query.toLowerCase();
    return suggestedUsers.filter((userItem: any) => {
      const username = (userItem.username || '').toLowerCase();
      const fullName = (userItem.full_name || '').toLowerCase();
      const bio = (userItem.bio || '').toLowerCase();
      return username.includes(term) || fullName.includes(term) || bio.includes(term);
    });
  }, [query, suggestedUsers]);

  const toggleFollow = async (targetUserId: string, isFollowing: boolean) => {
    if (!user?.id || followLoadingId) return;

    setFollowLoadingId(targetUserId);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetUserId });

        if (error) throw error;
      }

      await refetchUsers();
    } catch (error) {
      console.error('Error toggling follow', error);
    } finally {
      setFollowLoadingId(null);
    }
  };

  const { data: communities } = useQuery({
    queryKey: ['search-communities', query],
    queryFn: async () => {
      let q = supabase.from('communities').select('*').eq('status', 'active');
      if (query.trim()) q = q.ilike('name', `%${query}%`);
      const { data } = await q.limit(20);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
            <SearchIcon className="h-6 w-6 text-cyan-600" />
            Explorar
          </h1>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar usuários, posts, comunidades..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-gray-100 dark:bg-gray-900 border-0"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'trends'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('communities')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'communities'
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Comunidades
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Trending Topics */}
        {activeTab === 'trends' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              Trends do Momento
            </h2>
              {(trendingTopics || []).map((topic: any, index: number) => (
              <Card key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer" onClick={() => navigate(`/?tag=${encodeURIComponent(topic.name.replace('#',''))}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {topic.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {topic.posts} posts
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Usuários Sugeridos
            </h2>
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(filteredUsers as any[]).map((u: any) => (
                  <Card key={u.id} className="overflow-hidden transition-all duration-300 cursor-default">
                    <div className="h-32 bg-violet-600" />

                    <div className="p-4 -mt-12">
                      <div className="flex items-end justify-between mb-4">
                        <Avatar className="h-20 w-20 border-4 border-white dark:border-gray-950 shadow-lg">
                          <AvatarImage src={u.avatar_url || ''} />
                          <AvatarFallback className="bg-violet-600 text-white text-2xl">
                            {u.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          size="sm"
                          variant={u.isFollowing ? 'outline' : 'default'}
                          className={u.isFollowing ? 'border-violet-600 text-violet-600 hover:text-violet-700' : ''}
                          disabled={followLoadingId === u.id}
                          onClick={() => toggleFollow(u.id, u.isFollowing)}
                        >
                          {followLoadingId === u.id ? 'Carregando...' : u.isFollowing ? 'Seguindo' : 'Seguir'}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {u.full_name || u.username}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{u.username}
                          </p>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {u.bio || 'Novo no TrendHub'}
                        </p>

                        <div className="flex items-center gap-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{u.followerCount} seguidores</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border border-gray-200 dark:border-gray-800">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum usuário encontrado para esta busca.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600" />
              Comunidades
            </h2>
            {communities && communities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(communities as any[]).map((c: any) => (
                  <CommunityCard key={c.id} community={c} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhuma comunidade encontrada.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
