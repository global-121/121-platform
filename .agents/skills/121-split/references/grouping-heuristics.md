# Grouping heuristics

Goal: every chunk is reviewable on its own (~400 changed lines, excluding generated files), has one intent, and depends only on earlier chunks (or on nothing, so it can merge to `main` alone).

## Default stack order

1. Pure refactors, renames, moves (no behaviour change), when they separate at file level; keep a refactor with its feature when splitting it out would need hunk-level splits
2. Database migrations and entities
3. 121-service logic, DTOs, endpoints (with their unit/integration tests)
4. Portal API services and domain code (with unit tests)
5. Portal components/pages (with `messages.xlf` changes from `npm run extract-i18n`)
6. e2e tests, when too large to travel with the chunk they cover
7. Docs and configuration

Chunks 1-4 are usually invisible to users and safe to land early; user-facing UI (5) goes last.

Deviate when the diff suggests a better intent-based grouping (e.g. two independent features: one stack each, or one chunk per feature slice). Independent features should not depend on each other.

## Rules

- Unit and integration tests travel with the code they cover.
- A file that is imported by another chunk must be in an earlier-or-same chunk.
- A chunk that needs another chunk at runtime depends on it, even without an import: Portal code calling a new or changed endpoint, code relying on a migration, code using a new dependency. Stack it after that chunk.
- Two chunks that touch the same file, including a generated file such as `messages.xlf`, are not independent: they would conflict when merged. Stack them.
- Mechanical, noisy changes (formatting, renames) get their own chunk so reviewers can skim them.
- Dependency updates (`package.json`, lockfiles) get their own chunk.
- Never exceed ~400 lines if a natural seam exists; accept larger only when the files cannot be separated, and say why.
- If module imports change in 121-service, include the regenerated `services/121-service/module-dependencies.md` in that chunk.

## Generated files (excluded from line counts)

Keep this list in sync with the excludes in `scripts/measure.sh`.

- `interfaces/portal/src/locale/messages.xlf`
- `services/121-service/module-dependencies.md`
- `package-lock.json` (at any level)
- Test snapshots (`__snapshots__/`, `*.snap`)

## Branch naming

`<username>/<feature>-<n>-<slug>`, e.g. `jane-doe/otp-1-service-endpoints`, `jane-doe/otp-2-portal-form`.
