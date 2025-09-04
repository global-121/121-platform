# GitHub Copilot Instructions - 121 Platform

## Repository Overview

The 121 Platform is an open-source humanitarian aid platform built by the Netherlands Red Cross for managing Cash Based Assistance programs. It consists of multiple TypeScript services and an Angular frontend, designed for scalability and humanitarian use cases.

**Key Components:**

- `services/121-service`: Main NestJS backend API service
- `services/mock-service`: Mock service for testing and development
- `interfaces/portal`: Angular frontend application
- `e2e/`: End-to-end testing suite
- `tools/`: Utility scripts and tools

## Architecture & Technology Stack

### Backend Services (Node.js/TypeScript)

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with role-based access control
- **API**: RESTful APIs with OpenAPI/Swagger documentation
- **Testing**: Jest for unit and integration tests
- **Containerization**: Docker and Docker Compose

### Frontend (Angular)

- **Framework**: Angular 17+ with TypeScript
- **UI Library**: PrimeNG components
- **Styling**: Tailwind CSS utility classes
- **State Management**: angular services and tanstack-query
- **Testing**: Jest and Karma
- **Build**: Angular CLI with production optimizations

### Development Tools

- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **Package Management**: npm with workspaces
- **Version Control**: Conventional Commits with Azure DevOps integration
- **CI/CD**: GitHub Actions workflows

## Code Style & Standards

### General Principles

- Follow existing code patterns and architectural decisions
- Prioritize readability and maintainability over clever solutions
- Use TypeScript strictly - avoid `any` types
- Write self-documenting code with clear naming conventions

### Formatting & Linting

- **Prettier**: Enforced via pre-commit hooks
  - Single quotes, trailing commas, arrow parentheses always
  - Single attribute per line in templates
- **ESLint**: Strict TypeScript configuration with custom rules
- **Import Organization**:
  - External packages first
  - Alias imports (`@121-service`, `~` for Angular)
  - Relative imports last
  - Use simple-import-sort for consistent ordering

### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer explicit return types for public methods
- Use proper TypeScript patterns (interfaces, enums, generics)
- Avoid `@typescript-eslint/no-explicit-any` - use proper typing
- Use object shorthand syntax where applicable

## Development Workflow

### Commit Conventions

Follow Conventional Commits with Angular format (strictly enforced):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code formatting (no logic changes)
- `refactor:` - Code restructuring without feature changes
- `test:` - Test additions or modifications
- `chore:` - Build process, dependency updates

**Format Requirements**:

- Use imperative mood: "Add feature" not "Added feature" or "Adds feature"
- Think: "This commit will..." + your commit message
- Always include Azure DevOps reference in commit body (not title)
- Use appropriate labels for release note generation

**Examples**:

```
feat: Add transaction history to profile page

See AB#123456
```

```
fix: Prevent user from submitting empty form

See AB#789012
```

### Domain Terminology

**Standard Abbreviations:**

- **Fsp**: Financial Service Provider (only abbreviation allowed in codebase)
- All other domain concepts must be written in full

### Naming Conventions

**General Rules:**

- Use full names, no abbreviations (except "Fsp")
- Let IDE auto-complete instead of typing long names
- Class names are plural for Modules, Controllers, Services
- Class names are singular for Entities and Repositories
- Base folder names of modules are plural
- Do not include "Enum" suffix for enums

**Examples:**

- Module: `ProgramsModule` → `programs.module.ts`
- Service: `ProgramsService` → `programs.service.ts`
- Entity: `ProgramEntity` → `program.entity.ts`
- Repository: `FinancialServiceProviderRepository` → `fsp.repository.ts`
- Enum: `DefaultUserRole` (not `DefaultUserRoleEnum`)

### Branch Naming

Use pattern: `username/description-of-change` (strongly encouraged)

- Example: `john-doe/add-user-profile-endpoint`
- Helps maintain clarity and ownership
- Consistent with single-author branch paradigm

### Pull Request Guidelines

- Keep PRs small and focused on single responsibility
- Separate frontend and backend changes when possible
- Include Azure DevOps task references in PR descriptions
- Follow the PR template for consistency
- **Draft PRs**: Use draft status until ready for review
- **Ownership**: Each branch has one owner/maintainer (the PR author)
- **Review Process**:
  - Limit to one reviewer unless additional expertise is needed
  - Same reviewer should handle subsequent reviews
  - Author merges after approval unless stated otherwise
  - PRs must be up-to-date with target branch before merging
