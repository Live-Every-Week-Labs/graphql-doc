import path from 'path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { GeneratedFile } from '../adapters/types.js';
import { Config, IntroDocConfigObject } from '../config/schema.js';
import { DocModel, Operation } from '../transformer/types.js';
import {
  toPosix,
  firstSentence,
  collectOperations,
  MAX_PREVIEW_OPERATIONS,
} from '../utils/index.js';
import type { SerializedDocData } from '../serialization/doc-data.js';

export interface AgentSkillArtifacts {
  files: GeneratedFile[];
  introDoc?: IntroDocConfigObject;
}

const SKILL_DATA_DIR = '_data';
const SKILL_OPERATIONS_DATA_FILE = path.posix.join(SKILL_DATA_DIR, 'operations.json');
const SKILL_TYPES_DATA_FILE = path.posix.join(SKILL_DATA_DIR, 'types.json');
const SKILL_SCRIPT_TEMPLATE_FILE = 'agent-skill-script.py';
const INCLUDE_EXAMPLES_PLACEHOLDER = '__INCLUDE_EXAMPLES_BY_DEFAULT__';
const FALLBACK_DOCS_ROOT_PLACEHOLDER = '__FALLBACK_DOCS_ROOT_EXPR__';

function getCurrentDirectory(): string {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return path.dirname(fileURLToPath(import.meta.url));
  }

  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }

  throw new Error('Unable to determine current directory for agent skill template loading.');
}

function resolveSkillScriptTemplatePath(): string {
  const currentDir = getCurrentDirectory();
  const candidates = [
    path.resolve(currentDir, '..', '..', '..', 'templates', SKILL_SCRIPT_TEMPLATE_FILE),
    path.resolve(currentDir, '..', 'templates', SKILL_SCRIPT_TEMPLATE_FILE),
    path.resolve(process.cwd(), 'templates', SKILL_SCRIPT_TEMPLATE_FILE),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to locate skill script template "${SKILL_SCRIPT_TEMPLATE_FILE}". Tried: ${candidates.join(
      ', '
    )}`
  );
}

function toPythonLiteral(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function normalizeHref(value: string): string {
  const normalized = toPosix(value);
  if (normalized.startsWith('.')) {
    return normalized;
  }
  return `./${normalized}`;
}

function isRelativeAssetHref(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return false;
  }
  return !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed);
}

function defaultDescription(apiName?: string): string {
  const displayName = apiName?.trim() || 'this API';
  return `Use generated GraphQL docs JSON for ${displayName} to discover operations and fetch schema details with examples.`;
}

function buildSkillMarkdown(
  skillName: string,
  description: string,
  scriptName: string,
  operations: Operation[],
  includeExamples: boolean
): string {
  const previewOperations = operations.slice(0, MAX_PREVIEW_OPERATIONS);
  const operationLines = previewOperations.map((operation) => {
    const summary = firstSentence(operation.description) || 'No description.';
    return `- \`${operation.name}\` (\`${operation.operationType}\`): ${summary}`;
  });
  const operationPreview =
    operationLines.length > 0
      ? `${operationLines.join('\n')}${operations.length > previewOperations.length ? '\n- ...' : ''}`
      : '- No operations were generated.';

  return [
    '---',
    `name: ${skillName}`,
    `description: ${description}`,
    '---',
    '',
    `# ${skillName}`,
    '',
    'Use this skill to query generated GraphQL docs JSON in two steps:',
    '1. List operations with short descriptions.',
    '2. Fetch one operation with full argument/type details and examples.',
    '',
    '## Workflow',
    '',
    '1. Resolve `SKILL_DIR` as the directory that contains this `SKILL.md`.',
    `2. Run \`python3 <SKILL_DIR>/scripts/${scriptName} list-operations --docs-root <docs-output-dir>\` to shortlist operations.`,
    `3. Run \`python3 <SKILL_DIR>/scripts/${scriptName} get-operation <operation-name> --docs-root <docs-output-dir>\` for full details.`,
    '',
    'If docs are packaged in `<SKILL_DIR>/_data`, `--docs-root` is optional.',
    '',
    '## Commands',
    '',
    `- \`python3 <SKILL_DIR>/scripts/${scriptName} list-operations --docs-root <docs-output-dir>\``,
    `- \`python3 <SKILL_DIR>/scripts/${scriptName} get-operation <operation-name> --docs-root <docs-output-dir>\``,
    '',
    includeExamples
      ? '- Examples are included by default in `get-operation` output.'
      : '- Examples are disabled by config and omitted from `get-operation` output.',
    '',
    '## Output Contract',
    '',
    '- `list-operations`: JSON array with `name`, `operationType`, `description`, `docGroup`, `hasExamples`.',
    '- `get-operation`: JSON object with `operation` and `relatedTypes`.',
    '',
    '## Operation Preview',
    '',
    operationPreview,
    '',
  ].join('\n');
}

