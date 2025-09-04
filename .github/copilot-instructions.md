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
- **State Management**: Angular services and RxJS
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
  - Add appropriate labels for auto-generating release notes
  - Include design team review for UI/UX changes

### Pull Request Checklist

Before requesting review, ensure:

- [ ] Self-review completed
- [ ] Tests added or justification for no tests provided
- [ ] Design team review requested for UI/UX changes
- [ ] All automated checks pass
- [ ] No deviation from PR guidelines needed
- [ ] Azure DevOps task reference included (AB#XXXXX)
- [ ] Appropriate release notes label added
- [ ] Branch is up-to-date with target branch

## Backend Service Patterns (NestJS)

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

### Service Layer

- Implement business logic in services
- Use dependency injection for all dependencies
- Handle errors with appropriate HTTP exceptions
- Use repository pattern for data access

### Entity Definitions

- Extend `BaseEntity` or `BaseAuditedEntity`
- Use TypeORM decorators properly
- Define relationships carefully with cascade options
- Follow custom ESLint rules for TypeORM entities

### Database Operations

- **SECURITY**: Always use parameterized queries with `Equal()` helper
- Avoid direct object conditions in `where` clauses (ESLint enforced)
- Use the scoped repository pattern for data isolation
- Handle transactions properly for complex operations

### Testing Patterns

- Unit tests: Mock dependencies, test business logic
- Integration tests: Test API endpoints with test database
- Use helper functions from `test/helpers/` for common operations
- Clean up data properly in test teardown

## Frontend Patterns (Angular)

### Component Guidelines

- **Standalone Components**: All components must be standalone (enforced)
- **Change Detection**: Use OnPush strategy for performance (enforced)
- **Lifecycle**: Implement proper lifecycle interfaces
- **Selectors**: Use `app-` prefix with kebab-case

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

- **Tailwind CSS**: Use utility classes instead of custom CSS
- **PrimeNG**: Prefer PrimeNG components over custom implementations
- **Control Flow**: Use new `@if` and `@for` syntax over `*ngIf`/`*ngFor`
- **i18n**: All user-facing text must be internationalized
- **Templates**: Keep inline templates under 20 lines

### State Management

- Use Angular services for shared state
- Implement reactive patterns with RxJS
- Handle loading states and error conditions
- Use signals where appropriate (Angular 17+)

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
# Backend
npm run test:121-service    # All tests
npm run test:unit:all       # Unit tests only
npm run test:integration:all # Integration tests

# Frontend
npm run test:portal         # Angular tests
npm run test:coverage       # With coverage report
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

- Follow RESTful conventions
- Use proper HTTP status codes
- Document all endpoints with Swagger/OpenAPI
- Version APIs when making breaking changes

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

### For PR Review Agents

- **Check instruction updates**: Review if the PR introduces patterns that should be documented here
- **Suggest improvements**: Recommend additions or modifications to these instructions based on code changes
- **Maintain consistency**: Ensure new code follows the patterns documented in these instructions
- **Update when needed**: Create follow-up tasks to update these instructions when significant architectural changes are made

### For Code Generation Agents

- **Follow current patterns**: Always reference these instructions when generating code suggestions
- **Learn from feedback**: When suggestions are rejected, consider if the instructions need clarification
- **Propose enhancements**: Suggest updates to these instructions when you identify gaps or improvements
- **Stay current**: Regularly re-read these instructions as they evolve with the codebase

Remember: This platform serves humanitarian aid operations. Code quality and reliability directly impact people in need. Write code that is secure, maintainable, and well-tested.
