# Testing Guide

We use [Vitest](https://vitest.dev/) for testing.

## Test Layout Convention

- Unit tests are co-located with source files under `src/**` (for example `src/core/foo.test.ts`).
- CLI/e2e tests live under `src/test/`.
- `tests/` is reserved for shared fixtures and test assets.

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm test -- --watch
```

### Run a specific test file

```bash
npm test src/path/to/test.ts
```

### Run tests matching a filter

```bash
npm test -t "filter string"
```
