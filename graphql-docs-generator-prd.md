# GraphQL Operation-First Documentation Generator

## Product Requirements Document

**Version:** 1.3
**Last Updated:** November 29, 2024
**Status:** MVP Implementation
**Target Release:** MVP - Q1 2025

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Project Vision](#project-vision)
- [Problem Statement](#problem-statement)
- [Goals and Non-Goals](#goals-and-non-goals)
- [User Personas](#user-personas)
- [Core Features](#core-features)
- [Technical Architecture](#technical-architecture)
- [Tech Stack and Dependencies](#tech-stack-and-dependencies)
- [File Structure](#file-structure)
- [Annotation System](#annotation-system)
- [External Metadata System](#external-metadata-system)
- [Output Specification](#output-specification)
- [Development Phases](#development-phases)
- [Success Metrics](#success-metrics)
- [Outstanding Questions](#outstanding-questions)

---

## Executive Summary

We are building an open-source GraphQL documentation generator that organizes API documentation around **operations (queries and mutations)** rather than types. The tool will parse GraphQL schemas with custom directives, merge external JSON metadata for examples and errors, and generate operation-first MDX documentation for Docusaurus.

**Key Differentiators:**

- **Operation-first navigation** - Group by business domain/use case, not type system
- **Clean schema separation** - Examples and errors in external JSON files, not cluttering SDL
- **Multi-page with single-page option** - Configurable output format for different needs
- **Smart type expansion** - 2 levels inline with collapsible details for deeper exploration
- **GraphQL-specific UX** - Emphasizes POST endpoint, 200 status, `data`/`errors` fields

**MVP Scope:**

- Docusaurus framework support
- Multi-page output (with single-page option)
- External JSON for examples and errors
- Custom directive-based organization
- Hardcoded templates (customization HIGH priority for post-MVP)
- Manual examples required (auto-generation MEDIUM priority for post-MVP)

**Target Users:** GraphQL API providers with 50+ operations who need consumer-friendly documentation that scales beyond type-centric tools like GraphiQL or SpectaQL.

---

## Project Vision

**Vision Statement:**  
Every GraphQL API should have documentation that helps developers accomplish tasks, not just understand types.

**Why This Matters:**  
Current GraphQL documentation tools (SpectaQL, graphql-markdown, Magidoc) organize content around the type system—forcing users to navigate through types to understand operations. For large APIs with 100+ types and 800+ mutations, this creates excessive context switching and poor discoverability.

**Our Approach:**  
We flip the model. Operations become the primary content. Types are inline and expandable. Developers find what they need by asking "What can I do?" not "What types exist?"

**Inspiration:**  
REST API documentation (Stripe, GitHub) succeeds because it organizes by endpoints and use cases. We bring this UX philosophy to GraphQL while respecting its unique characteristics (single endpoint, flexible response shapes, type system benefits).

**Long-term Vision:**

- Support all major documentation frameworks (Docusaurus, Nextra, Starlight, VitePress)
- Plugin ecosystem for customization
- Interactive GraphQL playground integration
- Auto-generate realistic examples from schema
- Community templates for common GraphQL patterns

---

## Problem Statement

### Current State

GraphQL documentation tools universally organize content by type system hierarchy:

```
Sidebar:
├── Queries
├── Mutations
├── Types
│   ├── User
│   ├── Post
│   ├── Comment
│   └── ... (100+ more types)
├── Interfaces
├── Enums
└── Scalars
```

**Pain Points:**

1. **Poor Discoverability** - Finding "How do I create a transaction?" requires knowing it's a mutation, then scrolling through 800+ mutations alphabetically
2. **Excessive Context Switching** - Understanding one operation requires clicking through 5-10 related types in separate pages
3. **Type-First Thinking** - Optimized for schema designers, not API consumers
4. **Doesn't Scale** - Sidebar becomes unwieldy beyond ~50 operations
5. **No Business Context** - Operations grouped only by kind (query/mutation), not by domain

### Desired State

Documentation organized by **what developers want to accomplish**:

```
Sidebar:
├── User Management
│   ├── Retrieval
│   │   ├── getUser
│   │   └── searchUsers
│   └── Modification
│       ├── createUser
│       └── updateUser
├── Payments
│   ├── Transactions
│   │   ├── createTransaction
│   │   ├── captureTransaction
│   │   └── refundTransaction
│   └── Payment Methods
└── Merchants
```

**Benefits:**

- **Task-Oriented** - Developers navigate by business domain
- **Reduced Clicks** - All related operations grouped together
- **Inline Types** - See type details in context, expand as needed
- **Scalable** - Works for 10 or 10,000 operations
- **Business Context** - Clear categorization by use case

### Gap Analysis

**What exists:**

- SpectaQL - Beautiful static docs, but type-first organization
- graphql-markdown - Docusaurus integration, but type-first organization
- GraphiQL - Interactive, but type-first sidebar
- Magidoc - Modern UI, but type-first organization

**What's missing:**

- Operation-first navigation structure
- Business domain grouping
- Inline type expansion (no page hopping)
- External metadata for examples (clean schema)
- GraphQL-specific documentation patterns

**Our Solution:**
Build it. This PRD defines that solution.

---

## Goals and Non-Goals

### Goals

**Primary Goals (MVP):**

1. ✅ Generate operation-first MDX documentation from annotated GraphQL schemas
2. ✅ Support external JSON files for examples and errors (clean schema)
3. ✅ Integrate seamlessly with Docusaurus autogenerated navigation
4. ✅ Provide single-page documentation with anchor navigation
5. ✅ Highlight GraphQL-specific patterns (POST endpoint, 200 status, data/errors fields)
6. ✅ Support grouping operations by business domain/use case
7. ✅ Enable priority-based ordering within groups
8. ✅ Handle deprecation warnings and migration guidance

**Secondary Goals (Post-MVP):**

- **Template customization system** - HIGH PRIORITY
  - Override individual templates (industry standard pattern)
  - Custom Handlebars helpers for extension
  - Well-documented template data model
  - See "Post-MVP Roadmap" section for details
- **Auto-generate examples** - MEDIUM PRIORITY
  - Optional `--generate-examples` flag with smart defaults
  - Clear warnings that examples are placeholders
  - See "Post-MVP Roadmap" section for details
- Support multiple documentation frameworks (Nextra, Starlight, VitePress)
- Plugin system for extensibility
- Custom React components for interactive features
- Inline GraphQL playground per operation
- Support for GraphQL subscriptions
- Multi-language code examples (JavaScript, Python, cURL, etc.)

**Stretch Goals:**

- Visual schema explorer integration
- Real-time documentation updates via introspection
- AI-generated operation descriptions
- Performance/cost calculator per operation
- Community template marketplace

### Non-Goals

**What We Won't Build (At Least Initially):**

1. ❌ Runtime documentation rendering (we generate static files only)
2. ❌ Schema validation or linting (use existing tools)
3. ❌ GraphQL server/gateway (documentation only)
4. ❌ API testing or mocking (use GraphQL Playground, Postman)
5. ❌ Type-first documentation mode (that's what existing tools do)
6. ❌ Visual schema designer (too complex for MVP)
7. ❌ Hosting platform (users host on their own infrastructure)
8. ❌ Authentication/authorization documentation (out of scope)

**Intentional Limitations:**

- **Docusaurus-only for MVP** - Other frameworks come later
- **Manual schema annotation** - No automatic categorization (for now)
- **English-only initially** - i18n support post-MVP
- **No custom theming** - Use Docusaurus themes (for now)

---

## User Personas

### Primary Persona: API Documentation Engineer (Sarah)

**Background:**

- Works at a fintech company with a large GraphQL API
- Responsible for maintaining developer documentation
- Engineers and partners use the API
- Current docs use SpectaQL but users complain about navigation

**Goals:**

- Make API documentation easier to navigate
- Reduce support tickets about "How do I...?" questions
- Keep documentation in sync with schema changes
- Improve developer experience for API consumers

**Pain Points:**

- Current type-first docs don't match how developers think
- Examples are hard-coded in schema descriptions (maintenance nightmare)
- No good way to group related operations
- Sidebar too long, hard to find specific operations

**How This Tool Helps:**

- Operation-first navigation matches developer mental models
- External JSON for examples (easy to maintain)
- Custom directives for grouping by business domain
- Autogenerated Docusaurus sidebar stays organized

### Secondary Persona: API Consumer (Marcus)

**Background:**

- Backend engineer integrating a payment processing GraphQL API
- Moderate GraphQL experience
- Tight deadline to ship integration
- Prefers code examples over lengthy explanations

**Goals:**

- Quickly find how to accomplish specific tasks
- See realistic examples with actual data
- Understand error cases and how to handle them
- Copy-paste working code to get started fast

**Pain Points:**

- Current docs organized by types, not tasks
- Has to click through multiple pages to understand one operation
- Examples use placeholder data like "test", "1", "foo"
- Not clear what errors to expect

**How This Tool Helps:**

- Navigate by business domain to find operations
- See all related types inline, no page hopping
- Rich examples with realistic data in external JSON
- Clear error documentation with codes and resolution steps

### Tertiary Persona: Open Source Maintainer (Alex)

**Background:**

- Maintains an open-source GraphQL API project
- Wants good documentation but limited time
- Needs solution that's easy to set up and maintain
- Contributors should be able to update docs easily

**Goals:**

- Automated documentation generation
- Minimal maintenance overhead
- Contributors can add examples without touching schema
- Good-looking docs without design work

**Pain Points:**

- Current manual documentation gets out of sync
- Hard to get contributors to write docs
- Existing tools don't match project's navigation needs

**How This Tool Helps:**

- Automatic generation from schema
- Contributors can add examples via JSON (no schema knowledge needed)
- Docusaurus integration provides professional look
- Open source = free and customizable

---

## Core Features

### Feature 1: GraphQL Schema Parsing with Directives

**Description:**  
Parse GraphQL schemas and extract metadata from custom directives.

**User Story:**  
As an API documentation engineer, I want to annotate my GraphQL schema with business context so that generated documentation reflects how my API is organized.

**Requirements:**

- Parse standard GraphQL SDL files
- Extract custom directive metadata (@docGroup, @docPriority, @docTags)
- Extract native GraphQL @deprecated directive for deprecation handling
- Support introspection JSON as alternative input
- Handle schema stitching and federation (multiple schema sources)
- Validate directive usage and provide helpful errors

**Acceptance Criteria:**

- Parser successfully extracts all standard GraphQL types
- Custom directives parsed and accessible in AST
- Error messages clearly identify invalid directive usage
- Supports GraphQL schema files and introspection results
- Handles large schemas (1000+ types) efficiently

### Feature 2: External Metadata Management

**Description:**  
Load examples, responses, and error definitions from external JSON files.

**User Story:**  
As an API documentation engineer, I want to keep examples and errors in separate JSON files so that my schema stays clean and examples are easy to maintain.

**Requirements:**

- Define JSON schema for example files (per operation)
- Define JSON schema for error definition files (shared across operations)
- Load and validate JSON files at generation time
- Merge external metadata with schema-derived information
- Support file references (e.g., `$ref` for reusable examples)

**Acceptance Criteria:**

- JSON files validate against defined schema
- Examples and errors correctly merged with operations
- File not found errors are clear and actionable
- Supports relative paths and glob patterns for file discovery
- Invalid JSON provides helpful error messages with line numbers

### Feature 3: Operation-First Content Generation

**Description:**  
Transform schema and metadata into operation-centric MDX files with flexible output modes.

**User Story:**  
As an API consumer, I want to navigate documentation by business domain and operation so that I can quickly find how to accomplish specific tasks.

**Requirements:**

- Group operations by @docGroup annotation
- Sort operations by @docPriority within groups
- Generate one MDX file per operation (multi-page mode)
- OR combine all into single file (single-page mode via config)
- Include inline type definitions (not separate pages)
- Support subsections within groups
- Generate section overview pages

**Acceptance Criteria:**

- Operations grouped and sorted correctly
- MDX files render properly in Docusaurus
- Inline types display with expandable details (2 levels + collapsible)
- Navigation matches grouping structure
- Overview pages provide useful summaries
- Both output modes work correctly
- Config flag switches between modes seamlessly

### Feature 4: Docusaurus Integration

**Description:**  
Generate Docusaurus-compatible MDX with autogenerated sidebar navigation.

**User Story:**  
As an API documentation engineer, I want documentation that integrates seamlessly with our existing Docusaurus site so that API docs match our other documentation.

**Requirements:**

- Generate valid Docusaurus MDX front matter
- Support autogenerated sidebars via directory structure
- Use Docusaurus-compatible React components
- Support Docusaurus themes and styling
- Work with Docusaurus versioning

**Acceptance Criteria:**

- MDX files work in Docusaurus without modification
- Sidebar autogeneration works as expected
- Styling matches Docusaurus theme
- Versioning creates separate API doc versions
- Search integration works (built-in or Algolia)

### Feature 5: GraphQL-Specific Documentation Patterns

**Description:**  
Highlight GraphQL-specific characteristics that differ from REST APIs.

**User Story:**  
As an API consumer familiar with REST, I want documentation that clearly explains GraphQL-specific patterns so that I understand how to work with this API.

**Requirements:**

- Emphasize single `/graphql` endpoint for all operations
- Highlight POST method for all requests
- Explain 200 status for all responses (including errors)
- Distinguish `data` field (success) from `errors` array
- Show Query vs Mutation distinction clearly
- Provide GraphQL query structure templates

**Acceptance Criteria:**

- Every operation clearly shows endpoint and HTTP method
- Success vs error response examples prominently displayed
- Query structure template provided per operation
- Variables pattern explained with examples
- Badges distinguish queries from mutations

### Feature 6: Rich Example System

**Description:**  
Display multiple realistic examples per operation with request and response.

**User Story:**  
As an API consumer, I want to see realistic examples with actual data patterns so that I can understand how to use the API in real scenarios.

**Requirements:**

- Load examples from external JSON files (user-provided)
- Support multiple examples per operation
- Show GraphQL query, variables, and response
- Label examples with descriptive names
- Highlight success, failure, and error scenarios
- Use realistic data patterns
- Warn clearly when examples are missing

**Acceptance Criteria:**

- Examples display in tabbed or accordion UI
- Query syntax highlighting works
- Variables shown as formatted JSON
- Response data clearly labeled as success/error
- Realistic data patterns in user-provided examples
- Clear warning messages when no examples found
- Documentation guides users on creating quality examples

**MVP Note:** Users must manually create example JSON files. Auto-generation feature planned for post-MVP.

### Feature 7: Error Documentation

**Description:**  
Provide comprehensive error reference with codes, messages, and resolution steps.

**User Story:**  
As an API consumer, I want to understand what errors I might encounter and how to handle them so that I can build robust integrations.

**Requirements:**

- List possible error codes per operation
- Include error messages and descriptions
- Provide resolution guidance for each error
- Support shared error definitions (common across operations)
- Show error structure in GraphQL response

**Acceptance Criteria:**

- Error codes listed clearly per operation
- Each error includes code, message, description, resolution
- Shared errors documented once, referenced many times
- Example error responses show GraphQL errors array format
- Links to error reference section from operations

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI / API                            │
│                    (User Entry Point)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Configuration Loader                       │
│              (GraphQL Config + Tool Config)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│   Schema Parser      │       │  Metadata Loader     │
│   (graphql-js)       │       │  (JSON files)        │
│                      │       │                      │
│ - Parse SDL/JSON     │       │ - Load examples      │
│ - Extract directives │       │ - Load errors        │
│ - Build AST          │       │ - Validate schemas   │
└──────────┬───────────┘       └──────────┬───────────┘
           │                               │
           └───────────────┬───────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Transformer                          │
│              (Merge schema + metadata)                        │
│                                                               │
│  - Group operations by @docGroup                             │
│  - Sort by @docPriority                                      │
│  - Merge examples from JSON                                  │
│  - Attach error definitions                                  │
│  - Build internal doc model                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Framework Adapter                           │
│                (Docusaurus - MVP)                            │
│                                                               │
│  - Generate front matter                                     │
│  - Determine file paths                                      │
│  - Create navigation config                                  │
│  - Apply framework conventions                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   MDX Generator                              │
│            (Handlebars Templates)                            │
│                                                               │
│  - Render operation pages                                    │
│  - Generate examples                                         │
│  - Create type expansions                                    │
│  - Build navigation                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    File Writer                               │
│              (Write to filesystem)                           │
│                                                               │
│  - Create directory structure                                │
│  - Write MDX files                                           │
│  - Write _category_.json files                              │
│  - Copy static assets                                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Input:
  - GraphQL Schema (SDL or introspection JSON)
  - External Metadata (examples/*.json, errors/*.json)
  - Configuration (.graphqlrc)

    ↓

Parse & Load:
  - Schema → GraphQL AST
  - Directives → Metadata objects
  - JSON files → Example/error objects

    ↓

Transform:
  - Merge schema + metadata
  - Group by @docGroup
  - Sort by @docPriority
  - Build internal model

    ↓

Adapt:
  - Apply Docusaurus conventions
  - Generate front matter
  - Determine file structure

    ↓

Generate:
  - Render Handlebars templates
  - Create MDX content
  - Build navigation

    ↓

Output:
  - MDX files in docs/api/
  - _category_.json files
  - Optional sidebar config
```

### Core Abstractions

**Internal Documentation Model:**

```typescript
interface DocModel {
  sections: Section[];
  errorReference: ErrorDefinition[];
  config: GeneratorConfig;
}

interface Section {
  name: string;
  order: number;
  subsections: Subsection[];
}

interface Subsection {
  name: string;
  operations: Operation[];
}

interface Operation {
  name: string;
  operationType: 'query' | 'mutation' | 'subscription';
  description: string;
  priority: number;
  deprecationReason: string | null; // From native GraphQL @deprecated directive
  tags: string[];
  arguments: Argument[];
  returnType: TypeReference;
  examples: Example[];
  responses: ResponseType[];
  errors: ErrorReference | null;
  graphql: GraphQLMetadata;
}

interface Example {
  name: string;
  description: string;
  query: string;
  variables: Record<string, any>;
  response: {
    type: 'success' | 'failure' | 'error';
    httpStatus: number;
    body: any;
  };
}

interface ErrorReference {
  category: string;
  errors: ErrorDefinition[];
  commonPatterns: Record<string, any>;
}
```

### Plugin System (Future)

```typescript
interface Plugin {
  name: string;
  version: string;

  // Lifecycle hooks
  beforeParse?(config: GeneratorConfig): void;
  afterParse?(schema: GraphQLSchema): void;

  transformOperation?(operation: Operation): Operation;
  transformSection?(section: Section): Section;

  beforeGenerate?(model: DocModel): void;
  afterGenerate?(files: GeneratedFile[]): void;

  // Custom templates
  templates?: {
    operation?: string;
    section?: string;
    example?: string;
  };
}
```

---

## Tech Stack and Dependencies

### Core Technologies

**Language & Runtime:**

- **TypeScript 5.x** - Type safety, better DX, industry standard
- **Node.js 18+** - LTS version, modern features

**GraphQL:**

- **graphql (graphql-js) 16.x** - Official reference implementation, schema parsing
- **@graphql-tools/schema 10.x** - Schema utilities, stitching, merging
- **@graphql-tools/load 8.x** - Load schemas from files, URLs, etc.

**Documentation Framework:**

- **Docusaurus 3.x** - Target framework for MVP
- **MDX 3.x** - Markdown with React components

**Templating:**

- **Handlebars 4.x** - Internal template engine for MDX generation (not exposed to users in MVP)
- Note: Template customization planned for post-MVP release

**Configuration:**

- **GraphQL Config 5.x** - Standard GraphQL project configuration
- **cosmiconfig 9.x** - Support multiple config formats

**CLI:**

- **commander 11.x** - CLI framework
- **inquirer 9.x** - Interactive prompts
- **chalk 5.x** - Terminal colors
- **ora 8.x** - Spinners and progress indicators

**Utilities:**

- **fs-extra 11.x** - Enhanced filesystem operations
- **glob 10.x** - File pattern matching
- **ajv 8.x** - JSON schema validation
- **zod 3.x** - Runtime type validation

**Development:**

- **Vitest 1.x** - Testing framework
- **tsx 4.x** - TypeScript execution
- **tsup 8.x** - TypeScript bundler
- **eslint 8.x** - Linting
- **prettier 3.x** - Code formatting

### Dependency Rationale

**Why graphql-js?**

- Official implementation, 8.3M+ weekly downloads
- Complete introspection support
- Industry standard, well-maintained

**Why Handlebars over alternatives?**

- Clean separation of logic and presentation
- Familiar syntax for future extensibility
- Excellent performance
- Active maintenance
- Note: Used internally in MVP; user customization in post-MVP

**Why GraphQL Config?**

- De facto standard for GraphQL projects
- Users likely already have .graphqlrc
- Supports multiple schema sources
- Ecosystem integration

**Why Vitest over Jest?**

- Faster execution (native ESM)
- Better TypeScript integration
- Simpler configuration
- Modern developer experience

**Why commander over yargs?**

- Cleaner API
- Better TypeScript support
- Smaller bundle size
- Industry standard (used by Vue CLI, etc.)

### Package Structure

```json
{
  "name": "@graphql-docs/generator",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./docusaurus": {
      "import": "./dist/docusaurus.js",
      "require": "./dist/docusaurus.cjs"
    }
  },
  "bin": {
    "graphql-docs": "./dist/cli.js"
  },
  "files": ["dist", "templates"],
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "graphql": "^16.8.0",
    "@graphql-tools/schema": "^10.0.0",
    "@graphql-tools/load": "^8.0.0",
    "graphql-config": "^5.0.0",
    "handlebars": "^4.7.8",
    "commander": "^11.1.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "fs-extra": "^11.2.0",
    "glob": "^10.3.0",
    "ajv": "^8.12.0",
    "zod": "^3.22.0",
    "cosmiconfig": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "tsx": "^4.7.0",
    "tsup": "^8.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

---

## File Structure

### Project Repository Structure

```
graphql-docs-generator/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── release.yml
│   └── ISSUE_TEMPLATE/
├── examples/
│   ├── basic/
│   │   ├── schema.graphql
│   │   ├── .graphqlrc
│   │   ├── docs-metadata/
│   │   └── docusaurus.config.js
│   ├── advanced/
│   └── federation/
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── generate.ts
│   │   │   ├── init.ts
│   │   │   └── validate.ts
│   │   └── utils/
│   ├── core/
│   │   ├── parser/
│   │   │   ├── schema-parser.ts
│   │   │   ├── directive-extractor.ts
│   │   │   └── types.ts
│   │   ├── metadata/
│   │   │   ├── example-loader.ts
│   │   │   ├── error-loader.ts
│   │   │   └── validator.ts
│   │   ├── transformer/
│   │   │   ├── doc-model-builder.ts
│   │   │   ├── grouping.ts
│   │   │   └── sorting.ts
│   │   └── generator/
│   │       ├── template-engine.ts
│   │       ├── mdx-builder.ts
│   │       └── file-writer.ts
│   ├── adapters/
│   │   └── docusaurus/
│   │       ├── adapter.ts
│   │       ├── navigation.ts
│   │       ├── front-matter.ts
│   │       └── templates/
│   │           ├── operation.hbs
│   │           ├── section.hbs
│   │           └── example.hbs
│   ├── schemas/
│   │   ├── example-schema.json
│   │   ├── error-schema.json
│   │   └── config-schema.json
│   └── index.ts
├── templates/
│   ├── default/
│   │   ├── operation.hbs
│   │   ├── section.hbs
│   │   ├── type-details.hbs
│   │   └── example.hbs
│   └── single-page/
│       └── all-operations.hbs
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│       ├── schemas/
│       ├── metadata/
│       └── expected-output/
├── docs/
│   ├── README.md
│   ├── getting-started.md
│   ├── configuration.md
│   ├── directives.md
│   ├── metadata-format.md
│   └── examples.md
├── .graphqlrc.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
└── LICENSE
```

### Generated Output Structure (Docusaurus)

```
docs/
├── api/
│   ├── _category_.json
│   ├── overview.mdx
│   ├── user-management/
│   │   ├── _category_.json
│   │   ├── retrieval/
│   │   │   ├── _category_.json
│   │   │   ├── get-user.mdx
│   │   │   └── search-users.mdx
│   │   └── modification/
│   │       ├── _category_.json
│   │       ├── create-user.mdx
│   │       └── update-user.mdx
│   ├── payments/
│   │   ├── _category_.json
│   │   ├── transactions/
│   │   │   ├── _category_.json
│   │   │   ├── create-transaction.mdx
│   │   │   ├── capture-transaction.mdx
│   │   │   └── refund-transaction.mdx
│   │   └── payment-methods/
│   └── error-reference.mdx
└── sidebars.js (optional - if not using autogenerated)
```

**Alternative: Single-Page Output**

```
docs/
└── api/
    ├── _category_.json
    └── index.mdx  (contains all operations)
```

### User Project Structure

What users need in their project:

```
my-graphql-api/
├── schema/
│   └── schema.graphql
├── docs-metadata/
│   ├── examples/
│   │   ├── queries/
│   │   │   ├── user.json
│   │   │   └── search-users.json
│   │   └── mutations/
│   │       └── create-transaction.json
│   └── errors/
│       ├── common-errors.json
│       └── payment-errors.json
├── .graphqlrc
└── docusaurus.config.js
```

---

## Annotation System

### Deprecation Handling

Deprecation is handled using the **native GraphQL `@deprecated` directive**, not a custom directive. This leverages the standard GraphQL specification:

```graphql
type Query {
  """
  Retrieve a user by ID.
  """
  user(id: ID!): User @deprecated(reason: "Use getUser instead")
}
```

The generator extracts `deprecationReason` from the schema and displays it in the documentation with appropriate warnings.

### Custom Directive Definitions

These directives should be added to the user's GraphQL schema:

```graphql
"""
Groups operations into logical sections for documentation organization.
"""
directive @docGroup(
  """
  The name of the documentation section
  """
  name: String!

  """
  Display order within documentation (lower numbers first).
  Optional: sections WITH an order are sorted numerically first,
  sections WITHOUT an order are sorted alphabetically after ordered sections.
  """
  order: Int

  """
  Optional subsection within the main section
  """
  subsection: String
) on FIELD_DEFINITION

"""
Sets the display priority for ordering operations within a section.
"""
directive @docPriority(
  """
  Priority level (lower numbers appear first)
  """
  level: Int!
) on FIELD_DEFINITION

"""
Tags for filtering and categorizing operations.
"""
directive @docTags(
  """
  List of tags for this operation
  """
  tags: [String!]!
) on FIELD_DEFINITION
```

### Example Annotated Schema

```graphql
type Query {
  """
  Retrieve a user by their unique identifier.
  """
  user(
    """
    The unique user ID
    """
    id: ID!
  ): User
    @docGroup(name: "User Management", order: 1, subsection: "Retrieval")
    @docPriority(level: 1)
    @docTags(tags: ["users", "core"])

  """
  Search users by email address or name.
  """
  searchUsers(query: String!, limit: Int = 20, cursor: String): UserConnection
    @docGroup(name: "User Management", order: 1, subsection: "Search")
    @docPriority(level: 5)
    @docTags(tags: ["users", "search"])
}

type Mutation {
  """
  Process a payment transaction.
  """
  createTransaction(input: CreateTransactionInput!): CreateTransactionPayload
    @docGroup(name: "Payments", order: 2, subsection: "Transactions")
    @docPriority(level: 1)
    @docTags(tags: ["payments", "transactions", "core"])
}
```

### Directive Extraction

The parser should:

1. Use `field.astNode?.directives` to access directives
2. Extract argument values into typed objects
3. Validate required arguments are present
4. Provide defaults for optional arguments
5. Merge directive metadata into operation objects

---

## External Metadata System

### Example File Schema

**Location:** `docs-metadata/examples/{queries|mutations}/{operation-name}.json`

**JSON Schema:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["operation", "operationType", "examples"],
  "properties": {
    "operation": {
      "type": "string",
      "description": "Name of the GraphQL operation"
    },
    "operationType": {
      "type": "string",
      "enum": ["query", "mutation", "subscription"]
    },
    "examples": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "query"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Display name for this example"
          },
          "description": {
            "type": "string",
            "description": "Explanation of what this example demonstrates"
          },
          "query": {
            "type": "string",
            "description": "The GraphQL query or mutation"
          },
          "variables": {
            "type": "object",
            "description": "Variables for the operation"
          },
          "response": {
            "type": "object",
            "required": ["type", "httpStatus", "body"],
            "properties": {
              "type": {
                "type": "string",
                "enum": ["success", "failure", "error"]
              },
              "httpStatus": {
                "type": "number",
                "description": "HTTP status code (usually 200)"
              },
              "body": {
                "type": "object",
                "description": "GraphQL response body"
              }
            }
          }
        }
      }
    },
    "responses": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["title", "type"],
        "properties": {
          "title": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": ["success", "failure", "error"]
          },
          "description": {
            "type": "string"
          },
          "httpStatus": {
            "type": "number"
          },
          "example": {
            "type": "object"
          }
        }
      }
    }
  }
}
```

### Error File Schema

**Location:** `docs-metadata/errors/{category}-errors.json`

**JSON Schema:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["category", "operations", "errors"],
  "properties": {
    "category": {
      "type": "string",
      "description": "Category name for this group of errors"
    },
    "operations": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Operations that can return these errors (* for all)"
    },
    "errors": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["code", "message", "description"],
        "properties": {
          "code": {
            "type": "string",
            "description": "Error code constant"
          },
          "message": {
            "type": "string",
            "description": "User-facing error message"
          },
          "description": {
            "type": "string",
            "description": "Detailed explanation"
          },
          "resolution": {
            "type": "string",
            "description": "How to resolve this error"
          },
          "type": {
            "type": "string",
            "description": "Error type classification"
          },
          "httpStatus": {
            "type": "number",
            "description": "HTTP status (usually 200)"
          }
        }
      }
    },
    "commonPatterns": {
      "type": "object",
      "description": "Common patterns for handling these errors"
    }
  }
}
```

### File Discovery

The metadata loader should:

1. Use glob patterns to find all JSON files
2. Validate each file against JSON schema
3. Group examples by operation name
4. Merge error definitions by operation references
5. Provide clear error messages for invalid files

---

## Output Specification

### Single-Page MDX Structure

````markdown
---
id: api-reference
title: API Reference
sidebar_label: API Reference
---

# API Reference

## Table of Contents

- [User Management](#user-management)
  - [Retrieval](#user-management-retrieval)
    - [getUser](#getuser)
    - [searchUsers](#searchusers)
  - [Modification](#user-management-modification)
    - [createUser](#createuser)
- [Payments](#payments)
  - [Transactions](#payments-transactions)
    - [createTransaction](#createtransaction)

---

## User Management {#user-management}

### Retrieval {#user-management-retrieval}

#### getUser {#getuser}

<div className="operation-header">
  <span className="badge badge--query">QUERY</span>
  <h4>getUser</h4>
</div>

Retrieve a user by their unique identifier.

**GraphQL Endpoint:** `POST /graphql`  
**HTTP Status:** 200 OK (always)  
**Success Field:** `data`  
**Error Field:** `errors`

##### Arguments

- `id` (ID!) - The unique user ID

##### Returns

`User` - The user object with requested fields

<details>
<summary>Type Details: User</summary>

```graphql
type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  createdAt: DateTime!
}
```
````

</details>

##### Examples

<Tabs>
<TabItem value="example1" label="Fetch user profile">

**Query:**

```graphql
query GetUser($userId: ID!) {
  user(id: $userId) {
    id
    email
    firstName
    lastName
    createdAt
  }
}
```

**Variables:**

```json
{
  "userId": "usr_2N3k4L5m6n7o8p9q"
}
```

**Response (Success):**

```json
{
  "data": {
    "user": {
      "id": "usr_2N3k4L5m6n7o8p9q",
      "email": "sarah.chen@example.com",
      "firstName": "Sarah",
      "lastName": "Chen",
      "createdAt": "2024-01-15T14:30:00Z"
    }
  }
}
```

</TabItem>
<TabItem value="example2" label="User not found">

**Response:**

```json
{
  "data": {
    "user": null
  }
}
```

</TabItem>
</Tabs>

##### Possible Errors

- `UNAUTHORIZED` - Invalid or missing authentication token
- `USER_NOT_FOUND` - User with specified ID does not exist

---

[... continues with all other operations ...]

````

### Front Matter Requirements

Each MDX file should include:

```yaml
---
id: operation-name
title: Operation Name
sidebar_label: operationName
sidebar_position: 1
description: Brief description of the operation
tags: [query, user, core]
---
````

### Directory Structure for Multi-Page

If not using single-page, each operation gets its own file:

```
docs/api/user-management/retrieval/get-user.mdx
```

With `_category_.json` files:

```json
{
  "label": "User Management",
  "position": 1,
  "collapsible": true,
  "collapsed": false,
  "link": {
    "type": "generated-index",
    "description": "User management operations"
  }
}
```

---

## Development Phases

### Phase 0: Foundation (Week 1-2)

**Goals:** Set up project infrastructure

**Tasks:**

- [x] Initialize repository with TypeScript, tests, linting
- [x] Set up build pipeline (tsup)
- [x] Configure CI/CD (GitHub Actions)
- [ ] Create example schemas for testing
- [ ] Write project documentation (README, CONTRIBUTING)
- [ ] Define JSON schemas for metadata files

**Deliverables:**

- Working repository with build/test/lint
- Example schemas and metadata
- Basic documentation

### Phase 1: Core Parsing (Week 3-4)

**Goals:** Parse GraphQL schemas and extract directive metadata

**Tasks:**

- [ ] Implement schema parser using graphql-js
- [ ] Extract custom directives (@docGroup, @docPriority, etc.)
- [ ] Support both SDL files and introspection JSON
- [ ] Validate directive usage
- [ ] Write comprehensive unit tests

**Deliverables:**

- Schema parser module
- Directive extractor
- Test coverage >80%

### Phase 2: Metadata Loading (Week 5)

**Goals:** Load and validate external JSON files

**Tasks:**

- [ ] Implement example file loader
- [ ] Implement error file loader
- [ ] Validate JSON against schemas
- [ ] Merge metadata with parsed schema
- [ ] Handle file discovery (glob patterns)

**Deliverables:**

- Metadata loader module
- JSON validation
- Test coverage >80%

### Phase 3: Data Transformation (Week 6-7)

**Goals:** Build internal documentation model

**Tasks:**

- [ ] Implement grouping logic (@docGroup)
- [ ] Implement sorting logic (@docPriority)
- [ ] Build operation objects with merged metadata
- [ ] Handle type references and inline expansion
- [ ] Create section/subsection hierarchy

**Deliverables:**

- Transformer module
- Internal doc model
- Test coverage >80%

### Phase 4: Docusaurus Adapter (Week 8)

**Goals:** Adapt internal model to Docusaurus conventions

**Tasks:**

- [ ] Generate Docusaurus front matter
- [ ] Determine file paths based on grouping
- [ ] Create _category_.json files
- [ ] Handle autogenerated navigation
- [ ] Support single-page vs multi-page modes

**Deliverables:**

- Docusaurus adapter module
- Navigation generation
- Test coverage >80%

### Phase 5: MDX Generation (Week 9-10)

**Goals:** Generate MDX files from internal templates

**Tasks:**

- [ ] Set up Handlebars template engine (internal only)
- [ ] Create hardcoded templates (operation, section, example)
- [ ] Implement template rendering
- [ ] Add syntax highlighting for code blocks
- [ ] Generate both single-page and multi-page outputs
- [ ] Implement type expansion with collapsible details

**Deliverables:**

- Template engine
- Hardcoded templates for all content types
- MDX generator with multi-page/single-page modes
- Test coverage >80%

**Note:** Template customization deferred to post-MVP

### Phase 6: CLI Implementation (Week 11)

**Goals:** Build command-line interface

**Tasks:**

- [ ] Implement generate command
- [ ] Implement init command (scaffold config and metadata directories)
- [ ] Implement validate command (check schema and metadata)
- [ ] Add progress indicators and logging
- [ ] Add warnings for missing examples
- [ ] Write CLI documentation

**Deliverables:**

- Working CLI
- Commands: generate, init, validate
- Clear warnings when examples missing
- User documentation

**Note:** Auto-generate examples feature deferred to post-MVP

### Phase 7: Integration Testing (Week 12)

**Goals:** End-to-end testing with real schemas

**Tasks:**

- [ ] Test with GitHub GraphQL API schema
- [ ] Test with Shopify GraphQL API schema
- [ ] Test with custom complex schema
- [ ] Verify Docusaurus integration
- [ ] Performance testing (large schemas)

**Deliverables:**

- Integration test suite
- Performance benchmarks
- Bug fixes

### Phase 8: Documentation & Polish (Week 13-14)

**Goals:** Complete documentation and prepare for release

**Tasks:**

- [ ] Write comprehensive README
- [ ] Create getting started guide
- [ ] Write configuration reference
- [ ] Create example projects
- [ ] Record demo video
- [ ] Set up project website

**Deliverables:**

- Complete documentation
- Example projects
- Project website
- Demo video

### Phase 9: Beta Release (Week 15)

**Goals:** Release v0.1.0 beta

**Tasks:**

- [ ] Publish to npm
- [ ] Announce on social media
- [ ] Gather feedback from early adopters
- [ ] Fix critical bugs
- [ ] Iterate based on feedback

**Deliverables:**

- npm package published
- Beta users testing
- Feedback collected

### Phase 10: v1.0 Release (Week 16+)

**Goals:** Stable 1.0 release

**Tasks:**

- [ ] Address beta feedback
- [ ] Finalize API (breaking changes if needed)
- [ ] Complete test coverage (>90%)
- [ ] Performance optimizations
- [ ] Release v1.0.0

**Deliverables:**

- Stable 1.0 release
- Production-ready tool

---

## Post-MVP Roadmap

### Phase 11: Template Customization System (HIGH PRIORITY)

**Goals:** Allow users to customize generated output

**Features:**

- Override individual templates (operation.hbs, section.hbs, etc.)
- Custom Handlebars helpers for common transformations
- Partial templates for injecting custom content
- Template validation to prevent breaking changes

**Rationale:** Most requested feature for branding and custom workflows

**Estimated Effort:** 2-3 weeks

---

### Phase 12: Example Auto-Generation (MEDIUM PRIORITY)

**Goals:** Generate basic examples when user doesn't provide them

**Features:**

- `--generate-examples` CLI flag for opt-in generation
- Smart defaults based on field names (email, firstName, amount, etc.)
- Clear marking that examples are auto-generated
- Documentation on improving auto-generated examples

**Rationale:** Improves onboarding, reduces initial friction

**Estimated Effort:** 1-2 weeks

---

### Phase 13: Additional Framework Support

**Goals:** Support Nextra, Astro Starlight, VitePress

**Approach:**

- Leverage framework-agnostic core
- Build adapter per framework
- Maintain feature parity where possible

**Estimated Effort:** 1-2 weeks per framework

---

### Phase 14: Plugin System

**Goals:** Extensibility without modifying core

**Features:**

- Lifecycle hooks (beforeParse, transformType, afterGenerate)
- Custom directive support
- Custom MDX component injection
- Plugin marketplace/gallery

**Estimated Effort:** 3-4 weeks

---

### Future Considerations

- **Federation Support** - Apollo Federation and schema stitching
- **Internationalization** - Multi-language documentation
- **Interactive Features** - Embedded GraphQL Playground
- **Performance Analysis** - Query cost calculator per operation
- **AI Features** - Auto-generate descriptions, suggest improvements
- **Visual Schema Explorer** - Interactive type graph visualization

---

## Success Metrics

### Technical Metrics

**Code Quality:**

- Test coverage >90%
- No critical bugs at release
- TypeScript strict mode enabled
- All linting rules passing

**Performance:**

- Parse 1000+ type schema in <5 seconds
- Generate 500+ operation docs in <30 seconds
- Generated MDX validates in Docusaurus
- Single-page doc loads in <2 seconds

**Compatibility:**

- Works with Docusaurus 3.x
- Supports Node 18+
- Compatible with major GraphQL schemas (GitHub, Shopify)

### User Adoption Metrics

**Pre-Release:**

- 5+ beta testers
- 3+ example projects created
- Documentation clarity rating >4/5

**Post-Release (3 months):**

- 100+ npm downloads/week
- 50+ GitHub stars
- 5+ contributors
- 3+ community templates

**Post-Release (6 months):**

- 500+ npm downloads/week
- 200+ GitHub stars
- 10+ contributors
- Featured in GraphQL newsletter or conference

### Quality Indicators

**User Feedback:**

- 80%+ would recommend
- Average issue resolution <7 days
- Documentation rated helpful (>4/5)

**Community Health:**

- Active Discord/Slack community
- Regular releases (monthly patch, quarterly minor)
- Responsive to issues (first response <48h)

---

## Decisions Made

### MVP Scope Decisions

The following decisions have been made for the MVP release:

**✅ Q1: Multi-Page Default with Single-Page Option**

- Default: Generate separate MDX files per operation (better Docusaurus integration, scalability)
- Config option: `singlePage: true` for users who prefer single-page docs
- Decision: Provides best of both worlds

**✅ Q2: Type Expansion - 2 Levels with Collapsible Accordions**

- Default: Expand types 2 levels deep inline
- Deeper levels: Use `<details>` tags for on-demand expansion
- Circular references: Track visited types, show link on repeat: `↩️ [See User above](#user)`
- Decision: Balance between detail and readability

**✅ Q4: Circular Reference Handling**

- Strategy: Track visited types + max depth limit (default: 5)
- On circular: Link back to first occurrence with icon
- On max depth: Link to type reference
- Decision: Safe and informative

**✅ Q6: Configuration Format**

- Primary: `.graphqlrc` with `extensions.graphql-docs` key
- Secondary: Support cosmiconfig (graphql-docs.config.js, etc.)
- Decision: GraphQL ecosystem integration with flexibility

**✅ Q8: Error Handling**

- Strategy: Fail fast with clear error messages
- Show exactly what failed and why
- Provide actionable guidance to fix
- Decision: Better developer experience

**❌ Q3: Auto-Generate Examples - NOT in MVP**

- MVP: Users must provide examples manually via JSON
- Warning shown if examples missing
- Post-MVP Recommendation (Medium Priority):
  - Optional `--generate-examples` CLI flag
  - Basic auto-generation with clear "placeholder" warnings
  - Smart defaults based on field names and types
  - Auto-generated examples marked with warning banner
  - See "Post-MVP Roadmap" section for detailed implementation plan
- Decision: Quality over convenience for MVP, but provide path for quick starts post-MVP

**❌ Q5: Template Customization - NOT in MVP**

- MVP: Hardcoded templates (no user customization)
- Post-MVP Recommendation (High Priority - Higher than Q3):
  - Override individual templates (industry standard pattern)
  - Custom Handlebars helpers for extensions
  - Well-documented template data model
  - Versioned template API with migration guides
  - See "Post-MVP Roadmap" section for detailed implementation plan
- Decision: Hardcoded for MVP to reduce complexity, but high priority for next release

**📋 Q7: Versioning - Document Docusaurus Approach**

- No built-in versioning in tool
- Document how to use Docusaurus native versioning
- Provide workflow guide for multi-version APIs
- Decision: Leverage existing tools

**📋 Q9: Federation Support - Post-MVP**

- MVP: Single schema only
- Document workarounds for federated schemas
- Post-MVP: Add @graphql-tools/stitch support
- Decision: Reduce scope for MVP

**📋 Q10: Internationalization - Post-MVP**

- MVP: English only
- Architecture planned to support i18n later
- Post-MVP: Leverage Docusaurus i18n features
- Decision: Focus on core features first

---

## Post-MVP Roadmap

This section details the recommended implementation approaches for features deferred from MVP, ordered by priority.

### High Priority: Template Customization System (Q5)

**Goal:** Allow users to customize documentation output without forking the project.

**Recommended Approach:** Override Individual Templates + Helpers

**Implementation Plan:**

**Phase 1: Template Override System**

```yaml
# .graphqlrc
extensions:
  graphql-docs:
    templates:
      operation: ./custom-templates/operation.hbs
      section: ./custom-templates/section.hbs
      example: ./custom-templates/example.hbs
```

**Features:**

- Users can override specific templates while keeping defaults for others
- Templates use Handlebars syntax (familiar and widely used)
- Versioned template data model with migration guides
- Clear documentation of available data in each template

**Default Templates Provided:**

```
node_modules/@graphql-docs/generator/templates/
├── operation.hbs
├── section.hbs
├── example.hbs
└── type-details.hbs
```

**Phase 2: Custom Helpers**

```javascript
// graphql-docs.config.js
module.exports = {
  templateHelpers: {
    uppercase: (str) => str.toUpperCase(),
    companyLink: (id) => `https://company.com/entities/${id}`,
    formatCurrency: (amount) => `$${amount.toFixed(2)}`,
  },
};
```

**Built-in Helpers:**

- `formatDate` - Format dates with customizable patterns
- `highlight` - Syntax highlighting for code blocks
- `badge` - Generate badges (Query, Mutation, Deprecated)
- `slugify` - Convert text to URL-friendly slugs
- `json` - Pretty-print JSON objects

**Phase 3: Documented Data Model**

```typescript
// Users can rely on this structure
interface OperationTemplateData {
  name: string;
  description: string;
  operationType: 'query' | 'mutation';
  arguments: Argument[];
  returnType: TypeReference;
  examples: Example[];
  errors: ErrorReference | null;
  deprecationReason: string | null; // From native GraphQL @deprecated directive
  tags: string[];
  graphql: GraphQLMetadata;
}
```

**Why This Approach:**

- ✅ Industry standard pattern (used by ESLint, Prettier, others)
- ✅ Balances flexibility with maintainability
- ✅ Safe defaults with escape hatches
- ✅ Most common use cases covered with minimal effort
- ✅ Advanced users can override completely

**Future Enhancements:**

- Partial templates (slot injection points)
- Plugin system for programmatic transformations
- Template marketplace/gallery

---

### Medium Priority: Auto-Generate Examples (Q3)

**Goal:** Reduce friction for getting started by auto-generating placeholder examples.

**Recommended Approach:** Opt-in with Clear Warnings

**Implementation Plan:**

**Phase 1: Basic Auto-Generation**

```bash
# CLI flag for opt-in
graphql-docs generate --generate-examples
```

**Or via config:**

```yaml
# .graphqlrc
extensions:
  graphql-docs:
    autoGenerateExamples: false # Default: off
```

**Generated Example Structure:**

```typescript
function generateExample(operation: Operation): Example {
  return {
    name: `Example ${operation.name}`,
    description: '⚠️ Auto-generated example. Edit this for production!',
    query: generateQueryString(operation),
    variables: generateVariables(operation.arguments),
    response: {
      type: 'success',
      httpStatus: 200,
      body: {
        data: {
          [operation.name]: generateResponseData(operation.returnType),
        },
      },
    },
  };
}
```

**Warning Banner in Docs:**

```markdown
> ⓘ This is an auto-generated example with placeholder data.
> For production, provide realistic examples in
> `docs-metadata/examples/mutations/create-user.json`
```

**Phase 2: Smart Defaults**

- Field name detection (email → "user@example.com", phone → "555-0100")
- Type-based generation (String → "example", Int → 42, Boolean → true)
- Enum → first value
- Lists → array with 1-2 items
- Nested objects → recursive generation with max depth

**Phase 3: Enhanced Generation (Optional)**

```yaml
# .graphqlrc
extensions:
  graphql-docs:
    autoGenerateExamples: true
    exampleGeneration:
      useFaker: true # Use faker.js for realistic data
      maxDepth: 3
      customGenerators:
        Email: './generators/email.js'
        PhoneNumber: './generators/phone.js'
```

**Why This Approach:**

- ✅ Lowers barrier to entry for trying the tool
- ✅ Clear that auto-generated examples are placeholders
- ✅ Opt-in prevents accidental reliance on fake data
- ✅ Provides path to quick documentation
- ✅ Users encouraged to provide real examples for production

**Important Warnings:**

- Auto-generated examples should never be used in production docs
- Always marked with clear warning banners
- Encourage users to replace with real-world examples
- Focus on demonstration value, not accuracy

---

### Lower Priority Items

**Q7: API Versioning Support**

- Recommendation: Document Docusaurus native versioning workflow
- Provide guides for multi-version API documentation
- Post-MVP: Add convenience features for version management

**Q9: GraphQL Federation Support**

- MVP: Single schema only
- Document workarounds for federated schemas
- Post-MVP: Add @graphql-tools/stitch support

**Q10: Internationalization**

- MVP: English only
- Architecture supports i18n
- Post-MVP: Leverage Docusaurus i18n system

**Framework Support:**

- MVP: Docusaurus only
- Future: Nextra, Starlight, VitePress, custom

**Interactive Features:**

- GraphQL Playground integration per operation
- Live schema explorer
- Interactive type navigation

---

## Outstanding Questions

### Minor Clarifications Needed

These minor details can be decided during implementation:

**Path naming convention:**
Should operation files be `get-user.mdx` (kebab-case) or `getUser.mdx` (camelCase)?

- Recommendation: kebab-case (better URLs, more standard)
- Decision: Phase 5 (MDX Generation)

**Default file organization:**
Should we generate overview pages for each section automatically?

- Recommendation: Yes, with section description from first operation
- Decision: Phase 5 (MDX Generation)

**Badge styling:**
What visual style for Query/Mutation badges?

- Recommendation: Follow Docusaurus admonition colors (blue/purple)
- Decision: Phase 5 (MDX Generation)

---

## Appendix A: Configuration Example

**.graphqlrc:**

```yaml
schema: './schema/schema.graphql'

extensions:
  graphql-docs:
    # Output configuration
    outputDir: './docs/api'
    framework: docusaurus

    # Generation mode
    singlePage: false # true for single-page output

    # Metadata
    metadataDir: './docs-metadata'
    examplesDir: './docs-metadata/examples'
    errorsDir: './docs-metadata/errors'

    # Content options
    includeDeprecated: true
    skipTypes: ['InternalType']

    # Navigation
    generateSidebar: true
    sidebarFile: './sidebars.js'

    # Type expansion
    typeExpansion:
      maxDepth: 5
      defaultLevels: 2
      showCircularReferences: true
```

**Note:** Template customization will be available in post-MVP releases.

## Appendix B: Template Example (Internal Implementation)

**Note:** For MVP, templates are hardcoded and not customizable by users. This shows the internal structure used to generate MDX files. Template customization will be added in post-MVP releases.

**templates/operation.hbs:**

````handlebars
---
id: {{id}}
title: {{title}}
sidebar_label: {{sidebarLabel}}
{{#if tags}}
tags: [{{#each tags}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}]
{{/if}}
---

# {{name}}

{{#if deprecationReason}}
:::warning Deprecated
{{deprecationReason}}
:::
{{/if}}

{{description}}

## Request

**Endpoint:** `{{graphql.endpoint}}`
**Method:** `{{graphql.method}}`
**Operation Type:** {{operationType}}

{{#if arguments}}
### Arguments

{{#each arguments}}
- `{{name}}` ({{type}}) - {{description}}
  {{#if defaultValue}}Default: `{{defaultValue}}`{{/if}}
{{/each}}
{{/if}}

### Returns

`{{returnType.name}}` - {{returnType.description}}

## Examples

{{#each examples}}
### {{name}}

{{description}}

**Query:**
```graphql
{{query}}
````

{{#if variables}}
**Variables:**

```json
{{{json variables}}}
```

{{/if}}

**Response:**

```json
{{{json response.body}}}
```

{{/each}}

{{#if errors}}

## Possible Errors

{{#each errors.errors}}

- **{{code}}** - {{message}}
  {{#if resolution}}_Resolution:_ {{resolution}}{{/if}}
  {{/each}}
  {{/if}}

```

---

## Version History

**Version 1.3 - Simplified Deprecation Handling**

**Changes from Version 1.2:**

1. **Removed @docDeprecated custom directive** - Deprecation now uses native GraphQL `@deprecated` directive
   - Simpler implementation using standard GraphQL specification
   - No need for custom directive parsing for deprecation
   - `deprecationReason` field replaces `DeprecationInfo` object

2. **Updated sections:**
   - Added "Deprecation Handling" section explaining native @deprecated usage
   - Updated Operation interface to use `deprecationReason: string | null`
   - Updated template examples to use simplified deprecation
   - Removed `alternative` and `since` fields (use deprecation reason text instead)

---

**Version 1.2 - Updated with Detailed Post-MVP Roadmap**

**Changes from Version 1.1:**

1. **Post-MVP Roadmap Added:**
   - Detailed implementation plan for Template Customization (Q5) - HIGH PRIORITY
   - Detailed implementation plan for Auto-Generate Examples (Q3) - MEDIUM PRIORITY
   - Clear priority ordering confirmed by stakeholder feedback
   - Comprehensive approach for each deferred feature

2. **Q3 (Auto-Generate Examples) - Enhanced Specification:**
   - Confirmed NOT in MVP per stakeholder feedback
   - Added detailed 3-phase implementation plan
   - Opt-in approach with clear warning system
   - Smart defaults with field name detection
   - Optional faker.js integration for future

3. **Q5 (Template Customization) - Enhanced Specification:**
   - Confirmed NOT in MVP but HIGH priority for post-MVP
   - Added detailed implementation plan with override system
   - Custom Handlebars helpers documented
   - Versioned template data model approach
   - Industry standard pattern (used by ESLint, Prettier)

4. **Clarified Priorities:**
   - Template customization > Auto-generate examples (confirmed by stakeholder)
   - Both features have detailed implementation roadmaps
   - Clear separation between MVP (hardcoded) and post-MVP (flexible)

5. **Updated Sections:**
   - Executive Summary - clarified post-MVP priorities
   - Secondary Goals - restructured with HIGH/MEDIUM priority labels
   - Added comprehensive "Post-MVP Roadmap" section
   - Enhanced Q3 and Q5 scope decisions with detailed plans

---

**Version 1.1 - Updated Based on Decision Review**

**Changes from Version 1.0:**

1. **Decisions Finalized:**
   - Q1 (Single vs Multi-page): Multi-page default with single-page option
   - Q2 (Type Expansion): 2 levels + collapsible accordions
   - Q4 (Circular References): Track visited + max depth
   - Q6 (Config Format): GraphQL Config + cosmiconfig
   - Q8 (Error Handling): Fail fast with clear messages

2. **Scope Changes:**
   - ❌ **Removed from MVP:** Template customization (moved to post-MVP, high priority)
   - ❌ **Removed from MVP:** Auto-generate examples (moved to post-MVP, medium priority)
   - ✅ **Clarified:** Multi-page is default, single-page is config option
   - ✅ **Added:** Post-MVP roadmap with clear priorities

3. **Updated Sections:**
   - Executive Summary - clarified MVP scope
   - Goals and Non-Goals - moved template/example features to post-MVP
   - Core Features - merged single-page into operation-first feature
   - Tech Stack - noted Handlebars is internal-only for MVP
   - Configuration Example - removed template customization options
   - Development Phases - updated Phase 5 and 6 to remove deferred features
   - Added Post-MVP Roadmap with priorities

4. **Outstanding Questions:**
   - Resolved major architectural decisions
   - Only minor implementation details remain

---

**End of Product Requirements Document**

*This PRD is a living document and will be updated as decisions are made and the project evolves.*
```
