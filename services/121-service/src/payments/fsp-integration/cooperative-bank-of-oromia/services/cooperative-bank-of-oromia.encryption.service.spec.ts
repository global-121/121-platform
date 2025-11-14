import { Test, TestingModule } from '@nestjs/testing';

import { CooperativeBankOfOromiaEncryptionService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.encryption.service';

describe('CooperativeBankOfOromiaEncryptionService', () => {
  let service: CooperativeBankOfOromiaEncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CooperativeBankOfOromiaEncryptionService],
    }).compile();

    service = module.get<CooperativeBankOfOromiaEncryptionService>(CooperativeBankOfOromiaEncryptionService);
  });

  it('encryptPinV1 should encrypt data using the provided public key', () => {
    const data = '1234';
    const base64PublicKey =
      'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCWXm5N37HBNvFfeBnHWA4+OjrJWlyvUk2tXclAUX4uaYFLFGaTBlPZKOpT967xhBH2LXz/edP3j78goDkkFYQ93HekilQxgQcrE6IEESzkwBghHV4BA8VqnMSde4kHn+ZKjfSS9d5FEeXvj8axe2yHhYenkx8l01cxIpX0p1UpnQIDAQAB';
    const result = service.encryptPinV1(data, base64PublicKey);

    expect(typeof result).toBe('string');
    expect(result.length).toBe(172);
    // Whether it's base64 encoded
    expect(() => {
      Buffer.from(result, 'base64');
    }).not.toThrow();
  });
});
