import { DocModel, Operation, Section, Subsection, ExpandedType } from '../../transformer/types.js';
import { GeneratedFile } from '../types.js';
import { MdxRenderer } from './mdx-renderer.js';
import { SidebarGenerator, SidebarItem } from './sidebar-generator.js';
import { buildIntroDocs as buildIntroDocsSection } from './intro-docs-builder.js';
import { buildSidebarFiles } from './sidebar-file-builder.js';
import { escapeYamlValue, escapeYamlTag } from '../../utils/yaml-escape.js';
import { slugify } from '../../utils/string-utils.js';
import {
  toPosix,
  groupTypes,
  DEFAULT_SORT_PRIORITY,
  COMPONENT_PACKAGE_IMPORT,
} from '../../utils/index.js';
import type {
  Config,
  DocusaurusAdapterConfig as BaseDocusaurusAdapterConfig,
} from '../../config/schema.js';
import { serializeDocData } from '../../serialization/doc-data.js';
import type { SerializedDocData } from '../../serialization/doc-data.js';
import * as path from 'path';

const DATA_DIR = '_data';
const OPERATIONS_DATA_FILE = path.posix.join(DATA_DIR, 'operations.json');
const TYPES_DATA_FILE = path.posix.join(DATA_DIR, 'types.json');

interface OperationDocTarget {
  section: Section;
  subsection: Subsection;
  operation: Operation;
}

export type DocusaurusAdapterConfig = Partial<BaseDocusaurusAdapterConfig> & {
  outputDir?: string;
  typeExpansion?: {
    maxDepth?: number;
    defaultLevels?: number;
  };
};

export class DocusaurusAdapter {
  private renderer: MdxRenderer;
  private sidebarGenerator: SidebarGenerator;
  private config: DocusaurusAdapterConfig;
  private docIdPrefix: string;

  constructor(config: DocusaurusAdapterConfig = {}) {
    this.renderer = new MdxRenderer();
    this.config = config;
    this.docIdPrefix = this.resolveDocIdPrefix();
    this.sidebarGenerator = new SidebarGenerator({
      categoryIndex: config.sidebarCategoryIndex,
      sectionLabels: config.sidebarSectionLabels,
      docIdPrefix: this.docIdPrefix,
    });
  }

  /**
   * Build a DocusaurusAdapter from a full generator Config object.
   *
   * Handles Docusaurus-specific assembly such as inferring llmDocsBasePath
   * from the LLM docs output directory.
   */
  static fromConfig(config: Config): DocusaurusAdapter {
    const docusaurusConfig = {
      ...config.adapters?.docusaurus,
    };

    // Infer llmDocsBasePath from the LLM docs outputDir when not explicitly set
    if (!docusaurusConfig.llmDocsBasePath && config.llmDocs?.enabled) {
      docusaurusConfig.llmDocsBasePath = DocusaurusAdapter.inferLlmDocsBasePath(
        config.llmDocs.outputDir
      );
    }

    return new DocusaurusAdapter({
      outputDir: config.outputDir,
      typeExpansion: config.typeExpansion,
      ...docusaurusConfig,
    });
  }

  /**
   * Infer the base URL path for LLM docs from the output directory.
   *
   * Uses the Docusaurus `/static/` convention: if the outputDir contains `/static/`,
   * the segment after it becomes the base path. Otherwise falls back to the
   * directory basename.
   */
  private static inferLlmDocsBasePath(outputDir: string): string {
    const normalized = toPosix(outputDir);
    const marker = '/static/';
    const idx = normalized.lastIndexOf(marker);
    const segment =
      idx !== -1
        ? normalized.slice(idx + marker.length)
        : path.posix.basename(normalized.replace(/\/+$/g, ''));
    return `/${segment.replace(/^\/+|\/+$/g, '')}`;
  }

  private getIntroDocs(): Array<{
    source?: string;
    content?: string;
    outputPath?: string;
    id?: string;
    label?: string;
    title?: string;
  }> {
    const introDocs = this.config.introDocs ?? [];
    return introDocs.map((doc) => (typeof doc === 'string' ? { source: doc } : doc));
  }

