import path from 'path';
import { Config } from './config/schema';
import { SchemaLoader } from './parser/schema-loader';
import { SchemaParser } from './parser/schema-parser';
import { loadExamples } from './metadata/example-loader';
import { Transformer } from './transformer/transformer';
import { createAdapter } from './adapters';
import { LlmDocsGenerator } from './llm-docs/generator';

import { FileWriter } from './file-writer';

export class Generator {
  constructor(private config: Config) {}

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
    // Ensure directories exist or handle empty gracefully?
    // The loaders use glob, so if dir doesn't exist it might just return empty or throw.
    // processConfigDefaults ensures examplesDir is set.
    const examplesPattern = path.join(this.config.examplesDir!, '**/*.json');

    const examples = await loadExamples(examplesPattern);

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
