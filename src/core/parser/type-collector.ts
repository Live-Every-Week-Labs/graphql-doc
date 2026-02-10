import {
  GraphQLType,
  isScalarType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  getNamedType,
  GraphQLNamedType,
  GraphQLField,
  GraphQLInputField,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLInterfaceType,
  GraphQLEnumValue,
} from 'graphql';
import { TypeDefinition, TypeField } from './types.js';
import { DirectiveExtractor, DirectiveWarning } from './directive-extractor.js';

export class TypeCollector {
  private collectedTypes: Map<string, TypeDefinition> = new Map();
  private directiveExtractor: DirectiveExtractor;

  constructor(reportWarning?: (warning: DirectiveWarning) => void) {
    this.directiveExtractor = new DirectiveExtractor(reportWarning);
  }

  collect(type: GraphQLType): string {
    const namedType = getNamedType(type);
    const typeName = namedType.name;

    if (this.collectedTypes.has(typeName)) {
      return typeName;
    }

    // Don't collect internal GraphQL types
    if (typeName.startsWith('__')) {
      return typeName;
    }

    if (isScalarType(namedType)) {
      this.collectScalar(namedType);
    } else if (isObjectType(namedType)) {
      this.collectObject(namedType);
    } else if (isInterfaceType(namedType)) {
      this.collectInterface(namedType);
    } else if (isUnionType(namedType)) {
      this.collectUnion(namedType);
    } else if (isEnumType(namedType)) {
      this.collectEnum(namedType);
    } else if (isInputObjectType(namedType)) {
      this.collectInputObject(namedType);
    }

    return typeName;
  }

  getTypes(): TypeDefinition[] {
    return Array.from(this.collectedTypes.values());
  }

  private collectScalar(type: GraphQLNamedType) {
    this.collectedTypes.set(type.name, {
      name: type.name,
      kind: 'SCALAR',
      description: type.description || undefined,
      directives: type.astNode ? this.directiveExtractor.extract(type.astNode) : undefined,
    });
  }

  private collectObject(type: GraphQLObjectType) {
    // Initialize first to prevent infinite recursion
    this.collectedTypes.set(type.name, {
      name: type.name,
      kind: 'OBJECT',
      description: type.description || undefined,
      fields: [],
      interfaces: [],
    });

    const fields = type.getFields();
    const collectedFields: TypeField[] = [];

    for (const field of Object.values(fields) as GraphQLField<unknown, unknown>[]) {
      this.collect(field.type);
      collectedFields.push({
        name: field.name,
        description: field.description || undefined,
        type: field.type.toString(),
        isRequired: isNonNullType(field.type),
        isList:
          isListType(field.type) || (isNonNullType(field.type) && isListType(field.type.ofType)),
        directives: this.directiveExtractor.extract(field.astNode!),
        isDeprecated: field.deprecationReason != null,
        deprecationReason: field.deprecationReason || undefined,
      });
    }

    const interfaces = type.getInterfaces();
    const interfaceNames: string[] = [];
    for (const iface of interfaces) {
      this.collect(iface);
      interfaceNames.push(iface.name);
    }

    // Update with full data
    const definition = this.collectedTypes.get(type.name)!;
    definition.fields = collectedFields;
    definition.interfaces = interfaceNames;
    definition.directives = this.directiveExtractor.extract(type.astNode!);
  }

  private collectInterface(type: GraphQLInterfaceType) {
    this.collectedTypes.set(type.name, {
      name: type.name,
      kind: 'INTERFACE',
      description: type.description || undefined,
      fields: [],
    });

    const fields = type.getFields();
    const collectedFields: TypeField[] = [];

    for (const field of Object.values(fields) as GraphQLField<unknown, unknown>[]) {
      this.collect(field.type);
      collectedFields.push({
        name: field.name,
        description: field.description || undefined,
        type: field.type.toString(),
        isRequired: isNonNullType(field.type),
        isList:
          isListType(field.type) || (isNonNullType(field.type) && isListType(field.type.ofType)),
        directives: this.directiveExtractor.extract(field.astNode!),
        isDeprecated: field.deprecationReason != null,
        deprecationReason: field.deprecationReason || undefined,
      });
    }

    const definition = this.collectedTypes.get(type.name)!;
    definition.fields = collectedFields;
    definition.directives = this.directiveExtractor.extract(type.astNode!);
  }

  private collectUnion(type: GraphQLUnionType) {
    this.collectedTypes.set(type.name, {
      name: type.name,
      kind: 'UNION',
      description: type.description || undefined,
      possibleTypes: [],
      directives: type.astNode ? this.directiveExtractor.extract(type.astNode) : undefined,
    });

    const types = type.getTypes();
    const typeNames: string[] = [];

    for (const t of types) {
      this.collect(t);
      typeNames.push(t.name);
    }

    const definition = this.collectedTypes.get(type.name)!;
    definition.possibleTypes = typeNames;
  }

  private collectEnum(type: GraphQLEnumType) {
    this.collectedTypes.set(type.name, {
      name: type.name,
      kind: 'ENUM',
      description: type.description || undefined,
      enumValues: type.getValues().map((v: GraphQLEnumValue) => ({
        name: v.name,
        description: v.description || undefined,
        isDeprecated: v.deprecationReason != null,
        deprecationReason: v.deprecationReason || undefined,
        directives: this.directiveExtractor.extract(v.astNode!),
      })),
      directives: this.directiveExtractor.extract(type.astNode!),
    });
  }

  private collectInputObject(type: GraphQLInputObjectType) {
    this.collectedTypes.set(type.name, {
      name: type.name,
      kind: 'INPUT_OBJECT',
      description: type.description || undefined,
      fields: [],
    });

    const fields = type.getFields();
    const collectedFields: TypeField[] = [];

    for (const field of Object.values(fields) as GraphQLInputField[]) {
      this.collect(field.type);
      collectedFields.push({
        name: field.name,
        description: field.description || undefined,
        type: field.type.toString(),
        isRequired: isNonNullType(field.type),
        isList:
          isListType(field.type) || (isNonNullType(field.type) && isListType(field.type.ofType)),
        directives: this.directiveExtractor.extract(field.astNode!),
        isDeprecated: field.deprecationReason != null,
        deprecationReason: field.deprecationReason || undefined,
      });
    }

    const definition = this.collectedTypes.get(type.name)!;
    definition.fields = collectedFields;
    definition.directives = this.directiveExtractor.extract(type.astNode!);
  }
}
