"use client";

import { useEffect, useRef, useState } from "react";
import { drawTiledWatermark } from "@/utils/watermarkTiler";

export default function PreviewCanvas({
  imageFile,
  watermarkImg,
  options,
  imageIndex,
  totalImages,
}) {
  const canvasRef = useRef(null);
  const [bgImage, setBgImage]       = useState(null);
  const [imageError, setImageError] = useState(false);

  // === EFECTO 1: Cargar la imagen de fondo de forma segura ===
  useEffect(() => {
    if (!imageFile) {
      setBgImage(null);
      setImageError(false);
      return;
    }

    if (!(imageFile instanceof File) && !(imageFile instanceof Blob)) {
      console.warn("El archivo proporcionado no es un File o Blob válido.");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    const img       = new Image();
    let isCurrent   = true;

    img.onload = () => {
      if (!isCurrent) return;
      setBgImage(img);
      setImageError(false);
    };

    img.onerror = () => {
      if (!isCurrent) return;
      console.error("Failed to load background image for preview");
      setImageError(true);
      setBgImage(null);
    };

    img.src = objectUrl;

    return () => {
      isCurrent = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  // === EFECTO 2: Dibujar el Canvas con el patrón repetido de marca de agua ===
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bgImage) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = bgImage.width;
    canvas.height = bgImage.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0);

    if (watermarkImg) {
      drawTiledWatermark(ctx, watermarkImg, canvas.width, canvas.height, options);
    }
  }, [bgImage, watermarkImg, options]);

  if (imageError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] w-full p-8 rounded-2xl border border-zinc-800/60 bg-zinc-950 text-center cursor-default">
        <svg className="w-9 h-9 text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-zinc-500 text-sm">Error al cargar la imagen</p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800/60 bg-zinc-950 cursor-default">
      {/* Badge de posición */}
      {totalImages > 0 && (
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-mono rounded-lg bg-black/60 border border-zinc-800/60 text-zinc-500 select-none">
          {imageIndex + 1} / {totalImages}
        </div>
      )}

      {/* Canvas */}
      <div className="w-full flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-[500px] w-auto h-auto transition-opacity duration-200"
        />
      </div>

      {/* Metadatos de la imagen */}
      {bgImage && (
        <div className="px-4 py-2 flex justify-between w-full text-[10px] text-zinc-600 font-mono border-t border-zinc-900 select-none">
          <span className="truncate max-w-[65%]">{imageFile.name}</span>
          <span>{bgImage.width} × {bgImage.height} px</span>
        </div>
      )}
    </div>
  );
}