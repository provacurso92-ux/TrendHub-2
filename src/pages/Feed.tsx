import { usePosts } from '@/hooks/usePosts';
import { useSearchParams } from 'react-router-dom';
import { PostCard } from '@/components/PostCard';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';

export function Feed() {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag') || undefined;
  const { posts, isLoading } = usePosts({ tag });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-violet-600" />
            Feed de Trends
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Create Post removed (use modal via sidebar) */}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        )}

        {/* Posts */}
        {!isLoading && posts.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-violet-600 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Nenhuma publicação ainda
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Seja o primeiro a criar um post e iniciar uma trend!
              </p>
            </div>
          </Card>
        )}

        {!isLoading && posts.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
