import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { InstanceReportingDataMapper } from '@121-service/src/instance-reporting/mappers/instance-reporting-data.mapper';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

describe('InstanceReportingDataMapper', () => {
  describe('mapping a registration to a DTO', () => {
    function createRegistrationRaw({
      programId = 1,
      titlePortal = { en: 'Test' },
      status = RegistrationStatusEnum.included,
    }: {
      programId?: number;
      titlePortal?: Record<string, string> | null;
      status?: RegistrationStatusEnum;
    } = {}) {
      return {
        id: 1,
        referenceId: 'ref-1',
        registrationStatus: status,
        created: new Date('2026-01-10T08:00:00Z'),
        preferredLanguage: RegistrationPreferredLanguage.en,
        programFspConfiguration: { fspName: Fsps.safaricom },
        paymentAmountMultiplier: 1,
        maxPayments: 3,
        program: { id: programId, titlePortal },
      };
    }

    it('should fall back to "Program {id}" when titlePortal is null', () => {
      const result = InstanceReportingDataMapper.mapRegistration({
        registration: createRegistrationRaw({
          programId: 7,
          titlePortal: null,
        }),
        instance: 'test-instance',
        uploadDate: '2026-04-20',
      });

      expect(result.programTitle).toBe('Program 7');
    });

    it('should map all registration fields correctly', () => {
      const result = InstanceReportingDataMapper.mapRegistration({
        registration: createRegistrationRaw({
          programId: 1,
          titlePortal: { en: 'Test' },
          status: RegistrationStatusEnum.included,
        }),
        instance: 'test-instance',
        uploadDate: '2026-04-20',
      });

      expect(result).toMatchObject({
        instance: 'test-instance',
        programTitle: 'Test',
        programId: 1,
        status: RegistrationStatusEnum.included,
        referenceId: 'ref-1',
        createdDate: '2026-01-10T08:00:00.000Z',
        preferredLanguage: RegistrationPreferredLanguage.en,
        fspName: Fsps.safaricom,
        paymentAmountMultiplier: 1,
        maxPayments: 3,
        uploadDate: '2026-04-20',
      });
      expect(result).toHaveProperty('version');
    });
  });

  describe('mapping a transaction to a DTO', () => {
    function createTransactionRaw({
      titlePortal = { en: 'Test' },
    }: {
      titlePortal?: Record<string, string> | null;
    } = {}) {
      return {
        id: 42,
        status: TransactionStatusEnum.success,
        transferValue: 500,
        created: new Date('2026-01-15T10:00:00Z'),
        updated: new Date('2026-01-15T12:00:00Z'),
        transactionEvents: [
          { id: 1, created: new Date('2026-01-15T11:00:00Z') },
        ],
        registration: {
          id: 1,
          referenceId: 'REF-001',
          program: {
            id: 1,
            currency: CurrencyCode.ETB,
            titlePortal,
          },
        },
      };
    }

    it('should map all transaction fields correctly', () => {
      const result = InstanceReportingDataMapper.mapTransaction({
        transaction: createTransactionRaw(),
        instance: 'test-instance',
        amountEuro: 100,
        uploadDate: '2026-04-20',
      });

      expect(result).toMatchObject({
        instance: 'test-instance',
        id: 42,
        status: TransactionStatusEnum.success,
        amount: 500,
        amountEuro: 100,
        localCurrency: 'ETB',
        createdDate: '2026-01-15T10:00:00.000Z',
        startedDate: '2026-01-15T11:00:00.000Z',
        updatedDate: '2026-01-15T12:00:00.000Z',
        registrationReferenceId: 'REF-001',
        programId: 1,
        programTitle: 'Test',
        uploadDate: '2026-04-20',
      });
      expect(result).toHaveProperty('version');
    });

    it('should map startedDate to null when there is no started event', () => {
      const transaction = createTransactionRaw();
      transaction.transactionEvents = [];

      const result = InstanceReportingDataMapper.mapTransaction({
        transaction,
        instance: 'test-instance',
        amountEuro: 100,
        uploadDate: '2026-04-20',
      });

      expect(result.startedDate).toBeNull();
    });

    it('should pass through null amountEuro', () => {
      const result = InstanceReportingDataMapper.mapTransaction({
        transaction: createTransactionRaw(),
        instance: 'test-instance',
        amountEuro: null,
        uploadDate: '2026-04-20',
      });

      expect(result.amountEuro).toBeNull();
    });

    it('should fall back to "Program {id}" when titlePortal is null', () => {
      const result = InstanceReportingDataMapper.mapTransaction({
        transaction: createTransactionRaw({ titlePortal: null }),
        instance: 'test-instance',
        amountEuro: 100,
        uploadDate: '2026-04-20',
      });

      expect(result.programTitle).toBe('Program 1');
    });
  });
});
