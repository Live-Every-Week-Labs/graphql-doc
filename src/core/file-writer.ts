import fs from 'fs-extra';
import path from 'path';
import { GeneratedFile } from './adapters/types.js';

const DANGEROUS_PREFIXES_POSIX = [
  '/etc',
  '/bin',
  '/sbin',
  '/usr/bin',
  '/usr/sbin',
  '/System',
  '/var/run',
  '/home',
  '/root',
  '/proc',
  '/sys',
  '/dev',
];

/**
 * Checks whether a resolved absolute path is safe for writing.
 * Returns false if the path is the filesystem root, has fewer than 3 segments,
 * or starts with a known system directory (on non-Windows).
 */
export function isSafePath(resolvedPath: string): boolean {
  const normalized = path.normalize(resolvedPath);
  const root = path.parse(normalized).root;

  // 1. Must not be filesystem root
  if (normalized === root) {
    return false;
  }

  // 2. Must have at least 3 path segments (e.g. /a/b/c)
  const segments = normalized.split(path.sep).filter(Boolean);
  if (segments.length < 3) {
    return false;
  }

  // 3. On non-Windows, reject known system directory prefixes
  if (process.platform !== 'win32') {
    for (const prefix of DANGEROUS_PREFIXES_POSIX) {
      if (normalized === prefix || normalized.startsWith(prefix + '/')) {
        return false;
      }
    }
  }

  return true;
}

export class FileWriter {
  constructor(private outputDir: string) {}

  async write(files: GeneratedFile[]) {
    await fs.ensureDir(this.outputDir);
    const normalizedOutputDir = path.normalize(path.resolve(this.outputDir));
    const normalizedPathSources = new Map<string, string>();

    for (const file of files) {
      const candidatePath = file.absolutePath ?? path.join(this.outputDir, file.path);
      const normalizedPath = path.normalize(path.resolve(candidatePath));
      const source = file.absolutePath
        ? `absolutePath:${file.absolutePath}`
        : `relativePath:${file.path}`;

      const firstSource = normalizedPathSources.get(normalizedPath);
      if (firstSource) {
        throw new Error(
          `Duplicate output path detected for "${normalizedPath}" from ${firstSource} and ${source}`
        );
      }

      normalizedPathSources.set(normalizedPath, source);
    }

    const BATCH_SIZE = 20;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      // Validate all files in the batch before writing any
      const validatedFiles: Array<{ file: GeneratedFile; filePath: string }> = [];
      for (const file of batch) {
        const filePath = file.absolutePath ?? path.join(this.outputDir, file.path);
        const normalizedPath = path.normalize(path.resolve(filePath));

        if (file.absolutePath) {
          if (!isSafePath(normalizedPath)) {
            throw new Error(
              `Refusing to write to unsafe absolute path: ${file.absolutePath} (resolved to ${normalizedPath})`
            );
          }
        } else {
          if (
            !normalizedPath.startsWith(normalizedOutputDir + path.sep) &&
            normalizedPath !== normalizedOutputDir
          ) {
            throw new Error(`Path traversal attempt detected: ${file.path}`);
          }

          if (!isSafePath(normalizedPath)) {
            throw new Error(
              `Refusing to write to unsafe path: ${file.path} (resolved to ${normalizedPath})`
            );
          }
        }

        validatedFiles.push({ file, filePath });
      }

      // Write all validated files in parallel
      await Promise.all(
        validatedFiles.map(async ({ file, filePath }) => {
          await fs.ensureDir(path.dirname(filePath));
          const existingStats = await fs.lstat(filePath).catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') {
              return null;
            }
            throw error;
          });
          if (existingStats?.isSymbolicLink()) {
            throw new Error(`Refusing to write through symlinked path: ${filePath}`);
          }
          await fs.writeFile(filePath, file.binaryContent ?? file.content);
        })
      );
    }
  }
}
