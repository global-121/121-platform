# Jest Performance Tests

This directory contains performance tests migrated from K6 to Jest, providing comprehensive load and stress testing for the 121 Platform.

## Overview

The performance tests validate the system's behavior under load, ensuring that critical operations maintain acceptable response times and error rates even with large datasets and high concurrency.

### Migrated Tests

All 9 K6 performance tests have been successfully migrated to Jest:

1. **Import 1000 Registrations** (`import-1000-registrations.test.ts`)
   - Tests CSV import performance with 1000 registrations
   - Validates import duration and success rates

2. **Payment 100k+ Registrations - Safaricom** (`payment-100k-safaricom.test.ts`) 
   - Tests payment processing with 100k+ registrations using Safaricom FSP
   - Monitors payment completion rates and duration

3. **Payment 100k+ Registrations - Intersolve Visa** (`payment-100k-intersolve-visa.test.ts`)
   - Tests payment processing with 100k+ registrations using Intersolve Visa FSP
   - Most complex payment flow with extensive API calls

4. **Performance During Payment** (`performance-during-payment.test.ts`)
   - Tests API responsiveness while payments are being processed
   - Validates export and messaging endpoints under load

5. **Bulk Update 32k+ Registrations** (`bulk-update-32k-registrations.test.ts`)
   - Tests bulk CSV update operations on large datasets
   - Validates update performance and data integrity

6. **Find Duplicates 100k+ Registrations** (`find-duplicates-100k-registrations.test.ts`)
   - Tests duplicate detection algorithms on large datasets
   - Validates query performance with complex filters

7. **Get Program Many Attributes** (`get-program-many-attributes.test.ts`)
   - Tests program loading performance with many custom attributes
   - Validates UI responsiveness with complex data structures

8. **Retry Failed Jobs Startup** (`retry-failed-jobs-startup.test.ts`)
   - Tests job queue resilience and retry mechanisms
   - Simulates service restarts during payment processing

9. **Status Change Payment Large Program** (`status-change-payment-large-program.test.ts`)
   - Tests status update operations in programs with many registrations
   - Combines multiple performance-critical operations

## Configuration

### Jest Configuration

Performance tests use a dedicated Jest configuration (`jest.performance.config.js`) with:
- Extended timeouts (10 minutes default, up to 90 minutes for heavy tests)
- Sequential execution (`maxWorkers: 1`) to avoid resource conflicts
- Custom setup file for performance utilities

### Environment Variables

Tests support the same environment variables as the original K6 tests:

- `DUPLICATE_NUMBER`: Controls the number of duplicate registrations (powers of 2)
  - `5` = 32 registrations (default for quick tests)
  - `15` = 32,768 registrations (moderate load)
  - `17` = 131,072 registrations (heavy load)

## Running Tests

### Individual Tests

```bash
# Import performance test
npm run test:performance:import

# Payment tests
npm run test:performance:payment-safaricom
npm run test:performance:payment-visa

# Bulk operations
npm run test:performance:bulk-update
npm run test:performance:find-duplicates

# System stress tests
npm run test:performance:during-payment
npm run test:performance:status-change
npm run test:performance:many-attributes
npm run test:performance:retry-jobs
```

### All Tests

```bash
# Run all performance tests
npm run test:performance:all

# Watch mode for development
npm run test:performance:watch
```

### With Custom Load

```bash
# Run with specific duplicate numbers
DUPLICATE_NUMBER=10 npm run test:performance:bulk-update
DUPLICATE_NUMBER=17 npm run test:performance:find-duplicates
```

## Performance Thresholds

Tests enforce the same performance thresholds as the original K6 tests:

- **HTTP Error Rate**: < 1% for most tests, < 4% for complex workflows, < 60% for restart tests
- **Response Times**: Login < 200ms, Program loading < 200ms, Bulk operations < 15s
- **Pass Rates**: Payment completion rates 10-100% depending on test scenario
- **Duration Limits**: Individual tests 30s to 90 minutes based on complexity

## Helper Utilities

### PerformanceTestHelper

Core utility for metrics collection and threshold validation:
- Records response times and success rates
- Validates HTTP error rates and performance thresholds
- Provides comprehensive test statistics

### PaymentPerformanceHelper

Specialized utility for payment workflow testing:
- Payment creation and monitoring
- Status update operations with retry logic
- Registration import and bulk operations

### Configuration Helpers

Environment and configuration management:
- Environment variable parsing
- Test configuration defaults
- Service health checking

## CI/CD Integration

### Fast Tests (PR Validation)

The `test_performance_jest.yml` workflow runs on every PR with reduced load:
- `DUPLICATE_NUMBER=3` for most tests (8 registrations)
- `DUPLICATE_NUMBER=7` for restart tests (128 registrations)
- `DUPLICATE_NUMBER=16` for duplicate tests (65k registrations)

### Overnight Tests (Full Load)

The `test_performance_jest_cronjob.yml` workflow runs nightly with full load:
- Original K6 duplicate numbers for maximum stress testing
- Sequential execution of all test suites
- Extended timeouts for heavy operations

## Differences from K6

### Advantages

1. **Type Safety**: Full TypeScript support with compile-time error checking
2. **Better IDE Support**: IntelliSense, debugging, and refactoring tools
3. **Unified Testing**: Same framework as unit and integration tests
4. **Rich Assertions**: Jest's powerful assertion library
5. **Better Error Reporting**: Detailed stack traces and test failure information

### Equivalent Features

1. **Performance Metrics**: Same thresholds and measurement capabilities
2. **Load Generation**: Equivalent stress testing with large datasets
3. **Timing Validation**: Same response time and duration checks
4. **Error Rate Monitoring**: Identical HTTP error rate thresholds
5. **Workflow Automation**: Same complex multi-step test scenarios

### Migration Notes

- All K6 `check()` functions replaced with Jest `expect()` assertions
- K6 `sleep()` replaced with Promise-based `waitFor()` utility
- K6 metrics counters replaced with performance helper statistics
- K6 environment variables (`__ENV`) mapped to Node.js `process.env`
- K6 HTTP client replaced with supertest for consistent API testing

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase Jest timeout or reduce `DUPLICATE_NUMBER`
2. **Memory Issues**: Run tests sequentially, avoid concurrent execution
3. **Service Startup**: Ensure Docker services are healthy before running tests
4. **Database State**: Tests include proper cleanup and reset mechanisms

### Debugging

```bash
# Run with verbose output
npm run test:performance:all -- --verbose

# Debug specific test
npm run test:performance:import -- --detectOpenHandles

# Check service health
curl http://localhost:3000/api/health/health
```

## Future Enhancements

1. **Parallel Execution**: Optimize tests for safe concurrent execution
2. **Metrics Collection**: Enhanced performance metrics and reporting
3. **Load Profiles**: Configurable load patterns for different scenarios
4. **Cloud Testing**: Integration with cloud-based load testing services
5. **Performance Regression**: Automated detection of performance degradations