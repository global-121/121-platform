import {
  createTokenSet,
  isTokenValid,
} from '@121-service/src/utils/token/token.helpers';

describe('token helpers', () => {
  describe('createTokenSet', () => {
    it('should create a token set with accessToken and expiresAt', () => {
      const expiresAt = Date.now() + 60_000;
      const tokenSet = createTokenSet({
        accessToken: 'test-token',
        expiresAt,
      });

      expect(tokenSet.accessToken).toBe('test-token');
      expect(tokenSet.expiresAt).toBe(expiresAt);
    });

    it('should convert expiresIn (seconds) to expiresAt (milliseconds)', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const tokenSet = createTokenSet({
        accessToken: 'test-token',
        expiresIn: 3600,
      });

      expect(tokenSet.expiresAt).toBe(now + 3600 * 1000);

      jest.restoreAllMocks();
    });

    it('should prefer expiresAt over expiresIn when both are provided', () => {
      const expiresAt = Date.now() + 120_000;
      const tokenSet = createTokenSet({
        accessToken: 'test-token',
        expiresAt,
        expiresIn: 3600,
      });

      expect(tokenSet.expiresAt).toBe(expiresAt);
    });
  });

  describe('isTokenValid', () => {
    it('should return false if tokenSet is undefined', () => {
      expect(isTokenValid(undefined)).toBe(false);
    });

    it('should return false if token is expired', () => {
      const tokenSet = createTokenSet({
        accessToken: 'some-token',
        expiresAt: Date.now() - 1 * 60 * 1000,
      });
      expect(isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if token expires in less than 5 minutes', () => {
      const tokenSet = createTokenSet({
        accessToken: 'some-token',
        expiresAt: Date.now() + 4 * 60 * 1000,
      });
      expect(isTokenValid(tokenSet)).toBe(false);
    });

    it('should return true if token is valid and expires in more than 5 minutes', () => {
      const tokenSet = createTokenSet({
        accessToken: 'some-token',
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      expect(isTokenValid(tokenSet)).toBe(true);
    });
  });
});
