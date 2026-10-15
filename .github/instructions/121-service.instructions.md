---
description: 'Use when writing or changing NestJS code in services/121-service or services/mock-service: modules, services, repositories, entities, DTOs, interfaces, Fsp integrations and API endpoints.'
applyTo: 'services/**/*.ts'
---

# 121 Service instructions

Rules from the [Software Architecture Guidelines](../../docs/guidelines/software-architecture.md), tagged with their section. The guidelines are leading and hold the rationale and examples. General rules (naming, destructured parameters, `Enum` suffix, `Fsp`) are in `AGENTS.md`.

## Rules

- Modules depend only on modules lower in the hierarchy, never circularly (A.3, A.6). Import the full module under `imports`, not a single provider (B.8).
- All database access goes through a Repository of the entity's own module; no TypeORM outside repositories except simple `find`/`count` clauses (B.2, J.4, J.5).
- Functions do not accept or return Entities across modules (B.4). Only the owning module creates, updates or deletes an entity (J.6).
- Related-entity queries go in the repository of the "base" entity (J.7).
- Modules, Controllers and Services are plural; Entities and Repositories are singular; module folders are plural (I.2–I.4).
- Functions returning 121 Platform data start with `get`; external data with `retrieve`. Add `OrThrow` (not `OrFail`) when throwing an expected error (C.1, C.2).
- Public functions of exported services take a `…Params` interface and return a `…Result` interface, one per file in `interfaces/`, all attributes `readonly` (C.4, C.5).
- One enum per file (B.5).
- API DTOs are classes with the `Dto` suffix, one per file in `dtos/`, `readonly` attributes, decorated. Input DTOs start with the action verb, response DTOs end in `Response` (E.1–E.9).
- Third-party API bodies are interfaces named `{Fsp}Api{Operation}{Request|Response}{Body|Headers}` in `dtos/<fsp>-api/`, never shared with API DTOs (F.1–F.5).
- Required entity columns have no `nullable: true`; nullable ones have `| null` in the type; never `JSON` as a type. FK properties use the full entity name (J.9–J.11).
- Endpoints use nouns, proper methods and status codes: 404 for a missing resource, 200 with `[]` for an empty collection (H.1–H.6).
- Throw `HttpException` with a single string message (K).
- Use `URL` and `Headers` objects with `fetch` (G).

## Read the full section before

| Task                                      | Read                           |
| ----------------------------------------- | ------------------------------ |
| Creating a module or changing its imports | A, B                           |
| Adding or changing a repository or entity | J                              |
| Adding or changing an endpoint or DTO     | E, H                           |
| Integrating an external API               | F, G                           |
| Writing tests                             | L (see the tests instructions) |
