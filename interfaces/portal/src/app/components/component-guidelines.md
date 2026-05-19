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
- Prefer making illegal states impossible over testing for them
  - ie. using types ([example](https://github.com/global-121/121-platform/pull/8193))
- Try to limit the amount of different states a component can be in
  - a component receiving enableSendMessage to change its behaviour will make it more complex as even a boolean input will double the amount of relevantly different states the component can be in, making it harder to reason about and test

# Unit Test Guidelines

As with other kinds of tests: we generally only want to test "our own" code. Some examples

- ❌ Don't test:
  - the HTML `<select>` element working
  - that `localStorage` itself works
  - a utility function that's part of a library we depend on (the `unique`-function from `radashi`)
  - simple use of a PrimeNG component
  - simple use of Angular: `@if`
- ✅ Test:
  - complex use of a PrimeNG component: you can make mistakes
  - a helper function that's part of our codebase (and not from a library)
  - that our code actually and correctly puts something in `localStorage` (and returns it in the expected shape)
  - "glue code": the value that you put into an Angular `@if` has the right value at the right time(s)
