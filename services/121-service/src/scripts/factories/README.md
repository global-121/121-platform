# Type-Safe Mock Data Factory System

This document describes the new type-safe factory system that replaces the raw SQL-based seeding approach.

## Overview

The previous seeding system used raw SQL scripts that were:

- Fragile and broke with schema changes
- Not type-safe
- Difficult to maintain and adapt
- Prone to errors due to string concatenation and manual ID management

The new factory system provides:

- **Type Safety**: All data generation uses TypeORM entities and TypeScript interfaces
- **Maintainability**: Easy to adapt when the data model changes
- **Performance**: Batch operations for large datasets
- **Reusability**: Factory pattern for generating different types of mock data
- **Testability**: Easy to unit test and mock

## Architecture

### Base Factory

All factories extend `BaseDataFactory<T>` which provides:

- Common batch processing functionality
- Type-safe entity creation methods
- Utility methods for generating mock data
- Sequence number management

### Concrete Factories

- `RegistrationDataFactory`: Creates mock registration data
- `RegistrationAttributeDataFactory`: Creates mock registration attribute data
- `TwilioMessageDataFactory`: Creates mock message data
- `PaymentDataFactory`: Creates mock payment and transaction data

### Orchestration Service

`MockDataFactoryService` coordinates multiple factories to create complex data relationships.

## Usage

### Basic Factory Usage

```typescript
import { RegistrationDataFactory } from '@121-service/src/scripts/factories/registration-data-factory';

const factory = new RegistrationDataFactory(dataSource);

// Generate mock registrations
const registrations = await factory.generateMockData(100, {
  programId: 1,
  registrationStatus: RegistrationStatusEnum.included,
  preferredLanguage: LanguageEnum.en,
});

// Duplicate existing registrations
const duplicates = await factory.duplicateExistingRegistrations(2);
```

### Comprehensive Data Generation

```typescript
import { MockDataFactoryService } from '@121-service/src/scripts/factories/mock-data-factory.service';

const service = new MockDataFactoryService(dataSource);

// Generate all related data (registrations, payments, messages)
await service.multiplyRegistrationsAndRelatedPaymentData(5, {
  registrationOptions: {
    programId: 1,
    registrationStatus: RegistrationStatusEnum.included,
    preferredLanguage: LanguageEnum.en,
  },
  messageOptions: {
    accountSid: 'AC_test',
    from: '+1234567890',
    status: TwilioStatus.delivered,
    type: NotificationType.Sms,
  },
  paymentOptions: {
    programId: 1,
  },
});
```

### Backward Compatible Service

The `SeedMockHelperServiceTyped` provides a drop-in replacement for the original service:

```typescript
import { SeedMockHelperServiceTyped } from '@121-service/src/scripts/services/seed-mock-helper-typed.service';

const helper = new SeedMockHelperServiceTyped(dataSource);

// Same interface as the original service
await helper.multiplyRegistrations(3);
await helper.multiplyTransactions(5, [1, 2]);
await helper.multiplyMessages(2);
```

## Factory Details

### RegistrationDataFactory

**Methods:**

- `generateMockData(count, options)`: Create new registrations
- `duplicateExistingRegistrations(multiplier)`: Duplicate all existing registrations
- `makePhoneNumbersUnique()`: Ensure all phone numbers are unique

**Options:**

```typescript
interface RegistrationFactoryOptions {
  readonly programId: number;
  readonly programFspConfigurationId?: number;
  readonly registrationStatus?: RegistrationStatusEnum;
  readonly preferredLanguage?: LanguageEnum;
  readonly scope?: string;
}
```

### TwilioMessageDataFactory

**Methods:**

- `generateMockData(count, options)`: Create new messages
- `duplicateExistingMessages(multiplier)`: Duplicate existing messages
- `generateMessagesForRegistrations(registrations, options)`: Create one message per registration
- `updateLatestMessages()`: Update the latest_message table

**Options:**

