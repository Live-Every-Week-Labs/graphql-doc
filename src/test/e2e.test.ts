import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { createTempDir, removeTempDir } from './integration-test-utils';
import { SchemaLoader } from '../core/parser/schema-loader';
import { SchemaParser } from '../core/parser/schema-parser';
import { Transformer } from '../core/transformer/transformer';
import { DocusaurusAdapter } from '../core/adapters/docusaurus/docusaurus-adapter';
import { buildSchema } from 'graphql';

const COMPLEX_SCHEMA_PATH = path.join(__dirname, 'complex-schema.graphql');
const COMPLEX_SCHEMA_CONTENT = fs.readFileSync(COMPLEX_SCHEMA_PATH, 'utf-8');

// Mock SchemaLoader to avoid graphql instance mismatch issues in test environment
vi.mock('../core/parser/schema-loader', () => {
  return {
    SchemaLoader: class {
      async load() {
        return buildSchema(COMPLEX_SCHEMA_CONTENT);
      }
    },
  };
});

describe('End-to-End Generator Test', () => {
  let tempDir: string;
  let outputDir: string;

  beforeAll(() => {
    tempDir = createTempDir();
    outputDir = path.join(tempDir, 'output');
    fs.mkdirSync(outputDir);
  });

  afterAll(() => {
    removeTempDir(tempDir);
  });

  it('generates documentation with correct structure for complex schema', async () => {
    // 1. Load Schema
    const loader = new SchemaLoader();
    const schema = await loader.load({ schemaPointer: COMPLEX_SCHEMA_PATH });
    expect(schema).toBeDefined();

    // 2. Parse Schema
    const parser = new SchemaParser();
    const parsedSchema = parser.parse(schema);
    expect(parsedSchema).toBeDefined();

    // 3. Transform
    const transformer = new Transformer(parsedSchema.types);
    const docModel = transformer.transform(parsedSchema.operations, [], []);
    expect(docModel).toBeDefined();

    // Verify Sections
    const sectionNames = docModel.sections.map((s) => s.name);
    expect(sectionNames).toContain('User Management');
    expect(sectionNames).toContain('Content');
    expect(sectionNames).toContain('System');

    // 4. Adapt (Docusaurus)
    const adapter = new DocusaurusAdapter({ outputPath: outputDir });
    const files = adapter.adapt(docModel);

    // Write files to disk
    files.forEach((file) => {
      const filePath = path.join(outputDir, file.path);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content);
    });

    // 5. Verify Output Files

    // User Management Section
    // Profiles Subsection
    expect(fs.existsSync(path.join(outputDir, 'user-management/profiles/get-user.mdx'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'user-management/profiles/update-user.mdx'))).toBe(
      true
    );

    // Account Subsection
    expect(fs.existsSync(path.join(outputDir, 'user-management/account/create-user.mdx'))).toBe(
      true
    );

    // Category JSON
    expect(fs.existsSync(path.join(outputDir, 'user-management/_category_.json'))).toBe(true);

    // Content Section
    // Posts Subsection
    expect(fs.existsSync(path.join(outputDir, 'content/posts/get-post.mdx'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, 'content/posts/create-post.mdx'))).toBe(true);

    // Comments Subsection
    expect(fs.existsSync(path.join(outputDir, 'content/comments/add-comment.mdx'))).toBe(true);

    // System Section
    // Health Subsection
    expect(fs.existsSync(path.join(outputDir, 'system/health/get-system-status.mdx'))).toBe(true);

    // Sidebars
    expect(fs.existsSync(path.join(outputDir, 'sidebars.js'))).toBe(true);

    // 6. Verify Content (Descriptions)
    const getUserContent = fs.readFileSync(
      path.join(outputDir, 'user-management/profiles/get-user.mdx'),
      'utf-8'
    );
    expect(getUserContent).toContain('Get a user by their unique ID'); // Operation description
    expect(getUserContent).toContain('The ID of the user to retrieve'); // Argument description
    expect(getUserContent).toContain("import typesByName from '../../_data/types.json'");

    const typesJsonContent = fs.readFileSync(path.join(outputDir, '_data/types.json'), 'utf-8');
    expect(typesJsonContent).toContain('Represents a registered user in the system');
    expect(typesJsonContent).toContain('Unique username chosen by the user');

    const createPostContent = fs.readFileSync(
      path.join(outputDir, 'content/posts/create-post.mdx'),
      'utf-8'
    );
    expect(createPostContent).toContain('Create a new blog post');
    expect(createPostContent).toContain('Title of the post');
  });
});
