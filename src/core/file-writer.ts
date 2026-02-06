import fs from 'fs-extra';
import path from 'path';
import { GeneratedFile } from './adapters/types';

export class FileWriter {
  constructor(private outputDir: string) {}

  async write(files: GeneratedFile[]) {
    await fs.ensureDir(this.outputDir);
    const normalizedOutputDir = path.normalize(path.resolve(this.outputDir));

    for (const file of files) {
      const filePath = file.absolutePath ?? path.join(this.outputDir, file.path);
      const normalizedPath = path.normalize(path.resolve(filePath));

      if (!file.absolutePath) {
        // Validate path stays within output directory
        if (
          !normalizedPath.startsWith(normalizedOutputDir + path.sep) &&
          normalizedPath !== normalizedOutputDir
        ) {
          throw new Error(`Path traversal attempt detected: ${file.path}`);
        }
      }

      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, file.binaryContent ?? file.content);
      console.log(`Written: ${file.path}`);
    }
  }
}
