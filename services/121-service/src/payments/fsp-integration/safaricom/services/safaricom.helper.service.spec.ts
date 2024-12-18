import { Test, TestingModule } from '@nestjs/testing';
import { TokenSet } from 'openid-client';

import { SafaricomHelperService } from '@121-service/src/payments/fsp-integration/safaricom/services/safaricom.helper.service';

describe('SafaricomHelperService', () => {
  let safaricomHelperService: SafaricomHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SafaricomHelperService],
    }).compile();

    safaricomHelperService = module.get<SafaricomHelperService>(
      SafaricomHelperService,
    );
  });

  describe('isTokenValid', () => {
    it('should return false if tokenSet does not have expires_at', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
      });

      expect(safaricomHelperService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if token is expired', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: Date.now() - 1 * 60 * 1000,
      }); // Expired 1 minute ago
      expect(safaricomHelperService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if token expires in less than 5 minutes', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: Date.now() + 4 * 60 * 1000,
      }); // Expires in 4 minutes
      expect(safaricomHelperService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return true if token is valid and expires in more than 5 minutes', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: Date.now() + 10 * 60 * 1000,
      }); // Expires in 10 minutes
      expect(safaricomHelperService.isTokenValid(tokenSet)).toBe(true);
    });
  });
});
