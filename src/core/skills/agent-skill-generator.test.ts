import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DocModel, Operation } from '../transformer/types.js';
import { generateAgentSkillArtifacts } from './agent-skill-generator.js';
import { createTestConfig } from '../../test/test-utils.js';
import { serializeDocData } from '../serialization/doc-data.js';

const execFileAsync = promisify(execFile);

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

function createConfig(overrides: Parameters<typeof createTestConfig>[0] = {}) {
  return createTestConfig({ outputDir: '/tmp/output', metadataDir: '/tmp/metadata', ...overrides });
}

describe('generateAgentSkillArtifacts', () => {
  it('returns no artifacts when agent skill is disabled', async () => {
    const result = await generateAgentSkillArtifacts(
      mockModel,
      createConfig(),
      serializeDocData(mockModel)
    );
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

    const result = await generateAgentSkillArtifacts(
      mockModel,
      config,
      serializeDocData(mockModel)
    );
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
    expect(scriptFile?.content).not.toContain('__INCLUDE_EXAMPLES_BY_DEFAULT__');
    expect(scriptFile?.content).not.toContain('__FALLBACK_DOCS_ROOT_EXPR__');
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
    expect(result.introDoc?.content).toContain('[Download Skill Package (.zip)](');
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

    const result = await generateAgentSkillArtifacts(
      mockModel,
      config,
      serializeDocData(mockModel)
    );
    expect(result.introDoc?.title).toBe('GraphQL Skill');
    expect(result.introDoc?.label).toBe('GraphQL Skill');
    expect(result.introDoc?.content).toContain('Download and install this package.');
  });

  it('generates a Python script that runs against bundled JSON data', async () => {
    const config = createConfig({
      outputDir: '/tmp/output',
      agentSkill: {
        enabled: true,
        name: 'graphql-api-skill',
        includeExamples: true,
        pythonScriptName: 'graphql_docs_skill.py',
        outputDir: '/tmp/output/agent-skills/graphql-api-skill',
        introDoc: {
          enabled: false,
          outputPath: 'intro/ai-agent-skill.mdx',
        },
      },
    });
    const result = await generateAgentSkillArtifacts(
      mockModel,
      config,
      serializeDocData(mockModel)
    );

    const scriptFile = result.files.find((file) =>
      file.path.endsWith('/scripts/graphql_docs_skill.py')
    );
    const operationsDataFile = result.files.find((file) =>
      file.path.endsWith('/_data/operations.json')
    );
    const typesDataFile = result.files.find((file) => file.path.endsWith('/_data/types.json'));
    expect(scriptFile).toBeDefined();
    expect(operationsDataFile).toBeDefined();
    expect(typesDataFile).toBeDefined();

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'graphql-docs-skill-script-'));
    const skillDir = path.join(tempDir, 'graphql-api-skill');
    const scriptPath = path.join(skillDir, 'scripts', 'graphql_docs_skill.py');
    const dataDir = path.join(skillDir, '_data');
    await fs.ensureDir(path.dirname(scriptPath));
    await fs.ensureDir(dataDir);
    await fs.writeFile(scriptPath, scriptFile!.content, 'utf-8');
    await fs.writeFile(path.join(dataDir, 'operations.json'), operationsDataFile!.content, 'utf-8');
    await fs.writeFile(path.join(dataDir, 'types.json'), typesDataFile!.content, 'utf-8');

    try {
      const listResult = await execFileAsync('python3', [scriptPath, 'list-operations']);
      const listed = JSON.parse(listResult.stdout) as Array<{ name: string }>;
      expect(listed.some((item) => item.name === 'getUser')).toBe(true);

      const detailResult = await execFileAsync('python3', [scriptPath, 'get-operation', 'getUser']);
      const detail = JSON.parse(detailResult.stdout) as { operation: { name: string } };
      expect(detail.operation.name).toBe('getUser');
    } finally {
      await fs.remove(tempDir);
    }
  });
});
