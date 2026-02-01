import { FieldDefinitionNode, DirectiveNode, valueFromASTUntyped, ASTNode } from 'graphql';
import { z } from 'zod';
import { OperationDirectives, DocGroup, DocPriority, DocTags } from './types.js';

// Define Zod schemas
const DocGroupSchema = z.object({
  name: z.string(),
  order: z.number().optional(),
  subsection: z.string().optional(),
});

const DocPrioritySchema = z.object({
  level: z.number(),
});

const DocTagsSchema = z.object({
  tags: z.array(z.string()),
});
const DocIgnoreSchema = z.object({}).strict();

export class DirectiveExtractor {
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
            directives.docGroup = result.data as DocGroup;
          } else {
            console.warn(`Invalid @docGroup usage: ${result.error.message}`);
          }
          break;
        }
        case 'docPriority': {
          const result = DocPrioritySchema.safeParse(args);
          if (result.success) {
            directives.docPriority = result.data as DocPriority;
          } else {
            console.warn(`Invalid @docPriority usage: ${result.error.message}`);
          }
          break;
        }
        case 'docTags': {
          const result = DocTagsSchema.safeParse(args);
          if (result.success) {
            directives.docTags = result.data as DocTags;
          } else {
            console.warn(`Invalid @docTags usage: ${result.error.message}`);
          }
          break;
        }
        case 'docIgnore': {
          const result = DocIgnoreSchema.safeParse(args);
          if (result.success) {
            directives.docIgnore = true;
          } else {
            console.warn(`Invalid @docIgnore usage: ${result.error.message}`);
          }
          break;
        }
      }
    }

    return directives;
  }

  private getDirectiveArgs(directive: DirectiveNode): any {
    const args: Record<string, any> = {};

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