  private resolveDocIdPrefix(): string {
    if (this.config.docIdPrefix) {
      return this.config.docIdPrefix.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    }

    const docsRoot = this.config.docsRoot ?? './docs';
    const outputRoot = this.config.outputDir ?? process.cwd();
    const resolvedDocsRoot = path.resolve(docsRoot);
    const resolvedOutputRoot = path.resolve(outputRoot);

    if (resolvedOutputRoot === resolvedDocsRoot) {
      return '';
    }

    if (resolvedOutputRoot.startsWith(resolvedDocsRoot + path.sep)) {
      const rel = path.relative(resolvedDocsRoot, resolvedOutputRoot).replace(/\\/g, '/');
      return rel;
    }

    return '';
  }

  private withDocIdPrefix(id: string): string {
    if (!this.docIdPrefix) {
      return id;
    }
    return `${this.docIdPrefix}/${id}`;
  }

  private generateSidebarFiles(sidebarItems: SidebarItem[]): GeneratedFile[] {
    return buildSidebarFiles(sidebarItems, {
      sidebarFile: this.config.sidebarFile,
      sidebarTarget: this.config.sidebarTarget,
      sidebarInsertPosition: this.config.sidebarInsertPosition,
      sidebarInsertReference: this.config.sidebarInsertReference,
      sidebarMerge: this.config.sidebarMerge,
      outputDir: this.config.outputDir,
    });
  }

  private getSectionPath(section: Section): string {
    return slugify(section.name);
  }

  private getSubsectionPath(section: Section, subsection: Subsection): string {
    const sectionPath = this.getSectionPath(section);
    return subsection.name === '' ? sectionPath : `${sectionPath}/${slugify(subsection.name)}`;
  }

  private getOperationDocId(
    section: Section,
    subsection: Subsection,
    operationSlug: string
  ): string {
    const subsectionPath = this.getSubsectionPath(section, subsection);
    return `${subsectionPath}/${operationSlug}`;
  }

  private collectOperationTargets(model: DocModel): OperationDocTarget[] {
    const targets: OperationDocTarget[] = [];
    for (const section of model.sections) {
      for (const subsection of section.subsections) {
        for (const operation of subsection.operations) {
          targets.push({ section, subsection, operation });
        }
      }
    }
    return targets;
  }

  private resolveOperationDocSlugs(model: DocModel): WeakMap<Operation, string> {
    const operationTargets = this.collectOperationTargets(model);
    const basePathCounts = new Map<string, number>();

    for (const { section, subsection, operation } of operationTargets) {
      const baseSlug = slugify(operation.name) || 'operation';
      const baseDocId = this.getOperationDocId(section, subsection, baseSlug);
      const existingCount = basePathCounts.get(baseDocId) ?? 0;
      basePathCounts.set(baseDocId, existingCount + 1);
    }

    const resolvedSlugs = new WeakMap<Operation, string>();
    const usedDocIds = new Set<string>();

    for (const { section, subsection, operation } of operationTargets) {
      const baseSlug = slugify(operation.name) || 'operation';
      const baseDocId = this.getOperationDocId(section, subsection, baseSlug);
      const isCollision = (basePathCounts.get(baseDocId) ?? 0) > 1;
      let resolvedSlug = isCollision ? `${baseSlug}-${operation.operationType}` : baseSlug;
      let resolvedDocId = this.getOperationDocId(section, subsection, resolvedSlug);
      let counter = 1;

      while (usedDocIds.has(resolvedDocId)) {
        resolvedSlug = `${baseSlug}-${operation.operationType}-${counter}`;
        resolvedDocId = this.getOperationDocId(section, subsection, resolvedSlug);
        counter += 1;
      }

      usedDocIds.add(resolvedDocId);
      resolvedSlugs.set(operation, resolvedSlug);
    }

    return resolvedSlugs;
  }

