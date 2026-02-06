import path from 'path';
import JSZip from 'jszip';
import { GeneratedFile } from '../adapters/types.js';
import { Config, IntroDocConfigObject } from '../config/schema.js';
import { DocModel, ExpandedType, Operation } from '../transformer/types.js';

export interface AgentSkillArtifacts {
  files: GeneratedFile[];
  introDoc?: IntroDocConfigObject;
}

const SKILL_DATA_DIR = '_data';
const SKILL_OPERATIONS_DATA_FILE = path.posix.join(SKILL_DATA_DIR, 'operations.json');
const SKILL_TYPES_DATA_FILE = path.posix.join(SKILL_DATA_DIR, 'types.json');

function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}

function normalizeHref(value: string): string {
  const normalized = toPosix(value);
  if (normalized.startsWith('.')) {
    return normalized;
  }
  return `./${normalized}`;
}

function defaultDescription(apiName?: string): string {
  const displayName = apiName?.trim() || 'this API';
  return `Use generated GraphQL docs JSON for ${displayName} to discover operations and fetch schema details with examples.`;
}

function defaultIntroDocDescription(skillName: string): string {
  return `Download the ${skillName} package to install this API skill in your agent tooling.`;
}

function firstSentence(value?: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^[\s\S]*?[.!?](\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

function collectOperations(model: DocModel): Operation[] {
  const operations: Operation[] = [];
  for (const section of model.sections) {
    for (const subsection of section.subsections) {
      operations.push(...subsection.operations);
    }
  }
  return operations;
}

function buildOperationsByType(
  model: DocModel
): Record<Operation['operationType'], Record<string, Operation>> {
  const operationsByType: Record<Operation['operationType'], Record<string, Operation>> = {
    query: {},
    mutation: {},
    subscription: {},
  };

  for (const section of model.sections) {
    for (const subsection of section.subsections) {
      for (const operation of subsection.operations) {
        operationsByType[operation.operationType][operation.name] = operation;
      }
    }
  }

  return operationsByType;
}

function buildTypesByName(types: ExpandedType[]): Record<string, ExpandedType> {
  const typesByName: Record<string, ExpandedType> = {};

  for (const type of types) {
    if ('name' in type && typeof type.name === 'string') {
      typesByName[type.name] = type;
    }
  }

  return typesByName;
}

function buildSkillMarkdown(
  skillName: string,
  description: string,
  scriptName: string,
  operations: Operation[],
  includeExamples: boolean
): string {
  const previewOperations = operations.slice(0, 8);
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
  const docsRootLiteral = defaultDocsRootFromScript.split(path.sep).filter(Boolean).join("', '");
  const defaultDocsRootExpr = docsRootLiteral
    ? `os.path.abspath(os.path.join(SCRIPT_DIR, '${docsRootLiteral}'))`
    : 'SCRIPT_DIR';

  return `#!/usr/bin/env python3
"""
Query generated GraphQL docs JSON for operation-level lookup.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import deque
from typing import Any

BUILTIN_SCALARS = {'String', 'Boolean', 'Int', 'Float', 'ID'}
TYPE_NAME_RE = re.compile(r'[A-Za-z_][A-Za-z0-9_]*')
INCLUDE_EXAMPLES_BY_DEFAULT = ${includeExamplesByDefault ? 'True' : 'False'}
SUBCOMMANDS = {'list-operations', 'get-operation'}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
DEFAULT_DOCS_ROOT = SKILL_DIR
FALLBACK_DOCS_ROOT = ${defaultDocsRootExpr}
GLOBAL_OPTIONS_WITH_VALUES = {'--docs-root', '--operations-file', '--types-file'}


def load_json(file_path: str) -> Any:
    with open(file_path, 'r', encoding='utf-8') as handle:
        return json.load(handle)


def flatten_operations(operations_by_type: dict[str, dict[str, dict[str, Any]]]) -> list[dict[str, Any]]:
    operations: list[dict[str, Any]] = []
    for operation_type, entries in operations_by_type.items():
        if not isinstance(entries, dict):
            continue
        for operation_name, operation in entries.items():
            if not isinstance(operation, dict):
                continue
            record = dict(operation)
            record['name'] = record.get('name') or operation_name
            record['operationType'] = record.get('operationType') or operation_type
            operations.append(record)
    operations.sort(key=lambda op: (str(op.get('operationType', '')), str(op.get('name', ''))))
    return operations


def summarize_operation(operation: dict[str, Any]) -> dict[str, Any]:
    directives = operation.get('directives') or {}
    group = (directives.get('docGroup') or {}).get('name') or 'Uncategorized'
    description = (operation.get('description') or '').strip()
    return {
        'name': operation.get('name'),
        'operationType': operation.get('operationType'),
        'description': description,
        'docGroup': group,
        'hasExamples': bool(operation.get('examples')),
    }


def extract_type_names(type_string: str | None) -> set[str]:
    if not type_string:
        return set()
    names = {match.group(0) for match in TYPE_NAME_RE.finditer(type_string)}
    return {name for name in names if name not in BUILTIN_SCALARS}


def extract_type_names_from_ref(type_ref: Any) -> set[str]:
    names: set[str] = set()
    if isinstance(type_ref, dict):
        name = type_ref.get('name')
        if isinstance(name, str) and name not in BUILTIN_SCALARS:
            names.add(name)
        names.update(extract_type_names_from_ref(type_ref.get('ofType')))
    return names


def referenced_type_names(type_def: dict[str, Any]) -> set[str]:
    references: set[str] = set()
    for interface_name in type_def.get('interfaces') or []:
        if isinstance(interface_name, str):
            references.add(interface_name)
        elif isinstance(interface_name, dict):
            if isinstance(interface_name.get('name'), str):
                references.add(interface_name['name'])
            if isinstance(interface_name.get('ref'), str):
                references.add(interface_name['ref'])
    for possible_type in type_def.get('possibleTypes') or []:
        if isinstance(possible_type, str):
            references.add(possible_type)
        elif isinstance(possible_type, dict):
            if isinstance(possible_type.get('name'), str):
                references.add(possible_type['name'])
            if isinstance(possible_type.get('ref'), str):
                references.add(possible_type['ref'])
    for field in type_def.get('fields') or []:
        if not isinstance(field, dict):
            continue
        references.update(extract_type_names(field.get('typeString')))
        references.update(extract_type_names_from_ref(field.get('type')))
        for key in ('args', 'arguments'):
            for arg in field.get(key) or []:
                if isinstance(arg, dict):
                    references.update(extract_type_names(arg.get('typeString')))
                    references.update(extract_type_names_from_ref(arg.get('type')))
    return references


def collect_related_types(operation: dict[str, Any], types_by_name: dict[str, dict[str, Any]], max_depth: int) -> dict[str, dict[str, Any]]:
    seeds: set[str] = set()
    seeds.update(extract_type_names(operation.get('returnTypeString')))
    seeds.update(extract_type_names_from_ref(operation.get('returnType')))
    for key in ('arguments', 'args'):
        for arg in operation.get(key) or []:
            if isinstance(arg, dict):
                seeds.update(extract_type_names(arg.get('typeString')))
                seeds.update(extract_type_names_from_ref(arg.get('type')))
    for referenced_type in operation.get('referencedTypes') or []:
        if isinstance(referenced_type, str):
            seeds.add(referenced_type)
        elif isinstance(referenced_type, dict):
            if isinstance(referenced_type.get('name'), str):
                seeds.add(referenced_type['name'])
            if isinstance(referenced_type.get('ref'), str):
                seeds.add(referenced_type['ref'])

    related: dict[str, dict[str, Any]] = {}
    queue: deque[tuple[str, int]] = deque((name, 0) for name in seeds)

    while queue:
        name, depth = queue.popleft()
        if name in related:
            continue
        type_def = types_by_name.get(name)
        if not isinstance(type_def, dict):
            continue
        related[name] = type_def
        if depth >= max_depth:
            continue
        for ref in referenced_type_names(type_def):
            if ref not in related:
                queue.append((ref, depth + 1))

    return related


def find_operation(operations: list[dict[str, Any]], name: str) -> dict[str, Any] | None:
    for operation in operations:
        if operation.get('name') == name:
            return operation
    lowercase = name.lower()
    for operation in operations:
        operation_name = str(operation.get('name') or '')
        if operation_name.lower() == lowercase:
            return operation
    return None


def normalize_global_option_placement(argv: list[str]) -> list[str]:
    command_index = next((idx for idx, token in enumerate(argv) if token in SUBCOMMANDS), None)
    if command_index is None:
        return argv

    before_command = argv[:command_index]
    command = argv[command_index]
    after_command = argv[command_index + 1 :]

    moved_options: list[str] = []
    remaining_args: list[str] = []

    idx = 0
    while idx < len(after_command):
        token = after_command[idx]

        if any(token.startswith(f'{option}=') for option in GLOBAL_OPTIONS_WITH_VALUES):
            moved_options.append(token)
            idx += 1
            continue

        if token in GLOBAL_OPTIONS_WITH_VALUES:
            moved_options.append(token)
            if idx + 1 < len(after_command):
                moved_options.append(after_command[idx + 1])
                idx += 2
                continue
            idx += 1
            continue

        remaining_args.append(token)
        idx += 1

    if not moved_options:
        return argv

    return before_command + moved_options + [command] + remaining_args


def main() -> int:
    parser = argparse.ArgumentParser(description='Inspect generated GraphQL docs JSON for AI skills.')
    parser.add_argument('--docs-root', default=DEFAULT_DOCS_ROOT, help='Directory containing _data/operations.json and _data/types.json')
    parser.add_argument('--operations-file', default=None, help='Override operations JSON path')
    parser.add_argument('--types-file', default=None, help='Override types JSON path')

    subparsers = parser.add_subparsers(dest='command', required=True)
    subparsers.add_parser('list-operations', help='List operation names and descriptions')

    get_operation_parser = subparsers.add_parser('get-operation', help='Fetch full details for one operation')
    get_operation_parser.add_argument('operation_name', help='Operation name to fetch')
    get_operation_parser.add_argument('--max-depth', type=int, default=2, help='Max type traversal depth (default: 2)')
    get_operation_parser.add_argument('--include-examples', action='store_true', default=INCLUDE_EXAMPLES_BY_DEFAULT, help='Include examples in operation payload')
    get_operation_parser.add_argument('--no-include-examples', action='store_false', dest='include_examples', help='Exclude examples in operation payload')

    args = parser.parse_args(normalize_global_option_placement(sys.argv[1:]))

    docs_root = args.docs_root
    if not args.operations_file and not args.types_file:
        local_operations = os.path.join(docs_root, "_data", "operations.json")
        local_types = os.path.join(docs_root, "_data", "types.json")
        if not (os.path.exists(local_operations) and os.path.exists(local_types)):
            fallback_operations = os.path.join(FALLBACK_DOCS_ROOT, "_data", "operations.json")
            fallback_types = os.path.join(FALLBACK_DOCS_ROOT, "_data", "types.json")
            if os.path.exists(fallback_operations) and os.path.exists(fallback_types):
                docs_root = FALLBACK_DOCS_ROOT

    operations_file = args.operations_file or os.path.join(docs_root, "_data", "operations.json")
    types_file = args.types_file or os.path.join(docs_root, "_data", "types.json")

    try:
        operations_by_type = load_json(operations_file)
        types_by_name = load_json(types_file)
    except Exception as error:  # pragma: no cover
        print(json.dumps({'error': str(error), 'operationsFile': operations_file, 'typesFile': types_file}, indent=2), file=sys.stderr)
        return 1

    if not isinstance(operations_by_type, dict):
        print(json.dumps({'error': 'operations.json must be a JSON object keyed by operation type', 'operationsFile': operations_file}, indent=2), file=sys.stderr)
        return 1

    if not isinstance(types_by_name, dict):
        print(json.dumps({'error': 'types.json must be a JSON object keyed by type name', 'typesFile': types_file}, indent=2), file=sys.stderr)
        return 1

    operations = flatten_operations(operations_by_type)

    if args.command == 'list-operations':
        payload = [summarize_operation(operation) for operation in operations]
        print(json.dumps(payload, indent=2))
        return 0

    operation = find_operation(operations, args.operation_name)
    if operation is None:
        print(json.dumps({'error': f'Operation not found: {args.operation_name}'}, indent=2), file=sys.stderr)
        return 1

    operation_payload = dict(operation)
    if not args.include_examples:
        operation_payload.pop('examples', None)

    related_types = collect_related_types(operation_payload, types_by_name, max(args.max_depth, 0))
    payload = {
        'operation': operation_payload,
        'relatedTypes': related_types,
    }
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
`;
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
  skillName: string;
  skillOutputDir: string;
  downloadHref?: string;
  downloadLabel: string;
}): string {
  const { pageTitle, pageDescription, skillName, skillOutputDir, downloadHref, downloadLabel } =
    options;
  const escapedDownloadLabel = downloadLabel.replace(/"/g, '&quot;');
  const downloadContent = downloadHref
    ? `<a href="${downloadHref}" download><button type="button">${escapedDownloadLabel}</button></a>`
    : `Skill package is written to: \`${toPosix(path.resolve(skillOutputDir))}\``;

  return [
    `# ${pageTitle}`,
    '',
    pageDescription,
    '',
    '## Download',
    '',
    downloadContent,
    '',
    '## Install and Use',
    '',
    '- **Claude Desktop / Claude Web**: [What are Skills](https://support.claude.com/en/articles/12512176-what-are-skills), [Create Custom Skills](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills)',
    '- **Claude Code**: [Use skills in Claude Code](https://docs.anthropic.com/en/docs/claude-code/common-workflows#use-skills)',
    '- **Codex CLI**: [Codex Agent Skills](https://developers.openai.com/codex/agent-skills)',
    '- **Cursor**: [Cursor Rules and Context](https://docs.cursor.com/en/context/rules)',
    '- **ChatGPT Desktop / Web**: [Custom instructions](https://help.openai.com/en/articles/8096356-custom-instructions-for-chatgpt), [Creating a GPT](https://help.openai.com/en/articles/8554397-creating-a-gpt)',
    '',
    `The downloaded package contains \`SKILL.md\`, helper scripts, and bundled \`_data/*.json\` files for \`${skillName}\`.`,
    '',
  ].join('\n');
}

export async function generateAgentSkillArtifacts(
  model: DocModel,
  config: Config
): Promise<AgentSkillArtifacts> {
  if (!config.agentSkill?.enabled) {
    return { files: [] };
  }

  const operations = collectOperations(model);
  const operationsByType = buildOperationsByType(model);
  const typesByName = buildTypesByName(model.types);
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
  const operationsDataContent = JSON.stringify(operationsByType, null, 2);
  const typesDataContent = JSON.stringify(typesByName, null, 2);
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
  const pageDescription = (
    introDocConfig.description || defaultIntroDocDescription(skillName)
  ).trim();
  const downloadLabel = (introDocConfig.downloadLabel || 'Download Skill Package (.zip)').trim();

  const introDoc: IntroDocConfigObject = {
    outputPath: introOutputPath,
    id: introDocConfig.id,
    label: pageTitle,
    title: pageTitle,
    content: buildIntroDocContent({
      pageTitle,
      pageDescription,
      skillName,
      skillOutputDir,
      downloadHref,
      downloadLabel,
    }),
  };

  return {
    files,
    introDoc,
  };
}
