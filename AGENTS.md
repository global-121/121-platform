# AGENTS instructions

## Repository Overview

The 121 Platform is an open-source humanitarian aid platform built by the Netherlands Red Cross for managing Cash Based Assistance programs. It consists of a NestJS backend and an Angular frontend, designed for scalability and humanitarian use cases.

**Key Components:**

- `services/121-service/`: Main NestJS backend API service
- `interfaces/portal/`: Angular frontend application
- `e2e/`: End-to-end testing suite
- `tools/`: Utility scripts and tools
- `services/mock-service/`: Mock service for testing and development

## Setup for local development

### Environment Variables

- Copy `services/.env.example` to `services/.env`
- Configure database, API keys, and feature flags
- Use proper environment-specific configurations

### Install dependencies

```bash
# Setup
npm run install:all         # Install all dependencies
npm run start:services      # Start backend services
npm run start:portal        # Start Angular dev server
```

### Run application

```bash
npm run start:services      # Start backend service, including mock service
npm run start:portal        # Start frontend (Angular dev server)
```

## Code Style & Standards

### Domain Terminology

**Standard Abbreviations:**

- **Fsp**: Financial Service Provider (only abbreviation allowed in codebase)
- All other domain concepts must be written in full

### General Principles

- Follow existing code patterns and architectural decisions
- Prioritize readability and maintainability over clever solutions
- Write self-documenting code with clear naming conventions
- Prefer using already-installed utility libraries over custom implementations.
- Prefer built-in language features over custom implementations.

### Things to Avoid

- Hardcoded values instead of configuration, no "magic" numbers or strings.

### Use modern data structures

- By default use Maps instead of objects unless you have a write-once read-heavy workload with string keys.
- By default use Sets instead of arrays unless:
  - you want to allow for duplicates
  - you need to maintain order
  - you need to use array-specific methods like `map`, `filter`, `reduce`, etc.

### Use modern looping and array manipulation constructs

- Use `for...of` loops for iterating over arrays, sets, maps and other iterables.
- Use `Array.filter`, `Array.map`, `Array.reduce` and other array methods for data transformation instead of manual loops when it improves readability.

### URL and Header Construction

**When using fetch API:**

- Use native `URL` object for constructing URLs and parameters
- Use native `Headers` object for HTTP headers
- Pass URL object instance directly to fetch
- Set Headers object as `headers` property value
- Exception: Use framework-specific tooling when available (e.g., Angular HttpClient)

### Naming Conventions

**General Rules:**

- Use full names, no abbreviations (except "Fsp")
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

### General Function Practices

All functions should use destructured objects as parameters, never use "naked" parameters.

### Function Organization

- Use "step-down" approach: high-level functions first, then implementation details
- Functions should appear in the order they are called
- Keep related functions close together
- Place private/helper functions near the public functions they support

### TypeScript Guidelines

- Use strict TypeScript configuration
- Avoid `any` types, this is only allowed in tests when not using `any` would make code very verbose.
- Prefer explicit return types for public methods
- Use proper TypeScript patterns (interfaces, enums, generics)
- Avoid `@typescript-eslint/no-explicit-any` - use proper typing
- Use object shorthand syntax where applicable

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

### Commands for linting and formatting

```bash
npm run fix:all # Fix linting issues
npm run test:prettier # Check formatting for the whole repository
```

All linting and typechecking issues should be resolved before committing.

## Testing Approach

### All code branches should be covered by tests

When adding new functionality: make sure every branch of code has at least one
test.

### Testing Commands

```bash
npm run test:all           # Run all tests
```

## Version Control

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
- Follow the PR template for consistency
- **Draft PRs**: Use draft status until ready for review
- **Ownership**: Each branch has one owner/maintainer (the PR author)
- **Review Process**:
  - Author merges after approval unless stated otherwise
  - PRs must be up-to-date with target branch before merging
- **Content Guidelines**:
  - Avoid mixing responsibilities in single PR
  - Prefer non-breaking changes when possible
  - Add appropriate labels for auto-generating release notes (enhancement, bugfix, other, chore)

### Pull Request Checklist

Before requesting a review, check all points in [the checklist](./docs/pull_request_template.md).

## Additional Resources

- [Contributing Guidelines](./docs/CONTRIBUTING.md)
- [Testing Guide](./guide-Writing-Tests.md)

## Development Tools

- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks
- **Package Management**: npm with workspaces
- **Version Control**: Conventional Commits with Azure DevOps integration
- **CI/CD**: GitHub Actions workflows

## Self-Improvement Protocol

**Important**: All LLM agents must follow this protocol:

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
