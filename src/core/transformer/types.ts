import { Operation as BaseOperation, Argument as BaseArgument } from '../parser/types.js';
import { Example } from '../metadata/types.js';

export type ExpandedTypeKind =
  | 'SCALAR'
  | 'OBJECT'
  | 'INTERFACE'
  | 'UNION'
  | 'ENUM'
  | 'LIST'
  | 'CIRCULAR_REF'
  | 'TYPE_REF';

export interface CircularRef {
  kind: 'CIRCULAR_REF';
  ref: string; // Name of the referenced type
  /**
   * Link target produced by the active adapter.
   * By default this is an anchor-like fragment (for example, `#user`).
   */
  link: string;
}

export interface TypeRef {
  kind: 'TYPE_REF';
  name: string;
  /**
   * Link target produced by the active adapter.
   * By default this is an anchor-like fragment (for example, `#user`).
   */
  link: string;
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
  | CircularRef
  | TypeRef;

export interface ExpandedField {
  name: string;
  description?: string;
  type: ExpandedType;
  typeString?: string;
  isRequired: boolean;
  isList: boolean;
  isDeprecated: boolean;
  deprecationReason?: string;
  args?: ExpandedArgument[];
}

export interface ExpandedArgument extends Omit<BaseArgument, 'type'> {
  type: ExpandedType;
  typeString?: string;
}

export interface Operation extends Omit<BaseOperation, 'arguments' | 'returnType'> {
  arguments: ExpandedArgument[];
  returnType: ExpandedType;
  returnTypeString?: string;
  examples: Example[];
}

export interface Subsection {
  name: string;
  operations: Operation[];
}

export interface Section {
  name: string;
  order: number | undefined; // undefined means no explicit order; items without order are sorted alphabetically after ordered items
  subsections: Subsection[];
}

export interface DocModel {
  sections: Section[];
  types: ExpandedType[];
}
