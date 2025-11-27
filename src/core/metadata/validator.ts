import { z } from 'zod';

export const ExampleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  query: z.string(),
  variables: z.record(z.any()).optional(),
  response: z.object({
    type: z.enum(['success', 'failure', 'error']),
    httpStatus: z.number().optional(),
    body: z.any(),
  }),
});

export const ExampleFileSchema = z.object({
  operation: z.string(),
  operationType: z.enum(['query', 'mutation', 'subscription']),
  examples: z.array(ExampleSchema),
});

export const ErrorDefinitionSchema = z.object({
  code: z.string(),
  message: z.string(),
  description: z.string(),
  resolution: z.string().optional(),
  type: z.string().optional(),
  httpStatus: z.number().optional(),
});

export const ErrorFileSchema = z.object({
  category: z.string(),
  operations: z.array(z.string()),
  errors: z.array(ErrorDefinitionSchema),
  commonPatterns: z.record(z.any()).optional(),
});
