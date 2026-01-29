import Handlebars from 'handlebars';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Operation, ExpandedType } from '../transformer/types';
import { slugify } from '../utils/string-utils';

/**
 * Get the current directory in both ESM and CJS environments.
 * - ESM: Uses import.meta.url
 * - CJS: Falls back to __dirname (available in CommonJS)
 */
function getCurrentDirectory(): string {
  // ESM environment: use import.meta.url
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return path.dirname(fileURLToPath(import.meta.url));
  }

  // CJS environment: __dirname is available globally
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }

  throw new Error(
    'Unable to determine current directory. This package requires Node.js 18+ with ESM or CJS support.'
  );
}

/**
 * Resolve the templates directory relative to the current module.
 *
 * Handles two scenarios:
 * 1. Development: Running from src/core/renderer/ - go up 3 levels to reach templates/
 * 2. Bundled (npm package): Running from dist/ - go up 1 level to reach templates/
 *
 * Detection: Check if we're in a 'dist' directory (bundled) vs 'src' directory (development)
 */
function getTemplatesDir(): string {
  const currentDir = getCurrentDirectory();

  // Check if we're in the bundled 'dist' directory or the source 'src' directory
  if (currentDir.includes(path.sep + 'dist') || currentDir.endsWith(path.sep + 'dist')) {
    // Bundled output: templates are at package root (go up 1 level from dist/)
    return path.resolve(currentDir, '..', 'templates');
  } else {
    // Development: src/core/renderer -> go up 3 levels to reach templates/
    return path.resolve(currentDir, '..', '..', '..', 'templates');
  }
}

const templatesDir = getTemplatesDir();

interface RenderOptions {
  exportName?: string;
  exportConst?: boolean;
  headingLevel?: number;
  includeDescription?: boolean;
  typeLinkBase?: string;
}

export class MdxRenderer {
  private operationTemplate: Handlebars.TemplateDelegate;
  private typeDefinitionTemplate: Handlebars.TemplateDelegate;

  constructor() {
    this.registerHelpers();

    // Load main template from the templates directory
    // This works both in development (src/) and when installed as npm package (dist/)
    const operationTemplatePath = path.join(templatesDir, 'operation.hbs');
    const operationTemplateContent = fs.readFileSync(operationTemplatePath, 'utf-8');
    this.operationTemplate = Handlebars.compile(operationTemplateContent);

    const typeDefinitionTemplatePath = path.join(templatesDir, 'type-definition.hbs');
    const typeDefinitionTemplateContent = fs.readFileSync(typeDefinitionTemplatePath, 'utf-8');
    this.typeDefinitionTemplate = Handlebars.compile(typeDefinitionTemplateContent);
  }

  public renderOperation(op: Operation, options: RenderOptions = {}): string {
    const exportName = options.exportName ?? 'operation';
    const exportKeyword = options.exportConst === false ? 'const' : 'export const';
    const typeLinkBase = options.typeLinkBase ? JSON.stringify(options.typeLinkBase) : undefined;

    return this.operationTemplate({
      operation: op,
      exportName,
      exportKeyword,
      headingLevel: options.headingLevel,
      includeDescription: options.includeDescription !== false,
      typeLinkBase,
    });
  }

  public renderTypeDefinition(type: ExpandedType, options: RenderOptions = {}): string {
    const exportName = options.exportName ?? 'typeDefinition';
    const exportKeyword = options.exportConst === false ? 'const' : 'export const';
    const typeLinkBase = options.typeLinkBase ? JSON.stringify(options.typeLinkBase) : undefined;

    return this.typeDefinitionTemplate({
      type,
      exportName,
      exportKeyword,
      headingLevel: options.headingLevel,
      typeLinkBase,
    });
  }

  private registerHelpers() {
    Handlebars.registerHelper('json', (context) => {
      return JSON.stringify(context, null, 2);
    });

    Handlebars.registerHelper('slugify', (text) => {
      return slugify(text?.toString() ?? '');
    });
  }
}
