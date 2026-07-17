/**
 * Recursively traverses a file system entry (file or directory) from the Drag & Drop API.
 * Preserves the original folder structure by adding a `relativePath` property to each File object.
 *
 * @param {FileSystemEntry} entry - The FileSystemEntry (file or directory) to traverse.
 * @param {string} path - The accumulated directory path.
 * @returns {Promise<File[]>} A promise that resolves to an array of File objects with `relativePath` properties.
 */
export async function traverseDirectory(entry, path = "") {
  const files = [];

  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => {
      entry.file(resolve, reject);
    });
    // Store the relative path as a dynamic property on the File object
    file.relativePath = path + entry.name;
    files.push(file);
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();

    // Helper to read all entries in a directory (handles chunking limitations of readEntries)
    const readAllEntries = () => {
      return new Promise((resolve) => {
        const allEntries = [];
        
        const readBatch = () => {
          dirReader.readEntries((entries) => {
            if (entries.length === 0) {
              resolve(allEntries);
            } else {
              allEntries.push(...entries);
              readBatch(); // Read the next batch
            }
          }, (error) => {
            console.error("Error reading directory entries:", error);
            resolve(allEntries); // Resolve with what we have so far
          });
        };
        
        readBatch();
      });
    };

    const entries = await readAllEntries();
    for (const childEntry of entries) {
      const childFiles = await traverseDirectory(childEntry, path + entry.name + "/");
      files.push(...childFiles);
    }
  }

  return files;
}