  private buildSidebarOperationIdMap(
    model: DocModel,
    operationDocSlugs: WeakMap<Operation, string>
  ): Map<string, string[]> {
    const idMap = new Map<string, string[]>();

    for (const { section, subsection, operation } of this.collectOperationTargets(model)) {
      const baseSlug = slugify(operation.name) || 'operation';
      const resolvedSlug = operationDocSlugs.get(operation) ?? baseSlug;
      if (baseSlug === resolvedSlug) {
        continue;
      }

      const currentId = this.withDocIdPrefix(this.getOperationDocId(section, subsection, baseSlug));
      const nextId = this.withDocIdPrefix(
        this.getOperationDocId(section, subsection, resolvedSlug)
      );
      const replacements = idMap.get(currentId) ?? [];
      replacements.push(nextId);
      idMap.set(currentId, replacements);
    }

    return idMap;
  }

  private remapSidebarOperationIds(
    items: SidebarItem[],
    idMap: Map<string, string[]>
  ): SidebarItem[] {
    if (idMap.size === 0) {
      return items;
    }

    return items.map((item) => {
      const nextItem: SidebarItem = { ...item };

      if (nextItem.type === 'doc' && nextItem.id && idMap.has(nextItem.id)) {
        const replacements = idMap.get(nextItem.id);
        if (replacements && replacements.length > 0) {
          const replacementId = replacements.shift();
          if (replacementId) {
            nextItem.id = replacementId;
          }
        }
      }

      if (nextItem.items?.length) {
        nextItem.items = this.remapSidebarOperationIds(nextItem.items, idMap);
      }

      return nextItem;
    });
  }

  private getOperationDataReference(op: Operation): string {
    return `operationsByType[${JSON.stringify(op.operationType)}][${JSON.stringify(op.name)}]`;
  }

  private getTypeName(type: ExpandedType): string | null {
    if (!('name' in type)) {
      return null;
    }

    return type.name;
  }

  private getTypeDataReference(typeName: string): string {
    return `typesByName[${JSON.stringify(typeName)}]`;
  }

  private getRelativeImportPath(fromPath: string, toPath: string): string {
    const fromDir = path.posix.dirname(fromPath);
    let relativePath = path.posix.relative(fromDir, toPath);

    if (!relativePath.startsWith('.')) {
      relativePath = `./${relativePath}`;
    }

    return relativePath;
  }

  private generateDataFiles(serializedData: SerializedDocData): GeneratedFile[] {
    const files: GeneratedFile[] = [
      {
        path: OPERATIONS_DATA_FILE,
        content: serializedData.operationsJson,
        type: 'json',
      },
      {
        path: TYPES_DATA_FILE,
        content: serializedData.typesJson,
        type: 'json',
      },
    ];

    return files;
  }

  private collectOperationEntries(model: DocModel): Array<{ op: Operation }> {
    const entries: Array<{ op: Operation }> = [];

    for (const section of model.sections) {
      for (const subsection of section.subsections) {
        for (const op of subsection.operations) {
          entries.push({ op });
        }
      }
    }

    return entries;
  }

  private generateExternalExamplesExport(
    entries: Array<{ name: string; operationType: Operation['operationType'] }>
  ): string {
    if (entries.length === 0) {
      return 'export const examplesByOperation = {};';
    }

    const lines = entries.map(
      ({ name, operationType }) =>
        `  ${JSON.stringify(name)}: (operationsByType[${JSON.stringify(
          operationType
        )}][${JSON.stringify(name)}]?.examples ?? []),`
    );

    return `export const examplesByOperation = {\n${lines.join('\n')}\n};`;
  }

