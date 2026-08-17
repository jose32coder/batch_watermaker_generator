"use client";

import { useRef, useState } from "react";
import { FiUploadCloud, FiImage, FiFolder } from "react-icons/fi";
import { traverseDirectory } from "@/utils/folderReader";

export default function Dropzone({ onFilesLoaded }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  /**
   * ============================================================
   * DRAG & DROP
   * ============================================================
   */

  const processEntries = async (items) => {
    setIsLoading(true);

    try {
      const traversePromises = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.kind !== "file") continue;

        const entry = item.webkitGetAsEntry();

        if (entry) {
          traversePromises.push(traverseDirectory(entry));
        }
      }

      const fileGroups = await Promise.all(traversePromises);
      const allFiles = fileGroups.flat();

      const imageFiles = allFiles
        .filter((file) => file?.type?.startsWith("image/"))
        .map((file) => {
          if (!file.relativePath) {
            file.relativePath = file.name;
          }

          return file;
        });

      onFilesLoaded(imageFiles);
    } catch (error) {
      console.error("Error processing dropped items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragActive(false);

    try {
      if (e.dataTransfer.items?.length) {
        await processEntries(e.dataTransfer.items);
        return;
      }

      setIsLoading(true);

      const files = Array.from(e.dataTransfer.files || []);

      const imageFiles = files
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => {
          file.relativePath =
            file.webkitRelativePath || file.relativePath || file.name;

          return file;
        });

      onFilesLoaded(imageFiles);
    } catch (error) {
      console.error("Error processing dropped files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ============================================================
   * SELECCIÓN DE FOTOS INDIVIDUALES
   * ============================================================
   */

  const handleInputChange = (e) => {
    setIsLoading(true);

    try {
      const files = Array.from(e.target.files || []);

      const imageFiles = files
        .filter((file) => file.type.startsWith("image/"))
        .map((file) => {
          file.relativePath = file.webkitRelativePath || file.name;

          return file;
        });

      onFilesLoaded(imageFiles);
    } catch (error) {
      console.error("Error processing selected files:", error);
    } finally {
      setIsLoading(false);

      // Permite volver a seleccionar los mismos archivos
      e.target.value = "";
    }
  };

  const handleSelectFilesClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    fileInputRef.current?.click();
  };

  /**
   * ============================================================
   * SELECTOR DE CARPETAS
   *
   * Utiliza File System Access API:
   *
   * window.showDirectoryPicker()
   *
   * Esto devuelve un FileSystemDirectoryHandle y permite
   * recorrer manualmente toda la estructura de carpetas.
   * ============================================================
   */

  const readDirectoryRecursive = async (directoryHandle, currentPath = "") => {
    const files = [];

    for await (const [name, handle] of directoryHandle.entries()) {
      /**
       * Ignorar archivos/carpetas ocultos del sistema
       */
      if (name.startsWith(".")) {
        continue;
      }

      /**
       * --------------------------------------------------------
       * ARCHIVO
       * --------------------------------------------------------
       */
      if (handle.kind === "file") {
        const isImageExtension = /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(name);

        if (!isImageExtension) {
          continue;
        }

        try {
          const file = await handle.getFile();

          /**
           * Conservamos exactamente la estructura.
           *
           * Ejemplo:
           *
           * Diego Esquivel - Fotos/
           * ├── Retratos/
           * │   └── foto1.jpg
           *
           * relativePath:
           *
           * Diego Esquivel - Fotos/Retratos/foto1.jpg
           */

          file.relativePath = `${currentPath}${name}`;

          files.push(file);
        } catch (error) {
          console.warn(`No se pudo leer el archivo ${name}:`, error);
        }
      } else if (handle.kind === "directory") {
        /**
         * --------------------------------------------------------
         * CARPETA
         * --------------------------------------------------------
         */
        const nestedFiles = await readDirectoryRecursive(
          handle,
          `${currentPath}${name}/`,
        );

        files.push(...nestedFiles);
      }
    }

    return files;
  };

  const handleSelectFolderClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    /**
     * El usuario canceló el selector.
     */
    try {
      /**
       * ========================================================
       * MÉTODO MODERNO
       * ========================================================
       */

      if ("showDirectoryPicker" in window) {
        setIsLoading(true);

        const directoryHandle = await window.showDirectoryPicker({
          mode: "read",
        });

        /**
         * Nombre de la carpeta raíz.
         */
        const rootPath = `${directoryHandle.name}/`;

        /**
         * Recorrer toda la carpeta.
         */
        const files = await readDirectoryRecursive(directoryHandle, rootPath);

        /**
         * Filtrar solamente imágenes.
         */
        const imageFiles = files.filter((file) =>
          file.type.startsWith("image/"),
        );

        console.log("Carpeta seleccionada:", directoryHandle.name);
        console.log("Imágenes encontradas:", imageFiles.length);
        console.log(
          "Rutas:",
          imageFiles.map((file) => file.relativePath),
        );

        onFilesLoaded(imageFiles);

        return;
      }

      /**
       * ========================================================
       * FALLBACK
       * ========================================================
       *
       * Para navegadores que no soporten showDirectoryPicker,
       * utilizamos el input con webkitdirectory.
       */

      const fallbackInput = document.createElement("input");

      fallbackInput.type = "file";
      fallbackInput.multiple = true;

      /**
       * El atributo debe existir antes de abrir el selector.
       */
      fallbackInput.setAttribute("webkitdirectory", "");
      fallbackInput.setAttribute("directory", "");

      fallbackInput.accept = "image/*";
      fallbackInput.style.display = "none";

      fallbackInput.addEventListener(
        "change",
        (event) => {
          const files = Array.from(event.target.files || []);

          const imageFiles = files
            .filter((file) => file.type.startsWith("image/"))
            .map((file) => {
              file.relativePath = file.webkitRelativePath || file.name;

              return file;
            });

          console.log("Carpeta seleccionada mediante fallback:", imageFiles);

          onFilesLoaded(imageFiles);

          fallbackInput.remove();
        },
        { once: true },
      );

      document.body.appendChild(fallbackInput);

      fallbackInput.click();
    } catch (error) {
      /**
       * El usuario simplemente canceló el selector.
       */
      if (error?.name === "AbortError") {
        return;
      }

      console.error("Error seleccionando carpeta:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleSelectFilesClick}
      className={`relative flex flex-col items-center justify-center min-h-87.5 w-full p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ease-out group ${
        isDragActive
          ? "border-sky-500 bg-sky-950/20 shadow-[0_0_20px_rgba(14,165,233,0.15)]"
          : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900/60"
      }`}
    >
      {/* ======================================================
          INPUT PARA FOTOS INDIVIDUALES
          ====================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {isLoading ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />

          <p className="text-zinc-400 text-sm animate-pulse">
            Escaneando archivos y carpetas...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center space-y-5">
          {/* ==================================================
              ICONO PRINCIPAL
              ================================================== */}

          <div
            className={`p-4 rounded-full bg-zinc-800/80 border border-zinc-700/60 transition-all duration-300 group-hover:scale-110 group-hover:border-zinc-500/50 ${
              isDragActive
                ? "border-sky-500/50 bg-sky-950/30 text-sky-400"
                : "text-zinc-400"
            }`}
          >
            <FiUploadCloud className="w-8 h-8" strokeWidth={1.5} />
          </div>

          {/* ==================================================
              TEXTO
              ================================================== */}

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-zinc-200">
              {isDragActive
                ? "¡Suelta los archivos aquí!"
                : "Carga tus imágenes o carpetas"}
            </h3>

            <p className="text-sm text-zinc-500 max-w-xs">
              Arrastra y suelta imágenes o carpetas enteras directamente aquí
              para mantener la estructura.
            </p>
          </div>

          {/* ==================================================
              BOTONES
              ================================================== */}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* =================================================
                FOTOS
                ================================================= */}

            <button
              type="button"
              onClick={handleSelectFilesClick}
              className="px-5 py-2.5 rounded-lg cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-medium text-zinc-300 hover:text-white transition duration-200 flex items-center justify-center gap-2"
            >
              <FiImage className="w-4 h-4" strokeWidth={1.8} />
              Seleccionar fotos
            </button>

            {/* =================================================
                CARPETA
                ================================================= */}

            <button
              type="button"
              onClick={handleSelectFolderClick}
              className="inline-flex cursor-pointer px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-medium text-zinc-300 hover:text-white transition duration-200 items-center justify-center gap-2"
            >
              <FiFolder className="w-4 h-4" strokeWidth={1.8} />
              Seleccionar carpeta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
