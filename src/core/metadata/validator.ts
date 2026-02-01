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

export const ExampleFileEntrySchema = z.object({
  operation: z.string(),
  operationType: z.enum(['query', 'mutation', 'subscription']),
  examples: z.array(ExampleSchema),
});

export const ExampleFileSchema = z.union([ExampleFileEntrySchema, z.array(ExampleFileEntrySchema)]);
