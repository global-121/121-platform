# Portal Development Guidelines

All of the below are merely guidelines. If you are in doubt about something, ask :)

## File & folder structure

This is our desired file & folder structure:

```md
app
├── components
│ └── component-name
│ ├── component-name.component.html
│ ├── component-name.component.spec.ts
│ └── component-name.component.ts
├── domains
│ └── domain-name
│ ├── domain-name.api.service.ts
│ ├── domain-name.helpers.ts
│ └── domain-name.model.ts
├── guards
│ └── guard-name.guard.ts
├── pages
│ └── page-name
│ ├── components
│ │ └── page-specific-component
│ │ ├── ...
│ ├── page-name.page.html
│ └── page-name.page.ts
├── pipes
│ ├── pipe-name.pipe.spec.ts
│ └── pipe-name.pipe.ts
└── services
├── service-name.service.spec.ts
└── service-name.service.ts
```

- No new top-level (ie. direct descendants of `app`) folders should be added.
- Page-specific folders should be inside `app/pages`
- The `.model.ts` files should be the only ones containing the representation of entities that come from the backend
- A page-specific folder (such as `app/pages/payment`) or a top-level component folder (such as `app/components/data-table`) can replicate app's top-level folder structure. For example, we could have a `components` and `services` folder within `app/pages/payments`.

### When creating a new component/enum/directive, where do I put it?

By default, create it close to where it would be used. (ie. create a component that is specific to the `payments` page within the `payments` page folder).

Only move it to the equivalent top-level folder when

- It will inevitably be used by more than one domain (eg. a design atom like `Button`)
- It becomes used by more than one page/domain

In other words, do not abstract by default.

### Naming Consistency Between Frontend and Backend

To reduce confusion and avoid costly refactors, **frontend naming should closely match backend naming**, unless there is a very good reason not to. If a name differs in design vs. code, raise it early during refinement or development. A conscious decision should then be made to rename it in both the frontend and backend, based on the estimated effort. Consider third-party API integrations as part of this effort estimation.

## Components

### Creating components

Items with the 🤖 emoji happen automatically when using `ng generate component`.

