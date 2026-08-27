# Review: `e2e/portal/tests/DoPayment/`

## 🔴 Bug risk: mutating shared, imported test data

```ts
// DoFailedPaymentWithCbe.spec.ts
registrationsCbe[0].fullName = 'error';

// DoFailedPaymentWithSafaricom.spec.ts
registrationsSafaricom[0].phoneNumber = '254000000000';
```

Both `registrationsCbe` and `registrationsSafaricom` are imported from the shared module
`@121-service/test/registrations/pagination/pagination-data`. Node caches modules per worker
process, so this mutates the _same array instance_ that other spec files importing the same
export also use. If Playwright schedules multiple spec files in one worker (default behavior), a
later test using `registrationsCbe` could unexpectedly get `fullName: 'error'` from this test's
side effect — a classic source of order-dependent flakiness.

**Fix:** clone before mutating, e.g.

```ts
const registrations = structuredClone(registrationsCbe);
registrations[0].fullName = 'error';
```

and use the local `registrations` variable everywhere instead of the imported one.

## 🟡 Stale/incorrect comment

In `DoFailedPaymentWithSafaricom.spec.ts`:

```ts
// First try to validate the payment card where system still waits for the response from the PA with Voucher payment method.
await paymentsPage.validatePaymentCard({...});
```

This comment references "Voucher payment method" in a Safaricom test — looks copy-pasted and left
uncorrected. It's misleading for future maintainers and should either be fixed or removed.

## 🟡 Heavy duplication across near-identical specs

`DoSuccessfulPaymentWithVisa/Safaricom/Nedbank/Voucher.spec.ts` are structurally identical: same
`beforeEach`, same `defaultMaxTransferValue` reduce logic, same `test.step` sequence. The only real
differences are the seed script, program JSON, and registration fixture.

```ts
const defaultMaxTransferValue = registrations.reduce((output, pa) => {
  return output + pa.paymentAmountMultiplier * defaultTransferValue;
}, 0);
```

This exact block is repeated 6+ times. Consider:

- Extracting a shared helper, e.g. `calculateExpectedPaymentAmount(registrations, transferValue)`
  in a test-utils file.
- Optionally, a data-driven test (`for (const fsp of fsps)` or `test.describe.each`-style loop)
  parameterized by `{ seedScript, program, registrations, currency }`, to cut duplication to one
  spec body. This is a bigger structural change — worth discussing before doing, since some FSPs
  (Excel, Nedbank) have extra steps that don't fit the generic shape.

## 🟡 Arbitrary `waitForTimeout` calls treated as normal flow control

```ts
await page.waitForTimeout(500); // TODO for now needed to bridge in-progress gap between actions & queue.
await page.waitForTimeout(1000); // Wait for the graph to be updated after the loader is hidden
await page.waitForTimeout(500); // wait a bit to allow the payment to start before running the CRON job
await page.waitForTimeout(1000); // In case of Nedbank, we need to wait for the payment to be processed...
```

Several specs and page-object methods rely on fixed sleeps instead of waiting on an actual signal
(network response, element state, polling assertion). These are timing-dependent and a common
source of CI flakiness — they'll pass locally/on fast CI and intermittently fail under load. Prefer
`expect.poll(...)`, waiting for a specific API response (`page.waitForResponse`), or a UI state
change.

## 🟡 Inconsistent toast-message coverage

Only `DoFailedPaymentWithCbe` and `DoSuccessfulPaymentWithVoucher` assert toast messages
(`validateToastMessageAndClose`), with a comment in the Voucher test admitting the choice is
arbitrary ("just this 1 (random) FSP instead of for all"). This means toast-message regressions for
Visa/Safaricom/Nedbank payment flows wouldn't be caught. Either assert consistently everywhere or
centralize the toast assertions in a single, dedicated toast-behavior test instead of scattering
them ad hoc.

## 🟡 Data-model inconsistency test code must special-case

```ts
currency: CbeProgram.currency,
currency: KRCSProgram.currency,
currency: NedbankProgram.currencySymbol,   // different property name
```

Not a test bug per se, but the seed-data JSON files use inconsistent property names (`currency` vs
`currencySymbol`) for the same concept, forcing tests to know which one applies per program. Worth
flagging to align the underlying seed data schema.

## 🟢 Minor/consistency nits

- `DoPaymentWithCustomName` / `DoPaymentWithEmptyName` skip `test.step` wrapping while every other
  spec in the folder uses it — harmless but inconsistent structure.
- The `/en-GB/` locale prefix and `/payments/1` (magic `1`) are repeated across every
  `waitForURL` call. A small helper like `buildPaymentDetailsUrl(programId, paymentId = 1)` would
  remove repetition and make intent (default first payment) explicit.
- No "failed payment" spec exists for Visa, Nedbank, Voucher, or Excel FSPs — only Cbe and
  Safaricom test the failure path. Possibly an intentional scope decision, but worth confirming
  it's not a coverage gap.

## 🔴 Flakiness: `waitForPaymentToComplete()` race condition

