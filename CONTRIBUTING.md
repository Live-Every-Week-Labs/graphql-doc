# Contributing to GraphQL Docs Generator

Thank you for your interest in contributing!

## Development Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/austinzani/graphql-doc.git
    cd graphql-doc
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Build the project:**
    ```bash
    npm run build
    ```

## Running Tests

We use `vitest` for testing.

- **Run all tests:**

  ```bash
  npm test
  ```

- **Run end-to-end tests:**
  ```bash
  npm run test:e2e
  ```

## Project Structure

- `src/core`: Core logic (parser, transformer, renderer, adapters).
- `src/cli`: CLI implementation.
- `src/templates`: Handlebars templates.
- `src/test`: Integration and E2E tests.

## Submitting a Pull Request

1.  Fork the repository.
2.  Create a new branch for your feature or fix.
3.  Commit your changes with descriptive messages.
4.  Push your branch and submit a Pull Request.
