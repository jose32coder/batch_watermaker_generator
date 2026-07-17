/**
 * Shared watermark tiling logic used by both PreviewCanvas and imageProcessor.
 * Draws a repeating watermark pattern over the entire canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} watermarkImg
 * @param {number} canvasW - canvas.width
 * @param {number} canvasH - canvas.height
 * @param {Object} options
 * @param {number} options.opacity  - 0.0 to 1.0 (or 0-100, normalised here)
 * @param {number} options.scale    - 0.05 to 0.50 (or 5-50, normalised here)
 * @param {string} options.direction - 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
 */
export function drawTiledWatermark(ctx, watermarkImg, canvasW, canvasH, options) {
  ctx.save();

  const opacity = options.opacity > 1 ? options.opacity / 100 : options.opacity;
  ctx.globalAlpha = Math.min(1, Math.max(0, opacity ?? 0.7));

  const scale = options.scale > 1 ? options.scale / 100 : options.scale;
  const wmWidth  = canvasW * (scale ?? 0.15);
  const wmHeight = (watermarkImg.height / watermarkImg.width) * wmWidth;

  // Gap between repetitions (50% of logo size to give breathing room)
  const gapX = wmWidth  * 0.5;
  const gapY = wmHeight * 0.5;
  const stepX = wmWidth  + gapX;
  const stepY = wmHeight + gapY;

  const dir = options.direction || 'diagonal-down';

  if (dir === 'diagonal-down') {
    // Tiras diagonales: superior-izquierda → inferior-derecha (-45°)
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate(-45 * Math.PI / 180);
    const span = Math.sqrt(canvasW * canvasW + canvasH * canvasH);
    for (let x = -span; x < span; x += stepX) {
      for (let y = -span; y < span; y += stepY) {
        ctx.drawImage(watermarkImg, x, y, wmWidth, wmHeight);
      }
    }

  } else if (dir === 'diagonal-up') {
    // Tiras diagonales: inferior-izquierda → superior-derecha (+45°)
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate(45 * Math.PI / 180);
    const span = Math.sqrt(canvasW * canvasW + canvasH * canvasH);
    for (let x = -span; x < span; x += stepX) {
      for (let y = -span; y < span; y += stepY) {
        ctx.drawImage(watermarkImg, x, y, wmWidth, wmHeight);
      }
    }

  } else if (dir === 'horizontal') {
    // Filas horizontales: cada fila a la misma Y, repetida en X
    for (let y = 0; y < canvasH; y += stepY) {
      for (let x = 0; x < canvasW; x += stepX) {
        ctx.drawImage(watermarkImg, x, y, wmWidth, wmHeight);
      }
    }

  } else {
    // 'vertical' — columnas verticales: cada columna a la misma X, repetida en Y
    for (let x = 0; x < canvasW; x += stepX) {
      for (let y = 0; y < canvasH; y += stepY) {
        ctx.drawImage(watermarkImg, x, y, wmWidth, wmHeight);
      }
    }
  }

  ctx.restore();
}
