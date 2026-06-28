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

**Every code change must include tests.** Adding or modifying a function without a corresponding test file update is not acceptable. No exceptions.

### What to test

- **`src/domain/`** — pure functions, mappers, and utilities: always unit tested, no mocks needed.
- **`src/application/`** — use cases: mock repository/service boundaries with `vi.mock`; test orchestration logic and all `null`/not-found branches.
- **`src/persistence/mappers/`** — DTO-to-domain mappers: always unit tested with fixture DTOs, no mocks needed.
- **`src/utils/`** — helpers: always unit tested.
- **`src/components/`** — UI components: not required unless they contain logic (validation, derived state). Pure rendering components do not need tests.

### Rules

- Test files live next to the source file they cover: `foo.ts` → `foo.test.ts`.
- Mock only true external boundaries: network (`fetch`), database, Next.js cache (`revalidateTag`), third-party SDKs.
- Always cover the negative/error path: not-found returns, failed fetches, invalid inputs.
- **TypeScript types are not enforced at runtime.** Any data that crosses a system boundary (API response, form submission, CMS payload) can arrive malformed. Test that mappers and validators handle missing fields, `null`, `undefined`, and unexpected values gracefully — do not assume the shape is correct just because the type says so.
- Do not test TypeScript types — only runtime behavior.
- Use `vi.mock` at module level; import mocked functions after the mock declaration.
- Cast minimal fixture objects with `as any` rather than building full DTO shapes when the missing fields are irrelevant to the test.

### Running tests

- `npm run test:run` — single run, used before committing
- `npm test` — watch mode during development
- `npm run test:coverage` — coverage report (targets `src/domain/**`, `src/utils/**`, `src/application/**`)

## Linting and Formatting

ESLint, Prettier, and TypeScript are configured. Run the relevant scripts before pushing:

- `npm run lint` — check for lint errors
- `npm run lint:fix` — auto-fix lint errors
- `npm run format` — auto-format all files
- `npm run typecheck` — type-check without emitting

### Pre-commit Hook

Husky + lint-staged run automatically on every commit. Staged files are linted and formatted before the commit lands:

- `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` — ESLint (auto-fix) + Prettier
- `.json`, `.css`, `.md` — Prettier

The hook is installed via the `prepare` npm script. Any contributor who runs `npm install` gets it automatically — no manual setup needed.

Type-checking is intentionally excluded from the pre-commit hook (too slow); run `npm run typecheck` manually or rely on CI.

### Pre-push Hook

A `pre-push` hook runs `npm run test:run` before every push. Pushes are blocked if any test fails.

### Commit Message Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). The `commit-msg` hook enforces this automatically via `commitlint`.

**Format:** `<type>(<optional scope>): <description>`

**Allowed types:**

| Type       | When to use                                     |
| ---------- | ----------------------------------------------- |
| `feat`     | A new feature                                   |
| `fix`      | A bug fix                                       |
| `docs`     | Documentation changes only                      |
| `style`    | Formatting, missing semicolons, etc.            |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf`     | Performance improvement                         |
| `test`     | Adding or updating tests                        |
| `build`    | Build system or dependency changes              |
| `ci`       | CI/CD configuration changes                     |
| `chore`    | Maintenance tasks (e.g. version bumps, tooling) |
| `revert`   | Reverts a previous commit                       |

**Examples:**

```
feat: add tag filtering to post list
fix(auth): handle expired session tokens
docs: update environment variable table
test(domain): add edge cases for slug builder
chore: upgrade Next.js to 16.3
refactor(persistence): extract DTO mapper to own file
feat!: replace CMS adapter — breaking change
```

Append `!` after the type/scope to signal a breaking change.

## PR and Review Expectations

- Keep PRs focused, small, and reviewable.
- Explain intent and tradeoffs in PR descriptions.
- Ensure lint, type checks, and tests pass before merge.
- Review for architecture boundary violations and hidden side effects.

## White-Label Theming

This project is a white-label platform. Visual identity (colors, logo, site name, and favicons) is configured entirely via environment variables — no code changes needed to rebrand for a new tenant.

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

| Variable                         | Purpose                                              | Example     |
| -------------------------------- | ---------------------------------------------------- | ----------- |
| `NEXT_PUBLIC_PRIMARY_COLOR`      | Brand primary — header, footer, badges, headings     | `"#13294b"` |
| `NEXT_PUBLIC_SECONDARY_COLOR`    | Brand secondary — accent labels, left-border markers | `"#e4002b"` |
| `NEXT_PUBLIC_PRIMARY_FOREGROUND` | Text color on primary backgrounds                    | `"#ffffff"` |

All three require quoted hex values (`"#RRGGBB"`). The unquoted `#` is treated as a comment in `.env` files.

