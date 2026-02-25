import { beforeEach, describe, expect, it, vi } from 'vitest';

const runPluginGenerationMock = vi.hoisted(() => vi.fn());
const loadGeneratorConfigMock = vi.hoisted(() => vi.fn());
const resolveConfigPathsMock = vi.hoisted(() => vi.fn());
const resolveSchemaPointerMock = vi.hoisted(() => vi.fn());
const resolveSchemaPointersMock = vi.hoisted(() => vi.fn());
const schemaLoaderLoadMock = vi.hoisted(() => vi.fn());

vi.mock('./run-generation.js', () => ({
  runPluginGeneration: runPluginGenerationMock,
}));

vi.mock('../../../config/loader.js', () => ({
  loadGeneratorConfig: loadGeneratorConfigMock,
  resolveConfigPaths: resolveConfigPathsMock,
}));

vi.mock('../../../config/schema-pointer.js', () => ({
  resolveSchemaPointer: resolveSchemaPointerMock,
  resolveSchemaPointers: resolveSchemaPointersMock,
}));

vi.mock('../../../parser/schema-loader.js', () => ({
  SchemaLoader: class {
    load = schemaLoaderLoadMock;
  },
}));

import type { NormalizedGraphqlDocDocusaurusPluginOptions } from './options.js';
import { registerCliCommands } from './extend-cli.js';

interface CapturedCommand {
  description?: string;
  action?: () => void | Promise<void>;
}

function createMockCli() {
  const commands = new Map<string, CapturedCommand>();

  const cli = {
    command: vi.fn((name: string) => {
      const captured: CapturedCommand = {};
      commands.set(name, captured);

      const chain = {
        description(text: string) {
          captured.description = text;
          return chain;
        },
        action(handler: () => void | Promise<void>) {
          captured.action = handler;
          return chain;
        },
      };

      return chain;
    }),
  };

  return { cli, commands };
}

function createOptions(
  overrides: Partial<NormalizedGraphqlDocDocusaurusPluginOptions> = {}
): NormalizedGraphqlDocDocusaurusPluginOptions {
  return {
    id: 'default',
    configPath: './graphql-doc.config.json',
    schema: './schema.graphql',
    outputDir: undefined,
    cleanOutput: undefined,
    llmDocs: true,
    llmDocsStrategy: undefined,
    llmDocsDepth: undefined,
    llmExamples: true,
    markdownRedirect: {
      enabled: true,
      docsBasePath: '/docs/api',
      llmDocsPath: '/llm-docs',
      staticDir: undefined,
    },
    verbose: false,
    quiet: false,
    ...overrides,
  };
}

describe('registerCliCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers generate and validate commands with descriptions', () => {
    const { cli, commands } = createMockCli();

    registerCliCommands(cli, '/repo', createOptions());

    expect(commands.get('graphql-doc:generate')).toEqual({
      description: 'Run graphql-doc generation outside the build lifecycle',
      action: expect.any(Function),
    });
    expect(commands.get('graphql-doc:validate')).toEqual({
      description: 'Validate graphql-doc configuration and schema',
      action: expect.any(Function),
    });
  });

  it('delegates graphql-doc:generate to runPluginGeneration', async () => {
    runPluginGenerationMock.mockResolvedValue({
      schemaPointer: '/repo/schema.graphql',
      outputDir: '/repo/docs/api',
      filesWritten: 8,
      llmFilesWritten: 3,
    });

    const { cli, commands } = createMockCli();
    const options = createOptions();
    registerCliCommands(cli, '/repo', options);

    const action = commands.get('graphql-doc:generate')?.action;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await action?.();

    expect(runPluginGenerationMock).toHaveBeenCalledWith({
      siteDir: '/repo',
      options,
    });
    expect(logSpy).toHaveBeenCalledWith('[graphql-doc] Generated 8 API docs, 3 LLM docs');
    logSpy.mockRestore();
  });

  it('delegates graphql-doc:validate to config and schema resolution', async () => {
    loadGeneratorConfigMock.mockResolvedValue({
      schemaExtensions: ['./schema/extensions.graphql'],
      allowRemoteSchema: false,
    });
    resolveConfigPathsMock.mockImplementation((config: unknown) => config);
    resolveSchemaPointerMock.mockResolvedValue('./schema.graphql');
    resolveSchemaPointersMock.mockReturnValue('/repo/schema.graphql');
    schemaLoaderLoadMock.mockResolvedValue(undefined);

    const { cli, commands } = createMockCli();
    const options = createOptions();
    registerCliCommands(cli, '/repo', options);

    const action = commands.get('graphql-doc:validate')?.action;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await action?.();

    expect(loadGeneratorConfigMock).toHaveBeenCalledWith('/repo', './graphql-doc.config.json');
    expect(resolveConfigPathsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaExtensions: ['./schema/extensions.graphql'],
      }),
      '/repo'
    );
    expect(resolveSchemaPointerMock).toHaveBeenCalledWith(
      {
        schema: './schema.graphql',
      },
      '/repo',
      expect.objectContaining({
        silent: true,
      })
    );
    expect(resolveSchemaPointersMock).toHaveBeenCalledWith('./schema.graphql', '/repo');
    expect(schemaLoaderLoadMock).toHaveBeenCalledWith({
      schemaPointer: '/repo/schema.graphql',
      schemaExtensions: ['./schema/extensions.graphql'],
      allowRemoteSchema: false,
    });
    expect(logSpy).toHaveBeenCalledWith('[graphql-doc] Configuration and schema are valid.');
    logSpy.mockRestore();
  });

  it('suppresses success logs when quiet mode is enabled', async () => {
    runPluginGenerationMock.mockResolvedValue({
      schemaPointer: '/repo/schema.graphql',
      outputDir: '/repo/docs/api',
      filesWritten: 8,
      llmFilesWritten: 3,
    });
    loadGeneratorConfigMock.mockResolvedValue({
      schemaExtensions: [],
      allowRemoteSchema: false,
    });
    resolveConfigPathsMock.mockImplementation((config: unknown) => config);
    resolveSchemaPointerMock.mockResolvedValue('./schema.graphql');
    resolveSchemaPointersMock.mockReturnValue('/repo/schema.graphql');
    schemaLoaderLoadMock.mockResolvedValue(undefined);

    const { cli, commands } = createMockCli();
    const options = createOptions({ quiet: true });
    registerCliCommands(cli, '/repo', options);

    const generateAction = commands.get('graphql-doc:generate')?.action;
    const validateAction = commands.get('graphql-doc:validate')?.action;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await generateAction?.();
    await validateAction?.();

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
