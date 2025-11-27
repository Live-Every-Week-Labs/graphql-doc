import {
  Operation as BaseOperation,
  Argument as BaseArgument,
  OperationDirectives,
} from '../parser/types';
import { Example, ErrorDefinition } from '../metadata/types';

export type ExpandedTypeKind =
  | 'SCALAR'
  | 'OBJECT'
  | 'INTERFACE'
  | 'UNION'
  | 'ENUM'
  | 'LIST'
  | 'CIRCULAR_REF';

export interface CircularRef {
  kind: 'CIRCULAR_REF';
  ref: string; // Name of the referenced type
  link: string; // Anchor link to the first occurrence
}

export interface ExpandedScalar {
  kind: 'SCALAR';
  name: string;
  description?: string;
}

export interface ExpandedEnum {
  kind: 'ENUM';
  name: string;
  description?: string;
  values: {
    name: string;
    description?: string;
    isDeprecated: boolean;
    deprecationReason?: string;
  }[];
}

export interface ExpandedObject {
  kind: 'OBJECT' | 'INTERFACE' | 'INPUT_OBJECT';
  name: string;
  description?: string;
  fields: ExpandedField[];
  interfaces?: string[];
  isCollapsible?: boolean; // True if this type is deeper than the default expansion limit
}

export interface ExpandedUnion {
  kind: 'UNION';
  name: string;
  description?: string;
  possibleTypes: ExpandedType[];
}

export interface ExpandedList {
  kind: 'LIST';
  ofType: ExpandedType;
}

export type ExpandedType =
  | ExpandedScalar
  | ExpandedObject
  | ExpandedEnum
  | ExpandedUnion
  | ExpandedList
  | CircularRef;

export interface ExpandedField {
  name: string;
  description?: string;
  type: ExpandedType;
  isRequired: boolean;
  isList: boolean;
  isDeprecated: boolean;
  deprecationReason?: string;
  args?: ExpandedArgument[];
}

export interface ExpandedArgument extends Omit<BaseArgument, 'type'> {
  type: ExpandedType;
}

export interface Operation extends Omit<BaseOperation, 'arguments' | 'returnType'> {
  arguments: ExpandedArgument[];
  returnType: ExpandedType;
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
