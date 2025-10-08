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
    return this.logs.some(log => log.includes(text));
  }

  hasWarningContaining(text: string): boolean {
    return this.warnings.some(warning => warning.includes(text));
  }

  hasErrorContaining(text: string): boolean {
    return this.errors.some(error => error.includes(text));
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
    expect(consoleCapture.hasLogContaining('SEED INFO: DB reset initiated')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Using type-safe factory approach')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Starting NLRC mock data seeding')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Data multiplication parameters validated')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Base seed data completed')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Starting type-safe factory data multiplication')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED TIMING: Type-safe factory data multiplication completed')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED TIMING: NLRC mock data seeding completed successfully')).toBe(true);

    // Assert that individual mock data operations were logged
    expect(consoleCapture.hasLogContaining('SEED INFO: Multiplying registrations and related payment data')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Multiplying transactions')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Multiplying messages')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Updating sequence numbers')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Introducing duplicates')).toBe(true);

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

  it('should log detailed timing information during mock data seeding process', async () => {
    // Arrange
    consoleCapture.start();
    await resetDB(SeedScript.nlrcMultipleMock, __filename);

    // Assert timing logs are present
    expect(consoleCapture.hasLogContaining('SEED TIMING:')).toBe(true);
    
    // Check for specific timing messages
    const timingLogs = consoleCapture.getLogs().filter(log => log.includes('SEED TIMING:'));
    expect(timingLogs.length).toBeGreaterThan(0);
    
    // Verify that timing logs include duration information
    timingLogs.forEach(log => {
      expect(log).toMatch(/\(\d+ms\)/);
    });

    consoleCapture.stop();
  });

  it('should log comprehensive information about seeded programs and registrations', async () => {
    // Arrange
    consoleCapture.start();
    await resetDB(SeedScript.nlrcMultipleMock, __filename);

    // Assert detailed program seeding information is logged
    expect(consoleCapture.hasLogContaining('SEED INFO: Seeding OCW program registration')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Seeding PV program registration')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Registration imported successfully')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Registration status changed to included')).toBe(true);
    expect(consoleCapture.hasLogContaining('SEED INFO: Payment processed for registration')).toBe(true);

    // Check that log messages include relevant data
    const allLogs = consoleCapture.getLogs().join(' ');
    expect(allLogs).toContain('programId');
    expect(allLogs).toContain('powerNrRegistrations');
    expect(allLogs).toContain('nrPayments');
    expect(allLogs).toContain('powerNrMessages');

    consoleCapture.stop();
  });
});
