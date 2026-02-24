import { TypeDefinition } from '../parser/types.js';
import { ExpandedType } from './types.js';
import { slugify } from '../utils/string-utils.js';

export class TypeExpander {
  private typeMap: Map<string, TypeDefinition>;
  private showCircularReferences: boolean;
  private maxDepth: number;
  private defaultLevels: number;

  constructor(
    types: TypeDefinition[],
    showCircularReferences: boolean = true,
    maxDepth: number = 5,
    defaultLevels: number = 0
  ) {
    this.typeMap = new Map(types.map((t) => [t.name, t]));
    this.showCircularReferences = showCircularReferences;
    this.maxDepth = maxDepth;
    this.defaultLevels = defaultLevels;
  }

  expand(typeString: string, visited: Set<string> = new Set()): ExpandedType {
    // Operation argument/return type rendering uses reference-style output by default.
    return this.expandTypeReference(typeString, visited, 0, false);
  }

  expandDefinition(typeName: string): ExpandedType {
    const typeDef = this.typeMap.get(typeName);

    if (!typeDef) {
      return {
        kind: 'SCALAR',
        name: typeName,
      };
    }

    return this.expandTypeDefinition(typeDef, new Set(), 0);
  }

  private expandTypeDefinition(
    typeDef: TypeDefinition,
    visited: Set<string>,
    depth: number
  ): ExpandedType {
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
          typeDef.enumValues
            ?.filter((v) => !v.directives?.docIgnore)
            .map((v) => ({
              name: v.name,
              description: v.description,
              isDeprecated: v.isDeprecated,
              deprecationReason: v.deprecationReason,
            })) || [],
      };
    }

    if (typeDef.kind === 'UNION') {
      const filteredPossibleTypes =
        typeDef.possibleTypes?.filter((pt) => !this.typeMap.get(pt)?.directives?.docIgnore) || [];
      const nextVisited = new Set(visited);
      nextVisited.add(typeDef.name);

      return {
        kind: 'UNION',
        name: typeDef.name,
        description: typeDef.description,
        possibleTypes: filteredPossibleTypes.map((pt) =>
          this.expandTypeReference(pt, new Set(nextVisited), depth + 1, true)
        ),
      };
    }

    if (
      typeDef.kind === 'OBJECT' ||
      typeDef.kind === 'INTERFACE' ||
      typeDef.kind === 'INPUT_OBJECT'
    ) {
      const nextVisited = new Set(visited);
      nextVisited.add(typeDef.name);

      const fields =
        typeDef.fields
          ?.filter((f) => !f.directives?.docIgnore)
          .map((f) => ({
            name: f.name,
            description: f.description,
            type: this.expandTypeReference(f.type, new Set(nextVisited), depth + 1, true),
            typeString: f.type,
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
        isCollapsible: depth > this.defaultLevels,
      };
    }

    return {
      kind: 'SCALAR',
      name: typeDef.name,
    };
  }

  private expandTypeReference(
    typeString: string,
    visited: Set<string>,
    depth: number,
    inline: boolean
  ): ExpandedType {
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
        ofType: this.expandTypeReference(inner, visited, depth, inline),
      };
    }

    // Now we have the named type
    return this.expandNamedTypeReference(current, visited, depth, inline);
  }

  private expandNamedTypeReference(
    typeName: string,
    visited: Set<string>,
    depth: number,
    inline: boolean
  ): ExpandedType {
    if (visited.has(typeName)) {
      if (this.showCircularReferences) {
        return {
          kind: 'CIRCULAR_REF',
          ref: typeName,
          link: `#${slugify(typeName)}`,
        };
      }
      return {
        kind: 'TYPE_REF',
        name: typeName,
        link: `#${slugify(typeName)}`,
      };
    }

    const typeDef = this.typeMap.get(typeName);
    if (!typeDef) {
      return {
        kind: 'SCALAR',
        name: typeName,
      };
    }
    if (typeDef.directives?.docIgnore) {
      return {
        kind: 'SCALAR',
        name: typeName,
      };
    }

    if (typeDef.kind === 'SCALAR') {
      return {
        kind: 'TYPE_REF',
        name: typeDef.name,
        link: `#${slugify(typeDef.name)}`,
      };
    }

    if (!inline || depth >= this.maxDepth) {
      return {
        kind: 'TYPE_REF',
        name: typeDef.name,
        link: `#${slugify(typeDef.name)}`,
      };
    }

    return this.expandTypeDefinition(typeDef, visited, depth);
  }
}
