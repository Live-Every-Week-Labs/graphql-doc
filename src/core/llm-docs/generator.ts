import path from 'path';
import { DocModel, ExpandedType, Operation, Section } from '../transformer/types.js';
import { GeneratedFile } from '../adapters/types.js';
import { slugify, firstSentence } from '../utils/string-utils.js';
import {
  toPosix,
  collectOperations,
  DEFAULT_GROUP_NAME,
  LLM_TOKEN_WARNING_THRESHOLD,
  MAX_PREVIEW_OPERATIONS,
} from '../utils/index.js';
import type { LlmDocsConfig } from '../config/schema.js';

export interface LlmDocsResult {
  files: GeneratedFile[];
  warnings: string[];
}

const DEFAULT_API_NAME = 'GraphQL API';
const GENERAL_GROUP_NAME = 'General';
const NO_DESCRIPTION_AVAILABLE = 'No description available.';
const DEFAULT_SITE_BASE_PATH = '/docs/api';

const OPERATION_LABELS: Record<Operation['operationType'], string> = {
  query: 'Queries',
  mutation: 'Mutations',
  subscription: 'Subscriptions',
};

const normalizeBaseUrl = (value?: string) => (value ? value.replace(/\/+$/g, '') : undefined);

const inferPublicPath = (outputDir: string) => {
  const normalized = toPosix(outputDir);
  const marker = '/static/';
  const idx = normalized.lastIndexOf(marker);
  if (idx !== -1) {
    return normalized.slice(idx + marker.length).replace(/^\/+|\/+$/g, '');
  }
  return path.posix.basename(normalized).replace(/^\/+|\/+$/g, '');
};

const joinUrl = (base: string, segment: string) => {
  if (!segment) {
    return base;
  }
  return `${base.replace(/\/+$/g, '')}/${segment.replace(/^\/+/g, '')}`;
};

const cleanDescription = (name: string, description?: string): string | undefined => {
  if (!description) return undefined;
  const trimmed = description.trim();
  if (!trimmed) return undefined;
  const lowered = trimmed.toLowerCase();
  const normalizedName = name.trim().toLowerCase();
  const obvious = [
    normalizedName,
    `the ${normalizedName}`,
    `the ${normalizedName} field`,
    `the ${normalizedName} value`,
  ];
  if (obvious.includes(lowered.replace(/\.$/, ''))) {
    return undefined;
  }
  return trimmed;
};

const formatDefaultValue = (value: unknown): string => {
  if (value === undefined) return '—';
  try {
    if (typeof value === 'string') {
      return `\`${value}\``;
    }
    return `\`${JSON.stringify(value)}\``;
  } catch {
    return '`[unprintable]`';
  }
};

const formatTypeString = (typeString?: string, fallback?: string) => {
  const value = typeString?.trim() || fallback?.trim() || 'Unknown';
  return `\`${value}\``;
};

const heading = (level: number, text: string) => `${'#'.repeat(level)} ${text}`;

const renderTable = (headers: string[], rows: string[][]) => {
  const headerRow = `| ${headers.join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`);
  return [headerRow, divider, ...body].join('\n');
};

const getNamedTypeFromExpanded = (input: ExpandedType): string | undefined => {
  if (!input) return undefined;
  if (input.kind === 'LIST') {
    return getNamedTypeFromExpanded(input.ofType);
  }
  if (input.kind === 'TYPE_REF') return input.name;
  if (input.kind === 'CIRCULAR_REF') return input.ref;
  if ('name' in input) return input.name;
  return undefined;
};

type ObjectLikeExpandedType = Extract<
  ExpandedType,
  { kind: 'OBJECT' | 'INTERFACE' | 'INPUT_OBJECT' }
>;
type EnumExpandedType = Extract<ExpandedType, { kind: 'ENUM' }>;
type UnionExpandedType = Extract<ExpandedType, { kind: 'UNION' }>;

const isObjectLike = (input?: ExpandedType): input is ObjectLikeExpandedType =>
  input?.kind === 'OBJECT' || input?.kind === 'INTERFACE' || input?.kind === 'INPUT_OBJECT';

const isEnumType = (input?: ExpandedType): input is EnumExpandedType => input?.kind === 'ENUM';

const isUnionType = (input?: ExpandedType): input is UnionExpandedType => input?.kind === 'UNION';

const extractTypeName = (typeString?: string) => {
  if (!typeString) return undefined;
  return typeString.replace(/[![\]\s]/g, '').trim() || undefined;
};

type NormalizedSection = Section & { displayName: string; slug: string };

export class LlmDocsGenerator {
  private config: LlmDocsConfig;
  private typesByName: Record<string, ExpandedType> = {};

  constructor(config: LlmDocsConfig) {
    this.config = config;
  }

