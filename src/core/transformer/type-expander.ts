import { TypeDefinition } from '../parser/types';
import {
  ExpandedType,
  ExpandedObject,
  ExpandedScalar,
  ExpandedEnum,
  ExpandedUnion,
  ExpandedList,
  CircularRef,
  TypeRef,
} from './types';

export class TypeExpander {
  private typeMap: Map<string, TypeDefinition>;
  private maxDepth: number;
  private defaultLevels: number;
  private showCircularReferences: boolean;

  constructor(
    types: TypeDefinition[],
    maxDepth: number = 5,
    defaultLevels: number = 2,
    showCircularReferences: boolean = true
  ) {
    this.typeMap = new Map(types.map((t) => [t.name, t]));
    this.maxDepth = maxDepth;
    this.defaultLevels = defaultLevels;
    this.showCircularReferences = showCircularReferences;
  }

  expand(
    typeString: string,
    currentDepth: number = 0,
    visited: Set<string> = new Set()
  ): ExpandedType {
    return this.expandTypeString(typeString, currentDepth, visited);
  }

  private expandTypeString(typeString: string, depth: number, visited: Set<string>): ExpandedType {
    let current = typeString;
    // Remove outer non-null
    if (current.endsWith('!')) {
      current = current.slice(0, -1);
    }

    // Check for list
    if (current.startsWith('[') && current.endsWith(']')) {
      const inner = current.slice(1, -1);
      return {
        kind: 'LIST',
        ofType: this.expandTypeString(inner, depth, visited),
      };
    }

    // Now we have the named type
    return this.expandNamedType(current, depth, visited);
  }

  private expandNamedType(typeName: string, depth: number, visited: Set<string>): ExpandedType {
    // Check for circular reference
    if (visited.has(typeName)) {
      if (this.showCircularReferences) {
        return {
          kind: 'CIRCULAR_REF',
          ref: typeName,
          link: `#${typeName.toLowerCase()}`,
        };
      } else {
        return {
          kind: 'TYPE_REF',
          name: typeName,
          link: `#${typeName.toLowerCase()}`,
        };
      }
    }

    const typeDef = this.typeMap.get(typeName);
    if (!typeDef) {
      // Fallback for unknown types (e.g. standard scalars not in map)
      return {
        kind: 'SCALAR',
        name: typeName,
      };
    }

    if (typeDef.kind === 'SCALAR') {
      return {
        kind: 'SCALAR',
        name: typeDef.name,
        description: typeDef.description,
      };
    }

    if (typeDef.kind === 'ENUM') {
      return {
        kind: 'ENUM',
        name: typeDef.name,
        description: typeDef.description,
        values:
          typeDef.enumValues?.map((v) => ({
            name: v.name,
            description: v.description,
            isDeprecated: v.isDeprecated,
            deprecationReason: v.deprecationReason,
          })) || [],
      };
    }

    if (typeDef.kind === 'UNION') {
      return {
        kind: 'UNION',
        name: typeDef.name,
        description: typeDef.description,
        possibleTypes:
          typeDef.possibleTypes?.map((pt) => this.expandNamedType(pt, depth, visited)) || [],
      };
    }

    if (
      typeDef.kind === 'OBJECT' ||
      typeDef.kind === 'INTERFACE' ||
      typeDef.kind === 'INPUT_OBJECT'
    ) {
      // Check depth limit
      if (depth >= this.maxDepth) {
        return {
          kind: typeDef.kind,
          name: typeDef.name,
          description: typeDef.description,
          fields: [],
          interfaces: typeDef.interfaces,
          isCollapsible: true,
        };
      }

      const newVisited = new Set(visited);
      newVisited.add(typeName);

      const fields =
        typeDef.fields?.map((f) => ({
          name: f.name,
          description: f.description,
          type: this.expandTypeString(f.type, depth + 1, newVisited),
          isRequired: f.isRequired,
          isList: f.isList,
          isDeprecated: f.isDeprecated,
          deprecationReason: f.deprecationReason,
        })) || [];

      return {
        kind: typeDef.kind,
        name: typeDef.name,
        description: typeDef.description,
        fields,
        interfaces: typeDef.interfaces,
        isCollapsible: depth >= this.defaultLevels,
      };
    }

    // Fallback
    return {
      kind: 'SCALAR',
      name: typeName,
    };
  }
}
