import chalk from 'chalk';
import {
  resolveSchemaPointer as resolveSchemaPointerFromConfig,
  resolveSchemaPointers as resolveSchemaPointersFromConfig,
  type SchemaPointerResolverOptions,
  type SchemaResolverRuntimeOptions,
} from '../core/config/schema-pointer.js';

export type SchemaResolverOptions = SchemaPointerResolverOptions;
export type { SchemaResolverRuntimeOptions };

export function resolveSchemaPointers(
  schemaPointer: string | string[],
  targetDir: string
): string | string[] {
  return resolveSchemaPointersFromConfig(schemaPointer, targetDir);
}

/**
 * Resolve schema pointers for CLI execution while preserving existing CLI
 * logging behavior.
 */
export async function resolveSchemaPointer(
  options: SchemaResolverOptions,
  targetDir: string,
  runtimeOptions: SchemaResolverRuntimeOptions = {}
): Promise<string | string[]> {
  const cliLog = runtimeOptions.log ?? ((message: string) => console.log(chalk.dim(message)));
  return resolveSchemaPointerFromConfig(options, targetDir, {
    ...runtimeOptions,
    log: cliLog,
  });
}
