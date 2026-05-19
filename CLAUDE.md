# CLAUDE.md

This file gives coding agents a concise set of project conventions. It is intended to keep architecture and code style consistent as the codebase grows.

## Core Principles

- Optimize for readability and maintainability over cleverness.
- Keep business logic pure and testable.
- Favor explicit imports, explicit names, and predictable file placement.
- Prefer small, composable functions over large multi-purpose blocks.
- Make changes that are easy to reason about and easy to review.

## Architecture

### Layered Structure

Use a clean, dependency-safe structure:

- `src/app/` - Routes, layouts, API handlers, and framework wiring.
- `src/components/` - UI-only components. No data fetching or business logic.
- `src/application/` - Orchestration and use-case composition across domains.
- `src/domain/` - Pure business rules, models, and domain use cases.
- `src/persistence/` - Data access and DTO mapping (DB, CMS, third-party APIs).
- `src/services/` - External integrations and service clients.
- `src/utils/` - Generic helpers with no domain knowledge.
- `src/lib/` - Shared initializers/configuration (SDKs, environment wiring).

### Dependency Direction

Keep dependencies flowing inward:

- `app` -> `application` -> `domain` + `persistence` + `services`
- `domain` must not depend on framework code, UI code, or persistence details.
- `components` should depend on domain/application outputs, never persistence directly.
- `persistence` should not contain business decisions; only retrieval/transformation.

### Domain and Application Separation

- Put pure business rules in `domain`.
- Put multi-step workflows and coordination in `application`.
- Domain functions should be deterministic and easy to unit test.
- Avoid leaking transport or framework types into domain logic.

### API and Data Boundaries

- Validate external input at boundaries (API handlers, service adapters).
- Convert transport/DTO types into domain-friendly structures early.
- Return clear, typed outputs from each layer.
- Keep side effects isolated near the edges of the system.

### Imports and Barrel Files

- Import runtime values directly from source files.
- Use barrel files only for type-only re-exports.
- Avoid wildcard exports (`export *`).
- Keep module ownership clear and avoid cross-layer shortcuts.

## Code Style

### General Style

- Prefer TypeScript everywhere.
- Use `const` by default; avoid `let` unless mutation is required.
- Use single quotes for strings (except template literals).
- Keep functions focused and named by intent.
- Use early returns/guard clauses to reduce nesting.

### Functional and Immutable Patterns

- Prefer pure functions and minimal side effects.
- Do not mutate input objects or arrays; return new values.
- Use array methods (`map`, `filter`, `reduce`) over manual loops when practical.
- Keep transformation logic declarative and easy to scan.

### Control Flow and Conditions

- Use `===` and `!==`.
- Avoid nested ternaries; extract helper functions when logic grows.
- Prefer `switch` for multiple discrete branches.
- Keep branching shallow and explicit.

### Logging and Error Handling

- Never use `console.log` in app code.
- Use a centralized logger utility.
- Use `error` logs for fatal failures; use `warn` for recoverable issues.
- Never leave `catch` blocks empty; handle, log, or rethrow with context.

### Utility Checks

- Use shared type-check/guard utilities instead of manual `typeof`/null checks.
- Prefer explicit helpers like `isNil`, `isNonEmptyString`, and `isNonEmptyArray`.
- Keep utility behavior consistent and covered by tests.

### Naming and File Conventions

- Components and component folders: PascalCase (`UserCard.tsx`, `UserCard/`).
- Non-component files/folders: camelCase (`buildUserPath.ts`, `searchFilters/`).
- Domain model file pattern: `{entity}.model.ts`.
- Test files mirror source naming with `.test.ts` or `.test.tsx`.

### Environment Access

- Do not read `process.env` directly in feature code.
- Use a centralized environment module with validation.
- Separate client-safe and server-only variables clearly.

## Testing Expectations

- Add or update tests for behavior changes.
- Unit test domain logic and pure utilities first.
- Mock only true external boundaries (network, DB, third-party SDKs).
- Include negative/error-path test cases, not only happy paths.

## PR and Review Expectations

- Keep PRs focused, small, and reviewable.
- Explain intent and tradeoffs in PR descriptions.
- Ensure lint, type checks, and tests pass before merge.
- Review for architecture boundary violations and hidden side effects.

## Quick Checklist (Before Merge)

- Architecture boundaries respected.
- No business logic in UI/persistence layers.
- No direct `process.env` usage outside env module.
- No runtime barrel re-exports.
- Immutable updates used for objects/arrays.
- Lint, types, and tests are passing.
