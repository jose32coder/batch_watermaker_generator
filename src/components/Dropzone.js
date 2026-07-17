"use client";

import { useState, useRef } from "react";
import { traverseDirectory } from "@/utils/folderReader";

export default function Dropzone({ onFilesLoaded }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const processEntries = async (items) => {
    setIsLoading(true);
    try {
      const traversePromises = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            traversePromises.push(traverseDirectory(entry));
          }
        }
      }
      
      const fileGroups = await Promise.all(traversePromises);
      const allFiles = fileGroups.flat();
      
      // Filter out non-image files
      const imageFiles = allFiles.filter((file) =>
        file.type.startsWith("image/")
      );
      
      onFilesLoaded(imageFiles);
    } catch (error) {
      console.error("Error processing dropped items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.items) {
      await processEntries(e.dataTransfer.items);
    } else {
      // Fallback for standard files drag and drop
      setIsLoading(true);
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files
        .map((file) => {
          if (!file.relativePath) {
            file.relativePath = file.name;
          }
          return file;
        })
        .filter((file) => file.type.startsWith("image/"));
      onFilesLoaded(imageFiles);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setIsLoading(true);
    const files = Array.from(e.target.files);
    const imageFiles = files
      .map((file) => {
        // Use webkitRelativePath if directory input was used
        file.relativePath = file.webkitRelativePath || file.name;
        return file;
      })
      .filter((file) => file.type.startsWith("image/"));
    
    onFilesLoaded(imageFiles);
    setIsLoading(false);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center min-h-[350px] w-full p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ease-out cursor-pointer group ${
        isDragActive
          ? "border-sky-500 bg-sky-950/20 shadow-[0_0_20px_rgba(14,165,233,0.15)]"
          : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900/60"
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleInputChange}
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />

      {isLoading ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm animate-pulse">
            Escaneando archivos y carpetas...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center space-y-5">
          {/* Upload Icon */}
          <div className={`p-4 rounded-full bg-zinc-800/80 border border-zinc-700/60 transition-all duration-300 group-hover:scale-110 group-hover:border-zinc-500/50 ${
            isDragActive ? "border-sky-500/50 bg-sky-950/30 text-sky-400" : "text-zinc-400"
          }`}>
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-zinc-200">
              {isDragActive ? "¡Suelta los archivos aquí!" : "Carga tus imágenes o carpetas"}
            </h3>
            <p className="text-sm text-zinc-500 max-w-xs">
              Arrastra y suelta imágenes o carpetas enteras directamente aquí para mantener la estructura.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-medium text-zinc-300 hover:text-white transition duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Seleccionar fotos
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-medium text-zinc-300 hover:text-white transition duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Seleccionar carpeta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
