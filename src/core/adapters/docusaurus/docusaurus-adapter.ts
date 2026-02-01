import { DocModel, Operation, Section, Subsection, ExpandedType } from '../../transformer/types';
import { GeneratedFile } from '../types';
import { MdxRenderer } from '../../renderer/mdx-renderer';
import { SidebarGenerator, SidebarItem } from './sidebar-generator';
import { escapeYamlValue, escapeYamlTag } from '../../utils/yaml-escape';
import { slugify } from '../../utils/string-utils';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = '_data';
const OPERATIONS_DATA_FILE = path.posix.join(DATA_DIR, 'operations.json');
const TYPES_DATA_FILE = path.posix.join(DATA_DIR, 'types.json');

export interface DocusaurusAdapterConfig {
  singlePage?: boolean;
  outputPath?: string;
  typeLinkMode?: 'none' | 'deep' | 'all';
  typeExpansion?: {
    maxDepth?: number;
    defaultLevels?: number;
  };
  unsafeMdxDescriptions?: boolean;
  generateSidebar?: boolean;
  sidebarFile?: string;
  sidebarCategoryIndex?: boolean;
  sidebarSectionLabels?: {
    operations?: string;
    types?: string;
  };
  introDocs?: Array<
    | string
    | {
        source: string;
        outputPath?: string;
        id?: string;
        label?: string;
        title?: string;
      }
  >;
}

export class DocusaurusAdapter {
  private renderer: MdxRenderer;
  private sidebarGenerator: SidebarGenerator;
  private config: DocusaurusAdapterConfig;

  constructor(config: DocusaurusAdapterConfig = {}) {
    this.renderer = new MdxRenderer();
    this.sidebarGenerator = new SidebarGenerator({
      categoryIndex: config.sidebarCategoryIndex,
      sectionLabels: config.sidebarSectionLabels,
    });
    this.config = config;
  }

  private getIntroDocs(): Array<{
    source: string;
    outputPath?: string;
    id?: string;
    label?: string;
    title?: string;
  }> {
    const introDocs = this.config.introDocs ?? [];
    return introDocs.map((doc) => (typeof doc === 'string' ? { source: doc } : doc));
  }

