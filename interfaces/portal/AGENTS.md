# AGENTS instructions

## Frontend Overview

This folder contains all frontend code for the 121 Platform, an open-source
humanitarian aid platform built by the Netherlands Red Cross for managing Cash
Based Assistance programs. Another name for this frontend is "the portal".

## Technology stack

- **Framework**: Angular with TypeScript
- **UI Library**: PrimeNG components
- **Styling**: Tailwind CSS utility classes
- **State Management**: Angular services and TanStack Query
- **Testing**: Angular CLI `ng test` with Vitest for unit and component tests; Playwright for E2E
- **Build**: Angular CLI with production optimizations

## Code Style & Standards

See [root AGENTS.md](../../AGENTS.md).

### File & Folder Structure

**Desired Structure:**

```
app
├── components
│   └── component-name/
├── directives
├── models
│   ├── model-name.api.model.ts
│   └── model-name.model.ts
├── pages/
│   └── page-name/
│       ├── components/
│       │   └── page-specific-component/
│       ├── page-name.component.html
│       └── page-name.component.ts
└── services
```

**Organization Rules:**

- No new top-level folders should be added to `app/`
- Domain-specific folders go inside `app/pages`
- `models` folder only contains backend entity representations
- Create components close to where they're used
- Move to top-level folders only when used by multiple domains

### Component Guidelines

**Creation Requirements:**

- **Standalone Components**: All components must be standalone (enforced)
- **Change Detection**: Use OnPush strategy for performance (enforced)
- **Selectors**: Use `app-` prefix with kebab-case
- Delete auto-generated spec files unless meaningful
- All styling is done in the HTML using Tailwind classes, so: do not create any(S)CSS files for a component.

**Component Best Practices:**

- Keep custom components/CSS to minimum
- Use PrimeNG components whenever possible
- Use new control flow syntax (`@if`, `@for`) over structural directives
- Do not abstract by default - only extract when certain of reuse
- Inline templates OK for templates ≤10 lines

### Component Structure

```typescript
@Component({
  selector: 'app-user-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `...`,
})
export class UserProfileComponent implements OnInit {
  // Component logic here
}
```

### Styling & Templates

**Styling Guidelines:**

- **Tailwind CSS**: Use utility classes instead of custom CSS
- Follow Tailwind recommendations for reusing styles
- **PrimeNG**: Prefer PrimeNG components over custom implementations
- Add global rules to `styles.scss` for PrimeNG components used in multiple places (should be done very sparingly - ideally avoided)
- Use `*-start`/`*-end` instead of `*-left`/`*-right` for RTL support

**Template Guidelines:**

- **Control Flow**: Use new `@if` and `@for` syntax over `*ngIf`/`*ngFor`
- **i18n**: All user-facing text must be internationalized using Lokalise
- **Templates**: Keep inline templates under 20 lines
- Support RTL languages in positioning and margins

### State Management

- Use Angular services for shared state
- Use TanStack Query for state management and data fetching
- Handle loading states and error conditions

### Internationalization (i18n)

**Translation Process:**

- Translations managed through Lokalise TMS-service
- Latest translations downloaded at every build/deployment
- Language configuration managed per-instance via GitHub environment variables
- All user-facing text must be internationalized

## Testing

- **Unit Tests**: Angular CLI `ng test` with Jasmine/Karma for unit and component tests; Playwright for E2E
- **Component Tests**: Test component behavior and rendering
- **Service Tests**: Mock HTTP calls and test business logic
- **E2E Tests**: Playwright tests in `e2e/` directory

### Test commands

```bash
cd interfaces/portal
npm run test:all # run all tests
```

### Commands

See the [Commands for linting and formatting section in root AGENTS.md](../../AGENTS.md#commands-for-linting-and-formatting)

```bash
cd interfaces/portal
npm run lint # linting
npm run typecheck # type checking
npm run fix # Fix linting issues
```

## Common Patterns & Utilities

### Authentication & Authorization

- Only store JWT tokens inside HTTPOnly cookies.

### Error Handling

- Frontend: Handle HTTP errors gracefully with user feedback
- Log errors appropriately for debugging

## Things to Avoid

Also see [Things to Avoid](../../AGENTS.md#things-to-avoid)

- Using deprecated lifecycle methods
- Not implementing OnPush change detection
- Creating non-standalone components
- Missing i18n for user-facing strings

## Additional Resources

- [Component Guidelines](./src/app/components/component-guidelines.md)
- [Portal README](./README.md)
