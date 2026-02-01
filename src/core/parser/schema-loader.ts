import { loadSchema } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { UrlLoader } from '@graphql-tools/url-loader';
import { GraphQLSchema } from 'graphql';

export interface SchemaLoaderOptions {
  /**
   * Path to the schema file or URL
   */
  schemaPointer: string;
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
   */
  async load(options: SchemaLoaderOptions): Promise<GraphQLSchema> {
    try {
      const isRemote = /^https?:\/\//i.test(options.schemaPointer);
      if (isRemote && !options.allowRemoteSchema) {
        throw new Error(
          'Remote schema loading is disabled. Set allowRemoteSchema: true in config to enable.'
        );
      }
      const schema = await loadSchema(options.schemaPointer, {
        loaders: [new GraphQLFileLoader(), new UrlLoader()],
        headers: options.headers,
      });

      return schema;
    } catch (error) {
      throw new Error(
        `Failed to load schema from ${options.schemaPointer}: ${(error as Error).message}`
      );
    }
  }
}
