import { loadConfig } from 'graphql-config';
import path from 'path';

export interface SchemaPointerResolverOptions {
  schema?: string | string[];
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
 * Resolve schema pointer from explicit options or graphql-config.
 *
 * Resolution order:
 * 1. Explicit schema option
 * 2. graphql-config `.graphqlrc` schema value
 * 3. `schema.graphql` fallback
 */
export async function resolveSchemaPointer(
  options: SchemaPointerResolverOptions,
  targetDir: string,
  runtimeOptions: SchemaResolverRuntimeOptions = {}
): Promise<string | string[]> {
  const log = (message: string) => {
    if (runtimeOptions.silent) {
      return;
    }
    runtimeOptions.log?.(message);
  };

  if (options.schema) {
    return options.schema;
  }

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
    // If graphql-config is missing/invalid, callers will use fallback defaults.
  }

  log('No schema provided, using default: schema.graphql');
  return 'schema.graphql';
}
