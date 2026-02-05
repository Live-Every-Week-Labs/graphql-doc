import type { DocModel } from '../transformer/types';

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'mdx' | 'md' | 'json' | 'js';
  absolutePath?: string;
}

export interface Adapter {
  adapt(model: DocModel): GeneratedFile[];
}
