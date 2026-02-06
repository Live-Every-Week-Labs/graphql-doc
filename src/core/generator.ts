import { Config } from './config/schema';
import fs from 'fs-extra';
import path from 'path';
import { SchemaLoader } from './parser/schema-loader';
import { SchemaParser } from './parser/schema-parser';
import { getExamplePatterns } from './metadata/example-sources';
import { loadExamples } from './metadata/example-loader';
import { Transformer } from './transformer/transformer';
import { createAdapter } from './adapters';
import { LlmDocsGenerator } from './llm-docs/generator';
import { validateOperationExampleCoverage } from './validation/operation-example-validator';

import { FileWriter } from './file-writer';

export class Generator {
  constructor(private config: Config) {}

  private async cleanOutputDirIfEnabled() {
    if (!this.config.cleanOutputDir) {
      return;
    }

    const resolvedOutputDir = path.resolve(this.config.outputDir);
    const rootDir = path.parse(resolvedOutputDir).root;

    if (resolvedOutputDir === rootDir) {
      throw new Error(
        `Refusing to clean outputDir because it resolves to filesystem root: ${resolvedOutputDir}`
      );
    }

    console.log(`Cleaning output directory: ${resolvedOutputDir}`);
    await fs.emptyDir(resolvedOutputDir);
  }

  async generate(schemaPointer: string | string[]) {
    const schemaLabel = Array.isArray(schemaPointer) ? schemaPointer.join(', ') : schemaPointer;
    console.log(`Loading schema from ${schemaLabel}...`);
    const schemaLoader = new SchemaLoader();
    const schema = await schemaLoader.load({
      schemaPointer,
      schemaExtensions: this.config.schemaExtensions,
      allowRemoteSchema: this.config.allowRemoteSchema,
    });

    console.log('Parsing schema...');
    const parser = new SchemaParser();
    const { operations, types } = parser.parse(schema);

    console.log('Loading metadata...');
    const examplePatterns = getExamplePatterns(this.config);
    const examples = await loadExamples(examplePatterns);

    if (this.config.requireExamplesForDocumentedOperations) {
      const coverageErrors = validateOperationExampleCoverage(operations, examples, {
        excludeDocGroups: this.config.excludeDocGroups,
        examplesLocation: examplePatterns.join(', '),
      });

      if (coverageErrors.length > 0) {
        const details = coverageErrors.map((error) => `- ${error.message}`).join('\n');
        throw new Error(`Missing required operation examples:\n${details}`);
      }
    }

    console.log('Transforming data...');
    const transformer = new Transformer(types, {
      ...this.config.typeExpansion,
      excludeDocGroups: this.config.excludeDocGroups,
    });
    const docModel = transformer.transform(operations, examples);

    console.log('Generating documentation...');
    const adapter = createAdapter(this.config);
    const files = adapter.adapt(docModel);

    console.log('Writing files...');
    await this.cleanOutputDirIfEnabled();
    const fileWriter = new FileWriter(this.config.outputDir);
    await fileWriter.write(files);

    if (this.config.llmDocs?.enabled) {
      console.log('Generating LLM-optimized docs...');
      const llmGenerator = new LlmDocsGenerator(this.config.llmDocs);
      const { files: llmFiles, warnings } = llmGenerator.generate(docModel);

      const llmWriter = new FileWriter(this.config.llmDocs.outputDir);
      await llmWriter.write(llmFiles);

      if (warnings.length > 0) {
        for (const warning of warnings) {
          console.warn(warning);
        }
      }
    }

    console.log('Documentation generated successfully!');
  }
}
