import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageCropModal } from '@/components/ImageCropModal';
import { useUpload } from '@/hooks/useUpload';
import { usePosts } from '@/hooks/usePosts';
import { getVideoEmbed, isVideoUrl } from '@/lib/videoUtils';
import { toast } from 'sonner';
import { Check, X, Image, Video, Plus } from 'lucide-react';

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
}

function isYouTube(url: string) {
  return /(?:youtube.com\/watch\?v=|youtu.be\/)/i.test(url);
}

function isVimeo(url: string) {
  return /vimeo.com\//i.test(url);
}

async function fetchUrlPreview(url: string) {
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (data.status === 'success') {
      return {
        title: data.data.title,
        image: data.data.image?.url,
        description: data.data.description,
        url,
      };
    }
  } catch (err) {
    // ignore error and return null
  }

  return null;
}

async function validateUrlIsImage(url: string) {
  if (isImageUrl(url)) return true;

  try {
    const preview = await fetchUrlPreview(url);
    return Boolean(preview?.image);
  } catch (err) {
    return false;
  }
}

interface CreatePostModalProps {
  triggerClassName?: string;
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
  triggerChildren?: ReactNode;
}

export function CreatePostModal({ triggerClassName, triggerSize, triggerChildren }: CreatePostModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [useUploadMode, setUseUploadMode] = useState(true);
  const [mediaUrl, setMediaUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [pendingFileForCrop, setPendingFileForCrop] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadFile, uploading } = useUpload('posts');
  const { createPost } = usePosts();

  useEffect(() => {
    setPreviewUrl(null);
  }, [mediaType]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // open crop modal first
    const preview = URL.createObjectURL(file);
    setCropImage(preview);
    setPendingFileForCrop(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleValidateAndPreview = async () => {
    if (!mediaUrl) {
      setPreviewUrl(null);
      return;
    }

    if (mediaType === 'image') {
      const ok = await validateUrlIsImage(mediaUrl);
      if (!ok) {
        toast.error('A URL não aponta para uma imagem válida');
        setPreviewUrl(null);
        return false;
      }
      setPreviewUrl(mediaUrl);
      return true;
    }

    if (mediaType === 'video') {
      const videoEmbed = getVideoEmbed(mediaUrl);
      
      if (videoEmbed.type === 'error') {
        toast.error(videoEmbed.error || 'URL de vídeo inválida');
        setPreviewUrl(null);
        return false;
      }
      
      setPreviewUrl(mediaUrl);
      return true;
    }

    return true;
  };

  const handlePublish = async () => {
    if (!content.trim() && !mediaUrl) {
      toast.error('O post precisa de texto ou mídia');
      return;
    }

    if (mediaUrl) {
      const ok = await handleValidateAndPreview();
      if (!ok) return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = { content };
      if (mediaType === 'image' && mediaUrl) payload.image_url = mediaUrl;
      if (mediaType === 'video' && mediaUrl) payload.video_url = mediaUrl;

      console.debug('Creating post payload:', payload);
      await createPost.mutateAsync(payload);
      toast.success('Post publicado!');
      setOpen(false);
      setContent('');
      setMediaUrl('');
      setPreviewUrl(null);
      setMediaType(null);
    } catch (err: any) {
      console.error('Create post error:', err);
      const message = err?.message || (err?.error && err.error.message) || 'Erro ao publicar';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName ?? 'w-full mt-4'} size={triggerSize ?? 'lg'}>
          {triggerChildren ?? (
            <>
              <PlusIcon /> Criar Post
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="flex flex-col max-h-[85vh]">
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-zinc-800">
            <h2 className="text-lg font-bold">Criar Publicação</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <Label>Conteúdo</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
            </div>

            <div>
              <Label>Tipo de mídia</Label>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`px-3 py-2 rounded ${mediaType === 'image' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Image className="inline-block mr-2" /> Foto
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`px-3 py-2 rounded ${mediaType === 'video' ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Video className="inline-block mr-2" /> Vídeo
                </button>
              </div>
            </div>

            {mediaType && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setUseUploadMode(true); fileInputRef.current?.click(); }} className={`px-3 py-1 rounded ${useUploadMode ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>⬆️ Upload do computador</button>
                  <button type="button" onClick={() => setUseUploadMode(false)} className={`px-3 py-1 rounded ${!useUploadMode ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>🔗 Usar URL</button>
                </div>

                {useUploadMode ? (
                  <div>
                    <input ref={fileInputRef} type={mediaType === 'image' ? 'file' : 'file'} accept={mediaType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileSelect} className="hidden" />
                  </div>
                ) : (
                  <div>
                    <Input placeholder={mediaType === 'image' ? 'Cole a URL da imagem' : 'Cole a URL do vídeo (YouTube/Vimeo ou direto)'} value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} onBlur={handleValidateAndPreview} />
                  </div>
                )}

                <div className="mt-2">
                  {previewUrl ? (
                    mediaType === 'image' ? (
                      <img src={previewUrl} alt="Preview image" className="w-full h-full object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = ''; toast.error('Falha ao carregar imagem'); }} />
                    ) : (
                      (() => {
                        const videoEmbed = getVideoEmbed(previewUrl);
                        
                        if (videoEmbed.type === 'iframe') {
                          return (
                            <div className="aspect-video rounded overflow-hidden">
                              <iframe
                                src={videoEmbed.src}
                                className="w-full h-full"
                                allowFullScreen
                                sandbox="allow-scripts allow-same-origin allow-presentation"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                title="Video preview"
                              />
                            </div>
                          );
                        }
                        
                        if (videoEmbed.type === 'video') {
                          return (
                            <video src={videoEmbed.src} controls controlsList="nodownload" preload="metadata" className="w-full max-h-80 rounded" />
                          );
                        }
                        
                        return (
                          <div className="p-6 border rounded text-center text-red-500">
                            {videoEmbed.error || 'Erro ao processar vídeo'}
                          </div>
                        );
                      })()
                    )
                  ) : (
                    <div className="p-6 border rounded text-center text-zinc-500 text-sm">Sem preview</div>
                  )}
                </div>
              </div>
            )}

            {cropImage && pendingFileForCrop && (
              <ImageCropModal
                image={cropImage}
                aspectRatio={1}
                onConfirm={async (croppedFile: File) => {
                  try {
                    const url = await uploadFile(croppedFile);
                    if (url) {
                      setMediaUrl(url);
                      setPreviewUrl(url);
                      setUseUploadMode(true);
                    }
                  } catch (err) {
                    console.error('Erro ao enviar imagem cropada:', err);
                    toast.error('Erro ao enviar imagem');
                  } finally {
                    if (cropImage) URL.revokeObjectURL(cropImage);
                    setCropImage(null);
                    setPendingFileForCrop(null);
                  }
                }}
                onCancel={() => {
                  if (cropImage) URL.revokeObjectURL(cropImage);
                  setCropImage(null);
                  setPendingFileForCrop(null);
                }}
              />
            )}
          </div>

          <div className="shrink-0 px-6 py-4 border-t border-zinc-800 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handlePublish} disabled={isSubmitting || uploading}>
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>
  );
}

export default CreatePostModal;
