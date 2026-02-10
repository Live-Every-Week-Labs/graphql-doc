import { Operation as BaseOperation, TypeDefinition } from '../parser/types.js';
import { ExampleFile, Example } from '../metadata/types.js';
import { DocModel, Section, Operation, ExpandedArgument } from './types.js';
import { TypeExpander } from './type-expander.js';
import { mergeMetadata } from './metadata-merger.js';
import { DEFAULT_SORT_PRIORITY, DEFAULT_GROUP_NAME } from '../utils/index.js';

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
    this.expander = new TypeExpander(types, config.showCircularReferences ?? true);
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
        typeString: arg.type,
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
      returnTypeString: op.returnType,
    };
  }

  private groupAndSort(operations: Operation[]): DocModel {
    const sectionsMap = new Map<string, Section>();

    for (const op of operations) {
      if (op.directives.docIgnore) {
        continue;
      }
      const groupName = op.directives.docGroup?.name || DEFAULT_GROUP_NAME;
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
      // Both have explicit order: sort numerically
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }

      // Only one has order: ordered items come first
      if (a.order !== undefined && b.order === undefined) return -1;
      if (a.order === undefined && b.order !== undefined) return 1;

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
          const priorityA = a.directives.docPriority?.level ?? DEFAULT_SORT_PRIORITY;
          const priorityB = b.directives.docPriority?.level ?? DEFAULT_SORT_PRIORITY;
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
