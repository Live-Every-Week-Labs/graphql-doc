import { glob } from 'glob';
import fs from 'fs-extra';
import { ExampleFileSchema } from './validator.js';
import { ExampleFile } from './types.js';

export async function loadExamples(patterns: string | string[]): Promise<ExampleFile[]> {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  const fileGroups = await Promise.all(patternList.map((pattern) => glob(pattern)));
  const files = Array.from(new Set(fileGroups.flat()));
  const results: ExampleFile[] = [];

  for (const file of files) {
    try {
      const content = await fs.readJson(file);
      const validated = ExampleFileSchema.parse(content) as ExampleFile | ExampleFile[];
      if (Array.isArray(validated)) {
        results.push(...validated);
      } else {
        results.push(validated);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid example file ${file}: ${message}`);
    }
  }

  return results;
}
