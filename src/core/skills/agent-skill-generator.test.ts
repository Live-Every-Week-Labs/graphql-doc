import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { DocModel, Operation } from '../transformer/types.js';
import { Config } from '../config/schema.js';
import { generateAgentSkillArtifacts } from './agent-skill-generator.js';

const mockOperation: Operation = {
  name: 'getUser',
  operationType: 'query',
  description: 'Fetch a user by id.',
  arguments: [],
  returnType: { kind: 'OBJECT', name: 'User', fields: [] },
  returnTypeString: 'User',
  directives: { docGroup: { name: 'Users', order: 1 } },
  referencedTypes: ['User'],
  isDeprecated: false,
  examples: [],
};

const mockModel: DocModel = {
  sections: [
    {
      name: 'Users',
      order: 1,
      subsections: [{ name: '', operations: [mockOperation] }],
    },
  ],
  types: [{ kind: 'OBJECT', name: 'User', fields: [] }],
};

function createConfig(overrides: Partial<Config> = {}): Config {
  return {
    outputDir: '/tmp/output',
    cleanOutputDir: false,
    framework: 'docusaurus',
    introDocs: [],
    metadataDir: '/tmp/metadata',
    examplesDir: '/tmp/metadata/examples',
    exampleFiles: undefined,
    schemaExtensions: [],
    allowRemoteSchema: false,
    includeDeprecated: true,
    requireExamplesForDocumentedOperations: false,
    excludeDocGroups: [],
    skipTypes: [],
    typeExpansion: {
      maxDepth: 5,
      defaultLevels: 0,
      showCircularReferences: true,
    },
    agentSkill: {
      enabled: false,
      name: 'graphql-api-skill',
      description: undefined,
      outputDir: undefined,
      includeExamples: true,
      pythonScriptName: 'graphql_docs_skill.py',
      introDoc: {
        enabled: true,
        outputPath: 'intro/ai-agent-skill.mdx',
        id: undefined,
        label: 'AI Agent Skill',
        title: 'AI Agent Skill',
        downloadUrl: undefined,
      },
    },
    adapters: {
      docusaurus: {},
    },
    llmDocs: {
      enabled: true,
      outputDir: '/tmp/llm-docs',
      strategy: 'chunked',
      includeExamples: true,
      generateManifest: true,
      singleFileName: 'api-reference.md',
      maxTypeDepth: 3,
    },
    ...overrides,
  };
}

describe('generateAgentSkillArtifacts', () => {
  it('returns no artifacts when agent skill is disabled', async () => {
    const result = await generateAgentSkillArtifacts(mockModel, createConfig());
    expect(result.files).toHaveLength(0);
    expect(result.introDoc).toBeUndefined();
  });

  it('generates SKILL, script, zip, and intro docs when enabled', async () => {
    const config = createConfig({
      outputDir: '/tmp/output',
      agentSkill: {
        enabled: true,
        name: 'graphql-api-skill',
        includeExamples: true,
        pythonScriptName: 'graphql_docs_skill.py',
        outputDir: '/tmp/output/agent-skills/graphql-api-skill',
        introDoc: {
          enabled: true,
          outputPath: 'intro/ai-agent-skill.mdx',
          label: 'AI Agent Skill',
          title: 'AI Agent Skill',
        },
      },
    });

    const result = await generateAgentSkillArtifacts(mockModel, config);
    const skillFile = result.files.find((file) => file.path.endsWith('/SKILL.md'));
    const scriptFile = result.files.find((file) =>
      file.path.endsWith('/scripts/graphql_docs_skill.py')
    );
    const operationsDataFile = result.files.find((file) =>
      file.path.endsWith('/_data/operations.json')
    );
    const typesDataFile = result.files.find((file) => file.path.endsWith('/_data/types.json'));
    const zipFile = result.files.find((file) => file.path.endsWith('/graphql-api-skill.zip'));

    expect(skillFile).toBeDefined();
    expect(skillFile?.content).toContain('name: graphql-api-skill');
    expect(skillFile?.content).toContain('python3 <SKILL_DIR>/scripts/graphql_docs_skill.py');
    expect(scriptFile).toBeDefined();
    expect(scriptFile?.content).toContain('DEFAULT_DOCS_ROOT = SKILL_DIR');
    expect(scriptFile?.content).toContain('normalize_global_option_placement');
    expect(scriptFile?.content).toContain("GLOBAL_OPTIONS_WITH_VALUES = {'--docs-root'");
    expect(operationsDataFile).toBeDefined();
    expect(typesDataFile).toBeDefined();
    expect(zipFile).toBeDefined();
    expect(zipFile?.binaryContent).toBeInstanceOf(Buffer);
    const zip = await JSZip.loadAsync(zipFile!.binaryContent!);
    expect(zip.file('graphql-api-skill/SKILL.md')).toBeDefined();
    expect(zip.file('graphql-api-skill/scripts/graphql_docs_skill.py')).toBeDefined();
    expect(zip.file('graphql-api-skill/_data/operations.json')).toBeDefined();
    expect(zip.file('graphql-api-skill/_data/types.json')).toBeDefined();
    expect(result.introDoc?.outputPath).toBe('intro/ai-agent-skill.mdx');
    expect(result.introDoc?.title).toBe('AI Agent Skill');
    expect(result.introDoc?.label).toBe('AI Agent Skill');
    expect(result.introDoc?.content).toContain('Download Skill Package (.zip)');
    expect(result.introDoc?.content).toContain('graphql-api-skill.zip');
  });

  it('uses intro title for both page title and sidebar label', async () => {
    const config = createConfig({
      agentSkill: {
        enabled: true,
        name: 'graphql-api-skill',
        includeExamples: true,
        pythonScriptName: 'graphql_docs_skill.py',
        outputDir: '/tmp/output/agent-skills/graphql-api-skill',
        introDoc: {
          enabled: true,
          outputPath: 'intro/ai-agent-skill.mdx',
          title: 'GraphQL Skill',
          description: 'Download and install this package.',
        },
      },
    });

    const result = await generateAgentSkillArtifacts(mockModel, config);
    expect(result.introDoc?.title).toBe('GraphQL Skill');
    expect(result.introDoc?.label).toBe('GraphQL Skill');
    expect(result.introDoc?.content).toContain('Download and install this package.');
  });
});
