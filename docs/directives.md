# Custom Directives Guide

The GraphQL Documentation Generator provides custom directives to control how your operations are organized and displayed in the generated documentation.

## Overview

| Directive      | Purpose                                   |
| :------------- | :---------------------------------------- |
| `@docGroup`    | Group operations into logical sections    |
| `@docPriority` | Control ordering within a section         |
| `@docTags`     | Add tags for filtering and categorization |
| `@docIgnore`   | Exclude fields/types from generated docs  |

## @docGroup

Groups operations into logical sections for documentation organization.

### Syntax

```graphql
directive @docGroup(name: String!, order: Int, subsection: String) on FIELD_DEFINITION
```

### Arguments

| Argument     | Type      | Required | Description                                 |
| :----------- | :-------- | :------- | :------------------------------------------ |
| `name`       | `String!` | Yes      | The name of the documentation section       |
| `order`      | `Int`     | No       | Display order (lower numbers first)         |
| `subsection` | `String`  | No       | Optional subsection within the main section |

### Sorting Behavior

Sections are sorted using a two-tier system:

1. **Ordered sections first**: Sections with an `order` value are sorted numerically (ascending)
2. **Unordered sections after**: Sections without an `order` value are sorted alphabetically

**Example:**

```graphql
type Query {
  # Ordered sections (appear first, sorted by order)
  getUser: User @docGroup(name: "User Management", order: 1)
  getPayment: Payment @docGroup(name: "Payments", order: 2)

  # Unordered sections (appear after, sorted alphabetically)
  getAnalytics: Analytics @docGroup(name: "Analytics")
  getBilling: Billing @docGroup(name: "Billing")
  getReports: Report @docGroup(name: "Reports")
}
```

**Resulting order:**

1. User Management (order: 1)
2. Payments (order: 2)
3. Analytics (alphabetical)
4. Billing (alphabetical)
5. Reports (alphabetical)

### Subsections

Use the `subsection` argument to create nested groupings:

```graphql
type Query {
  getUser: User @docGroup(name: "User Management", order: 1, subsection: "Retrieval")

  searchUsers: [User] @docGroup(name: "User Management", order: 1, subsection: "Retrieval")
}

type Mutation {
  createUser: User @docGroup(name: "User Management", order: 1, subsection: "Modification")

  updateUser: User @docGroup(name: "User Management", order: 1, subsection: "Modification")
}
```

This generates a structure like:

```
User Management/
├── Retrieval/
│   ├── getUser
│   └── searchUsers
└── Modification/
    ├── createUser
    └── updateUser
```

### Uncategorized Operations

Operations without a `@docGroup` directive are placed in an "Uncategorized" section at the end.

### Excluding Groups

If you want to keep a group out of published docs, you can exclude it via configuration:

```yaml
extensions:
  graphql-docs:
    excludeDocGroups:
      - Internal
      - Experimental
```

---

## @docPriority

Sets the display priority for ordering operations within a section.

### Syntax

```graphql
directive @docPriority(level: Int!) on FIELD_DEFINITION
```

### Arguments

| Argument | Type   | Required | Description                                 |
| :------- | :----- | :------- | :------------------------------------------ |
| `level`  | `Int!` | Yes      | Priority level (lower numbers appear first) |

### Usage

```graphql
type Query {
  # Most important operation - appears first
  getUser: User @docGroup(name: "Users") @docPriority(level: 1)

  # Secondary operation - appears second
  getUserProfile: UserProfile @docGroup(name: "Users") @docPriority(level: 2)

  # Least important - appears last
  getUserSettings: UserSettings @docGroup(name: "Users") @docPriority(level: 10)
}
```

Operations without `@docPriority` default to level `999` and appear after prioritized operations.

---

## @docTags

Adds tags for filtering and categorizing operations.

### Syntax

```graphql
directive @docTags(tags: [String!]!) on FIELD_DEFINITION
```

### Arguments

| Argument | Type         | Required | Description                     |
| :------- | :----------- | :------- | :------------------------------ |
| `tags`   | `[String!]!` | Yes      | List of tags for this operation |

### Usage

```graphql
type Query {
  getUser: User @docTags(tags: ["users", "read", "public"])

  getAdminUsers: [User] @docTags(tags: ["users", "read", "admin-only"])
}

type Mutation {
  createUser: User @docTags(tags: ["users", "write", "admin-only"])
}
```

Tags are included in the generated MDX front matter and can be used for:

- Filtering in Docusaurus
- Categorizing operations by capability (read/write)
- Marking access levels (public, admin-only)
- Any custom categorization you need

---

## @docIgnore

Exclude items from generated documentation. This is useful for hiding fields, arguments, or entire
types without changing your schema.

### Syntax

```graphql
directive @docIgnore on FIELD_DEFINITION | ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION | ENUM_VALUE | OBJECT | INPUT_OBJECT | ENUM | INTERFACE | UNION | SCALAR
```

### Usage Examples

Hide a field on an object type:

```graphql
type Transaction {
  id: ID!
  device_id: String @docIgnore
}
```

Hide an argument on an operation:

```graphql
type Query {
  transactions(includeDevice: Boolean @docIgnore): [Transaction!]!
}
```

Hide an enum value:

```graphql
enum Environment {
  PROD
  STAGING @docIgnore
}
```

Hide an entire type:

```graphql
type InternalDebug @docIgnore {
  traceId: String
}
```

---

## Complete Example

Here's a complete example showing all directives working together:

```graphql
type Query {
  """
  Get a user by their unique identifier.
  """
  getUser(id: ID!): User
    @docGroup(name: "User Management", order: 1, subsection: "Queries")
    @docPriority(level: 1)
    @docTags(tags: ["users", "read"])

  """
  Search for users matching the given criteria.
  """
  searchUsers(query: String!, limit: Int): [User!]!
    @docGroup(name: "User Management", order: 1, subsection: "Queries")
    @docPriority(level: 2)
    @docTags(tags: ["users", "read", "search"])

  """
  Get the current user's profile.
  """
  me: User
    @docGroup(name: "User Management", order: 1, subsection: "Queries")
    @docPriority(level: 3)
    @docTags(tags: ["users", "read", "auth-required"])
}

type Mutation {
  """
  Create a new user account.
  """
  createUser(input: CreateUserInput!): User!
    @docGroup(name: "User Management", order: 1, subsection: "Mutations")
    @docPriority(level: 1)
    @docTags(tags: ["users", "write", "admin-only"])

  """
  Update an existing user's information.
  """
  updateUser(id: ID!, input: UpdateUserInput!): User!
    @docGroup(name: "User Management", order: 1, subsection: "Mutations")
    @docPriority(level: 2)
    @docTags(tags: ["users", "write"])
}
```

---

## Adding Directives to Your Schema

You can define the directives in your schema, or let the generator handle them automatically:

```graphql
# Optional: Define directives explicitly in your schema
directive @docGroup(name: String!, order: Int, subsection: String) on FIELD_DEFINITION

directive @docPriority(level: Int!) on FIELD_DEFINITION

directive @docTags(tags: [String!]!) on FIELD_DEFINITION

# Your schema types...
type Query {
  getUser(id: ID!): User @docGroup(name: "Users", order: 1)
}
```

The generator will recognize these directives whether they're explicitly defined or not.
