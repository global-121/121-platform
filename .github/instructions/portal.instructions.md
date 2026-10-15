---
description: 'Use when writing or changing Angular code in interfaces/portal: components, pages, domains, api services, signals, templates, Tailwind styling and PrimeNG usage.'
applyTo: 'interfaces/portal/src/**'
---

# Portal instructions

Rules from the [Portal Development Guidelines](../../docs/guidelines/portal-development.md), tagged with their section. The guidelines are leading and hold the rationale and examples. General rules (naming, destructured parameters, early returns) are in `AGENTS.md`.

## Rules

- Top-level folders under `app/` are fixed: `components`, `domains`, `guards`, `pages`, `pipes`, `services`. Do not add new ones (File & folder structure).
- Create components, enums and directives next to where they are used; move them to a top-level folder only when a second page or domain uses them. Do not abstract by default (Where do I put it?).
- `*.model.ts` in `domains/` is the only place that represents backend entities. Backend DTOs are imported only in `domains/`, wrapped in the `Dto` type (Using types exported from the 121-service).
- Frontend names match backend names unless there is a very good reason not to (Naming Consistency).
- Pages have no helper files (Creating components).
- Components are standalone and use `OnPush`; no (S)CSS file per component (Creating components).
- Prefer PrimeNG components over custom ones; suggest design tweaks that make one fit (General component guidelines).
- Use `@if`/`@for`, not `NgIf`/`NgFor` (General component guidelines).
- Split a component only for reuse, a template over ~150 lines or deeply nested, or tightly coupled signals; otherwise keep it inline (Splitting components).
- Delete generated `.spec.ts` files unless the test is meaningful (Creating components).
- Data from the 121 Service comes through `injectQuery` and `injectMutation` (Using signals, API Service Files).
- All 121 Service calls go through a `*.api.service.ts` in the domain: `get*` returns `queryOptions`; `create*`/`edit*`/`delete*` return `httpWrapperService.perform121ServiceRequest` (API Service Files).
- Never invalidate the query cache manually; `app.config.ts` does it after every mutation. For delayed backend updates, set `meta: { invalidateCacheAgainAfterDelay }` (API Service Files).
- Use Tailwind utility classes; keep custom CSS minimal. Use logical properties: `ms-0 ps-0`, not `ml-0 pl-0` (Styling).
- Localised labels for backend enums are `CAPITAL_CASE` constants in a domain helper, typed `Record<Enum, string>` (Localising Backend Enums).

## Read the full section before

| Task                                | Read                               |
| ----------------------------------- | ---------------------------------- |
| Deciding where a new file goes      | File & folder structure            |
| Splitting or extracting a component | Splitting components: when and why |
| Choosing a signal kind              | Using signals                      |
| Changing theming or global styles   | Styling, Theming                   |
| Adding or changing an api service   | Interacting with the 121-service   |
