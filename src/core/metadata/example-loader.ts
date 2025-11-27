import { glob } from 'glob';
import fs from 'fs-extra';
import { ExampleFileSchema } from './validator';
import { ExampleFile } from './types';

export async function loadExamples(pattern: string): Promise<ExampleFile[]> {
  const files = await glob(pattern);
  const results: ExampleFile[] = [];

  for (const file of files) {
    try {
      const content = await fs.readJson(file);
      const validated = ExampleFileSchema.parse(content);
      results.push(validated);
    } catch (error) {
      console.error(`Failed to load example file: ${file}`, error);
      // We might want to rethrow or collect errors depending on desired behavior.
      // For now, logging and skipping is a safe default for a loader.
      // Alternatively, we could throw to fail the build.
      // Let's throw to ensure data integrity.
      throw new Error(
        `Invalid example file ${file}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}
