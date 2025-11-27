import { Operation as BaseOperation } from '../parser/types';
import { Example, ErrorDefinition } from '../metadata/types';

export interface Operation extends BaseOperation {
  examples: Example[];
  errors: ErrorDefinition[];
}

export interface Subsection {
  name: string;
  operations: Operation[];
}

export interface Section {
  name: string;
  order: number;
  subsections: Subsection[];
}

export interface DocModel {
  sections: Section[];
}