function buildScript(defaultDocsRootFromScript: string, includeExamplesByDefault: boolean): string {
  const docsRootSegments = toPosix(defaultDocsRootFromScript).split('/').filter(Boolean);
  const defaultDocsRootExpr =
    docsRootSegments.length > 0
      ? `os.path.abspath(os.path.join(SCRIPT_DIR, ${docsRootSegments.map(toPythonLiteral).join(', ')}))`
      : 'SCRIPT_DIR';
  const templateContent = fs.readFileSync(resolveSkillScriptTemplatePath(), 'utf-8');

  if (!templateContent.includes(INCLUDE_EXAMPLES_PLACEHOLDER)) {
    throw new Error(
      `Skill script template is missing placeholder: ${INCLUDE_EXAMPLES_PLACEHOLDER}`
    );
  }
  if (!templateContent.includes(FALLBACK_DOCS_ROOT_PLACEHOLDER)) {
    throw new Error(
      `Skill script template is missing placeholder: ${FALLBACK_DOCS_ROOT_PLACEHOLDER}`
    );
  }

  return templateContent
    .replace(INCLUDE_EXAMPLES_PLACEHOLDER, includeExamplesByDefault ? 'True' : 'False')
    .replace(FALLBACK_DOCS_ROOT_PLACEHOLDER, defaultDocsRootExpr);
}

async function buildSkillZip(
  skillName: string,
  skillMdContent: string,
  scriptName: string,
  scriptContent: string,
  operationsDataContent: string,
  typesDataContent: string
): Promise<Buffer> {
  const zip = new JSZip();
  const skillDir = zip.folder(skillName);
  if (!skillDir) {
    throw new Error('Failed to create skill archive folder.');
  }

  skillDir.file('SKILL.md', skillMdContent);
  skillDir.file(path.posix.join('scripts', scriptName), scriptContent);
  skillDir.file(SKILL_OPERATIONS_DATA_FILE, operationsDataContent);
  skillDir.file(SKILL_TYPES_DATA_FILE, typesDataContent);

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}

