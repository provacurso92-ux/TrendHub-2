import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/hooks/usePosts';
import { Image, Video, Smile, X } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';

export function CreatePostCard() {
  const { profile } = useAuth();
  const { createPost } = usePosts();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await createPost.mutateAsync({
        content,
        image_url: imageUrl || undefined,
        video_url: videoUrl || undefined,
      });
      setContent('');
      setImageUrl('');
      setVideoUrl('');
      setShowMediaInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="bg-violet-600 text-white">
            {profile?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="O que está acontecendo?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none text-base"
            rows={3}
          />

          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Preview"
                className="rounded-lg max-h-64 object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => setImageUrl('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {showMediaInput && (
            <div className="space-y-2">
              <ImageUpload
                bucket="posts"
                label="Upload de Imagem"
                onUploadComplete={(url) => {
                  setImageUrl(url);
                  setShowMediaInput(false);
                }}
              />
              <input
                type="url"
                placeholder="Ou cole a URL da imagem"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              />
              <input
                type="url"
                placeholder="Ou cole a URL do vídeo"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMediaInput(!showMediaInput)}
                className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-950"
              >
                <Image className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
