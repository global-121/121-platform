# E2E Test Flakiness Report

**Scope:** [e2e/portal](portal) Playwright suite
**Method:** Manual review guided by the [playwright-best-practices skill](.agents/skills/playwright-best-practices/SKILL.md) (specifically `debugging/flaky-tests.md`, `core/assertions-waiting.md`, `core/fixtures-hooks.md`), combined with targeted searches for known anti-patterns (`waitForTimeout`, `networkidle`, hard-coded indices, shared/seeded state, etc.) across `portal/pages`, `portal/components`, `portal/fixtures`, and `portal/tests`.
**Date:** 2026-09-16

> Note: the best-practices skill lives at [e2e/.agents/skills/playwright-best-practices](.agents/skills/playwright-best-practices/SKILL.md) (hidden `.agents` folder scoped to `e2e/`). That's the right place for it — it's local to this test suite, so it travels with the folder and doesn't need to live at the repo root.

## Executive Summary

The suite already follows several good practices that _prevent_ whole categories of flakiness:

- `workers: 1` and `fullyParallel: false` in [playwright.config.ts](playwright.config.ts) — the entire run is serialized, so there is currently no cross-worker/cross-test data collision.
- Every test resets and re-seeds the database via the `resetDBAndSeedRegistrations` / `onlyResetAndSeedRegistrations` fixtures ([portal/fixtures/fixture.ts](portal/fixtures/fixture.ts)), so state generally doesn't leak between spec files.
- `retries: 1`, `trace: 'on-first-retry'`, `video: 'on-first-retry'` are configured, and there's already a `test:find-flaky` script in [package.json](package.json) for flake-hunting.
- Good use of `expect(...).toPass()` for polling in a few places (e.g. [BasePage.ts](portal/pages/BasePage.ts) `navigateToProgramSettingsPage`, [TableComponent.ts](portal/components/TableComponent.ts) `validateWaitForTableRowCount`).

Despite this, the suite has a **systemic reliance on fixed-duration sleeps (`waitForTimeout`) and `networkidle`** to paper over async backend work (queues, cron jobs, table re-renders). This is the single biggest source of latent flakiness: it works today because CI/local machines happen to be fast enough, but timing margins are not guaranteed and will produce intermittent failures under load, on slower CI runners, or as data volumes grow. There is also one concrete **off-by-one bug** that will produce confusing timeouts, and a **structural risk** in the `fullyParallel: false` / `workers: 1` config that will surface widespread flakiness the moment someone re-enables parallelism for speed (a common future "optimization").

| Category                                                           | Count of distinct occurrences | Severity                               |
| ------------------------------------------------------------------ | ----------------------------- | -------------------------------------- |
| Fixed sleeps (`page.waitForTimeout`) masking async job/UI timing   | 20+ across 13 files           | High                                   |
| `networkidle` used as a load-completion signal                     | 10+ across 7 files            | Medium-High                            |
| Hard-coded row/element indices (`nth(0)`, loops)                   | Widespread                    | Medium                                 |
| Off-by-one loop bug                                                | 2 occurrences, 1 file         | Medium (correctness + flakiness)       |
| Shared seeded data across multiple tests in one file (`beforeAll`) | 10 files                      | Low today, High if parallelism changes |
| Backend cron/queue race conditions in payment tests                | 5 files                       | High                                   |

---

## 1. Fixed-duration sleeps (`page.waitForTimeout`)

**Why this causes flakiness:** A fixed sleep encodes an assumption about how long an async operation _usually_ takes. It doesn't fail loudly when that assumption is wrong — it either wastes time (sleep too long) or, intermittently, doesn't wait long enough (CI runner is under load, DB is slower, queue backed up), causing the next assertion to run against stale UI state. This matches the "Async/Timing Flakiness" pattern in the skill's `flaky-tests.md`.

**Where it occurs:**

