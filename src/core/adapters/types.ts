import type { DocModel } from '../transformer/types';

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'mdx' | 'md' | 'json' | 'js' | 'py' | 'zip';
  absolutePath?: string;
  binaryContent?: Buffer;
}

export interface Adapter {
  adapt(model: DocModel): GeneratedFile[];
}
