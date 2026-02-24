import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLField,
  GraphQLArgument,
  isNonNullType,
} from 'graphql';
import { DirectiveExtractor, DirectiveWarning } from './directive-extractor.js';
import { TypeCollector } from './type-collector.js';
import { Operation, Argument, TypeDefinition } from './types.js';

export interface ParserWarning {
  code: 'INVALID_DIRECTIVE_USAGE';
  directive: DirectiveWarning['directive'];
  message: string;
}

export class SchemaParser {
  private directiveExtractor: DirectiveExtractor;
  private typeCollector: TypeCollector;
  private warnings: ParserWarning[] = [];

  constructor() {
    this.directiveExtractor = new DirectiveExtractor(this.handleDirectiveWarning);
    this.typeCollector = new TypeCollector(this.handleDirectiveWarning);
  }

  parse(schema: GraphQLSchema): {
    operations: Operation[];
    types: TypeDefinition[];
    warnings: ParserWarning[];
  } {
    // Reset parser state for each parse call.
    this.warnings = [];
    this.directiveExtractor = new DirectiveExtractor(this.handleDirectiveWarning);
    this.typeCollector = new TypeCollector(this.handleDirectiveWarning);

    const operations: Operation[] = [];

    const queryType = schema.getQueryType();
    if (queryType) {
      operations.push(...this.extractOperations(queryType, 'query'));
    }

    const mutationType = schema.getMutationType();
    if (mutationType) {
      operations.push(...this.extractOperations(mutationType, 'mutation'));
    }

    const subscriptionType = schema.getSubscriptionType();
    if (subscriptionType) {
      operations.push(...this.extractOperations(subscriptionType, 'subscription'));
    }

    return {
      operations,
      types: this.typeCollector.getTypes(),
      warnings: this.warnings,
    };
  }

  private handleDirectiveWarning = (warning: DirectiveWarning) => {
    this.warnings.push({
      code: 'INVALID_DIRECTIVE_USAGE',
      directive: warning.directive,
      message: `Invalid @${warning.directive} usage: ${warning.message}`,
    });
  };

  private extractOperations(
    type: GraphQLObjectType,
    operationType: 'query' | 'mutation' | 'subscription'
  ): Operation[] {
    const operations: Operation[] = [];
    const fields = type.getFields();

    for (const [fieldName, field] of Object.entries(fields)) {
      operations.push(this.createOperation(fieldName, field, operationType));
    }

    return operations;
  }

  private createOperation(
    name: string,
    field: GraphQLField<unknown, unknown>,
    operationType: 'query' | 'mutation' | 'subscription'
  ): Operation {
    const directives = field.astNode ? this.directiveExtractor.extract(field.astNode) : undefined;
    const referencedTypes: string[] = [];

    // Collect return type
    referencedTypes.push(this.typeCollector.collect(field.type));

    // Collect argument types
    for (const arg of field.args) {
      referencedTypes.push(this.typeCollector.collect(arg.type));
    }

    return {
      name,
      operationType,
      description: field.description || undefined,
      arguments: field.args.map((arg) => this.createArgument(arg)),
      returnType: field.type.toString(),
      directives: directives ?? {},
      referencedTypes: [...new Set(referencedTypes)], // Deduplicate
      isDeprecated: field.deprecationReason != null,
      deprecationReason: field.deprecationReason || undefined,
    };
  }

  private createArgument(arg: GraphQLArgument): Argument {
    return {
      name: arg.name,
      description: arg.description || undefined,
      type: arg.type.toString(),
      isRequired: isNonNullType(arg.type),
      defaultValue: arg.defaultValue,
      directives: arg.astNode ? this.directiveExtractor.extract(arg.astNode) : undefined,
    };
  }
}
