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

## White-Label Theming

This project is a white-label platform. Visual identity (colors, logo, site name) is configured entirely via environment variables — no code changes needed to rebrand for a new tenant.

### Token Resolution Chain

Brand colors flow through four layers:

```
.env.local  (hex values set per tenant)
  → src/lib/env.client.ts  (validates hex format via Zod)
    → src/lib/siteConfig.ts  (exposes as siteConfig.theme.*)
      → src/app/layout.tsx  (server-renders a <style> tag into <head>)
        → :root { --brand-primary / --brand-secondary / --brand-primary-foreground }
          → src/app/globals.css :root  (--primary: var(--brand-primary))
            → @theme inline  (--color-primary: var(--primary))
              → Tailwind utilities  (bg-primary, text-primary, ring-primary, etc.)
```

The `<style>` tag is **server-rendered** — values are baked into HTML at request time, not injected by client JS.

### Env Vars That Drive the Theme

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_PRIMARY_COLOR` | Brand primary — header, footer, badges, headings | `"#13294b"` |
| `NEXT_PUBLIC_SECONDARY_COLOR` | Brand secondary — accent labels, left-border markers | `"#e4002b"` |
| `NEXT_PUBLIC_PRIMARY_FOREGROUND` | Text color on primary backgrounds | `"#ffffff"` |

All three require quoted hex values (`"#RRGGBB"`). The unquoted `#` is treated as a comment in `.env` files.

### shadcn Token Mapping

`--primary` and `--primary-foreground` in `globals.css` are mapped to the brand vars, so all shadcn components that use `bg-primary`, `text-primary`, or `text-primary-foreground` inherit the tenant's brand automatically:

- **Button** (default variant) — brand primary background
- **Badge** (default variant) — brand primary background
- **Focus rings** — brand primary

`--brand-secondary` is exposed as a Tailwind utility (`text-brand-secondary`, `bg-brand-secondary`, `border-brand-secondary`) for explicit accent use. It intentionally does **not** override `--accent` to avoid making all hover states chromatic.

### Dark Mode

The `.dark` block in `globals.css` is intentionally **not** overridden with brand colors. Dark mode uses shadcn's default light-on-dark primary. Brand identity in dark mode comes from explicit `text-brand-secondary` / `bg-brand-secondary` usage. No dark mode toggle is wired up yet.

### Where Brand Colors Appear

| Element | Token used |
|---|---|
| Header background | `bg-primary` |
| Header bottom border | `border-brand-secondary` |
| Nav link hover | `hover:text-brand-secondary` |
| Footer background | `bg-primary` |
| "Featured" section label | `text-brand-secondary`, `border-brand-secondary` |
| PostCard category badges | `bg-primary` (via `variant="default"`) |
| Sidebar category badge hover | `hover:bg-primary` |
| Post body headings | `--tw-prose-headings: var(--brand-primary)` |
| Post body links | `--tw-prose-links: var(--brand-secondary)` |

### Rules for Theming Work

- **Never hardcode hex values in components.** Use `bg-primary`, `text-brand-secondary`, etc.
- **Never read brand colors from `siteConfig` directly in components.** The CSS variable chain is the source of truth.
- To add a new brand-driven element, use `bg-primary` / `text-primary` (already wired) or `bg-brand-secondary` / `text-brand-secondary` (explicit secondary slot).
- If you need a new configurable color (e.g. a tertiary accent), follow the same pattern: add an env var → validate in `env.client.ts` → add to `siteConfig.theme` → inject in `layout.tsx` `<style>` tag → map into `globals.css`.

## Quick Checklist (Before Merge)

- Architecture boundaries respected.
- No business logic in UI/persistence layers.
- No direct `process.env` usage outside env module.
- No runtime barrel re-exports.
- Immutable updates used for objects/arrays.
- No hardcoded hex color values in components — use CSS token utilities.
- Lint, types, and tests are passing.
