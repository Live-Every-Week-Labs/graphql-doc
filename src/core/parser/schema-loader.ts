import { loadSchema } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { UrlLoader } from '@graphql-tools/url-loader';
import { GraphQLSchema } from 'graphql';
import { DIRECTIVE_DEFINITIONS } from './directive-definitions.js';

export interface SchemaLoaderOptions {
  /**
   * Path to the schema file or URL
   */
  schemaPointer: string | string[];
  /**
   * Extra SDL files to merge into the schema (framework scalars/directives).
   */
  schemaExtensions?: string[];
  /**
   * Optional headers for URL loading
   */
  headers?: Record<string, string>;
  /**
   * Allow loading schema from remote URLs (http/https). Defaults to false.
   */
  allowRemoteSchema?: boolean;
}

export class SchemaLoader {
  /**
   * Loads a GraphQL schema from a file or URL.
   * Supports .graphql, .gql files and introspection from URLs.
   *
   * Automatically injects @docGroup, @docPriority, @docTags, and @docIgnore
   * directive definitions for documentation processing.
   */
  async load(options: SchemaLoaderOptions): Promise<GraphQLSchema> {
    try {
      const basePointers = Array.isArray(options.schemaPointer)
        ? options.schemaPointer
        : [options.schemaPointer];
      const extensionPointers = options.schemaExtensions ?? [];
      const pointers = [...extensionPointers, ...basePointers];

      const hasRemote = pointers.some((pointer) => /^https?:\/\//i.test(pointer));
      if (hasRemote && !options.allowRemoteSchema) {
        throw new Error(
          'Remote schema loading is disabled. Set allowRemoteSchema: true in config to enable.'
        );
      }
      const schema = await loadSchema(pointers, {
        loaders: [new GraphQLFileLoader(), new UrlLoader()],
        headers: options.headers,
        typeDefs: DIRECTIVE_DEFINITIONS,
      });

      return schema;
    } catch (error) {
      throw new Error(
        `Failed to load schema from ${options.schemaPointer}: ${(error as Error).message}`
      );
    }
  }
}
