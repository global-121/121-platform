# AGENTS instructions

## Overview

This folder contains all backend code for the 121 Platform, an open-source humanitarian aid platform built by the Netherlands Red Cross for managing Cash Based Assistance programs.

## Technology stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with role-based access control
- **API**: RESTful APIs with OpenAPI/Swagger documentation
- **Testing**: Jest for unit and integration tests
- **Containerization**: Docker and Docker Compose

## Patterns to follow

See the Code Style & Standards section of [root AGENTS.md](../../AGENTS.md).

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

### HTTP Response Guidelines

- 404 Not Found: For GET calls to non-existent resource endpoints
- 200 OK with empty array: For GET calls to collection endpoints with no resources

### Exception Handling

- Use NestJS `HttpException` for control flow and HTTP responses
- First argument should be a descriptive string
- Only use arrays/objects for error messages with very good reason
- Exceptions can be used for control flow in the 121 Platform

### Authentication & Authorization

- Use `@AuthenticatedUser()` decorator to access current user
- Implement role-based access control with guards

### Error Handling

- Use NestJS HTTP exceptions with proper status codes
- Log errors appropriately for debugging

### Database Migrations

- Use TypeORM migrations for schema changes
- Test migrations thoroughly before deployment
- Keep migration files minimal and focused
- Always include "121-service" schema in raw SQL queries when referencing tables of the 121-service

### Things to Avoid

Also see [Things to Avoid#Things to Avoid](../../AGENTS.md#things-to-avoid)

- Direct SQL query construction without parameterization
- Exposing sensitive data in API responses
- Missing authentication/authorization checks
- Direct database access from controllers
- Missing error handling in async operations
- Circular dependencies between NestJS modules
- Unsafe TypeORM where conditions
- Using TypeORM's `queryBuilder` without using table aliases
- Using TypeORM's `queryBuilder` when `.find`, `.save` or any of the other repository methods would suffice

## Testing

- **Unit Tests**: Jest configuration in `jest.unit.config.js`
- **Integration Tests**: Jest configuration in `jest.integration.config.js`
- **Coverage**: Separate reports for unit and integration tests
- **Patterns**: Use helper functions, clean test data, mock external dependencies
- **Guidelines**
  - Do not test private methods directly

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
- Run with: `npm run test:integration:all`

**Testing Strategy:**

- Follow Testing Trophy philosophy over Testing Pyramid
- Write tests that provide value (cost vs. risk analysis)
- Unit tests provide breadth (wide range of scenarios)
- Integration tests provide depth (real-world behavior)
- Refactor complex units into smaller, testable functions

## Commands

See the [Commands for linting and formatting section in root AGENTS.md](../../AGENTS.md)

### Commands for linting and typechecking

```bash
cd services/121-service
npm run lint # linting
npm run typecheck # type checking
npm run fix # Fix linting issues
```

### Test commands

```bash
cd services/121-service
docker exec 121-service  npm run test:unit:all # unit tests
docker exec 121-service  npm run test:integration:all # integration tests
docker exec 121-service npm run test:integration:all -t delete-program.test.ts # specific test file
```

## Additional Resources

- [Service README](./README.md)
