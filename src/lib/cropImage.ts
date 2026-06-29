export async function getCroppedImage(imageSrc: string, pixelCrop: any): Promise<File> {
  const response = await fetch(imageSrc);
  const blob = await response.blob();
  const image = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not supported');
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((croppedBlob) => {
      if (!croppedBlob) {
        reject(new Error('Failed to create cropped image blob'));
        return;
      }
      resolve(new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  });
}
