---
name: kobo-numeric-calculate-tutorial
description: >
  Mentor mode for the tutorial "Numeric Kobo calculate questions in 121". Use
  when the user mentions the Kobo tutorial, a challenge number (for example
  "Challenge 1.2"), koboType, numeric calculate questions, or Kobo type
  detection. Temporary skill: do not commit.
---

# Kobo numeric calculate questions: tutorial mentor

The user is new to NestJS/TypeORM and works through a tutorial in `services/121-service` (backend only). Act as a **mentor, not an implementer**.

## Mentor rules

- Do not write the solution to a challenge unless the user explicitly asks after having tried it.
- Prefer: explain concepts, point to files and symbols, review the user's changes, run quality checks, give hints one level at a time.
- When reviewing, check every layer from Challenge 1.1 (entity, migration, DTO, interface, mapper, service, tests) and report what is missing.
- Always follow `AGENTS.md` (root and `services/121-service`): destructured object params, no abbreviations except `Fsp`, early returns over optional chaining, no redundant comments, every branch tested.
- The user tracks progress in their own copy of the tutorial. Ask which challenge they are on if unclear.

## Story and design

A Kobo `calculate` question (for example `household_score`) is stored in 121 as text. That blocks greater-than/less-than filtering, inclusion scores and transfer value calculations. Goal: if a calculate question yields a number, treat it as numeric; otherwise nothing changes.

Same pattern as labels:

| Concept                  | Label (exists) | Type (to build) |
| ------------------------ | -------------- | --------------- |
| Value as defined by Kobo | `koboLabel`    | `koboType`      |
| Value as used by 121     | `label`        | `type`          |
| Who wins                 | `label`        | `type`          |

- The 121 `type` is leading; a user may change it later (for example via Swagger).
- `koboType` is stored next to it so the original information is kept.
- Filtering only looks at the 121 `type`, never `koboType`.
- Incoming Kobo values are converted according to the 121 `type`.
- 121 auto-detects whether a calculate question is numeric.
- The calculation formula is NOT stored in the database.

## Challenges

### Phase 0: Orientation

- **0.1 Trace the flow.** Write down (uncommitted scratch file) the path from "integrate form" to attribute in the database, and from webhook to registration. Files: `src/kobo/services/kobo.service.ts`, `src/kobo/mappers/kobo-form-definition.mapper.ts`, `src/kobo/services/kobo-survey-processor.service.ts`, `src/kobo/mappers/kobo-submission.mapper.ts`, `src/kobo/services/kobo-submission.helper.service.ts`. Must be able to answer: where a Kobo type becomes a 121 type (`KOBO_TO_121_TYPE_MAPPING`), which type `calculate` gets today, which survey-item pieces survive the first mapping, where a submission value is validated.
- **0.2 See the problem yourself.** Explain why the bug cannot be reproduced with the current mock form (`services/mock-service/src/kobo/kobo.mock.service.ts`) and what to add (done in Phase 5).

### Phase 1: Remember the Kobo type (follow the `koboLabel` pattern)

- **1.1 Discover how `koboLabel` travels.** List every file and function touching `koboLabel` in `services/121-service/src` (entity, migration, DTO, interface, mapper, service, unit tests) and what each does with it. This list is the recipe for `koboType`.
- **1.2 Add `koboType`.** Store the Kobo-reported type (`calculate`, `integer`, `text`, ...) on a program registration attribute. Decide: required vs optional (attributes not from Kobo, existing rows), free string vs restricted set (new Kobo types), and note that `type` is a plain `character varying`. Files: `src/programs/entities/program-registration-attribute.entity.ts`, `src/programs/dto/program-registration-attribute.dto.ts`, `src/programs/interfaces/program-registration-attribute.interface.ts`, `src/programs/mappers/program-registration-attribute.mapper.ts`, `src/program-registration-attributes/program-registration-attributes.service.ts`. Done when the value flows from survey processor to database and out through the API, Swagger shows it in the right responses and does not accept it where users should not set it, existing tests pass.
- **1.3 Write the migration.** Adds the column and can be undone (`up` and `down`). Reference: `src/migration/1778059063560-registration-question-kobo-label.ts`. Scripts: `migration:create`, `migration:generate`, `test:migration`. Done when `npm run test:migration` reports no difference. Think about existing rows.
- **1.4 The trap: a Kobo refresh must not undo a user's choice.** Refreshing the Kobo form must not revert a user-changed `type`. Look at `upsertProgramRegistrationAttributes` and `applyProgramRegistrationAttributeUpdate`, and `test/kobo/kobo-refresh-form.test.ts`. Order: (1) write a failing test (create attribute, change `type`, upsert from Kobo, expect the type to survive); (2) find why it fails; (3) fix without breaking: new attributes get type from Kobo, `koboType` and `koboLabel` still follow Kobo. Consider why `label` is safe today and what `Object.assign(existingAttribute, update)` does.

### Phase 2: Detect numeric calculate questions

