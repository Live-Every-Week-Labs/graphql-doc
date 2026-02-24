/**
 * Shared Zod schemas for GraphQL documentation directive validation.
 *
 * Used by both the DirectiveExtractor (runtime parsing) and
 * SchemaValidator (static analysis / validation).
 */

import { z } from 'zod';

export const DocGroupSchema = z
  .object({
    name: z.string().min(1),
    order: z.number().optional(),
    subsection: z.string().optional(),
    displayLabel: z.string().optional(),
    sidebarTitle: z.string().optional(),
  })
  .strict();

export const DocPrioritySchema = z
  .object({
    level: z.number(),
  })
  .strict();

export const DocTagsSchema = z
  .object({
    tags: z.array(z.string()),
  })
  .strict();

export const DocIgnoreSchema = z.object({}).strict();
