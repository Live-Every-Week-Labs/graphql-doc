import { z } from 'zod';

const IntroDocSchema = z.union([
  z.string(),
  z.object({
    source: z.string(),
    outputPath: z.string().optional(),
    id: z.string().optional(),
    label: z.string().optional(),
    title: z.string().optional(),
  }),
]);

const DocusaurusAdapterSchema = z
  .object({
    singlePage: z.boolean().default(false),
    docsRoot: z.string().default('./docs'),
    docIdPrefix: z.string().optional(),
    unsafeMdxDescriptions: z.boolean().default(false),
    typeLinkMode: z.enum(['none', 'deep', 'all']).default('none'),
    llmDocsBasePath: z.string().optional(),
    generateSidebar: z.boolean().default(true),
    sidebarFile: z.string().optional(),
    sidebarCategoryIndex: z.boolean().default(false),
    sidebarMerge: z.boolean().default(true),
    sidebarTarget: z.string().default('apiSidebar'),
    sidebarInsertPosition: z
      .enum(['replace', 'append', 'prepend', 'before', 'after'])
      .default('replace'),
    sidebarInsertReference: z.string().optional(),
    sidebarSectionLabels: z
      .object({
        operations: z.string().optional(),
        types: z.string().optional(),
      })
      .default({
        operations: 'Operations',
        types: 'Types',
      }),
    introDocs: z.array(IntroDocSchema).default([]),
  })
  .default({});

const AdaptersSchema = z
  .object({
    docusaurus: DocusaurusAdapterSchema.default({}),
  })
  .passthrough()
  .default({ docusaurus: {} });

const LlmDocsSchema = z
  .object({
    enabled: z.boolean().default(true),
    outputDir: z.string().default('llm-docs'),
    strategy: z.enum(['single', 'chunked']).default('chunked'),
    includeExamples: z.boolean().default(true),
    generateManifest: z.boolean().default(true),
    singleFileName: z.string().default('api-reference.md'),
    maxTypeDepth: z.number().min(1).max(5).default(3),
    baseUrl: z.string().optional(),
    apiName: z.string().optional(),
    apiDescription: z.string().optional(),
  })
  .default({});

export const ConfigSchema = z.object({
  outputDir: z.string().default('./docs/api'),
  cleanOutputDir: z.boolean().default(false),
  framework: z.string().default('docusaurus'),
  metadataDir: z.string().default('./docs-metadata'),
  examplesDir: z.string().optional(),
  exampleFiles: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return [value];
      }
      return value;
    }, z.array(z.string()))
    .optional(),
  schemaExtensions: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return [value];
      }
      return value;
    }, z.array(z.string()))
    .default([]),
  allowRemoteSchema: z.boolean().default(false),
  includeDeprecated: z.boolean().default(true),
  requireExamplesForDocumentedOperations: z.boolean().default(false),
  excludeDocGroups: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return [value];
      }
      return value;
    }, z.array(z.string()))
    .default([]),
  skipTypes: z.array(z.string()).default([]),
  typeExpansion: z
    .object({
      maxDepth: z.number().default(5),
      defaultLevels: z.number().default(0),
      showCircularReferences: z.boolean().default(true),
    })
    .default({}),
  adapters: AdaptersSchema,
  llmDocs: LlmDocsSchema,
});

export type Config = z.infer<typeof ConfigSchema>;
export type DocusaurusAdapterConfig = z.infer<typeof DocusaurusAdapterSchema>;
export type LlmDocsConfig = z.infer<typeof LlmDocsSchema>;
