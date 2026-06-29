import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import EditPostModal from './EditPostModal';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import SharePostModal from './SharePostModal';
import { useCommunityPostActions } from '@/hooks/useCommunities';
import { usePosts } from '@/hooks/usePosts';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useLike, useLikesCount } from '@/hooks/usePosts';
import { useCommentsCount } from '@/hooks/useComments';
import { CommentsList } from '@/components/CommentsList';
import { getVideoEmbed } from '@/lib/videoUtils';

interface PostCardProps {
  post: any;
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const { profile } = useAuth();
  const isCommunityPost = Boolean(post.community_id);
  const targetPostId = post.post_id ?? post.id;
  const { deletePost, updatePost } = isCommunityPost ? useCommunityPostActions() : usePosts();
  const { isLiked, toggleLike } = useLike(targetPostId);
  const likesCount = useLikesCount(targetPostId);
  const commentsCount = useCommentsCount(targetPostId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaveSupport, setHasSaveSupport] = useState(true);
  const [shareCount, setShareCount] = useState(0);
  const [shareRefreshKey, setShareRefreshKey] = useState(0);

  useEffect(() => {
    if (!targetPostId) return;

    let cancelled = false;

    const loadShares = async () => {
      try {
        const { data, error } = await supabase
          .from('post_shares')
          .select('id')
          .eq('post_id', targetPostId);

        if (cancelled) return;

        if (!error) {
          setShareCount(data?.length || 0);
        }
      } catch {
        if (!cancelled) {
          setShareCount(0);
        }
      }
    };

    loadShares();

    return () => {
      cancelled = true;
    };
  }, [post.id, shareRefreshKey]);

  useEffect(() => {
    if (!profile?.id || !targetPostId) return;

    let cancelled = false;

    const checkSaved = async () => {
      try {
        const { data, error } = await supabase
          .from('saved_posts')
          .select('id')
          .eq('user_id', profile.id)
          .eq('post_id', targetPostId)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          const message = error.message?.toLowerCase() || '';
          if (error.status === 404 || message.includes('does not exist') || message.includes('relation')) {
            setHasSaveSupport(false);
            setIsSaved(false);
            return;
          }

          setHasSaveSupport(true);
          setIsSaved(false);
          return;
        }

        setHasSaveSupport(true);
        setIsSaved(Boolean(data));
      } catch {
        if (!cancelled) {
          setHasSaveSupport(false);
          setIsSaved(false);
        }
      }
    };

    checkSaved();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, post.id]);

  const handleSaveToggle = async () => {
    if (!profile?.id || isSaving || !hasSaveSupport) return;

    setIsSaving(true);

    const payload = { user_id: profile.id, post_id: targetPostId };
    console.log('Salvando post:', payload, { post });

    try {
      if (isSaved) {
        await supabase.from('saved_posts').delete().eq('user_id', profile.id).eq('post_id', targetPostId);
        setIsSaved(false);
      } else {
        const { error } = await supabase.from('saved_posts').insert(payload);
        if (error) {
          console.error('Erro ao salvar:', JSON.stringify(error));
          throw error;
        }
        setIsSaved(true);
      }
    } catch (error: any) {
      const message = error?.message?.toLowerCase() || '';
      if (error?.status === 404 || message.includes('does not exist') || message.includes('relation')) {
        setHasSaveSupport(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Link to={`/profile/${post.profile?.username}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-violet-600 text-white">
                  {post.profile?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                to={`/profile/${post.profile?.username}`}
                className="font-bold text-gray-900 dark:text-gray-100 hover:underline"
              >
                {post.profile?.full_name || post.profile?.username}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{post.profile?.username} · {formatDate(post.created_at)}
              </p>
            </div>
          </div>
          <div className="relative">
            {profile?.id === post.user_id ? (
              <div>
                <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border rounded shadow-md z-50">
                    <EditPostModal post={post} updatePost={updatePost}>
                      <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">Editar</button>
                    </EditPostModal>
                    <ConfirmDeleteDialog onConfirm={async () => { await deletePost.mutateAsync(post.id); }}>
                      <button className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800">Excluir</button>
                    </ConfirmDeleteDialog>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="text-gray-500">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {shareCount > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-medium">
                <Share2 className="h-4 w-4" />
                Compartilhado
              </div>
              <p className="mt-1">
                Esta publicação já foi compartilhada {shareCount > 1 ? `${shareCount} vezes` : 'uma vez'}.
              </p>
              <p className="mt-1 text-xs opacity-80">Conteúdo compartilhado: {post.content || 'publicação'}</p>
            </div>
          )}

          <p className="text-gray-900 dark:text-gray-100 text-base whitespace-pre-wrap">
            {post.content}
          </p>

          {post.image_url && !imageError ? (
            <img
              src={post.image_url}
              alt="Post"
              className="rounded-2xl w-full object-cover max-h-96 border border-gray-200 dark:border-gray-800"
              onError={() => setImageError(true)}
            />
          ) : post.image_url && imageError ? (
            <div className="rounded-2xl w-full max-h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500">
              Imagem indisponível
            </div>
          ) : null}

          {post.video_url && !videoError ? (
            (() => {
              const videoEmbed = getVideoEmbed(post.video_url);
              
              if (videoEmbed.type === 'error') {
                setVideoError(true);
                return null;
              }
              
              if (videoEmbed.type === 'iframe') {
                return (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 aspect-video">
                    <iframe
                      src={videoEmbed.src}
                      allowFullScreen
                      className="w-full h-full"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      title="Video player"
                    />
                  </div>
                );
              }
              
              return (
                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <video
                    src={videoEmbed.src}
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                    className="w-full max-h-96"
                    onError={() => setVideoError(true)}
                  />
                </div>
              );
            })()
          ) : post.video_url && videoError ? (
            <div className="rounded-2xl w-full max-h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-800">
              <div className="text-center">
                <p className="font-semibold mb-2">Vídeo não pode ser carregado</p>
                <a href={post.video_url} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                  Abrir no site original →
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleLike.mutate()}
            className={`gap-2 ${
              isLiked
                ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950'
                : 'text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="font-medium">{likesCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">{commentsCount}</span>
          </Button>

          <SharePostModal postId={targetPostId} onShared={() => setShareRefreshKey((value) => value + 1)}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </SharePostModal>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveToggle}
            disabled={isSaving || !hasSaveSupport}
            title={hasSaveSupport ? (isSaved ? 'Remover dos salvos' : 'Salvar post') : 'Salvamento indisponível'}
            className={`gap-2 ${
              isSaved
                ? 'text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950'
                : 'text-gray-600 dark:text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950'
            }`}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
            <CommentsList postId={post.id} />
          </div>
        )}
      </div>
    </Card>
  );
}
