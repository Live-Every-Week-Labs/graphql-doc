export const version = '0.1.0';

// Core generator
export { Generator } from './core/generator.js';

// Configuration
export { Config, ConfigSchema } from './core/config/schema.js';
export { loadGeneratorConfig } from './core/config/loader.js';

// Adapters
export { createAdapter } from './core/adapters/index.js';

// Document model types
export type {
  DocModel,
  Operation,
  Section,
  Subsection,
  ExpandedType,
} from './core/transformer/types.js';

// Generated file type
export type { GeneratedFile } from './core/types.js';

// File writer
export { FileWriter } from './core/file-writer.js';
