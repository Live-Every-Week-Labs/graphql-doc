# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-24

### Added

- Initial public release of `@graphql-doc/generator`.
- Operation-first GraphQL documentation generation pipeline.
- Docusaurus adapter with multi-page and single-page output modes.
- CLI commands for project initialization, validation, and generation.
- Metadata-driven examples with schema cross-validation and coverage checks.
- React component library for rendering generated operation and type documentation.

### Security

- SSRF protections for remote schema loading.
- MDX sanitization controls for unsafe description rendering.
- File output safeguards against traversal and unsafe write targets.