- **Content Guidelines**:
  - Avoid mixing responsibilities in single PR
  - Prefer non-breaking changes when possible
  - Add appropriate labels for auto-generating release notes (enhancement, bugfix, other, chore)
  - Include design team review for UI/UX changes

### Pull Request Checklist

Before requesting review, ensure:

- [ ] Self-review completed
- [ ] Tests added or justification for no tests provided
- [ ] Design team review requested for UI/UX changes
- [ ] All automated checks pass
- [ ] No deviation from PR guidelines needed
- [ ] Azure DevOps task reference included (AB#XXXXX)
- [ ] Appropriate release notes label added (enhancement, bugfix, other, chore)
- [ ] Branch is up-to-date with target branch

## Backend Service Patterns (NestJS)

### Module Architecture & Dependencies

**NestJS Module Dependency Structure:**

- **Single Responsibility Principle**: Each module has one clear responsibility
- **Minimal Coupling**: Modules should be loosely coupled for reusability and testing
- **Hierarchical Structure**: Higher-level modules depend on lower-level ones
- **Feature Modules**: Group related functionality into feature modules
- **Avoid Circular Dependencies**: Keep module dependencies acyclic

**Module Implementation Rules:**

- All database interactions must be in Repositories
- Modules only use Repositories from their own module and lower-level modules
- Functions do not accept or return Entities (use DTOs/interfaces)
- When importing services from other modules, import the full module, not just the service

### Controller Structure

```typescript
@Controller('api/programs')
@UseGuards(AuthenticatedUserGuard)
@ApiTags('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all programs' })
  async getPrograms(): Promise<ProgramReturnDto[]> {
    return this.programsService.getPrograms();
  }
}
```

### Function Signatures & Naming

**Function Naming Conventions:**

- Add `OrThrow` suffix when functions deliberately throw expected errors
- Functions returning data from 121 Platform start with "get", not "find"
- External system functions can use "retrieve" or other descriptive verbs
- Use full names, no abbreviations (except documented domain abbreviations like "Fsp")

**Interface Conventions:**

- **Input Interfaces**: Use "Params" suffix (e.g., `ContactInformationParams`)
- **Output Interfaces**: Use "Result" suffix (e.g., `ContactInformationResult`)
- Place interfaces in `/interfaces` folder with descriptive filenames
- All interface attributes should be `readonly`
- For 3+ parameters in internal methods, use destructured objects

**Function Organization:**

- Use "step-down" approach: high-level functions first, then implementation details
- Functions should appear in the order they are called
- Keep related functions close together
- Place private/helper functions near the public functions they support

### DTO Conventions

**121 Service API DTOs:**

- Use classes with "Dto" suffix
- Input DTOs: Start with action verb (e.g., `CreateAddressDto`)
- Output DTOs: Use "Response" suffix (e.g., `UserResponseDto`)
- All DTO attributes should be `readonly`
- One DTO per file in `/dtos` folder

**External API DTOs:**

- Use interfaces with naming format: `{Fsp-name}Api{Operation}{Request|Response}{Body|Headers}`
- Example: `AirtelApiDisbursementRequestHeaders`
- Place in subfolders like `/dtos/safaricom-api/`
- Do not share DTOs between internal and external APIs

### Entity & Data Model

**Entity Guidelines:**

- Use 3rd Normal Form (3NF) for database design
- Entities belong to specific NestJS modules
- Only owning module and dependent modules can import entities
- All data access via Custom Repositories (no TypeORM outside repositories)
- Entities can only be created/updated/deleted within owning module

**Entity Naming:**

- Entity class names are singular (e.g., `ProgramEntity`)
- Repository class names are singular (e.g., `FinancialServiceProviderRepository`)
- Properties should not use `JSON` as TypeScript type
- Include `| null` in type when `nullable: true`
- For FK properties, use full foreign entity name

### API Design

**API Structure:**

- Organize APIs around entities, not use cases
- Use proper HTTP methods (GET/POST/DELETE/PUT/PATCH)
- Apply correct status codes and document them
- Use nouns, not verbs in URLs (exceptions for actions like /retry, /approve)
- Limit nesting to 2 levels (`/noun/id/noun/id`)
- Limit response depth to 2 levels (relation of relation is OK)

### Database Operations

- **SECURITY**: Always use parameterized queries with `Equal()` helper
- Avoid direct object conditions in `where` clauses (ESLint enforced)
- Use the scoped repository pattern for data isolation
- Handle transactions properly for complex operations
- Encapsulate data access functionality in Custom Repositories

### Exception Handling

- Use NestJS `HTTPException` for control flow and HTTP responses
- First argument should be a descriptive string
- Only use arrays/objects for error messages with very good reason
- Exceptions can be used for control flow in the 121 Platform

### Testing Patterns

**Unit Tests** (`*.spec.ts`):

- Focus on response handling, business logic, and edge cases
- Mock external dependencies for isolation
- Fast and reliable execution
- Use for functions with internal business logic and multiple paths
- Run with: `npm run test:unit:all`

**Integration Tests** (`*.test.ts`):

- Test real API interactions and component integration
- Use SuperAgent for API testing
- Place in `/test` folder
- Run with: `npm run test:e2e:all`

**Testing Strategy:**

- Follow Testing Trophy philosophy over Testing Pyramid
- Write tests that provide value (cost vs. risk analysis)
- Unit tests provide breadth (wide range of scenarios)
- Integration tests provide depth (real-world behavior)
- Refactor complex units into smaller, testable functions

## Frontend Patterns (Angular)

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
- **Lifecycle**: Implement proper lifecycle interfaces
- **Selectors**: Use `app-` prefix with kebab-case
- Delete auto-generated spec files unless meaningful
- Do not create (S)CSS files per component

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
- Implement reactive patterns with RxJS
- Handle loading states and error conditions

### Internationalization (i18n)

**Translation Process:**

- Translations managed through Lokalise TMS-service
- Latest translations downloaded at every build/deployment
- Language configuration managed per-instance via GitHub environment variables
- All user-facing text must be internationalized

## Testing Approach

### Backend Testing

- **Unit Tests**: Jest configuration in `jest.unit.config.js`
- **Integration Tests**: Jest configuration in `jest.integration.config.js`
- **Coverage**: Separate reports for unit and integration tests
- **Patterns**: Use helper functions, clean test data, mock external dependencies

### Frontend Testing

- **Unit Tests**: Jest with Angular testing utilities
- **Component Tests**: Test component behavior and rendering
- **Service Tests**: Mock HTTP calls and test business logic
- **E2E Tests**: Playwright tests in `e2e/` directory

### Testing Commands

```bash
# Check formatting for the whole repository
npm run test:prettier

# Backend
cd services/121-service
docker exec 121-service  npm run test:unit:all         # unit tests
docker exec 121-service  npm run test:integration:all         # integration tests
docker exec 121-service npm run test:integration:all -t delete-program.test.ts # specific test file
npm run typecheck # type checking
npm run lint # linting

# Frontend
cd services/121-service
npm run test:all # run all tests
npm run typecheck # type checking
npm run lint # linting

```

## Common Patterns & Utilities

### Authentication & Authorization

- Use `@AuthenticatedUser()` decorator to access current user
- Implement role-based access control with guards
- Handle JWT tokens properly in frontend services

### Error Handling

- Backend: Use NestJS HTTP exceptions with proper status codes
- Frontend: Handle HTTP errors gracefully with user feedback
- Log errors appropriately for debugging

### API Design

**API Structure:**

- Organize APIs around entities, not use cases
- Use proper HTTP methods (GET/POST/DELETE/PUT/PATCH)
- Apply correct status codes and document them
- Use nouns, not verbs in URLs (exceptions for actions like /retry, /approve)
- Limit nesting to 2 levels (`/noun/id/noun/id`)
- Limit response depth to 2 levels (relation of relation is OK)

**HTTP Response Guidelines:**

- 404 Not Found: For GET calls to non-existent resource endpoints
- 200 OK with empty array: For GET calls to collection endpoints with no resources

### URL and Header Construction

**When using fetch API:**

- Use native `URL` object for constructing URLs and parameters
- Use native `Headers` object for HTTP headers
- Pass URL object instance directly to fetch
- Set Headers object as `headers` property value
- Exception: Use framework-specific tooling when available (e.g., Angular HttpClient)

### Database Migrations

- Use TypeORM migrations for schema changes
- Test migrations thoroughly before deployment
- Keep migration files minimal and focused

## Environment & Configuration

### Local Development

```bash
# Setup
npm run install:all         # Install all dependencies
npm run start:services      # Start backend services
npm run start:portal        # Start Angular dev server

# Code Quality
npm run fix:all            # Fix linting issues
npm run test:all           # Run all tests
```

### Environment Variables

- Copy `services/.env.example` to `services/.env`
- Configure database, API keys, and feature flags
- Use proper environment-specific configurations

## Things to Avoid

### Security Anti-Patterns

- ❌ Direct SQL query construction without parameterization
- ❌ Exposing sensitive data in API responses
- ❌ Missing authentication/authorization checks
- ❌ Using `any` type

### Code Quality Issues

- ❌ Mixing unrelated changes in single PR
- ❌ Breaking changes without proper versioning
- ❌ Skipping tests for new functionality
- ❌ Hardcoded values instead of configuration

### Angular Specific

- ❌ Using deprecated lifecycle methods
- ❌ Not implementing OnPush change detection
- ❌ Creating non-standalone components
- ❌ Missing i18n for user-facing strings

### Backend Specific

- ❌ Direct database access from controllers
- ❌ Missing error handling in async operations
- ❌ Circular dependencies between modules
- ❌ Unsafe TypeORM where conditions

## Additional Resources

- [Contributing Guidelines](../docs/CONTRIBUTING.md)
- [Component Guidelines](../interfaces/portal/src/app/components/component-guidelines.md)
- [Service README](../services/121-service/README.md)
- [Portal README](../interfaces/portal/README.md)
- [Testing Guide](../guide-Writing-Tests.md)

## VSCode Integration

This file (`.github/copilot-instructions.md`) is automatically recognized by GitHub Copilot in both GitHub and VSCode environments. The repository includes VSCode-specific configurations:

### VSCode Settings

- **Prettier**: Default formatter with automatic formatting on save
- **ESLint**: Enabled with auto-fix on save and unused import removal
- **Azure DevOps Integration**: AB# links are automatically detected and made clickable
- **Tailwind CSS**: Enhanced IntelliSense with pixel equivalents and custom class attributes
- **TypeScript**: Uses workspace TypeScript version for consistency

### Recommended Extensions

Check `.vscode/extensions.json` for the complete list of recommended extensions that enhance the development experience.

## Instructions for Copilot Agents

### Self-Improvement Protocol

**Important**: All Copilot agents (both GitHub and VSCode) must follow this protocol:

1. **When reviewing PRs**: Always check if the changes introduce new patterns, conventions, or insights that should be added to these instructions
2. **When learning new patterns**: If you discover better practices while working on this codebase, suggest updates to this file
3. **Continuous improvement**: Regularly evaluate whether these instructions reflect the current state and best practices of the codebase
4. **Documentation updates**: When adding new features or changing existing patterns, ensure these instructions are updated accordingly
5. **Error reporting**: When encountering unexpected errors (e.g., inability to access resources, API failures, permission issues), always report these to reviewers so alternative approaches can be tried

### For PR Review Agents

- **Check instruction updates**: Review if the PR introduces patterns that should be documented here
- **Suggest improvements**: Recommend additions or modifications to these instructions based on code changes
- **Maintain consistency**: Ensure new code follows the patterns documented in these instructions
- **Update when needed**: Create follow-up tasks to update these instructions when significant architectural changes are made
- **Report obstacles**: When unable to access required resources (wikis, documentation, APIs), inform reviewers immediately with specific error details

### For Code Generation Agents

- **Follow current patterns**: Always reference these instructions when generating code suggestions
- **Learn from feedback**: When suggestions are rejected, consider if the instructions need clarification
- **Propose enhancements**: Suggest updates to these instructions when you identify gaps or improvements
- **Stay current**: Regularly re-read these instructions as they evolve with the codebase
- **Surface issues**: Report any unexpected errors, access issues, or limitations encountered during code analysis or generation

Remember: This platform serves humanitarian aid operations. Code quality and reliability directly impact people in need. Write code that is secure, maintainable, and well-tested.
