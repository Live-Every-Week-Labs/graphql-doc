import { DocModel, Operation, Section, Subsection } from '../transformer/types';
import { GeneratedFile } from './types';

export class DocusaurusAdapter {
  adapt(model: DocModel): GeneratedFile[] {
    const files: GeneratedFile[] = [];

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
    // Content generation is handled by the renderer (Phase 5),
    // but the adapter prepares the file structure and front matter.
    // For now, we'll put a placeholder or just the front matter.
    // The PRD implies the adapter generates the files, but Phase 5 is "MDX Generation".
    // Phase 4 tasks are "Generate Docusaurus front matter", "Determine file paths", "Create _category_.json".
    // So this adapter is likely responsible for the *structure* and *metadata*,
    // while the actual markdown content comes from templates in Phase 5.
    // However, to satisfy "Generate MDX files", we need some content.
    // We will assume this adapter produces the final file *object* which will contain
    // the rendered content later.
    // BUT, looking at the architecture: Adapter -> MDX Generator -> File Writer.
    // Or is it Adapter (Model -> Files) -> Writer?
    // The PRD says:
    // Phase 4: Docusaurus Adapter (Goals: Adapt internal model to Docusaurus conventions)
    // Phase 5: MDX Generation (Goals: Generate MDX files from internal templates)

    // It seems Phase 5 is about the *content* (templates).
    // Phase 4 is about the *structure* (paths, frontmatter, sidebars).
    // So for now, I will just output the front matter as the content,
    // knowing that Phase 5 will inject the template rendering logic here.

    return `${frontMatter}\n\n# ${op.name}`;
  }

  private generateFrontMatter(op: Operation): string {
    const id = this.slugify(op.name);
    const title = op.name;
    const sidebarLabel = op.name;

    const lines = ['---', `id: ${id}`, `title: ${title}`, `sidebar_label: ${sidebarLabel}`];

    if (op.directives.docTags?.tags?.length) {
      const tags = op.directives.docTags.tags.map((t) => `"${t}"`).join(', ');
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
