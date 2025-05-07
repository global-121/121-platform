# Component Guidelines

Guidelines with the 🤖 emoji are enforced through CI checks.

- Keep custom components/CSS to a minimum.
- Use [PrimeNG](https://primeng.org/) components whenever possible
  - A design might contain something that, with a few tweaks, could use a PrimeNG component instead of a custom one. Always prefer to push for and suggest those tweaks.
- Use [Tailwind](https://tailwindcss.com) utility classes instead of (s)css files
  - Follow the tailwind recommendations for [reusing styles](https://tailwindcss.com/docs/reusing-styles)
- When creating components via the CLI, the following defaults are setup. Do not change your component in these regards unless strictly necessary:
  - Do not use an external SCSS file (Tailwind classes should be sufficient)
  - Do not auto-generate spec files (create them only when necessary/meaningful)
  - 🤖 All components must be standalone
  - 🤖 All components must use the "OnPush" change detection strategy, to support [`zoneless` change detection](https://angular.dev/guide/experimental/zoneless)
- Use the [new syntax for control flow](https://angular.dev/guide/templates/control-flow) rather than structural directives
  - ie. prefer `@if` and `@for` over `NgIf` and `NgFor`
- Do not abstract by default
  - ie. only pull out a component into a separate file when you are certain it will be re-used, or when you are trying to re-use it in a different component
- Nest page-specific components & services within the respective page folder
