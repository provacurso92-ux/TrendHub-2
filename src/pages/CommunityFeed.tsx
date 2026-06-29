import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityMembership, useCommunityMembersCount, useCommunityPosts } from '@/hooks/useCommunities';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Users, Image, Video } from 'lucide-react';
import { getVideoEmbed } from '@/lib/videoUtils';

export function CommunityFeed() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, loading: authLoading } = useAuth();
  const { isMember, isAdmin, isLoading: membershipLoading, leaveCommunity } = useCommunityMembership(id || '');
  const membersCount = useCommunityMembersCount(id || '');
  const { posts, isLoading: postsLoading, error: postsError, createPost } = useCommunityPosts(id);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | ''>('');
  const [useUploadMode, setUseUploadMode] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ imageUrl?: string | null; title?: string | null; domain?: string | null } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data: community,
    isLoading: communityLoading,
    error: communityError,
  } = useQuery({
    queryKey: ['community', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!creator_id(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    retry: false,
  });

  const isReady = !communityLoading && !authLoading && !membershipLoading;

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isDirectImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(url);

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!id) {
      navigate('/communities');
      return;
    }

    if (isReady && community && !isMember) {
      navigate('/communities');
    }
  }, [id, isReady, community, isMember, navigate]);

  useEffect(() => {
    if (selectedFile) {
      setPreviewMeta(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    if (!mediaUrl) {
      setPreviewUrl(null);
      setPreviewMeta(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    if (mediaType === 'video') {
      setPreviewMeta(null);
      setPreviewError(null);
      const embed = getVideoEmbed(mediaUrl);
      if (embed.type === 'error') {
        setPreviewUrl(null);
        return;
      }
      setPreviewUrl(mediaUrl);
      return;
    }

    if (mediaType === 'image') {
      if (!isValidUrl(mediaUrl)) {
        setPreviewUrl(null);
        setPreviewMeta(null);
        setPreviewError('URL inválida');
        setPreviewLoading(false);
        return;
      }

      if (isDirectImageUrl(mediaUrl)) {
        setPreviewMeta(null);
        setPreviewError(null);
        setPreviewUrl(mediaUrl);
        setPreviewLoading(false);
        return;
      }

      const controller = new AbortController();
      const fetchPreview = async () => {
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewMeta(null);
        setPreviewUrl(null);

        try {
          const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(mediaUrl)}`, {
            signal: controller.signal,
          });
          const data = await res.json();

          if (!res.ok || !data?.data) {
            throw new Error('Erro ao buscar metadata');
          }

          const imageUrl = data.data.image?.url ?? null;
          const title = data.data.title ?? null;
          const domain = getDomain(mediaUrl);

          setPreviewMeta({ imageUrl, title, domain });
          setPreviewUrl(imageUrl);
        } catch (error) {
          if (controller.signal.aborted) return;
          setPreviewError('Não foi possível carregar o preview da URL');
          setPreviewMeta(null);
          setPreviewUrl(null);
        } finally {
          if (!controller.signal.aborted) {
            setPreviewLoading(false);
          }
        }
      };

      fetchPreview();
      return () => controller.abort();
    }
  }, [mediaUrl, mediaType, selectedFile]);

  const normalizedPosts = useMemo(() => {
    return posts.map((post: any) => ({
      ...post,
      user_id: post.author_id,
      profile: post.author,
      image_url: post.media_type === 'image' ? post.media_url : undefined,
      video_url: post.media_type === 'video' ? post.media_url : undefined,
    }));
  }, [posts]);

  const displayPreviewUrl = selectedFile ? localPreviewUrl : previewUrl;

  const handleImageUpload = async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop() ?? 'png';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('community-media')
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !mediaUrl) return;
    if (!id) {
      console.error('community_id está ausente ao publicar post');
      return;
    }

    let uploadUrl = null;
    if (selectedFile) {
      try {
        uploadUrl = await handleImageUpload(selectedFile);
      } catch (error) {
        console.error('Erro ao enviar imagem:', error);
        return;
      }
    }

    const payload = {
      content,
      mediaUrl: uploadUrl ?? (mediaType === 'video' ? mediaUrl : undefined),
      mediaType: selectedFile ? 'image' : mediaType || undefined,
    };

    console.log('Payload do post:', {
      ...payload,
      community_id: id,
    });

    try {
      await createPost.mutateAsync(payload);
      setContent('');
      setMediaUrl('');
      setMediaType('');
      setSelectedFile(null);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
      setLocalPreviewUrl(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['community-posts', id] });
    } catch (error) {
      console.error('Erro ao publicar post:', error);
    }
  };

  if (communityLoading || membershipLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
      </div>
    );
  }

  if (communityError) {
    return (
      <div className="min-h-screen p-4">
        <Card className="p-8 max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Erro ao carregar comunidade</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Não foi possível encontrar essa comunidade.</p>
          <Button className="mt-6" onClick={() => navigate('/communities')}>
            Voltar para Comunidades
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/communities')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Comunidade</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{community?.name}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Card className="overflow-hidden">
          {community?.banner_url ? (
            <div className="h-56 bg-cover bg-center" style={{ backgroundImage: `url(${community.banner_url})` }} />
          ) : (
            <div className="h-56 bg-violet-600" />
          )}
          <div className="p-6 -mt-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-950 shadow-xl">
                  <AvatarImage src={community?.avatar_url || ''} />
                  <AvatarFallback className="bg-violet-600 text-white text-3xl">
                    {community?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{community?.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{community?.category}</p>
                </div>
              </div>
              <div className="space-y-3 text-right">
                <div className="space-y-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{membersCount} membros</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    <Users className="h-4 w-4" />
                    {community?.status === 'active' ? 'Ativa' : 'Arquivada'}
                  </span>
                </div>
                {isMember && !isAdmin && (
                  <Button variant="destructive" onClick={() => setShowLeaveConfirm(true)}>
                    Sair da comunidade
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-6 text-gray-700 dark:text-gray-300 whitespace-pre-line">{community?.description}</p>
          </div>
        </Card>

        {isMember ? (
          <Card className="p-6">
            <div className="flex gap-4 items-start">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-violet-600 text-white">
                  {profile?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder="O que você quer postar?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                />

                <div className="grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setMediaType('image')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${mediaType === 'image' ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'}`}
                  >
                    <Image className="inline-block mr-2 h-4 w-4" />
                    Imagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${mediaType === 'video' ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'}`}
                  >
                    <Video className="inline-block mr-2 h-4 w-4" />
                    Vídeo
                  </button>
                  <Input
                    placeholder={mediaType === 'video' ? 'Cole a URL do vídeo' : 'Cole a URL da imagem'}
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="col-span-3"
                  />
                </div>

                {mediaType === 'image' && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setUseUploadMode(true)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium ${useUploadMode ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'}`}
                    >
                      ⬆️ Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseUploadMode(false)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium ${!useUploadMode ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'}`}
                    >
                      🔗 URL
                    </button>
                  </div>
                )}

                {mediaType === 'image' && useUploadMode && (
                  <div className="mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const preview = URL.createObjectURL(file);
                        setLocalPreviewUrl(preview);
                        setSelectedFile(file);
                        setMediaUrl(preview);
                        setPreviewUrl(preview);
                        setPreviewMeta(null);
                        setPreviewError(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Enviando imagem...' : 'Selecionar imagem'}
                    </Button>
                  </div>
                )}

                {previewLoading ? (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2">Carregando preview...</p>
                  </div>
                ) : previewError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-950 p-4 text-center text-red-600">
                    {previewError}
                  </div>
                ) : previewMeta ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    {previewMeta.imageUrl ? (
                      <img src={previewMeta.imageUrl} alt={previewMeta.title || 'Preview'} className="w-full object-cover max-h-80" />
                    ) : null}
                    <div className="p-4 bg-white dark:bg-gray-950">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{previewMeta.title || 'Preview de link'}</p>
                      {previewMeta.domain ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{previewMeta.domain}</p>
                      ) : null}
                    </div>
                  </div>
                ) : previewUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    {mediaType === 'image' ? (
                      <img src={previewUrl} alt="Preview" className="w-full object-contain" />
                    ) : (
                      (() => {
                        const videoEmbed = getVideoEmbed(previewUrl);
                        if (videoEmbed.type === 'iframe') {
                          return (
                            <div className="aspect-video">
                              <iframe
                                src={videoEmbed.src}
                                className="w-full h-full"
                                allowFullScreen
                                sandbox="allow-scripts allow-same-origin allow-presentation"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              />
                            </div>
                          );
                        }
                        if (videoEmbed.type === 'video') {
                          return (
                            <video src={videoEmbed.src} controls className="w-full max-h-96" />
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    onClick={handleCreatePost}
                    disabled={createPost.isPending || (!content.trim() && !mediaUrl)}
                  >
                    {createPost.isPending ? 'Publicando...' : 'Publicar'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-gray-700 dark:text-gray-300">Apenas membros podem ver o feed e criar posts nesta comunidade.</p>
          </Card>
        )}

        <div className="space-y-4">
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
            </div>
          ) : postsError ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Erro ao carregar posts</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Tente novamente mais tarde.</p>
            </Card>
          ) : normalizedPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nenhuma publicação ainda</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Seja o primeiro a postar nesta comunidade.</p>
            </Card>
          ) : (
            normalizedPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </div>

      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sair da comunidade?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Você não verá mais as publicações desta comunidade.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await leaveCommunity.mutateAsync();
                  navigate('/communities');
                } catch (error) {
                  console.error(error);
                } finally {
                  setShowLeaveConfirm(false);
                }
              }}
            >
              Sair
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
