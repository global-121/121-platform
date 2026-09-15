# Findings: Flaky column order in payment/registration exports

## Symptom

`ViewPayments/ExportPayments.spec.ts` (and other export tests) intermittently
failed a `toMatchSnapshot` assertion. The data values were correct, but the
column order in the exported CSV/XLSX differed between runs, e.g.:

```
- ...,paymentCount,fullName,phoneNumber,whatsappPhoneNumber,addressStreet,addressHouseNumber,addressHouseNumberAddition,addressPostalCode,addressCity
+ ...,paymentCount,addressCity,addressHouseNumber,addressHouseNumberAddition,addressPostalCode,addressStreet,fullName,phoneNumber,whatsappPhoneNumber
```

The second (failing) run's dynamic columns came back in alphabetical order,
while the first run preserved insertion/creation order.

## Root cause (backend)

The export column list is built in
[`PaymentsReportingHelperService.getSelectForExport`](../services/121-service/src/payments/services/payments-reporting.helper.service.ts):

```ts
private async getProgramAttributeNamesIncludedInExport(
  programId: number,
): Promise<string[]> {
  const programRegistrationAttributes =
    await this.programRegistrationAttributeRepository.find({
      where: {
        programId: Equal(programId),
        includeInTransactionExport: Equal(true),
      },
    });

  return programRegistrationAttributes.map((attr) => attr.name);
}
```

This `find()` call has **no `order` clause**. Postgres does not guarantee row
order for a query without `ORDER BY` — the physical order can change between
runs depending on the query plan (seq scan vs. index scan), autovacuum,
caching, etc. Since the returned array order directly determines the export's
column order, the column order is effectively non-deterministic.

This is a genuine backend gap, not just a test issue: any consumer relying on
a stable order from this method (or similar unordered `find()` calls on
`ProgramRegistrationAttributeEntity`) is subject to the same flakiness.

## Recommended backend fix

Add an explicit, deterministic `order` to the query, e.g. order by `id` (or a
dedicated display-order/seq column if one exists/should exist for attribute
ordering):

```ts
const programRegistrationAttributes =
  await this.programRegistrationAttributeRepository.find({
    where: {
      programId: Equal(programId),
      includeInTransactionExport: Equal(true),
    },
    order: { id: 'ASC' },
  });
```

Worth checking whether other `find()` calls against
`ProgramRegistrationAttributeEntity` (e.g. in `programs.service.ts`) have the
same gap and would benefit from consistent ordering for predictable API/export
behavior.

## Test-side mitigation (already applied)

Independent of the backend fix, [`BasePage.ts`](../e2e/portal/pages/BasePage.ts)'s
`validateExportedFile` now sorts header/data columns alphabetically before
building the snapshot string, so the test no longer depends on column order
at all. This makes the test robust regardless of whether the backend is fixed,
but does not address the underlying non-determinism for real API consumers.
