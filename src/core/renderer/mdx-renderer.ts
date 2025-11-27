import Handlebars from 'handlebars';
import fs from 'node:fs';
import path from 'node:path';
import { Operation } from '../transformer/types';

export class MdxRenderer {
  private template: Handlebars.TemplateDelegate;

  constructor() {
    this.registerHelpers();
    this.registerPartials();

    // Load main template
    // In a real build, we might bundle these strings or copy files.
    // For now, we assume src/templates exists at runtime or we read from a known location.
    // To make this robust for the library, we should probably inline them or use a build step to copy them.
    // For this implementation, I'll read from the file system assuming the CWD is project root or similar.
    // A better approach for a library is to embed them.
    // Let's try to read relative to __dirname if possible, or just hardcode for MVP if FS is tricky in build.
    // Given we are in src/core/renderer, templates are in ../../../src/templates
    // But when built to dist, structure changes.
    // Let's assume for now we run from project root.

    const templatePath = path.resolve(process.cwd(), 'src/templates/operation.hbs');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    this.template = Handlebars.compile(templateContent);
  }

  public renderOperation(op: Operation): string {
    return this.template(op);
  }

  private registerHelpers() {
    Handlebars.registerHelper('json', (context) => {
      return JSON.stringify(context, null, 2);
    });

    Handlebars.registerHelper('eq', (a, b) => {
      return a === b;
    });

    Handlebars.registerHelper('slugify', (text) => {
      if (!text) return '';
      return text
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    });
  }

  private registerPartials() {
    const partials = ['arguments', 'type', 'examples'];
    partials.forEach((name) => {
      const partialPath = path.resolve(process.cwd(), `src/templates/${name}.hbs`);
      const content = fs.readFileSync(partialPath, 'utf-8');
      Handlebars.registerPartial(name, content);
    });
  }
}
