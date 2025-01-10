import { Test, TestingModule } from '@nestjs/testing';
import { TokenSet } from 'openid-client';

import { TokenValidationService as TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

describe('TokenValidationService', () => {
  let tokenValidationService: TokenValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenValidationService],
    }).compile();

    tokenValidationService = module.get<TokenValidationService>(
      TokenValidationService,
    );
  });

  describe('isTokenValid', () => {
    it('should return false if tokenSet is not filled', () => {
      const tokenSet = new TokenSet();

      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if tokenSet does not have expires_at', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
      });

      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if token is expired', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: Date.now() - 1 * 60 * 1000,
      }); // Expired 1 minute ago
      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if token expires in less than 5 minutes', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: Date.now() + 4 * 60 * 1000,
      }); // Expires in 4 minutes
      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return true if token is valid and expires in more than 5 minutes', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: Date.now() + 10 * 60 * 1000,
      }); // Expires in 10 minutes
      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(true);
    });
  });
});
