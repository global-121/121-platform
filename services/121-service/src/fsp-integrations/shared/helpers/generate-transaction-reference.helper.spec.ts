import { generateTransactionReference } from '@121-service/src/fsp-integrations/shared/helpers/generate-transaction-reference.helper';

jest.mock('@121-service/src/utils/uuid.helpers', () => ({
  generateUUIDFromSeed: jest.fn().mockReturnValue('seeded-uuid'),
}));

describe('generateTransactionReference', () => {
  it('should seed the UUID with referenceId, transactionId and attempts', () => {
    const result = generateTransactionReference({
      referenceId: 'some-ref',
      transactionId: 1,
      failedTransactionAttempts: 0,
    });

    expect(result).toBe('seeded-uuid');
  });
});
