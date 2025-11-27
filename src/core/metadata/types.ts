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

export interface ErrorDefinition {
  code: string;
  message: string;
  description: string;
  resolution?: string;
  type?: string;
  httpStatus?: number;
}

export interface ErrorFile {
  category: string;
  operations: string[];
  errors: ErrorDefinition[];
  commonPatterns?: Record<string, any>;
}
