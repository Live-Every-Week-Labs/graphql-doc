import { DocModel, Operation, Section, Subsection } from '../transformer/types';
import { GeneratedFile } from './types';
import { MdxRenderer } from '../renderer/mdx-renderer';

export interface DocusaurusAdapterConfig {
  singlePage?: boolean;
}

export class DocusaurusAdapter {
  private renderer: MdxRenderer;
  private config: DocusaurusAdapterConfig;

  constructor(config: DocusaurusAdapterConfig = {}) {
    this.renderer = new MdxRenderer();
    this.config = config;
  }

  adapt(model: DocModel): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    if (this.config.singlePage) {
      // Single page mode implementation
      // For now, we'll just concatenate all operations into one file
      // This is a basic implementation of single-page mode
      const content = model.sections
        .map((section: Section) => {
          return section.subsections
            .map((subsection: Subsection) => {
              return subsection.operations
                .map((op: Operation) => this.generateMdx(op))
                .join('\n\n---\n\n');
            })
            .join('\n\n');
        })
        .join('\n\n');

      files.push({
        path: 'index.mdx',
        content: content,
        type: 'mdx',
      });
      return files;
    }

    for (const section of model.sections) {
      const sectionPath = this.slugify(section.name);

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
          : `${sectionPath}/${this.slugify(subsection.name)}`;

        if (!isRootSubsection) {
          files.push({
            path: `${subsectionPath}/_category_.json`,
            content: this.generateCategoryJson(subsection.name, 0), // Order 0 for now
            type: 'json',
          });
        }

        for (const op of subsection.operations) {
          const fileName = `${this.slugify(op.name)}.mdx`;
          files.push({
            path: `${subsectionPath}/${fileName}`,
            content: this.generateMdx(op),
            type: 'mdx',
          });
        }
      }
    }

    return files;
  }

  private generateMdx(op: Operation): string {
    const frontMatter = this.generateFrontMatter(op);
    const content = this.renderer.renderOperation(op);
    return `${frontMatter}\n\n${content}`;
  }

  private generateFrontMatter(op: Operation): string {
    const id = this.slugify(op.name);
    const title = op.name;
    const sidebarLabel = op.name;

    const lines = ['---', `id: ${id}`, `title: ${title}`, `sidebar_label: ${sidebarLabel}`];

    if (op.directives.docTags?.tags?.length) {
      const tags = op.directives.docTags.tags.map((t: string) => `"${t}"`).join(', ');
      lines.push(`tags: [${tags}]`);
    }

    // Add custom front matter if needed (e.g. for search)
    lines.push('hide_title: true'); // Common Docusaurus pattern if h1 is in content
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

  private slugify(text: string): string {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between camelCase
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
