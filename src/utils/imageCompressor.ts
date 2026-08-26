/**
 * Compresses an image file and returns a base64 string.
 * @param file The image file from an input element
 * @param quality Compression quality (0 to 1). 0.3 = 70% compression (30% quality)
 * @param maxWidth Max width of the resulting image
 * @returns Promise that resolves to a base64 data URL
 */
export function compressImage(file: File, quality = 0.3, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas back to base64 string with specified quality (JPEG)
        const base64Str = canvas.toDataURL('image/jpeg', quality);
        resolve(base64Str);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