```ts
// PaymentPage.ts
async waitForPaymentToComplete() {
  await this.page.waitForTimeout(500); // TODO for now needed to bridge in-progress gap between actions & queue.
  const approvedChip = this.page.locator('app-colored-chip').getByLabel('Approved').first();
  const inProgressChip = this.page.locator('app-colored-chip').getByLabel('In progress');

  await inProgressChip.waitFor({ state: 'hidden' });
  await approvedChip.waitFor({ state: 'visible' });
}
```

This method is used by nearly every payment spec in this folder. The fixed 500ms sleep assumes the
"In progress" chip has already rendered by the time `inProgressChip.waitFor({ state: 'hidden' })`
runs. If the backend queue is slower than 500ms (likely under CI load), the chip may not have
appeared yet, so `waitFor({ state: 'hidden' })` resolves trivially/immediately (an element that was
never visible is already "hidden"), giving a false sense of synchronization before falling through
to wait for "Approved". This is a race condition, not just a slow/arbitrary wait — it should instead
wait for the "In progress" chip to become **visible** first (or poll on the underlying transaction
status via API/UI) before waiting for it to disappear.

## 🟡 Flakiness: graph/amount assertions rely on fixed sleeps instead of polling

```ts
async validateGraphStatus({...}) {
  await this.page.waitForTimeout(1000); // Wait for the graph to be updated after the loader is hidden
  const graph = await this.page.locator('canvas').getAttribute('aria-label');
  ...
}

async validateTransferValues({ amount }: { amount: number }) {
  await this.page.waitForTimeout(1000); // Wait for the graph to be updated after the loader is hidden
  ...
}
```

Both read a snapshot value once, after a fixed 1s sleep, then assert on it — instead of retrying
until the expected value appears. Prefer `expect.poll(() => canvas.getAttribute('aria-label'))...`
or an `expect(locator).toHaveAttribute(...)`-style assertion so the test waits exactly as long as
needed (and no longer) instead of a guessed constant.

## 🟡 Flakiness: `validateApprovalFlowStep` uses a one-shot `isVisible()` instead of an assertion

```ts
if (approved) {
  const icon = row.locator(`.pi-check`);
  return await icon.isVisible();
}
```

`isVisible()` returns a single snapshot boolean with no auto-retry/wait, unlike `expect(icon).toBeVisible()`.
If the icon hasn't rendered yet at the exact moment this runs, the check can return `false` even
though the icon appears a moment later — and because the method _returns_ the boolean rather than
asserting it, a caller that doesn't explicitly check the return value would silently pass a test
that should have failed. Also uses a CSS class selector (`.pi-check`) rather than the role/testid
convention used elsewhere in the page objects.

## 🟡 Flakiness: `dismissToastIfVisible` snapshots toasts before acting on them

```ts
async dismissToastIfVisible(message?: string) {
  let toastLocator = this.toast;
  if (message) {
    toastLocator = this.toast.filter({ hasText: message });
  }
  const visibleToasts = await toastLocator.all();
  for (const toast of visibleToasts) {
    if (await toast.isVisible()) {
      await toast.getByRole('button').click();
```

`.all()` takes a snapshot of matching elements at that instant. Toasts auto-dismiss after ~5s
(per the comment in `validateToastMessage`), so between the snapshot and the subsequent
`isVisible()`/`click()` calls, a toast could already be gone, causing an intermittent failure when
clicking a detached/hidden element under slower CI runs.

## 🟢 Minor: inconsistent toast locator strictness

```ts
async validateToastMessage(message: string) {
  await expect(this.toast).toBeVisible();   // no .first()
  ...
}

async validateToastMessageAndClose(message: string) {
  await expect(this.toast.first()).toBeVisible({ timeout: 5_000 }); // uses .first()
  ...
}
```

`validateToastMessage` doesn't scope to `.first()` like its sibling method. If more than one toast
is ever visible at once, this will throw a Playwright strict-mode violation instead of a clear
assertion failure.

## 🟢 Minor: legacy/inconsistent waiting APIs

`validateTransferHistoryDialogTitle` uses `page.waitForSelector('role=dialog')`, a legacy selector
API, instead of the locator-based `expect(this.dialog).toBeVisible()` pattern used elsewhere in the
same file (`this.dialog = this.page.getByRole('alertdialog')` is already defined on `BasePage` but
not reused here). Mixing waiting styles makes behavior less predictable and harder to reason about
under load.

## 🟢 Minor: `:nth-child` CSS selectors for table cells

```ts
const overviewColumn = await row.locator('td:nth-child(1)').textContent();
const doneByColumn = await row.locator('td:nth-child(2)').textContent();
```

Positional CSS selectors in `validateTransactionHistoryTableValues` are fragile to column
reordering/markup changes, unlike the role/testid-based locators used elsewhere in the codebase.

## Suggested priority

1. Fix the shared-array mutation (real correctness risk).
2. Fix the `waitForPaymentToComplete()` race condition (likely root cause of intermittent CI flakes).
3. Fix/remove the stale Voucher comment in the Safaricom test.
4. Extract the repeated `reduce` calculation into a helper.
5. Replace fixed `waitForTimeout` sleeps (graph/amount validation, Nedbank CRON wait) with polling assertions.
6. Fix `dismissToastIfVisible`'s snapshot-then-act race and align `validateToastMessage` to use `.first()`.
