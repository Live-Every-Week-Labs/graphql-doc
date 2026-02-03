export interface GeneratedFile {
  path: string;
  content: string;
  type: 'mdx' | 'json' | 'js';
  absolutePath?: string;
}