- Delete auto-generated spec files unless they are meaningful
- 🤖 All components must be standalone
- 🤖 All components must use the "OnPush" change detection strategy, to support [zoneless change detection](https://angular.dev/guide/experimental/zoneless)
- 🤖 Do not create a (S)CSS file per component
- Pages should **not** have helper files.

### General component guidelines

- Keep custom components/CSS to a minimum.
  - Use [PrimeNG](https://primeng.org/) components whenever possible
    - A design might contain something that, with a few tweaks, could use a PrimeNG component instead of a custom one. Always prefer to push for and suggest those tweaks.
- Use the [new syntax for control flow](https://angular.dev/guide/templates/control-flow) rather than structural directives
  - ie. prefer `@if` and `@for` over `NgIf` and `NgFor`
- Do not abstract by default
  - ie. only pull out a component into a separate file when you are certain it will be re-used, or when you are trying to re-use it in a different component
- Inline templates (rather than a separate HTML file) can be used, but they have a maximum length enforced by eslint. In other words, use them only for "small" components.

### Splitting components: when and why

Use child components to improve readability, reusability, testability, and performance. Do not abstract by default; prefer incremental extraction when the need is clear.

It is difficult to give clear guidelines that will always make this an easy decision. Below is an attempt to do so, but **the general guideline is to avoid splitting up large components by default, and to do so only when there is a good reason.**

#### Recommended reasons to split

1. **Reuse Within the Same Page**

   When the same UI block appears multiple times within a page with minor variations, extract it into a child component with parameters.

1. **Potential Cross-Page Reuse**

   When a UI element (status pill, filters panel, data table toolbar) is likely to be reused in other pages. Keep it close to initial usage, then move to app/components when actually reused elsewhere.

1. **Template/Logic Size and Complexity**

   When the template exceeds approximately 150 lines, contains deep nesting, or the component has many UI-only conditional branches. Split along visual or functional sections.

1. **Signals and Effects Complexity**

   When too many signals or effects become tightly coupled in a single file. Split to isolate stateful parts from presentational parts.

#### Reasons to avoid splitting

1. One-time use, small UI

   Short, simple, page-specific markup with minimal logic. Keep inline in the page component.

1. Premature abstraction

   Only split when either reuse or complexity is evident. Do not introduce indirection “just in case”.

1. Leaky interfaces

   If a child needs multiple services from the parent or many tightly coupled inputs/outputs to function, leave it in the parent component rather than trying to abstract at all costs.

#### Decision checklist

- Is there more than one high-level concern? If yes, split by concern, if doing so doesn't introduce architectural complexity.
- Is the template over ~150 lines or deeply nested? If yes, split into visual sections.
- Is a UI pattern used 2+ times? If yes, extract a child component.
- Will this block likely be reused on another page soon? If yes, extract but keep it close to current page first.

### Using signals

We use different kinds of signals to add interactivity to our components. Below is an overview of what you will typically find, and when we tend to use each kind of signal.

Before reading this section, it is recommended that you read the [angular guide on signals](https://angular.dev/guide/signals).

#### `signal`

A signal in it's most basic form. This is used when a component needs to store information that, when updated, should trigger a change detection elsewhere in the component.

#### `input`

This is used to pass information from parent to child component. The child component can only read the value, and never set it.

#### `model`

This is used when we want to pass information from parent to child component, but we also want to give the child component the ability to update the value.

#### `computed`

This is used when we want to create a signal that is the result of a calculation on one or more signals. It is a special read-only signal, that will automatically update it's value whenever one of the signals it relies on is updated.

#### `effect`

This is used to trigger "side effects" (eg. event tracking, or adding query parameters to the URL). Similarly to `computed`, it will fire whenever one of the signals it relies on is updated.

#### `viewChild` / `viewChildren`

This is used to access a child of the component defined in the template of the component itself. It is defines in the component via a hashtag symbol.

#### `contentChild` / `contentChildren`

This is used to access a child of the component defined by the parent component.

#### `injectQuery`

This is used to get data from an API endpoint (typically the 121-service). This function returns an object containing several signals, such as `data()`, `isPending()`, `failureReason()` etc.

## Styling

- Use [Tailwind](https://tailwindcss.com) utility classes instead of (S)CSS-files-per-component
  - Follow the Tailwind recommendations for [reusing styles](https://tailwindcss.com/docs/reusing-styles)
- Keep (any) custom CSS (even with Tailwind) to a minimum
- Make sure to use "`*-start`/`*-end`" instead of "`*-left`/`*-right`" in positioning/margin properties/classes
  - This increases support for RTL in the future
  - eg. `ms-0 ps-0` instead of `ml-0 pl-0`

### Theming

Theming is done in multiple places:

#### `tailwind.config.ts`

This is our first point of entry, and the source of truth for design tokens (eg. colors). All other files import from this and use this as a reference.

#### `app.theme.ts`

Thie file defines the theme used by primeng. This imports tokens from `tailwind.config.ts`, and uses them to customise primeng components and general theming.

#### `styles.css`

This file does the remaining general styling. We do a few things here:

- Define some tailwind helpers that cannot be defines in tailwind v4 (mostly typography helpers such as `txt-system-s`)
- Define some sensible defaults for selectors such as `h1`, `p`, `a`, etc.
- Override some primeng styles that cannot be tweaked via the `app.theme.ts` file

Changes and additions to this css file should be kept to a minimum, because more difficult to maintain (especially with major primeng / tailwind upgrades) and preferably applied via the two other files wherever possible.

## Interacting with the 121-service

### API Service Files

All API calls to the 121-service should go through an `.api.service.ts` file. These files typically export two kinds of functions:

1. Functions that return `queryOptions`
   - These are to be used in conjuction with `injectQuery` in components, to `GET` data
   - These are typically prefixed with the verb `get`
2. Functions that return a direct call to `httpWrapperService.perform121ServiceRequest`
   - These are to be used in conjuction with `injectMutation` in components, to perform `POST`/`PATCH`/`PUT`/`DELETE` operations
   - There are typically prefixed with the verb `create`/`edit`/`delete` etc.

Cache invalidation is done globally: the `MutationCache` in `app.config.ts` invalidates all queries after every successful mutation. Do not invalidate the cache manually in components or api services (enforced by the `custom-rules/tanstack-no-manual-cache-invalidation` lint rule). If the backend needs a moment before updated data is available, set `meta: { invalidateCacheAgainAfterDelay: <ms> }` on the mutation.

### Using types exported from the 121-service

Enums can be imported and used directly throughout the codebase.

DTOs should be used in conjunction with the `Dto` TS wrapper type, and should only be imported in the `domains` folders. The `model.ts` files in these folders should then expose the FE-specific types to the rest of the application.

### Localising Backend Enums

Whenever we need a "localisation" mapping for backend enums, we create this in a domain helper file, using CAPITAL_CASING to indicate that this is a constant.

For examnple:

```ts
export const TRANSACTION_STATUS_LABELS: Record<TransactionStatusEnum, string> =
  {
    [TransactionStatusEnum.waiting]: $localize`:@@transaction-status-waiting:Pending`,
    [TransactionStatusEnum.error]: $localize`:@@transaction-status-error:Failed`,
    [TransactionStatusEnum.success]: $localize`:@@transaction-status-success:Successful`,
  };
```
