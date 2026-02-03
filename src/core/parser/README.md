# Parser System

The `src/core/parser` module is responsible for loading GraphQL schemas, extracting operations, and collecting type definitions and metadata.

## Core Components

### 1. SchemaLoader

**File:** `schema-loader.ts`

- Loads GraphQL schemas from local `.graphql` files. Remote URLs (introspection) require `allowRemoteSchema: true`.
- Accepts optional `schemaExtensions` SDL files to supply framework scalars/directives.
- Uses `@graphql-tools/load` to normalize inputs into a standard `GraphQLSchema` object.

### 2. SchemaParser

**File:** `schema-parser.ts`

- The main entry point for parsing.
- Orchestrates the extraction process.
- Iterates through `Query`, `Mutation`, and `Subscription` types to create `Operation` objects.
- Extracts standard metadata (arguments, return types, deprecation).

### 3. DirectiveExtractor

**File:** `directive-extractor.ts`

- Extracts custom documentation directives:
  - `@docGroup`: Categorization and ordering.
  - `@docPriority`: Sorting priority.
  - `@docTags`: Tagging operations.
  - `@docIgnore`: Exclude fields/types from generated docs.
- **Validation:** Uses Zod schemas to ensure directive arguments are type-safe and valid. Logs warnings for invalid usage.

### 4. TypeCollector

**File:** `type-collector.ts`

- Recursively traverses the schema starting from operation return types and arguments.
- Collects unique definitions for all referenced types:
  - **Scalars, Objects, Interfaces, Unions, Enums, Input Objects**.
- Handles circular references to prevent infinite recursion.
- Extracts field-level metadata including standard `@deprecated` directives.

## Data Flow

1.  **Load:** `SchemaLoader` reads source $\rightarrow$ `GraphQLSchema`.
2.  **Parse:** `SchemaParser` traverses root types (Query/Mutation/Subscription).
3.  **Extract:** For each field:
    - `DirectiveExtractor` pulls custom metadata.
    - `TypeCollector` recursively gathers all referenced types.
4.  **Output:** Returns a structured object containing:
    - `operations`: List of all operations with metadata.
    - `types`: List of all collected type definitions.

## Deprecation Handling

- We use the standard GraphQL `@deprecated` directive.
- `isDeprecated` and `deprecationReason` are extracted for:
  - Operations
  - Object/Interface Fields
  - Enum Values
  - Input Fields
