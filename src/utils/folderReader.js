/**
 * Recorre de forma recursiva una entrada del sistema de archivos del Drag & Drop API.
 * Preserva la estructura original de carpetas añadiendo la propiedad `relativePath`.
 * Filtra automáticamente solo archivos de imagen válidos e ignora archivos del sistema.
 *
 * @param {FileSystemEntry} entry - La entrada del sistema de archivos (archivo o directorio).
 * @param {string} path - Ruta acumulada del directorio.
 * @returns {Promise<File[]>} Promesa que resuelve a un array de objetos File de imágenes válidas.
 */
export async function traverseDirectory(entry, path = "") {
  const files = [];

  // Ignorar archivos y carpetas ocultas del sistema (.DS_Store, .git, etc.)
  if (entry.name.startsWith(".")) {
    return files;
  }

  if (entry.isFile) {
    // Verificar extensión antes de cargar el archivo en memoria
    const isImageExtension = /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(
      entry.name,
    );

    if (isImageExtension) {
      try {
        const file = await new Promise((resolve, reject) => {
          entry.file(resolve, reject);
        });

        // Guardar la ruta relativa completa
        file.relativePath = path + entry.name;
        files.push(file);
      } catch (err) {
        console.warn(`No se pudo leer el archivo ${entry.name}:`, err);
      }
    }
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();

    // Helper para leer todas las entradas de un directorio en lotes continuos
    const readAllEntries = () => {
      return new Promise((resolve) => {
        const allEntries = [];

        const readBatch = () => {
          dirReader.readEntries(
            (entries) => {
              if (entries.length === 0) {
                resolve(allEntries);
              } else {
                allEntries.push(...entries);
                readBatch(); // Leer el siguiente lote de entradas
              }
            },
            (error) => {
              console.error("Error al leer entradas del directorio:", error);
              resolve(allEntries);
            },
          );
        };

        readBatch();
      });
    };

    const entries = await readAllEntries();

    // Recorrido secuencial para proteger la pila de ejecución y la memoria RAM
    for (const childEntry of entries) {
      const childFiles = await traverseDirectory(
        childEntry,
        path + entry.name + "/",
      );
      files.push(...childFiles);
    }
  }

  return files;
}