  adapt(model: DocModel, serializedData?: SerializedDocData): GeneratedFile[] {
    const sharedDocData = serializedData ?? serializeDocData(model);
    const dataFiles = this.generateDataFiles(sharedDocData);
    const operationDocSlugs = this.resolveOperationDocSlugs(model);
    const introDocs = buildIntroDocsSection({
      introDocs: this.getIntroDocs(),
      withDocIdPrefix: (id) => this.withDocIdPrefix(id),
    });

    if (this.config.singlePage) {
      const files = this.generateSinglePageOutput(model, introDocs);
      return [...introDocs.files, ...files, ...dataFiles];
    }

    const files: GeneratedFile[] = [...introDocs.files, ...dataFiles];

    for (const section of model.sections) {
      const sectionPath = this.getSectionPath(section);

      // Section category file
      files.push({
        path: `${sectionPath}/_category_.json`,
        content: this.generateCategoryJson(section.name, section.order),
        type: 'json',
      });

      for (const subsection of section.subsections) {
        // If subsection name is empty, it's the root of the section
        const isRootSubsection = subsection.name === '';
        const subsectionPath = this.getSubsectionPath(section, subsection);
        const typeLinkBase = this.getTypeLinkBase(subsectionPath);

        if (!isRootSubsection) {
          files.push({
            path: `${subsectionPath}/_category_.json`,
            content: this.generateCategoryJson(subsection.name, 0), // Order 0 for now
            type: 'json',
          });
        }

        for (const op of subsection.operations) {
          const operationSlug = operationDocSlugs.get(op) ?? (slugify(op.name) || 'operation');
          const fileName = `${operationSlug}.mdx`;
          files.push({
            path: `${subsectionPath}/${fileName}`,
            content: this.generateMdx(op, typeLinkBase, {
              mdxPath: `${subsectionPath}/${fileName}`,
              docSlug: operationSlug,
            }),
            type: 'mdx',
          });
        }
      }
    }

    files.push(...this.generateTypeFiles(model.types));

    if (this.config.generateSidebar !== false) {
      // Generate or merge sidebars configuration.
      let sidebarItems = this.sidebarGenerator.generate(model);
      const operationIdMap = this.buildSidebarOperationIdMap(model, operationDocSlugs);
      sidebarItems = this.remapSidebarOperationIds(sidebarItems, operationIdMap);
      if (introDocs.sidebarItems.length > 0) {
        sidebarItems = [
          ...introDocs.sidebarItems,
          { type: 'html', value: '<hr class="gql-sidebar-divider" />', defaultStyle: true },
          ...sidebarItems,
        ];
      }

      files.push(...this.generateSidebarFiles(sidebarItems));
    }

    return files;
  }

  // ==================== Single-Page Mode Methods ====================

  private generateSinglePageOutput(
    model: DocModel,
    introDocs: { files: GeneratedFile[]; sidebarItems: SidebarItem[] }
  ): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const docId = 'api-reference';
    const typeGroups = groupTypes(model.types);
    const usedOperationIds = new Set<string>();
    const usedTypeIds = new Set<string>();
    const getOperationId = (op: Operation) => {
      const base = this.createOperationId(op);
      let candidate = base;
      let counter = 1;
      while (usedOperationIds.has(candidate)) {
        candidate = `${base}_${counter}`;
        counter += 1;
      }
      usedOperationIds.add(candidate);
      return candidate;
    };
    const getTypeId = (type: ExpandedType) => {
      const base = this.createTypeId(type);
      let candidate = base;
      let counter = 1;
      while (usedTypeIds.has(candidate)) {
        candidate = `${base}_${counter}`;
        counter += 1;
      }
      usedTypeIds.add(candidate);
      return candidate;
    };

    // Build content sections
    const frontMatter = this.generateSinglePageFrontMatter();
    const operationEntries = this.collectOperationEntries(model);
    const examplesExport = this.generateExternalExamplesExport(
      operationEntries.map(({ op }) => ({ name: op.name, operationType: op.operationType }))
    );
    const imports = [
      `import { OperationView, TypeDefinitionView } from '${COMPONENT_PACKAGE_IMPORT}';`,
      `import operationsByType from '${this.getRelativeImportPath(
        `${docId}.mdx`,
        OPERATIONS_DATA_FILE
      )}';`,
      `import typesByName from '${this.getRelativeImportPath(`${docId}.mdx`, TYPES_DATA_FILE)}';`,
    ];
    const toc = this.generateTableOfContents(model);
    const sectionsContent = model.sections
      .map((section) => this.generateSectionContent(section, getOperationId))
      .join('\n\n');
    const typesContent = this.generateTypesContent(typeGroups, getTypeId);

    // Combine all parts
    const contentParts = [
      frontMatter,
      imports.join('\n'),
      examplesExport,
      '',
      '# API Reference',
      '',
      toc,
      '---',
      '',
      sectionsContent,
    ];

    if (typesContent) {
      contentParts.push('', '---', '', typesContent);
    }

    const content = contentParts.join('\n');

    files.push({
      path: `${docId}.mdx`,
      content: content,
      type: 'mdx',
    });

