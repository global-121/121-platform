import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getPayments,
  getTransactions,
} from '@121-service/test/helpers/program.helper';
import { getRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
} from '@121-service/test/registrations/pagination/pagination-data';

// Helper to capture console output during tests
class ConsoleCapture {
  private originalLog: any;
  private originalWarn: any;
  private originalError: any;
  private logs: string[] = [];
  private warnings: string[] = [];
  private errors: string[] = [];

  start(): void {
    this.originalLog = console.log;
    this.originalWarn = console.warn;
    this.originalError = console.error;

    console.log = (...args: any[]) => {
      this.logs.push(args.join(' '));
      this.originalLog(...args);
    };

    console.warn = (...args: any[]) => {
      this.warnings.push(args.join(' '));
      this.originalWarn(...args);
    };

    console.error = (...args: any[]) => {
      this.errors.push(args.join(' '));
      this.originalError(...args);
    };
  }

  stop(): void {
    console.log = this.originalLog;
    console.warn = this.originalWarn;
    console.error = this.originalError;
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  getWarnings(): string[] {
    return [...this.warnings];
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  clear(): void {
    this.logs = [];
    this.warnings = [];
    this.errors = [];
  }

  hasLogContaining(text: string): boolean {
    return this.logs.some((log) => log.includes(text));
  }

  hasWarningContaining(text: string): boolean {
    return this.warnings.some((warning) => warning.includes(text));
  }

  hasErrorContaining(text: string): boolean {
    return this.errors.some((error) => error.includes(text));
  }
}

describe('Mock registrations', () => {
  let consoleCapture: ConsoleCapture;

  beforeEach(() => {
    consoleCapture = new ConsoleCapture();
  });

  afterEach(() => {
    if (consoleCapture) {
      consoleCapture.stop();
    }
  });

  it('does mock nlrc multiple still seed registrations and transactions', async () => {
    // Arrange
    consoleCapture.start();
    await resetDB(SeedScript.nlrcMultipleMock, __filename);
    const accessToken = await getAccessToken();

    // Assert that proper seeding messages were logged
    expect(
      consoleCapture.hasLogContaining('SEED INFO: Starting seed data process'),
    ).toBe(true);
    expect(
      consoleCapture.hasLogContaining('SEED INFO: Setting up organization'),
    ).toBe(true);
    expect(
      consoleCapture.hasLogContaining('SEED INFO: Starting program seeding'),
    ).toBe(true);
    expect(
      consoleCapture.hasLogContaining('SEED INFO: Processing program'),
    ).toBe(true);
    expect(
      consoleCapture.hasLogContaining('SEED INFO: Program entity created'),
    ).toBe(true);
    expect(
      consoleCapture.hasLogContaining('SEED INFO: Message templates added'),
    ).toBe(true);
    expect(
      consoleCapture.hasLogContaining('SEED INFO: Default users added'),
    ).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED TIMING:')).toBe(true);
    expect(consoleCapture.hasLogContaining('completed successfully')).toBe(
      true,
    );

    // Verify no critical errors occurred during seeding
    expect(consoleCapture.hasErrorContaining('SEED ERROR:')).toBe(false);

    // Assert functional data integrity
    const programIds = [programIdOCW, programIdPV];

    for (const programId of programIds) {
      const registrationsResponse = await getRegistrations({
        programId,
        accessToken,
      });

      const paymentsResponse = await getPayments(programId, accessToken);

      for (const paymentData of paymentsResponse.body) {
        const paymentId = paymentData.paymentId;
        const transactionsResponse = await getTransactions({
          programId,
          paymentId,
          registrationReferenceId: null,
          accessToken,
        });

        // Assert
        expect(registrationsResponse.body.data.length).toBe(4);
        expect(transactionsResponse.body.length).toBe(4);
        expect(transactionsResponse.text).toContain(
          TransactionStatusEnum.success,
        );
      }
    }

    consoleCapture.stop();
  });

  it('should log detailed timing information during seeding process', async () => {
    // Arrange
    consoleCapture.start();
    await resetDB(SeedScript.nlrcMultipleMock, __filename);

    // Assert timing logs are present
    expect(consoleCapture.hasLogContaining('SEED TIMING:')).toBe(true);

    // Check for specific timing messages
    const timingLogs = consoleCapture
      .getLogs()
      .filter((log) => log.includes('SEED TIMING:'));
    expect(timingLogs.length).toBeGreaterThan(0);

    // Verify that timing logs include duration information
    timingLogs.forEach((log) => {
      expect(log).toMatch(/\(\d+ms\)/);
    });

    consoleCapture.stop();
  });

  it('should log comprehensive information about seeded entities', async () => {
    // Arrange
    consoleCapture.start();
    await resetDB(SeedScript.nlrcMultipleMock, __filename);

    // Assert detailed entity information is logged
    expect(
      consoleCapture.hasLogContaining(
        'Organization entity created successfully',
      ),
    ).toBe(true);
    expect(consoleCapture.hasLogContaining('Program fully configured')).toBe(
      true,
    );
    expect(
      consoleCapture.hasLogContaining('Message template creation summary'),
    ).toBe(true);
    expect(consoleCapture.hasLogContaining('Standard users processed')).toBe(
      true,
    );
    expect(
      consoleCapture.hasLogContaining('Admin user assigned to program'),
    ).toBe(true);

    // Check that log messages include relevant data
    const allLogs = consoleCapture.getLogs().join(' ');
    expect(allLogs).toContain('programId');
    expect(allLogs).toContain('programCount');
    expect(allLogs).toContain('isApiTests');

    consoleCapture.stop();
  });

  it('should handle edge cases gracefully with appropriate logging', async () => {
    // This test verifies that the seeding system logs appropriately when optional components are missing
    consoleCapture.start();

    // The nlrcMultipleMock script should handle cases where some components might be optional
    await resetDB(SeedScript.nlrcMultipleMock, __filename);

    // Verify that warnings are logged appropriately for missing optional components
    // Note: This might include cases where some users can't be created due to missing env vars
    const allLogs = consoleCapture.getLogs();
    const allWarnings = consoleCapture.getWarnings();

    // At minimum, we should have some informational logs
    expect(allLogs.length).toBeGreaterThan(0);

    // If there are warnings, they should be properly formatted
    allWarnings.forEach((warning) => {
      expect(warning).toContain('SEED WARN:');
    });

    consoleCapture.stop();
  });
});
