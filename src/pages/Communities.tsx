import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useCommunities } from '@/hooks/useCommunities';
import { CreateCommunityDialog } from '@/components/CreateCommunityDialog';
import { CommunityCard } from '@/components/CommunityCard';
import { Users, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function Communities() {
  const { communities, isLoading } = useCommunities();
  const { user } = useAuth();

  const { data: suggestedCommunities = [] } = useQuery({
    queryKey: ['suggested-communities'],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('communities')
        .select('id, name, description, category, avatar_url, banner_url, creator_id')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const { data: membershipsData, error: membershipsError } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipsError) throw membershipsError;

      const joinedIds = new Set((membershipsData || []).map((item: any) => item.community_id));

      return (data || []).filter((community: any) => !joinedIds.has(community.id));
    },
    enabled: !!user?.id,
  });

  const visibleCommunities = useMemo(() => {
    return (suggestedCommunities as any[]).slice(0, 6);
  }, [suggestedCommunities]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-600" />
            Comunidades
          </h1>
          <CreateCommunityDialog />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {!isLoading && visibleCommunities.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Comunidades sugeridas
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(visibleCommunities as any[]).map((community: any) => (
                <Card key={community.id} className="overflow-hidden transition-all duration-300">
                  {community.banner_url ? (
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${community.banner_url})` }} />
                  ) : (
                    <div className="h-32 bg-cyan-600" />
                  )}

                  <div className="p-4 -mt-12">
                    <div className="flex items-end justify-between mb-4">
                      <Avatar className="h-20 w-20 border-4 border-white dark:border-gray-950 shadow-lg">
                        <AvatarImage src={community.avatar_url || ''} />
                        <AvatarFallback className="bg-cyan-600 text-white text-2xl">
                          <Users className="h-10 w-10" />
                        </AvatarFallback>
                      </Avatar>
                      <Button size="sm" onClick={() => window.location.assign(`/communities/${community.id}`)}>
                        Explorar
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {community.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {community.category}
                        </p>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {community.description}
                      </p>

                      <div className="flex items-center gap-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Nova comunidade</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && communities.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-cyan-600 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Nenhuma comunidade ainda
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Seja o primeiro a criar uma comunidade e reunir pessoas com interesses em comum!
              </p>
            </div>
          </Card>
        )}

        {/* Communities Grid */}
        {!isLoading && communities.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {communities.map((community: any) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