function buildIntroDocContent(options: {
  pageTitle: string;
  pageDescription: string;
  skillOutputDir: string;
  downloadHref?: string;
  downloadLabel: string;
  useMdxAssetImport: boolean;
  apiName?: string;
}): string {
  const {
    pageTitle,
    pageDescription,
    skillOutputDir,
    downloadHref,
    downloadLabel,
    useMdxAssetImport,
    apiName,
  } = options;

  const mdxImportLines: string[] = [];
  let downloadContent: string;
  if (downloadHref) {
    if (/^\s*javascript\s*:/i.test(downloadHref)) {
      throw new Error('downloadHref must not use the javascript: protocol');
    }
    const safeLabel = downloadLabel.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const shouldImportAsAsset = useMdxAssetImport && isRelativeAssetHref(downloadHref);
    if (shouldImportAsAsset) {
      const importPath = downloadHref.replace(/\\/g, '/').replace(/'/g, "\\'");
      mdxImportLines.push(`import skillPackageUrl from '${importPath}';`);
      downloadContent = `<p><a className="button button--primary button--lg" href={skillPackageUrl} download>${safeLabel}</a></p>`;
    } else {
      const normalizedHref = encodeURI(downloadHref);
      downloadContent = `<p><a className="button button--primary button--lg" href="${normalizedHref}">${safeLabel}</a></p>`;
    }
  } else {
    downloadContent = `Skill package is written to: \`${toPosix(path.resolve(skillOutputDir))}\``;
  }

  const displayName = apiName?.trim() || '';
  const blurb = pageDescription
    ? pageDescription
    : displayName
      ? `Give your AI coding assistant deep knowledge of the ${displayName} GraphQL API. This skill package bundles structured operation data, type definitions, and usage examples so agents can discover and call API operations.`
      : `This skill package bundles structured operation data, type definitions, and usage examples so AI agents can discover and call API operations.`;

  return [
    ...mdxImportLines,
    ...(mdxImportLines.length > 0 ? [''] : []),
    `# ${pageTitle}`,
    '',
    blurb,
    '',
    downloadContent,
    '',
    '---',
    '',
    '## Platform Setup',
    '',
    'Find details on how to use skills for your favorite AI tools below:',
    '',
    '- [Claude Code](https://code.claude.com/docs/en/skills)',
    '- [Claude Desktop](https://support.claude.com/en/articles/12512180-using-skills-in-claude)',
    '- [Codex CLI](https://developers.openai.com/codex/skills/)',
    '- [Gemini CLI](https://geminicli.com/docs/cli/skills/)',
    '- [Antigravity](https://antigravity.google/docs/skills)',
    '',
    '---',
    '',
    "## What's Included",
    '',
    `- **\`SKILL.md\`** — Skill definition and workflow instructions`,
    `- **\`scripts/\`** — Python helper for querying operations and types`,
    `- **\`_data/\`** — Bundled operation and type data in JSON format`,
    '',
  ].join('\n');
}

export async function generateAgentSkillArtifacts(
  model: DocModel,
  config: Config,
  serializedData: SerializedDocData
): Promise<AgentSkillArtifacts> {
  if (!config.agentSkill?.enabled) {
    return { files: [] };
  }

  const operations = collectOperations(model);
  const skillName = config.agentSkill.name;
  const skillDescription =
    config.agentSkill.description ?? defaultDescription(config.llmDocs?.apiName);
  const scriptName = config.agentSkill.pythonScriptName;
  const skillOutputDir =
    config.agentSkill.outputDir ?? path.join(config.outputDir, 'agent-skills', skillName);
  const includeExamples = config.agentSkill.includeExamples;
  const introDocConfig = config.agentSkill.introDoc;
  const introOutputPath = introDocConfig.outputPath;
  const scriptAbsolutePath = path.resolve(skillOutputDir, 'scripts', scriptName);
  const docsOutputDir = path.resolve(config.outputDir);
  const defaultDocsRootFromScript =
    toPosix(path.relative(path.dirname(scriptAbsolutePath), docsOutputDir)) || '.';

  const skillMdContent = buildSkillMarkdown(
    skillName,
    skillDescription,
    scriptName,
    operations,
    includeExamples
  );
  const scriptContent = buildScript(defaultDocsRootFromScript, includeExamples);
  const operationsDataContent = serializedData.operationsJson;
  const typesDataContent = serializedData.typesJson;
  const skillZipContent = await buildSkillZip(
    skillName,
    skillMdContent,
    scriptName,
    scriptContent,
    operationsDataContent,
    typesDataContent
  );
  const skillZipFileName = `${skillName}.zip`;

  const resolvedSkillOutput = path.resolve(skillOutputDir);
  const resolvedDocsOutput = path.resolve(config.outputDir);
  const withinDocsOutput =
    resolvedSkillOutput === resolvedDocsOutput ||
    resolvedSkillOutput.startsWith(`${resolvedDocsOutput}${path.sep}`);
  const skillOutputRelative = toPosix(path.relative(resolvedDocsOutput, resolvedSkillOutput));

  const toGeneratedFile = (
    relativePath: string,
    content: string,
    type: GeneratedFile['type'],
    binaryContent?: Buffer
  ): GeneratedFile => {
    if (withinDocsOutput) {
      return {
        path: path.posix.join(skillOutputRelative, toPosix(relativePath)),
        content,
        type,
        ...(binaryContent ? { binaryContent } : {}),
      };
    }

    return {
      path: path.posix.join('agent-skills', skillName, toPosix(relativePath)),
      absolutePath: path.resolve(skillOutputDir, relativePath),
      content,
      type,
      ...(binaryContent ? { binaryContent } : {}),
    };
  };

  const files: GeneratedFile[] = [
    toGeneratedFile('SKILL.md', skillMdContent, 'md'),
    toGeneratedFile(path.posix.join('scripts', scriptName), scriptContent, 'py'),
    toGeneratedFile(SKILL_OPERATIONS_DATA_FILE, operationsDataContent, 'json'),
    toGeneratedFile(SKILL_TYPES_DATA_FILE, typesDataContent, 'json'),
    toGeneratedFile(skillZipFileName, '', 'zip', skillZipContent),
  ];

  if (!introDocConfig.enabled) {
    return { files };
  }

  const introDir = path.posix.dirname(toPosix(introOutputPath));
  let generatedZipHref: string | undefined;
  if (withinDocsOutput) {
    const zipPath = path.posix.join(skillOutputRelative, skillZipFileName);
    generatedZipHref = normalizeHref(path.posix.relative(introDir, zipPath));
  }
  const downloadHref = introDocConfig.downloadUrl ?? generatedZipHref;
  const pageTitle = (introDocConfig.title || introDocConfig.label || 'AI Agent Skill').trim();
  const pageDescription = introDocConfig.description?.trim() || '';
  const downloadLabel = (introDocConfig.downloadLabel || 'Download Skill Package (.zip)').trim();

  const introDoc: IntroDocConfigObject = {
    outputPath: introOutputPath,
    id: introDocConfig.id,
    label: pageTitle,
    title: pageTitle,
    content: buildIntroDocContent({
      pageTitle,
      pageDescription,
      skillOutputDir,
      downloadHref,
      downloadLabel,
      useMdxAssetImport: introOutputPath.toLowerCase().endsWith('.mdx'),
      apiName: config.llmDocs?.apiName,
    }),
  };

  return {
    files,
    introDoc,
  };
}
