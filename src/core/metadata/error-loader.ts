import { glob } from 'glob';
import fs from 'fs-extra';
import { ErrorFileSchema } from './validator';
import { ErrorFile } from './types';

export async function loadErrors(pattern: string): Promise<ErrorFile[]> {
  const files = await glob(pattern);
  const results: ErrorFile[] = [];

  for (const file of files) {
    try {
      const content = await fs.readJson(file);
      const validated = ErrorFileSchema.parse(content);
      results.push(validated);
    } catch (error) {
      console.error(`Failed to load error file: ${file}`, error);
      throw new Error(
        `Invalid error file ${file}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}