  generate(model: DocModel): LlmDocsResult {
    this.typesByName = {};
    for (const type of model.types) {
      if ('name' in type) {
        this.typesByName[type.name] = type;
      }
    }

    const apiName = this.config.apiName ?? DEFAULT_API_NAME;
    const apiDescription = this.config.apiDescription;
    const baseUrl = normalizeBaseUrl(this.config.baseUrl);
    const outputDir = this.config.outputDir;
    const publicPath = inferPublicPath(outputDir);
    const relativeRoot = publicPath ? `./${publicPath}` : '.';
    const absoluteRoot = baseUrl ? joinUrl(baseUrl, publicPath) : undefined;

    const files: GeneratedFile[] = [];
    const warnings: string[] = [];

    const normalizedSections = this.normalizeSections(model.sections);

    if (this.config.strategy === 'single') {
      const singleContent = this.renderSingleFile(normalizedSections, apiName, apiDescription);
      files.push({
        path: this.config.singleFileName,
        content: singleContent,
        type: 'md',
      });

      const estimatedTokens = Math.ceil(singleContent.length / 4);
      if (estimatedTokens > LLM_TOKEN_WARNING_THRESHOLD) {
        warnings.push(
          `LLM docs single-file output is approximately ${estimatedTokens} tokens (> ${LLM_TOKEN_WARNING_THRESHOLD}).`
        );
      }

      if (this.config.generateManifest) {
        const manifestContent = this.renderManifest({
          apiName,
          apiDescription,
          baseUrlRoot: absoluteRoot ?? relativeRoot,
          humanDocsUrl: baseUrl,
          files: [
            {
              label: 'API Reference',
              filename: this.config.singleFileName,
              operations: collectOperations({ sections: normalizedSections }),
            },
          ],
        });
        files.push({
          path: 'llms.txt',
          content: manifestContent,
          type: 'md',
          absolutePath: path.join(path.dirname(outputDir), 'llms.txt'),
        });
      }

      return { files: this.withAbsolutePaths(files, outputDir), warnings };
    }

    const indexContent = this.renderIndex(normalizedSections, apiName, apiDescription, baseUrl);
    files.push({ path: 'index.md', content: indexContent, type: 'md' });

    const manifestEntries: Array<{
      label: string;
      filename: string;
      operations: Operation[];
    }> = [];

    for (const section of normalizedSections) {
      const filename = `${section.slug}.md`;
      files.push({
        path: filename,
        content: this.renderGroupSummary(section, apiName),
        type: 'md',
      });
      manifestEntries.push({
        label: section.displayName,
        filename,
        operations: collectOperations({ sections: [section] }),
      });
    }

    if (this.config.generateManifest) {
      const manifestContent = this.renderManifest({
        apiName,
        apiDescription,
        baseUrlRoot: absoluteRoot ?? relativeRoot,
        humanDocsUrl: baseUrl,
        files: [
          {
            label: 'API Overview',
            filename: 'index.md',
            operations: collectOperations({ sections: normalizedSections }),
            description: 'Quick reference with all operation signatures',
          },
          ...manifestEntries,
        ],
      });
      files.push({
        path: 'llms.txt',
        content: manifestContent,
        type: 'md',
        absolutePath: path.join(path.dirname(outputDir), 'llms.txt'),
      });
    }

    return { files: this.withAbsolutePaths(files, outputDir), warnings };
  }

  private withAbsolutePaths(files: GeneratedFile[], outputDir: string): GeneratedFile[] {
    return files.map((file) => {
      if (file.absolutePath) return file;
      return {
        ...file,
        absolutePath: path.join(outputDir, file.path),
      };
    });
  }

  private normalizeSections(sections: Section[]) {
    return sections.map((section) => {
      const displayName = section.name === DEFAULT_GROUP_NAME ? GENERAL_GROUP_NAME : section.name;
      const slug = slugify(displayName || GENERAL_GROUP_NAME) || 'general';
      return { ...section, displayName, slug };
    });
  }

