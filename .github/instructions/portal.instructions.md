---
description: 'Use when writing or changing Angular code in interfaces/portal: components, pages, domains, api services, signals, templates, Tailwind styling and PrimeNG usage.'
applyTo: 'interfaces/portal/src/**'
---

# Portal instructions

Summary of the [Portal Development Guidelines](../../docs/guidelines/portal-development.md). That document is leading; read the relevant section when a case is not covered here.

## Structure

- Top-level folders under `app/` are fixed: `components`, `domains`, `guards`, `pages`, `pipes`, `services`. Do not add new ones.
- Create new components, enums and directives next to where they are used (for example inside `app/pages/payments/`). Move them to a top-level folder only when a second page or domain uses them. Do not abstract by default.
- `*.model.ts` files in `domains/` are the only place that represents backend entities. Backend DTOs are imported only in `domains/`, wrapped in the `Dto` type; the model file exposes the frontend types.
- Backend enums can be imported anywhere. Frontend names match backend names unless there is a very good reason not to.
- Pages do not have helper files.

## Components

- All components are standalone and use `ChangeDetectionStrategy.OnPush`.
- Prefer [PrimeNG](https://primeng.org/) components over custom ones; suggest design tweaks that make a PrimeNG component fit.
- Use `@if`/`@for` control flow, not `NgIf`/`NgFor`.
- Split a component only for a reason: reuse within the page, likely cross-page reuse, a template over ~150 lines or deeply nested, or tightly coupled signals/effects. Keep small one-off markup inline. Do not split when the child would need many of the parent's services or inputs.
- Delete generated `.spec.ts` files unless the test is meaningful.

## Signals

- `signal` for local state, `input` for parent → child, `model` for two-way, `computed` for derived values, `effect` only for side effects such as tracking or URL query parameters.
- Data from the 121 Service comes through `injectQuery` and `injectMutation`.

## API calls

- All calls to the 121 Service go through a `*.api.service.ts` file in the domain, exporting:
  1. `get*` functions returning `queryOptions`, used with `injectQuery`;
  2. `create*`/`edit*`/`delete*` functions returning `httpWrapperService.perform121ServiceRequest`, used with `injectMutation`.
- Never invalidate the query cache manually; `app.config.ts` invalidates all queries after every successful mutation. If the backend needs a moment before updated data is available, set `meta: { invalidateCacheAgainAfterDelay: <ms> }` on the mutation.

## Styling

- Use Tailwind utility classes. No (S)CSS file per component, and keep custom CSS to a minimum.
- Use logical properties: `ms-0 ps-0`, not `ml-0 pl-0`.
- Design tokens live in `tailwind.config.ts`; PrimeNG theming in `app.theme.ts`; `styles.css` only for what cannot go in those two.

## Localisation

- Localised labels for backend enums are `CAPITAL_CASE` constants in a domain helper file, typed `Record<Enum, string>` with `$localize` values.
