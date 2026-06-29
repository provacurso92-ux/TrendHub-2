import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PostCard } from '@/components/PostCard';
import { Card } from '@/components/ui/card';
import { Loader2, Bookmark } from 'lucide-react';

export function SavedPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadSavedPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_posts')
        .select('post_id, posts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        const normalized = (data || []).map((item: any) => ({
          ...item.posts,
          id: item.posts?.id ?? item.post_id,
        }));
        setPosts(normalized);
      }
      setLoading(false);
    };

    loadSavedPosts();
  }, [user]);

  const content = useMemo(() => posts.filter(Boolean), [posts]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 lg:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Posts Salvos</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : content.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Você ainda não salvou nenhum post.</p>
          </Card>
        ) : (
          content.map((post: any) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
