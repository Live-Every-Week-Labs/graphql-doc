import { zodToJsonSchema } from 'zod-to-json-schema';
import { ConfigSchema } from '../src/core/config/schema.js';
import fs from 'fs';
import path from 'path';

const jsonSchema = zodToJsonSchema(ConfigSchema, {
  $refStrategy: 'none', // inline all definitions
});

// Add auto-generation comment
const schemaWithComment = {
  $comment: 'Auto-generated from Zod schema. Do not edit manually. Run: npm run generate:schema',
  ...jsonSchema,
};

const outputPath = path.join(import.meta.dirname, '..', 'src', 'schemas', 'config-schema.json');
fs.writeFileSync(outputPath, JSON.stringify(schemaWithComment, null, 2) + '\n');
console.log(`Generated JSON Schema at ${outputPath}`);