### Favicon and Logo Env Vars

| Variable                    | Purpose                                     | Example                                |
| --------------------------- | ------------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SITE_LOGO_URL` | Logo shown in header (client-safe)          | `/raices-cuervas/logo-main.png`        |
| `SITE_FAVICON_URL`          | Browser tab favicon (server-only)           | `/raices-cuervas/favicon.ico`          |
| `SITE_APPLE_TOUCH_ICON_URL` | iOS home screen icon (server-only)          | `/raices-cuervas/apple-touch-icon.png` |
| `SITE_ICON_192_URL`         | PWA icon 192×192 for manifest (server-only) | `/raices-cuervas/favicon-192.png`      |
| `SITE_ICON_512_URL`         | PWA icon 512×512 for manifest (server-only) | `/raices-cuervas/favicon-512.png`      |

All four favicon vars are optional — they fall back to `/favicon.ico` if unset.

**Tenant asset convention:** Place all brand assets for a tenant under `public/<tenant-slug>/` and point env vars to relative paths (e.g. `/raices-cuervas/favicon.ico`). No code changes required for new tenants — add the folder and set the vars.

**Logo rendering:** Logos render in their natural colors via `src/components/layout/SiteLogo.tsx`. Provide a logo version that is legible on the dark primary header background. Avoid relying on CSS filters to adapt logo color.

### shadcn Token Mapping

`--primary` and `--primary-foreground` in `globals.css` are mapped to the brand vars, so all shadcn components that use `bg-primary`, `text-primary`, or `text-primary-foreground` inherit the tenant's brand automatically:

- **Button** (default variant) — brand primary background
- **Badge** (default variant) — brand primary background
- **Focus rings** — brand primary

`--brand-secondary` is exposed as a Tailwind utility (`text-brand-secondary`, `bg-brand-secondary`, `border-brand-secondary`) for explicit accent use. It intentionally does **not** override `--accent` to avoid making all hover states chromatic.

### Dark Mode

The `.dark` block in `globals.css` is intentionally **not** overridden with brand colors. Dark mode uses shadcn's default light-on-dark primary. Brand identity in dark mode comes from explicit `text-brand-secondary` / `bg-brand-secondary` usage. No dark mode toggle is wired up yet.

### Where Brand Colors Appear

| Element                      | Token used                                       |
| ---------------------------- | ------------------------------------------------ |
| Header background            | `bg-primary`                                     |
| Header bottom border         | `border-brand-secondary`                         |
| Nav link hover               | `hover:text-brand-secondary`                     |
| Footer background            | `bg-primary`                                     |
| "Featured" section label     | `text-brand-secondary`, `border-brand-secondary` |
| PostCard category badges     | `bg-primary` (via `variant="default"`)           |
| Sidebar category badge hover | `hover:bg-primary`                               |
| Post body headings           | `--tw-prose-headings: var(--brand-primary)`      |
| Post body links              | `--tw-prose-links: var(--brand-secondary)`       |

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
- Tests added or updated for every changed function (`npm run test:run` passes).
- Lint, types, and tests are passing.
- Commit message follows the Conventional Commits format.
