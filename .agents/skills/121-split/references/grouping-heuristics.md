# Grouping heuristics

Goal: every chunk is reviewable on its own (~400 changed lines, excluding generated files), has one intent, and builds on the previous chunk.

## Default stack order

1. Pure refactors, renames, moves (no behaviour change)
2. Database migrations and entities
3. 121-service logic, DTOs, endpoints (with their unit/integration tests)
4. Portal API services and domain code (with unit tests)
5. Portal components/pages (with `messages.xlf` changes from `npm run extract-i18n`)
6. e2e tests
7. Docs and configuration

Deviate when the diff suggests a better intent-based grouping (e.g. two independent features: one stack each, or one chunk per feature slice). Independent features should not depend on each other.

## Rules

- Tests travel with the code they cover.
- A file that is imported by another chunk must be in an earlier-or-same chunk.
- Mechanical, noisy changes (formatting, renames) get their own chunk so reviewers can skim them.
- Dependency updates (`package.json`, lockfiles) get their own chunk.
- Never exceed ~400 lines if a natural seam exists; accept larger only when the files cannot be separated, and say why.
- If module imports change in 121-service, include the regenerated `services/121-service/module-dependencies.md` in that chunk.

## Generated files (excluded from line counts)

- `interfaces/portal/src/locale/messages.xlf`
- `services/121-service/module-dependencies.md`
- `package-lock.json` and other lockfiles
- Test snapshots (`__snapshots__/`, `*.snap`)

## Branch naming

`<username>/<feature>-<n>-<slug>`, e.g. `jane-doe/otp-1-service-endpoints`, `jane-doe/otp-2-portal-form`.
