import { env } from '@121-service/src/env';
import { MtnMockReferenceId } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-mock-reference-id.enum';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { generateUUIDFromSeed } from '@121-service/src/utils/uuid.helpers';

jest.mock('@121-service/src/env', () => ({
  env: {
    MTN_MODE: 'MOCK',
  },
}));

jest.mock('@121-service/src/ormconfig', () => ({
  ormConfig: {},
}));

jest.mock('@121-service/src/appdatasource', () => ({
  AppDataSource: {},
}));

jest.mock('@121-service/src/utils/uuid.helpers', () => ({
  generateUUIDFromSeed: jest.fn().mockReturnValue('seeded-uuid'),
}));

describe('MtnService', () => {
  let mtnService: MtnService;

  beforeEach(() => {
    mtnService = new MtnService(jest.fn() as any);
  });

  describe('generateMtnReferenceId', () => {
    it('should return seeded UUID when not in mock mode', () => {
      (env as any).MTN_MODE = FspMode.external;

      const result = mtnService.generateMtnReferenceId({
        referenceId: 'some-ref',
        transactionId: 1,
        failedTransactionAttempts: 0,
      });

      expect(result).toBe('seeded-uuid');
      expect(generateUUIDFromSeed).toHaveBeenCalledWith(
        'ReferenceId=some-ref,TransactionId=1,Attempt=0',
      );
    });

    it('should return seeded UUID when in mock mode with a non-mock referenceId', () => {
      (env as any).MTN_MODE = FspMode.mock;

      const result = mtnService.generateMtnReferenceId({
        referenceId: 'regular-reference-id',
        transactionId: 1,
        failedTransactionAttempts: 0,
      });

      expect(result).toBe('seeded-uuid');
    });

    it('should pass through MtnMockReferenceId.failPayeeNotFound in mock mode', () => {
      (env as any).MTN_MODE = FspMode.mock;

      const result = mtnService.generateMtnReferenceId({
        referenceId: MtnMockReferenceId.failPayeeNotFound,
        transactionId: 1,
        failedTransactionAttempts: 0,
      });

      expect(result).toBe(MtnMockReferenceId.failPayeeNotFound);
    });

    it('should pass through MtnMockReferenceId.notFound in mock mode', () => {
      (env as any).MTN_MODE = FspMode.mock;

      const result = mtnService.generateMtnReferenceId({
        referenceId: MtnMockReferenceId.notFound,
        transactionId: 1,
        failedTransactionAttempts: 0,
      });

      expect(result).toBe(MtnMockReferenceId.notFound);
    });

    it('should not pass through mock referenceIds in external mode', () => {
      (env as any).MTN_MODE = FspMode.external;

      const result = mtnService.generateMtnReferenceId({
        referenceId: MtnMockReferenceId.failPayeeNotFound,
        transactionId: 1,
        failedTransactionAttempts: 0,
      });

      expect(result).toBe('seeded-uuid');
    });
  });
});
