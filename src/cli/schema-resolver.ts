import chalk from 'chalk';
import { loadConfig } from 'graphql-config';
import path from 'path';

export interface SchemaResolverOptions {
  schema?: string;
}

export interface SchemaResolverRuntimeOptions {
  silent?: boolean;
  log?: (message: string) => void;
}

export function resolveSchemaPointers(
  schemaPointer: string | string[],
  targetDir: string
): string | string[] {
  const resolvePointer = (pointer: string) => {
    const isRemoteSchema = /^https?:\/\//i.test(pointer);
    return isRemoteSchema || path.isAbsolute(pointer) ? pointer : path.resolve(targetDir, pointer);
  };

  return Array.isArray(schemaPointer)
    ? schemaPointer.map(resolvePointer)
    : resolvePointer(schemaPointer);
}

/**
 * Resolve schema pointer from CLI options or graphql-config (.graphqlrc).
 *
 * Resolution order:
 *   1. Explicit --schema CLI option
 *   2. Schema from .graphqlrc / graphql-config
 *   3. Default: 'schema.graphql'
 */
export async function resolveSchemaPointer(
  options: SchemaResolverOptions,
  targetDir: string,
  runtimeOptions: SchemaResolverRuntimeOptions = {}
): Promise<string | string[]> {
  const log = (message: string) => {
    if (runtimeOptions.silent) {
      return;
    }

    if (runtimeOptions.log) {
      runtimeOptions.log(message);
      return;
    }

    console.log(chalk.dim(message));
  };

  // 1. CLI option takes priority
  if (options.schema) {
    return options.schema;
  }

  // 2. Try to get from graphql-config (.graphqlrc)
  try {
    const gqlConfig = await loadConfig({ rootDir: targetDir });
    if (gqlConfig) {
      const project = gqlConfig.getDefault();
      const schemaFromConfig = project.schema;

      if (typeof schemaFromConfig === 'string') {
        log(`Using schema from .graphqlrc: ${schemaFromConfig}`);
        return schemaFromConfig;
      }

      if (Array.isArray(schemaFromConfig)) {
        const stringSchemas = schemaFromConfig.filter(
          (pointer): pointer is string => typeof pointer === 'string'
        );
        if (stringSchemas.length > 0) {
          log(`Using schema from .graphqlrc: ${stringSchemas.join(', ')}`);
          return stringSchemas;
        }
      }
    }
  } catch {
    // graphql-config not found or failed to load, continue to default
  }

  // 3. Fall back to default
  log('No schema provided, using default: schema.graphql');
  return 'schema.graphql';
}
