import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Link as LinkIcon, Calendar, Users, FileText, TrendingUp } from 'lucide-react';
import { useProfile, useFollow } from '@/hooks/useProfile';
import { usePostsByUser } from '@/hooks/usePosts';
import { EditProfileDialog } from '@/components/EditProfileDialog';
import { useAuth } from '@/contexts/AuthContext';

export function Profile() {
  const { username } = useParams();
  const { profile, stats, isLoading } = useProfile(username || '');
  const { profile: currentUserProfile } = useAuth();
  const isOwnProfile = !!profile && !!currentUserProfile && currentUserProfile.id === profile.id;
  const { isFollowing, isLoading: isFollowLoading, toggleFollow } = useFollow(profile?.id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Usuário não encontrado
          </h2>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          {/* Banner */}
          {profile.banner_url ? (
            <div className="h-48">
              <img
                src={profile.banner_url}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-48 bg-violet-600" />
          )}

          {/* Profile Info */}
          <div className="p-6 -mt-16">
            <div className="flex items-end justify-between mb-4">
              <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-950 shadow-xl">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="text-5xl bg-violet-600 text-white">
                  {profile.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile ? (
                <EditProfileDialog />
              ) : (
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={() => toggleFollow.mutate()}
                  disabled={isFollowLoading || toggleFollow.isPending}
                >
                  {isFollowLoading || toggleFollow.isPending ? '...' : isFollowing ? 'Deixar de seguir' : 'Seguir'}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                  @{profile.username}
                </p>
              </div>

              {profile.bio && (
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Entrou em {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-600" />
                  <div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {stats.posts}
                    </span>{' '}
                    <span className="text-gray-500 dark:text-gray-400">Posts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {stats.followers}
                    </span>{' '}
                    <span className="text-gray-500 dark:text-gray-400">Seguidores</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-600" />
                  <div>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {stats.following}
                    </span>{' '}
                    <span className="text-gray-500 dark:text-gray-400">Seguindo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mt-4 space-y-4">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Publicações
            </h2>
            <UserPosts userId={profile.id} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function UserPosts({ userId }: { userId: string }) {
  const { posts, isLoading } = usePostsByUser(userId as string);

  if (isLoading) return <p>Carregando...</p>;
  if (!posts || posts.length === 0) return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhuma publicação ainda</p>;

  return (
    <div className="space-y-4">
      {posts.map((p: any) => (
        <div key={p.id} className="border rounded-lg p-3">
          <p className="text-gray-900 dark:text-gray-100">{p.content}</p>
          {p.image_url && <img src={p.image_url} alt="post" className="mt-2 rounded max-h-56 object-cover w-full" />}
        </div>
      ))}
    </div>
  );
}
