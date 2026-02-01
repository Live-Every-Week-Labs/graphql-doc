import path from 'path';
import { Config } from './config/schema';
import { SchemaLoader } from './parser/schema-loader';
import { SchemaParser } from './parser/schema-parser';
import { loadExamples } from './metadata/example-loader';
import { loadErrors } from './metadata/error-loader';
import { Transformer } from './transformer/transformer';
import { DocusaurusAdapter } from './adapters/docusaurus/docusaurus-adapter';

import { FileWriter } from './file-writer';

export class Generator {
  constructor(private config: Config) {}

  async generate(schemaPointer: string) {
    console.log(`Loading schema from ${schemaPointer}...`);
    const schemaLoader = new SchemaLoader();
    const schema = await schemaLoader.load({ schemaPointer });

    console.log('Parsing schema...');
    const parser = new SchemaParser();
    const { operations, types } = parser.parse(schema);

    console.log('Loading metadata...');
    // Ensure directories exist or handle empty gracefully?
    // The loaders use glob, so if dir doesn't exist it might just return empty or throw.
    // processConfigDefaults ensures examplesDir and errorsDir are set.
    const examplesPattern = path.join(this.config.examplesDir!, '**/*.json');
    const errorsPattern = path.join(this.config.errorsDir!, '**/*.json');

    const examples = await loadExamples(examplesPattern);
    const errors = await loadErrors(errorsPattern);

    console.log('Transforming data...');
    const transformer = new Transformer(types, {
      ...this.config.typeExpansion,
      excludeDocGroups: this.config.excludeDocGroups,
    });
    const docModel = transformer.transform(operations, examples, errors);

    console.log('Generating documentation...');
    const adapter = new DocusaurusAdapter(this.config);
    const files = adapter.adapt(docModel);

    console.log('Writing files...');
    const fileWriter = new FileWriter(this.config.outputDir);
    await fileWriter.write(files);

    console.log('Documentation generated successfully!');
  }
}
