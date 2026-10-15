---
description: 'Use when writing or changing NestJS code in services/121-service or services/mock-service: modules, services, repositories, entities, DTOs, interfaces, Fsp integrations and API endpoints.'
applyTo: 'services/**/*.ts'
---

# 121 Service instructions

Summary of the [Software Architecture Guidelines](../../docs/guidelines/software-architecture.md). That document is leading; read the relevant section when a case is not covered here.

## Modules and data access

- A module has one responsibility. Higher-level modules depend on lower-level ones, never the other way around, and never circularly.
- All database access goes through a (custom) Repository that belongs to the entity's module. No TypeORM code outside repositories, except simple `find`/`count` clauses in services.
- A module only uses repositories of its own module or of modules lower in the hierarchy. An entity is only created, updated or deleted within its own module.
- Import a dependency as a full module under `imports`, not as a single service or repository under `providers`.
- Functions do not accept or return Entities across module boundaries.
- Queries that join a "base" entity with related entities go in the base entity's repository (for example Program with its Registrations → `ProgramRepository`).
- Static helpers used in several places go in a `utils` module.
- With multiple files of one kind in a module, group them in `services/`, `entities/`, `dtos/`, `interfaces/`, `enums/` subfolders.

## Naming

- Modules, Controllers and Services are plural: `ProgramsModule`, `programs.service.ts`. Entities and Repositories are singular: `ProgramEntity`, `program.entity.ts`. Module base folders are plural: `src/programs/`.
- Functions returning 121 Platform data start with `get`; functions calling an external system start with `retrieve`.
- Add the `OrThrow` suffix when a function deliberately throws an expected error (`getProgramOrThrow`). Do not use `OrFail`.
- One enum per file, without an `Enum` suffix.

## Function signatures and interfaces

- Public functions of exported services take an interface with a `Params` suffix and return an interface with a `Result` suffix. One interface per file in `interfaces/`, for example `contact-information-params.interface.ts`. All attributes are `readonly`.
- Module-internal and private functions also take a single destructured object, never naked parameters. Define the object type in-line; do not name it `input`.

## DTOs

- API request and response bodies are classes with a `Dto` suffix, one per file in `dtos/`, with `readonly` attributes and Swagger/validation decorators. Nested complex types are separate classes, not in-line.
- Input DTOs start with the action verb (`CreateAddressDto`) unless shared by multiple actions (`AddressDto`). Response DTOs use the `Response` suffix (`UserResponseDto`).
- DTOs for third-party APIs are interfaces in `dtos/<fsp-name>-api/`, named `{Fsp}Api{Operation}{Request|Response}{Body|Headers}`, and are never shared with the 121 Service API.

## Entities

- Use 3rd Normal Form. Required columns do not have `nullable: true`; nullable columns include `| null` in their TypeScript type. Do not use `JSON` as a TypeScript type.
- Foreign-key properties use the full name of the related entity: `intersolveVisaParentWallet`, not `parentWallet`.

## API design and errors

- Organize endpoints around nouns, not use cases or verbs; `/retry` or `/approve` style suffixes only for actions beyond CRUD. Do not use POST to pass a body for a GET.
- `GET` on a missing resource returns 404; `GET` on an empty collection returns 200 with `[]`. Document the relevant status codes per endpoint.
- Throw the NestJS `HttpException` with a single string message.

## HTTP calls with fetch

- Build URLs with the `URL` object and headers with the `Headers` object, and pass both instances to `fetch` directly.
