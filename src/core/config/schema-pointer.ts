import { loadConfig } from 'graphql-config';
import path from 'path';
import type { SchemaSourceConfig } from './schema.js';

type SchemaPointer = string | string[];

interface SchemaPointerWithFallback {
  primary: SchemaPointer;
  fallback: SchemaPointer;
}

function isSchemaPointerWithFallback(
  value: SchemaSourceConfig | undefined
): value is SchemaPointerWithFallback {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return 'primary' in value && 'fallback' in value;
}

export interface SchemaPointerResolverOptions {
  schema?: SchemaSourceConfig;
}

export interface SchemaResolverRuntimeOptions {
  silent?: boolean;
  log?: (message: string) => void;
}

export interface ResolvedSchemaPointerCandidates {
  primary: string | string[];
  fallback?: string | string[];
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

function formatSchemaPointerForLog(schemaPointer: string | string[]): string {
  return Array.isArray(schemaPointer) ? schemaPointer.join(', ') : schemaPointer;
}

async function resolvePrimarySchemaPointer(
  options: SchemaPointerResolverOptions,
  targetDir: string,
  runtimeOptions: SchemaResolverRuntimeOptions
): Promise<SchemaPointer> {
  const log = (message: string) => {
    if (runtimeOptions.silent) {
      return;
    }
    runtimeOptions.log?.(message);
  };

  if (options.schema) {
    if (isSchemaPointerWithFallback(options.schema)) {
      log(
        `Using schema primary pointer from explicit config: ${formatSchemaPointerForLog(
          options.schema.primary
        )}`
      );
      return options.schema.primary;
    }

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
  return resolvePrimarySchemaPointer(options, targetDir, runtimeOptions);
}

/**
 * Resolve primary + fallback schema pointers (when configured).
 *
 * The returned pointers are absolute for local paths and preserve remote URLs.
 */
export async function resolveSchemaPointerCandidates(
  options: SchemaPointerResolverOptions,
  targetDir: string,
  runtimeOptions: SchemaResolverRuntimeOptions = {}
): Promise<ResolvedSchemaPointerCandidates> {
  const primary = await resolvePrimarySchemaPointer(options, targetDir, runtimeOptions);
  const resolvedPrimary = resolveSchemaPointers(primary, targetDir);

  if (!isSchemaPointerWithFallback(options.schema)) {
    return { primary: resolvedPrimary };
  }

  const resolvedFallback = resolveSchemaPointers(options.schema.fallback, targetDir);
  if (!runtimeOptions.silent) {
    runtimeOptions.log?.(
      `Using fallback schema pointer from explicit config: ${formatSchemaPointerForLog(
        options.schema.fallback
      )}`
    );
  }

  return {
    primary: resolvedPrimary,
    fallback: resolvedFallback,
  };
}
