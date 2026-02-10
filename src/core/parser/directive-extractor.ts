import { FieldDefinitionNode, DirectiveNode, valueFromASTUntyped, ASTNode } from 'graphql';
import { OperationDirectives, DocGroup, DocPriority, DocTags } from './types.js';
import {
  DocGroupSchema,
  DocPrioritySchema,
  DocTagsSchema,
  DocIgnoreSchema,
} from './directive-schemas.js';

export interface DirectiveWarning {
  directive: 'docGroup' | 'docPriority' | 'docTags' | 'docIgnore';
  message: string;
}

type WarningReporter = (warning: DirectiveWarning) => void;

export class DirectiveExtractor {
  constructor(private reportWarning?: WarningReporter) {}

  extract(node: FieldDefinitionNode | ASTNode): OperationDirectives {
    const directives: OperationDirectives = {};

    if (!('directives' in node) || !node.directives) {
      return directives;
    }

    for (const directive of node.directives) {
      const name = directive.name.value;
      const args = this.getDirectiveArgs(directive);

      switch (name) {
        case 'docGroup': {
          const result = DocGroupSchema.safeParse(args);
          if (result.success) {
            const docGroup = result.data as DocGroup;
            if (!docGroup.displayLabel && docGroup.sidebarTitle) {
              docGroup.displayLabel = docGroup.sidebarTitle;
            }
            directives.docGroup = docGroup;
          } else {
            this.reportWarning?.({ directive: 'docGroup', message: result.error.message });
          }
          break;
        }
        case 'docPriority': {
          const result = DocPrioritySchema.safeParse(args);
          if (result.success) {
            directives.docPriority = result.data as DocPriority;
          } else {
            this.reportWarning?.({ directive: 'docPriority', message: result.error.message });
          }
          break;
        }
        case 'docTags': {
          const result = DocTagsSchema.safeParse(args);
          if (result.success) {
            directives.docTags = result.data as DocTags;
          } else {
            this.reportWarning?.({ directive: 'docTags', message: result.error.message });
          }
          break;
        }
        case 'docIgnore': {
          const result = DocIgnoreSchema.safeParse(args);
          if (result.success) {
            directives.docIgnore = true;
          } else {
            this.reportWarning?.({ directive: 'docIgnore', message: result.error.message });
          }
          break;
        }
      }
    }

    return directives;
  }

  private getDirectiveArgs(directive: DirectiveNode): Record<string, unknown> {
    const args: Record<string, unknown> = {};

    if (directive.arguments) {
      for (const arg of directive.arguments) {
        // We use valueFromASTUntyped to get the JS value from the AST value
        // This works for simple types like String, Int, Boolean, List, Object
        args[arg.name.value] = valueFromASTUntyped(arg.value);
      }
    }

    return args;
  }
}
