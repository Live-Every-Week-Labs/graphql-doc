import { z } from 'zod';

export const ConfigSchema = z.object({
  outputDir: z.string().default('./docs/api'),
  framework: z.enum(['docusaurus']).default('docusaurus'),
  singlePage: z.boolean().default(false),
  metadataDir: z.string().default('./docs-metadata'),
  examplesDir: z.string().optional(),
  docsRoot: z.string().default('./docs'),
  docIdPrefix: z.string().optional(),
  schemaExtensions: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return [value];
      }
      return value;
    }, z.array(z.string()))
    .default([]),
  allowRemoteSchema: z.boolean().default(false),
  unsafeMdxDescriptions: z.boolean().default(false),
  includeDeprecated: z.boolean().default(true),
  typeLinkMode: z.enum(['none', 'deep', 'all']).default('none'),
  excludeDocGroups: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return [value];
      }
      return value;
    }, z.array(z.string()))
    .default([]),
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
  introDocs: z
    .array(
      z.union([
        z.string(),
        z.object({
          source: z.string(),
          outputPath: z.string().optional(),
          id: z.string().optional(),
          label: z.string().optional(),
          title: z.string().optional(),
        }),
      ])
    )
    .default([]),
  skipTypes: z.array(z.string()).default([]),
  generateSidebar: z.boolean().default(true),
  sidebarFile: z.string().optional(),
  typeExpansion: z
    .object({
      maxDepth: z.number().default(5),
      defaultLevels: z.number().default(0),
      showCircularReferences: z.boolean().default(true),
    })
    .default({}),
});

export type Config = z.infer<typeof ConfigSchema>;
