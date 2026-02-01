export interface Example {
  name: string;
  description?: string;
  query: string;
  variables?: Record<string, any>;
  response: {
    type: 'success' | 'failure' | 'error';
    httpStatus?: number;
    body: any;
  };
}

export interface ExampleFile {
  operation: string;
  operationType: 'query' | 'mutation' | 'subscription';
  examples: Example[];
}