  private parseFrontMatter(content: string): {
    frontMatter?: Record<string, string>;
    frontMatterBlock?: string;
  } {
    if (!content.startsWith('---')) {
      return {};
    }
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!match) {
      return {};
    }
    const block = match[1];
    const frontMatter: Record<string, string> = {};
    block.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const separator = trimmed.indexOf(':');
      if (separator === -1) return;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      frontMatter[key] = value;
    });
    return { frontMatter, frontMatterBlock: match[0] };
  }

  private ensureFrontMatter(
    content: string,
    options: { id?: string; title?: string; label?: string }
  ): string {
    const { id, title, label } = options;
    if (!id && !title && !label) {
      return content;
    }

    if (content.startsWith('---')) {
      const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
      if (!match) {
        return content;
      }
      const block = match[1];
      const lines = block.split('\n');
      const hasId = lines.some((line) => line.trim().startsWith('id:'));
      const hasTitle = lines.some((line) => line.trim().startsWith('title:'));
      const hasLabel = lines.some((line) => line.trim().startsWith('sidebar_label:'));
      const additions: string[] = [];
      if (id && !hasId) additions.push(`id: ${id}`);
      if (title && !hasTitle) additions.push(`title: ${title}`);
      if (label && !hasLabel) additions.push(`sidebar_label: ${label}`);
      if (additions.length === 0) {
        return content;
      }
      const updatedBlock = ['---', ...additions, ...lines, '---'].join('\n');
      return content.replace(match[0], `${updatedBlock}\n`);
    }

    const frontMatterLines = ['---'];
    if (id) frontMatterLines.push(`id: ${id}`);
    if (title) frontMatterLines.push(`title: ${title}`);
    if (label) frontMatterLines.push(`sidebar_label: ${label}`);
    frontMatterLines.push('---');
    return `${frontMatterLines.join('\n')}\n\n${content}`;
  }

  private buildIntroDocs(): {
    files: GeneratedFile[];
    sidebarItems: SidebarItem[];
  } {
    const introDocs = this.getIntroDocs();
    if (introDocs.length === 0) {
      return { files: [], sidebarItems: [] };
    }

    const files: GeneratedFile[] = [];
    const sidebarItems: SidebarItem[] = [];

    for (const doc of introDocs) {
      const sourcePath = doc.source;
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Intro doc not found: ${sourcePath}`);
      }
      const rawContent = fs.readFileSync(sourcePath, 'utf-8');
      const { frontMatter } = this.parseFrontMatter(rawContent);
      const sourceExt = path.extname(sourcePath) || '.mdx';
      const outputPathRaw = doc.outputPath ?? path.basename(sourcePath);
      const outputPath = outputPathRaw.endsWith(sourceExt)
        ? outputPathRaw
        : `${outputPathRaw}${sourceExt}`;
      const docId =
        doc.id ?? frontMatter?.id ?? outputPath.replace(/\.[^/.]+$/, '').replace(/\\/g, '/');
      const label =
        doc.label ?? frontMatter?.sidebar_label ?? frontMatter?.title ?? docId.split('/').pop()!;

      const content = this.ensureFrontMatter(rawContent, {
        id: doc.id,
        title: doc.title,
        label: doc.label,
      });

      files.push({
        path: outputPath.replace(/\\/g, '/'),
        content,
        type: 'mdx',
      });

      sidebarItems.push({
        type: 'doc',
        id: docId,
        label,
      });
    }

    return { files, sidebarItems };
  }

  private getSectionPath(section: Section): string {
    return slugify(section.name);
  }

  private getSubsectionPath(section: Section, subsection: Subsection): string {
    const sectionPath = this.getSectionPath(section);
    return subsection.name === '' ? sectionPath : `${sectionPath}/${slugify(subsection.name)}`;
  }

  private getOperationDocId(section: Section, subsection: Subsection, op: Operation): string {
    const subsectionPath = this.getSubsectionPath(section, subsection);
    return `${subsectionPath}/${slugify(op.name)}`;
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

  private buildOperationsByType(model: DocModel): Record<string, Record<string, Operation>> {
    const operationsByType: Record<string, Record<string, Operation>> = {
      query: {},
      mutation: {},
      subscription: {},
    };

    for (const section of model.sections) {
      for (const subsection of section.subsections) {
        for (const op of subsection.operations) {
          operationsByType[op.operationType][op.name] = op;
        }
      }
    }

    return operationsByType;
  }

  private buildTypesByName(types: ExpandedType[]): Record<string, ExpandedType> {
    const typesByName: Record<string, ExpandedType> = {};

    for (const type of types) {
      const name = this.getTypeName(type);
      if (!name) continue;
      typesByName[name] = type;
    }

    return typesByName;
  }

  private generateDataFiles(model: DocModel): GeneratedFile[] {
    const operationsByType = this.buildOperationsByType(model);
    const typesByName = this.buildTypesByName(model.types);
    const files: GeneratedFile[] = [
      {
        path: OPERATIONS_DATA_FILE,
        content: JSON.stringify(operationsByType, null, 2),
        type: 'json',
      },
      {
        path: TYPES_DATA_FILE,
        content: JSON.stringify(typesByName, null, 2),
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

  adapt(model: DocModel): GeneratedFile[] {
    const dataFiles = this.generateDataFiles(model);
    const introDocs = this.buildIntroDocs();

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
          const fileName = `${slugify(op.name)}.mdx`;
          files.push({
            path: `${subsectionPath}/${fileName}`,
            content: this.generateMdx(op, typeLinkBase, {
              mdxPath: `${subsectionPath}/${fileName}`,
            }),
            type: 'mdx',
          });
        }
      }
    }

    files.push(...this.generateTypeFiles(model.types));

    if (this.config.generateSidebar !== false) {
      // Generate sidebars.js or sidebars.api.js
      let sidebarItems = this.sidebarGenerator.generate(model);
      if (introDocs.sidebarItems.length > 0) {
        sidebarItems = [
          ...introDocs.sidebarItems,
          { type: 'html', value: '<hr class="gql-sidebar-divider" />', defaultStyle: true },
          ...sidebarItems,
        ];
      }

      const customSidebarFile = this.config.sidebarFile;
      if (customSidebarFile) {
        const useArrayExport = customSidebarFile.endsWith('.api.js');
        const content = useArrayExport
          ? `module.exports = ${JSON.stringify(sidebarItems, null, 2)};`
          : `module.exports = ${JSON.stringify({ apiSidebar: sidebarItems }, null, 2)};`;
        files.push({
          path: customSidebarFile,
          content,
          type: 'js',
        });
      } else {
        const sidebarsPath = path.join(this.config.outputPath || process.cwd(), 'sidebars.js');
        if (fs.existsSync(sidebarsPath)) {
          files.push({
            path: 'sidebars.api.js',
            content: `module.exports = ${JSON.stringify(sidebarItems, null, 2)};`,
            type: 'js',
          });
        } else {
          files.push({
            path: 'sidebars.js',
            content: `module.exports = ${JSON.stringify({ apiSidebar: sidebarItems }, null, 2)};`,
            type: 'js',
          });
        }
      }
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
    const typeGroups = this.groupTypes(model.types);
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

      const customSidebarFile = this.config.sidebarFile;
      if (customSidebarFile) {
        const useArrayExport = customSidebarFile.endsWith('.api.js');
        const content = useArrayExport
          ? `module.exports = ${JSON.stringify(sidebarItems, null, 2)};`
          : `module.exports = ${JSON.stringify({ apiSidebar: sidebarItems }, null, 2)};`;
        files.push({
          path: customSidebarFile,
          content,
          type: 'js',
        });
      } else {
        const sidebarsPath = path.join(this.config.outputPath || process.cwd(), 'sidebars.js');
        if (fs.existsSync(sidebarsPath)) {
          files.push({
            path: 'sidebars.api.js',
            content: `module.exports = ${JSON.stringify(sidebarItems, null, 2)};`,
            type: 'js',
          });
        } else {
          files.push({
            path: 'sidebars.js',
            content: `module.exports = ${JSON.stringify({ apiSidebar: sidebarItems }, null, 2)};`,
            type: 'js',
          });
        }
      }
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

    const typeGroups = this.groupTypes(model.types);
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
    });
  }

  // ==================== Multi-Page Mode Methods ====================

  private generateMdx(
    op: Operation,
    typeLinkBase?: string,
    options: { mdxPath?: string } = {}
  ): string {
    const frontMatter = this.generateFrontMatter(op);
    const imports = options.mdxPath
      ? [
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
    });
    const parts = [
      frontMatter,
      ...(imports.length > 0 ? [imports.join('\n')] : []),
      examplesExport,
      content,
    ];
    return parts.join('\n\n');
  }

  private generateFrontMatter(op: Operation): string {
    const id = slugify(op.name);
    const title = escapeYamlValue(op.name);
    const sidebarLabel = escapeYamlValue(op.name);

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
    const { enums, inputs, types: objectTypes } = this.groupTypes(types);

    if (enums.length + inputs.length + objectTypes.length === 0) {
      return files;
    }

    files.push({
      path: 'types/_category_.json',
      content: this.generateCategoryJson('Types', 999),
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

  private groupTypes(types: ExpandedType[]) {
    const enums: ExpandedType[] = [];
    const inputs: ExpandedType[] = [];
    const objectTypes: ExpandedType[] = [];

    for (const type of types) {
      if (!('name' in type)) {
        continue;
      }
      if (type.kind === 'ENUM') {
        enums.push(type);
      } else if (type.kind === 'INPUT_OBJECT') {
        inputs.push(type);
      } else if (
        type.kind === 'OBJECT' ||
        type.kind === 'INTERFACE' ||
        type.kind === 'UNION' ||
        type.kind === 'SCALAR'
      ) {
        objectTypes.push(type);
      }
    }

    const byName = (a: ExpandedType, b: ExpandedType) =>
      (a as { name: string }).name.localeCompare((b as { name: string }).name);

    return {
      enums: enums.sort(byName),
      inputs: inputs.sort(byName),
      types: objectTypes.sort(byName),
    };
  }

  private generateTypesContent(
    typeGroups: ReturnType<typeof this.groupTypes>,
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