```typescript
interface TwilioMessageFactoryOptions {
  readonly accountSid: string;
  readonly from: string;
  readonly userId?: number;
  readonly status?: TwilioStatus;
  readonly type?: NotificationType;
  readonly processType?: MessageProcessType;
  readonly contentType?: MessageContentType;
}
```

### PaymentDataFactory

**Methods:**

- `generateMockData(count, options)`: Create new payments
- `createPaymentForProgram(programId)`: Create a single payment
- `createTransactionsForPayment(paymentId, programId)`: Create transactions for a payment
- `updatePaymentCounts()`: Update registration payment counts
- `updateLatestTransactions()`: Update the latest_transaction table

## Migration Guide

### Phase 1: Add New Factories

✅ **COMPLETED**: New factory system implemented alongside existing SQL approach

### Phase 2: Update Scripts Module

Add the new services to the scripts module:

```typescript
@Module({
  providers: [
    // ... existing providers
    SeedMockHelperServiceTyped,
    MockDataFactoryService,
  ],
})
export class ScriptsModule {}
```

### Phase 3: Gradual Migration

Replace usage of `SeedMockHelperService` with `SeedMockHelperServiceTyped`:

```typescript
// Before
private readonly seedMockHelper: SeedMockHelperService,

// After
private readonly seedMockHelper: SeedMockHelperServiceTyped,
```

### Phase 4: Remove Raw SQL

Once all usage is migrated:

1. Remove SQL files from `/src/scripts/sql/`
2. Remove `SeedMockHelperService`
3. Update tests and documentation

## Benefits

### Type Safety

- Compile-time validation of entity structures
- Auto-completion and refactoring support
- Reduced runtime errors

### Maintainability

- Changes to entity models automatically reflected
- Clear interfaces for factory options
- Easy to extend for new entity types

### Performance

- Batch operations for large datasets
- Efficient database queries using TypeORM
- Transaction support for data consistency

### Testing

- Easy to mock and unit test
- Clear separation of concerns
- Factories can be tested independently

## SQL Script Replacements

| SQL Script                               | Factory Replacement                                                 |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `mock-registrations.sql`                 | `RegistrationDataFactory.duplicateExistingRegistrations()`          |
| `mock-registration-data.sql`             | `RegistrationAttributeDataFactory.duplicateExistingAttributeData()` |
| `mock-make-phone-unique.sql`             | `RegistrationDataFactory.makePhoneNumbersUnique()`                  |
| `mock-messages.sql`                      | `TwilioMessageDataFactory.duplicateExistingMessages()`              |
| `mock-messages-one-per-registration.sql` | `TwilioMessageDataFactory.generateMessagesForRegistrations()`       |
| `mock-latest-message.sql`                | `TwilioMessageDataFactory.updateLatestMessages()`                   |
| `mock-create-payment.sql`                | `PaymentDataFactory.createPaymentForProgram()`                      |
| `mock-payment-transactions.sql`          | `PaymentDataFactory.createTransactionsForPayment()`                 |
| `mock-update-payment-count.sql`          | `PaymentDataFactory.updatePaymentCounts()`                          |
| `mock-latest-transactions.sql`           | `PaymentDataFactory.updateLatestTransactions()`                     |

## Future Enhancements

### FSP-Specific Factories

Create dedicated factories for FSP-specific entities:

- `IntersolveVoucherDataFactory`
- `VisaWalletDataFactory`
- `SafaricomTransferDataFactory`

### Configuration-Driven Generation

Support for generating data based on configuration files:

```typescript
interface DataGenerationConfig {
  registrations: {
    count: number;
    programs: number[];
    statusDistribution: Record<RegistrationStatusEnum, number>;
  };
  payments: {
    paymentsPerProgram: number;
    transactionStatuses: string[];
  };
}
```

### Performance Optimizations

- Bulk insert operations
- Parallel processing for independent operations
- Memory-efficient streaming for large datasets

## Conclusion

The new type-safe factory system provides a robust, maintainable foundation for mock data generation. It eliminates the fragility of raw SQL while maintaining or improving performance for large datasets.

The backward-compatible interface ensures a smooth migration path, allowing teams to adopt the new system gradually while maintaining existing functionality.
