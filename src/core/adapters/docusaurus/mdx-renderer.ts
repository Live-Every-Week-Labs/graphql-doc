import Handlebars from 'handlebars';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sanitizeHtml, { type IOptions } from 'sanitize-html';
import { Operation, ExpandedType } from '../../transformer/types.js';
import { slugify } from '../../utils/string-utils.js';

/**
 * Get the current directory in both ESM and CJS environments.
 */
function getCurrentDirectory(): string {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return path.dirname(fileURLToPath(import.meta.url));
  }

  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }

  throw new Error(
    'Unable to determine current directory. This package requires Node.js 18+ with ESM or CJS support.'
  );
}

/**
 * Resolve the Docusaurus templates directory relative to the current module.
 */
function getTemplatesDir(): string {
  const currentDir = getCurrentDirectory();

  if (currentDir.includes(path.sep + 'dist') || currentDir.endsWith(path.sep + 'dist')) {
    return path.resolve(currentDir, '..', 'templates', 'docusaurus');
  }

  return path.resolve(currentDir, '..', '..', '..', '..', 'templates', 'docusaurus');
}

const templatesDir = getTemplatesDir();

interface RenderOptions {
  exportName?: string;
  exportConst?: boolean;
  headingLevel?: number;
  includeDescription?: boolean;
  unsafeDescriptionMdx?: boolean;
  typeLinkBase?: string;
  typeLinkMode?: 'none' | 'deep' | 'all';
  dataReference?: string;
  defaultExpandedLevels?: number;
  maxDepth?: number;
  llmDocsBasePath?: string;
}

const SAFE_MDX_SANITIZE_OPTIONS: IOptions = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'blockquote',
    'ul',
    'ol',
    'li',
    'pre',
    'code',
    'em',
    'strong',
    'del',
    'a',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
    'div',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    code: ['class'],
    pre: ['class'],
    div: ['class'],
    span: ['class'],
    th: ['colspan', 'rowspan', 'align'],
    td: ['colspan', 'rowspan', 'align'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
};

function sanitizeUnsafeMdx(value: string): string {
  return sanitizeHtml(value, SAFE_MDX_SANITIZE_OPTIONS);
}

export class MdxRenderer {
  private operationTemplate: Handlebars.TemplateDelegate;
  private typeDefinitionTemplate: Handlebars.TemplateDelegate;

  constructor() {
    this.registerHelpers();

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
    const typeLinkMode = options.typeLinkMode ? JSON.stringify(options.typeLinkMode) : undefined;
    const llmDocsBasePath = options.llmDocsBasePath
      ? JSON.stringify(options.llmDocsBasePath)
      : undefined;
    const hasDefaultExpandedLevels = options.defaultExpandedLevels !== undefined;
    const hasMaxDepth = options.maxDepth !== undefined;

    return this.operationTemplate({
      operation: op,
      exportName,
      exportKeyword,
      headingLevel: options.headingLevel,
      includeDescription: options.includeDescription !== false,
      unsafeDescriptionMdx: options.unsafeDescriptionMdx === true,
      defaultExpandedLevels: options.defaultExpandedLevels,
      maxDepth: options.maxDepth,
      hasDefaultExpandedLevels,
      hasMaxDepth,
      typeLinkBase,
      typeLinkMode,
      llmDocsBasePath,
      dataReference: options.dataReference,
    });
  }

  public renderTypeDefinition(type: ExpandedType, options: RenderOptions = {}): string {
    const exportName = options.exportName ?? 'typeDefinition';
    const exportKeyword = options.exportConst === false ? 'const' : 'export const';
    const typeLinkBase = options.typeLinkBase ? JSON.stringify(options.typeLinkBase) : undefined;
    const typeLinkMode = options.typeLinkMode ? JSON.stringify(options.typeLinkMode) : undefined;
    const hasDefaultExpandedLevels = options.defaultExpandedLevels !== undefined;
    const hasMaxDepth = options.maxDepth !== undefined;

    return this.typeDefinitionTemplate({
      type,
      exportName,
      exportKeyword,
      headingLevel: options.headingLevel,
      defaultExpandedLevels: options.defaultExpandedLevels,
      maxDepth: options.maxDepth,
      hasDefaultExpandedLevels,
      hasMaxDepth,
      typeLinkBase,
      typeLinkMode,
      dataReference: options.dataReference,
    });
  }

  private registerHelpers() {
    Handlebars.registerHelper('json', (context) => {
      return new Handlebars.SafeString(JSON.stringify(context, null, 2));
    });

    Handlebars.registerHelper('expr', (value) => {
      return new Handlebars.SafeString(String(value ?? ''));
    });

    Handlebars.registerHelper('slugify', (text) => {
      return slugify(text?.toString() ?? '');
    });

    Handlebars.registerHelper('unsafeMdx', (text) => {
      if (typeof text !== 'string') {
        return '';
      }
      return new Handlebars.SafeString(sanitizeUnsafeMdx(text));
    });
  }
}
