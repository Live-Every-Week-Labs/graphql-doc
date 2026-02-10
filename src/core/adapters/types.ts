import type { DocModel } from '../transformer/types.js';
import type { SerializedDocData } from '../serialization/doc-data.js';

export type { GeneratedFile } from '../types.js';
import type { GeneratedFile } from '../types.js';

export interface Adapter {
  adapt(model: DocModel, serializedData?: SerializedDocData): GeneratedFile[];
}
