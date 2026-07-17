/**
 * Processes a single image file, applies a repeating watermark pattern if provided,
 * and compresses the result. Runs entirely on the client side using HTML5 Canvas.
 * Revokes object URLs to prevent memory leaks.
 *
 * @param {File} imageFile - The original image file.
 * @param {HTMLImageElement|null} watermarkImg - The preloaded watermark image element, or null if none.
 * @param {Object} options - Configuration options.
 * @param {string} options.direction  - 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
 * @param {number} options.opacity    - Decimal scale (0.0 to 1.0) for watermark opacity.
 * @param {number} options.scale      - Decimal scale (0.05 to 0.50) for watermark width relative to canvas width.
 * @param {boolean} options.convertToJpeg - True to force output to image/jpeg.
 * @param {number} options.quality    - Decimal scale (0.1 to 1.0) for compression quality.
 * @returns {Promise<{relativePath: string, blobData: Blob}>} Resolves with the relative path and processed Blob.
 */
import { drawTiledWatermark } from './watermarkTiler';

export function processAndCompress(imageFile, watermarkImg, options) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(imageFile);

    img.onload = () => {
      // Create offscreen canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not acquire 2D context'));
        return;
      }

      canvas.width  = img.width;
      canvas.height = img.height;

      // 1. Draw original background image
      ctx.drawImage(img, 0, 0);

      // 2. Draw tiled watermark pattern if a logo is loaded
      if (watermarkImg) {
        drawTiledWatermark(ctx, watermarkImg, canvas.width, canvas.height, options);
      }

      // 3. Compression and mime-type control
      const targetMime    = options.convertToJpeg ? 'image/jpeg' : imageFile.type;
      const targetQuality = options.quality; // 0.1 to 1.0

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);

          let newPath = imageFile.relativePath || imageFile.name;
          if (options.convertToJpeg) {
            newPath = newPath.replace(/\.[^/.]+$/, '') + '.jpg';
          }

          if (blob) {
            resolve({ relativePath: newPath, blobData: blob });
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        targetMime,
        targetQuality,
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err || new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
