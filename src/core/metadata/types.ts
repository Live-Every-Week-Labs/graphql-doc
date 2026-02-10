export interface Example {
  name: string;
  description?: string;
  query: string;
  variables?: Record<string, unknown>;
  response: {
    type: 'success' | 'failure' | 'error';
    httpStatus?: number;
    body: unknown;
  };
}

export interface ExampleFile {
  operation: string;
  operationType: 'query' | 'mutation' | 'subscription';
  examples: Example[];
}
