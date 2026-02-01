import { GraphQLType } from 'graphql';

export interface DocGroup {
  name: string;
  order?: number;
  subsection?: string;
}

export interface DocPriority {
  level: number;
}

export interface DocTags {
  tags: string[];
}

export interface OperationDirectives {
  docGroup?: DocGroup;
  docPriority?: DocPriority;
  docTags?: DocTags;
  docIgnore?: boolean;
}

export interface Argument {
  name: string;
  description?: string;
  type: string;
  isRequired: boolean;
  defaultValue?: any;
  directives?: OperationDirectives;
}

export interface Operation {
  name: string;
  operationType: 'query' | 'mutation' | 'subscription';
  description?: string;
  arguments: Argument[];
  returnType: string;
  directives: OperationDirectives;
  referencedTypes: string[]; // Names of types referenced by this operation
  isDeprecated: boolean;
  deprecationReason?: string;
}

export type TypeKind = 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT';

export interface TypeField {
  name: string;
  description?: string;
  type: string;
  isRequired: boolean;
  isList: boolean;
  directives?: OperationDirectives;
  isDeprecated: boolean;
  deprecationReason?: string;
}

export interface EnumValue {
  name: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
  directives?: OperationDirectives;
}

export interface TypeDefinition {
  name: string;
  kind: TypeKind;
  description?: string;
  fields?: TypeField[]; // For OBJECT, INTERFACE, INPUT_OBJECT
  enumValues?: EnumValue[]; // For ENUM
  possibleTypes?: string[]; // For UNION
  interfaces?: string[]; // For OBJECT
  directives?: OperationDirectives;
}
