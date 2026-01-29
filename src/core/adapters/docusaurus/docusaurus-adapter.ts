import { DocModel, Operation, Section, Subsection, ExpandedType } from '../../transformer/types';
import { GeneratedFile } from '../types';
import { MdxRenderer } from '../../renderer/mdx-renderer';
import { SidebarGenerator } from './sidebar-generator';
import { escapeYamlValue, escapeYamlTag } from '../../utils/yaml-escape';
import { slugify } from '../../utils/string-utils';
import * as fs from 'fs';
import * as path from 'path';

export interface DocusaurusAdapterConfig {
  singlePage?: boolean;
  outputPath?: string;
}

export class DocusaurusAdapter {
  private renderer: MdxRenderer;
  private sidebarGenerator: SidebarGenerator;
  private config: DocusaurusAdapterConfig;

  constructor(config: DocusaurusAdapterConfig = {}) {
    this.renderer = new MdxRenderer();
    this.sidebarGenerator = new SidebarGenerator();
    this.config = config;
  }

  adapt(model: DocModel): GeneratedFile[] {
    if (this.config.singlePage) {
      return this.generateSinglePageOutput(model);
    }

    const files: GeneratedFile[] = [];

    for (const section of model.sections) {
      const sectionPath = slugify(section.name);

      // Section category file
      files.push({
        path: `${sectionPath}/_category_.json`,
        content: this.generateCategoryJson(section.name, section.order),
        type: 'json',
      });

      for (const subsection of section.subsections) {
        // If subsection name is empty, it's the root of the section
        const isRootSubsection = subsection.name === '';
        const subsectionPath = isRootSubsection
          ? sectionPath
          : `${sectionPath}/${slugify(subsection.name)}`;
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
            content: this.generateMdx(op, typeLinkBase),
            type: 'mdx',
          });
        }
      }
    }

    files.push(...this.generateTypeFiles(model.types));

    // Generate sidebars.js or sidebars.api.js
    const sidebarItems = this.sidebarGenerator.generate(model);
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

    return files;
  }

  // ==================== Single-Page Mode Methods ====================

  private generateSinglePageOutput(model: DocModel): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const docId = 'api-reference';
    const operations = model.sections.flatMap((section) =>
      section.subsections.flatMap((subsection) => subsection.operations)
    );
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
    const examplesExport = this.generateExamplesExport(operations);
    const toc = this.generateTableOfContents(model);
    const sectionsContent = model.sections
      .map((section) => this.generateSectionContent(section, getOperationId))
      .join('\n\n');
    const typesContent = this.generateTypesContent(typeGroups, getTypeId);

    // Combine all parts
    const contentParts = [
      frontMatter,
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

    // Generate sidebar with hash links
    const sidebarItems = this.sidebarGenerator.generateSinglePageSidebar(model, docId);
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
      lines.push(this.generateSubsectionContent(subsection, sectionSlug, operationExportName));
    }

    return lines.join('\n');
  }

  private generateSubsectionContent(
    subsection: Subsection,
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
    });
  }

  // ==================== Multi-Page Mode Methods ====================

  private generateMdx(op: Operation, typeLinkBase?: string): string {
    const frontMatter = this.generateFrontMatter(op);
    const examplesExport = this.generateExamplesExport([op]);
    const content = this.renderer.renderOperation(op, {
      exportName: 'operation',
      headingLevel: 1,
      typeLinkBase,
    });
    return `${frontMatter}\n\n${examplesExport}\n\n${content}`;
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

  private generateCategoryJson(label: string, position: number): string {
    return JSON.stringify(
      {
        label,
        position,
        collapsible: true,
        collapsed: true,
        link: {
          type: 'generated-index',
        },
      },
      null,
      2
    );
  }

  private createOperationId(op: Operation): string {
    const slug = slugify(op.name).replace(/-/g, '_');
    const safe = slug || 'operation';
    return `operation_${safe}`;
  }

  private generateExamplesExport(operations: Operation[]): string {
    const examplesByOperation = operations.reduce<Record<string, Operation['examples']>>(
      (acc, operation) => {
        acc[operation.name] = operation.examples ?? [];
        return acc;
      },
      {}
    );

    return `export const examplesByOperation = ${JSON.stringify(examplesByOperation, null, 2)};`;
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
        content: this.generateTypeMdx(enumType),
        type: 'mdx',
      });
    }

    for (const inputType of inputs) {
      const name = (inputType as { name: string }).name;
      const fileName = `${slugify(name)}.mdx`;
      files.push({
        path: `types/inputs/${fileName}`,
        content: this.generateTypeMdx(inputType),
        type: 'mdx',
      });
    }

    for (const objectType of objectTypes) {
      const name = (objectType as { name: string }).name;
      const fileName = `${slugify(name)}.mdx`;
      files.push({
        path: `types/types/${fileName}`,
        content: this.generateTypeMdx(objectType),
        type: 'mdx',
      });
    }

    return files;
  }

  private generateTypeMdx(type: ExpandedType): string {
    const frontMatter = this.generateTypeFrontMatter(type);
    const content = this.renderer.renderTypeDefinition(type, {
      exportName: 'typeDefinition',
      headingLevel: 1,
      typeLinkBase: '..',
    });
    return `${frontMatter}\n\n${content}`;
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
        lines.push(
          this.renderer.renderTypeDefinition(type, {
            exportName: typeExportName(type),
            exportConst: false,
            headingLevel: 4,
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
}
