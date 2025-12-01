import { Operation as BaseOperation, TypeDefinition } from '../parser/types';
import { ExampleFile, ErrorFile, Example, ErrorDefinition } from '../metadata/types';
import { DocModel, Section, Operation, ExpandedArgument } from './types';
import { TypeExpander } from './type-expander';

export interface TransformerConfig {
  maxDepth?: number;
  defaultLevels?: number;
  showCircularReferences?: boolean;
}

export class Transformer {
  private expander: TypeExpander;

  constructor(types: TypeDefinition[], config: TransformerConfig = {}) {
    this.expander = new TypeExpander(
      types,
      config.maxDepth ?? 5,
      config.defaultLevels ?? 2,
      config.showCircularReferences ?? true
    );
  }

  transform(
    baseOperations: BaseOperation[],
    exampleFiles: ExampleFile[],
    errorFiles: ErrorFile[]
  ): DocModel {
    // 1. Merge metadata
    const operationsWithMetadata = this.mergeMetadata(baseOperations, exampleFiles, errorFiles);

    // 2. Expand types
    const expandedOperations = operationsWithMetadata.map((op) => this.expandOperation(op));

    // 3. Group and Sort
    return this.groupAndSort(expandedOperations);
  }

  private mergeMetadata(
    baseOperations: BaseOperation[],
    exampleFiles: ExampleFile[],
    errorFiles: ErrorFile[]
  ): (BaseOperation & { examples: Example[]; errors: ErrorDefinition[] })[] {
    // Index examples by operation name
    const examplesByOperation = new Map<string, Example[]>();
    for (const file of exampleFiles) {
      const existing = examplesByOperation.get(file.operation) || [];
      examplesByOperation.set(file.operation, [...existing, ...file.examples]);
    }

    // Index errors by operation name
    const errorsByOperation = new Map<string, ErrorDefinition[]>();
    const globalErrors: ErrorDefinition[] = [];

    for (const file of errorFiles) {
      if (file.operations.includes('*')) {
        globalErrors.push(...file.errors);
      }

      for (const opName of file.operations) {
        if (opName === '*') continue;
        const existing = errorsByOperation.get(opName) || [];
        errorsByOperation.set(opName, [...existing, ...file.errors]);
      }
    }

    return baseOperations.map((baseOp) => {
      const examples = examplesByOperation.get(baseOp.name) || [];
      const specificErrors = errorsByOperation.get(baseOp.name) || [];
      const errors = [...globalErrors, ...specificErrors];

      return {
        ...baseOp,
        examples,
        errors,
      };
    });
  }

  private expandOperation(
    op: BaseOperation & { examples: Example[]; errors: ErrorDefinition[] }
  ): Operation {
    const args: ExpandedArgument[] = op.arguments.map((arg) => ({
      name: arg.name,
      description: arg.description,
      isRequired: arg.isRequired,
      defaultValue: arg.defaultValue,
      type: this.expander.expand(arg.type),
    }));

    const returnType = this.expander.expand(op.returnType);

    // We need to cast the rest of the properties because BaseOperation has string types
    // and Operation has ExpandedTypes, but we are constructing a new object.
    // However, TypeScript might complain about missing properties if we just spread ...op
    // because op has arguments: Argument[] and returnType: string.
    // We are overriding them, so it should be fine.

    return {
      ...op,
      arguments: args,
      returnType,
    };
  }

  private groupAndSort(operations: Operation[]): DocModel {
    const sectionsMap = new Map<string, Section>();

    for (const op of operations) {
      const groupName = op.directives.docGroup?.name || 'Uncategorized';
      const groupOrder = op.directives.docGroup?.order; // undefined if not specified
      const subsectionName = op.directives.docGroup?.subsection;

      let section = sectionsMap.get(groupName);
      if (!section) {
        section = {
          name: groupName,
          order: groupOrder,
          subsections: [],
        };
        sectionsMap.set(groupName, section);
      }

      // Handle subsections
      const targetSubsectionName = subsectionName || '';
      let subsection = section.subsections.find((s) => s.name === targetSubsectionName);

      if (!subsection) {
        subsection = { name: targetSubsectionName, operations: [] };
        section.subsections.push(subsection);
      }
      subsection.operations.push(op);
    }

    // Sort sections: ordered first (by number), then unordered (alphabetically)
    const sections = Array.from(sectionsMap.values()).sort((a, b) => {
      const aHasOrder = a.order !== undefined;
      const bHasOrder = b.order !== undefined;

      // Both have explicit order: sort numerically
      if (aHasOrder && bHasOrder) {
        // @ts-expect-error order is a number because of our check above
        return a.order - b.order;
      }

      // Only one has order: ordered items come first
      if (aHasOrder && !bHasOrder) return -1;
      if (!aHasOrder && bHasOrder) return 1;

      // Neither has order: sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    // Sort subsections and operations
    for (const section of sections) {
      // Sort subsections: empty (root) first, then alphabetical
      section.subsections.sort((a, b) => {
        if (a.name === '') return -1;
        if (b.name === '') return 1;
        return a.name.localeCompare(b.name);
      });

      for (const subsection of section.subsections) {
        subsection.operations.sort((a, b) => {
          const priorityA = a.directives.docPriority?.level ?? 999;
          const priorityB = b.directives.docPriority?.level ?? 999;
          return priorityA - priorityB;
        });
      }
    }

    return { sections };
  }
}
