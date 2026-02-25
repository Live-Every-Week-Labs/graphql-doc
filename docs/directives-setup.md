# Directive Setup

The GraphQL Documentation Generator uses custom directives (`@docGroup`, `@docPriority`, `@docTags`, `@docIgnore`) to organize and control documentation generation. These directives must be included in your schema for deployment to production GraphQL servers like AWS AppSync.

## Why This Matters

When you deploy your GraphQL schema to a production server (AWS AppSync, Apollo Server, etc.), the server validates your schema. If you use directives that aren't defined, the deployment will fail with an error like:

```
Unknown directive "@docGroup"
```

**Important:** While `graphql-doc` automatically injects these directives during documentation generation, your **production schema** still needs them defined for deployment to succeed.

## Quick Setup

### Option 1: Using `graphql-doc init` (Recommended)

The easiest way is to run the init command, which creates `graphql-doc-directives.graphql` for you:

```bash
npx graphql-doc init
```

This creates:

```
graphql-doc-directives.graphql  ← Directive definitions
.graphqlrc                        ← Config with schema reference
docs-metadata/                    ← Example metadata
```

Then include the directives in your schema configuration.

### Option 2: Manual Setup

If you've already initialized your project, copy the directives file from the package:

```bash
# Copy from node_modules
cp node_modules/@lewl/graphql-doc/directives.graphql ./graphql-doc-directives.graphql

# Or create it manually (see below)
```

## Including Directives in Your Schema

There are several ways to include the directives in your schema:

### Method 1: GraphQL Config (Recommended for Tooling/Build Steps)

If you use `.graphqlrc` or similar config files:

```yaml
# .graphqlrc
schema:
  - ./graphql-doc-directives.graphql
  - ./schema.graphql
```

Or in JavaScript:

```javascript
// graphql.config.js
module.exports = {
  schema: ['./graphql-doc-directives.graphql', './schema.graphql'],
};
```

> Note: GraphQL config helps tooling/build steps assemble a full schema, but AppSync itself
> still requires a **single combined schema file** at deploy time. Make sure your pipeline
> outputs a merged schema (see AppSync examples below).

### Method 2: Direct Import in Schema File

If you have a single schema file, import or paste the directive definitions at the top:

```graphql
# schema.graphql

# Import the directives (if your tool supports file imports)
# import "./graphql-doc-directives.graphql"

# Or copy-paste the directive definitions at the top of your schema
directive @docGroup(
  name: String!
  order: Int
  subsection: String
  sidebarTitle: String
) on FIELD_DEFINITION
directive @docPriority(level: Int!) on FIELD_DEFINITION
directive @docTags(tags: [String!]!) on FIELD_DEFINITION
directive @docIgnore on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION | ENUM_VALUE | OBJECT | INPUT_OBJECT | ENUM | INTERFACE | UNION | SCALAR

type Query {
  users: [User!]! @docGroup(name: "Users")
}
```

### Method 3: Programmatic (Node.js)

If you're building your schema in code:

```javascript
import { readFileSync } from 'fs';
import { buildSchema } from 'graphql';

const directives = readFileSync('./graphql-doc-directives.graphql', 'utf-8');
const schema = readFileSync('./schema.graphql', 'utf-8');

const fullSchema = buildSchema(directives + '\n' + schema);
```

## AWS AppSync Specific Setup

For AWS AppSync deployments, include the directives file in your CDK/CloudFormation/Amplify configuration:

### AWS CDK

```typescript
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const directivesContent = readFileSync('./graphql-doc-directives.graphql', 'utf-8');
const schemaContent = readFileSync('./schema.graphql', 'utf-8');
const combinedSchemaPath = path.join(__dirname, 'schema-with-directives.graphql');
writeFileSync(combinedSchemaPath, `${directivesContent}\n${schemaContent}`);

const api = new appsync.GraphqlApi(this, 'Api', {
  name: 'my-api',
  schema: appsync.SchemaFile.fromAsset(combinedSchemaPath),
});
```

### Amplify

In your `amplify/backend/api/*/schema.graphql`, include the directives at the top:

```graphql
# amplify/backend/api/myapi/schema.graphql

# Documentation directives (paste content from graphql-doc-directives.graphql)
directive @docGroup(name: String!, order: Int, subsection: String, sidebarTitle: String) on FIELD_DEFINITION
directive @docPriority(level: Int!) on FIELD_DEFINITION
directive @docTags(tags: [String!]!) on FIELD_DEFINITION
directive @docIgnore on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION | ENUM_VALUE | OBJECT | INPUT_OBJECT | ENUM | INTERFACE | UNION | SCALAR

type Query {
  # Your queries here
}
```

### SAM/CloudFormation

```yaml
# template.yaml
Resources:
  GraphQLApi:
    Type: AWS::AppSync::GraphQLApi
    Properties:
      Name: MyAPI
      AuthenticationType: API_KEY

  GraphQLSchema:
    Type: AWS::AppSync::GraphQLSchema
    Properties:
      ApiId: !GetAtt GraphQLApi.ApiId
      DefinitionS3Location: ./schema-with-directives.graphql # Combined file (directives + schema)
```

## Directive Definitions

The full directive definitions are available in:

- `node_modules/@lewl/graphql-doc/directives.graphql` (after npm install)
- `graphql-doc-directives.graphql` (after running `graphql-doc init`)
- [GitHub Repository](https://github.com/austinzani/graphql-doc/blob/main/directives.graphql)

### Complete Definitions

```graphql
directive @docGroup(
  name: String!
  order: Int
  subsection: String
  sidebarTitle: String
) on FIELD_DEFINITION

directive @docPriority(level: Int!) on FIELD_DEFINITION

directive @docTags(tags: [String!]!) on FIELD_DEFINITION

directive @docIgnore on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION | ENUM_VALUE | OBJECT | INPUT_OBJECT | ENUM | INTERFACE | UNION | SCALAR
```

## Verification

To verify your directives are properly included:

### 1. Schema Validation

```bash
# Using GraphQL CLI
graphql validate

# Or with graphql-doc
graphql-doc validate
```

### 2. Check in GraphQL Playground

Start your server and check the schema tab - you should see the directive definitions.

### 3. AppSync Console

After deploying to AppSync, go to the AWS Console → AppSync → Your API → Schema, and search for `@docGroup`. You should see the directive definition.

## Troubleshooting

### Error: "Unknown directive @docGroup"

**Cause:** The directives aren't included in your schema.

**Fix:** Follow one of the methods above to include `graphql-doc-directives.graphql` in your schema.

### Error: AppSync deployment fails with directive error

**Cause:** The directives file wasn't included in your deployment package.

**Fix:** Ensure your build/deploy process includes `graphql-doc-directives.graphql` or that the directives are directly in your schema file.

### Directives work locally but fail in production

**Cause:** `graphql-doc` auto-injects directives during documentation generation, but your production server doesn't have them.

**Fix:** Add the directives to your production schema following the methods above.

## Best Practices

1. **Include directives at the top** of your schema file for visibility
2. **Version control** `graphql-doc-directives.graphql` with your project
3. **Validate before deploying** using `graphql validate` or similar tools
4. **Keep directives updated** when upgrading `@lewl/graphql-doc`
5. **Document for your team** that these directives are required for schema deployments

## Runtime Behavior

These directives have **no runtime behavior** and are purely for documentation generation. They:

- ✅ Are safe to include in production schemas
- ✅ Don't affect query execution or performance
- ✅ Are ignored by GraphQL servers during query processing
- ✅ Don't require any resolver implementation

Think of them like comments or annotations - they provide metadata for tooling but don't change how your API works.
