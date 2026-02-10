/**
 * Path utility functions for cross-platform path normalisation.
 */
import path from 'path';

/**
 * Convert Windows-style backslash paths to POSIX forward-slash paths.
 */
export function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}

/**
 * Render a path for user-facing messages without exposing full absolute paths by default.
 * - Paths under `rootPath` are rendered relative to that root.
 * - Paths outside `rootPath` are rendered as basenames.
 */
export function formatPathForMessage(targetPath: string, rootPath: string = process.cwd()): string {
  if (/^https?:\/\//i.test(targetPath)) {
    return targetPath;
  }

  const resolvedTarget = path.resolve(targetPath);
  const resolvedRoot = path.resolve(rootPath);

  if (resolvedTarget === resolvedRoot) {
    return '.';
  }

  if (resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    const relative = path.relative(resolvedRoot, resolvedTarget);
    return toPosix(relative || '.');
  }

  return path.basename(resolvedTarget);
}

export function formatPathListForMessage(
  targetPath: string | string[],
  rootPath: string = process.cwd()
): string {
  if (Array.isArray(targetPath)) {
    return targetPath.map((entry) => formatPathForMessage(entry, rootPath)).join(', ');
  }

  return formatPathForMessage(targetPath, rootPath);
}