    if (this.config.generateSidebar !== false) {
      // Generate sidebar with hash links
      let sidebarItems = this.sidebarGenerator.generateSinglePageSidebar(model, docId);
      if (introDocs.sidebarItems.length > 0) {
        sidebarItems = [
          ...introDocs.sidebarItems,
          { type: 'html', value: '<hr class="gql-sidebar-divider" />', defaultStyle: true },
          ...sidebarItems,
        ];
      }

      files.push(...this.generateSidebarFiles(sidebarItems));
    }

    return files;
  }

  private generateSinglePageFrontMatter(): string {
    return [
      '---',
      'id: api-reference',
      'title: API Reference',
      'sidebar_label: API Reference',
      'api: true',
      '---',
    ].join('\n');
  }

  private generateTableOfContents(model: DocModel): string {
    const lines: string[] = ['## Table of Contents', ''];

    for (const section of model.sections) {
      const sectionSlug = slugify(section.name);
      lines.push(`- [${section.name}](#${sectionSlug})`);

      for (const subsection of section.subsections) {
        if (subsection.name === '') {
          // Root subsection - operations go directly under section
          for (const op of subsection.operations) {
            const opSlug = slugify(op.name);
            lines.push(`  - [${op.name}](#${opSlug})`);
          }
        } else {
          // Named subsection
          const subsectionSlug = `${sectionSlug}-${slugify(subsection.name)}`;
          lines.push(`  - [${subsection.name}](#${subsectionSlug})`);

          for (const op of subsection.operations) {
            const opSlug = slugify(op.name);
            lines.push(`    - [${op.name}](#${opSlug})`);
          }
        }
      }
    }

    const typeGroups = groupTypes(model.types);
    if (typeGroups.enums.length + typeGroups.inputs.length + typeGroups.types.length > 0) {
      lines.push(`- [Types](#types)`);
      lines.push(`  - [Enums](#types-enums)`);
      lines.push(`  - [Inputs](#types-inputs)`);
      lines.push(`  - [Types](#types-types)`);
    }

    return lines.join('\n');
  }

  private generateSectionContent(
    section: Section,
    operationExportName: (op: Operation) => string
  ): string {
    const sectionSlug = slugify(section.name);
    const lines: string[] = [];

    // Section header with anchor
    lines.push(`## ${section.name} {#${sectionSlug}}`);
    lines.push('');

    // Generate subsection content
    for (const subsection of section.subsections) {
      lines.push(
        this.generateSubsectionContent(subsection, section, sectionSlug, operationExportName)
      );
    }

    return lines.join('\n');
  }

  private generateSubsectionContent(
    subsection: Subsection,
    section: Section,
    sectionSlug: string,
    operationExportName: (op: Operation) => string
  ): string {
    const lines: string[] = [];

    if (subsection.name !== '') {
      // Named subsection - add header with anchor
      const subsectionSlug = `${sectionSlug}-${slugify(subsection.name)}`;
      lines.push(`### ${subsection.name} {#${subsectionSlug}}`);
      lines.push('');
    }

    // Generate operation content
    for (let i = 0; i < subsection.operations.length; i++) {
      const op = subsection.operations[i];
      lines.push(this.generateOperationContent(op, operationExportName(op)));

      // Add divider between operations (but not after the last one)
      if (i < subsection.operations.length - 1) {
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private generateOperationContent(op: Operation, exportName: string): string {
    return this.renderer.renderOperation(op, {
      exportName,
      exportConst: false,
      headingLevel: 4,
      dataReference: this.getOperationDataReference(op),
      defaultExpandedLevels: this.config.typeExpansion?.defaultLevels,
      maxDepth: this.config.typeExpansion?.maxDepth,
      unsafeDescriptionMdx: this.config.unsafeMdxDescriptions,
      typeLinkMode: this.getTypeLinkMode(),
      llmDocsBasePath: this.config.llmDocsBasePath,
    });
  }

  // ==================== Multi-Page Mode Methods ====================

  private generateMdx(
    op: Operation,
    typeLinkBase?: string,
    options: { mdxPath?: string; docSlug?: string } = {}
  ): string {
    const frontMatter = this.generateFrontMatter(op, options.docSlug);
    const imports = options.mdxPath
      ? [
          `import { OperationView } from '${COMPONENT_PACKAGE_IMPORT}';`,
          `import operationsByType from '${this.getRelativeImportPath(
            options.mdxPath,
            OPERATIONS_DATA_FILE
          )}';`,
          `import typesByName from '${this.getRelativeImportPath(
            options.mdxPath,
            TYPES_DATA_FILE
          )}';`,
        ]
      : [];
    const examplesExport = this.generateExternalExamplesExport([
      { name: op.name, operationType: op.operationType },
    ]);
    const content = this.renderer.renderOperation(op, {
      exportName: 'operation',
      headingLevel: 1,
      typeLinkBase,
      dataReference: this.getOperationDataReference(op),
      defaultExpandedLevels: this.config.typeExpansion?.defaultLevels,
      maxDepth: this.config.typeExpansion?.maxDepth,
      unsafeDescriptionMdx: this.config.unsafeMdxDescriptions,
      typeLinkMode: this.getTypeLinkMode(),
      llmDocsBasePath: this.config.llmDocsBasePath,
    });
    const parts = [
      frontMatter,
      ...(imports.length > 0 ? [imports.join('\n')] : []),
      examplesExport,
      content,
    ];
    return parts.join('\n\n');
  }

  private generateFrontMatter(op: Operation, docSlug?: string): string {
    const id = docSlug ?? (slugify(op.name) || 'operation');
    const title = escapeYamlValue(op.name);
    const sidebarLabel = escapeYamlValue(
      op.directives.docGroup?.displayLabel ?? op.directives.docGroup?.sidebarTitle ?? op.name
    );

    const lines = ['---', `id: ${id}`, `title: ${title}`, `sidebar_label: ${sidebarLabel}`];

    if (op.directives.docTags?.tags?.length) {
      const tags = op.directives.docTags.tags.map((t: string) => escapeYamlTag(t)).join(', ');
      lines.push(`tags: [${tags}]`);
    }

    // Add custom front matter if needed (e.g. for search)
    lines.push('hide_title: true'); // Common Docusaurus pattern if h1 is in content
    lines.push('api: true');
    lines.push('---');

    return lines.join('\n');
  }

  private generateCategoryJson(label: string, position?: number): string {
    const category: Record<string, unknown> = {
      label,
      collapsible: true,
      collapsed: true,
    };

    if (typeof position === 'number') {
      category.position = position;
    }

    if (this.config.sidebarCategoryIndex) {
      category.link = {
        type: 'generated-index',
      };
    }

    return JSON.stringify(category, null, 2);
  }

  private createOperationId(op: Operation): string {
    const slug = slugify(op.name).replace(/-/g, '_');
    const safe = slug || 'operation';
    return `operation_${safe}`;
  }

  private generateTypeFiles(types: ExpandedType[]): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const { enums, inputs, types: objectTypes } = groupTypes(types);

    if (enums.length + inputs.length + objectTypes.length === 0) {
      return files;
    }

    files.push({
      path: 'types/_category_.json',
      content: this.generateCategoryJson('Types', DEFAULT_SORT_PRIORITY),
      type: 'json',
    });
    files.push({
      path: 'types/enums/_category_.json',
      content: this.generateCategoryJson('Enums', 0),
      type: 'json',
    });
    files.push({
      path: 'types/inputs/_category_.json',
      content: this.generateCategoryJson('Inputs', 0),
      type: 'json',
    });
    files.push({
      path: 'types/types/_category_.json',
      content: this.generateCategoryJson('Types', 0),
      type: 'json',
    });

    for (const enumType of enums) {
      const name = (enumType as { name: string }).name;
      const fileName = `${slugify(name)}.mdx`;
      files.push({
        path: `types/enums/${fileName}`,
        content: this.generateTypeMdx(enumType, {
          mdxPath: `types/enums/${fileName}`,
        }),
        type: 'mdx',
      });
    }

    for (const inputType of inputs) {
      const name = (inputType as { name: string }).name;
      const fileName = `${slugify(name)}.mdx`;
      files.push({
        path: `types/inputs/${fileName}`,
        content: this.generateTypeMdx(inputType, {
          mdxPath: `types/inputs/${fileName}`,
        }),
        type: 'mdx',
      });
    }

    for (const objectType of objectTypes) {
      const name = (objectType as { name: string }).name;
      const fileName = `${slugify(name)}.mdx`;
      files.push({
        path: `types/types/${fileName}`,
        content: this.generateTypeMdx(objectType, {
          mdxPath: `types/types/${fileName}`,
        }),
        type: 'mdx',
      });
    }

    return files;
  }

  private generateTypeMdx(type: ExpandedType, options: { mdxPath?: string } = {}): string {
    const frontMatter = this.generateTypeFrontMatter(type);
    const imports = options.mdxPath
      ? [
          `import { TypeDefinitionView } from '${COMPONENT_PACKAGE_IMPORT}';`,
          `import typesByName from '${this.getRelativeImportPath(
            options.mdxPath,
            TYPES_DATA_FILE
          )}';`,
        ]
      : [];
    const content = this.renderer.renderTypeDefinition(type, {
      exportName: 'typeDefinition',
      headingLevel: 1,
      typeLinkBase: '..',
      dataReference: 'name' in type && type.name ? this.getTypeDataReference(type.name) : undefined,
      defaultExpandedLevels: this.config.typeExpansion?.defaultLevels,
      maxDepth: this.config.typeExpansion?.maxDepth,
      typeLinkMode: this.getTypeLinkMode(),
    });
    const parts = [frontMatter, ...(imports.length > 0 ? [imports.join('\n')] : []), content];
    return parts.join('\n\n');
  }

  private generateTypeFrontMatter(type: ExpandedType): string {
    const name = 'name' in type ? type.name : 'type';
    const id = slugify(name);
    const title = escapeYamlValue(name);
    const sidebarLabel = escapeYamlValue(name);

    const lines = ['---', `id: ${id}`, `title: ${title}`, `sidebar_label: ${sidebarLabel}`];
    lines.push('hide_title: true');
    lines.push('api: true');
    lines.push('---');

    return lines.join('\n');
  }

  private generateTypesContent(
    typeGroups: ReturnType<typeof groupTypes>,
    typeExportName: (type: ExpandedType) => string
  ): string {
    const { enums, inputs, types } = typeGroups;

    if (enums.length + inputs.length + types.length === 0) {
      return '';
    }

    const lines: string[] = [];

    lines.push('## Types {#types}');
    lines.push('');

    const pushTypeGroup = (label: string, anchor: string, group: ExpandedType[]) => {
      lines.push(`### ${label} {#${anchor}}`);
      lines.push('');

      if (group.length === 0) {
        lines.push('_No entries_');
        lines.push('');
        return;
      }

      group.forEach((type, index) => {
        const typeName = this.getTypeName(type);
        lines.push(
          this.renderer.renderTypeDefinition(type, {
            exportName: typeExportName(type),
            exportConst: false,
            headingLevel: 4,
            dataReference: typeName ? this.getTypeDataReference(typeName) : undefined,
            defaultExpandedLevels: this.config.typeExpansion?.defaultLevels,
            maxDepth: this.config.typeExpansion?.maxDepth,
            typeLinkMode: this.getTypeLinkMode(),
          })
        );
        if (index < group.length - 1) {
          lines.push('');
        }
      });

      lines.push('');
    };

    pushTypeGroup('Enums', 'types-enums', enums);
    pushTypeGroup('Inputs', 'types-inputs', inputs);
    pushTypeGroup('Types', 'types-types', types);

    return lines.join('\n');
  }

  private createTypeId(type: ExpandedType): string {
    const name = 'name' in type ? type.name : 'type';
    const slug = slugify(name).replace(/-/g, '_');
    const safe = slug || 'type';
    return `type_${safe}`;
  }

  private getTypeLinkBase(docPath: string): string {
    const segments = docPath.split('/').filter(Boolean);
    if (segments.length === 0) {
      return 'types';
    }
    const prefix = segments.map(() => '..').join('/');
    return `${prefix}/types`;
  }

  private getTypeLinkMode(): 'deep' | 'all' | undefined {
    if (!this.config.typeLinkMode || this.config.typeLinkMode === 'none') {
      return undefined;
    }
    return this.config.typeLinkMode;
  }
}
