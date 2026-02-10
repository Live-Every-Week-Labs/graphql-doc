import { loadSchema } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { UrlLoader } from '@graphql-tools/url-loader';
import { GraphQLSchema } from 'graphql';
import dns from 'dns/promises';
import { DIRECTIVE_DEFINITIONS } from './directive-definitions.js';
import { formatPathListForMessage, getErrorMessage } from '../utils/index.js';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);

const PRIVATE_IP_RANGES = [
  /^127\./, // 127.0.0.0/8 loopback
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^169\.254\./, // 169.254.0.0/16 link-local (AWS metadata)
  /^0\./, // 0.0.0.0/8
  /^::1$/, // IPv6 loopback
  /^fd[0-9a-f]{2}:/i, // IPv6 ULA
  /^fe80:/i, // IPv6 link-local
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((pattern) => pattern.test(ip));
}

async function validateRemoteUrl(url: string): Promise<void> {
  const parsed = new URL(url);
  const hostname = parsed.hostname;

  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    throw new Error(`Remote schema URL blocked: hostname "${hostname}" is not allowed`);
  }

  // Check if hostname is already an IP literal
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.startsWith('[')) {
    const ip = hostname.replace(/^\[|\]$/g, '');
    if (isPrivateIp(ip)) {
      throw new Error(
        `Remote schema URL blocked: "${hostname}" resolves to a private/internal address`
      );
    }
    return;
  }

  // Resolve hostname and check all returned IPs
  const addresses = await dns.resolve4(hostname).catch(() => [] as string[]);
  const addresses6 = await dns.resolve6(hostname).catch(() => [] as string[]);
  const allAddresses = [...addresses, ...addresses6];

  if (allAddresses.length === 0) {
    throw new Error(`Remote schema URL blocked: could not resolve hostname "${hostname}"`);
  }

  for (const ip of allAddresses) {
    if (isPrivateIp(ip)) {
      throw new Error(
        `Remote schema URL blocked: "${hostname}" resolves to private/internal address ${ip}`
      );
    }
  }
}

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
   * When enabled, URLs pointing to private/internal IP addresses are blocked
   * to prevent SSRF attacks.
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

      const remotePointers = pointers.filter((pointer) => /^https?:\/\//i.test(pointer));
      if (remotePointers.length > 0 && !options.allowRemoteSchema) {
        throw new Error(
          'Remote schema loading is disabled. Set allowRemoteSchema: true in config to enable.'
        );
      }

      // Validate remote URLs to prevent SSRF
      for (const remoteUrl of remotePointers) {
        await validateRemoteUrl(remoteUrl);
      }

      const schema = await loadSchema(pointers, {
        loaders: [new GraphQLFileLoader(), new UrlLoader()],
        headers: options.headers,
        typeDefs: DIRECTIVE_DEFINITIONS,
      });

      return schema;
    } catch (error) {
      throw new Error(
        `Failed to load schema from ${formatPathListForMessage(options.schemaPointer)}: ${getErrorMessage(error)}`
      );
    }
  }
}