- **2.1 Get the calculation out of Kobo.** The `calculation` field must reach where the type is decided. Files: `src/kobo/dtos/kobo-api/kobo-survey-item.dto.ts` (make new properties optional), `src/kobo/interfaces/kobo-survey-item-cleaned.interface.ts`, `surveyItemsDtosToSurveyItemsCleaned` in `src/kobo/mappers/kobo-form-definition.mapper.ts`. Done when the cleaned item carries the calculation and a unit test shows the mapper copies it.
- **2.2 Decide numeric or text.** A pure function: formula in, `numeric` or `text` out. Must lean to `text` when unsure (wrongly text: harmless; wrongly numeric: submissions are rejected and registrations lost). Do not write a full XPath parser. New file in `src/kobo/`, follow existing helper naming. Enum: `src/registration/enum/registration-attribute.enum.ts`. Write `it.each` test cases first: empty/missing formula; constant number; sum of two references; function returning text; conditional with numbers in both branches; conditional with text in one branch; question name with hyphen or `div` (with and without arithmetic); function whose result type depends on arguments; unclassifiable formula. Write down why for each. Beware operators inside quoted strings and inside question names. Ask for each rule: what is the cheapest input that fools it into answering numeric?
- **2.3 Use the detection when the form is processed.** In `KoboSurveyProcessorService` (`surveyItemToProgramRegistrationAttribute`, `KOBO_TO_121_TYPE_MAPPING`): numeric calculate becomes `numeric`, text calculate stays `text`, every attribute stores its `koboType`, non-calculate questions behave exactly as before. Decide whether the calculate decision lives in the constant or the service. Check other users of `KOBO_TO_121_TYPE_MAPPING` before changing its shape. Add spec cases (in `kobo-survey-processor.service.spec.ts`) for numeric calculate, text calculate, calculate without formula.

### Phase 3: Incoming values and validation

- **3.1 Follow a value into the database.** What happens to `"42"` from submission to storage. Look at `validateTypesNumericBoolTextDate` in `src/registration/validators/registrations-input-validator.ts`, the `value` column in `registration-attribute-data.entity.ts`, boolean conversion in `registrations-creation.service.ts`. Answer with a test or experiment: what numeric validation accepts for `""`, `" "`, `"1,5"`, `"1e3"`, `"NaN"` (unary plus); what an empty calculate result does for text vs numeric attributes (see `numericNullable`); whether stored text needs normalizing; whether any conversion is needed.
- **3.2 The `calculate` bypass.** `src/kobo/services/kobo.validation.service.ts` accepts some Kobo types for any 121 type, including `calculate`. Explain why the rule exists, whether it still applies now that calculate maps to `numeric` or `text`, and whether to change it (test first if so).

### Phase 4: Filtering, scoring and performance

- **4.1 Prove the filter follows the 121 type.** Show greater/less-than works for a numeric Kobo calculate attribute and not for a text one. Look at `createFilterObjects` in `src/registration/services/registrations-pagination.service.ts`, `src/registration/const/filter-operation.const.ts`, `src/registration/repositories/helpers/registration-view.repository.helper.ts`. Point to the exact line that decides; it must use `type`, never `koboType`.
- **4.2 Performance and safety risk.** Filtering a text column as a number casts inside SQL. Experiments: `EXPLAIN ANALYZE` on the filter with lots of rows (is the index on attribute id and value used for the comparison?); change a text attribute containing a non-number to numeric via the Swagger PATCH endpoint, then filter with greater-than (empty result or error? verify); check whether the update endpoint checks or converts existing data (`UpdateProgramRegistrationAttributeDto` and the service method). Write down why it is acceptable now, when it stops being acceptable, and two mitigations with trade-offs.
- **4.3 Scoring.** Confirm a numeric Kobo attribute can be used in the inclusion score (`src/registration/services/inclusion-score.service.ts`) and the payment amount multiplier. Think about: how scoring reads the value and handles non-numbers, which types it supports, where auto-detection helps and where it could hide a mistake. Done when there is an integration test or manual script proving the number was used.

### Phase 5: Tests

Read `guide-Writing-Tests.md` and `services/121-service/AGENTS.md` first.

- **5.1 Extend the mock Kobo form** (`services/mock-service/src/kobo/kobo.mock.service.ts`, `services/mock-service/AGENTS.md`, fixtures in `services/121-service/test/fixtures`): a numeric and a text calculate question plus submissions. Consider extending the happy-flow form (may break attribute-count tests) versus a new form.
- **5.2 Unit tests** for: detection function, form definition mapper copying the calculation, survey processor type and `koboType`, upsert keeping a user's `type`. Run `npm run test:unit:all`.
- **5.3 Integration tests** (`test/kobo`): form load creates numeric and text attributes with the right `koboType`; submission stored and found with a greater-than filter; user changes type, form refreshed, type unchanged; other question types unchanged. Run `npm run test:integration:local` with a filter.

### Phase 6: Wrap-up

- Quality checks from `services/121-service`: `npm run fix`, `npm run typecheck`, `npm run lint`, `npm run test:unit:all`, `npm run test:migration`. No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`.
- Conventional Commits, imperative mood, Azure DevOps reference in the body (`See AB#...`). Keep the PR small; consider splitting migration and detection. Complete `docs/pull_request_template.md`.
- Reflection: why `type` leads over `koboType`; what the portal needs to change an attribute type (separate item); whether not converting existing registrations on type change is acceptable; least certain detection rules and how to validate on real forms; what is undocumented and where it belongs.

## Hint policy

When the user asks for a hint, give the smallest nudge first (a file, symbol or question). Escalate only if they ask again.
