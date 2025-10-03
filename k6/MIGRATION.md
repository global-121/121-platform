# K6 to Jest Performance Test Migration

## ⚠️ DEPRECATED: K6 Performance Tests

**The K6 performance tests in this directory have been migrated to Jest and are now deprecated.**

**New Location**: `services/121-service/test/performance/`

## Migration Summary

All 9 K6 performance tests have been successfully migrated to Jest with equivalent functionality:

| K6 Test File | Jest Test File | Status |
|--------------|----------------|---------|
| `import1000Registrations.js` | `import-1000-registrations.test.ts` | ✅ Migrated |
| `payment100kRegistrationSafaricom.js` | `payment-100k-safaricom.test.ts` | ✅ Migrated |
| `payment100kRegistrationIntersolveVisa.js` | `payment-100k-intersolve-visa.test.ts` | ✅ Migrated |
| `performanceDuringPayment.js` | `performance-during-payment.test.ts` | ✅ Migrated |
| `BulkUpdate32kRegistration.js` | `bulk-update-32k-registrations.test.ts` | ✅ Migrated |
| `findDuplicates100kRegistrations.js` | `find-duplicates-100k-registrations.test.ts` | ✅ Migrated |
| `getProgramWithManyAttributes.js` | `get-program-many-attributes.test.ts` | ✅ Migrated |
| `retryFailedJobsOnStartupDuringQueueProcessing.js` | `retry-failed-jobs-startup.test.ts` | ✅ Migrated |
| `statusChangePaymentInLargeProgram.js` | `status-change-payment-large-program.test.ts` | ✅ Migrated |

## Why Jest?

### Benefits of Migration

1. **Unified Testing Framework**: All tests (unit, integration, performance) now use Jest
2. **Type Safety**: Full TypeScript support with compile-time error checking
3. **Better Developer Experience**: Superior IDE support, debugging, and error reporting
4. **Maintainability**: Shared utilities and consistent patterns across all test types
5. **CI/CD Integration**: Better integration with existing Node.js tooling

### Equivalent Functionality

The Jest tests provide the same performance validation as K6:
- ✅ Same performance thresholds (error rates, response times)
- ✅ Same load generation capabilities (large datasets)
- ✅ Same workflow automation (complex multi-step scenarios)
- ✅ Same environment variable support (`DUPLICATE_NUMBER`)
- ✅ Same CI/CD integration patterns

## Migration Timeline

| Phase | Status | Date |
|-------|--------|------|
| Analysis & Planning | ✅ Complete | |
| Jest Framework Setup | ✅ Complete | |
| Test Migration (9 tests) | ✅ Complete | |
| CI/CD Workflow Update | ✅ Complete | |
| K6 Deprecation | 🔄 In Progress | |
| K6 Removal | ⏳ Pending | |

## Using the New Jest Tests

### Quick Start

```bash
cd services/121-service

# Run all performance tests
npm run test:performance:all

# Run specific test
npm run test:performance:import
npm run test:performance:payment-safaricom
```

### Environment Variables

Same as K6 tests:

```bash
# Light load (default)
DUPLICATE_NUMBER=5 npm run test:performance:bulk-update

# Heavy load
DUPLICATE_NUMBER=17 npm run test:performance:find-duplicates
```

### CI/CD

New workflows replace K6:
- `.github/workflows/test_performance_jest.yml` (replaces `test_k6.yml`)
- `.github/workflows/test_performance_jest_cronjob.yml` (replaces `test_k6_cronjob.yml`)

## Deprecation Plan

### Phase 1: Transition Period ✅
- Jest tests are fully functional and equivalent to K6
- Both K6 and Jest tests run in parallel
- Teams can choose which to use

### Phase 2: K6 Deprecation 🔄
- K6 workflows disabled in CI/CD
- Documentation updated to point to Jest tests
- K6 directory marked as deprecated

### Phase 3: K6 Removal ⏳
- K6 tests and dependencies removed
- K6 directory deleted
- Complete migration to Jest

## For Developers

### If You're Currently Using K6

**Recommended Action**: Switch to the new Jest performance tests immediately.

```bash
# Old K6 way
cd k6
DUPLICATE_NUMBER=5 npx dotenv -e ../services/.env -- ./k6 run tests/BulkUpdate32kRegistration.js

# New Jest way  
cd services/121-service
DUPLICATE_NUMBER=5 npm run test:performance:bulk-update
```

### If You Need to Modify Performance Tests

**Important**: Make changes in the Jest tests, not the K6 tests.

Location: `services/121-service/test/performance/`

### If You're Adding New Performance Tests

**Required**: Add new tests as Jest tests only.

See: `services/121-service/test/performance/README.md`

## Support

### Documentation
- Jest Performance Tests: `services/121-service/test/performance/README.md`
- Jest Configuration: `services/121-service/jest.performance.config.js`

### Getting Help
If you need help migrating or have questions about the new Jest tests:
1. Check the documentation in `services/121-service/test/performance/README.md`
2. Review existing Jest test examples
3. Ask the development team

## FAQ

**Q: Do the Jest tests provide the same performance validation as K6?**
A: Yes, they implement identical thresholds, load patterns, and validation logic.

**Q: Can I still run K6 tests?**
A: Yes, but they are deprecated. Please switch to Jest tests.

**Q: Are there any functional differences?**
A: No, the Jest tests replicate K6 functionality exactly while providing better developer experience.

**Q: What about CI/CD?**
A: New Jest workflows replace the K6 workflows with equivalent functionality.

**Q: When will K6 be removed?**
A: K6 will be removed in a future release after the transition period is complete.

---

**For the latest performance testing documentation, see:**
`services/121-service/test/performance/README.md`