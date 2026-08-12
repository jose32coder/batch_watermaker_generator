"use client";

import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import Dropzone from "@/components/Dropzone";
import PreviewCanvas from "@/components/PreviewCanvas";
import ControlPanel from "@/components/ControlPanel";
import { processAndCompress } from "@/utils/imageProcessor";

export default function Home() {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [watermarkLogo, setWatermarkLogo] = useState(null); // { element, file, objectUrl }
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zipName, setZipName] = useState("");

  // Configuration options
  const [options, setOptions] = useState({
    direction: "diagonal-down",
    opacity: 0.25,
    scale: 0.15,
    convertToJpeg: false,
    quality: 0.85,
  });

  // Check if loaded files have a directory structure
  const isFolderMode =
    images.length > 0 &&
    images[0].relativePath &&
    images[0].relativePath.includes("/");

  const handleFilesLoaded = (newFiles) => {
    setImages(newFiles);
    setCurrentImageIndex(0);
    setProgress(0);
  };

  const handleReset = () => {
    setImages([]);
    setCurrentImageIndex(0);
    setProgress(0);
    setIsProcessing(false);
    setZipName("");
  };

  const handleProcessBatch = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    const zip = new JSZip();
    const batchSize = 3; // Tamaño de lote óptimo para no saturar memoria
    const total = images.length;
    let processed = 0;

    // Mapa para contar secuencias de archivos por carpeta (ej: "Dorsal 10" -> 1, 2, 3...)
    const folderCounters = {};

    try {
      for (let i = 0; i < total; i += batchSize) {
        const batch = images.slice(i, i + batchSize);

        const promises = batch.map(async (imageFile) => {
          try {
            const result = await processAndCompress(
              imageFile,
              watermarkLogo ? watermarkLogo.element : null,
              options,
            );

            // Normalizar ruta
            let originalPath = (
              imageFile.relativePath || imageFile.name
            ).replace(/^\/+/, "");
            const pathParts = originalPath.split("/");

            let finalPathInZip = originalPath;

            // Si viene en estructura de carpetas, aplicamos numeración secuencial
            if (pathParts.length > 1) {
              const fileName = pathParts.pop(); // ej: "DSC_001.jpg"
              const folderPath = pathParts.join("/"); // ej: "Equipos/La Esperanza/Dorsal 10"
              const parentFolderName = pathParts[pathParts.length - 1]; // ej: "Dorsal 10"

              const ext = fileName.includes(".")
                ? fileName.split(".").pop()
                : "jpg";

              // Incrementar contador para esta carpeta específica
              folderCounters[folderPath] =
                (folderCounters[folderPath] || 0) + 1;
              const indexFormatted = String(
                folderCounters[folderPath],
              ).padStart(2, "0");

              // Resultado: "Equipos/La Esperanza/Dorsal 10/Dorsal 10_01.jpg"
              finalPathInZip = `${folderPath}/${parentFolderName}_${indexFormatted}.${ext}`;
            }

            zip.file(finalPathInZip, result.blobData);
          } catch (err) {
            console.error(`Error procesando ${imageFile.name}:`, err);
          } finally {
            processed++;
            setProgress(Math.round((processed / total) * 100));
          }
        });

        await Promise.all(promises);

        // LIBERAR EL HILO DE LA UI: Permite al navegador respirar y renderizar la barra
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      setProgress(99);
      const zipContent = await zip.generateAsync({
        type: "blob",
        compression: "STORE", // "STORE" es ultra rápido y evita congelar la CPU
      });

      // Determinar nombre del ZIP
      let finalZipName = "imagenes_con_marca_de_agua";
      if (isFolderMode) {
        const rootFolder = images[0].relativePath
          .replace(/^\/+/, "")
          .split("/")[0];
        finalZipName = `${rootFolder} - procesado`;
      } else if (zipName.trim() !== "") {
        finalZipName = zipName.trim();
      }

      if (!finalZipName.toLowerCase().endsWith(".zip")) finalZipName += ".zip";

      saveAs(zipContent, finalZipName);
      setProgress(100);
    } catch (error) {
      console.error("Fallo el proceso por lote:", error);
    } finally {
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  // ── Thumbnail strip helpers ──────────────────────────────────────────────
  const MAX_VISIBLE = 6;
  const stripStart = Math.max(
    0,
    Math.min(currentImageIndex - 2, images.length - MAX_VISIBLE),
  );
  const stripSlice = images.slice(stripStart, stripStart + MAX_VISIBLE);

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 cursor-default">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-900 bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tracking-tight select-none">
              WATERMARK STUDIO
            </span>
            <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 rounded-md px-1.5 py-0.5 select-none">
              v2
            </span>
          </div>

          {images.length > 0 && (
            <span className="text-[11px] font-mono text-zinc-500 select-none">
              {images.length} {images.length === 1 ? "imagen" : "imágenes"}
            </span>
          )}
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Column 1: Workspace (7 cols) ───────────────────────────── */}
          <section className="lg:col-span-7 flex flex-col gap-5">
            {images.length === 0 ? (
              <div className="flex flex-col gap-4">
                <h1 className="text-xl font-bold tracking-tight select-none">
                  Carga tus imágenes
                </h1>
                <Dropzone onFilesLoaded={handleFilesLoaded} />
              </div>
            ) : (
              <>
                {/* ── Toolbar ── */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors duration-200 flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg hover:bg-zinc-900 disabled:opacity-50"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Limpiar
                  </button>

                  {/* Prev / Next nav */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentImageIndex((i) => Math.max(0, i - 1))
                      }
                      disabled={currentImageIndex === 0}
                      className="w-8 h-8 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-default transition-all duration-200 flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <span className="text-[11px] font-mono text-zinc-500 px-2 select-none w-14 text-center">
                      {currentImageIndex + 1} / {images.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentImageIndex((i) =>
                          Math.min(images.length - 1, i + 1),
                        )
                      }
                      disabled={currentImageIndex === images.length - 1}
                      className="w-8 h-8 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-default transition-all duration-200 flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* ── Canvas Preview ── */}
                <PreviewCanvas
                  imageFile={images[currentImageIndex]}
                  watermarkImg={watermarkLogo ? watermarkLogo.element : null}
                  options={options}
                  imageIndex={currentImageIndex}
                  totalImages={images.length}
                />

                {/* ── Thumbnail Strip ── */}
                {images.length > 1 && (
                  <div
                    className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin select-none"
                    aria-label="Galería de imágenes"
                  >
                    {stripSlice.map((file, relIdx) => {
                      const absIdx = stripStart + relIdx;
                      const isActive = absIdx === currentImageIndex;
                      return (
                        <button
                          key={absIdx}
                          type="button"
                          onClick={() => setCurrentImageIndex(absIdx)}
                          title={file.name}
                          className={`cursor-pointer shrink-0 w-16 h-16 rounded-xl border-2 flex items-end p-1 overflow-hidden transition-all duration-200 ${
                            isActive
                              ? "border-white bg-zinc-900 shadow-sm"
                              : "border-transparent bg-zinc-900 hover:border-zinc-700 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <div className="w-full h-full rounded-lg overflow-hidden relative">
                            <ThumbnailImage file={file} />
                            {/* Overlay de gradiente ligero para destacar la caja activa */}
                            {isActive && (
                              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg"></div>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {images.length > MAX_VISIBLE && (
                      <div className="shrink-0 w-16 h-16 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-500 bg-zinc-950/50">
                        +{images.length - MAX_VISIBLE}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Progress bar ── */}
                {(isProcessing || progress > 0) && (
                  <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950 p-5 space-y-3">
                    <div className="flex justify-between text-[11px] font-mono tracking-wide select-none">
                      <span className="text-zinc-400">
                        {progress === 100
                          ? "PROCESO COMPLETADO"
                          : progress === 99
                            ? "EMPAQUETANDO ZIP..."
                            : "PROCESANDO IMÁGENES..."}
                      </span>
                      <span className="text-white">{progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-white h-full transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── Column 2: Controls (5 cols) ────────────────────────────── */}
          <aside className="lg:col-span-5 w-full">
            <ControlPanel
              options={options}
              setOptions={setOptions}
              watermarkLogo={watermarkLogo}
              setWatermarkLogo={setWatermarkLogo}
              onProcessBatch={handleProcessBatch}
              isProcessing={isProcessing}
              totalImages={images.length}
              onReset={handleReset}
              zipName={zipName}
              setZipName={setZipName}
              isFolderMode={isFolderMode}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}

// ── Small helper: renders a lazy object-URL thumbnail ─────────────────────
function ThumbnailImage({ file }) {
  const [src, setSrc] = useState(null);

  // Load URL only once
  if (!src && file) {
    const url = URL.createObjectURL(file);
    setSrc(url);
  }

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );
}
