import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function createTempDir(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphql-docs-generator-test-'));
  return tempDir;
}

export function removeTempDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

export function writeSchema(dirPath: string, schemaContent: string): string {
  const schemaPath = path.join(dirPath, 'schema.graphql');
  fs.writeFileSync(schemaPath, schemaContent);
  return schemaPath;
}

export const SAMPLE_SCHEMA = `
  type Query {
    getUser(id: ID!): User
    listUsers: [User!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User
  }

  type User {
    id: ID!
    username: String!
    email: String!
  }

  input CreateUserInput {
    username: String!
    email: String!
  }
`;
