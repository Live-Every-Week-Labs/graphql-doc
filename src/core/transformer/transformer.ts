import { Operation as BaseOperation, TypeDefinition } from '../parser/types';
import { ExampleFile, Example } from '../metadata/types';
import { DocModel, Section, Operation, ExpandedArgument } from './types';
import { TypeExpander } from './type-expander';
import { mergeMetadata } from './metadata-merger';

export interface TransformerConfig {
  maxDepth?: number;
  defaultLevels?: number;
  showCircularReferences?: boolean;
  excludeDocGroups?: string[];
}

export class Transformer {
  private expander: TypeExpander;
  private typeDefinitions: TypeDefinition[];
  private excludedDocGroups: Set<string>;

  constructor(types: TypeDefinition[], config: TransformerConfig = {}) {
    this.typeDefinitions = types;
    this.expander = new TypeExpander(
      types,
      config.maxDepth ?? 5,
      config.defaultLevels ?? 3,
      config.showCircularReferences ?? true
    );
    this.excludedDocGroups = new Set(config.excludeDocGroups ?? []);
  }

  transform(baseOperations: BaseOperation[], exampleFiles: ExampleFile[]): DocModel {
    // 1. Merge metadata
    const operationsWithMetadata = mergeMetadata(baseOperations, exampleFiles);

    // 2. Expand types
    const expandedOperations = operationsWithMetadata.map((op) => this.expandOperation(op));

    // 3. Group and Sort
    return this.groupAndSort(expandedOperations);
  }

  private expandOperation(op: BaseOperation & { examples: Example[] }): Operation {
    const args: ExpandedArgument[] = op.arguments
      .filter((arg) => !arg.directives?.docIgnore)
      .map((arg) => ({
        name: arg.name,
        description: arg.description,
        isRequired: arg.isRequired,
        defaultValue: arg.defaultValue,
        type: this.expander.expand(arg.type),
        directives: arg.directives,
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
      if (op.directives.docIgnore) {
        continue;
      }
      const groupName = op.directives.docGroup?.name || 'Uncategorized';
      if (this.excludedDocGroups.has(groupName)) {
        continue;
      }
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

    return { sections, types: this.expandTypes() };
  }

  private expandTypes() {
    return this.typeDefinitions
      .filter((type) => !type.name.startsWith('__'))
      .filter((type) => !type.directives?.docIgnore)
      .map((type) => this.expander.expandDefinition(type.name))
      .sort((a, b) => {
        const nameA = 'name' in a ? a.name : '';
        const nameB = 'name' in b ? b.name : '';
        return nameA.localeCompare(nameB);
      });
  }
}
