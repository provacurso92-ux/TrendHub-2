import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUpload } from '@/hooks/useUpload';
import { Camera, Loader2 } from 'lucide-react';
import { ImageCropModal } from '@/components/ImageCropModal';

interface ImageUploadProps {
  bucket: 'avatars' | 'banners' | 'posts' | 'communities' | 'challenges';
  onUploadComplete: (url: string) => void;
  label?: string;
}

interface ImageUploadProps {
  bucket: 'avatars' | 'banners' | 'posts' | 'communities' | 'challenges';
  onUploadComplete: (url: string) => void;
  label?: string;
  autoOpen?: boolean;
  onAutoOpenDone?: () => void;
}

export function ImageUpload({ bucket, onUploadComplete, label = 'Upload', autoOpen, onAutoOpenDone }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploading } = useUpload(bucket);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropAspect, setCropAspect] = useState(1);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setCropSrc(fileUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (autoOpen && fileInputRef.current) {
      fileInputRef.current.click();
      onAutoOpenDone?.();
    }
  }, [autoOpen, onAutoOpenDone]);

  const handleCancelCrop = () => {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
    setPendingFile(null);
  };

  const handleConfirmCrop = async (croppedFile: File) => {
    setCropSrc(null);
    setPendingFile(null);
    const url = await uploadFile(croppedFile);
    if (url) {
      onUploadComplete(url);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4 mr-2" />
            {label}
          </>
        )}
      </Button>

      {cropSrc && (
        <ImageCropModal
          image={cropSrc}
          aspectRatio={cropAspect}
          onConfirm={handleConfirmCrop}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
}