- [portal/components/TableComponent.ts](portal/components/TableComponent.ts#L169) — `globalSearch()`: `waitForTimeout(500)` "to allow filter to be applied in the BE".
- [portal/components/TableComponent.ts](portal/components/TableComponent.ts#L176) — `clearAllFilters()`: same pattern.
- [portal/components/TableComponent.ts](portal/components/TableComponent.ts#L503) — `waitForTimeout(200)`.
- [portal/pages/FspSettingsPage.ts](portal/pages/FspSettingsPage.ts#L139) — waiting for inputs to render before validating FSP configuration.
- [portal/pages/FspSettingsPage.ts](portal/pages/FspSettingsPage.ts#L205) and [L211](portal/pages/FspSettingsPage.ts#L211) — waiting for a button/inputs to "load" in `addFsp()`.
- [portal/pages/PaymentPage.ts](portal/pages/PaymentPage.ts#L147) — `// TODO for now needed to bridge in-progress gap between actions & queue` — literally a documented race condition between clicking "start payment" and a backend queue.
- [portal/pages/PaymentPage.ts](portal/pages/PaymentPage.ts#L205) and [L222](portal/pages/PaymentPage.ts#L222) — `validateGraphStatus`/`validateTransferValues` wait 1s "for the graph to be updated after the loader is hidden" instead of asserting on the loader/graph state directly.
- [portal/pages/RegistrationsPage.ts](portal/pages/RegistrationsPage.ts#L83) and [L183](portal/pages/RegistrationsPage.ts#L183).
- Test files with the same pattern for backend jobs finishing:
  - [portal/tests/ChangeRegistrationStatus/ChangeStatusWithCustomMessageCombination.spec.ts](portal/tests/ChangeRegistrationStatus/ChangeStatusWithCustomMessageCombination.spec.ts#L42) (and [L67](portal/tests/ChangeRegistrationStatus/ChangeStatusWithCustomMessageCombination.spec.ts#L67))
  - [portal/tests/ChangeRegistrationStatus/ChangeStatusWithTemplatedMessageCombination.spec.ts](portal/tests/ChangeRegistrationStatus/ChangeStatusWithTemplatedMessageCombination.spec.ts#L42)
  - [portal/tests/DoPayment/DoSuccessfulPaymentWithNedbank.spec.ts](portal/tests/DoPayment/DoSuccessfulPaymentWithNedbank.spec.ts#L42) — `// wait a bit to allow the payment to start before running the CRON job`, and [L50](portal/tests/DoPayment/DoSuccessfulPaymentWithNedbank.spec.ts#L50)
  - [portal/tests/DoPayment/DoSuccessfulPaymentWithVoucher.spec.ts](portal/tests/DoPayment/DoSuccessfulPaymentWithVoucher.spec.ts#L46)
  - [portal/tests/ViewPayment/PaymentInProgressVisible.spec.ts](portal/tests/ViewPayment/PaymentInProgressVisible.spec.ts#L35) — `// wait a bit to allow the payment to start with 2^8 registrations` (comment literally acknowledges the timing depends on data volume)
  - [portal/tests/ProgramLevelAttachments/AddAttachmentsOnProgramLevel.spec.ts](portal/tests/ProgramLevelAttachments/AddAttachmentsOnProgramLevel.spec.ts#L71), [AddAttachmentsOnProgramLevelWithScopes.spec.ts](portal/tests/ProgramLevelAttachments/AddAttachmentsOnProgramLevelWithScopes.spec.ts#L58) (and [L88](portal/tests/ProgramLevelAttachments/AddAttachmentsOnProgramLevelWithScopes.spec.ts#L88)), [DeleteAttachment.spec.ts](portal/tests/ProgramLevelAttachments/DeleteAttachment.spec.ts#L67)
  - [portal/tests/ViewAndManagePeopleAffected/OpenRegistrationInNewTab.spec.ts](portal/tests/ViewAndManagePeopleAffected/OpenRegistrationInNewTab.spec.ts#L43) and [ValidateDuplicateBanner.spec.ts](portal/tests/ViewAndManagePeopleAffected/ValidateDuplicateBanner.spec.ts#L58) — both have the comment `//waitForNavigation and waitForLoadState do not work in this case`, i.e. a previous attempt to fix this properly was abandoned.
  - [portal/tests/ViewPayment/RetryPaymentWithExcelFsp.spec.ts](portal/tests/ViewPayment/RetryPaymentWithExcelFsp.spec.ts#L50)

**How it manifests as a flaky failure:** the next locator/assertion runs before the DOM has actually updated (table shows stale rows, chip still says "In progress", graph shows old numbers) and either times out or asserts against the wrong value — usually reproducible only under load (CI, `--repeat-each`, other processes competing for CPU/DB).

**Fix, per the skill's `assertions-waiting.md` and `flaky-tests.md`:**

- Replace sleeps with a condition that actually indicates completion:
  - For "filter applied in BE" (`globalSearch`, `clearAllFilters`): wait for the request/response (`page.waitForResponse(...)`) or for the table's loading indicator (`tableLoading`) to disappear and the row count/content to change, e.g. `await expect(this.tableLoading).toHaveCount(0)` (already available in `TableComponent.waitForLoaded()` — reuse it instead of a raw sleep).
  - For "payment queue processing" / cron-triggered updates (`PaymentPage`, `DoSuccessfulPaymentWithNedbank`, `PaymentInProgressVisible`): poll the actual UI/API state with `expect.poll()` or `expect(locator).toHaveText(...)`/`toBeVisible()` with a longer timeout instead of sleeping a fixed amount and hoping it's done — e.g. wait for the "In progress" chip to actually appear rather than sleeping 500ms and assuming it has.
  - For "wait for graph to update": assert on the `canvas[aria-label]` content directly with `expect.poll()`, since the assertion already reads that attribute — no sleep needed, `expect.poll` will retry until it matches.
  - For the two "waitForNavigation/waitForLoadState don't work" cases: use `context.waitForEvent('page')` to get a handle on the new tab/window directly instead of guessing how long opening a new tab takes:
    ```typescript
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      registrationsPage.performActionOnRegistrationByName({
        registrationName,
        action: 'Open in new tab',
      }),
    ]);
    await newPage.waitForLoadState();
    ```

---

## 2. `networkidle` as a completion signal

**Why this causes flakiness:** Playwright's own docs discourage `networkidle`/`'load'`-based waiting for anything beyond initial page load, because SPAs (this is Angular) keep background connections open (polling, analytics, websockets), so "idle" is a coincidence, not a guarantee tied to the specific data the test cares about. The skill's `assertions-waiting.md` explicitly favors "auto-waiting" web-first assertions and `waitForResponse` over generic load-state waits.

**Where it occurs:**

- [portal/pages/BasePage.ts](portal/pages/BasePage.ts#L163) `waitForPageLoad()` and [L168](portal/pages/BasePage.ts#L168) `validateFormError()` — used repeatedly by many pages/tests.
- [portal/pages/FspSettingsPage.ts](portal/pages/FspSettingsPage.ts#L221)
- [portal/pages/PaymentPage.ts](portal/pages/PaymentPage.ts#L189) `selectPaymentExportOption()`
- [portal/pages/ProgramMonitoringPage.ts](portal/pages/ProgramMonitoringPage.ts#L180) and [L191](portal/pages/ProgramMonitoringPage.ts#L191)
- [portal/pages/RegistrationsPage.ts](portal/pages/RegistrationsPage.ts#L232) (×3 call sites at [L232-233](portal/pages/RegistrationsPage.ts#L232), [L258-259](portal/pages/RegistrationsPage.ts#L258), [L306-307](portal/pages/RegistrationsPage.ts#L306))
- [portal/tests/RegistrationPage/InitiateActions.spec.ts](portal/tests/RegistrationPage/InitiateActions.spec.ts#L77) (×2)
- [portal/tests/ViewPayment/RetryFailedTransactions.spec.ts](portal/tests/ViewPayment/RetryFailedTransactions.spec.ts#L42) and [L79](portal/tests/ViewPayment/RetryFailedTransactions.spec.ts#L79) — `page.goto(url, { waitUntil: 'networkidle' })`, annotated with `// Leaving this for now / My assumption is that there are a lot of jobs running in the background...` — this is a self-acknowledged workaround for the same underlying async-job timing problem as section 1, just solved with `networkidle` instead of a sleep.

**How it manifests:** intermittent timeouts on `waitForLoadState('networkidle')` itself (if the app keeps _any_ connection open, e.g. long-polling, it never resolves and the call times out), or false-negative "it loaded" signals where the network is idle but the specific DOM update the test cares about hasn't happened yet (this is exactly what's happening in `RetryFailedTransactions.spec.ts`, where the workaround is a full page reload).

**Fix:**

- Replace `waitForLoadState('networkidle')` with an assertion on the specific element/state the caller actually needs (e.g. `await expect(this.formError).toBeVisible()` instead of `networkidle` + `formError.waitFor()` in `validateFormError`; the manual `.waitFor()` call afterwards already proves the `networkidle` wait wasn't sufficient on its own).
- For `goToRegistrationByName`/`performActionOnRegistrationByName`/`InitiateActions.spec.ts`: wait for the specific table content to settle, e.g. `await this.table.waitForLoaded()`, which already exists and is more precise than `networkidle` + `domcontentloaded`.
- For `RetryFailedTransactions.spec.ts`: wait for the retry-relevant data (e.g. the failed-transaction count/badge) to reach the expected state via `expect.poll()` instead of reloading the page and hoping `networkidle` lines up with the backend job.

---

## 3. Off-by-one loop bug (correctness + flakiness)

**Where:** [portal/pages/RegistrationsPage.ts](portal/pages/RegistrationsPage.ts#L235) in `goToRegistrationByName()` and [L261](portal/pages/RegistrationsPage.ts#L261) in `performActionOnRegistrationByName()`:

```typescript
const rowCount = await this.table.tableRows.count();
for (let i = 0; i <= rowCount; i++) {
  const fullName = await this.table.getCell(i, 2);
  const fullNameText = (await fullName.textContent())?.trim();
  ...
```

`i <= rowCount` iterates one past the last valid row index (rows are 0-indexed, so valid indices are `0..rowCount-1`). On the final loop iteration, `getCell(rowCount, 2)` resolves to a `Locator` matching zero elements, and `.textContent()` on it will wait up to the action timeout (20s, per `playwright.config.ts`) before resolving/throwing.

**Impact:** if the target registration happens to be the _last_ row, or isn't found at all, the test either takes ~20s longer than necessary or fails with a generic timeout error rather than the intended `Registration not found` error — this is exactly the kind of failure that looks flaky/mysterious in CI logs because the real cause (an indexing bug) is masked by a timeout.

**Fix:** change both loops to `i < rowCount`.

---

## 4. Hard-coded row/element indices

**Why this can cause flakiness:** using `nth(0)`, `nth(1)`, etc. assumes a stable render/sort order. If the underlying data ordering isn't guaranteed by the backend (e.g. rows ordered by insertion time when multiple registrations are seeded "simultaneously", or a column whose default sort isn't deterministic), the "first row" can silently become a different registration between runs, causing assertions to fail unpredictably rather than reliably.

**Where it's most risk-prone** (as opposed to legitimably scoped uses like "first" toast/dialog on the page, which are fine):

- [portal/pages/RegistrationsPage.ts](portal/pages/RegistrationsPage.ts#L211) `validateStatusOfFirstRegistration` and [L221](portal/pages/RegistrationsPage.ts#L221) `validateEmptyField` — both assume row `0` is a specific, deterministic registration.
- [portal/components/TableComponent.ts](portal/components/TableComponent.ts#L394) `getCell`-based helpers used for "first row" checks.
- [portal/pages/ProgramSettingsRegistrationDataPage.ts](portal/pages/ProgramSettingsRegistrationDataPage.ts#L211) — `programAttributesTable.nth(0)`.

**Fix:** where the test's intent is "the registration I just seeded/acted on", locate the row by a stable identifier (name/reference id) via `goToRegistrationByName`-style lookup or a `filter({ hasText })`, rather than by position. Where position genuinely doesn't matter (e.g. "some toast is visible"), keep `.first()` but consider a short comment (some already have one, e.g. `TableComponent.ts` clearAllFiltersButton) explaining why position is safe there.

---

## 5. Shared seeded state across multiple tests in one file (`beforeAll`)

**Where:** ten files use `test.beforeAll(async ({ onlyResetAndSeedRegistrations }) => ...)` to seed once for an entire `describe` block / file, then run 2+ tests against that same seeded data, e.g.:

- [portal/tests/ChangeRegistrationStatus/ChangeStatusWithCustomMessageCombination.spec.ts](portal/tests/ChangeRegistrationStatus/ChangeStatusWithCustomMessageCombination.spec.ts#L16) — two tests act on two different registrations (`registrationPV5`, `registrationPV6`) from the same seed.
- Similarly in `ChangeStatusWithTemplatedMessageCombination.spec.ts`, `CreateProgramSuccessfully.spec.ts`, `CloseDebitCard.spec.ts`, `EditRegistration.spec.ts`, `ExportRegistrationsList.spec.ts`, `BasicNavigation.spec.ts`, `FilterActivityOverviewTable.spec.ts`, `AddAttachmentsOnProgramLevel.spec.ts`, `AddAttachmentsOnProgramLevelWithScopes.spec.ts`.

**Why this isn't a problem _today_:** `workers: 1` and `fullyParallel: false` guarantee tests within a file run strictly in sequence, and different files don't interleave, so there's no concurrent mutation of the shared seed.

**Why this is a latent risk:** this pattern creates **implicit order/data dependencies** between tests in the same file — e.g. test 2 must run after test 1 and both must use non-overlapping registrations from the shared seed to avoid cross-test contamination. This is invisible until:

1. Someone flips `fullyParallel: true` or increases `workers` for speed (a very common, reasonable-looking change) — at that point, per the skill's "Data/parallelism-driven flakiness" category, these tests can start running concurrently against the same seeded rows and corrupt each other's state.
2. Someone reorders tests, or Playwright's shard/`--grep` selection causes only one test in the file to run without realizing the seed data was tuned for both tests running together.

**Fix:**

- Prefer `beforeEach` with per-test seeding (as most of the other ~90% of spec files already do) unless the `beforeAll` is purely a performance optimization for expensive, read-only setup.
- If `beforeAll` sharing is kept for performance, add a code comment on the fixture/describe block stating the serialization assumption explicitly (`workers: 1` / `fullyParallel: false` required), and/or mark such files with `test.describe.configure({ mode: 'serial' })` so the dependency is explicit in code rather than only implied by global config — this way, if global parallelism is ever increased, these files remain safe.

---

## 6. Backend job/queue race conditions (payments & cron)

**Why this is the highest-severity category:** several payment tests trigger a backend action (start payment, run a cron job) and then assert on UI state that depends on an asynchronous queue/cron finishing. Today this is bridged with fixed sleeps (see section 1), which is inherently non-deterministic. Comments in the code already acknowledge this:

- `PaymentPage.ts` line 147: `// TODO for now needed to bridge in-progress gap between actions & queue.`
- `DoSuccessfulPaymentWithNedbank.spec.ts` line 42: `// wait a bit to allow the payment to start before running the CRON job`
- `RetryFailedTransactions.spec.ts` lines 42/79: `// My assumption is that there are a lot of jobs running in the background and for the test to retry the failed transactions correctly we need to re-navigate to payment overview page`

**Fix:** expose (or reuse, if it already exists in `services/121-service/test/helpers`) a way to assert job completion deterministically — e.g. poll the payment/transaction status via the API (`request` fixture) with `expect.poll()` until the expected status is reached, then proceed with UI assertions. This removes the guesswork entirely and will usually be _faster_ than the current fixed sleeps, not slower.

---

## 7. Configuration-level risk: single point of failure for parallel-safety

[playwright.config.ts](playwright.config.ts) sets `workers: 1` and `fullyParallel: false`. This is effectively the safety net that prevents sections 4 and 5 above from causing visible flakiness today. It comes at a real cost (the entire suite runs fully serially, so total run time scales linearly with test count), which makes it likely someone will eventually try to parallelize for speed. When that happens, tests relying on shared seeded state, global test data constants (e.g. `programIdPV`, `programIdOCW` reused across many files), or hard-coded row ordering will start failing intermittently and be hard to diagnose, because they've never needed to be parallel-safe before.

**Recommendation:** if/when parallelism is introduced, do it incrementally and use the skill's `fixtures-hooks.md` "Isolate test data between parallel workers" pattern (worker-scoped fixtures keyed by `testInfo.workerIndex`) for any test that creates/mutates programs or registrations, rather than assuming file-level `beforeAll`/shared seed constants are safe.

---

## Prioritized Action List

1. **Fix the off-by-one loop** in `RegistrationsPage.ts` (`goToRegistrationByName`, `performActionOnRegistrationByName`) — quick, high-value, zero-risk fix.
2. **Replace `waitForTimeout` calls tied to backend job/queue completion** (payments, cron, table filters) with `expect.poll()` / response-based waits — highest flakiness-reduction value, especially for `PaymentPage.ts`, the `DoPayment/*` and `ViewPayment/*` specs.
3. **Replace `networkidle` usages** with targeted element/state assertions, especially in `BasePage.waitForPageLoad`/`validateFormError` since they're used broadly across the suite — fixing them once improves many call sites.
4. **Audit `beforeAll`-based shared-seed spec files** and either switch to `beforeEach` or explicitly mark them `test.describe.configure({ mode: 'serial' })` to make the ordering dependency explicit and future-proof.
5. **Reduce hard-coded row-index assumptions** (`nth(0)` for "the" registration) in favor of name/id-based lookups where the test's intent is a specific seeded row.

## Verifying fixes

Per the skill's validation loop, after applying fixes, confirm stability with the repo's own flake-hunting script:

```bash
npm run test:find-flaky -- --grep "<affected test name>"
```

or more generally:

```bash
npx playwright test <spec> --repeat-each=20 --workers=1
```
