import Cropper from 'react-easy-crop';
import { useState, useCallback } from 'react';
import { getCroppedImage } from '@/lib/cropImage';
import { Button } from '@/components/ui/button';

interface Props {
  image: string;
  aspectRatio: number;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

export function ImageCropModal({ image, aspectRatio, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImage(image, croppedAreaPixels);
      onConfirm(croppedFile);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg h-80 bg-white dark:bg-black rounded-lg overflow-hidden">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <input
        type="range"
        min={1}
        max={3}
        step={0.1}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        className="mt-4 w-64"
      />

      <div className="flex gap-4 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={isProcessing}>
          {isProcessing ? 'Processando...' : 'Confirmar'}
        </Button>
      </div>
    </div>
  );
}
