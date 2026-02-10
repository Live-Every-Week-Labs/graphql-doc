/**
 * Shared Zod schemas for GraphQL documentation directive validation.
 *
 * Used by both the DirectiveExtractor (runtime parsing) and
 * SchemaValidator (static analysis / validation).
 */

import { z } from 'zod';

export const DocGroupSchema = z.object({
  name: z.string(),
  order: z.number().optional(),
  subsection: z.string().optional(),
  displayLabel: z.string().optional(),
  sidebarTitle: z.string().optional(),
});

export const DocPrioritySchema = z.object({
  level: z.number(),
});

export const DocTagsSchema = z.object({
  tags: z.array(z.string()),
});

export const DocIgnoreSchema = z.object({}).strict();
