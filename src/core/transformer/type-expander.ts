import { TypeDefinition } from '../parser/types';
import { ExpandedType } from './types';
import { slugify } from '../utils/string-utils';

export class TypeExpander {
  private typeMap: Map<string, TypeDefinition>;
  private showCircularReferences: boolean;

  constructor(
    types: TypeDefinition[],
    _maxDepth: number = 5,
    _defaultLevels: number = 2,
    showCircularReferences: boolean = true
  ) {
    this.typeMap = new Map(types.map((t) => [t.name, t]));
    this.showCircularReferences = showCircularReferences;
  }

  expand(typeString: string, visited: Set<string> = new Set()): ExpandedType {
    return this.expandTypeReference(typeString, visited);
  }

  expandDefinition(typeName: string): ExpandedType {
    const typeDef = this.typeMap.get(typeName);

    if (!typeDef) {
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
      return {
        kind: 'UNION',
        name: typeDef.name,
        description: typeDef.description,
        possibleTypes: filteredPossibleTypes.map((pt) =>
          this.expandTypeReference(pt, new Set([typeName]))
        ),
      };
    }

    if (
      typeDef.kind === 'OBJECT' ||
      typeDef.kind === 'INTERFACE' ||
      typeDef.kind === 'INPUT_OBJECT'
    ) {
      const visited = new Set<string>();
      visited.add(typeName);

      const fields =
        typeDef.fields
          ?.filter((f) => !f.directives?.docIgnore)
          .map((f) => ({
            name: f.name,
            description: f.description,
            type: this.expandTypeReference(f.type, visited),
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
        isCollapsible: false,
      };
    }

    return {
      kind: 'SCALAR',
      name: typeDef.name,
    };
  }

  private expandTypeReference(typeString: string, visited: Set<string>): ExpandedType {
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
        ofType: this.expandTypeReference(inner, visited),
      };
    }

    // Now we have the named type
    return this.expandNamedTypeReference(current, visited);
  }

  private expandNamedTypeReference(typeName: string, visited: Set<string>): ExpandedType {
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

    return {
      kind: 'TYPE_REF',
      name: typeDef.name,
      link: `#${slugify(typeDef.name)}`,
    };
  }
}
