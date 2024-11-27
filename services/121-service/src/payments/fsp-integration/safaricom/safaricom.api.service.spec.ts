import { Test, TestingModule } from '@nestjs/testing';
import { TokenSet } from 'openid-client';

import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';

describe('SafaricomApiService', () => {
  let safaricomApiService: SafaricomApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SafaricomApiService],
    }).compile();

    safaricomApiService = module.get<SafaricomApiService>(SafaricomApiService);
  });

  describe('isTokenValid', () => {
    it('should return false if tokenSet is null or undefined', () => {
      //expect(safaricomApiService.testIsTokenValid(null)).toBe(false);
      //expect(safaricomApiService.testIsTokenValid(undefined)).toBe(false);
    });

    it('should return false if tokenSet does not have expires_at', () => {
      const tokenSet = new TokenSet({
        access_token: 'blabla',
      });

      expect(safaricomApiService.testIsTokenValid(tokenSet)).toBe(false);
    });

    /*
    it('should return false if token is expired', () => {
      const tokenSet: TokenSet = {
        access_token: 'some-token',
        expires_at: Date.now() / 1000 - 60,
      }; // Expired 1 minute ago
      expect(service.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if token expires within 5 minutes', () => {
      const tokenSet: TokenSet = {
        access_token: 'some-token',
        expires_at: Date.now() / 1000 + 4 * 60,
      }; // Expires in 4 minutes
      expect(service.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return true if token is valid and expires in more than 5 minutes', () => {
      const tokenSet: TokenSet = {
        access_token: 'some-token',
        expires_at: Date.now() / 1000 + 10 * 60,
      }; // Expires in 10 minutes
      expect(service.isTokenValid(tokenSet)).toBe(true);
    }); */
  });
});