  private renderIndex(
    sections: NormalizedSection[],
    apiName: string,
    apiDescription?: string,
    baseUrl?: string
  ) {
    const queries = collectOperations({ sections })
      .filter((op) => op.operationType === 'query')
      .sort((a, b) => a.name.localeCompare(b.name));
    const mutations = collectOperations({ sections })
      .filter((op) => op.operationType === 'mutation')
      .sort((a, b) => a.name.localeCompare(b.name));
    const subscriptions = collectOperations({ sections })
      .filter((op) => op.operationType === 'subscription')
      .sort((a, b) => a.name.localeCompare(b.name));

    const totalCount = queries.length + mutations.length + subscriptions.length;

    const lines: string[] = [];
    lines.push(`# ${apiName} - GraphQL API Reference`);
    if (baseUrl) {
      lines.push('');
      lines.push(`> LLM-optimized documentation. Human-readable docs: ${baseUrl}`);
    }
    if (apiDescription) {
      lines.push('');
      lines.push('## Overview');
      lines.push('');
      lines.push(apiDescription);
    }
    lines.push('');
    lines.push(
      `**Operations:** ${totalCount} (${queries.length} queries, ${mutations.length} mutations${
        subscriptions.length ? `, ${subscriptions.length} subscriptions` : ''
      })  `
    );
    const groupNames = sections.map((s) => s.displayName).join(', ') || '—';
    lines.push(`**Groups:** ${groupNames}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Quick Reference');

    if (queries.length) {
      lines.push('');
      lines.push('### Queries');
      lines.push('');
      lines.push(
        renderTable(
          ['Operation', 'Group', 'Description'],
          queries.map((op) => {
            const group = op.directives.docGroup?.name ?? GENERAL_GROUP_NAME;
            return [`\`${this.formatSignature(op)}\``, group, firstSentence(op.description) || '—'];
          })
        )
      );
    }

    if (mutations.length) {
      lines.push('');
      lines.push('### Mutations');
      lines.push('');
      lines.push(
        renderTable(
          ['Operation', 'Group', 'Description'],
          mutations.map((op) => {
            const group = op.directives.docGroup?.name ?? GENERAL_GROUP_NAME;
            return [`\`${this.formatSignature(op)}\``, group, firstSentence(op.description) || '—'];
          })
        )
      );
    }

    if (subscriptions.length) {
      lines.push('');
      lines.push('### Subscriptions');
      lines.push('');
      lines.push(
        renderTable(
          ['Operation', 'Group', 'Description'],
          subscriptions.map((op) => {
            const group = op.directives.docGroup?.name ?? GENERAL_GROUP_NAME;
            return [`\`${this.formatSignature(op)}\``, group, firstSentence(op.description) || '—'];
          })
        )
      );
    }

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Documentation Files');
    lines.push('');
    lines.push('For full documentation including type definitions and examples, see:');
    lines.push('');
    for (const section of sections) {
      lines.push(`- [${section.displayName}](./${section.slug}.md)`);
    }

    return lines.join('\n');
  }

  private renderGroupSummary(section: NormalizedSection, apiName: string) {
    const operations = collectOperations({ sections: [section] });
    const lines: string[] = [];
    lines.push(`# ${section.displayName}`);
    lines.push('');
    lines.push(`> Part of [${apiName}](./index.md) GraphQL API`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Operations');
    lines.push('');

    const operationRows = operations.map((operation) => {
      const operationSlug = this.getOperationSlug(operation);
      const operationType = this.getOperationTypeLabel(operation.operationType);
      const siteOperationHref = this.getOperationSiteHref(section.slug, operationSlug);
      const description = firstSentence(operation.description) || NO_DESCRIPTION_AVAILABLE;

      return [`[${operation.name}](${siteOperationHref})`, operationType, description];
    });
    lines.push(renderTable(['Operation', 'Type', 'Description'], operationRows));

    if (operations.length > 0) {
      lines.push('');
      lines.push('## Detailed Documentation');
      lines.push('');
      lines.push('For full operation details including arguments, return types, and examples:');
      lines.push('');
      for (const operation of operations) {
        const operationSlug = this.getOperationSlug(operation);
        lines.push(`- [${operation.name}](./${section.slug}/${operationSlug}.md)`);
      }
    }

    return lines.join('\n');
  }

  private renderOperationFile(
    operation: Operation,
    section: NormalizedSection,
    apiName: string
  ): string {
    const lines: string[] = [];
    const operationTypeLabel = operation.operationType.toUpperCase();
    const operationTypes = this.collectReferencedTypes(operation);
    const returnTypeLabel = formatTypeString(
      operation.returnTypeString,
      this.formatExpandedType(operation.returnType)
    );

    lines.push(`# ${operation.name}`);
    lines.push('');
    lines.push(`> **Group:** ${section.displayName}`);
    lines.push(`> **Operation Type:** ${operationTypeLabel}`);
    lines.push(
      `> Part of [${apiName}](../index.md) and [${section.displayName}](../${section.slug}.md)`
    );
    lines.push('');

    if (operation.isDeprecated) {
      lines.push(
        `> Deprecated${operation.deprecationReason ? `: ${operation.deprecationReason}` : ''}`
      );
      lines.push('');
    }

    if (operation.description) {
      const paragraphs = operation.description
        .split(/\n{2,}/g)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
      for (const paragraph of paragraphs) {
        lines.push(paragraph);
        lines.push('');
      }
    }

    lines.push('## GraphQL Signature');
    lines.push('');
    lines.push(...this.renderOperationSignature(operation));
    lines.push('');

    if (operation.arguments.length > 0) {
      lines.push('## Arguments');
      lines.push('');
      lines.push(this.renderArgumentsTable(operation));
      lines.push('');
    }

    lines.push('## Return Type');
    lines.push('');
    lines.push(`**Returns:** ${returnTypeLabel}`);

    const returnFieldsTable = this.renderOperationReturnFields(operation);
    if (returnFieldsTable) {
      lines.push('');
      lines.push(returnFieldsTable);
    }

    if (this.config.includeExamples && operation.examples.length > 0) {
      lines.push('');
      lines.push('## Examples');
      lines.push('');

      for (const [index, example] of operation.examples.entries()) {
        const exampleName = example.name?.trim() || `Example ${index + 1}`;
        lines.push(`### ${exampleName}`);
        lines.push('');
        if (example.description) {
          lines.push(example.description);
          lines.push('');
        }

        lines.push('**Query:**');
        lines.push('');
        lines.push('```graphql');
        lines.push(example.query.trim());
        lines.push('```');
        lines.push('');

        lines.push('**Variables:**');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(example.variables ?? {}, null, 2));
        lines.push('```');
        lines.push('');

        lines.push('**Response:**');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(example.response?.body ?? {}, null, 2));
        lines.push('```');
        lines.push('');
      }
    }

    const typeSection = this.renderTypesSection(operationTypes, 2);
    if (typeSection.length > 0) {
      lines.push('');
      lines.push(...typeSection);
    }

    return lines.join('\n').trim();
  }

  private renderSingleFile(
    sections: NormalizedSection[],
    apiName: string,
    apiDescription?: string
  ) {
    const lines: string[] = [];
    lines.push(`# ${apiName} - GraphQL API Reference`);
    lines.push('');
    lines.push('> LLM-optimized documentation (single file).');
    if (apiDescription) {
      lines.push('');
      lines.push(apiDescription);
    }
    lines.push('');
    for (const section of sections) {
      lines.push(heading(2, section.displayName));
      lines.push('');
      lines.push(...this.renderSectionOperations(section, 3));
      const typesReference = this.renderTypesReference(section, 3);
      if (typesReference.length > 0) {
        lines.push('');
        lines.push(...typesReference);
      }
      lines.push('');
    }
    return lines.join('\n').trim();
  }

  private renderOperationSignature(operation: Operation): string[] {
    const variableDefinitions = operation.arguments
      .map((arg) => `$${arg.name}: ${arg.typeString ?? this.formatExpandedType(arg.type)}`)
      .join(', ');
    const callArguments = operation.arguments.map((arg) => `${arg.name}: $${arg.name}`).join(', ');
    const rootTypeName =
      extractTypeName(operation.returnTypeString) ?? getNamedTypeFromExpanded(operation.returnType);
    const rootType = rootTypeName ? this.typesByName[rootTypeName] : undefined;
    const hasSelectionSet = Boolean(rootType && (isObjectLike(rootType) || isUnionType(rootType)));

    const lines = [
      '```graphql',
      `${operation.operationType} ${operation.name}${variableDefinitions ? `(${variableDefinitions})` : ''} {`,
      `  ${operation.name}${callArguments ? `(${callArguments})` : ''}${hasSelectionSet ? ' {' : ''}`,
    ];

    if (hasSelectionSet) {
      lines.push('    __typename');
      lines.push('  }');
    }

    lines.push('}');
    lines.push('```');
    return lines;
  }

  private collectReferencedTypes(operation: Operation): string[] {
    const collected: string[] = [];
    const seenTypeNames = new Set<string>();
    const visitedNamedTypes = new Set<string>();
    const visitedExpanded = new Set<string>();

    const collectByName = (typeName?: string) => {
      if (!typeName) return;
      const normalizedType = this.typesByName[typeName];
      if (!normalizedType || normalizedType.kind === 'SCALAR') {
        return;
      }

      if (!seenTypeNames.has(typeName)) {
        seenTypeNames.add(typeName);
        collected.push(typeName);
      }

      if (visitedNamedTypes.has(typeName)) {
        return;
      }
      visitedNamedTypes.add(typeName);
      walkExpandedType(normalizedType);
    };

    const walkExpandedType = (type?: ExpandedType) => {
      if (!type) return;

      if (type.kind === 'LIST') {
        walkExpandedType(type.ofType);
        return;
      }

      if (type.kind === 'TYPE_REF') {
        collectByName(type.name);
        return;
      }

      if (type.kind === 'CIRCULAR_REF') {
        collectByName(type.ref);
        return;
      }

      if (type.kind === 'UNION') {
        collectByName(type.name);
        const key = `${type.kind}:${type.name}`;
        if (visitedExpanded.has(key)) {
          return;
        }
        visitedExpanded.add(key);
        for (const possible of type.possibleTypes ?? []) {
          walkExpandedType(possible);
        }
        return;
      }

      if (isObjectLike(type)) {
        collectByName(type.name);
        const key = `${type.kind}:${type.name}`;
        if (visitedExpanded.has(key)) {
          return;
        }
        visitedExpanded.add(key);
        for (const field of type.fields ?? []) {
          walkExpandedType(field.type);
          for (const arg of field.args ?? []) {
            walkExpandedType(arg.type);
          }
          collectByName(extractTypeName(field.typeString));
        }
      }
    };

    for (const arg of operation.arguments) {
      walkExpandedType(arg.type);
      collectByName(extractTypeName(arg.typeString));
    }

    walkExpandedType(operation.returnType);
    collectByName(extractTypeName(operation.returnTypeString));

    for (const referencedTypeName of operation.referencedTypes ?? []) {
      collectByName(referencedTypeName);
    }

    return collected;
  }

  private renderOperationReturnFields(operation: Operation): string | undefined {
    const typeName =
      extractTypeName(operation.returnTypeString) ?? getNamedTypeFromExpanded(operation.returnType);
    if (!typeName) {
      return undefined;
    }

    const rootType = this.typesByName[typeName];
    if (!rootType || !isObjectLike(rootType) || rootType.fields.length === 0) {
      return undefined;
    }

    const rows = rootType.fields.map((field) => {
      const fieldTypeName =
        extractTypeName(field.typeString) ?? getNamedTypeFromExpanded(field.type);
      const description = this.renderFieldDescription(field.name, field.description, fieldTypeName);

      return [
        `\`${field.name}\``,
        formatTypeString(field.typeString, this.formatExpandedType(field.type)),
        description,
      ];
    });

    return renderTable(['Field', 'Type', 'Description'], rows);
  }

  private renderTypesSection(typeNames: string[], headingLevel: number): string[] {
    const uniqueTypeNames = Array.from(new Set(typeNames)).filter((typeName) => {
      const typeDef = this.typesByName[typeName];
      return Boolean(typeDef && typeDef.kind !== 'SCALAR');
    });

    if (uniqueTypeNames.length === 0) {
      return [];
    }

    const lines: string[] = [];
    lines.push(heading(headingLevel, 'Type Definitions'));
    lines.push('');

    for (const typeName of uniqueTypeNames) {
      const definitionLines = this.renderTypeDefinition(typeName, headingLevel + 1);
      if (definitionLines.length === 0) {
        continue;
      }
      lines.push(...definitionLines);
      lines.push('');
    }

    return lines.filter((line, index) => !(line === '' && lines[index - 1] === ''));
  }

  private renderTypeDefinition(typeName: string, headingLevel: number): string[] {
    const typeDef = this.typesByName[typeName];
    if (!typeDef || typeDef.kind === 'SCALAR') {
      return [];
    }

    const lines: string[] = [];
    lines.push(heading(headingLevel, `${typeName} {#${this.getTypeAnchor(typeName)}}`));
    lines.push('');

    if ('description' in typeDef && typeDef.description) {
      lines.push(typeDef.description);
      lines.push('');
    }

    if (isEnumType(typeDef)) {
      const rows = typeDef.values.map((value) => {
        const note = value.isDeprecated
          ? ` (deprecated${value.deprecationReason ? `: ${value.deprecationReason}` : ''})`
          : '';
        const description =
          cleanDescription(value.name, value.description) ?? NO_DESCRIPTION_AVAILABLE;
        return [`\`${value.name}\``, `${description}${note}`];
      });
      lines.push(renderTable([`${typeName} Value`, 'Description'], rows));
      return lines;
    }

    if (isUnionType(typeDef)) {
      const rows = typeDef.possibleTypes.map((possible) => {
        const possibleName = getNamedTypeFromExpanded(possible) ?? 'Unknown';
        const possibleType =
          possibleName !== 'Unknown' ? this.typesByName[possibleName] : undefined;
        const possibleDescription =
          possibleType && 'description' in possibleType
            ? cleanDescription(possibleName, possibleType.description)
            : undefined;
        return [
          possibleName === 'Unknown' ? '`Unknown`' : this.renderTypeLink(possibleName),
          possibleDescription ?? NO_DESCRIPTION_AVAILABLE,
        ];
      });
      lines.push(renderTable(['Type', 'Description'], rows));
      return lines;
    }

    if (isObjectLike(typeDef)) {
      const rows = typeDef.fields.map((field) => {
        const fieldTypeName =
          extractTypeName(field.typeString) ?? getNamedTypeFromExpanded(field.type);
        const description = this.renderFieldDescription(
          field.name,
          field.description,
          fieldTypeName
        );

        return [
          `\`${field.name}\``,
          formatTypeString(field.typeString, this.formatExpandedType(field.type)),
          description,
        ];
      });
      lines.push(renderTable(['Field', 'Type', 'Description'], rows));
    }

    return lines;
  }

  private renderFieldDescription(
    fieldName: string,
    description: string | undefined,
    fieldTypeName: string | undefined
  ): string {
    const baseDescription = cleanDescription(fieldName, description) ?? NO_DESCRIPTION_AVAILABLE;
    if (!fieldTypeName || !this.shouldLinkType(fieldTypeName)) {
      return baseDescription;
    }
    return `${baseDescription} *(see ${this.renderTypeLink(fieldTypeName)})*`;
  }

  private shouldLinkType(typeName: string): boolean {
    const typeDef = this.typesByName[typeName];
    return Boolean(typeDef && typeDef.kind !== 'SCALAR');
  }

  private renderTypeLink(typeName: string): string {
    return `[${typeName}](#${this.getTypeAnchor(typeName)})`;
  }

  private getTypeAnchor(typeName: string): string {
    return slugify(typeName) || typeName.toLowerCase();
  }

  private getOperationSlug(operation: Operation): string {
    return slugify(operation.name) || 'operation';
  }

  private getOperationTypeLabel(type: Operation['operationType']): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private getOperationSiteHref(groupSlug: string, operationSlug: string): string {
    const operationPath = `${DEFAULT_SITE_BASE_PATH}/${groupSlug}/${operationSlug}`;
    const baseUrl = normalizeBaseUrl(this.config.baseUrl);
    if (!baseUrl) {
      return operationPath;
    }

    return joinUrl(baseUrl, operationPath.replace(/^\/+/, ''));
  }

  private renderSectionOperations(section: Section, baseHeadingLevel: number) {
    const lines: string[] = [];
    const operationTypes = ['query', 'mutation', 'subscription'] as Operation['operationType'][];

    for (const operationType of operationTypes) {
      const label = OPERATION_LABELS[operationType];
      const subsections = section.subsections
        .map((subsection) => ({
          ...subsection,
          operations: subsection.operations.filter((op) => op.operationType === operationType),
        }))
        .filter((subsection) => subsection.operations.length > 0);

      if (subsections.length === 0) {
        continue;
      }

      lines.push(heading(baseHeadingLevel, label));
      lines.push('');

      for (const subsection of subsections) {
        const rawName = subsection.name?.trim() ?? '';
        const normalized = rawName.toLowerCase();
        const normalizedLabel = label.toLowerCase();
        const hasTitle = rawName.length > 0 && normalized !== normalizedLabel;
        if (hasTitle) {
          lines.push(heading(baseHeadingLevel + 1, subsection.name));
          lines.push('');
        }

        for (const operation of subsection.operations) {
          const opHeadingLevel = hasTitle ? baseHeadingLevel + 2 : baseHeadingLevel + 1;
          lines.push(...this.renderOperation(operation, opHeadingLevel));
          lines.push('');
        }
      }
    }

    return lines;
  }

  private renderTypesReference(section: Section, headingLevel: number) {
    const operations = collectOperations({ sections: [section] });
    const counts = new Map<string, number>();
    for (const op of operations) {
      for (const typeName of op.referencedTypes ?? []) {
        counts.set(typeName, (counts.get(typeName) ?? 0) + 1);
      }
    }
    const sharedTypes = Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([name]) => name)
      .filter((name) => {
        const typeDef = this.typesByName[name];
        return typeDef && typeDef.kind !== 'SCALAR';
      })
      .sort((a, b) => a.localeCompare(b));

    if (sharedTypes.length === 0) {
      return [];
    }

    const lines: string[] = [];
    lines.push(heading(headingLevel, 'Types Reference'));
    lines.push('');

    for (const typeName of sharedTypes) {
      const typeDef = this.typesByName[typeName];
      if (!typeDef) continue;
      const expandedTypes = new Set<string>();
      lines.push(heading(headingLevel + 1, typeName));
      lines.push('');

      if (isEnumType(typeDef)) {
        lines.push(...this.renderEnum(typeDef, typeName));
        lines.push('');
        continue;
      }

      if (isUnionType(typeDef)) {
        lines.push(...this.renderUnion(typeDef, 1, new Set([typeName]), expandedTypes));
        lines.push('');
        continue;
      }

      if (isObjectLike(typeDef)) {
        const { table, nested } = this.renderObjectFields(
          typeDef,
          1,
          new Set([typeName]),
          expandedTypes
        );
        if (table) {
          lines.push(table);
        }
        if (nested.length > 0) {
          lines.push('');
          lines.push(...nested);
        }
        lines.push('');
      }
    }

    return lines.filter((line, index) => !(line === '' && lines[index - 1] === ''));
  }

  private renderOperation(operation: Operation, headingLevel: number) {
    const lines: string[] = [];
    lines.push(heading(headingLevel, operation.name));
    lines.push('');

    if (operation.isDeprecated) {
      lines.push(
        `> Deprecated${operation.deprecationReason ? `: ${operation.deprecationReason}` : ''}`
      );
      lines.push('');
    }

    if (operation.description) {
      const paragraphs = operation.description
        .split(/\n{2,}/g)
        .map((paragraph) => paragraph.trim());
      for (const paragraph of paragraphs) {
        if (paragraph) {
          lines.push(paragraph);
          lines.push('');
        }
      }
    }

    if (operation.arguments?.length > 0) {
      lines.push('**Arguments:**');
      lines.push('');
      lines.push(this.renderArgumentsTable(operation));
      lines.push('');
    }

    lines.push(
      `**Returns:** ${formatTypeString(
        operation.returnTypeString,
        this.formatExpandedType(operation.returnType)
      )}`
    );
    lines.push('');
    lines.push(...this.renderReturnType(operation));

    if (this.config.includeExamples && operation.examples?.length > 0) {
      lines.push('');
      for (const example of operation.examples) {
        lines.push(`**Example${example.name ? `: ${example.name}` : ''}**`);
        lines.push('');
        if (example.description) {
          lines.push(example.description);
          lines.push('');
        }
        lines.push('```graphql');
        lines.push(example.query.trim());
        lines.push('```');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(example.response?.body ?? {}, null, 2));
        lines.push('```');
        lines.push('');
      }
    }

    return lines;
  }

  private renderArgumentsTable(operation: Operation) {
    const hasDefault = operation.arguments.some((arg) => arg.defaultValue !== undefined);
    const headers = ['Argument', 'Type', 'Required'];
    if (hasDefault) {
      headers.push('Default');
    }
    headers.push('Description');

    const rows = operation.arguments.map((arg) => {
      const description = cleanDescription(arg.name, arg.description) ?? '—';
      const row = [
        `\`${arg.name}\``,
        formatTypeString(arg.typeString, this.formatExpandedType(arg.type)),
        arg.isRequired ? 'Yes' : 'No',
      ];
      if (hasDefault) {
        row.push(formatDefaultValue(arg.defaultValue));
      }
      row.push(description);
      return row;
    });

    return renderTable(headers, rows);
  }

  private renderReturnType(operation: Operation) {
    const lines: string[] = [];
    const expandedTypes = new Set<string>();

    const baseTypeName =
      extractTypeName(operation.returnTypeString) ?? getNamedTypeFromExpanded(operation.returnType);

    if (!baseTypeName) {
      return lines;
    }

    const rootType = this.typesByName[baseTypeName];
    if (!rootType) {
      return lines;
    }

    if (isEnumType(rootType)) {
      lines.push(...this.renderEnum(rootType, baseTypeName));
      return lines;
    }

    if (isUnionType(rootType)) {
      lines.push(...this.renderUnion(rootType, 1, new Set([baseTypeName]), expandedTypes));
      return lines;
    }

    if (!isObjectLike(rootType)) {
      return lines;
    }

    const { table, nested } = this.renderObjectFields(
      rootType,
      1,
      new Set([baseTypeName]),
      expandedTypes
    );
    if (table) {
      lines.push(table);
    }
    if (nested.length > 0) {
      lines.push('');
      lines.push(...nested);
    }
    return lines;
  }

  private renderObjectFields(
    typeDef: ExpandedType,
    depth: number,
    visited: Set<string>,
    expandedTypes: Set<string>
  ): { table: string; nested: string[] } {
    if (!isObjectLike(typeDef)) {
      return { table: '', nested: [] };
    }
    const rows: string[][] = [];
    const nestedBlocks: string[] = [];
    const queuedTypes: string[] = [];

    for (const field of typeDef.fields ?? []) {
      const fieldTypeName =
        extractTypeName(field.typeString) ?? getNamedTypeFromExpanded(field.type);
      const fieldType = fieldTypeName ? this.typesByName[fieldTypeName] : undefined;
      const canExpand =
        fieldTypeName &&
        fieldType &&
        (isObjectLike(fieldType) || isUnionType(fieldType) || isEnumType(fieldType));

      let description = cleanDescription(field.name, field.description) ?? '—';
      let typeLabel = formatTypeString(field.typeString, this.formatExpandedType(field.type));

      if (field.isDeprecated) {
        description = `${description} (deprecated${
          field.deprecationReason ? `: ${field.deprecationReason}` : ''
        })`;
      }

      if (fieldTypeName && visited.has(fieldTypeName)) {
        const note = `*(see ${fieldTypeName} above)*`;
        description = description === '—' ? note : `${description} ${note}`;
      } else if (canExpand && depth >= this.config.maxTypeDepth) {
        const note = '*(max depth reached)*';
        typeLabel = `${typeLabel} ${note}`;
      } else if (canExpand && fieldTypeName && !expandedTypes.has(fieldTypeName)) {
        queuedTypes.push(fieldTypeName);
      }

      rows.push([`\`${field.name}\``, typeLabel, description]);
    }

    const table = renderTable(['Field', 'Type', 'Description'], rows);

    for (const nestedTypeName of queuedTypes) {
      if (expandedTypes.has(nestedTypeName)) continue;
      const nestedType = this.typesByName[nestedTypeName];
      if (!nestedType) continue;
      expandedTypes.add(nestedTypeName);

      if (isEnumType(nestedType)) {
        nestedBlocks.push('');
        nestedBlocks.push(`**${nestedTypeName} values:**`);
        nestedBlocks.push('');
        nestedBlocks.push(...this.renderEnum(nestedType, nestedTypeName));
        continue;
      }

      if (isUnionType(nestedType)) {
        nestedBlocks.push('');
        nestedBlocks.push(`**${nestedTypeName} possible types:**`);
        nestedBlocks.push('');
        nestedBlocks.push(
          ...this.renderUnion(
            nestedType,
            depth + 1,
            new Set([...visited, nestedTypeName]),
            expandedTypes
          )
        );
        continue;
      }

      if (isObjectLike(nestedType)) {
        nestedBlocks.push('');
        nestedBlocks.push(`**${nestedTypeName} fields:**`);
        nestedBlocks.push('');
        const nextVisited = new Set(visited);
        nextVisited.add(nestedTypeName);
        const { table: nestedTable, nested } = this.renderObjectFields(
          nestedType,
          depth + 1,
          nextVisited,
          expandedTypes
        );
        if (nestedTable) {
          nestedBlocks.push(nestedTable);
        }
        if (nested.length > 0) {
          nestedBlocks.push('');
          nestedBlocks.push(...nested);
        }
      }
    }

    return { table, nested: nestedBlocks };
  }

  private renderEnum(typeDef: ExpandedType, typeName: string): string[] {
    if (!isEnumType(typeDef)) {
      return [];
    }
    const rows = typeDef.values.map((value) => {
      const description = cleanDescription(value.name, value.description) ?? '—';
      const note = value.isDeprecated
        ? ` (deprecated${value.deprecationReason ? `: ${value.deprecationReason}` : ''})`
        : '';
      return [`\`${value.name}\``, `${description}${note}`];
    });
    return [renderTable([`${typeName} Value`, 'Description'], rows)];
  }

  private renderUnion(
    typeDef: ExpandedType,
    depth: number,
    visited: Set<string>,
    expandedTypes: Set<string>
  ): string[] {
    if (!isUnionType(typeDef)) {
      return [];
    }

    const rows: string[][] = [];
    const nestedBlocks: string[] = [];

    for (const possible of typeDef.possibleTypes ?? []) {
      const possibleName = getNamedTypeFromExpanded(possible) ?? 'Unknown';
      const possibleType = this.typesByName[possibleName];
      const possibleDescription =
        possibleType && 'description' in possibleType ? possibleType.description : undefined;
      rows.push([
        `\`${possibleName}\``,
        cleanDescription(possibleName, possibleDescription) ?? '—',
      ]);

      if (!possibleType) continue;
      if (visited.has(possibleName)) continue;
      if (depth >= this.config.maxTypeDepth) continue;
      if (expandedTypes.has(possibleName)) continue;

      if (isObjectLike(possibleType)) {
        expandedTypes.add(possibleName);
        nestedBlocks.push('');
        nestedBlocks.push(`**${possibleName} fields:**`);
        nestedBlocks.push('');
        const { table, nested } = this.renderObjectFields(
          possibleType,
          depth + 1,
          new Set([...visited, possibleName]),
          expandedTypes
        );
        if (table) {
          nestedBlocks.push(table);
        }
        if (nested.length > 0) {
          nestedBlocks.push('');
          nestedBlocks.push(...nested);
        }
      }
    }

    const table = renderTable(['Type', 'Description'], rows);
    return [table, ...nestedBlocks];
  }

  private formatExpandedType(type: ExpandedType): string {
    if (!type) return 'Unknown';
    if (type.kind === 'LIST') {
      return `[${this.formatExpandedType(type.ofType)}]`;
    }
    if (type.kind === 'TYPE_REF') return type.name;
    if (type.kind === 'CIRCULAR_REF') return type.ref;
    if ('name' in type) return type.name;
    return 'Unknown';
  }

  private formatSignature(operation: Operation): string {
    const args = operation.arguments
      .map((arg) => `${arg.name}: ${arg.typeString ?? this.formatExpandedType(arg.type)}`)
      .join(', ');
    const returnType = operation.returnTypeString ?? this.formatExpandedType(operation.returnType);
    return `${operation.name}${args ? `(${args})` : ''}: ${returnType}`;
  }

  private renderManifest({
    apiName,
    apiDescription,
    baseUrlRoot,
    humanDocsUrl,
    files,
  }: {
    apiName: string;
    apiDescription?: string;
    baseUrlRoot: string;
    humanDocsUrl?: string;
    files: Array<{
      label: string;
      filename: string;
      operations: Operation[];
      description?: string;
    }>;
  }) {
    const lines: string[] = [];
    lines.push(`# ${apiName}`);
    if (apiDescription) {
      lines.push('');
      lines.push(`> ${apiDescription}`);
    }
    lines.push('');
    lines.push(`This is the LLM-optimized documentation for the ${apiName} GraphQL API.`);
    if (humanDocsUrl) {
      lines.push(`For human-readable documentation, visit: ${humanDocsUrl}`);
    }
    lines.push('');
    lines.push('## Docs');
    lines.push('');

    for (const entry of files) {
      const ops = entry.operations.map((op) => op.name);
      const opList =
        ops.length > MAX_PREVIEW_OPERATIONS ? ops.slice(0, MAX_PREVIEW_OPERATIONS) : ops;
      const suffix = ops.length > MAX_PREVIEW_OPERATIONS ? ', …' : '';
      const opSummary = opList.length ? ` - ${opList.join(', ')}${suffix}` : '';
      const description = entry.description ? `: ${entry.description}` : '';
      lines.push(
        `- [${entry.label}](${joinUrl(baseUrlRoot, entry.filename)})${description}${opSummary}`
      );
    }

    return lines.join('\n');
  }
}
